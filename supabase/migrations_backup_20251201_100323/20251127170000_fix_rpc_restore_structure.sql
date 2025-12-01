-- Fix RPC get_client_dashboard_data: Restore correct structure expected by frontend
-- Migration: 20251127170000_fix_rpc_restore_structure.sql
-- Date: 2025-11-27
-- 
-- PROBLEMA: La función RPC fue modificada para retornar estructura incorrecta
-- ESPERADO por frontend: { appointments, favorites, suggestions, reviewedAppointmentIds, pendingReviewsCount, stats }
-- RETORNABA: { upcomingAppointments, appointmentHistory, frequentBusinesses, favorites }
-- 
-- Esta migración RESTAURA la estructura correcta Y agrega el campo category a services

DROP FUNCTION IF EXISTS get_client_dashboard_data(uuid, text, text) CASCADE;
DROP FUNCTION IF EXISTS get_client_dashboard_data(uuid) CASCADE;

CREATE OR REPLACE FUNCTION get_client_dashboard_data(
  p_client_id uuid,
  p_preferred_city_name text DEFAULT NULL,
  p_preferred_region_name text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_appointments jsonb;
  v_reviewed_appointment_ids jsonb;
  v_pending_reviews_count integer;
  v_favorites jsonb;
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
        'state', b.state
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
  -- 3. PENDING REVIEWS COUNT
  -- =====================================================
  SELECT COUNT(*)::integer
  INTO v_pending_reviews_count
  FROM appointments apt
  WHERE apt.client_id = p_client_id
    AND apt.status = 'completed'
    AND NOT EXISTS (
      SELECT 1 FROM reviews r 
      WHERE r.appointment_id = apt.id 
        AND r.client_id = p_client_id
    );

  -- =====================================================
  -- 4. FAVORITES (SIN filtro de ciudad - mostrar todos los favoritos del usuario)
  -- =====================================================
  -- IMPORTANTE: Los favoritos se muestran SIEMPRE, sin importar la ciudad preferida
  -- Razón: El usuario marcó como favorito explícitamente, no debe ser filtrado
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', fav.business_id,
      'name', fav.business_name,
      'description', fav.description,
      'logo_url', fav.logo_url,
      'banner_url', fav.banner_url,
      'city', fav.city,
      'state', fav.state,
      'average_rating', fav.average_rating,
      'total_reviews', fav.total_reviews,
      'favorited_at', fav.favorited_at
    )
  ), '[]'::jsonb)
  INTO v_favorites
  FROM (
    SELECT 
      b.id as business_id,
      b.name as business_name,
      b.description,
      b.logo_url,
      b.banner_url,
      b.city,
      b.state,
      b.average_rating,
      b.total_reviews,
      bf.created_at as favorited_at
    FROM business_favorites bf
    LEFT JOIN businesses b ON bf.business_id = b.id
    WHERE bf.user_id = p_client_id
    ORDER BY bf.created_at DESC
  ) fav;

  -- =====================================================
  -- 5. SUGGESTIONS (negocios recomendados cercanos)
  -- =====================================================
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', b.id,
      'name', b.name,
      'description', b.description,
      'logo_url', b.logo_url,
      'banner_url', b.banner_url,
      'average_rating', b.average_rating,
      'total_reviews', b.total_reviews,
      'city', b.city,
      'state', b.state,
      'relevance_score', b.relevance_score,
      'isFrequent', false
    )
  ), '[]'::jsonb)
  INTO v_suggestions
  FROM (
    SELECT 
      b.id,
      b.name,
      b.description,
      b.logo_url,
      b.banner_url,
      b.average_rating,
      b.total_reviews,
      b.city,
      b.state,
      b.created_at,
      COALESCE(b.average_rating, 0) * COALESCE(b.total_reviews, 0) as relevance_score
    FROM businesses b
    WHERE b.is_active = TRUE
      AND (
        -- Filtrar por ciudad/región preferida si se proporciona
        (p_preferred_city_name IS NOT NULL AND b.city ILIKE p_preferred_city_name || '%')
        OR (p_preferred_region_name IS NOT NULL AND b.state ILIKE p_preferred_region_name || '%')
        OR (p_preferred_city_name IS NULL AND p_preferred_region_name IS NULL)
      )
      -- Excluir negocios que ya están en frecuentes (el frontend los mergea)
      AND NOT EXISTS (
        SELECT 1 
        FROM appointments apt2
        WHERE apt2.client_id = p_client_id
          AND apt2.business_id = b.id
          AND apt2.status = 'completed'
      )
    ORDER BY 
      relevance_score DESC,
      b.created_at DESC
    LIMIT 5
  ) b;

  -- =====================================================
  -- 6. STATS (estadísticas calculadas)
  -- =====================================================
  SELECT jsonb_build_object(
    'totalAppointments', COUNT(*),
    'completedAppointments', COUNT(*) FILTER (WHERE status = 'completed'),
    'upcomingAppointments', COUNT(*) FILTER (WHERE status IN ('pending', 'confirmed') AND start_time > NOW()),
    'cancelledAppointments', COUNT(*) FILTER (WHERE status = 'cancelled')
  )
  INTO v_stats
  FROM appointments
  WHERE client_id = p_client_id;

  -- =====================================================
  -- RETURN FINAL STRUCTURE
  -- =====================================================
  RETURN jsonb_build_object(
    'appointments', v_appointments,
    'reviewedAppointmentIds', v_reviewed_appointment_ids,
    'pendingReviewsCount', v_pending_reviews_count,
    'favorites', v_favorites,
    'suggestions', v_suggestions,
    'stats', v_stats
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_client_dashboard_data(uuid, text, text) TO authenticated;

COMMENT ON FUNCTION get_client_dashboard_data(uuid, text, text) IS 'Retorna todos los datos del dashboard del cliente en la estructura esperada por el frontend. Incluye appointments, favorites, suggestions, reviews, y stats. FIXED: estructura correcta + campo category en services.';
