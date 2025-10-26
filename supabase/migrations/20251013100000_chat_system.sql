-- ============================================================================
-- MIGRACIÓN: Sistema de Chat/Mensajería
-- Fecha: 2025-10-13
-- Versión: 1.0
-- Descripción: Implementa chat 1:1 y grupos para plataforma web
-- ============================================================================

-- Autor: Sistema Gestabiz
-- Alcance: Solo web (no móvil por ahora)
-- Dependencias: profiles, businesses

BEGIN;

-- ============================================================================
-- PARTE 1: TIPOS ENUM
-- ============================================================================

-- Tipo de conversación
DO $$ BEGIN
  CREATE TYPE conversation_type AS ENUM ('direct', 'group');
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'El tipo conversation_type ya existe, omitiendo creación';
END $$;

-- Rol en conversación
DO $$ BEGIN
  CREATE TYPE conversation_role AS ENUM ('member', 'admin');
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'El tipo conversation_role ya existe, omitiendo creación';
END $$;

-- Tipo de mensaje
DO $$ BEGIN
  CREATE TYPE message_type AS ENUM ('text', 'image', 'file', 'system');
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'El tipo message_type ya existe, omitiendo creación';
END $$;

-- ============================================================================
-- PARTE 2: TABLA conversations
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Contexto de negocio
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  type conversation_type NOT NULL,
  
  -- Metadata (principalmente para grupos)
  name TEXT, -- NULL para conversaciones directas
  description TEXT,
  avatar_url TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  
  -- Estado
  is_archived BOOLEAN DEFAULT FALSE NOT NULL,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT, -- Últimos 100 chars del último mensaje
  
  -- Scope flexible (JSONB para futura expansión)
  -- Ejemplos: {"location_id": "uuid"}, {"service_id": "uuid"}, {"role": "employee"}
  scope JSONB DEFAULT '{}'::JSONB NOT NULL,
  
  CONSTRAINT valid_group_has_name CHECK (
    type = 'direct' OR (type = 'group' AND name IS NOT NULL)
  )
);

-- Índices para conversations
CREATE INDEX IF NOT EXISTS idx_conversations_business_updated 
ON public.conversations(business_id, last_message_at DESC NULLS LAST) 
WHERE is_archived = FALSE;

CREATE INDEX IF NOT EXISTS idx_conversations_created_by 
ON public.conversations(created_by);

CREATE INDEX IF NOT EXISTS idx_conversations_type 
ON public.conversations(type, business_id);

-- Trigger para updated_at
CREATE OR REPLACE TRIGGER update_conversations_updated_at 
BEFORE UPDATE ON public.conversations 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PARTE 3: TABLA conversation_members
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.conversation_members (
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Metadata de membresía
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  role conversation_role DEFAULT 'member' NOT NULL,
  
  -- Configuración personal
  muted BOOLEAN DEFAULT FALSE NOT NULL,
  notifications_enabled BOOLEAN DEFAULT TRUE NOT NULL,
  custom_name TEXT, -- Alias personalizado del chat
  
  -- Tracking de actividad
  last_read_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  unread_count INTEGER DEFAULT 0 NOT NULL,
  
  PRIMARY KEY (conversation_id, user_id)
);

-- Índices para conversation_members
CREATE INDEX IF NOT EXISTS idx_conv_members_user 
ON public.conversation_members(user_id, last_read_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_conv_members_conversation 
ON public.conversation_members(conversation_id, role);

CREATE INDEX IF NOT EXISTS idx_conv_members_unread 
ON public.conversation_members(user_id, unread_count) 
WHERE unread_count > 0;

-- ============================================================================
-- PARTE 4: TABLA messages
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  edited_at TIMESTAMPTZ,
  
  -- Relaciones
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Contenido
  type message_type DEFAULT 'text' NOT NULL,
  body TEXT,
  metadata JSONB DEFAULT '{}'::JSONB NOT NULL,
  -- metadata puede contener: {file_url, file_name, file_size, file_type, image_url, image_width, image_height}
  
  -- Features avanzadas
  reply_to UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  is_pinned BOOLEAN DEFAULT FALSE NOT NULL,
  pinned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  pinned_at TIMESTAMPTZ,
  
  -- Soft delete
  is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
  deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT message_has_content CHECK (
    body IS NOT NULL OR (metadata->>'file_url') IS NOT NULL OR (metadata->>'image_url') IS NOT NULL
  )
);

