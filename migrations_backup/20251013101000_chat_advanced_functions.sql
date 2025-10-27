-- ============================================================================
-- MIGRACIÓN COMPLEMENTARIA: Funciones SQL Avanzadas para Chat
-- Fecha: 2025-10-13
-- Versión: 1.1
-- Descripción: Funciones adicionales para operaciones complejas de chat
-- ============================================================================

-- Dependencias: 20251013100000_chat_system.sql

BEGIN;

-- ============================================================================
-- FUNCIÓN 1: Obtener miembros de conversación con detalles de usuario
-- ============================================================================

CREATE OR REPLACE FUNCTION get_conversation_members(p_conversation_id UUID)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  role conversation_role,
  joined_at TIMESTAMPTZ,
  last_read_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  unread_count INTEGER,
  muted BOOLEAN,
  notifications_enabled BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS user_id,
    p.full_name,
    p.email,
    p.avatar_url,
    cm.role,
    cm.joined_at,
    cm.last_read_at,
    cm.last_seen_at,
    cm.unread_count,
    cm.muted,
    cm.notifications_enabled
  FROM public.conversation_members cm
  INNER JOIN public.profiles p ON cm.user_id = p.id
  WHERE cm.conversation_id = p_conversation_id
  ORDER BY 
    CASE cm.role 
      WHEN 'admin' THEN 1 
      WHEN 'member' THEN 2 
    END,
    cm.joined_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- FUNCIÓN 2: Obtener preview de conversaciones para un usuario
-- ============================================================================

