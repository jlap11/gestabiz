-- =====================================================
-- Migration: Replace Client Dashboard RPC with single signature (uuid, text)
-- Purpose: Remove legacy overload that returned flattened fields and ensure
--          new version with nested relations + price is the only one available.
-- Date: 2025-11-26
-- =====================================================

-- Drop ALL existing overloads to prevent ambiguity
DROP FUNCTION IF EXISTS public.get_client_dashboard_data(UUID);
DROP FUNCTION IF EXISTS public.get_client_dashboard_data(UUID, UUID);
DROP FUNCTION IF EXISTS public.get_client_dashboard_data(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_client_dashboard_data(UUID, TEXT);

-- Recreate updated function (uuid, text)
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
  v_pending_reviews_count INT;
  v_reviewed_appointment_ids JSONB;
BEGIN
  -- =====================================================
  -- 1. APPOINTMENTS (joins completos + price/currency)
  -- =====================================================
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
      'price', COALESCE(a.price, s.price),
      'currency', COALESCE(a.currency, s.currency, 'COP'),
      'business', jsonb_build_object(
        'id', b.id,
        'name', b.name,
        'description', b.description,
        'logo_url', b.logo_url,
        'banner_url', b.banner_url,
        'average_rating', b.average_rating,
        'total_reviews', b.total_reviews
      ),
      'location', jsonb_build_object(
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
      'employee', CASE
        WHEN emp.id IS NOT NULL THEN jsonb_build_object(
          'id', emp.id,
          'full_name', emp.full_name,
          'email', emp.email,
          'phone', emp.phone,
          'avatar_url', emp.avatar_url
        )
        ELSE NULL
      END,
      'client', jsonb_build_object(
        'id', cli.id,
        'full_name', cli.full_name,
        'email', cli.email,
        'phone', cli.phone,
        'avatar_url', cli.avatar_url
      ),
      'service', jsonb_build_object(
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
      'has_review', CASE WHEN r.id IS NOT NULL THEN TRUE ELSE FALSE END
    ) ORDER BY a.start_time DESC
  ), '[]'::jsonb) INTO v_appointments
  FROM appointments a
  INNER JOIN businesses b ON a.business_id = b.id
  INNER JOIN locations l ON a.location_id = l.id
  INNER JOIN services s ON a.service_id = s.id
  LEFT JOIN profiles emp ON a.employee_id = emp.id
  INNER JOIN profiles cli ON a.client_id = cli.id
  LEFT JOIN reviews r ON a.id = r.appointment_id
  WHERE a.client_id = p_client_id;

  -- =====================================================
  -- 2. STATS
  -- =====================================================
  SELECT jsonb_build_object(
    'totalAppointments', COUNT(*),
    'completedAppointments', COUNT(*) FILTER (WHERE status = 'completed'),
    'upcomingAppointments', COUNT(*) FILTER (WHERE status IN ('pending','pending_confirmation','confirmed') AND start_time > NOW()),
    'cancelledAppointments', COUNT(*) FILTER (WHERE status = 'cancelled')
  )
  INTO v_stats
  FROM appointments
  WHERE client_id = p_client_id;

  -- =====================================================
  -- 3. SUGGESTIONS (filtradas por ciudad preferida opcional)
  -- =====================================================
  WITH unique_businesses AS (
    SELECT DISTINCT b.id
    FROM businesses b
    INNER JOIN business_employees be ON b.id = be.business_id
    WHERE be.is_active = TRUE
      AND b.id NOT IN (
        SELECT DISTINCT business_id
        FROM appointments
        WHERE client_id = p_client_id
      )
      AND (
        p_preferred_city_name IS NULL
        OR EXISTS (
          SELECT 1
          FROM locations loc
          WHERE loc.business_id = b.id
            AND LOWER(loc.city) = LOWER(p_preferred_city_name)
        )
      )
    LIMIT 10
  )
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', b.id,
      'name', b.name,
      'description', b.description,
      'logo_url', b.logo_url,
      'banner_url', b.banner_url,
      'average_rating', b.average_rating,
      'total_reviews', b.total_reviews,
      'locations', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', loc.id,
            'name', loc.name,
            'city', loc.city,
            'address', loc.address
          )
        )
        FROM locations loc
        WHERE loc.business_id = b.id
          AND loc.is_active = TRUE
      )
    )
  ), '[]'::jsonb)
  INTO v_suggestions
  FROM unique_businesses ub
  INNER JOIN businesses b ON ub.id = b.id
  WHERE b.is_active = TRUE;

  -- =====================================================
  -- 4. FAVORITES
  -- =====================================================
  SELECT COALESCE(jsonb_agg(business_id), '[]'::jsonb)
  INTO v_favorites
  FROM business_favorites
  WHERE user_id = p_client_id;

  -- =====================================================
  -- 5. REVIEWS (pendientes + ids con review)
  -- =====================================================
  SELECT COUNT(*)
  INTO v_pending_reviews_count
  FROM appointments a
  LEFT JOIN reviews r ON a.id = r.appointment_id
  WHERE a.client_id = p_client_id
    AND a.status = 'completed'
    AND r.id IS NULL;

  SELECT COALESCE(jsonb_agg(appointment_id), '[]'::jsonb)
  INTO v_reviewed_appointment_ids
  FROM reviews
  WHERE appointment_id IN (
    SELECT id FROM appointments WHERE client_id = p_client_id
  );

  -- =====================================================
  -- 6. RESULTADO FINAL
  -- =====================================================
  v_result := jsonb_build_object(
    'appointments', v_appointments,
    'stats', v_stats,
    'suggestions', v_suggestions,
    'favorites', v_favorites,
    'pendingReviewsCount', v_pending_reviews_count,
    'reviewedAppointmentIds', v_reviewed_appointment_ids
  );

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in get_client_dashboard_data for client %: %', p_client_id, SQLERRM;
    RETURN jsonb_build_object(
      'appointments', '[]'::jsonb,
      'stats', jsonb_build_object(
        'totalAppointments', 0,
        'completedAppointments', 0,
        'upcomingAppointments', 0,
        'cancelledAppointments', 0
      ),
      'suggestions', '[]'::jsonb,
      'favorites', '[]'::jsonb,
      'pendingReviewsCount', 0,
      'reviewedAppointmentIds', '[]'::jsonb
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_client_dashboard_data(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION public.get_client_dashboard_data(UUID, TEXT) IS 
  'Returns client dashboard data with nested relations (business, location, service, employee), stats, suggestions, favorites, and pending reviews. Single signature to avoid ambiguity.';
