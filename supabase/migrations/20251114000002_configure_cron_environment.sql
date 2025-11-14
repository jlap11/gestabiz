-- Configuración de variables de entorno para cron jobs
-- Estas variables permiten que las funciones invoke_* puedan llamar a Edge Functions

-- IMPORTANTE: Estas variables deben ser configuradas manualmente en Supabase Dashboard
-- porque contienen información sensible (service_role_key)

-- Opción 1: Configurar a nivel de base de datos (RECOMENDADO)
-- Ejecutar manualmente en Supabase SQL Editor reemplazando los valores:

/*
ALTER DATABASE postgres 
SET app.settings.service_role_key = 'eyJhbGc...TU_SERVICE_ROLE_KEY_AQUI';

ALTER DATABASE postgres 
SET app.settings.supabase_url = 'https://dkancockzvcqorqbwtyh.supabase.co';
*/

-- Opción 2: Crear función helper para obtener las variables de entorno de Supabase
CREATE OR REPLACE FUNCTION public.get_supabase_service_role_key()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Intentar obtener desde configuración personalizada
  RETURN current_setting('app.settings.service_role_key', true);
EXCEPTION WHEN OTHERS THEN
  -- Si no está configurada, retornar NULL
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_supabase_url()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Intentar obtener desde configuración personalizada
  RETURN current_setting('app.settings.supabase_url', true);
EXCEPTION WHEN OTHERS THEN
  -- Si no está configurada, usar la URL por defecto del proyecto
  RETURN 'https://dkancockzvcqorqbwtyh.supabase.co';
END;
$$;

-- Comentarios
COMMENT ON FUNCTION public.get_supabase_service_role_key() IS 'Returns the service role key for Edge Function invocations';
COMMENT ON FUNCTION public.get_supabase_url() IS 'Returns the Supabase project URL';

-- Crear tabla para logs de cron jobs
CREATE TABLE IF NOT EXISTS public.cron_execution_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  job_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('success', 'failed', 'warning')),
  message text,
  execution_time_ms integer,
  details jsonb
);

-- Index para consultas eficientes
CREATE INDEX IF NOT EXISTS idx_cron_logs_job_name_created 
ON public.cron_execution_logs(job_name, created_at DESC);

-- Trigger para limpiar logs antiguos (mantener solo últimos 30 días)
CREATE OR REPLACE FUNCTION public.cleanup_old_cron_logs()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.cron_execution_logs
  WHERE created_at < NOW() - INTERVAL '30 days';
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trigger_cleanup_cron_logs ON public.cron_execution_logs;
CREATE TRIGGER trigger_cleanup_cron_logs
  AFTER INSERT ON public.cron_execution_logs
  EXECUTE FUNCTION public.cleanup_old_cron_logs();

COMMENT ON TABLE public.cron_execution_logs IS 'Logs de ejecuciones de cron jobs para debugging';
