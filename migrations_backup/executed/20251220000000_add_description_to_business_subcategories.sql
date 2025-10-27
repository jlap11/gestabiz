-- ============================================================================
-- Add description column to business_subcategories
-- ============================================================================
-- Esta migración agrega la columna description a business_subcategories
-- para permitir que cada negocio describa sus servicios específicos por subcategoría

-- Agregar columna description
ALTER TABLE public.business_subcategories
ADD COLUMN IF NOT EXISTS description TEXT;

-- Comentario
COMMENT ON COLUMN business_subcategories.description IS 'Descripción específica de los servicios que ofrece el negocio en esta subcategoría';
