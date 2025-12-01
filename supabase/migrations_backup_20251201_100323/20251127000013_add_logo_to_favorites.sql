-- Migration: Add logo_url and banner_url to favorites in get_client_dashboard_data RPC
-- Date: 2025-11-27
-- Description: 
-- - Agrega logo_url y banner_url a la sección de favoritos
-- - Agrega logo_url a la sección de negocios frecuentes
-- - Corrige aliases de tablas para evitar conflictos

-- Eliminar función existente
DROP FUNCTION IF EXISTS get_client_dashboard_data(uuid);

-- Recrear función con logo_url y banner_url
CREATE OR REPLACE FUNCTION get_client_dashboard_data(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_upcoming_appointments jsonb;
  v_appointment_history jsonb;
  v_frequent_businesses jsonb;
  v_favorites jsonb;
  v_uuid_regex text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
BEGIN
  -- Citas próximas (próximos 30 días)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', a.id,
      'business_id', a.business_id,
      'business_name', b.name,
      'service_id', a.service_id,
      'service_name', s.name,
      'employee_id', a.employee_id,
      'employee_name', prof.full_name,
      'employee_email', prof.email,
      'employee_avatar_url', prof.avatar_url,
      'location_id', a.location_id,
      'location_name', l.name,
      'start_time', a.start_time,
      'end_time', a.end_time,
      'status', a.status,
      'notes', a.notes,
      'created_at', a.created_at
    )
    ORDER BY a.start_time ASC
  ), '[]'::jsonb)
  INTO v_upcoming_appointments
  FROM appointments a
  LEFT JOIN businesses b ON a.business_id = b.id
  LEFT JOIN services s ON a.service_id = s.id
  LEFT JOIN business_employees be ON a.employee_id = be.employee_id AND a.business_id = be.business_id
  LEFT JOIN profiles prof ON be.employee_id = prof.id
  LEFT JOIN locations l ON a.location_id = l.id
  WHERE a.client_id = p_user_id
    AND a.start_time >= NOW()
    AND a.start_time <= NOW() + INTERVAL '30 days'
    AND a.status IN ('pending', 'confirmed')
  LIMIT 5;

  -- Historial de citas (últimas 10 completadas/canceladas)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', a.id,
      'business_id', a.business_id,
      'business_name', b.name,
      'service_id', a.service_id,
      'service_name', s.name,
      'employee_id', a.employee_id,
      'employee_name', prof.full_name,
      'location_id', a.location_id,
      'location_name', l.name,
      'start_time', a.start_time,
      'end_time', a.end_time,
      'status', a.status,
      'created_at', a.created_at
    )
    ORDER BY a.start_time DESC
  ), '[]'::jsonb)
  INTO v_appointment_history
  FROM appointments a
  LEFT JOIN businesses b ON a.business_id = b.id
  LEFT JOIN services s ON a.service_id = s.id
  LEFT JOIN business_employees be ON a.employee_id = be.employee_id AND a.business_id = be.business_id
  LEFT JOIN profiles prof ON be.employee_id = prof.id
  LEFT JOIN locations l ON a.location_id = l.id
  WHERE a.client_id = p_user_id
    AND a.status IN ('completed', 'cancelled')
  ORDER BY a.start_time DESC
  LIMIT 10;

  -- Negocios frecuentes (negocios con más citas completadas) - AHORA CON LOGO
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', freq.business_id,
      'name', freq.business_name,
      'logo_url', freq.logo_url,
      'description', freq.description,
      'city', freq.city_name_resolved,
      'appointment_count', freq.appointment_count,
      'average_rating', freq.average_rating,
      'review_count', freq.review_count
    )
    ORDER BY freq.appointment_count DESC
  ), '[]'::jsonb)
  INTO v_frequent_businesses
  FROM (
    SELECT 
      b.id as business_id,
      b.name as business_name,
      b.logo_url,
      b.description,
      CASE 
        WHEN (SELECT l.city FROM locations l WHERE l.business_id = b.id LIMIT 1) ~ v_uuid_regex
        THEN (SELECT c.name FROM cities c WHERE c.id = (SELECT l.city::uuid FROM locations l WHERE l.business_id = b.id LIMIT 1))
        ELSE (SELECT l.city FROM locations l WHERE l.business_id = b.id LIMIT 1)
      END AS city_name_resolved,
      COUNT(a.id) as appointment_count,
      COALESCE(br.average_rating, 0) as average_rating,
      COALESCE(br.review_count, 0) as review_count
    FROM appointments a
    INNER JOIN businesses b ON a.business_id = b.id
    LEFT JOIN business_ratings_stats br ON b.id = br.business_id
    WHERE a.client_id = p_user_id
      AND a.status = 'completed'
    GROUP BY b.id, b.name, b.logo_url, b.description, br.average_rating, br.review_count
    HAVING COUNT(a.id) >= 1
    ORDER BY COUNT(a.id) DESC
    LIMIT 5
  ) freq;

  -- Favoritos con logo_url y banner_url
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', fav.business_id,
      'name', fav.business_name,
      'logo_url', fav.logo_url,
      'banner_url', fav.banner_url,
      'description', fav.description,
      'city', fav.city_name_resolved,
      'average_rating', fav.average_rating,
      'review_count', fav.review_count
    )
  ), '[]'::jsonb)
  INTO v_favorites
  FROM (
    SELECT 
      bf.business_id,
      b.name as business_name,
      b.logo_url,
      b.banner_url,
      b.description,
      CASE 
        WHEN (SELECT l.city FROM locations l WHERE l.business_id = b.id LIMIT 1) ~ v_uuid_regex
        THEN (SELECT c.name FROM cities c WHERE c.id = (SELECT l.city::uuid FROM locations l WHERE l.business_id = b.id LIMIT 1))
        ELSE (SELECT l.city FROM locations l WHERE l.business_id = b.id LIMIT 1)
      END AS city_name_resolved,
      COALESCE(br.average_rating, 0) as average_rating,
      COALESCE(br.review_count, 0) as review_count
    FROM business_favorites bf
    INNER JOIN businesses b ON bf.business_id = b.id
    LEFT JOIN business_ratings_stats br ON b.id = br.business_id
    WHERE bf.user_id = p_user_id
    LIMIT 5
  ) fav;

  -- Retornar JSON con todas las secciones
  RETURN jsonb_build_object(
    'upcoming_appointments', v_upcoming_appointments,
    'appointment_history', v_appointment_history,
    'frequent_businesses', v_frequent_businesses,
    'favorites', v_favorites
  );
END;
$$;

-- Comment
COMMENT ON FUNCTION get_client_dashboard_data IS 'Returns dashboard data for client including logo_url and banner_url for favorites and frequent businesses';
