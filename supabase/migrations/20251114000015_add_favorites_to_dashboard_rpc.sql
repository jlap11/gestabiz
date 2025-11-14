-- =============================================================================
-- Migration: Add favorites query to get_client_dashboard_data RPC
-- =============================================================================
-- Description: Replaces hardcoded empty array with actual favorites query
-- =============================================================================

-- 1. Drop existing function
DROP FUNCTION IF EXISTS public.get_client_dashboard_data(UUID, TEXT) CASCADE;

-- 2. Recreate with favorites query
CREATE OR REPLACE FUNCTION public.get_client_dashboard_data(
  p_client_id UUID,
  p_preferred_city_name TEXT DEFAULT NULL
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
      'locations', jsonb_build_object(
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
      ),
      'employee', jsonb_build_object(
        'id', emp.id,
        'full_name', emp.full_name,
        'email', emp.email,
        'phone', emp.phone,
        'avatar_url', emp.avatar_url
      ),
      'client', jsonb_build_object(
        'id', cli.id,
        'full_name', cli.full_name,
        'email', cli.email,
        'phone', cli.phone,
        'avatar_url', cli.avatar_url
      ),
      'services', jsonb_build_object(
        'id', s.id,
        'name', s.name,
        'description', s.description,
        'duration_minutes', s.duration_minutes,
        'price', s.price,
        'currency', s.currency,
        'image_url', s.image_url,
        'category', s.category
      ),
      'review_id', r.id,
      'has_review', CASE WHEN r.id IS NOT NULL THEN true ELSE false END
    ) ORDER BY a.start_time ASC
  ), '[]'::jsonb) INTO v_appointments
  FROM appointments a
  INNER JOIN businesses b ON a.business_id = b.id
  INNER JOIN locations l ON a.location_id = l.id
  INNER JOIN services s ON a.service_id = s.id
  INNER JOIN profiles emp ON a.employee_id = emp.id
  INNER JOIN profiles cli ON a.client_id = cli.id
  LEFT JOIN reviews r ON a.id = r.appointment_id
  WHERE a.client_id = p_client_id;

  -- 2. STATS
  SELECT jsonb_build_object(
    'totalAppointments', COUNT(*),
    'completedAppointments', COUNT(*) FILTER (WHERE status = 'completed'),
    'upcomingAppointments', COUNT(*) FILTER (WHERE status IN ('pending','confirmed') AND start_time > NOW()),
    'cancelledAppointments', COUNT(*) FILTER (WHERE status = 'cancelled')
  ) INTO v_stats
  FROM appointments
  WHERE client_id = p_client_id;

  -- 3. FAVORITES (NEW QUERY - replaces hardcoded empty array)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', b.id,
      'name', b.name,
      'description', b.description,
      'logo_url', b.logo_url,
      'address', b.address,
      'city', b.city,
      'phone', b.phone,
      'average_rating', b.average_rating,
      'review_count', b.total_reviews,
      'is_active', b.is_active,
      'favorited_at', bf.created_at
    ) ORDER BY bf.created_at DESC
  ), '[]'::jsonb) INTO v_favorites
  FROM business_favorites bf
  INNER JOIN businesses b ON bf.business_id = b.id
  WHERE bf.user_id = p_client_id;

  -- 4. SUGGESTIONS (unchanged from previous migration)
  WITH unique_businesses AS (
    SELECT DISTINCT b.id
    FROM businesses b
    INNER JOIN business_employees be ON b.id = be.business_id
    INNER JOIN profiles p ON be.employee_id = p.id
    WHERE be.status = 'approved'
      AND be.is_active = true
      AND p.is_active = true
      AND (p_preferred_city_name IS NULL OR EXISTS (
        SELECT 1
        FROM locations loc
        WHERE loc.business_id = b.id
          AND loc.city = p_preferred_city_name
      ))
      AND NOT EXISTS (
        SELECT 1
        FROM appointments a
        WHERE a.business_id = b.id
          AND a.client_id = p_client_id
      )
  ),
  business_locations AS (
    SELECT DISTINCT ON (business_id)
      loc.business_id,
      loc.id AS location_id,
      loc.name AS location_name,
      loc.address AS location_address,
      loc.city AS location_city,
      loc.state AS location_state,
      loc.country AS location_country
    FROM locations loc
    WHERE loc.business_id IN (SELECT id FROM unique_businesses)
    ORDER BY loc.business_id, loc.created_at ASC
  ),
  sorted_businesses AS (
    SELECT 
      b.id,
      b.name,
      b.description,
      b.logo_url,
      b.banner_url,
      b.category,
      b.average_rating,
      b.total_reviews,
      loc.location_city AS city,
      loc.location_state AS state,
      1.0 AS relevance_score
    FROM businesses b
    INNER JOIN unique_businesses ub ON b.id = ub.id
    LEFT JOIN business_locations loc ON b.id = loc.business_id
    ORDER BY 
      CASE WHEN p_preferred_city_name IS NULL THEN 1 
           WHEN loc.location_city = p_preferred_city_name THEN 0 
           ELSE 2 
      END,
      b.average_rating DESC NULLS LAST,
      b.total_reviews DESC NULLS LAST
    LIMIT 10
  )
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', sb.id,
      'name', sb.name,
      'description', sb.description,
      'logo_url', sb.logo_url,
      'banner_url', sb.banner_url,
      'average_rating', sb.average_rating,
      'total_reviews', sb.total_reviews,
      'city', sb.city,
      'state', sb.state,
      'relevance_score', sb.relevance_score
    )
  ), '[]'::jsonb) INTO v_suggestions
  FROM sorted_businesses sb;

  -- 5. BUILD FINAL RESULT
  SELECT jsonb_build_object(
    'appointments', v_appointments,
    'reviewedAppointmentIds', (
      SELECT COALESCE(jsonb_agg(a.id), '[]'::jsonb)
      FROM appointments a
      INNER JOIN reviews r ON a.id = r.appointment_id
      WHERE a.client_id = p_client_id
    ),
    'pendingReviewsCount', (
      SELECT COUNT(*)
      FROM appointments a
      WHERE a.client_id = p_client_id
        AND a.status = 'completed'
        AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.appointment_id = a.id)
    ),
    'favorites', v_favorites,
    'suggestions', v_suggestions,
    'stats', v_stats
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_client_dashboard_data(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION public.get_client_dashboard_data(UUID, TEXT) IS 'Consolidated client dashboard payload with favorites, city-name filtering and sorted suggestions.';

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
