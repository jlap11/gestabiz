-- =====================================================
-- CONFIGURACIÓN DE SECRETS CON VAULT PARA CRON JOBS
-- =====================================================
-- ✅ Usa Vault (ya instalado en tu proyecto)
-- Ejecutar desde: Dashboard > SQL Editor
-- =====================================================

-- =====================================================
-- PASO 1: Crear Secret en Vault
-- =====================================================
-- 1. Ve a Dashboard > Settings > API
-- 2. Copia el valor de "service_role" (secret)
-- 3. Reemplaza 'YOUR_SERVICE_ROLE_KEY_HERE' abajo con ese valor
-- 4. Ejecuta este comando

SELECT vault.create_secret(
  'YOUR_SERVICE_ROLE_KEY_HERE',
  'SUPABASE_SERVICE_ROLE_KEY',
  'Service role key for authenticating Edge Function calls from cron jobs'
);

-- =====================================================
-- PASO 2: Verificar que el Secret fue Creado
-- =====================================================
-- Debe mostrar 1 fila con el secret creado

SELECT 
  id,
  name,
  description,
  created_at
FROM vault.secrets
WHERE name = 'SUPABASE_SERVICE_ROLE_KEY';

-- =====================================================
-- PASO 3: Verificar que las Funciones Pueden Leer el Secret
-- =====================================================
-- Debe devolver "✓ Secreto configurado correctamente"

SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✓ Secreto configurado correctamente en Vault'
    ELSE '✗ Secreto NO encontrado - Ejecuta PASO 1'
  END as status
FROM vault.decrypted_secrets
WHERE name = 'SUPABASE_SERVICE_ROLE_KEY';

-- =====================================================
-- PASO 4: Probar Funciones de Cron Jobs Manualmente
-- =====================================================

-- Probar función de recordatorios
SELECT public.invoke_process_reminders();

-- Probar función de actualización de estados
SELECT public.invoke_appointment_status_updater();

-- =====================================================
-- PASO 5: Revisar Logs de Ejecución
-- =====================================================
-- Verificar que las ejecuciones fueron exitosas (status='success')

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
-- PASO 6: Verificar Cron Jobs Activos
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
-- COMANDOS ÚTILES DE VAULT
-- =====================================================

-- Ver todos los secrets en Vault (solo nombres, no valores)
SELECT id, name, description, created_at
FROM vault.secrets
ORDER BY created_at DESC;

-- Actualizar un secret existente (si necesitas cambiar la clave)
-- SELECT vault.update_secret(
--   (SELECT id FROM vault.secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY'),
--   'NUEVO_VALOR_AQUI',
--   'Service role key for authenticating Edge Function calls from cron jobs'
-- );

-- Eliminar un secret (si necesitas recrearlo)
-- SELECT vault.delete_secret(
--   (SELECT id FROM vault.secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY')
-- );

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 
-- 1. ✅ Vault está instalado en tu proyecto (lo veo en Integrations)
-- 2. ✅ Los secrets en Vault están encriptados en reposo
-- 3. ✅ Solo funciones con SECURITY DEFINER pueden leer decrypted_secrets
-- 4. ✅ No requiere permisos de superusuario (a diferencia de ALTER DATABASE)
-- 5. ✅ Los secrets persisten entre deployments
-- 6. ✅ Fácil rotación de secrets con vault.update_secret()
-- 
-- Para más información sobre Vault:
-- https://supabase.com/docs/guides/database/vault
-- =====================================================


-- PASO 5: Ver logs de ejecución recientes
SELECT 
  jobname,
  start_time,
  end_time,
  status,
  return_message,
  (end_time - start_time) as duration
FROM cron.job_run_details
WHERE jobname IN ('appointment-status-updater', 'process-appointment-reminders-hourly')
ORDER BY start_time DESC
LIMIT 20;

-- PASO 6: Si los cron jobs no existen, crearlos
-- (Solo ejecutar si el PASO 3 no muestra resultados)

-- Cron para actualizar estado de citas (cada 30 minutos)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'appointment-status-updater'
  ) THEN
    PERFORM cron.schedule(
      'appointment-status-updater',
      '*/30 * * * *',
      'SELECT public.invoke_appointment_status_updater();'
    );
  END IF;
END $$;

-- Cron para enviar recordatorios (cada hora)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'process-appointment-reminders-hourly'
  ) THEN
    PERFORM cron.schedule(
      'process-appointment-reminders-hourly',
      '0 * * * *',
      'SELECT public.invoke_process_reminders();'
    );
  END IF;
END $$;

-- PASO 7: Verificar nuevamente que todo está configurado
SELECT 'Cron jobs configurados correctamente' as status;

-- ==========================================
-- COMANDOS ÚTILES PARA DEBUGGING
-- ==========================================

-- Ver todas las Edge Functions desplegadas (debe incluir process-reminders)
-- Ejecutar en terminal:
-- npx supabase functions list --dns-resolver https

-- Ver logs de la Edge Function process-reminders
-- Ir a: Supabase Dashboard > Edge Functions > process-reminders > Logs

-- Probar manualmente la Edge Function
-- Ejecutar en terminal:
-- curl -X POST 'https://dkancockzvcqorqbwtyh.supabase.co/functions/v1/process-reminders' \
--   -H 'Authorization: Bearer TU_SERVICE_ROLE_KEY' \
--   -H 'Content-Type: application/json'

-- Ver citas próximas (próximas 25 horas)
SELECT 
  id,
  title,
  start_time,
  status,
  client_id,
  EXTRACT(EPOCH FROM (start_time - NOW())) / 3600 as hours_until
FROM appointments
WHERE start_time > NOW()
  AND start_time < NOW() + INTERVAL '25 hours'
  AND status IN ('confirmed', 'scheduled')
ORDER BY start_time;

-- Ver notificaciones creadas recientemente
SELECT 
  id,
  type,
  delivery_method,
  status,
  scheduled_for,
  created_at,
  appointment_id
FROM notifications
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 20;
