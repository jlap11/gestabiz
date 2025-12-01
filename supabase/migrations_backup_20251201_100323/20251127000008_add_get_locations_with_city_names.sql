-- =============================================================================
-- Migration: Create helper function to get locations with resolved city names
-- =============================================================================
-- Description: Create a function that returns locations with city names resolved
--              from cities table instead of UUIDs
-- Date: 2025-11-27
-- Issue: Location modals showing city UUID instead of city name
-- =============================================================================

-- 1. Create function to get locations with resolved city names
CREATE OR REPLACE FUNCTION public.get_business_locations_with_city_names(
  p_business_id UUID
)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  business_id UUID,
  name TEXT,
  address TEXT,
  city TEXT,
  city_name TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  phone TEXT,
  email TEXT,
  is_active BOOLEAN,
  opens_at TIME,
  closes_at TIME,
  hours JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.created_at,
    l.updated_at,
    l.business_id,
    l.name,
    l.address,
    l.city,
    -- FIX: Resolve city name from cities table if city is a UUID
    CASE 
      WHEN l.city ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
      THEN COALESCE((SELECT c.name FROM cities c WHERE c.id = l.city::uuid LIMIT 1), l.city)
      ELSE l.city
    END AS city_name,
    l.state,
    l.country,
    l.postal_code,
    l.latitude,
    l.longitude,
    l.phone,
    l.email,
    l.is_active,
    l.opens_at,
    l.closes_at,
    l.hours
  FROM locations l
  WHERE l.business_id = p_business_id
    AND l.is_active = true
  ORDER BY l.name;
END;
$$;
-- 2. Grant permissions
GRANT EXECUTE ON FUNCTION public.get_business_locations_with_city_names(UUID) TO authenticated;
-- 3. Add comment
COMMENT ON FUNCTION public.get_business_locations_with_city_names(UUID) IS 
  'Returns business locations with city names resolved from cities table instead of UUIDs';
