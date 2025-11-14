-- =====================================================
-- RECREAR FUNCIONES PARA USAR VAULT
-- =====================================================
-- Ejecutar en: Dashboard > SQL Editor
-- =====================================================

-- Primero: Otorgar permisos para leer Vault
GRANT SELECT ON vault.decrypted_secrets TO postgres;
GRANT USAGE ON SCHEMA vault TO postgres;

-- Función para process-reminders (CON VAULT)
CREATE OR REPLACE FUNCTION public.invoke_process_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
  service_key text;
BEGIN
  -- ✅ Leer service_role_key desde Vault (NO desde current_setting)
  SELECT decrypted_secret INTO service_key
  FROM vault.decrypted_secrets
  WHERE name = 'SUPABASE_SERVICE_ROLE_KEY'
  LIMIT 1;
  
  IF service_key IS NULL THEN
    RAISE WARNING 'Service role key not found in Vault';
    INSERT INTO public.cron_execution_logs (job_name, status, message)
    VALUES ('process-reminders', 'failed', 'Service role key not found in Vault');
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
    'Successfully invoked Edge Function',
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

-- Función para appointment-status-updater (CON VAULT)
CREATE OR REPLACE FUNCTION public.invoke_appointment_status_updater()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
  service_key text;
BEGIN
  -- ✅ Leer service_role_key desde Vault (NO desde current_setting)
  SELECT decrypted_secret INTO service_key
  FROM vault.decrypted_secrets
  WHERE name = 'SUPABASE_SERVICE_ROLE_KEY'
  LIMIT 1;
  
  IF service_key IS NULL THEN
    RAISE WARNING 'Service role key not found in Vault';
    INSERT INTO public.cron_execution_logs (job_name, status, message)
    VALUES ('appointment-status-updater', 'failed', 'Service role key not found in Vault');
    RETURN;
  END IF;

  -- Invocar Edge Function (cuando exista)
  SELECT INTO request_id
    net.http_post(
      url := 'https://dkancockzvcqorqbwtyh.supabase.co/functions/v1/appointment-status-updater',
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
    'appointment-status-updater',
    'success',
    'Successfully invoked Edge Function',
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

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- 1. Verificar que ahora lee desde Vault
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'invoke_process_reminders';
-- Debe contener: "FROM vault.decrypted_secrets"

-- 2. Probar funciones
SELECT public.invoke_process_reminders();
SELECT public.invoke_appointment_status_updater();

-- 3. Revisar logs (ahora debería funcionar)
SELECT 
  job_name,
  status,
  message,
  created_at
FROM public.cron_execution_logs
ORDER BY created_at DESC
LIMIT 5;
