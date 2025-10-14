-- ============================================================================
-- SCRIPT DE TESTING: Notificaciones In-App
-- Fecha: 2025-10-13
-- Propósito: Crear notificaciones de prueba para testing E2E
-- ============================================================================

-- IMPORTANTE: Ejecutar en Dashboard > SQL Editor de Supabase
-- URL: https://supabase.com/dashboard/project/dkancockzvcqorqbwtyh/sql/new

-- ============================================================================
-- PASO 1: Obtener tu User ID
-- ============================================================================

-- Ver usuarios disponibles
SELECT id, email, full_name, created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;

-- Copiar el ID del usuario con el que estás logueado
-- Ejemplo: '12345678-1234-1234-1234-123456789012'

-- ============================================================================
-- PASO 2: Crear Notificaciones de Prueba
-- ============================================================================

-- REEMPLAZAR '[TU_USER_ID]' con tu ID real antes de ejecutar

-- Test 1: Notificación simple de sistema
SELECT create_in_app_notification(
  p_user_id := '[TU_USER_ID]'::UUID,
  p_type := 'system_alert',
  p_title := 'Test de Notificación #1',
  p_body := 'Esta es una notificación de prueba para validar el sistema',
  p_priority := 0
);

-- Test 2: Notificación de cita (simulada)
SELECT create_in_app_notification(
  p_user_id := '[TU_USER_ID]'::UUID,
  p_type := 'appointment_confirmation',
  p_title := 'Cita Confirmada',
  p_body := 'Tu cita ha sido confirmada para el 15 de octubre a las 10:00 AM',
  p_data := '{"appointment_id": "test-001", "date": "2025-10-15T10:00:00Z"}'::JSONB,
  p_priority := 1,
  p_action_url := '/appointments/test-001'
);

-- Test 3: Notificación urgente
SELECT create_in_app_notification(
  p_user_id := '[TU_USER_ID]'::UUID,
  p_type := 'appointment_cancellation',
  p_title := 'Cita Cancelada (URGENTE)',
  p_body := 'Tu cita del 14 de octubre ha sido cancelada. Por favor, contacta al negocio.',
  p_data := '{"appointment_id": "test-002", "reason": "Emergencia"}'::JSONB,
  p_priority := 2,
  p_action_url := '/appointments/test-002'
);

-- Test 4: Notificación de reprogramación
SELECT create_in_app_notification(
  p_user_id := '[TU_USER_ID]'::UUID,
  p_type := 'appointment_rescheduled',
  p_title := 'Cita Reprogramada',
  p_body := 'Tu cita ha sido movida del 15 al 16 de octubre a las 11:00 AM',
  p_data := '{"appointment_id": "test-003", "old_date": "2025-10-15T10:00:00Z", "new_date": "2025-10-16T11:00:00Z"}'::JSONB,
  p_priority := 1,
  p_action_url := '/appointments/test-003'
);

-- Test 5: Recordatorio de cita
SELECT create_in_app_notification(
  p_user_id := '[TU_USER_ID]'::UUID,
  p_type := 'appointment_reminder',
  p_title := 'Recordatorio: Cita Mañana',
  p_body := 'Tienes una cita programada para mañana a las 9:00 AM',
  p_data := '{"appointment_id": "test-004", "date": "2025-10-14T09:00:00Z"}'::JSONB,
  p_priority := 1,
  p_action_url := '/appointments/test-004'
);

-- ============================================================================
-- PASO 3: Verificar Notificaciones Creadas
-- ============================================================================

-- Ver tus notificaciones recientes
SELECT 
  id,
  type,
  title,
  status,
  priority,
  created_at
FROM in_app_notifications
WHERE user_id = '[TU_USER_ID]'::UUID
ORDER BY created_at DESC
LIMIT 10;

-- Contar por status
SELECT 
  status,
  COUNT(*) as count
FROM in_app_notifications
WHERE user_id = '[TU_USER_ID]'::UUID
GROUP BY status;

-- ============================================================================
-- PASO 4: Marcar Algunas como Leídas (para testing de filtros)
-- ============================================================================

-- Marcar las 2 primeras como leídas
SELECT mark_notifications_as_read(
  p_user_id := '[TU_USER_ID]'::UUID,
  p_notification_ids := ARRAY(
    SELECT id FROM in_app_notifications
    WHERE user_id = '[TU_USER_ID]'::UUID
    AND status = 'unread'
    ORDER BY created_at DESC
    LIMIT 2
  )
);

-- Verificar resultado
SELECT 
  status,
  COUNT(*) as count
FROM in_app_notifications
WHERE user_id = '[TU_USER_ID]'::UUID
GROUP BY status;

-- ============================================================================
-- PASO 5: Testing de Contador de No Leídas
-- ============================================================================

-- Obtener contador de no leídas
SELECT get_unread_count('[TU_USER_ID]'::UUID);

-- Debería retornar: 3 (si creaste 5 y marcaste 2 como leídas)

