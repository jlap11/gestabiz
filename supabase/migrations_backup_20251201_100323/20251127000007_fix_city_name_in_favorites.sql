-- =============================================================================
-- Migration: Fix city name resolution in favorites
-- =============================================================================
-- Description: Update get_user_favorite_businesses to return actual city name
--              instead of UUID by resolving from locations table
-- Date: 2025-11-27
-- Issue: Favorites showing city UUID instead of city name
-- =============================================================================

-- 1. Drop existing function
DROP FUNCTION IF EXISTS public.get_user_favorite_businesses() CASCADE;
-- 2. Recreate with proper city name resolution
CREATE OR REPLACE FUNCTION public.get_user_favorite_businesses()
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  address TEXT,
  city TEXT,
  phone TEXT,
  average_rating DECIMAL(3,2),
  review_count BIGINT,
  is_active BOOLEAN,
  favorited_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.name,
    b.description,
    b.logo_url,
    b.banner_url,
    b.address,
    -- FIX: Resolve city name from first location instead of businesses.city
    CASE 
      WHEN (SELECT l.city FROM locations l WHERE l.business_id = b.id LIMIT 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
      THEN (SELECT c.name FROM cities c WHERE c.id = (SELECT l.city FROM locations l WHERE l.business_id = b.id LIMIT 1)::uuid LIMIT 1)
      ELSE (SELECT l.city FROM locations l WHERE l.business_id = b.id LIMIT 1)
    END AS city,
    b.phone,
    COALESCE(brs.average_rating, 0)::DECIMAL(3,2) AS average_rating,
    COALESCE(brs.review_count, 0)::BIGINT AS review_count,
    b.is_active,
    bf.created_at AS favorited_at
  FROM business_favorites bf
  INNER JOIN businesses b ON bf.business_id = b.id
  LEFT JOIN business_ratings_stats brs ON b.id = brs.business_id
  WHERE bf.user_id = v_user_id
  ORDER BY bf.created_at DESC;
END;
$$;
-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_favorite_businesses() TO authenticated;
-- 4. Add comment
COMMENT ON FUNCTION public.get_user_favorite_businesses IS 
  'Obtiene todos los negocios favoritos del usuario con información completa incluyendo banner_url y city name resuelto desde locations';
