-- =====================================================
-- Migration: Fix city UUID display in dashboard favorites
-- Date: 2025-11-27
-- Problem: get_client_dashboard_data returns raw city UUIDs in favorites section
-- Solution: Apply same city resolution logic as get_user_favorite_businesses
-- =====================================================

-- Drop existing function (with CASCADE to drop dependencies)
DROP FUNCTION IF EXISTS public.get_client_dashboard_data(UUID, TEXT, TEXT) CASCADE;
-- Recreate function with city name resolution in favorites section
CREATE OR REPLACE FUNCTION public.get_client_dashboard_data(
  p_client_id UUID,
  p_preferred_city_name TEXT DEFAULT NULL,
  p_preferred_region_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_appointments JSONB;
  v_reviewed_appointment_ids JSONB;
  v_pending_reviews_count INTEGER;
  v_favorites JSONB;
  v_suggestions JSONB;
  v_stats JSONB;
  v_uuid_regex TEXT := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
BEGIN
  -- 1. APPOINTMENTS (últimas 50 citas con relaciones completas)
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
      'business', CASE WHEN b.id IS NOT NULL THEN jsonb_build_object(
        'id', b.id,
        'name', b.name,
        'description', b.description,
        'logo_url', b.logo_url,
        'banner_url', b.banner_url,
        'average_rating', b.average_rating,
        'total_reviews', b.total_reviews,
        'city', b.city,
        'state', b.state
      ) ELSE NULL END,
      'location', CASE WHEN l.id IS NOT NULL THEN jsonb_build_object(
        'id', l.id,
        'name', l.name,
        'address', l.address,
        'city', l.city,
        'state', l.state,
        'postal_code', l.postal_code,
        'country', l.country,
        'latitude', l.latitude,
        'longitude', l.longitude,
        'google_maps_url', l.google_maps_url
      ) ELSE NULL END,
      'employee', CASE WHEN emp.id IS NOT NULL THEN jsonb_build_object(
        'id', emp.id,
        'full_name', emp.full_name,
        'email', emp.email,
        'phone', emp.phone,
        'avatar_url', emp.avatar_url
      ) ELSE NULL END,
      'client', CASE WHEN cli.id IS NOT NULL THEN jsonb_build_object(
        'id', cli.id,
        'full_name', cli.full_name,
        'email', cli.email,
        'phone', cli.phone,
        'avatar_url', cli.avatar_url
      ) ELSE NULL END,
      'service', CASE WHEN s.id IS NOT NULL THEN jsonb_build_object(
        'id', s.id,
        'name', s.name,
        'description', s.description,
        'duration_minutes', s.duration_minutes,
        'price', s.price,
        'currency', s.currency,
        'image_url', s.image_url,
        'category', s.category
      ) ELSE NULL END,
      'review_id', r.id,
      'has_review', CASE WHEN r.id IS NOT NULL THEN TRUE ELSE FALSE END
    ) ORDER BY a.start_time DESC
  ), '[]'::jsonb)
  INTO v_appointments
  FROM appointments a
  LEFT JOIN businesses b ON a.business_id = b.id
  LEFT JOIN locations l ON a.location_id = l.id
  LEFT JOIN profiles emp ON a.employee_id = emp.id
  LEFT JOIN profiles cli ON a.client_id = cli.id
  LEFT JOIN services s ON a.service_id = s.id
  LEFT JOIN reviews r ON r.appointment_id = a.id
  WHERE a.client_id = p_client_id
  ORDER BY a.start_time DESC
  LIMIT 50;

  -- 2. STATS (contadores de citas por status)
  SELECT jsonb_build_object(
    'totalAppointments', COUNT(*),
    'completedAppointments', COUNT(*) FILTER (WHERE a.status = 'completed'),
    'upcomingAppointments', COUNT(*) FILTER (WHERE a.status IN ('confirmed', 'pending_confirmation', 'pending')),
    'cancelledAppointments', COUNT(*) FILTER (WHERE a.status = 'cancelled')
  )
  INTO v_stats
  FROM appointments a
  WHERE a.client_id = p_client_id;

  -- 3. FAVORITES (businesses marked as favorites) ✨ WITH CITY RESOLUTION
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', b.id,
      'name', b.name,
      'description', b.description,
      'logo_url', b.logo_url,
      'banner_url', b.banner_url,
      'average_rating', b.average_rating,
      'total_reviews', b.total_reviews,
      'city', CASE 
        -- ✅ FIX: Resolve city UUID to name using locations → cities join
        WHEN (SELECT l.city FROM locations l WHERE l.business_id = b.id LIMIT 1) ~ v_uuid_regex
        THEN (SELECT c.name FROM cities c WHERE c.id = (SELECT l.city FROM locations l WHERE l.business_id = b.id LIMIT 1)::uuid LIMIT 1)
        ELSE (SELECT l.city FROM locations l WHERE l.business_id = b.id LIMIT 1)
      END
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
        WHEN l.city ~ v_uuid_regex
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
          AND be.is_active = TRUE
          AND prof.is_active = TRUE
      )
      AND b.is_active = TRUE
      AND a.status = 'completed'
    GROUP BY b.id, b.name, b.description, b.logo_url, b.banner_url, b.average_rating, b.total_reviews, l.city, l.state
    ORDER BY MAX(a.start_time) DESC
    LIMIT 10
  ),
  filtered_frequents AS (
    SELECT 
      business_id,
      business_name,
      business_description,
      business_logo_url,
      business_banner_url,
      business_average_rating,
      business_total_reviews,
      city_name,
      state_name
    FROM frequent_businesses
    WHERE 
      (p_preferred_city_name IS NULL OR LOWER(city_name) = LOWER(p_preferred_city_name))
      AND
      (p_preferred_region_name IS NULL OR LOWER(state_name) = LOWER(p_preferred_region_name))
  ),
  random_frequents AS (
    SELECT * FROM filtered_frequents
    ORDER BY RANDOM()
    LIMIT 3
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
      'state', state_name,
      'relevance_score', 1.0,
      'isFrequent', TRUE
    )
  ), '[]'::jsonb)
  INTO v_suggestions
  FROM random_frequents;

  -- 5. REVIEWED APPOINTMENT IDS
  SELECT COALESCE(jsonb_agg(r.appointment_id), '[]'::jsonb)
  INTO v_reviewed_appointment_ids
  FROM reviews r
  WHERE r.user_id = p_client_id;

  -- 6. PENDING REVIEWS COUNT
  SELECT COUNT(*)
  INTO v_pending_reviews_count
  FROM appointments a
  WHERE a.client_id = p_client_id
    AND a.status = 'completed'
    AND NOT EXISTS (
      SELECT 1 FROM reviews r WHERE r.appointment_id = a.id
    );

  -- Build final response
  RETURN jsonb_build_object(
    'appointments', v_appointments,
    'reviewedAppointmentIds', v_reviewed_appointment_ids,
    'pendingReviewsCount', v_pending_reviews_count,
    'favorites', v_favorites,
    'suggestions', v_suggestions,
    'stats', v_stats
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in get_client_dashboard_data for client %: %', p_client_id, SQLERRM;
    RETURN jsonb_build_object(
      'appointments', '[]'::jsonb,
      'reviewedAppointmentIds', '[]'::jsonb,
      'pendingReviewsCount', 0,
      'favorites', '[]'::jsonb,
      'suggestions', '[]'::jsonb,
      'stats', jsonb_build_object(
        'totalAppointments', 0,
        'completedAppointments', 0,
        'upcomingAppointments', 0,
        'cancelledAppointments', 0
      )
    );
END;
$$;
-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_client_dashboard_data(UUID, TEXT, TEXT) TO authenticated;
-- Add comment
COMMENT ON FUNCTION public.get_client_dashboard_data(UUID, TEXT, TEXT) IS 
  'Returns consolidated dashboard data for a client including appointments, stats, favorites (with city name resolution), suggestions filtered by preferred city/region';
