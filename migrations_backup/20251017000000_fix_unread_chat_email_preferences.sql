-- ============================================================================
-- FIX: Corregir función get_clients_with_unread_messages
-- Fecha: 2025-10-17
-- Problema: La función intenta acceder a columnas que no existen en
--           user_notification_preferences. La tabla usa notification_preferences 
--           JSONB en su lugar.
-- ============================================================================

-- Drop función existente
DROP FUNCTION IF EXISTS get_clients_with_unread_messages(INTEGER);

-- Recrear función con verificación correcta de preferencias
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
      -- Excluir usuarios que deshabilitaron email_enabled
      SELECT 1 FROM user_notification_preferences unp
      WHERE unp.user_id = u.user_id
        AND unp.email_enabled = false
    )
    AND NOT EXISTS (
      -- Excluir usuarios que deshabilitaron email para chat_message específicamente
      SELECT 1 FROM user_notification_preferences unp
      WHERE unp.user_id = u.user_id
        AND (unp.notification_preferences->'chat_message'->>'email' = 'false'
             OR unp.notification_preferences->'chat_message'->>'email' = 'false')
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
'[FIXED] Obtiene lista de clientes (no admins ni empleados) con mensajes no leídos 
mayores al umbral especificado. Usado por send-unread-chat-emails edge function.
ACTUALIZADO: Usa email_enabled y notification_preferences->chat_message->email correctamente.';

-- ============================================================================
-- TEST
-- ============================================================================

DO $$
DECLARE
  v_result_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_result_count
  FROM get_clients_with_unread_messages(15);
  
  RAISE NOTICE '✅ Función get_clients_with_unread_messages FIXED ejecutada: % clientes encontrados', v_result_count;
END $$;

