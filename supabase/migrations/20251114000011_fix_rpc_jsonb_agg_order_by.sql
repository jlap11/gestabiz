-- =============================================================================
-- Migration: Fix RPC jsonb_agg ORDER BY issue
-- Purpose: Fix GROUP BY error when using ORDER BY with jsonb_agg
-- Solution: Use sorted_businesses CTE before aggregating to JSONB
-- =============================================================================

-- Drop old function completely
DROP FUNCTION IF EXISTS public.get_client_dashboard_data(UUID, TEXT) CASCADE;
-- Recreate with fixed sorted_businesses CTE
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
BEGIN
  -- =============================================================================
  -- 1. APPOINTMENTS (con joins completos)
  -- =============================================================================
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
    )
  ), '[]'::jsonb) INTO v_appointments
  FROM appointments a
  INNER JOIN businesses b ON a.business_id = b.id
  INNER JOIN locations l ON a.location_id = l.id
  INNER JOIN services s ON a.service_id = s.id
  INNER JOIN profiles emp ON a.employee_id = emp.id
  INNER JOIN profiles cli ON a.client_id = cli.id
  LEFT JOIN reviews r ON a.id = r.appointment_id
  WHERE a.client_id = p_client_id
  ORDER BY a.start_time ASC;

  -- =============================================================================
  -- 2. STATS (agregados)
  -- =============================================================================
  SELECT jsonb_build_object(
    'totalAppointments', COUNT(*),
    'completedAppointments', COUNT(*) FILTER (WHERE status = 'completed'),
    'upcomingAppointments', COUNT(*) FILTER (WHERE status IN ('pending', 'confirmed') AND start_time > NOW()),
    'cancelledAppointments', COUNT(*) FILTER (WHERE status = 'cancelled')
  ) INTO v_stats
  FROM appointments
  WHERE client_id = p_client_id;

  -- =============================================================================
  -- 3. SUGGESTIONS (con CTE deduplication y city filter por NOMBRE)
  -- FIX: Usar sorted_businesses CTE ANTES de jsonb_agg para evitar GROUP BY error
  -- =============================================================================
  WITH unique_businesses AS (
    SELECT DISTINCT b.id
    FROM businesses b
    INNER JOIN business_employees be ON b.id = be.business_id
    INNER JOIN profiles p ON be.employee_id = p.id
    WHERE be.status = 'approved'
      AND be.is_active = true
      AND p.is_active = true
      -- ✅ Filter by city NAME if provided
      AND (p_preferred_city_name IS NULL OR EXISTS (
        SELECT 1
        FROM locations loc
        WHERE loc.business_id = b.id
          AND loc.city = p_preferred_city_name
      ))
      -- ✅ Client NOT in this business (exclude businesses where client already has appointments)
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
    -- ✅ FIX: Ordenar y limitar ANTES de jsonb_agg
    SELECT 
      b.id,
      b.name,
      b.description,
      b.logo_url,
      b.banner_url,
      b.category,
      b.average_rating,
      b.total_reviews,
      COALESCE(bl.location_city, 'Sin ubicación') AS city,
      COALESCE(bl.location_state, '') AS state,
      COALESCE(bl.location_country, 'Colombia') AS country
    FROM businesses b
    INNER JOIN unique_businesses ub ON b.id = ub.id
    LEFT JOIN business_locations bl ON b.id = bl.business_id
    ORDER BY b.average_rating DESC NULLS LAST, b.total_reviews DESC
    LIMIT 6
  )
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', id,
      'name', name,
      'description', description,
      'logo_url', logo_url,
      'banner_url', banner_url,
      'category', category,
      'average_rating', average_rating,
      'total_reviews', total_reviews,
      'city', city,
      'state', state,
      'country', country
    )
  ), '[]'::jsonb) INTO v_suggestions
  FROM sorted_businesses;

  -- =============================================================================
  -- 4. RESULT AGGREGATION
  -- =============================================================================
  v_result := jsonb_build_object(
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
    'favorites', '[]'::jsonb, -- TODO: Implementar favoritos
    'suggestions', v_suggestions,
    'stats', v_stats
  );

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  -- Log error y retornar data vacía
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
-- Grants
GRANT EXECUTE ON FUNCTION public.get_client_dashboard_data(UUID, TEXT) TO authenticated;
-- Comment
COMMENT ON FUNCTION public.get_client_dashboard_data(UUID, TEXT) IS 
'Consolidated RPC: Returns all client dashboard data. Uses sorted_businesses CTE to avoid GROUP BY errors with jsonb_agg.';
-- =============================================================================
-- END OF MIGRATION
-- =============================================================================;