-- Índices para messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
ON public.messages(conversation_id, created_at DESC) 
WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_messages_sender 
ON public.messages(sender_id, created_at DESC) 
WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_messages_reply_to 
ON public.messages(reply_to) 
WHERE reply_to IS NOT NULL AND is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_messages_pinned 
ON public.messages(conversation_id, pinned_at DESC NULLS LAST) 
WHERE is_pinned = TRUE AND is_deleted = FALSE;

-- Trigger para updated_at
CREATE OR REPLACE TRIGGER update_messages_updated_at 
BEFORE UPDATE ON public.messages 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PARTE 5: FUNCIONES HELPER
-- ============================================================================

-- Función helper: Verificar si usuario es miembro de conversación
CREATE OR REPLACE FUNCTION is_conversation_member(conv_id UUID, uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_id = conv_id AND user_id = uid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Función: Crear conversación directa (idempotente)
CREATE OR REPLACE FUNCTION create_direct_conversation(
  p_business_id UUID,
  p_user_a UUID,
  p_user_b UUID
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
  v_member_count INTEGER;
BEGIN
  -- Validar que ambos usuarios existen
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_a) THEN
    RAISE EXCEPTION 'User A does not exist';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_b) THEN
    RAISE EXCEPTION 'User B does not exist';
  END IF;

  -- Buscar conversación directa existente entre estos dos usuarios
  SELECT c.id INTO v_conversation_id
  FROM public.conversations c
  WHERE c.business_id = p_business_id
    AND c.type = 'direct'
    AND c.is_archived = FALSE
    AND (
      SELECT COUNT(*) FROM public.conversation_members cm
      WHERE cm.conversation_id = c.id
    ) = 2
    AND EXISTS (
      SELECT 1 FROM public.conversation_members cm1
      WHERE cm1.conversation_id = c.id AND cm1.user_id = p_user_a
    )
    AND EXISTS (
      SELECT 1 FROM public.conversation_members cm2
      WHERE cm2.conversation_id = c.id AND cm2.user_id = p_user_b
    )
  LIMIT 1;

  -- Si no existe, crear nueva conversación
  IF v_conversation_id IS NULL THEN
    INSERT INTO public.conversations (business_id, type, created_by)
    VALUES (p_business_id, 'direct', p_user_a)
    RETURNING id INTO v_conversation_id;

    -- Agregar ambos usuarios como miembros
    INSERT INTO public.conversation_members (conversation_id, user_id, role)
    VALUES 
      (v_conversation_id, p_user_a, 'member'),
      (v_conversation_id, p_user_b, 'member');
  END IF;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Marcar conversación como leída
CREATE OR REPLACE FUNCTION mark_conversation_read(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Actualizar last_read_at y resetear unread_count
  UPDATE public.conversation_members
  SET 
    last_read_at = NOW(),
    unread_count = 0
  WHERE conversation_id = p_conversation_id 
    AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Obtener contador de conversaciones no leídas
CREATE OR REPLACE FUNCTION get_unread_conversations_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.conversation_members
  WHERE user_id = p_user_id 
    AND unread_count > 0;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Función: Incrementar contador de no leídos
CREATE OR REPLACE FUNCTION increment_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Incrementar unread_count para todos los miembros excepto el sender
  UPDATE public.conversation_members
  SET unread_count = unread_count + 1
  WHERE conversation_id = NEW.conversation_id
    AND user_id != NEW.sender_id;

  -- Actualizar last_message_at y preview en conversations
  UPDATE public.conversations
  SET 
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.body, 100),
    updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Incrementar unread al crear mensaje
