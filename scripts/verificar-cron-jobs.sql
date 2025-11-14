-- =====================================================
-- VERIFICACIÓN COMPLETA DEL SISTEMA DE CRON JOBS
-- =====================================================
-- Ejecutar en: Dashboard > SQL Editor
-- =====================================================

-- 1. Verificar que el secret existe en Vault
SELECT 
  id,
  name,
  description,
  created_at
FROM vault.secrets
WHERE name = 'SUPABASE_SERVICE_ROLE_KEY';
-- ✅ Debe mostrar 1 fila

-- 2. Verificar que las funciones pueden leer el secret
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Secret configurado correctamente'
    ELSE '❌ Secret NO encontrado'
  END as status
FROM vault.decrypted_secrets
WHERE name = 'SUPABASE_SERVICE_ROLE_KEY';

-- 3. Probar funciones manualmente (esto invocará las Edge Functions)
SELECT public.invoke_process_reminders();
SELECT public.invoke_appointment_status_updater();

-- 4. Revisar logs de ejecución (IMPORTANTE - ver si hubo éxito)
SELECT 
  job_name,
  status,
  message,
  details,
  created_at
FROM public.cron_execution_logs
ORDER BY created_at DESC
LIMIT 10;
-- ✅ Debe mostrar status='success' para ambas funciones
-- ❌ Si muestra 'failed', revisar el campo 'message' para diagnóstico

-- 5. Verificar que los cron jobs están activos
SELECT 
  jobname,
  schedule,
  active,
  database
FROM cron.job
WHERE jobname IN ('process-appointment-reminders-hourly', 'appointment-status-updater')
ORDER BY jobname;
-- ✅ Ambos deben tener active = true

-- 6. Ver historial de ejecuciones automáticas de pg_cron
SELECT 
  jobname,
  status,
  start_time,
  end_time,
  return_message
FROM cron.job_run_details
WHERE start_time > NOW() - INTERVAL '24 hours'
  AND jobname IN ('process-appointment-reminders-hourly', 'appointment-status-updater')
ORDER BY start_time DESC
LIMIT 10;

-- =====================================================
-- INTERPRETACIÓN DE RESULTADOS
-- =====================================================
/*
PASO 4 (cron_execution_logs) - Lo más importante:

✅ SI VES:
   status: 'success'
   message: 'Successfully invoked Edge Function'
   → Todo funciona correctamente

❌ SI VES:
   status: 'failed'
   message: 'Service role key not found in Vault'
   → El secret no se creó correctamente, volver a ejecutar vault.create_secret()

❌ SI VES:
   status: 'failed'
   message: 'Edge Function returned error: 401'
   → El service_role_key es incorrecto, verificar que copiaste el correcto

❌ SI VES:
   status: 'failed'
   message: 'Edge Function returned error: 404'
   → La Edge Function no está desplegada, ejecutar:
      npx supabase functions deploy process-reminders

PASO 6 (cron.job_run_details):
- Si hay filas: Los cron jobs se están ejecutando automáticamente
- Si NO hay filas: Los cron jobs aún no se han ejecutado (esperar a la próxima hora)
*/

-- =====================================================
-- SIGUIENTE PASO (OPCIONAL - SOLO SI TODO FUNCIONA)
-- =====================================================
-- Si PASO 4 muestra 'success', los recordatorios deberían estar funcionando
-- Para verificar que se crean notificaciones, ejecuta:

SELECT 
  id,
  user_id,
  type,
  title,
  message,
  created_at
FROM in_app_notifications
WHERE type LIKE '%reminder%'
ORDER BY created_at DESC
LIMIT 5;
-- Si hay citas programadas para las próximas 24h, deberían aparecer notificaciones
