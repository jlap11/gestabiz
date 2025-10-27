-- ============================================================================
-- FUNCIÓN: get_unread_count_no_chat
-- Retorna el conteo de notificaciones no leídas excluyendo mensajes de chat
-- Usado por la campana de notificaciones (para separar chat de sistema)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_unread_count_no_chat(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO v_count
    FROM public.in_app_notifications
    WHERE 
        user_id = p_user_id 
        AND status = 'unread'
        AND type != 'chat_message_received'; -- Excluir notificaciones de chat

    RETURN v_count;
END;
$$;

COMMENT ON FUNCTION get_unread_count_no_chat IS 
'Retorna el conteo de notificaciones no leídas de un usuario, excluyendo mensajes de chat. Usado por la campana de notificaciones del sistema.';

-- Grant permission
GRANT EXECUTE ON FUNCTION get_unread_count_no_chat TO authenticated;
