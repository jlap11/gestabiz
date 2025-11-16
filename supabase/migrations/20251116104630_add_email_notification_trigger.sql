-- =============================================
-- MIGRATION: Trigger para enviar email cuando negocio se desconfigura
-- DATE: 2025-11-16
-- DESCRIPTION: Webhook que llama a Edge Function notify-business-unconfigured
-- =============================================

-- Crear función que llama a Edge Function vía webhook
CREATE OR REPLACE FUNCTION public.trigger_notify_business_unconfigured()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_supabase_url TEXT;
  v_service_role_key TEXT;
  v_request_id BIGINT;
BEGIN
  -- Solo procesar notificaciones de tipo business_unconfigured
  IF NEW.type != 'business_unconfigured' THEN
    RETURN NEW;
  END IF;

  -- Obtener URL de Supabase desde configuración
  v_supabase_url := current_setting('app.settings.supabase_url', true);
  
  -- Si no hay URL configurada, usar valor por defecto (development)
  IF v_supabase_url IS NULL OR v_supabase_url = '' THEN
    v_supabase_url := 'http://localhost:54321';
  END IF;

  -- Usar pg_cron o pg_net para llamar a la Edge Function
  -- Nota: Esto requiere extensión pg_net instalada en Supabase
  -- Por ahora, la Edge Function será llamada manualmente o via webhook HTTP
  
  -- Alternativa: Insertar en tabla de queue para procesamiento asíncrono
  -- INSERT INTO notification_queue (notification_id, function_name, payload, created_at)
  -- VALUES (NEW.id, 'notify-business-unconfigured', row_to_json(NEW), NOW());

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.trigger_notify_business_unconfigured() IS 
'Trigger que se ejecuta cuando se crea una notificación in-app de tipo business_unconfigured.
Debería invocar la Edge Function notify-business-unconfigured para enviar email al owner.';

-- Crear trigger en tabla in_app_notifications
DROP TRIGGER IF EXISTS trg_notify_business_unconfigured ON public.in_app_notifications;
CREATE TRIGGER trg_notify_business_unconfigured
AFTER INSERT
ON public.in_app_notifications
FOR EACH ROW
WHEN (NEW.type = 'business_unconfigured')
EXECUTE FUNCTION public.trigger_notify_business_unconfigured();

COMMENT ON TRIGGER trg_notify_business_unconfigured ON public.in_app_notifications IS 
'Trigger que llama a notify-business-unconfigured Edge Function cuando se crea notificación de negocio desconfigurado.';

-- =============================================
-- NOTA IMPORTANTE: 
-- =============================================
-- Para que el trigger pueda llamar a la Edge Function, se requiere:
-- 1. Extensión pg_net instalada en Supabase (disponible en proyectos cloud)
-- 2. O usar pg_cron para ejecutar HTTP requests periódicos
-- 3. O usar Supabase Webhooks (configuración en Dashboard)
--
-- ALTERNATIVA RECOMENDADA:
-- Configurar webhook en Supabase Dashboard:
-- 1. Ir a Database > Webhooks
-- 2. Crear webhook en tabla: in_app_notifications
-- 3. Evento: INSERT
-- 4. Filtro: record.type = 'business_unconfigured'
-- 5. URL: https://[PROJECT_REF].supabase.co/functions/v1/notify-business-unconfigured
-- 6. Headers: Authorization: Bearer [ANON_KEY]
-- =============================================