CREATE OR REPLACE TRIGGER increment_unread_on_message
AFTER INSERT ON public.messages
FOR EACH ROW
WHEN (NEW.is_deleted = FALSE AND NEW.type != 'system')
EXECUTE FUNCTION increment_unread_count();

-- ============================================================================
-- PARTE 6: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Políticas para conversations
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
CREATE POLICY "Users can view their conversations" 
ON public.conversations FOR SELECT
USING (is_conversation_member(id, auth.uid()));

DROP POLICY IF EXISTS "Users can create direct conversations" ON public.conversations;
CREATE POLICY "Users can create direct conversations" 
ON public.conversations FOR INSERT
WITH CHECK (type = 'direct' AND created_by = auth.uid());

DROP POLICY IF EXISTS "Admins can create groups in their business" ON public.conversations;
CREATE POLICY "Admins can create groups in their business" 
ON public.conversations FOR INSERT
WITH CHECK (
  type = 'group' 
  AND created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.businesses 
    WHERE id = business_id AND owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Conversation members can update settings" ON public.conversations;
CREATE POLICY "Conversation members can update settings" 
ON public.conversations FOR UPDATE
USING (is_conversation_member(id, auth.uid()))
WITH CHECK (is_conversation_member(id, auth.uid()));

-- Políticas para conversation_members
DROP POLICY IF EXISTS "Users can view members of their conversations" ON public.conversation_members;
CREATE POLICY "Users can view members of their conversations" 
ON public.conversation_members FOR SELECT
USING (is_conversation_member(conversation_id, auth.uid()));

DROP POLICY IF EXISTS "Users can update their own member settings" ON public.conversation_members;
CREATE POLICY "Users can update their own member settings" 
ON public.conversation_members FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Conversation admins can manage members" ON public.conversation_members;
CREATE POLICY "Conversation admins can manage members" 
ON public.conversation_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversation_members cm
    WHERE cm.conversation_id = conversation_id
      AND cm.user_id = auth.uid()
      AND cm.role = 'admin'
  )
);

-- Políticas para messages
DROP POLICY IF EXISTS "Members can view messages" ON public.messages;
CREATE POLICY "Members can view messages" 
ON public.messages FOR SELECT
USING (
  is_conversation_member(conversation_id, auth.uid())
  AND is_deleted = FALSE
);

DROP POLICY IF EXISTS "Members can send messages" ON public.messages;
CREATE POLICY "Members can send messages" 
ON public.messages FOR INSERT
WITH CHECK (
  is_conversation_member(conversation_id, auth.uid())
  AND sender_id = auth.uid()
);

DROP POLICY IF EXISTS "Senders can edit their messages" ON public.messages;
CREATE POLICY "Senders can edit their messages" 
ON public.messages FOR UPDATE
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS "Admins can delete any message" ON public.messages;
CREATE POLICY "Admins can delete any message" 
ON public.messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_members cm
    WHERE cm.conversation_id = conversation_id
      AND cm.user_id = auth.uid()
      AND cm.role = 'admin'
  )
)
WITH CHECK (is_deleted = TRUE);

-- ============================================================================
-- PARTE 7: GRANTS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.conversation_members TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;

COMMIT;

-- ============================================================================
-- VERIFICACIONES POST-MIGRACIÓN
-- ============================================================================

-- Verificar enums creados
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'conversation_type'::regtype;
-- Esperado: direct, group

SELECT enumlabel FROM pg_enum WHERE enumtypid = 'conversation_role'::regtype;
-- Esperado: member, admin

SELECT enumlabel FROM pg_enum WHERE enumtypid = 'message_type'::regtype;
-- Esperado: text, image, file, system

-- Verificar tablas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('conversations', 'conversation_members', 'messages');
-- Esperado: 3 filas

-- Verificar funciones
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'is_conversation_member',
  'create_direct_conversation',
  'mark_conversation_read',
  'get_unread_conversations_count'
);
-- Esperado: 4 filas

-- Verificar políticas RLS
SELECT tablename, policyname FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('conversations', 'conversation_members', 'messages');
-- Esperado: 10 políticas

-- ✅ Si todas las verificaciones pasan, la migración fue exitosa
