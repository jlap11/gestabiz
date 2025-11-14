-- =====================================================
-- FIX FINAL: Corregir suggestions para retornar l.city (locations.city)
-- Problema: businesses.city NO EXISTE, debe ser locations.city
-- =====================================================
-- EJECUTAR EN: Supabase Dashboard → SQL Editor → New Query
-- =====================================================

-- Drop todas las versiones existentes
DROP FUNCTION IF EXISTS public.get_client_dashboard_data(UUID);
DROP FUNCTION IF EXISTS public.get_client_dashboard_data(UUID, TEXT);
DROP FUNCTION IF EXISTS public.get_client_dashboard_data(UUID, UUID);

-- Crear función corregida (v4.0 FINAL)
CREATE OR REPLACE FUNCTION public.get_client_dashboard_data(
  p_client_id UUID,
  p_preferred_city_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_appointments JSONB;
  v_reviewed_ids JSONB;
  v_pending_count INTEGER;
  v_favorites JSONB;
  v_suggestions JSONB;
  v_stats JSONB;
BEGIN
  -- =====================================================
  -- 1. APPOINTMENTS (sin cambios)
  -- =====================================================
  SELECT COALESCE(json_agg(apt_data), '[]'::json)::jsonb
  INTO v_appointments
  FROM (
    SELECT 
      a.id,
      a.created_at,
      a.updated_at,
      a.business_id,
      a.location_id,
      a.service_id,
      a.client_id,
      a.employee_id,
      a.start_time,
      a.end_time,
      a.status,
      a.notes,
      a.price,
      a.currency,
      jsonb_build_object(
        'id', b.id,
        'name', b.name,
        'description', b.description,
        'logo_url', b.logo_url,
        'banner_url', b.banner_url,
        'average_rating', b.average_rating,
        'total_reviews', b.total_reviews
      ) as business,
      jsonb_build_object(
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
      ) as location,
      jsonb_build_object(
        'id', emp.id,
        'full_name', emp.full_name,
        'email', emp.email,
        'phone', emp.phone,
        'avatar_url', emp.avatar_url
      ) as employee,
      jsonb_build_object(
        'id', cli.id,
        'full_name', cli.full_name,
        'email', cli.email,
        'phone', cli.phone,
        'avatar_url', cli.avatar_url
      ) as client,
      jsonb_build_object(
        'id', s.id,
        'name', s.name,
        'description', s.description,
        'duration_minutes', s.duration_minutes,
        'price', s.price,
        'currency', s.currency,
        'image_url', s.image_url,
        'category', s.category
      ) as service,
      r.id as review_id,
      CASE WHEN r.id IS NOT NULL THEN true ELSE false END as has_review
    FROM appointments a
    LEFT JOIN businesses b ON a.business_id = b.id
    LEFT JOIN locations l ON a.location_id = l.id
    LEFT JOIN profiles emp ON a.employee_id = emp.id
    LEFT JOIN profiles cli ON a.client_id = cli.id
    LEFT JOIN services s ON a.service_id = s.id
    LEFT JOIN reviews r ON a.id = r.appointment_id
    WHERE a.client_id = p_client_id
    ORDER BY a.start_time DESC
    LIMIT 100
  ) apt_data;

  -- =====================================================
  -- 2. REVIEWED APPOINTMENT IDS
  -- =====================================================
  SELECT COALESCE(json_agg(id), '[]'::json)::jsonb
  INTO v_reviewed_ids
  FROM appointments a
  WHERE a.client_id = p_client_id
    AND EXISTS (SELECT 1 FROM reviews r WHERE r.appointment_id = a.id);

  -- =====================================================
  -- 3. PENDING REVIEWS COUNT
  -- =====================================================
  SELECT COUNT(*)::INTEGER
  INTO v_pending_count
  FROM appointments a
  WHERE a.client_id = p_client_id
    AND a.status = 'completed'
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.appointment_id = a.id);

  -- =====================================================
  -- 4. FAVORITES (business_favorites)
  -- =====================================================
  SELECT COALESCE(json_agg(business_id), '[]'::json)::jsonb
  INTO v_favorites
  FROM business_favorites
  WHERE user_id = p_client_id;

  -- =====================================================
  -- 5. SUGGESTIONS (negocios recomendados)
  -- =====================================================
  -- ✅ FIX v4.0 FINAL: Retornar l.city y l.state (NO b.city/b.state)
  -- ✅ FIX: locations.city es TEXT (almacena UUIDs como TEXT), comparar con UUID::TEXT
  SELECT COALESCE(json_agg(suggestion_data), '[]'::json)::jsonb
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
      l.city,  -- ✅ FIX: Retornar l.city (de locations), NO b.city
      l.state, -- ✅ FIX: Retornar l.state (de locations), NO b.state
      -- Calcular relevancia: negocios donde ya tiene citas tienen prioridad
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM appointments a 
          WHERE a.business_id = b.id AND a.client_id = p_client_id
        ) THEN 10
        ELSE 0
      END + COALESCE(b.average_rating, 0) as relevance_score
    FROM businesses b
    -- ✅ INNER JOIN para obtener ubicaciones y filtrar por cityId
    INNER JOIN locations l ON l.business_id = b.id AND l.is_active = true
    WHERE b.is_active = true
      AND (b.average_rating >= 4.0 OR b.average_rating IS NULL OR b.total_reviews = 0) -- ✅ FIX: Incluir negocios sin reviews
      AND (p_preferred_city_id IS NULL OR l.city = p_preferred_city_id::TEXT) -- ✅ FIX: l.city es TEXT, comparar con UUID::TEXT
      AND NOT EXISTS (
        -- Excluir negocios ya favorizados
        SELECT 1 FROM business_favorites bf 
        WHERE bf.user_id = p_client_id AND bf.business_id = b.id
      )
    ORDER BY relevance_score DESC, b.total_reviews DESC
    LIMIT 6
  ) suggestion_data;

  -- =====================================================
  -- 6. STATS (estadísticas rápidas)
  -- =====================================================
  SELECT jsonb_build_object(
    'totalAppointments', COUNT(*),
    'completedAppointments', COUNT(*) FILTER (WHERE status = 'completed'),
    'upcomingAppointments', COUNT(*) FILTER (
      WHERE status IN ('pending', 'confirmed', 'in_progress') 
        AND start_time > NOW()
    ),
    'cancelledAppointments', COUNT(*) FILTER (WHERE status = 'cancelled')
  )
  INTO v_stats
  FROM appointments
  WHERE client_id = p_client_id;

  -- =====================================================
  -- RESULTADO FINAL (UN SOLO JSONB)
  -- =====================================================
  v_result := jsonb_build_object(
    'appointments', v_appointments,
    'reviewedAppointmentIds', v_reviewed_ids,
    'pendingReviewsCount', v_pending_count,
    'favorites', v_favorites,
    'suggestions', v_suggestions,
    'stats', v_stats
  );

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  -- Log error y retornar estructura vacía
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
    ),
    'error', SQLERRM
  );
