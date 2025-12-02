-- Migration: Add business category to get_client_dashboard_data RPC
-- Date: 2025-12-01
-- Description: Include business category in the RPC response for filtering in ClientHistory

-- Drop existing function
DROP FUNCTION IF EXISTS get_client_dashboard_data(UUID, TEXT, TEXT);

-- Recreate function with business category included
CREATE OR REPLACE FUNCTION get_client_dashboard_data(
  p_client_id UUID,
  p_preferred_city_name TEXT DEFAULT NULL,
  p_preferred_region_name TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_appointments jsonb;
  v_reviewed_appointment_ids jsonb;
  v_suggestions jsonb;
  v_stats jsonb;
BEGIN
  -- =====================================================
  -- 1. APPOINTMENTS (todas: upcoming + history)
  -- =====================================================
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', apt.id,
      'business_id', apt.business_id,
      'location_id', apt.location_id,
      'service_id', apt.service_id,
      'client_id', apt.client_id,
      'employee_id', apt.employee_id,
      'start_time', apt.start_time,
      'end_time', apt.end_time,
      'status', apt.status,
      'notes', apt.notes,
      'price', apt.price,
      'currency', apt.currency,
      'created_at', apt.created_at,
      'updated_at', apt.updated_at,
      'business', jsonb_build_object(
        'id', b.id,
        'name', b.name,
        'description', b.description,
        'logo_url', b.logo_url,
        'banner_url', b.banner_url,
        'average_rating', b.average_rating,
        'total_reviews', b.total_reviews,
        'city', b.city,
        'state', b.state,
        'category_id', b.category_id,
        'category', CASE 
          WHEN bc.id IS NOT NULL THEN jsonb_build_object(
            'id', bc.id,
            'name', bc.name,
            'slug', bc.slug,
            'icon_name', bc.icon_name
          )
          ELSE NULL
        END
      ),
      'location', jsonb_build_object(
        'id', loc.id,
        'name', loc.name,
        'address', loc.address,
        'city', loc.city,
        'state', loc.state,
        'postal_code', loc.postal_code,
        'country', loc.country,
        'latitude', loc.latitude,
        'longitude', loc.longitude
      ),
      'service', CASE 
        WHEN svc.id IS NOT NULL THEN jsonb_build_object(
          'id', svc.id,
          'name', svc.name,
          'description', svc.description,
          'price', svc.price,
          'currency', svc.currency,
          'category', svc.category
        )
        ELSE NULL
      END,
      'employee', jsonb_build_object(
        'id', emp.id,
        'full_name', emp.full_name,
        'email', emp.email,
        'avatar_url', emp.avatar_url
      )
    )
  ), '[]'::jsonb)
  INTO v_appointments
  FROM appointments apt
  LEFT JOIN businesses b ON apt.business_id = b.id
  LEFT JOIN business_categories bc ON b.category_id = bc.id
  LEFT JOIN locations loc ON apt.location_id = loc.id
  LEFT JOIN services svc ON apt.service_id = svc.id
  LEFT JOIN business_employees be ON apt.employee_id = be.employee_id AND apt.business_id = be.business_id
  LEFT JOIN profiles emp ON be.employee_id = emp.id
  WHERE apt.client_id = p_client_id;

  -- =====================================================
  -- 2. REVIEWED APPOINTMENT IDS
  -- =====================================================
  SELECT COALESCE(jsonb_agg(r.appointment_id), '[]'::jsonb)
  INTO v_reviewed_appointment_ids
  FROM reviews r
  WHERE r.client_id = p_client_id
    AND r.appointment_id IS NOT NULL;

  -- =====================================================
  -- 3. CITY/REGION-BASED BUSINESS SUGGESTIONS
  -- =====================================================
  WITH user_cities AS (
    SELECT DISTINCT loc.city
    FROM appointments apt
    JOIN locations loc ON apt.location_id = loc.id
    WHERE apt.client_id = p_client_id AND loc.city IS NOT NULL
    LIMIT 3
  ),
  user_regions AS (
    SELECT DISTINCT loc.state
    FROM appointments apt
    JOIN locations loc ON apt.location_id = loc.id
    WHERE apt.client_id = p_client_id AND loc.state IS NOT NULL
    LIMIT 3
  ),
  matching_locations AS (
    SELECT DISTINCT ON (loc.business_id) loc.business_id, loc.id AS location_id
    FROM locations loc
    WHERE (
      (p_preferred_city_name IS NOT NULL AND loc.city ILIKE p_preferred_city_name)
      OR (p_preferred_region_name IS NOT NULL AND loc.state ILIKE p_preferred_region_name)
      OR loc.city IN (SELECT city FROM user_cities)
      OR loc.state IN (SELECT state FROM user_regions)
    )
    AND loc.business_id NOT IN (SELECT DISTINCT business_id FROM appointments WHERE client_id = p_client_id)
  )
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', b.id,
      'name', b.name,
      'description', b.description,
      'logo_url', b.logo_url,
      'average_rating', COALESCE(b.average_rating, 0),
      'total_reviews', COALESCE(b.total_reviews, 0),
      'city', loc.city,
      'state', loc.state
    )
  ), '[]'::jsonb)
  INTO v_suggestions
  FROM matching_locations ml
  JOIN businesses b ON ml.business_id = b.id
  JOIN locations loc ON ml.location_id = loc.id
  WHERE b.is_active = TRUE
  ORDER BY b.average_rating DESC NULLS LAST, b.total_reviews DESC NULLS LAST
  LIMIT 5;

  -- =====================================================
  -- 4. SUMMARY STATS
  -- =====================================================
  SELECT jsonb_build_object(
    'total', COUNT(*),
    'upcoming', COUNT(*) FILTER (WHERE start_time > NOW() AND status NOT IN ('cancelled', 'completed')),
    'completed', COUNT(*) FILTER (WHERE status = 'completed'),
    'cancelled', COUNT(*) FILTER (WHERE status = 'cancelled'),
    'no_show', COUNT(*) FILTER (WHERE status = 'no_show'),
    'total_spent', COALESCE(SUM(price) FILTER (WHERE status = 'completed'), 0)
  )
  INTO v_stats
  FROM appointments
  WHERE client_id = p_client_id;

  -- =====================================================
  -- 5. RETURN COMBINED RESULT
  -- =====================================================
  RETURN jsonb_build_object(
    'appointments', v_appointments,
    'reviewedAppointmentIds', v_reviewed_appointment_ids,
    'suggestions', v_suggestions,
    'stats', v_stats
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_client_dashboard_data(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_client_dashboard_data(UUID, TEXT, TEXT) TO anon;

-- Add comment
COMMENT ON FUNCTION get_client_dashboard_data IS 'Consolidated RPC for client dashboard data including appointments with business categories, suggestions, and stats';
