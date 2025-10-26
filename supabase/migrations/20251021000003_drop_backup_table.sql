-- ============================================================================
-- MIGRACIÓN: Eliminar tabla de backup temporal
-- Fecha: 21 de octubre, 2025
-- Descripción: Eliminar business_categories_backup que es una tabla temporal
--              de desarrollo que no debería existir en producción
-- ============================================================================

-- Eliminar tabla de backup temporal
DROP TABLE IF EXISTS public.business_categories_backup CASCADE;

COMMENT ON SCHEMA public IS 'business_categories_backup eliminada - tabla temporal de desarrollo';