-- ============================================================================
-- PASO 6: Limpiar Notificaciones de Prueba (Opcional)
-- ============================================================================

-- OPCIÓN A: Soft delete de todas las notificaciones de prueba
UPDATE in_app_notifications
SET is_deleted = TRUE, updated_at = NOW()
WHERE user_id = '[TU_USER_ID]'::UUID
AND type IN ('system_alert', 'appointment_confirmation', 'appointment_cancellation', 'appointment_rescheduled', 'appointment_reminder')
AND title LIKE '%Test%';

-- OPCIÓN B: Soft delete de TODAS tus notificaciones (cuidado)
UPDATE in_app_notifications
SET is_deleted = TRUE, updated_at = NOW()
WHERE user_id = '[TU_USER_ID]'::UUID;

-- OPCIÓN C: Borrar físicamente (NO RECOMENDADO, solo para testing)
DELETE FROM in_app_notifications
WHERE user_id = '[TU_USER_ID]'::UUID
AND type = 'system_alert';

-- ============================================================================
-- QUERIES ÚTILES PARA DEBUGGING
-- ============================================================================

-- Ver estructura completa de una notificación
SELECT 
  id,
  created_at,
  type,
  title,
  body,
  data,
  status,
  priority,
  action_url,
  read_at,
  is_deleted
FROM in_app_notifications
WHERE user_id = '[TU_USER_ID]'::UUID
ORDER BY created_at DESC
LIMIT 1;

-- Ver notificaciones con business_id (si tienes negocios)
SELECT 
  n.id,
  n.title,
  b.name as business_name,
  n.created_at
FROM in_app_notifications n
LEFT JOIN businesses b ON n.business_id = b.id
WHERE n.user_id = '[TU_USER_ID]'::UUID
ORDER BY n.created_at DESC
LIMIT 10;

-- Ver notificaciones por prioridad
SELECT 
  priority,
  COUNT(*) as count,
  CASE priority
    WHEN -1 THEN 'Baja'
    WHEN 0 THEN 'Normal'
    WHEN 1 THEN 'Alta'
    WHEN 2 THEN 'Urgente'
  END as priority_label
FROM in_app_notifications
WHERE user_id = '[TU_USER_ID]'::UUID
AND is_deleted = FALSE
GROUP BY priority
ORDER BY priority DESC;

-- ============================================================================
-- TESTING DE REALTIME (Avanzado)
-- ============================================================================

-- Crear notificación y observar que aparece en tiempo real en la UI
-- (Ejecutar MIENTRAS tienes la app abierta en otra ventana)
SELECT create_in_app_notification(
  p_user_id := '[TU_USER_ID]'::UUID,
  p_type := 'system_alert',
  p_title := 'Test Realtime ' || NOW()::TEXT,
  p_body := 'Esta notificación debería aparecer automáticamente sin refresh',
  p_priority := 1
);

-- Debería ver:
-- 1. Badge del bell incrementa inmediatamente
-- 2. Toast notification aparece
-- 3. Si NotificationCenter está abierto, nueva notificación aparece en lista

-- ============================================================================
-- TESTING DE FUNCIONES SQL
-- ============================================================================

-- Test: Crear notificación sin parámetros obligatorios (debe fallar)
SELECT create_in_app_notification(
  p_user_id := '[TU_USER_ID]'::UUID,
  p_type := NULL,  -- Esto debería causar error
  p_title := 'Test',
  p_body := 'Test'
);
-- Esperado: ERROR - user_id, type, title and body are required

-- Test: Marcar notificaciones sin IDs específicos (marca todas)
SELECT mark_notifications_as_read(
  p_user_id := '[TU_USER_ID]'::UUID,
  p_notification_ids := NULL
);
-- Esperado: Retorna número de notificaciones marcadas

-- Test: Cleanup de notificaciones antiguas
SELECT cleanup_old_notifications(90);
-- Esperado: Retorna número de notificaciones eliminadas (soft delete)

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================

/*
1. SIEMPRE reemplazar '[TU_USER_ID]' con tu UUID real
2. Las notificaciones usan soft delete (is_deleted = TRUE)
3. El badge del bell solo cuenta status = 'unread'
4. Prioridades:
   -1 = Baja
    0 = Normal (default)
    1 = Alta
    2 = Urgente
5. Tipos válidos (ver src/types/types.ts):
   - appointment_reminder
   - appointment_confirmation
   - appointment_cancellation
   - appointment_rescheduled
   - appointment_new_client
   - appointment_new_employee
   - appointment_new_business
   - employee_request_new
   - employee_request_accepted
   - employee_request_rejected
   - job_vacancy_new
   - job_application_new
   - job_application_accepted
   - job_application_rejected
   - job_application_interview
   - email_verification
   - phone_verification_sms
   - phone_verification_whatsapp
   - system_alert
*/

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================

-- ✅ Script listo para testing E2E de notificaciones in-app
-- 📖 Ver FASE_1_SPRINT_3_3_TESTING_E2E.md para plan completo
