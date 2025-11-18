-- =============================================
-- MIGRATION: Agregar tipo business_unconfigured al ENUM
-- DATE: 2025-11-16
-- DESCRIPTION: Agregar nuevo tipo de notificación para negocios desconfigurados
-- =============================================

-- Agregar nuevo valor al ENUM notification_type_enum
ALTER TYPE public.notification_type_enum ADD VALUE IF NOT EXISTS 'business_unconfigured';
COMMENT ON TYPE public.notification_type_enum IS 
'Tipos de notificaciones soportadas en el sistema.
business_unconfigured: Notificación cuando un negocio pierde configuración completa.';
