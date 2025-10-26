-- ============================================================================
-- MIGRACIÓN: Sistema de Notificaciones In-App
-- Fecha: 2025-10-13
-- Descripción: Feed de notificaciones persistente para usuarios con realtime
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. CREAR TIPO ENUM PARA STATUS (Safe pattern)
-- ============================================================================

-- Usar DO $$ BEGIN ... EXCEPTION para evitar error si ya existe
DO $$ BEGIN
  CREATE TYPE notification_status AS ENUM ('unread', 'read', 'archived');
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'El tipo notification_status ya existe, omitiendo creación';
END $$;

-- ============================================================================
-- 2. CREAR TABLA in_app_notifications
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.in_app_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    read_at TIMESTAMPTZ,
    
    -- Usuario destinatario
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Contexto de negocio (opcional, para filtrado)
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    
    -- Tipo y contenido
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    
    -- Datos adicionales (appointment_id, action, etc.)
    data JSONB DEFAULT '{}' NOT NULL,
    
    -- Estado y prioridad
    status notification_status DEFAULT 'unread' NOT NULL,
    priority SMALLINT DEFAULT 0 NOT NULL,
    
    -- URL de acción (opcional)
    action_url TEXT,
    
    -- Soft delete
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL
);

-- ============================================================================
-- 3. ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índice principal para consultas por usuario y fecha
CREATE INDEX idx_inapp_user_created_at 
ON public.in_app_notifications(user_id, created_at DESC) 
WHERE is_deleted = FALSE;

-- Índice para filtrar por estado
CREATE INDEX idx_inapp_user_status 
ON public.in_app_notifications(user_id, status) 
WHERE is_deleted = FALSE;

-- Índice para filtrar por negocio
CREATE INDEX idx_inapp_business 
ON public.in_app_notifications(business_id, created_at DESC) 
WHERE business_id IS NOT NULL AND is_deleted = FALSE;

-- Índice para filtrar por tipo
CREATE INDEX idx_inapp_type 
ON public.in_app_notifications(type, created_at DESC) 
WHERE is_deleted = FALSE;

-- Índice compuesto para consultas comunes
CREATE INDEX idx_inapp_user_status_priority 
ON public.in_app_notifications(user_id, status, priority DESC, created_at DESC) 
WHERE is_deleted = FALSE;

-- ============================================================================
-- 4. TRIGGER PARA updated_at
-- ============================================================================

CREATE TRIGGER update_in_app_notifications_updated_at 
BEFORE UPDATE ON public.in_app_notifications 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. COMENTARIOS
-- ============================================================================

COMMENT ON TABLE public.in_app_notifications IS 
'Feed de notificaciones in-app para usuarios. Sincronizado con notification_log para auditoría.';

COMMENT ON COLUMN public.in_app_notifications.type IS 
'Tipo de notificación: appointment_created, appointment_cancelled, appointment_rescheduled, reminder_24h, reminder_1h, reminder_15m, employee_request_approved, employee_request_rejected, system_announcement';

COMMENT ON COLUMN public.in_app_notifications.data IS 
'Datos adicionales en formato JSON: { appointment_id, action, business_name, etc. }';

COMMENT ON COLUMN public.in_app_notifications.priority IS 
'Prioridad de la notificación: 0=normal, 1=alta, 2=urgente, -1=baja';

COMMENT ON COLUMN public.in_app_notifications.action_url IS 
'URL relativa para navegación: /appointments/:id, /employee-requests, etc.';

-- ============================================================================
-- 6. HABILITAR RLS
-- ============================================================================

ALTER TABLE public.in_app_notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 7. POLÍTICAS RLS
-- ============================================================================

-- Los usuarios pueden ver sus propias notificaciones
CREATE POLICY "Users can view own notifications" 
ON public.in_app_notifications
FOR SELECT 
USING (auth.uid() = user_id AND is_deleted = FALSE);

-- Los usuarios pueden actualizar sus propias notificaciones (marcar leída, archivar)
CREATE POLICY "Users can update own notifications" 
ON public.in_app_notifications
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Solo service role puede insertar (vía Edge Functions)
-- No se crea policy INSERT para usuarios normales

