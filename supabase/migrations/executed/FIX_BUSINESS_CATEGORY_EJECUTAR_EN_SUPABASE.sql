-- ============================================================================
-- EJECUTAR ESTE SCRIPT EN SUPABASE SQL EDITOR
-- ============================================================================
-- Este script agrega las columnas faltantes a la tabla businesses
-- y permite crear negocios con categorías

-- Paso 1: Crear enum de categorías si no existe
DO $$ BEGIN
    CREATE TYPE business_category AS ENUM (
      'health',        -- Salud (médicos, dentistas, fisioterapia)
      'beauty',        -- Belleza (peluquerías, spas, estética)
      'fitness',       -- Fitness (gimnasios, yoga, entrenadores)
      'education',     -- Educación (tutorías, cursos, academias)
      'consulting',    -- Consultoría (coaches, asesores)
      'professional',  -- Servicios profesionales (abogados, contadores)
      'maintenance',   -- Mantenimiento (mecánicos, técnicos)
      'food',          -- Alimentos (restaurantes, chefs)
      'entertainment', -- Entretenimiento (fotografía, eventos)
      'other'          -- Otros
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Paso 2: Crear enum de tipo de entidad legal si no existe
DO $$ BEGIN
    CREATE TYPE legal_entity_type AS ENUM (
      'company',       -- Empresa registrada
      'individual'     -- Persona natural / Independiente
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Paso 3: Agregar columnas a la tabla businesses
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS category business_category DEFAULT 'other',
ADD COLUMN IF NOT EXISTS legal_entity_type legal_entity_type DEFAULT 'individual',
ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50), -- NIT, RUT, or Cédula
ADD COLUMN IF NOT EXISTS legal_name TEXT,    -- Razón social or full legal name
ADD COLUMN IF NOT EXISTS registration_number VARCHAR(100); -- Registro mercantil

-- Paso 4: Agregar comentarios
COMMENT ON COLUMN businesses.category IS 'Business category/industry';
COMMENT ON COLUMN businesses.legal_entity_type IS 'Company (registered business) or Individual (independent professional)';
COMMENT ON COLUMN businesses.tax_id IS 'Tax identification number (NIT for companies, Cédula for individuals in Colombia)';
COMMENT ON COLUMN businesses.legal_name IS 'Legal registered name (Razón social for companies, full name for individuals)';
COMMENT ON COLUMN businesses.registration_number IS 'Commercial registry number (Registro mercantil)';

-- Paso 5: Crear índices
CREATE INDEX IF NOT EXISTS idx_businesses_category 
ON businesses(category);

CREATE INDEX IF NOT EXISTS idx_businesses_legal_entity_type 
ON businesses(legal_entity_type);

CREATE INDEX IF NOT EXISTS idx_businesses_tax_id 
ON businesses(tax_id) 
WHERE tax_id IS NOT NULL;

-- Paso 6: Actualizar negocios existentes
UPDATE businesses 
SET category = 'other' 
WHERE category IS NULL;

-- Paso 7: Agregar columnas a locations (imágenes y horarios por sede)
ALTER TABLE public.locations
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{
  "monday": {"open": "09:00", "close": "18:00", "closed": false},
  "tuesday": {"open": "09:00", "close": "18:00", "closed": false},
  "wednesday": {"open": "09:00", "close": "18:00", "closed": false},
  "thursday": {"open": "09:00", "close": "18:00", "closed": false},
  "friday": {"open": "09:00", "close": "18:00", "closed": false},
  "saturday": {"open": "09:00", "close": "14:00", "closed": false},
  "sunday": {"open": "09:00", "close": "18:00", "closed": true}
}'::jsonb,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Paso 8: Agregar comentarios a locations
COMMENT ON COLUMN locations.images IS 'Array of image URLs for this location (from Supabase Storage)';
COMMENT ON COLUMN locations.business_hours IS 'Operating hours specific to this location';
COMMENT ON COLUMN locations.description IS 'Description of this specific location/branch';

-- Listo! Ahora puedes crear negocios con categoría
SELECT 'Migración completada exitosamente!' as status;