END;
$$;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT EXECUTE ON FUNCTION public.get_client_dashboard_data TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_client_dashboard_data TO anon;

-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON FUNCTION public.get_client_dashboard_data IS 
'Función consolidada para ClientDashboard. v4.0 FINAL: Retorna l.city/l.state (locations), filtra por UUID directo.';

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Para verificar que la función existe:
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'get_client_dashboard_data';

-- =====================================================
-- EXPLICACIÓN DEL FIX
-- =====================================================
/*
ANTES (v3.0 - INCORRECTO):
- Línea 165-166: Retornaba b.city, b.state (NO EXISTEN en businesses)
- Línea 183: l.city = p_preferred_city_id::TEXT (conversión ESTABA pero en mal sitio)
- RESULTADO: city = undefined, filtro no funciona

AHORA (v4.0 - CORRECTO):
- Línea 165-166: Retorna l.city, l.state (SÍ EXISTEN en locations)
- Línea 183: l.city = p_preferred_city_id::TEXT (locations.city es TEXT, no UUID)
- RESULTADO: city = UUID válido (como TEXT), filtro funciona correctamente

NOTA IMPORTANTE:
- locations.city almacena UUIDs COMO TEXT (no como tipo UUID nativo)
- Por eso necesitamos p_preferred_city_id::TEXT para comparar
*/
