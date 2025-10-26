-- ============================================================================
-- SISTEMA DE CHAT COMPLETO
-- Migración para crear tablas, funciones RPC y políticas RLS
-- Fecha: 2025-10-15
-- ============================================================================

-- ============================================================================
-- 1. TABLAS
-- ============================================================================

-- Chat Conversations
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('direct', 'group')),
  title TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  last_message_preview TEXT,
  is_archived BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chat Participants
CREATE TABLE IF NOT EXISTS chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  left_at TIMESTAMPTZ,
  last_read_at TIMESTAMPTZ,
  last_read_message_id UUID,
  unread_count INTEGER DEFAULT 0,
  is_muted BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'file', 'system')),
  attachments JSONB,
  sent_at TIMESTAMPTZ DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  read_by JSONB DEFAULT '[]'::jsonb,
  reply_to_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chat Typing Indicators
CREATE TABLE IF NOT EXISTS chat_typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- ============================================================================
-- 2. ÍNDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_chat_conversations_business ON chat_conversations(business_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_created_by ON chat_conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_last_message ON chat_conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_participants_conversation ON chat_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user ON chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_active ON chat_participants(conversation_id, user_id) WHERE left_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sent_at ON chat_messages(sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_typing_expires ON chat_typing_indicators(expires_at);

-- ============================================================================
-- 3. FUNCIONES RPC
-- ============================================================================

-- Función: get_or_create_direct_conversation
CREATE OR REPLACE FUNCTION get_or_create_direct_conversation(
  p_user1_id UUID,
  p_user2_id UUID,
  p_business_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Buscar conversación existente entre los dos usuarios
  SELECT DISTINCT c.id INTO v_conversation_id
  FROM chat_conversations c
  INNER JOIN chat_participants p1 ON c.id = p1.conversation_id AND p1.user_id = p_user1_id
  INNER JOIN chat_participants p2 ON c.id = p2.conversation_id AND p2.user_id = p_user2_id
  WHERE c.type = 'direct'
    AND p1.left_at IS NULL
    AND p2.left_at IS NULL
    AND (p_business_id IS NULL OR c.business_id = p_business_id)
  LIMIT 1;

  -- Si no existe, crear nueva conversación
  IF v_conversation_id IS NULL THEN
    INSERT INTO chat_conversations (type, created_by, business_id)
    VALUES ('direct', p_user1_id, p_business_id)
    RETURNING id INTO v_conversation_id;

    -- Agregar ambos participantes
    INSERT INTO chat_participants (conversation_id, user_id)
    VALUES 
      (v_conversation_id, p_user1_id),
      (v_conversation_id, p_user2_id);
  END IF;

  RETURN v_conversation_id;
END;
$$;

-- Función: send_message
CREATE OR REPLACE FUNCTION send_message(
  p_conversation_id UUID,
  p_sender_id UUID,
  p_content TEXT,
  p_type TEXT DEFAULT 'text',
  p_attachments JSONB DEFAULT NULL,
  p_reply_to_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_message_id UUID;
BEGIN
  -- Insertar mensaje
  INSERT INTO chat_messages (
    conversation_id,
    sender_id,
    content,
    type,
    attachments,
    reply_to_id
  )
  VALUES (
    p_conversation_id,
    p_sender_id,
    p_content,
    p_type,
    p_attachments,
    p_reply_to_id
  )
  RETURNING id INTO v_message_id;

  -- Actualizar última mensaje en conversación
  UPDATE chat_conversations
  SET 
    last_message_at = now(),
    last_message_preview = CASE 
      WHEN p_type = 'text' THEN left(p_content, 100)
      WHEN p_type = 'image' THEN '📷 Imagen'
      WHEN p_type = 'file' THEN '📎 Archivo'
      ELSE '💬 Mensaje'
    END,
    updated_at = now()
  WHERE id = p_conversation_id;

  -- Incrementar contador de no leídos para otros participantes
  UPDATE chat_participants
  SET 
    unread_count = unread_count + 1,
    updated_at = now()
  WHERE conversation_id = p_conversation_id
    AND user_id != p_sender_id
    AND left_at IS NULL;

  RETURN v_message_id;
END;
$$;

-- Función: mark_messages_as_read
CREATE OR REPLACE FUNCTION mark_messages_as_read(
  p_conversation_id UUID,
  p_user_id UUID,
  p_message_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Actualizar participante
  UPDATE chat_participants
  SET 
    last_read_at = now(),
    last_read_message_id = COALESCE(p_message_id, last_read_message_id),
    unread_count = 0,
    updated_at = now()
  WHERE conversation_id = p_conversation_id
    AND user_id = p_user_id;
END;
$$;

-- Función: get_conversation_with_participants
CREATE OR REPLACE FUNCTION get_conversation_with_participants(p_conversation_id UUID)
RETURNS TABLE (
  id UUID,
  type TEXT,
  title TEXT,
  created_by UUID,
  business_id UUID,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  is_archived BOOLEAN,
  participant_id UUID,
  participant_user_id UUID,
  participant_name TEXT,
  participant_email TEXT,
  participant_avatar TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.type,
    c.title,
    c.created_by,
    c.business_id,
    c.last_message_at,
    c.last_message_preview,
    c.is_archived,
    p.id AS participant_id,
    p.user_id AS participant_user_id,
    pr.full_name AS participant_name,
    pr.email AS participant_email,
    pr.avatar_url AS participant_avatar
  FROM chat_conversations c
  INNER JOIN chat_participants p ON c.id = p.conversation_id
  INNER JOIN profiles pr ON p.user_id = pr.id
  WHERE c.id = p_conversation_id
    AND p.left_at IS NULL;
END;
$$;

-- ============================================================================
-- 4. POLÍTICAS RLS
-- ============================================================================

-- Habilitar RLS
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_typing_indicators ENABLE ROW LEVEL SECURITY;

-- Políticas para chat_conversations
DROP POLICY IF EXISTS "Users can view their conversations" ON chat_conversations;
CREATE POLICY "Users can view their conversations"
  ON chat_conversations FOR SELECT
  USING (
    id IN (
      SELECT conversation_id 
      FROM chat_participants 
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Users can create conversations" ON chat_conversations;
CREATE POLICY "Users can create conversations"
  ON chat_conversations FOR INSERT
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can update their conversations" ON chat_conversations;
CREATE POLICY "Users can update their conversations"
  ON chat_conversations FOR UPDATE
  USING (
    id IN (
      SELECT conversation_id 
      FROM chat_participants 
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

-- Políticas para chat_participants
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON chat_participants;
CREATE POLICY "Users can view participants in their conversations"
  ON chat_participants FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM chat_participants 
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Users can insert themselves as participants" ON chat_participants;
CREATE POLICY "Users can insert themselves as participants"
  ON chat_participants FOR INSERT
  WITH CHECK (
    user_id = auth.uid() OR
    conversation_id IN (
      SELECT id FROM chat_conversations WHERE created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own participant record" ON chat_participants;
CREATE POLICY "Users can update their own participant record"
  ON chat_participants FOR UPDATE
  USING (user_id = auth.uid());

-- Políticas para chat_messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON chat_messages;
CREATE POLICY "Users can view messages in their conversations"
  ON chat_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM chat_participants 
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Users can send messages to their conversations" ON chat_messages;
CREATE POLICY "Users can send messages to their conversations"
  ON chat_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT conversation_id 
      FROM chat_participants 
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Users can update their own messages" ON chat_messages;
CREATE POLICY "Users can update their own messages"
  ON chat_messages FOR UPDATE
  USING (sender_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own messages" ON chat_messages;
CREATE POLICY "Users can delete their own messages"
  ON chat_messages FOR DELETE
  USING (sender_id = auth.uid());

-- Políticas para chat_typing_indicators
DROP POLICY IF EXISTS "Users can view typing indicators in their conversations" ON chat_typing_indicators;
CREATE POLICY "Users can view typing indicators in their conversations"
  ON chat_typing_indicators FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM chat_participants 
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Users can manage their own typing indicators" ON chat_typing_indicators;
CREATE POLICY "Users can manage their own typing indicators"
  ON chat_typing_indicators FOR ALL
  USING (user_id = auth.uid());

-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================

-- Trigger para actualizar updated_at en chat_conversations
CREATE OR REPLACE FUNCTION update_chat_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_chat_conversations_updated_at ON chat_conversations;
CREATE TRIGGER trigger_update_chat_conversations_updated_at
  BEFORE UPDATE ON chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_conversations_updated_at();

-- Trigger para actualizar updated_at en chat_participants
DROP TRIGGER IF EXISTS trigger_update_chat_participants_updated_at ON chat_participants;
CREATE TRIGGER trigger_update_chat_participants_updated_at
  BEFORE UPDATE ON chat_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_conversations_updated_at();

-- Trigger para actualizar updated_at en chat_messages
DROP TRIGGER IF EXISTS trigger_update_chat_messages_updated_at ON chat_messages;
CREATE TRIGGER trigger_update_chat_messages_updated_at
  BEFORE UPDATE ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_conversations_updated_at();

-- ============================================================================
-- 6. LIMPIAR TYPING INDICATORS EXPIRADOS (Función de mantenimiento)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_typing_indicators()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM chat_typing_indicators
  WHERE expires_at < now();
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;

-- ============================================================================
-- COMPLETADO
-- ============================================================================

COMMENT ON TABLE chat_conversations IS 'Conversaciones de chat entre usuarios';
COMMENT ON TABLE chat_participants IS 'Participantes en conversaciones de chat';
COMMENT ON TABLE chat_messages IS 'Mensajes enviados en conversaciones de chat';
COMMENT ON TABLE chat_typing_indicators IS 'Indicadores de escritura en tiempo real';