-- Los usuarios pueden hacer soft delete de sus notificaciones
CREATE POLICY "Users can soft delete own notifications" 
ON public.in_app_notifications
FOR UPDATE 
USING (auth.uid() = user_id AND is_deleted = FALSE)
WITH CHECK (auth.uid() = user_id AND is_deleted = TRUE);

-- ============================================================================
-- 8. FUNCIÓN HELPER: Crear notificación in-app
-- ============================================================================

CREATE OR REPLACE FUNCTION create_in_app_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_body TEXT,
    p_data JSONB DEFAULT '{}',
    p_business_id UUID DEFAULT NULL,
    p_priority SMALLINT DEFAULT 0,
    p_action_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    -- Validar parámetros
    IF p_user_id IS NULL OR p_type IS NULL OR p_title IS NULL OR p_body IS NULL THEN
        RAISE EXCEPTION 'user_id, type, title and body are required';
    END IF;

    -- Insertar notificación
    INSERT INTO public.in_app_notifications (
        user_id,
        type,
        title,
        body,
        data,
        business_id,
        priority,
        action_url
    ) VALUES (
        p_user_id,
        p_type,
        p_title,
        p_body,
        p_data,
        p_business_id,
        p_priority,
        p_action_url
    )
    RETURNING id INTO v_notification_id;

    RETURN v_notification_id;
END;
$$;

COMMENT ON FUNCTION create_in_app_notification IS 
'Crea una notificación in-app para un usuario. Uso: SELECT create_in_app_notification(user_id, type, title, body, data::jsonb)';

-- ============================================================================
-- 9. FUNCIÓN HELPER: Marcar notificaciones como leídas
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_notifications_as_read(
    p_user_id UUID,
    p_notification_ids UUID[] DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Si se proporcionan IDs específicos, marcar solo esos
    IF p_notification_ids IS NOT NULL AND array_length(p_notification_ids, 1) > 0 THEN
        UPDATE public.in_app_notifications
        SET 
            status = 'read',
            read_at = NOW(),
            updated_at = NOW()
        WHERE 
            user_id = p_user_id 
            AND id = ANY(p_notification_ids)
            AND status = 'unread'
            AND is_deleted = FALSE;
    ELSE
        -- Si no se proporcionan IDs, marcar todas como leídas
        UPDATE public.in_app_notifications
        SET 
            status = 'read',
            read_at = NOW(),
            updated_at = NOW()
        WHERE 
            user_id = p_user_id 
            AND status = 'unread'
            AND is_deleted = FALSE;
    END IF;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

COMMENT ON FUNCTION mark_notifications_as_read IS 
'Marca notificaciones como leídas. Si no se proporcionan IDs, marca todas las no leídas del usuario.';

-- ============================================================================
-- 10. FUNCIÓN HELPER: Contar notificaciones no leídas
-- ============================================================================

CREATE OR REPLACE FUNCTION get_unread_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO v_count
    FROM public.in_app_notifications
    WHERE 
        user_id = p_user_id 
        AND status = 'unread'
        AND is_deleted = FALSE;

    RETURN v_count;
END;
$$;

COMMENT ON FUNCTION get_unread_count IS 
'Retorna el conteo de notificaciones no leídas de un usuario.';

-- ============================================================================
-- 11. FUNCIÓN HELPER: Limpiar notificaciones antiguas
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_notifications(days_old INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Soft delete de notificaciones leídas o archivadas más antiguas que X días
    UPDATE public.in_app_notifications
    SET 
        is_deleted = TRUE,
        updated_at = NOW()
    WHERE 
        status IN ('read', 'archived')
        AND created_at < NOW() - (days_old || ' days')::INTERVAL
        AND is_deleted = FALSE;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

COMMENT ON FUNCTION cleanup_old_notifications IS 
'Hace soft delete de notificaciones leídas/archivadas más antiguas que X días (default 90).';

COMMIT;
