-- ============================================================================
-- INTEGRACIÓN: Chat + Notificaciones In-App
-- ============================================================================
-- Trigger que crea notificaciones in-app automáticas cuando se envía un mensaje
-- Descripción:
-- - Cuando se inserta un mensaje en chat_messages
-- - Se crea una notificación para cada participante de la conversación (excepto el sender)
-- - La notificación incluye el nombre del sender y preview del mensaje
-- - Tiene action_url que lleva directamente a la conversación
--
-- @author Gestabiz Team
-- @version 1.0.0
-- @date 2025-10-13
-- ============================================================================

-- ============================================================================
-- 1. FUNCIÓN: Crear notificación para nuevo mensaje de chat
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_chat_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_participant RECORD;
    v_sender_name TEXT;
    v_conversation_title TEXT;
    v_message_preview TEXT;
BEGIN
    -- Solo procesar mensajes de tipo 'text' o 'image' o 'file' (no 'system')
    IF NEW.type = 'system' THEN
        RETURN NEW;
    END IF;

    -- Obtener nombre del remitente
    SELECT full_name INTO v_sender_name
    FROM public.profiles
    WHERE id = NEW.sender_id;

    -- Si no tiene full_name, usar email
    IF v_sender_name IS NULL THEN
        SELECT email INTO v_sender_name
        FROM auth.users
        WHERE id = NEW.sender_id;
    END IF;

    -- Obtener título de la conversación (si existe)
    SELECT title INTO v_conversation_title
    FROM public.chat_conversations
    WHERE id = NEW.conversation_id;

    -- Preview del mensaje (máximo 100 caracteres)
    v_message_preview := substring(NEW.content, 1, 100);
    IF length(NEW.content) > 100 THEN
        v_message_preview := v_message_preview || '...';
    END IF;

    -- Crear notificación para cada participante (excepto el sender)
    FOR v_participant IN
        SELECT 
            cp.user_id,
            cp.is_muted,
            cc.business_id
        FROM public.chat_participants cp
        INNER JOIN public.chat_conversations cc ON cc.id = cp.conversation_id
        WHERE cp.conversation_id = NEW.conversation_id
          AND cp.user_id != NEW.sender_id
          AND cp.left_at IS NULL  -- Solo participantes activos
          AND cp.is_muted = FALSE  -- Respetar mute preference
    LOOP
        -- Crear notificación in-app usando la función helper
        PERFORM create_in_app_notification(
            p_user_id := v_participant.user_id,
            p_type := 'chat_message_received',
            p_title := COALESCE(v_sender_name, 'Nuevo mensaje'),
            p_body := v_message_preview,
            p_data := jsonb_build_object(
                'conversation_id', NEW.conversation_id,
                'message_id', NEW.id,
                'sender_id', NEW.sender_id,
                'sender_name', v_sender_name,
                'message_type', NEW.type,
                'conversation_title', v_conversation_title
            ),
            p_business_id := v_participant.business_id,
            p_priority := 0, -- Normal priority
            p_action_url := '/chat/' || NEW.conversation_id
        );
    END LOOP;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION notify_chat_message IS 
'Trigger function que crea notificaciones in-app cuando se envía un mensaje de chat';

-- ============================================================================
-- 2. TRIGGER: Ejecutar función después de INSERT en chat_messages
-- ============================================================================

DROP TRIGGER IF EXISTS chat_message_notification_trigger ON public.chat_messages;

CREATE TRIGGER chat_message_notification_trigger
AFTER INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION notify_chat_message();

COMMENT ON TRIGGER chat_message_notification_trigger ON public.chat_messages IS 
'Crea notificaciones in-app automáticamente cuando se envía un mensaje de chat';

-- ============================================================================
-- 3. ÍNDICE ADICIONAL: Optimizar queries de chat_participants
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_chat_participants_active 
ON public.chat_participants(conversation_id, user_id) 
WHERE left_at IS NULL AND is_muted = FALSE;

COMMENT ON INDEX idx_chat_participants_active IS 
'Índice para optimizar búsqueda de participantes activos y no silenciados en trigger de notificaciones';

-- ============================================================================
-- 4. VALIDACIÓN: Verificar que todo está OK
-- ============================================================================

-- Verificar que la función existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'notify_chat_message'
    ) THEN
        RAISE EXCEPTION 'Error: Función notify_chat_message no se creó correctamente';
    END IF;
END $$;

-- Verificar que el trigger existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'chat_message_notification_trigger'
    ) THEN
        RAISE EXCEPTION 'Error: Trigger chat_message_notification_trigger no se creó correctamente';
    END IF;
END $$;

-- ============================================================================
-- 5. LOG DE MIGRACIÓN
-- ============================================================================

-- Log success
DO $$
BEGIN
    RAISE NOTICE '✅ Migración 20251013000006_chat_notification_trigger.sql completada exitosamente';
    RAISE NOTICE '   - Función notify_chat_message() creada';
    RAISE NOTICE '   - Trigger chat_message_notification_trigger activado';
    RAISE NOTICE '   - Índice idx_chat_participants_active creado';
    RAISE NOTICE '   - Notificaciones automáticas de chat configuradas';
END $$;
