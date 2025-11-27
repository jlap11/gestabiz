-- Actualizar función get_user_favorite_businesses para incluir banner_url
DROP FUNCTION IF EXISTS public.get_user_favorite_businesses() CASCADE;

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
    b.city,
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

COMMENT ON FUNCTION get_user_favorite_businesses IS 'Obtiene todos los negocios favoritos del usuario con información completa incluyendo banner_url';
