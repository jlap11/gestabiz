-- ============================================================================
-- MIGRATION: Optimización para Emails de Mensajes No Leídos
-- Fecha: 2025-10-16
-- Descripción: Índices y funciones para mejorar performance del sistema de
--              emails de recordatorio de mensajes no leídos
-- ============================================================================

-- 1. Índice compuesto para búsqueda eficiente de notificaciones no leídas
-- Optimiza: WHERE type = 'chat_message' AND status = 'unread' AND created_at < X
CREATE INDEX IF NOT EXISTS idx_notifications_unread_chat_messages
ON in_app_notifications (type, status, created_at DESC)
WHERE type = 'chat_message' AND status = 'unread';

COMMENT ON INDEX idx_notifications_unread_chat_messages IS 
'Índice parcial para búsqueda rápida de mensajes de chat no leídos. 
Usado por send-unread-chat-emails edge function.';

-- 2. Índice GIN en data para búsqueda de email_reminder_sent
-- Optimiza: WHERE data->>'email_reminder_sent' = 'true'
CREATE INDEX IF NOT EXISTS idx_notifications_data_email_reminder
ON in_app_notifications USING gin (data jsonb_path_ops);

COMMENT ON INDEX idx_notifications_data_email_reminder IS 
'Índice GIN para búsqueda eficiente en data JSONB. 
Previene envío de emails duplicados.';

-- 3. Función para obtener clientes con mensajes no leídos > X minutos
-- Simplifica la lógica de la edge function
CREATE OR REPLACE FUNCTION get_clients_with_unread_messages(
  p_minutes_threshold INTEGER DEFAULT 15
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  unread_count BIGINT,
  oldest_unread_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  WITH unread_notifications AS (
    SELECT 
      n.user_id,
      COUNT(*) as unread_count,
      MIN(n.created_at) as oldest_unread_at
    FROM in_app_notifications n
    WHERE n.type = 'chat_message'
      AND n.status = 'unread'
      AND n.created_at < NOW() - (p_minutes_threshold || ' minutes')::INTERVAL
      AND (n.data->>'email_reminder_sent' IS NULL OR n.data->>'email_reminder_sent' = 'false')
    GROUP BY n.user_id
  ),
  client_users AS (
    SELECT 
      u.user_id,
      u.unread_count,
      u.oldest_unread_at
    FROM unread_notifications u
    WHERE NOT EXISTS (
      -- Excluir admins (owners de negocios)
      SELECT 1 FROM businesses b 
      WHERE b.owner_id = u.user_id
    )
    AND NOT EXISTS (
      -- Excluir empleados
      SELECT 1 FROM business_employees be 
      WHERE be.employee_id = u.user_id
    )
    AND NOT EXISTS (
      -- Excluir usuarios que deshabilitaron emails de chat
      SELECT 1 FROM user_notification_preferences unp
      WHERE unp.user_id = u.user_id
        AND unp.notification_type = 'chat_message'
        AND unp.channel = 'email'
        AND unp.enabled = false
    )
  )
  SELECT 
    c.user_id,
    p.email,
    p.full_name,
    c.unread_count,
    c.oldest_unread_at
  FROM client_users c
  JOIN profiles p ON p.id = c.user_id
  WHERE p.email IS NOT NULL
  ORDER BY c.oldest_unread_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_clients_with_unread_messages IS 
'Obtiene lista de clientes (no admins ni empleados) con mensajes no leídos 
mayores al umbral especificado. Usado por send-unread-chat-emails edge function.';

-- 4. Función helper para marcar notificaciones como "email enviado"
CREATE OR REPLACE FUNCTION mark_notifications_email_sent(
  p_user_id UUID,
  p_notification_ids UUID[]
)
RETURNS INTEGER AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  UPDATE in_app_notifications
  SET data = jsonb_set(
    COALESCE(data, '{}'::jsonb),
    '{email_reminder_sent}',
    'true'::jsonb
  ) || jsonb_build_object('email_sent_at', NOW()::TEXT)
  WHERE id = ANY(p_notification_ids)
    AND user_id = p_user_id
    AND type = 'chat_message';
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION mark_notifications_email_sent IS 
'Marca notificaciones como "email de recordatorio enviado" para prevenir duplicados.';

-- 5. Vista para monitoreo de emails enviados
CREATE OR REPLACE VIEW v_unread_chat_email_stats AS
SELECT 
  DATE(data->>'email_sent_at') as date,
  COUNT(DISTINCT user_id) as unique_users_notified,
  COUNT(*) as total_notifications_sent,
  AVG(EXTRACT(EPOCH FROM (data->>'email_sent_at')::TIMESTAMPTZ - created_at) / 60) as avg_minutes_to_email
FROM in_app_notifications
WHERE type = 'chat_message'
  AND data->>'email_reminder_sent' = 'true'
  AND data->>'email_sent_at' IS NOT NULL
GROUP BY DATE(data->>'email_sent_at')
ORDER BY date DESC;

COMMENT ON VIEW v_unread_chat_email_stats IS 
'Estadísticas diarias de emails de recordatorio de mensajes no leídos.';

-- 6. Grants para edge functions (service role)
-- Las edge functions usan service_role_key, que ya tiene todos los permisos
-- Pero documentamos por claridad

-- ============================================================================
-- TESTING
-- ============================================================================

-- Test 1: Verificar índices creados
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_notifications_unread_chat_messages'
  ) THEN
    RAISE EXCEPTION 'Index idx_notifications_unread_chat_messages not created';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_notifications_data_email_reminder'
  ) THEN
    RAISE EXCEPTION 'Index idx_notifications_data_email_reminder not created';
  END IF;
  
  RAISE NOTICE '✅ Todos los índices creados correctamente';
END $$;

-- Test 2: Verificar función get_clients_with_unread_messages
DO $$
DECLARE
  v_result_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_result_count
  FROM get_clients_with_unread_messages(15);
  
  RAISE NOTICE '✅ Función get_clients_with_unread_messages ejecutada: % clientes encontrados', v_result_count;
END $$;

-- Test 3: Verificar vista
DO $$
DECLARE
  v_result_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_result_count
  FROM v_unread_chat_email_stats
  WHERE date >= CURRENT_DATE - INTERVAL '30 days';
  
  RAISE NOTICE '✅ Vista v_unread_chat_email_stats accesible: % registros', v_result_count;
END $$;

-- ============================================================================
-- ROLLBACK (si se necesita)
-- ============================================================================

-- DROP INDEX IF EXISTS idx_notifications_unread_chat_messages;
-- DROP INDEX IF EXISTS idx_notifications_data_email_reminder;
-- DROP FUNCTION IF EXISTS get_clients_with_unread_messages(INTEGER);
-- DROP FUNCTION IF EXISTS mark_notifications_email_sent(UUID, UUID[]);
-- DROP VIEW IF EXISTS v_unread_chat_email_stats;
