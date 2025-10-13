-- ============================================================================
-- Migration: Add missing columns to businesses table
-- Created: 2025-01-11
-- Description: Adds category, legal entity type, tax identification, and legal name
-- ============================================================================

-- Add business category enum type
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

-- Add legal entity type
CREATE TYPE legal_entity_type AS ENUM (
  'company',       -- Empresa registrada
  'individual'     -- Persona natural / Independiente
);

-- Add new columns to businesses table
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS category business_category DEFAULT 'other',
ADD COLUMN IF NOT EXISTS legal_entity_type legal_entity_type DEFAULT 'individual',
ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50), -- NIT, RUT, or Cédula
ADD COLUMN IF NOT EXISTS legal_name TEXT,    -- Razón social or full legal name
ADD COLUMN IF NOT EXISTS registration_number VARCHAR(100); -- Registro mercantil

-- Add comments
COMMENT ON COLUMN businesses.category IS 'Business category/industry';
COMMENT ON COLUMN businesses.legal_entity_type IS 'Company (registered business) or Individual (independent professional)';
COMMENT ON COLUMN businesses.tax_id IS 'Tax identification number (NIT for companies, Cédula for individuals in Colombia)';
COMMENT ON COLUMN businesses.legal_name IS 'Legal registered name (Razón social for companies, full name for individuals)';
COMMENT ON COLUMN businesses.registration_number IS 'Commercial registry number (Registro mercantil)';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_businesses_category 
ON businesses(category);

CREATE INDEX IF NOT EXISTS idx_businesses_legal_entity_type 
ON businesses(legal_entity_type);

CREATE INDEX IF NOT EXISTS idx_businesses_tax_id 
ON businesses(tax_id) 
WHERE tax_id IS NOT NULL;

-- Update existing businesses to have default category
UPDATE businesses 
SET category = 'other' 
WHERE category IS NULL;
