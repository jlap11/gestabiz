-- Habilitar la extensión pg_cron si no está habilitada
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Crear función que invoca el Edge Function de recordatorios
CREATE OR REPLACE FUNCTION invoke_process_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_role_key text;
  supabase_url text;
  function_url text;
BEGIN
  -- Obtener las variables de entorno (configurar en Supabase Dashboard -> Settings -> API)
  -- Estas se deben configurar manualmente en Supabase
  service_role_key := current_setting('app.settings.service_role_key', true);
  supabase_url := current_setting('app.settings.supabase_url', true);
  
  IF service_role_key IS NULL OR supabase_url IS NULL THEN
    RAISE NOTICE 'Missing configuration. Please set app.settings.service_role_key and app.settings.supabase_url';
    RETURN;
  END IF;

  -- Construir la URL completa del Edge Function
  function_url := supabase_url || '/functions/v1/process-reminders';

  -- Hacer la petición HTTP al Edge Function
  -- Nota: pg_net debe estar instalado para esto
  PERFORM
    net.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := '{}'::jsonb
    );
    
  RAISE NOTICE 'Reminder processor invoked successfully at %', now();
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to invoke reminder processor: %', SQLERRM;
END;
$$;

-- Programar ejecución cada 5 minutos
-- Nota: pg_cron.schedule requiere permisos de superusuario
-- En Supabase, esto se debe hacer desde la consola SQL con privilegios elevados
SELECT cron.schedule(
  'process-appointment-reminders', -- Nombre del job
  '*/5 * * * *',                    -- Cada 5 minutos
  'SELECT invoke_process_reminders();'
);

-- Verificar que el cron job fue creado
SELECT * FROM cron.job WHERE jobname = 'process-appointment-reminders';

-- Para desactivar el cron job más tarde, usar:
-- SELECT cron.unschedule('process-appointment-reminders');

-- Para ver ejecuciones del cron job:
-- SELECT * FROM cron.job_run_details WHERE jobid IN (
--   SELECT jobid FROM cron.job WHERE jobname = 'process-appointment-reminders'
-- ) ORDER BY start_time DESC LIMIT 20;

COMMENT ON FUNCTION invoke_process_reminders() IS 'Invoca el Edge Function process-reminders para enviar recordatorios de citas';
