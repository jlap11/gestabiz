-- Asegura que las funciones requeridas por los cron jobs existan
-- Esto previene errores cuando pg_cron intenta ejecutarlas

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Función para invocar el actualizador de estado de citas
CREATE OR REPLACE FUNCTION public.invoke_appointment_status_updater()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Invocar la Edge Function usando http
  PERFORM
    net.http_post(
      url := 'https://dkancockzvcqorqbwtyh.supabase.co/functions/v1/appointment-status-updater',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'source', 'cron_job',
        'timestamp', extract(epoch from now())
      )
    );
END;
$$;

-- Función para invocar el procesador de recordatorios
CREATE OR REPLACE FUNCTION public.invoke_process_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
declare
  service_role_key text;
  supabase_url text;
  function_url text;
begin
  service_role_key := current_setting('app.settings.service_role_key', true);
  supabase_url := current_setting('app.settings.supabase_url', true);

  if service_role_key is null or supabase_url is null then
    raise notice 'Missing configuration: set app.settings.service_role_key and app.settings.supabase_url';
    return;
  end if;

  function_url := supabase_url || '/functions/v1/process-reminders';

  perform net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := '{}'::jsonb
  );
exception when others then
  raise warning 'Failed to invoke process-reminders: %', sqlerrm;
end;
$$;

-- Comentario para documentación
COMMENT ON FUNCTION public.invoke_appointment_status_updater() IS 'Invokes Edge Function appointment-status-updater to mark expired pending confirmations as cancelled';
COMMENT ON FUNCTION public.invoke_process_reminders() IS 'Invokes Edge Function process-reminders to send appointment reminders';;
