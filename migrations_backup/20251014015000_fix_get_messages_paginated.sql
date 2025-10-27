-- Fix ambiguous column reference in get_messages_paginated
-- Fecha: 2025-10-14
-- Corrige bug en líneas 427 y 434 donde created_at es ambiguo

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
    SELECT m.created_at INTO v_reference_timestamp -- FIX: prefijo m. agregado
    FROM public.messages m
    WHERE m.id = p_before_id;
  END IF;
  
  -- Si hay after_id, obtener su timestamp
  IF p_after_id IS NOT NULL THEN
    SELECT m.created_at INTO v_reference_timestamp -- FIX: prefijo m. agregado
    FROM public.messages m
    WHERE m.id = p_after_id;
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_messages_paginated(UUID, UUID, UUID, INTEGER) TO authenticated;

COMMENT ON FUNCTION get_messages_paginated(UUID, UUID, UUID, INTEGER) IS 
'Obtiene mensajes de una conversación con paginación basada en cursores. 
Corrige bug de referencia ambigua de created_at.
FIXED: 2025-10-14 - Added table prefix m. to created_at in DECLARE section.';
