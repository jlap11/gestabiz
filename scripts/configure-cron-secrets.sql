-- =====================================================
-- CONFIGURACIÓN DE SECRETS PARA CRON JOBS
-- =====================================================
-- ⚠️ IMPORTANTE: Este script debe ejecutarse desde el Dashboard de Supabase
-- en la sección SQL Editor, ya que requiere permisos de superusuario.
-- 
-- ❌ NO funcionará desde Supabase CLI (npx supabase db push)
-- ✅ SÍ funciona desde: Dashboard > SQL Editor
-- =====================================================

-- =====================================================
-- PASO 1: Configurar Service Role Key
-- =====================================================
-- 1. Ve a Dashboard > Settings > API
-- 2. Copia el valor de "service_role" (secret)
-- 3. Reemplaza 'YOUR_SERVICE_ROLE_KEY_HERE' abajo con ese valor
-- 4. Ejecuta el comando ALTER DATABASE

ALTER DATABASE postgres 
SET app.supabase_service_role_key = 'YOUR_SERVICE_ROLE_KEY_HERE';

-- =====================================================
-- PASO 2: Verificar configuración
-- =====================================================
-- Debería devolver tu service_role_key (el valor que configuraste)
-- Si devuelve NULL, significa que el ALTER DATABASE no se ejecutó correctamente

SELECT current_setting('app.supabase_service_role_key', true) as configured_key;

-- =====================================================
-- PASO 3: Probar funciones de cron jobs manualmente
-- =====================================================
-- Estas funciones son las que los cron jobs ejecutan automáticamente
-- Ejecutarlas manualmente permite verificar que todo funciona

-- Probar función de recordatorios
SELECT public.invoke_process_reminders();

-- Probar función de actualización de estados
SELECT public.invoke_appointment_status_updater();

-- =====================================================
-- PASO 4: Revisar logs de ejecución
-- =====================================================
-- Verificar que las ejecuciones fueron exitosas (status='success')
-- Si aparece status='failed', revisar el campo 'message' para diagnóstico

SELECT 
  job_name,
  status,
  message,
  details,
  created_at
FROM public.cron_execution_logs
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- PASO 5: Verificar cron jobs activos en pg_cron
-- =====================================================
-- Confirmar que los jobs están programados y activos

SELECT 
  jobname,
  schedule,
  command,
  active,
  database
FROM cron.job
WHERE jobname IN ('process-appointment-reminders-hourly', 'appointment-status-updater')
ORDER BY jobname;

-- =====================================================
-- COMANDOS DE DIAGNÓSTICO (OPCIONAL)
-- =====================================================

-- Ver historial de ejecuciones de pg_cron (últimas 24 horas)
SELECT 
  jobname,
  status,
  start_time,
  end_time,
  return_message
FROM cron.job_run_details
WHERE start_time > NOW() - INTERVAL '24 hours'
ORDER BY start_time DESC
LIMIT 20;

-- Ver próximas ejecuciones programadas
SELECT 
  jobname,
  schedule,
  active
FROM cron.job
WHERE active = true;

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 
-- 1. ¿Por qué necesito ejecutar desde Dashboard?
--    - ALTER DATABASE requiere permisos de superusuario (database owner)
--    - El usuario de Supabase CLI no tiene estos permisos
--    - El SQL Editor del Dashboard SÍ tiene permisos de superusuario
--
-- 2. ¿La configuración es persistente?
--    - SÍ, ALTER DATABASE es permanente (sobrevive a reinicios)
--    - Solo necesitas configurarlo UNA VEZ
--
-- 3. ¿Cómo cambio la clave en el futuro?
--    - Volver a ejecutar ALTER DATABASE con el nuevo valor
--    - No es necesario eliminar la configuración anterior
--
-- 4. ¿Por qué solo necesito el service_role_key?
--    - Los Edge Functions ya tienen sus propios secrets (BREVO_API_KEY, TWILIO_*, etc)
--    - PostgreSQL solo necesita autenticarse para llamar a las Edge Functions
--    - Esto evita duplicación innecesaria de secrets
--
-- 5. ¿Qué hacen los cron jobs?
--    - process-appointment-reminders-hourly: Envía recordatorios de citas (24h y 1h antes)
--    - appointment-status-updater: Actualiza estados de citas (cada 30 min)
--
-- 6. ¿Cómo sé si los cron jobs están funcionando?
--    - Revisar public.cron_execution_logs (debe tener entries con status='success')
--    - Revisar cron.job_run_details para ver ejecuciones de pg_cron
--    - Verificar que las notificaciones se crean en la tabla de notificaciones
--
-- =====================================================
