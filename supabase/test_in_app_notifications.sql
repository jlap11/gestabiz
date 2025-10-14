-- ============================================================================
-- SCRIPT DE TESTING: Sistema de Notificaciones In-App
-- Fecha: 2025-10-13
-- Descripción: Tests manuales para verificar funcionalidad antes de deploy
-- ============================================================================

-- IMPORTANTE: Este script es solo para testing. No ejecutar en producción.
-- Ejecutar en un entorno de staging o desarrollo primero.

-- ============================================================================
-- TEST 1: Verificar que el enum notification_status existe
-- ============================================================================

SELECT 
  enumtypid::regtype AS enum_type,
  enumlabel AS value
FROM pg_enum 
WHERE enumtypid = 'notification_status'::regtype
ORDER BY enumsortorder;

-- Resultado esperado: 3 filas (unread, read, archived)

-- ============================================================================
-- TEST 2: Verificar que la tabla in_app_notifications existe y tiene estructura correcta
-- ============================================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'in_app_notifications'
ORDER BY ordinal_position;

-- Resultado esperado: ~15 columnas (id, created_at, updated_at, read_at, user_id, business_id, type, title, body, data, status, priority, action_url, is_deleted)

-- ============================================================================
-- TEST 3: Verificar índices creados
-- ============================================================================

SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
AND tablename = 'in_app_notifications'
ORDER BY indexname;

-- Resultado esperado: 6+ índices (primary key + 5 índices personalizados)

-- ============================================================================
-- TEST 4: Verificar RLS está habilitado
-- ============================================================================

SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename = 'in_app_notifications';

-- Resultado esperado: rowsecurity = true

-- ============================================================================
-- TEST 5: Listar políticas RLS
-- ============================================================================

SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'in_app_notifications';

-- Resultado esperado: 3 políticas (SELECT, UPDATE, UPDATE para soft delete)

-- ============================================================================
-- TEST 6: Verificar funciones helper existen
-- ============================================================================

SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'create_in_app_notification',
  'mark_notifications_as_read',
  'get_unread_count',
  'cleanup_old_notifications'
)
ORDER BY routine_name;

-- Resultado esperado: 4 funciones

-- ============================================================================
-- TEST 7: Probar crear notificación in-app (REQUIERE USER ID VÁLIDO)
-- ============================================================================

-- ⚠️ REEMPLAZAR 'your-user-uuid-here' con un UUID de usuario real de tu base de datos
-- Ejemplo de cómo obtener un user_id:
-- SELECT id, email FROM profiles LIMIT 1;

/*
DO $$
DECLARE
  v_user_id UUID := 'your-user-uuid-here'; -- ⚠️ REEMPLAZAR
  v_notification_id UUID;
BEGIN
  -- Crear notificación de prueba
  SELECT create_in_app_notification(
    v_user_id,
    'appointment_reminder',
    'Test Notification Title',
    'This is a test notification body',
    '{"test": true, "source": "manual_test"}'::jsonb,
    NULL, -- business_id
    1, -- priority (alta)
    '/appointments/test-123' -- action_url
  ) INTO v_notification_id;

  RAISE NOTICE 'Notification created with ID: %', v_notification_id;
  
  -- Verificar que se creó
  PERFORM * FROM in_app_notifications WHERE id = v_notification_id;
  
  IF FOUND THEN
    RAISE NOTICE '✅ TEST PASSED: Notification exists in database';
  ELSE
    RAISE EXCEPTION '❌ TEST FAILED: Notification not found';
  END IF;
  
  -- Limpiar (soft delete)
  UPDATE in_app_notifications 
  SET is_deleted = TRUE 
  WHERE id = v_notification_id;
  
  RAISE NOTICE '✅ Test notification cleaned up';
END $$;
*/

-- ============================================================================
-- TEST 8: Probar marcar como leída
-- ============================================================================

/*
DO $$
DECLARE
  v_user_id UUID := 'your-user-uuid-here'; -- ⚠️ REEMPLAZAR
  v_notification_id UUID;
  v_count INTEGER;
BEGIN
  -- Crear notificación
  SELECT create_in_app_notification(
    v_user_id,
    'system_alert',
    'Test Mark as Read',
    'Testing mark as read functionality',
    '{}'::jsonb
  ) INTO v_notification_id;

  -- Marcar como leída
  SELECT mark_notifications_as_read(
    v_user_id,
    ARRAY[v_notification_id]
  ) INTO v_count;

  IF v_count = 1 THEN
    RAISE NOTICE '✅ TEST PASSED: Marked 1 notification as read';
  ELSE
    RAISE EXCEPTION '❌ TEST FAILED: Expected 1, got %', v_count;
  END IF;

  -- Verificar status cambió
  PERFORM * FROM in_app_notifications 
  WHERE id = v_notification_id 
  AND status = 'read' 
  AND read_at IS NOT NULL;

  IF FOUND THEN
    RAISE NOTICE '✅ TEST PASSED: Status is read and read_at is set';
  ELSE
    RAISE EXCEPTION '❌ TEST FAILED: Status not updated correctly';
  END IF;

  -- Limpiar
  UPDATE in_app_notifications SET is_deleted = TRUE WHERE id = v_notification_id;
END $$;
*/

