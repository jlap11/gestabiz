-- Migration: Fix GROUP BY error in get_client_dashboard_data
-- Date: 2025-12-01
-- Description: Remove problematic suggestions section that caused GROUP BY error

-- Drop existing function
DROP FUNCTION IF EXISTS get_client_dashboard_data(UUID, TEXT, TEXT);

-- Recreate function with business category included (simplified, without suggestions)
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
  -- 3. SUMMARY STATS
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
  -- 4. RETURN COMBINED RESULT
  -- =====================================================
  RETURN jsonb_build_object(
    'appointments', v_appointments,
    'reviewedAppointmentIds', v_reviewed_appointment_ids,
    'suggestions', '[]'::jsonb,
    'stats', v_stats
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_client_dashboard_data(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_client_dashboard_data(UUID, TEXT, TEXT) TO anon;

-- Add comment
COMMENT ON FUNCTION get_client_dashboard_data IS 'Consolidated RPC for client dashboard data including appointments with business categories and stats (simplified without suggestions)';
