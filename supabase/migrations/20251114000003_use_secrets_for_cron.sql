-- Modificar funciones de invocación de cron para usar secretos de Supabase
-- en lugar de configuraciones de base de datos

-- Función mejorada para invocar process-reminders usando secrets
CREATE OR REPLACE FUNCTION public.invoke_process_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
  response_status int;
  response_body text;
BEGIN
  -- Invocar Edge Function usando pg_net
  -- La URL usa la variable de entorno SUPABASE_URL del proyecto
  -- El Authorization usa la variable SUPABASE_SERVICE_ROLE_KEY
  SELECT INTO request_id
    net.http_post(
      url := current_setting('app.supabase_url', true) || '/functions/v1/process-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 30000
    );

  -- Log de ejecución
  INSERT INTO public.cron_execution_logs (job_name, status, message, details)
  VALUES (
    'process-reminders',
    'success',
    'Edge Function invoked successfully',
    jsonb_build_object('request_id', request_id, 'timestamp', now())
  );

EXCEPTION WHEN OTHERS THEN
  -- Log de error
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

-- Función mejorada para invocar appointment-status-updater usando secrets
CREATE OR REPLACE FUNCTION public.invoke_appointment_status_updater()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
BEGIN
  -- Invocar Edge Function usando pg_net con secrets
  SELECT INTO request_id
    net.http_post(
      url := current_setting('app.supabase_url', true) || '/functions/v1/appointment-status-updater',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
      ),
      body := jsonb_build_object(
        'source', 'cron_job',
        'timestamp', extract(epoch from now())
      ),
      timeout_milliseconds := 30000
    );

  -- Log de ejecución
  INSERT INTO public.cron_execution_logs (job_name, status, message, details)
  VALUES (
    'appointment-status-updater',
    'success',
    'Edge Function invoked successfully',
    jsonb_build_object('request_id', request_id, 'timestamp', now())
  );

EXCEPTION WHEN OTHERS THEN
  -- Log de error
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

-- Función helper para configurar secretos desde variables de entorno
-- Esta función debe ser llamada manualmente por un usuario con permisos adecuados
CREATE OR REPLACE FUNCTION public.configure_cron_secrets()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Solo retornar instrucciones, NO ejecutar ALTER DATABASE
  -- (requiere permisos de superusuario)
  RETURN 'Ejecuta manualmente: ALTER DATABASE postgres SET app.supabase_url = ''https://dkancockzvcqorqbwtyh.supabase.co''; y ALTER DATABASE postgres SET app.supabase_service_role_key = ''YOUR_KEY_HERE'';';
END;
$$;

-- Comentarios de documentación
COMMENT ON FUNCTION public.invoke_process_reminders() IS 
'Invokes process-reminders Edge Function using Supabase secrets (app.supabase_service_role_key)';

COMMENT ON FUNCTION public.invoke_appointment_status_updater() IS 
'Invokes appointment-status-updater Edge Function using Supabase secrets (app.supabase_service_role_key)';

COMMENT ON FUNCTION public.configure_cron_secrets() IS 
'Returns instructions to configure Supabase secrets manually.';

-- NO ejecutar automáticamente - requiere permisos de superusuario
-- SELECT public.configure_cron_secrets();