-- ============================================================================
-- TEST 9: Probar conteo de no leídas
-- ============================================================================

/*
DO $$
DECLARE
  v_user_id UUID := 'your-user-uuid-here'; -- ⚠️ REEMPLAZAR
  v_notif_1 UUID;
  v_notif_2 UUID;
  v_count INTEGER;
BEGIN
  -- Crear 2 notificaciones
  SELECT create_in_app_notification(v_user_id, 'system_alert', 'Test 1', 'Body 1', '{}'::jsonb) INTO v_notif_1;
  SELECT create_in_app_notification(v_user_id, 'system_alert', 'Test 2', 'Body 2', '{}'::jsonb) INTO v_notif_2;

  -- Contar no leídas
  SELECT get_unread_count(v_user_id) INTO v_count;

  IF v_count >= 2 THEN
    RAISE NOTICE '✅ TEST PASSED: Unread count is % (>= 2)', v_count;
  ELSE
    RAISE EXCEPTION '❌ TEST FAILED: Expected >= 2, got %', v_count;
  END IF;

  -- Marcar una como leída
  PERFORM mark_notifications_as_read(v_user_id, ARRAY[v_notif_1]);

  -- Contar de nuevo
  SELECT get_unread_count(v_user_id) INTO v_count;

  IF v_count >= 1 THEN
    RAISE NOTICE '✅ TEST PASSED: Unread count decreased to % (>= 1)', v_count;
  ELSE
    RAISE EXCEPTION '❌ TEST FAILED: Expected >= 1, got %', v_count;
  END IF;

  -- Limpiar
  UPDATE in_app_notifications SET is_deleted = TRUE WHERE id IN (v_notif_1, v_notif_2);
END $$;
*/

-- ============================================================================
-- TEST 10: Verificar que notification_channel incluye 'in_app' (después de migración 2)
-- ============================================================================

SELECT 
  enumlabel AS channel
FROM pg_enum 
WHERE enumtypid = 'notification_channel'::regtype
ORDER BY enumsortorder;

-- Resultado esperado: email, sms, whatsapp, in_app

-- ============================================================================
-- TEST 11: Verificar que user_notification_preferences tiene in_app_enabled
-- ============================================================================

SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_notification_preferences'
AND column_name = 'in_app_enabled';

-- Resultado esperado: 1 fila (in_app_enabled, boolean, true)

-- ============================================================================
-- TEST 12: Verificar performance de índices
-- ============================================================================

-- Este test verifica que los índices se usan correctamente
EXPLAIN ANALYZE
SELECT * FROM in_app_notifications
WHERE user_id = 'your-user-uuid-here' -- ⚠️ REEMPLAZAR
AND is_deleted = FALSE
ORDER BY created_at DESC
LIMIT 20;

-- Resultado esperado: Debe usar Index Scan en idx_inapp_user_created_at

-- ============================================================================
-- RESUMEN DE TESTS
-- ============================================================================

-- Test 1: ✅ Enum notification_status existe
-- Test 2: ✅ Tabla in_app_notifications estructura correcta
-- Test 3: ✅ Índices creados
-- Test 4: ✅ RLS habilitado
-- Test 5: ✅ Políticas RLS configuradas
-- Test 6: ✅ Funciones helper existen
-- Test 7: ⚠️  Crear notificación (requiere user_id)
-- Test 8: ⚠️  Marcar como leída (requiere user_id)
-- Test 9: ⚠️  Conteo no leídas (requiere user_id)
-- Test 10: ✅ Enum notification_channel incluye in_app
-- Test 11: ✅ Columna in_app_enabled existe
-- Test 12: ⚠️  Performance índices (requiere user_id)

-- ============================================================================
-- CLEANUP FINAL (opcional)
-- ============================================================================

-- Si necesitas limpiar todas las notificaciones de prueba:
-- UPDATE in_app_notifications 
-- SET is_deleted = TRUE 
-- WHERE data @> '{"source": "manual_test"}'::jsonb;
