-- Revertir a usar current_setting() con ALTER DATABASE
-- La configuración debe hacerse desde Dashboard (SQL Editor) donde hay permisos de superusuario

-- Función que usa current_setting() para leer la configuración
CREATE OR REPLACE FUNCTION public.invoke_process_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
  service_key text;
BEGIN
  -- Leer desde configuración de base de datos (configurada vía ALTER DATABASE)
  service_key := current_setting('app.supabase_service_role_key', true);
  
  IF service_key IS NULL THEN
    RAISE WARNING 'Service role key not configured. Run ALTER DATABASE in Dashboard SQL Editor';
    INSERT INTO public.cron_execution_logs (job_name, status, message)
    VALUES ('process-reminders', 'failed', 'Service role key not configured');
    RETURN;
  END IF;

  -- Invocar Edge Function
  SELECT INTO request_id
    net.http_post(
      url := 'https://dkancockzvcqorqbwtyh.supabase.co/functions/v1/process-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 30000
    );

  -- Log de éxito
  INSERT INTO public.cron_execution_logs (job_name, status, message, details)
  VALUES (
    'process-reminders',
    'success',
    'Edge Function invoked successfully',
    jsonb_build_object('request_id', request_id, 'timestamp', now())
  );

EXCEPTION WHEN OTHERS THEN
  INSERT INTO public.cron_execution_logs (job_name, status, message, details)
  VALUES (
    'process-reminders',
    'failed',
    SQLERRM,
    jsonb_build_object('error', SQLERRM, 'timestamp', now())
  );
  RAISE WARNING 'Failed to invoke process-reminders: %', SQLERRM;
END;
$$;
-- Función para appointment-status-updater
CREATE OR REPLACE FUNCTION public.invoke_appointment_status_updater()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
  service_key text;
BEGIN
  -- Leer desde configuración de base de datos
  service_key := current_setting('app.supabase_service_role_key', true);
  
  IF service_key IS NULL THEN
    RAISE WARNING 'Service role key not configured';
    INSERT INTO public.cron_execution_logs (job_name, status, message)
    VALUES ('appointment-status-updater', 'failed', 'Service role key not configured');
    RETURN;
  END IF;

  SELECT INTO request_id
    net.http_post(
      url := 'https://dkancockzvcqorqbwtyh.supabase.co/functions/v1/appointment-status-updater',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key
      ),
      body := jsonb_build_object(
        'source', 'cron_job',
        'timestamp', extract(epoch from now())
      ),
      timeout_milliseconds := 30000
    );

  INSERT INTO public.cron_execution_logs (job_name, status, message, details)
  VALUES (
    'appointment-status-updater',
    'success',
    'Edge Function invoked successfully',
    jsonb_build_object('request_id', request_id, 'timestamp', now())
  );

EXCEPTION WHEN OTHERS THEN
  INSERT INTO public.cron_execution_logs (job_name, status, message, details)
  VALUES (
    'appointment-status-updater',
    'failed',
    SQLERRM,
    jsonb_build_object('error', SQLERRM, 'timestamp', now())
  );
  RAISE WARNING 'Failed to invoke appointment-status-updater: %', SQLERRM;
END;
$$;
COMMENT ON FUNCTION public.invoke_process_reminders() IS 
'Invokes process-reminders Edge Function using service_role_key from Vault';
COMMENT ON FUNCTION public.invoke_appointment_status_updater() IS 
'Invokes appointment-status-updater Edge Function using service_role_key from Vault';