CREATE OR REPLACE FUNCTION get_conversation_preview(
  p_user_id UUID,
  p_business_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  conversation_id UUID,
  conversation_type conversation_type,
  conversation_name TEXT,
  conversation_avatar_url TEXT,
  business_id UUID,
  business_name TEXT,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  last_message_sender_name TEXT,
  unread_count INTEGER,
  is_muted BOOLEAN,
  is_archived BOOLEAN,
  member_count BIGINT,
  -- Para conversaciones directas: info del otro usuario
  other_user_id UUID,
  other_user_name TEXT,
  other_user_avatar TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS conversation_id,
    c.type AS conversation_type,
    c.name AS conversation_name,
    c.avatar_url AS conversation_avatar_url,
    c.business_id,
    b.name AS business_name,
    c.last_message_at,
    c.last_message_preview,
    -- Último mensaje sender (si existe)
    (
      SELECT p.full_name 
      FROM public.messages m
      INNER JOIN public.profiles p ON m.sender_id = p.id
      WHERE m.conversation_id = c.id AND m.is_deleted = FALSE
      ORDER BY m.created_at DESC
      LIMIT 1
    ) AS last_message_sender_name,
    cm.unread_count,
    cm.muted AS is_muted,
    c.is_archived,
    -- Contar miembros
    (
      SELECT COUNT(*) 
      FROM public.conversation_members cm2 
      WHERE cm2.conversation_id = c.id
    ) AS member_count,
    -- Para conversaciones directas: info del otro usuario
    CASE 
      WHEN c.type = 'direct' THEN (
        SELECT cm_other.user_id
        FROM public.conversation_members cm_other
        WHERE cm_other.conversation_id = c.id 
          AND cm_other.user_id != p_user_id
        LIMIT 1
      )
      ELSE NULL
    END AS other_user_id,
    CASE 
      WHEN c.type = 'direct' THEN (
        SELECT p_other.full_name
        FROM public.conversation_members cm_other
        INNER JOIN public.profiles p_other ON cm_other.user_id = p_other.id
        WHERE cm_other.conversation_id = c.id 
          AND cm_other.user_id != p_user_id
        LIMIT 1
      )
      ELSE NULL
    END AS other_user_name,
    CASE 
      WHEN c.type = 'direct' THEN (
        SELECT p_other.avatar_url
        FROM public.conversation_members cm_other
        INNER JOIN public.profiles p_other ON cm_other.user_id = p_other.id
        WHERE cm_other.conversation_id = c.id 
          AND cm_other.user_id != p_user_id
        LIMIT 1
      )
      ELSE NULL
    END AS other_user_avatar
  FROM public.conversations c
  INNER JOIN public.conversation_members cm ON c.id = cm.conversation_id
  INNER JOIN public.businesses b ON c.business_id = b.id
  WHERE cm.user_id = p_user_id
    AND (p_business_id IS NULL OR c.business_id = p_business_id)
  ORDER BY c.last_message_at DESC NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- FUNCIÓN 3: Búsqueda full-text en mensajes
-- ============================================================================

-- Primero, agregar columna tsvector para búsqueda
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Índice GIN para búsqueda full-text
CREATE INDEX IF NOT EXISTS idx_messages_search_vector 
ON public.messages USING GIN(search_vector);

-- Función para actualizar search_vector
CREATE OR REPLACE FUNCTION update_message_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('spanish', COALESCE(NEW.body, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.metadata->>'file_name', '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-actualizar search_vector
DROP TRIGGER IF EXISTS update_message_search_vector_trigger ON public.messages;
CREATE TRIGGER update_message_search_vector_trigger
BEFORE INSERT OR UPDATE OF body, metadata ON public.messages
FOR EACH ROW EXECUTE FUNCTION update_message_search_vector();

-- Actualizar search_vector de mensajes existentes (solo si hay datos)
UPDATE public.messages
SET search_vector = 
  setweight(to_tsvector('spanish', COALESCE(body, '')), 'A') ||
  setweight(to_tsvector('spanish', COALESCE(metadata->>'file_name', '')), 'B')
WHERE search_vector IS NULL;

-- Función de búsqueda
CREATE OR REPLACE FUNCTION search_messages(
  p_conversation_id UUID,
  p_query TEXT,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  message_id UUID,
  sender_id UUID,
  sender_name TEXT,
  sender_avatar TEXT,
  body TEXT,
  type message_type,
  created_at TIMESTAMPTZ,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id AS message_id,
    m.sender_id,
    p.full_name AS sender_name,
    p.avatar_url AS sender_avatar,
    m.body,
    m.type,
    m.created_at,
    ts_rank(m.search_vector, websearch_to_tsquery('spanish', p_query)) AS rank
  FROM public.messages m
  LEFT JOIN public.profiles p ON m.sender_id = p.id
  WHERE m.conversation_id = p_conversation_id
    AND m.is_deleted = FALSE
    AND m.search_vector @@ websearch_to_tsquery('spanish', p_query)
  ORDER BY rank DESC, m.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- FUNCIÓN 4: Obtener mensajes anclados
-- ============================================================================

CREATE OR REPLACE FUNCTION get_pinned_messages(p_conversation_id UUID)
RETURNS TABLE (
  message_id UUID,
  sender_id UUID,
  sender_name TEXT,
  sender_avatar TEXT,
  body TEXT,
  type message_type,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  pinned_at TIMESTAMPTZ,
  pinned_by UUID,
  pinned_by_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id AS message_id,
    m.sender_id,
    p.full_name AS sender_name,
    p.avatar_url AS sender_avatar,
    m.body,
    m.type,
    m.metadata,
    m.created_at,
    m.pinned_at,
    m.pinned_by,
    p_pinned.full_name AS pinned_by_name
  FROM public.messages m
  LEFT JOIN public.profiles p ON m.sender_id = p.id
  LEFT JOIN public.profiles p_pinned ON m.pinned_by = p_pinned.id
  WHERE m.conversation_id = p_conversation_id
    AND m.is_pinned = TRUE
    AND m.is_deleted = FALSE
  ORDER BY m.pinned_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- FUNCIÓN 5: Marcar múltiples conversaciones como leídas (bulk)
-- ============================================================================

CREATE OR REPLACE FUNCTION bulk_mark_read(
  p_user_id UUID,
  p_conversation_ids UUID[]
)
RETURNS TABLE (
  conversation_id UUID,
  previous_unread INTEGER,
  updated BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH updated_conversations AS (
    UPDATE public.conversation_members
    SET 
      last_read_at = NOW(),
      unread_count = 0
    WHERE user_id = p_user_id
      AND conversation_id = ANY(p_conversation_ids)
      AND unread_count > 0
    RETURNING 
      conversation_members.conversation_id,
      conversation_members.unread_count AS prev_count
  )
  SELECT 
    unnest(p_conversation_ids) AS conversation_id,
    COALESCE(uc.prev_count, 0) AS previous_unread,
    (uc.conversation_id IS NOT NULL) AS updated
  FROM unnest(p_conversation_ids) AS cid
  LEFT JOIN updated_conversations uc ON uc.conversation_id = cid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCIÓN 6: Obtener estadísticas de chat para un usuario
-- ============================================================================

CREATE OR REPLACE FUNCTION get_chat_stats(
  p_user_id UUID,
  p_business_id UUID DEFAULT NULL
)
RETURNS TABLE (
  total_conversations BIGINT,
  unread_conversations BIGINT,
  total_unread_messages BIGINT,
  messages_sent_today BIGINT,
  messages_received_today BIGINT,
  active_conversations_today BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Total de conversaciones
    (
      SELECT COUNT(*) 
      FROM public.conversation_members cm
      INNER JOIN public.conversations c ON cm.conversation_id = c.id
      WHERE cm.user_id = p_user_id
        AND c.is_archived = FALSE
        AND (p_business_id IS NULL OR c.business_id = p_business_id)
    ) AS total_conversations,
    
    -- Conversaciones con mensajes no leídos
    (
      SELECT COUNT(*) 
      FROM public.conversation_members cm
      INNER JOIN public.conversations c ON cm.conversation_id = c.id
      WHERE cm.user_id = p_user_id
        AND cm.unread_count > 0
        AND c.is_archived = FALSE
        AND (p_business_id IS NULL OR c.business_id = p_business_id)
    ) AS unread_conversations,
    
    -- Total de mensajes no leídos
    (
      SELECT COALESCE(SUM(cm.unread_count), 0)
      FROM public.conversation_members cm
      INNER JOIN public.conversations c ON cm.conversation_id = c.id
      WHERE cm.user_id = p_user_id
        AND c.is_archived = FALSE
        AND (p_business_id IS NULL OR c.business_id = p_business_id)
    ) AS total_unread_messages,
    
    -- Mensajes enviados hoy
    (
      SELECT COUNT(*)
      FROM public.messages m
      INNER JOIN public.conversations c ON m.conversation_id = c.id
      WHERE m.sender_id = p_user_id
        AND m.created_at >= CURRENT_DATE
        AND m.is_deleted = FALSE
        AND (p_business_id IS NULL OR c.business_id = p_business_id)
    ) AS messages_sent_today,
    
    -- Mensajes recibidos hoy
    (
      SELECT COUNT(*)
      FROM public.messages m
      INNER JOIN public.conversation_members cm ON m.conversation_id = cm.conversation_id
      INNER JOIN public.conversations c ON m.conversation_id = c.id
      WHERE cm.user_id = p_user_id
        AND m.sender_id != p_user_id
        AND m.created_at >= CURRENT_DATE
        AND m.is_deleted = FALSE
        AND (p_business_id IS NULL OR c.business_id = p_business_id)
    ) AS messages_received_today,
    
    -- Conversaciones activas hoy (con al menos 1 mensaje)
    (
      SELECT COUNT(DISTINCT m.conversation_id)
      FROM public.messages m
      INNER JOIN public.conversation_members cm ON m.conversation_id = cm.conversation_id
      INNER JOIN public.conversations c ON m.conversation_id = c.id
      WHERE cm.user_id = p_user_id
        AND m.created_at >= CURRENT_DATE
        AND m.is_deleted = FALSE
        AND (p_business_id IS NULL OR c.business_id = p_business_id)
    ) AS active_conversations_today;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- FUNCIÓN 7: Obtener mensajes con paginación (cursor-based)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_messages_paginated(
  p_conversation_id UUID,
  p_before_id UUID DEFAULT NULL,
  p_after_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  message_id UUID,
  sender_id UUID,
  sender_name TEXT,
  sender_avatar TEXT,
  body TEXT,
  type message_type,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ,
  reply_to UUID,
  is_pinned BOOLEAN,
  -- Info del mensaje al que responde
  reply_to_body TEXT,
  reply_to_sender_name TEXT
) AS $$
DECLARE
  v_reference_timestamp TIMESTAMPTZ;
BEGIN
  -- Si hay before_id, obtener su timestamp
  IF p_before_id IS NOT NULL THEN
    SELECT created_at INTO v_reference_timestamp
    FROM public.messages
    WHERE id = p_before_id;
  END IF;
  
  -- Si hay after_id, obtener su timestamp
  IF p_after_id IS NOT NULL THEN
    SELECT created_at INTO v_reference_timestamp
    FROM public.messages
    WHERE id = p_after_id;
  END IF;

  RETURN QUERY
  SELECT 
    m.id AS message_id,
    m.sender_id,
    p.full_name AS sender_name,
    p.avatar_url AS sender_avatar,
    m.body,
    m.type,
    m.metadata,
    m.created_at,
    m.edited_at,
    m.reply_to,
    m.is_pinned,
    -- Info del mensaje reply_to
    reply_msg.body AS reply_to_body,
    reply_sender.full_name AS reply_to_sender_name
  FROM public.messages m
  LEFT JOIN public.profiles p ON m.sender_id = p.id
  LEFT JOIN public.messages reply_msg ON m.reply_to = reply_msg.id
  LEFT JOIN public.profiles reply_sender ON reply_msg.sender_id = reply_sender.id
  WHERE m.conversation_id = p_conversation_id
    AND m.is_deleted = FALSE
    AND (
      p_before_id IS NULL OR m.created_at < v_reference_timestamp
    )
    AND (
      p_after_id IS NULL OR m.created_at > v_reference_timestamp
    )
  ORDER BY 
    CASE WHEN p_before_id IS NOT NULL THEN m.created_at END DESC,
    CASE WHEN p_after_id IS NOT NULL THEN m.created_at END ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Permisos de ejecución para funciones
GRANT EXECUTE ON FUNCTION get_conversation_members(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversation_preview(UUID, UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION search_messages(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pinned_messages(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_mark_read(UUID, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_chat_stats(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_messages_paginated(UUID, UUID, UUID, INTEGER) TO authenticated;

COMMIT;

-- ============================================================================
-- VERIFICACIONES POST-MIGRACIÓN
-- ============================================================================

-- Verificar nuevas funciones
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'get_conversation_members',
  'get_conversation_preview',
  'search_messages',
  'get_pinned_messages',
  'bulk_mark_read',
  'get_chat_stats',
  'get_messages_paginated'
)
ORDER BY routine_name;
-- Esperado: 7 filas

-- Verificar columna search_vector
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'messages' 
AND column_name = 'search_vector';
-- Esperado: 1 fila

-- Verificar índice de búsqueda
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename = 'messages' 
AND indexname = 'idx_messages_search_vector';
-- Esperado: 1 fila

-- ✅ Si todas las verificaciones pasan, la migración fue exitosa
