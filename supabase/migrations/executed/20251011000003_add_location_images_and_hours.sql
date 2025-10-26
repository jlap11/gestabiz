-- ============================================================================
-- Migration: Add images support for locations
-- Created: 2025-01-11
-- Description: Adds image URLs array and business hours per location
-- ============================================================================

-- Add images array to locations
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
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add comments
COMMENT ON COLUMN locations.images IS 'Array of image URLs for this location (from Supabase Storage)';
COMMENT ON COLUMN locations.business_hours IS 'Operating hours specific to this location';
COMMENT ON COLUMN locations.description IS 'Description of this specific location/branch';
COMMENT ON COLUMN locations.email IS 'Contact email for this location';
