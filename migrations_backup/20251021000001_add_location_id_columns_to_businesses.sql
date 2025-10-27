-- ============================================================================
-- MIGRACIÓN: Agregar columnas de ubicación (región, ciudad, país) a businesses
-- Fecha: 21 de octubre, 2025
-- Descripción: Agregar region_id, city_id, country_id como UUIDs para 
--              reemplazar los campos de texto state, city, country
-- ============================================================================

-- Agregar columnas a businesses si no existen
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS region_id UUID,
ADD COLUMN IF NOT EXISTS city_id UUID,
ADD COLUMN IF NOT EXISTS country_id UUID;

-- Agregar foreign keys a las nuevas columnas
ALTER TABLE public.businesses
ADD CONSTRAINT fk_businesses_country_id 
  FOREIGN KEY (country_id) REFERENCES public.countries(id) ON DELETE SET NULL;

ALTER TABLE public.businesses
ADD CONSTRAINT fk_businesses_region_id 
  FOREIGN KEY (region_id) REFERENCES public.regions(id) ON DELETE SET NULL;

ALTER TABLE public.businesses
ADD CONSTRAINT fk_businesses_city_id 
  FOREIGN KEY (city_id) REFERENCES public.cities(id) ON DELETE SET NULL;

-- Crear índices para performance
CREATE INDEX IF NOT EXISTS idx_businesses_country_id ON public.businesses(country_id);
CREATE INDEX IF NOT EXISTS idx_businesses_region_id ON public.businesses(region_id);
CREATE INDEX IF NOT EXISTS idx_businesses_city_id ON public.businesses(city_id);

-- Comentarios
COMMENT ON COLUMN public.businesses.country_id IS 'UUID del país (FK a countries table)';
COMMENT ON COLUMN public.businesses.region_id IS 'UUID de la región/departamento (FK a regions table)';
COMMENT ON COLUMN public.businesses.city_id IS 'UUID de la ciudad (FK a cities table)';
