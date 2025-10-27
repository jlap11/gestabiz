-- ============================================================================
-- MIGRACIÓN: Habilitar RLS en tablas de catálogo público
-- Fecha: 21 de octubre, 2025
-- Descripción: Habilitar RLS en tablas de catálogo (countries, regions, cities,
--              genders, document_types, health_insurance, business_plans) con
--              política de lectura pública para cumplir con mejores prácticas
-- ============================================================================

-- Habilitar RLS en tablas de catálogo
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_insurance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_plans ENABLE ROW LEVEL SECURITY;

-- Crear políticas de lectura pública para catálogos
-- Todos los usuarios pueden leer estos datos sin restricción

DROP POLICY IF EXISTS "Public read access to countries" ON public.countries;
CREATE POLICY "Public read access to countries" 
  ON public.countries 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Public read access to regions" ON public.regions;
CREATE POLICY "Public read access to regions" 
  ON public.regions 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Public read access to cities" ON public.cities;
CREATE POLICY "Public read access to cities" 
  ON public.cities 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Public read access to genders" ON public.genders;
CREATE POLICY "Public read access to genders" 
  ON public.genders 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Public read access to document_types" ON public.document_types;
CREATE POLICY "Public read access to document_types" 
  ON public.document_types 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Public read access to health_insurance" ON public.health_insurance;
CREATE POLICY "Public read access to health_insurance" 
  ON public.health_insurance 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Public read access to business_plans" ON public.business_plans;
CREATE POLICY "Public read access to business_plans" 
  ON public.business_plans 
  FOR SELECT 
  USING (true);

-- Comentarios
COMMENT ON POLICY "Public read access to countries" ON public.countries IS 
'Permite lectura pública de países - datos de catálogo sin restricción';

COMMENT ON POLICY "Public read access to regions" ON public.regions IS 
'Permite lectura pública de regiones/departamentos - datos de catálogo sin restricción';

COMMENT ON POLICY "Public read access to cities" ON public.cities IS 
'Permite lectura pública de ciudades - datos de catálogo sin restricción';

COMMENT ON POLICY "Public read access to genders" ON public.genders IS 
'Permite lectura pública de géneros - datos de catálogo sin restricción';

COMMENT ON POLICY "Public read access to document_types" ON public.document_types IS 
'Permite lectura pública de tipos de documento - datos de catálogo sin restricción';

COMMENT ON POLICY "Public read access to health_insurance" ON public.health_insurance IS 
'Permite lectura pública de seguros de salud - datos de catálogo sin restricción';

COMMENT ON POLICY "Public read access to business_plans" ON public.business_plans IS 
'Permite lectura pública de planes de negocio - datos de catálogo sin restricción';
