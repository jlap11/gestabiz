-- Configuración del cron job para actualización automática de estado de citas
-- Este job se ejecutará cada 10 minutos para procesar citas pendientes de confirmación

-- Habilitar la extensión pg_cron si no está habilitada
CREATE EXTENSION IF NOT EXISTS pg_cron;
-- Función que invoca la Edge Function de actualización de estado
CREATE OR REPLACE FUNCTION invoke_appointment_status_updater()
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
-- Programar el cron job para ejecutarse cada 10 minutos
-- Nota: En producción, esto debe configurarse manualmente en el dashboard de Supabase
-- o usando la API de administración

-- Para desarrollo local, podemos usar pg_cron directamente:
DO $$
BEGIN
  -- Intentar programar el cron job
  -- Esto funcionará solo si pg_cron está disponible y configurado
  BEGIN
    PERFORM cron.schedule(
      'appointment-status-updater',
      '*/10 * * * *', -- Cada 10 minutos
      'SELECT invoke_appointment_status_updater();'
    );
    
    RAISE NOTICE 'Cron job programado exitosamente: appointment-status-updater cada 10 minutos';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'No se pudo programar el cron job automáticamente. Configurar manualmente en producción.';
      RAISE NOTICE 'Error: %', SQLERRM;
  END;
END;
$$;
-- Comentarios para configuración manual en producción:
/*
Para configurar este cron job en producción de Supabase:

1. Ir al Dashboard de Supabase > Database > Extensions
2. Habilitar la extensión "pg_cron"
3. Ir a SQL Editor y ejecutar:

SELECT cron.schedule(
  'appointment-status-updater',
  '*/10 * * * *',
  'SELECT invoke_appointment_status_updater();
'
);

4. Verificar que el job está programado:
SELECT * FROM cron.job;

5. Para ver logs de ejecución:
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

6. Para desprogramar el job si es necesario:
SELECT cron.unschedule('appointment-status-updater');
*/;
