-- =============================================================================
-- Migration: Fix city filtering to use city name instead of UUID
-- =============================================================================
-- Description: Corrects the RPC function to JOIN with cities table and filter
--              by city.name instead of locations.city (which contains UUID)
-- Date: 2025-11-27
-- Issue: locations.city stores UUID, not city name. Need to JOIN cities.
-- =============================================================================

-- 1. Drop existing function
DROP FUNCTION IF EXISTS public.get_client_dashboard_data(UUID, TEXT, TEXT) CASCADE;

-- 2. Recreate with FIXED city filtering (JOIN with cities table)
CREATE OR REPLACE FUNCTION public.get_client_dashboard_data(
  p_client_id UUID,
  p_preferred_city_name TEXT DEFAULT NULL,
  p_preferred_region_name TEXT DEFAULT NULL
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
BEGIN
  -- 1. APPOINTMENTS (ordered via aggregate ORDER BY)
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
      'services', jsonb_build_object(
        'id', s.id,
        'name', s.name,
        'description', s.description,
        'duration', s.duration_minutes,
        'price', s.price,
        'currency', s.currency
      ),
      'business_employees', jsonb_build_object(
        'id', be.id,
        'full_name', emp.full_name,
        'email', emp.email,
        'avatar_url', emp.avatar_url
      ),
      'locations', jsonb_build_object(
        'id', l.id,
        'name', l.name,
        'address', l.address,
        'city', l.city
      )
    ) ORDER BY a.start_time DESC
  ), '[]'::jsonb)
  INTO v_appointments
  FROM appointments a
  INNER JOIN businesses b ON a.business_id = b.id
  LEFT JOIN services s ON a.service_id = s.id
  LEFT JOIN business_employees be ON a.employee_id = be.employee_id AND a.business_id = be.business_id
  LEFT JOIN profiles emp ON be.employee_id = emp.id
  LEFT JOIN locations l ON a.location_id = l.id
  WHERE a.client_id = p_client_id
    AND a.status != 'cancelled';

  -- 2. STATS (completed, pending, mandatory_reviews)
  SELECT jsonb_build_object(
    'completed_count', COUNT(*) FILTER (WHERE a.status = 'completed'),
    'pending_count', COUNT(*) FILTER (WHERE a.status IN ('pending', 'confirmed')),
    'mandatory_reviews', COALESCE(
      (
        SELECT COUNT(*)
        FROM appointments apt
        WHERE apt.client_id = p_client_id
          AND apt.status = 'completed'
          AND NOT EXISTS (
            SELECT 1
            FROM reviews r
            WHERE r.client_id = apt.client_id
              AND r.business_id = apt.business_id
              AND (r.employee_id = apt.employee_id OR r.employee_id IS NULL)
              AND r.created_at >= apt.end_time
          )
      ), 0
    )
  )
  INTO v_stats
  FROM appointments a
  WHERE a.client_id = p_client_id
    AND a.status != 'cancelled';

  -- 3. FAVORITES
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', b.id,
      'name', b.name,
      'description', b.description,
      'logo_url', b.logo_url,
      'banner_url', b.banner_url,
      'average_rating', b.average_rating,
      'review_count', b.total_reviews,
      'city', (SELECT city FROM locations WHERE business_id = b.id LIMIT 1)
    ) ORDER BY f.created_at DESC
  ), '[]'::jsonb)
  INTO v_favorites
  FROM business_favorites f
  INNER JOIN businesses b ON f.business_id = b.id
  WHERE f.user_id = p_client_id;

  -- 4. SUGGESTIONS (businesses with active employees, filtered by city/region, excluding already-booked)
  -- ✅ FIX: JOIN with cities table to filter by city NAME, not UUID
  WITH location_stats AS (
    SELECT
      b.id AS business_id,
      (SELECT city FROM locations WHERE business_id = b.id LIMIT 1) AS location_city_uuid,
      (SELECT state FROM locations WHERE business_id = b.id LIMIT 1) AS location_state
    FROM businesses b
  ),
  location_city_names AS (
    SELECT
      ls.business_id,
      c.name AS city_name,
      ls.location_state
    FROM location_stats ls
    LEFT JOIN cities c ON ls.location_city_uuid::uuid = c.id
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
      'city', lcn.city_name,
      'isFrequent', EXISTS (
        SELECT 1
        FROM appointments a
        WHERE a.business_id = b.id
          AND a.client_id = p_client_id
          AND a.status = 'completed'
      )
    ) ORDER BY
      -- Prioridad 1: Negocios en la ciudad preferida (si se especificó)
      CASE WHEN p_preferred_city_name IS NULL THEN 1 
           WHEN lcn.city_name = p_preferred_city_name THEN 0 
           ELSE 2 
      END,
      -- Prioridad 2: Calificación promedio
      b.average_rating DESC NULLS LAST,
      -- Prioridad 3: Total de reviews
      b.total_reviews DESC NULLS LAST
  ), '[]'::jsonb)
  INTO v_suggestions
  FROM businesses b
  INNER JOIN location_city_names lcn ON b.id = lcn.business_id
  INNER JOIN business_employees be ON b.id = be.business_id
  INNER JOIN profiles p ON be.employee_id = p.id
  WHERE be.status = 'approved'
    AND be.is_active = true
    AND p.is_active = true
    -- ✅ FIX: Filter using city NAME from JOIN, not UUID comparison
    AND (
      -- Si no hay filtro de ubicación, mostrar todos
      (p_preferred_city_name IS NULL AND p_preferred_region_name IS NULL)
      OR
      -- Si hay ciudad específica, filtrar por ciudad NAME
      (p_preferred_city_name IS NOT NULL AND EXISTS (
        SELECT 1
        FROM locations l
        INNER JOIN cities c ON l.city::uuid = c.id
        WHERE l.business_id = b.id
          AND c.name = p_preferred_city_name
      ))
      OR
      -- Si solo hay región (sin ciudad específica), filtrar por región/state
      (p_preferred_city_name IS NULL AND p_preferred_region_name IS NOT NULL AND EXISTS (
        SELECT 1
        FROM locations l
        WHERE l.business_id = b.id
          AND l.state = p_preferred_region_name
      ))
    )
    AND NOT EXISTS (
      SELECT 1
      FROM appointments a
      WHERE a.business_id = b.id
        AND a.client_id = p_client_id
    );

  -- 5. Combine all into single JSONB response
  v_result := jsonb_build_object(
    'appointments', v_appointments,
    'stats', v_stats,
    'favorites', v_favorites,
    'suggestions', v_suggestions
  );

  RETURN v_result;
END;
$$;

-- 3. Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_client_dashboard_data(UUID, TEXT, TEXT) TO authenticated;

-- 4. Add documentation comment
COMMENT ON FUNCTION public.get_client_dashboard_data(UUID, TEXT, TEXT) IS 
'Consolidated client dashboard payload with favorites, city AND region/department filtering (by NAME), and sorted suggestions. 
FIX: Now correctly filters by city.name (e.g., "MEDELLÍN") instead of locations.city UUID.
Parameters:
- p_client_id: UUID of the client
- p_preferred_city_name: City NAME for filtering (optional, e.g., "MEDELLÍN")
- p_preferred_region_name: Region/department name for filtering (optional, filters locations.state when city is NULL)';
