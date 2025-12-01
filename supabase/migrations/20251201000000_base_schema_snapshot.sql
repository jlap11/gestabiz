-- =====================================================
-- BASE SCHEMA SNAPSHOT
-- =====================================================
-- Migration: 20251201000000_base_schema_snapshot.sql
-- Date: 2025-12-01
-- Purpose: Snapshot limpio del esquema actual de producción
-- 
-- IMPORTANTE: Esta es la ÚNICA migración oficial.
-- Todas las migraciones anteriores fueron movidas a migrations_backup_20251201_100323/
-- 
-- Este snapshot incluye:
-- - Función RPC: get_client_dashboard_data (con fixes de favoritos y sugerencias)
-- - Funciones de ausencias: calculate_absence_days, is_employee_available_on_date
-- - Triggers: auto_insert_owner_to_business_employees, sync_business_roles_from_business_employees
-- =====================================================

-- =====================================================
-- 1. RPC FUNCTION: get_client_dashboard_data
-- =====================================================
-- Retorna todos los datos del dashboard del cliente en una sola llamada
-- Estructura: { appointments, reviewedAppointmentIds, pendingReviewsCount, favorites, suggestions, stats }

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
  -- 4. FAVORITES (SIN filtro de ciudad - mostrar todos)
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

COMMENT ON FUNCTION get_client_dashboard_data(uuid, text, text) IS 
'Retorna todos los datos del dashboard del cliente en una sola llamada. 
Incluye: appointments (con relaciones completas), reviewedAppointmentIds, pendingReviewsCount, 
favorites (SIN filtro de ciudad), suggestions (con filtro de ciudad/región), y stats.
OPTIMIZADO: Reduce 10-15 requests a 1 solo request.';

-- =====================================================
-- 2. ABSENCE FUNCTIONS
-- =====================================================

-- Calcular días de ausencia
CREATE OR REPLACE FUNCTION calculate_absence_days(
  p_start_date date,
  p_end_date date
)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN (p_end_date - p_start_date) + 1;
END;
$$;

COMMENT ON FUNCTION calculate_absence_days(date, date) IS 
'Calcula el número de días de ausencia entre dos fechas (inclusivo).';

-- Verificar disponibilidad de empleado en fecha
CREATE OR REPLACE FUNCTION is_employee_available_on_date(
  p_employee_id uuid,
  p_business_id uuid,
  p_check_date date
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_has_absence BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM employee_absences
    WHERE employee_id = p_employee_id
      AND business_id = p_business_id
      AND status = 'approved'
      AND p_check_date BETWEEN start_date AND end_date
  ) INTO v_has_absence;
  
  RETURN NOT v_has_absence;
END;
$$;

COMMENT ON FUNCTION is_employee_available_on_date(uuid, uuid, date) IS 
'Verifica si un empleado está disponible en una fecha específica (no tiene ausencias aprobadas).';

-- =====================================================
-- 3. TRIGGER FUNCTIONS
-- =====================================================

-- Auto-insertar owner como empleado al crear negocio
CREATE OR REPLACE FUNCTION auto_insert_owner_to_business_employees()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.business_employees (
    business_id,
    employee_id,
    role,
    status,
    is_active,
    hire_date,
    employee_type,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.owner_id,
    'manager',
    'approved',
    true,
    CURRENT_DATE,
    'location_manager',
    NOW(),
    NOW()
  )
  ON CONFLICT (business_id, employee_id) DO NOTHING;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION auto_insert_owner_to_business_employees() IS 
'Trigger function: Auto-registra al owner del negocio como empleado (manager) al crear un nuevo negocio.';

-- Sincronizar business_roles desde business_employees
CREATE OR REPLACE FUNCTION sync_business_roles_from_business_employees()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_assigned_by UUID;
  v_existing_role_id UUID;
BEGIN
  -- Obtener el owner/admin del negocio
  SELECT owner_id INTO v_assigned_by
  FROM businesses
  WHERE id = NEW.business_id
  LIMIT 1;

  -- Si no hay admin, usar el employee_id (error case fallback)
  IF v_assigned_by IS NULL THEN
    v_assigned_by := NEW.employee_id;
  END IF;

  -- Verificar si ya existe
  SELECT id INTO v_existing_role_id
  FROM business_roles
  WHERE user_id = NEW.employee_id
  AND business_id = NEW.business_id
  LIMIT 1;

  IF v_existing_role_id IS NULL THEN
    -- Insertar nuevo registro
    INSERT INTO business_roles (
      user_id,
      business_id,
      role,
      hierarchy_level,
      is_active,
      assigned_by
    )
    VALUES (
      NEW.employee_id,
      NEW.business_id,
      CASE WHEN NEW.role = 'manager' THEN 'admin' ELSE 'employee' END,
      CASE WHEN NEW.role = 'manager' THEN 1 ELSE 4 END,
      NEW.is_active,
      v_assigned_by
    );
  ELSE
    -- Actualizar si cambió el estado
    UPDATE business_roles
    SET 
      is_active = NEW.is_active,
      role = CASE WHEN NEW.role = 'manager' THEN 'admin' ELSE 'employee' END,
      hierarchy_level = CASE WHEN NEW.role = 'manager' THEN 1 ELSE 4 END,
      updated_at = NOW()
    WHERE id = v_existing_role_id;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION sync_business_roles_from_business_employees() IS 
'Trigger function: Mantiene sincronizado business_roles con business_employees. 
Manager → Admin (hierarchy_level=1), Employee → Employee (hierarchy_level=4).';

-- =====================================================
-- 4. TRIGGERS (solo si no existen)
-- =====================================================

-- Trigger: Auto-insertar owner al crear negocio
DROP TRIGGER IF EXISTS trg_auto_insert_owner_to_business_employees ON businesses;
CREATE TRIGGER trg_auto_insert_owner_to_business_employees
  AFTER INSERT ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION auto_insert_owner_to_business_employees();

-- Trigger: Sincronizar business_roles desde business_employees
DROP TRIGGER IF EXISTS trg_sync_business_roles_from_business_employees ON business_employees;
CREATE TRIGGER trg_sync_business_roles_from_business_employees
  AFTER INSERT OR UPDATE ON business_employees
  FOR EACH ROW
  EXECUTE FUNCTION sync_business_roles_from_business_employees();

-- =====================================================
-- FIN DEL SNAPSHOT BASE
-- =====================================================

-- NOTAS IMPORTANTES:
-- 1. Este snapshot incluye SOLO las funciones y triggers críticos para el funcionamiento actual
-- 2. NO incluye definiciones de tablas (ya existen en producción)
-- 3. NO incluye RLS policies (ya existen en producción)
-- 4. Si necesitas el esquema completo de tablas, ejecuta: npx supabase db pull
-- 5. Todas las migraciones anteriores están en: supabase/migrations_backup_20251201_100323/
