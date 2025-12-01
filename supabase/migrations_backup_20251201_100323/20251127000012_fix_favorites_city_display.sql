-- =====================================================
-- Migration: Fix City Display in Favorites
-- =====================================================
-- Problema: Favoritos muestran UUID en vez de nombre de ciudad
-- Solución: Aplicar misma lógica de resolución que en frequent businesses
-- Fecha: 2025-11-27
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_client_dashboard_data(
  p_client_id uuid,
  p_preferred_city_name text DEFAULT NULL,
  p_preferred_region_name text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_appointments jsonb;
  v_favorites jsonb;
  v_suggestions jsonb;
  v_frequent_businesses jsonb;
  v_stats jsonb;
  v_uuid_regex TEXT := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
BEGIN
  -- Stats de citas
  SELECT jsonb_build_object(
    'totalAppointments', COUNT(*),
    'upcomingAppointments', COUNT(*) FILTER (WHERE start_time > NOW() AND status NOT IN ('cancelled', 'completed')),
    'completedAppointments', COUNT(*) FILTER (WHERE status = 'completed'),
    'cancelledAppointments', COUNT(*) FILTER (WHERE status = 'cancelled')
  )
  INTO v_stats
  FROM appointments
  WHERE client_id = p_client_id;

  -- Citas CON EMPLOYEE
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', a.id,
      'start_time', a.start_time,
      'end_time', a.end_time,
      'status', a.status,
      'notes', a.notes,
      'business', jsonb_build_object(
        'id', b.id,
        'name', b.name,
        'banner_url', b.banner_url
      ),
      'service', jsonb_build_object(
        'id', s.id,
        'name', s.name,
        'price', s.price,
        'duration', s.duration_minutes
      ),
      'location', jsonb_build_object(
        'id', l.id,
        'name', l.name,
        'address', l.address
      ),
      'employee', CASE WHEN emp.id IS NOT NULL THEN jsonb_build_object(
        'id', emp.id,
        'full_name', emp.full_name,
        'email', emp.email,
        'phone', emp.phone,
        'avatar_url', emp.avatar_url
      ) ELSE NULL END
    ) ORDER BY a.start_time DESC
  ), '[]'::jsonb)
  INTO v_appointments
  FROM appointments a
  LEFT JOIN businesses b ON a.business_id = b.id
  LEFT JOIN services s ON a.service_id = s.id
  LEFT JOIN locations l ON a.location_id = l.id
  LEFT JOIN profiles emp ON a.employee_id = emp.id
  WHERE a.client_id = p_client_id;

  -- ✅ FIX: Favoritos con city name resuelto (igual que frequent businesses)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', fav.business_id,
      'name', fav.business_name,
      'description', fav.business_description,
      'banner_url', fav.business_banner_url,
      'average_rating', fav.business_average_rating,
      'total_reviews', fav.business_total_reviews,
      'city', fav.city_name_resolved
    ) ORDER BY fav.business_average_rating DESC NULLS LAST
  ), '[]'::jsonb)
  INTO v_favorites
  FROM (
    SELECT 
      b.id AS business_id,
      b.name AS business_name,
      b.description AS business_description,
      b.banner_url AS business_banner_url,
      b.average_rating AS business_average_rating,
      b.total_reviews AS business_total_reviews,
      -- ✅ FIX: Resolver UUID a nombre de ciudad
      CASE 
        WHEN (SELECT l.city FROM locations l WHERE l.business_id = b.id AND l.is_active = TRUE LIMIT 1) ~ v_uuid_regex
        THEN (SELECT c.name FROM cities c WHERE c.id = (SELECT l.city FROM locations l WHERE l.business_id = b.id AND l.is_active = TRUE LIMIT 1)::uuid LIMIT 1)
        ELSE (SELECT l.city FROM locations l WHERE l.business_id = b.id AND l.is_active = TRUE LIMIT 1)
      END AS city_name_resolved
    FROM business_favorites f
    INNER JOIN businesses b ON f.business_id = b.id
    WHERE f.user_id = p_client_id
  ) fav;

  -- ✅ Negocios FRECUENTES con city name resuelto
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', freq.business_id,
      'name', freq.business_name,
      'description', freq.business_description,
      'logo_url', freq.business_logo_url,
      'banner_url', freq.business_banner_url,
      'average_rating', freq.business_average_rating,
      'total_reviews', freq.business_total_reviews,
      'city', freq.city_name_resolved,
      'isFrequent', true,
      'visitsCount', freq.completed_count,
      'lastAppointmentDate', freq.last_appointment
    ) ORDER BY freq.completed_count DESC, freq.last_appointment DESC
  ), '[]'::jsonb)
  INTO v_frequent_businesses
  FROM (
    SELECT 
      b.id AS business_id,
      b.name AS business_name,
      b.description AS business_description,
      b.logo_url AS business_logo_url,
      b.banner_url AS business_banner_url,
      b.average_rating AS business_average_rating,
      b.total_reviews AS business_total_reviews,
      -- ✅ Resolver UUID a nombre de ciudad
      CASE 
        WHEN (SELECT l.city FROM locations l WHERE l.business_id = b.id AND l.is_active = TRUE LIMIT 1) ~ v_uuid_regex
        THEN (SELECT c.name FROM cities c WHERE c.id = (SELECT l.city FROM locations l WHERE l.business_id = b.id AND l.is_active = TRUE LIMIT 1)::uuid LIMIT 1)
        ELSE (SELECT l.city FROM locations l WHERE l.business_id = b.id AND l.is_active = TRUE LIMIT 1)
      END AS city_name_resolved,
      COUNT(*) AS completed_count,
      MAX(a.end_time) AS last_appointment
    FROM appointments a
    JOIN businesses b ON a.business_id = b.id
    WHERE a.client_id = p_client_id
      AND a.status = 'completed'
      AND b.is_active = TRUE
    GROUP BY b.id, b.name, b.description, b.logo_url, b.banner_url, b.average_rating, b.total_reviews
  ) freq;

  -- Recomendaciones
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', sub.id,
      'name', sub.name,
      'description', sub.description,
      'logo_url', sub.logo_url,
      'banner_url', sub.banner_url,
      'average_rating', sub.average_rating,
      'total_reviews', sub.total_reviews,
      'city', sub.city,
      'isFrequent', false,
      'relevance_score', sub.relevance_score
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
      (SELECT city FROM locations WHERE business_id = b.id AND is_active = TRUE LIMIT 1) as city,
      COALESCE(b.average_rating, 0) + (b.total_reviews * 0.1) as relevance_score
    FROM businesses b
    WHERE b.is_active = TRUE
      AND b.id NOT IN (SELECT business_id FROM business_favorites WHERE user_id = p_client_id)
      AND NOT EXISTS (
        SELECT 1 FROM appointments a
        WHERE a.business_id = b.id AND a.client_id = p_client_id
      )
      AND (
        (p_preferred_city_name IS NOT NULL AND EXISTS (
          SELECT 1 FROM locations l
          LEFT JOIN cities c ON c.id::text = l.city
          WHERE l.business_id = b.id
            AND l.is_active = TRUE
            AND (
              l.city ILIKE '%' || SPLIT_PART(p_preferred_city_name, ' ', 1) || '%'
              OR c.name ILIKE '%' || SPLIT_PART(p_preferred_city_name, ' ', 1) || '%'
            )
        ))
        OR
        (p_preferred_city_name IS NULL AND p_preferred_region_name IS NOT NULL AND EXISTS (
          SELECT 1 FROM locations l
          LEFT JOIN cities c ON c.id::text = l.city
          LEFT JOIN regions r ON r.id = c.region_id
          WHERE l.business_id = b.id
            AND l.is_active = TRUE
            AND (
              r.name ILIKE '%' || p_preferred_region_name || '%'
              OR l.city ILIKE '%' || SPLIT_PART(p_preferred_region_name, ' ', 1) || '%'
            )
        ))
        OR
        (p_preferred_city_name IS NULL AND p_preferred_region_name IS NULL)
      )
    ORDER BY relevance_score DESC
    LIMIT 6
  ) sub;

  -- Combinar frecuentes + recomendaciones
  v_suggestions := COALESCE(v_frequent_businesses, '[]'::jsonb) || COALESCE(v_suggestions, '[]'::jsonb);

  RETURN jsonb_build_object(
    'appointments', v_appointments,
    'favorites', v_favorites,
    'favoritesCount', jsonb_array_length(v_favorites),
    'suggestions', v_suggestions,
    'stats', v_stats
  );
END;
$function$;
