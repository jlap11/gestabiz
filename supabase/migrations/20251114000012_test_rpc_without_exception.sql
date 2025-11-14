-- =============================================================================
-- Temporal: RPC sin exception handler para ver errores reales
-- =============================================================================

DROP FUNCTION IF EXISTS public.get_client_dashboard_data(UUID, TEXT) CASCADE;

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
  -- 1. APPOINTMENTS
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', a.id,
      'created_at', a.created_at,
      'business_id', a.business_id
    )
  ), '[]'::jsonb) INTO v_appointments
  FROM appointments a
  WHERE a.client_id = p_client_id;

  -- 2. STATS  
  SELECT jsonb_build_object(
    'totalAppointments', COUNT(*)
  ) INTO v_stats
  FROM appointments
  WHERE client_id = p_client_id;

  -- 3. SUGGESTIONS
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
      loc.city AS location_city
    FROM locations loc
    WHERE loc.business_id IN (SELECT id FROM unique_businesses)
    ORDER BY loc.business_id, loc.created_at ASC
  ),
  sorted_businesses AS (
    SELECT 
      b.id,
      b.name,
      COALESCE(bl.location_city, 'Sin ubicación') AS city
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
      'city', city
    )
  ), '[]'::jsonb) INTO v_suggestions
  FROM sorted_businesses;

  -- 4. RESULT
  v_result := jsonb_build_object(
    'appointments', v_appointments,
    'reviewedAppointmentIds', '[]'::jsonb,
    'pendingReviewsCount', 0,
    'favorites', '[]'::jsonb,
    'suggestions', v_suggestions,
    'stats', v_stats
  );

  RETURN v_result;

  -- NO EXCEPTION HANDLER - Queremos ver el error real
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_client_dashboard_data(UUID, TEXT) TO authenticated;
