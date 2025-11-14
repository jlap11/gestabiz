-- =====================================================
-- FIX: Cambiar filtro de suggestions de cityName (TEXT) a cityId (UUID)
-- Problema: Filtro usa b.city = p_preferred_city (string) cuando city es UUID
-- Solución: Cambiar parámetro a UUID y hacer JOIN con locations
-- =====================================================
-- EJECUTAR EN: Supabase Dashboard → SQL Editor → New Query
-- =====================================================

-- Drop todas las versiones existentes
DROP FUNCTION IF EXISTS public.get_client_dashboard_data(UUID);
DROP FUNCTION IF EXISTS public.get_client_dashboard_data(UUID, TEXT);
DROP FUNCTION IF EXISTS public.get_client_dashboard_data(UUID, UUID);

-- Crear función con cityId (UUID)
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
  v_appointments JSONB;
  v_reviewed_ids JSONB;
  v_pending_count INTEGER;
  v_favorites JSONB;
  v_suggestions JSONB;
  v_stats JSONB;
BEGIN
  -- =====================================================
  -- 1. APPOINTMENTS CON RELACIONES
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
      -- ✅ FIX v2.0: Nombres singulares para consistencia con frontend
      -- Business data
      jsonb_build_object(
        'id', b.id,
        'name', b.name,
        'description', b.description,
        'logo_url', b.logo_url,
        'banner_url', b.banner_url,
        'average_rating', b.average_rating,
        'total_reviews', b.total_reviews
      ) as business,
      -- Location data
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
      -- Employee data
      jsonb_build_object(
        'id', emp.id,
        'full_name', emp.full_name,
        'email', emp.email,
        'phone', emp.phone,
        'avatar_url', emp.avatar_url
      ) as employee,
      -- Client data (necesario para consistencia)
      jsonb_build_object(
        'id', cli.id,
        'full_name', cli.full_name,
        'email', cli.email,
        'phone', cli.phone,
        'avatar_url', cli.avatar_url
      ) as client,
      -- Service data
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
      -- Review info
      r.id as review_id,
      (r.id IS NOT NULL) as has_review
    FROM appointments a
    LEFT JOIN businesses b ON b.id = a.business_id
    LEFT JOIN locations l ON l.id = a.location_id
    LEFT JOIN profiles emp ON emp.id = a.employee_id
    LEFT JOIN profiles cli ON cli.id = a.client_id
    LEFT JOIN services s ON s.id = a.service_id
    LEFT JOIN reviews r ON r.appointment_id = a.id
    WHERE a.client_id = p_client_id
    ORDER BY a.start_time DESC
    LIMIT 100 -- Límite razonable para evitar datasets gigantes
  ) apt_data;

  -- =====================================================
  -- 2. REVIEWED APPOINTMENT IDS (extraer de appointments)
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
  -- ✅ FIX v3.0: Filtro por cityId (UUID) en vez de cityName (string)
  -- Sugerir negocios basados en:
  -- 1. Negocios donde el cliente ha tenido citas (pero no son favoritos)
  -- 2. Negocios con mejor rating (4.0+)
  -- 3. Filtrar por ciudad seleccionada en header (localStorage)
  -- NOTA: Para Bogotá, cuando regionId = Bogotá pero cityId = NULL,
  --       el frontend pasa cityId = 'c5861b80-bd05-48a9-9e24-d8c93e0d1d6b' automáticamente
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
      b.city,
      b.state,
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
      AND b.average_rating >= 4.0 -- Solo negocios con buen rating
      AND (p_preferred_city_id IS NULL OR l.city = p_preferred_city_id::TEXT) -- ✅ FILTRO POR CITY ID (UUID)
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
  -- RETURN CONSOLIDADO
  -- =====================================================
  RETURN jsonb_build_object(
    'appointments', v_appointments,
    'reviewedAppointmentIds', v_reviewed_ids,
    'pendingReviewsCount', v_pending_count,
    'favorites', v_favorites,
    'suggestions', v_suggestions,
    'stats', v_stats
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
'Función consolidada para ClientDashboard. Retorna appointments, reviews, favorites, suggestions y stats en UN SOLO request. v3.0: Filtro por cityId (UUID).';
