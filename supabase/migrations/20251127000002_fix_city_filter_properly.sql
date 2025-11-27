-- =============================================================================
-- Migration: Fix city filtering to actually work with city-specific filtering
-- =============================================================================
-- Description: Corrects the WHERE clause to properly filter by city name
--              Previous migration had correct JOIN but wrong filtering logic
-- Date: 2025-11-27
-- Issue: EXISTS subquery wasn't filtering the main results
-- =============================================================================

-- 1. Drop existing function
DROP FUNCTION IF EXISTS public.get_client_dashboard_data(UUID, TEXT, TEXT) CASCADE;

-- 2. Recreate with PROPERLY WORKING city filtering
CREATE OR REPLACE FUNCTION public.get_client_dashboard_data(
  p_client_id UUID,
  p_preferred_city_name TEXT DEFAULT NULL,
  p_preferred_region_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_result JSONB;
  v_stats JSONB;
  v_appointments JSONB;
  v_suggestions JSONB;
  v_favorites JSONB;
BEGIN
  -- 1. APPOINTMENTS (ordered via aggregate ORDER BY)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', a.id,
      'created_at', a.created_at,
      'updated_at', a.updated_at,
      'business_id', a.business_id,
      'location_id', a.location_id,
      'service_id', a.service_id,
      'client_id', a.client_id,
      'employee_id', a.employee_id,
      'start_time', a.start_time,
      'end_time', a.end_time,
      'status', a.status,
      'notes', a.notes,
      'price', a.price,
      'currency', a.currency,
      'businesses', jsonb_build_object(
        'id', b.id,
        'name', b.name,
        'description', b.description,
        'logo_url', b.logo_url,
        'banner_url', b.banner_url,
        'average_rating', b.average_rating,
        'total_reviews', b.total_reviews
      ),
      'services', jsonb_build_object(
        'id', s.id,
        'name', s.name,
        'description', s.description,
        'price', s.price,
        'currency', s.currency,
        'duration_minutes', s.duration_minutes
      ),
      'locations', jsonb_build_object(
        'id', l.id,
        'name', l.name,
        'address', l.address,
        'city', l.city
      ),
      'business_employees', jsonb_build_object(
        'id', emp.id,
        'full_name', emp.full_name,
        'email', emp.email,
        'avatar_url', emp.avatar_url
      )
    ) ORDER BY a.start_time DESC
  ), '[]'::jsonb)
  INTO v_appointments
  FROM appointments a
  INNER JOIN businesses b ON a.business_id = b.id
  INNER JOIN services s ON a.service_id = s.id
  INNER JOIN locations l ON a.location_id = l.id
  INNER JOIN profiles emp ON a.employee_id = emp.id
  WHERE a.client_id = p_client_id
    AND a.status IN ('pending', 'confirmed');

  -- 2. STATS (counts by status)
  SELECT jsonb_build_object(
    'pending_count', COALESCE(SUM(CASE WHEN a.status = 'pending' THEN 1 ELSE 0 END), 0),
    'completed_count', COALESCE(SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END), 0),
    'mandatory_reviews', COALESCE((
      SELECT COUNT(*)
      FROM appointments a2
      WHERE a2.client_id = p_client_id
        AND a2.status = 'completed'
        AND a2.completed_at IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM reviews r WHERE r.appointment_id = a2.id
        )
    ), 0)
  )
  INTO v_stats
  FROM appointments a
  WHERE a.client_id = p_client_id;

  -- 3. FAVORITES (businesses marked as favorites)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', b.id,
      'name', b.name,
      'description', b.description,
      'logo_url', b.logo_url,
      'banner_url', b.banner_url,
      'average_rating', b.average_rating,
      'total_reviews', b.total_reviews,
      'city', (SELECT city FROM locations WHERE business_id = b.id LIMIT 1)
    ) ORDER BY b.average_rating DESC NULLS LAST
  ), '[]'::jsonb)
  INTO v_favorites
  FROM business_favorites f
  INNER JOIN businesses b ON f.business_id = b.id
  WHERE f.user_id = p_client_id;

  -- 4. FREQUENT/RECENT BUSINESSES (3 random from last 10 visited, filtered by city/region)
  WITH frequent_businesses AS (
    SELECT DISTINCT
      b.id AS business_id,
      b.name AS business_name,
      b.description AS business_description,
      b.logo_url AS business_logo_url,
      b.banner_url AS business_banner_url,
      b.average_rating AS business_average_rating,
      b.total_reviews AS business_total_reviews,
      CASE 
        WHEN l.city ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
        THEN (SELECT c.name FROM cities c WHERE c.id = l.city::uuid LIMIT 1)
        ELSE l.city
      END AS city_name,
      l.state AS state_name,
      MAX(a.start_time) AS last_appointment
    FROM appointments a
    INNER JOIN businesses b ON a.business_id = b.id
    INNER JOIN locations l ON a.location_id = l.id
    WHERE a.client_id = p_client_id
      AND EXISTS (
        SELECT 1
        FROM business_employees be
        INNER JOIN profiles prof ON be.employee_id = prof.id
        WHERE be.business_id = b.id
          AND be.status = 'approved'
          AND be.is_active = true
          AND prof.is_active = true
      )
    GROUP BY b.id, b.name, b.description, b.logo_url, b.banner_url, b.average_rating, b.total_reviews, l.city, l.state
  ),
  last_10_visited AS (
    SELECT *
    FROM frequent_businesses
    WHERE (
      -- No filter: show all
      (p_preferred_city_name IS NULL AND p_preferred_region_name IS NULL)
      OR
      -- City filter: LIKE matching
      (p_preferred_city_name IS NOT NULL AND UPPER(city_name) LIKE UPPER(p_preferred_city_name) || '%')
      OR
      -- Region-only filter: exact state match
      (p_preferred_city_name IS NULL AND p_preferred_region_name IS NOT NULL AND state_name = p_preferred_region_name)
    )
    ORDER BY last_appointment DESC
    LIMIT 10
  )
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', business_id,
      'name', business_name,
      'description', business_description,
      'logo_url', business_logo_url,
      'banner_url', business_banner_url,
      'average_rating', business_average_rating,
      'total_reviews', business_total_reviews,
      'city', city_name,
      'isFrequent', true
    ) ORDER BY RANDOM()
  ), '[]'::jsonb)
  INTO v_suggestions
  FROM last_10_visited
  LIMIT 3;

  -- 5. RECOMMENDATIONS (businesses WITHOUT appointments, filtered by city/region)
  WITH location_stats AS (
    SELECT
      b.id AS business_id,
      b.name AS business_name,
      b.description AS business_description,
      b.logo_url AS business_logo_url,
      b.banner_url AS business_banner_url,
      b.average_rating AS business_average_rating,
      b.total_reviews AS business_total_reviews,
      (SELECT l.city FROM locations l WHERE l.business_id = b.id LIMIT 1) AS location_city,
      (SELECT l.state FROM locations l WHERE l.business_id = b.id LIMIT 1) AS location_state,
      CASE 
        WHEN (SELECT l.city FROM locations l WHERE l.business_id = b.id LIMIT 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
        THEN (SELECT c.name FROM cities c WHERE c.id = (SELECT l.city FROM locations l WHERE l.business_id = b.id LIMIT 1)::uuid LIMIT 1)
        ELSE (SELECT l.city FROM locations l WHERE l.business_id = b.id LIMIT 1)
      END AS city_name
    FROM businesses b
    WHERE EXISTS (
      SELECT 1
      FROM business_employees be
      INNER JOIN profiles prof ON be.employee_id = prof.id
      WHERE be.business_id = b.id
        AND be.status = 'approved'
        AND be.is_active = true
        AND prof.is_active = true
    )
    AND NOT EXISTS (
      SELECT 1
      FROM appointments a
      WHERE a.business_id = b.id
        AND a.client_id = p_client_id
    )
  )
  SELECT COALESCE(
    v_suggestions || jsonb_agg(
      jsonb_build_object(
        'id', ls.business_id,
        'name', ls.business_name,
        'description', ls.business_description,
        'logo_url', ls.business_logo_url,
        'banner_url', ls.business_banner_url,
        'average_rating', ls.business_average_rating,
        'total_reviews', ls.business_total_reviews,
        'city', ls.city_name,
        'isFrequent', false
      ) ORDER BY
        CASE 
          WHEN p_preferred_city_name IS NULL THEN 1 
          WHEN UPPER(ls.city_name) LIKE UPPER(p_preferred_city_name) || '%' THEN 0 
          ELSE 2 
        END,
        ls.business_average_rating DESC NULLS LAST,
        ls.business_total_reviews DESC NULLS LAST
    ),
    v_suggestions
  )
  INTO v_suggestions
  FROM location_stats ls
  WHERE (
    (p_preferred_city_name IS NULL AND p_preferred_region_name IS NULL)
    OR
    (p_preferred_city_name IS NOT NULL AND UPPER(ls.city_name) LIKE UPPER(p_preferred_city_name) || '%')
    OR
    (p_preferred_city_name IS NULL AND p_preferred_region_name IS NOT NULL AND ls.location_state = p_preferred_region_name)
  );

  -- 6. Combine all into single JSONB response
  v_result := jsonb_build_object(
    'appointments', v_appointments,
    'stats', v_stats,
    'favorites', v_favorites,
    'suggestions', v_suggestions
  );

  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in get_client_dashboard_data for client %: %', p_client_id, SQLERRM;
    RETURN jsonb_build_object(
      'appointments', '[]'::jsonb,
      'stats', jsonb_build_object('pending_count', 0, 'completed_count', 0, 'mandatory_reviews', 0),
      'favorites', '[]'::jsonb,
      'suggestions', '[]'::jsonb,
      'error', SQLERRM
    );
END;
$$;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION public.get_client_dashboard_data(UUID, TEXT, TEXT) TO authenticated;

-- 4. Add comment
COMMENT ON FUNCTION public.get_client_dashboard_data(UUID, TEXT, TEXT) IS 
  'Returns comprehensive dashboard data for a client with frequent businesses (with appointments) AND recommendations (without appointments), both filtered by city';
