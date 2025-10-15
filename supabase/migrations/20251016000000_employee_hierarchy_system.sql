-- =====================================================
-- MIGRACIÓN: Sistema de Jerarquía de Empleados
-- Fecha: 16 de Octubre 2025
-- Descripción: Implementa sistema completo de jerarquía organizacional
-- =====================================================

-- =====================================================
-- 1. EXTENSIONES DE TABLAS
-- =====================================================

-- Extender business_roles con jerarquía
ALTER TABLE business_roles
  ADD COLUMN IF NOT EXISTS hierarchy_level INTEGER DEFAULT 4 CHECK (hierarchy_level BETWEEN 0 AND 4),
  ADD COLUMN IF NOT EXISTS reports_to UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Extender business_employees con job_title
ALTER TABLE business_employees
  ADD COLUMN IF NOT EXISTS job_title VARCHAR(100);

-- Actualizar constraint de employee_type
ALTER TABLE business_employees DROP CONSTRAINT IF EXISTS business_employees_employee_type_check;
ALTER TABLE business_employees
  ADD CONSTRAINT business_employees_employee_type_check
  CHECK (employee_type IN ('service_provider', 'support_staff', 'location_manager', 'team_lead'));

-- =====================================================
-- 2. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para business_roles
CREATE INDEX IF NOT EXISTS idx_business_roles_hierarchy 
  ON business_roles(business_id, hierarchy_level);

CREATE INDEX IF NOT EXISTS idx_business_roles_reports_to 
  ON business_roles(reports_to) 
  WHERE reports_to IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_business_roles_hierarchy_full 
  ON business_roles(business_id, hierarchy_level, reports_to, is_active);

CREATE INDEX IF NOT EXISTS idx_business_roles_direct_reports 
  ON business_roles(reports_to, business_id);

-- Índice para business_employees
CREATE INDEX IF NOT EXISTS idx_business_employees_job_title 
  ON business_employees(job_title) 
  WHERE job_title IS NOT NULL;

-- =====================================================
-- 3. FUNCIÓN: Validar Jerarquía Sin Ciclos
-- =====================================================

CREATE OR REPLACE FUNCTION validate_hierarchy_no_cycles()
RETURNS TRIGGER AS $$
DECLARE
  current_supervisor UUID;
  visited_ids UUID[] := ARRAY[NEW.user_id];
  max_depth INTEGER := 10;
  depth INTEGER := 0;
BEGIN
  -- Si no hay supervisor, permitir
  IF NEW.reports_to IS NULL THEN
    RETURN NEW;
  END IF;

  -- No puede reportar a sí mismo
  IF NEW.reports_to = NEW.user_id THEN
    RAISE EXCEPTION 'Un empleado no puede reportar a sí mismo';
  END IF;

  current_supervisor := NEW.reports_to;

  -- Recorrer cadena de supervisores
  WHILE current_supervisor IS NOT NULL AND depth < max_depth LOOP
    -- Si ya visitamos este ID, hay un ciclo
    IF current_supervisor = ANY(visited_ids) THEN
      RAISE EXCEPTION 'La asignación crearía un ciclo en la jerarquía';
    END IF;

    visited_ids := array_append(visited_ids, current_supervisor);
    depth := depth + 1;

    -- Obtener siguiente supervisor
    SELECT reports_to INTO current_supervisor
    FROM business_roles
    WHERE user_id = current_supervisor
      AND business_id = NEW.business_id;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. FUNCIÓN: Enforcer Owner Hierarchy Rules
-- =====================================================

CREATE OR REPLACE FUNCTION enforce_owner_hierarchy()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el usuario es owner del negocio
  IF EXISTS (
    SELECT 1 FROM businesses
    WHERE id = NEW.business_id AND owner_id = NEW.user_id
  ) THEN
    -- Forzar nivel 0 y sin supervisor
    NEW.hierarchy_level := 0;
    NEW.reports_to := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. TRIGGERS
-- =====================================================

-- Trigger para validar ciclos (INSERT y UPDATE)
DROP TRIGGER IF EXISTS validate_hierarchy_no_cycles_trigger ON business_roles;
CREATE TRIGGER validate_hierarchy_no_cycles_trigger
  BEFORE INSERT OR UPDATE OF reports_to
  ON business_roles
  FOR EACH ROW
  EXECUTE FUNCTION validate_hierarchy_no_cycles();

-- Trigger para enforcer reglas de Owner
DROP TRIGGER IF EXISTS enforce_owner_hierarchy_trigger ON business_roles;
CREATE TRIGGER enforce_owner_hierarchy_trigger
  BEFORE INSERT OR UPDATE
  ON business_roles
  FOR EACH ROW
  EXECUTE FUNCTION enforce_owner_hierarchy();

-- =====================================================
-- 6. FUNCIÓN RPC: get_business_hierarchy
-- =====================================================

CREATE OR REPLACE FUNCTION get_business_hierarchy(p_business_id UUID)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  email TEXT,
  role TEXT,
  employee_type TEXT,
  hierarchy_level INTEGER,
  job_title TEXT,
  reports_to UUID,
  supervisor_name TEXT,
  supervisor_email TEXT,
  direct_reports_count INTEGER,
  occupancy_percentage NUMERIC,
  average_rating NUMERIC,
  total_revenue NUMERIC,
  department_id UUID,
  department_name TEXT,
  is_active BOOLEAN,
  hire_date DATE,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    br.user_id,
    p.full_name,
    p.email,
    br.role,
    be.employee_type,
    br.hierarchy_level,
    be.job_title,
    br.reports_to,
    supervisor.full_name AS supervisor_name,
    supervisor.email AS supervisor_email,
    (
      SELECT COUNT(*)::INTEGER
      FROM business_roles br2
      WHERE br2.reports_to = br.user_id
        AND br2.business_id = p_business_id
        AND br2.is_active = true
    ) AS direct_reports_count,
    NULL::NUMERIC AS occupancy_percentage,  -- Se calcula con RPC separada
    NULL::NUMERIC AS average_rating,        -- Se calcula con RPC separada
    NULL::NUMERIC AS total_revenue,         -- Se calcula con RPC separada
    be.department_id,
    NULL::TEXT AS department_name,          -- Agregar join si existe tabla departments
    br.is_active,
    be.hire_date,
    p.phone,
    p.avatar_url,
    br.created_at,
    br.updated_at
  FROM business_roles br
  INNER JOIN profiles p ON br.user_id = p.id
  LEFT JOIN business_employees be ON be.employee_id = br.user_id AND be.business_id = p_business_id
  LEFT JOIN profiles supervisor ON br.reports_to = supervisor.id
  WHERE br.business_id = p_business_id
  ORDER BY br.hierarchy_level, p.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. FUNCIÓN RPC: calculate_employee_occupancy
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_employee_occupancy(
  p_user_id UUID,
  p_business_id UUID
)
RETURNS NUMERIC AS $$
DECLARE
  total_appointments INTEGER;
  completed_appointments INTEGER;
  occupancy NUMERIC;
BEGIN
  -- Contar citas totales del empleado
  SELECT COUNT(*) INTO total_appointments
  FROM appointments
  WHERE employee_id = p_user_id
    AND business_id = p_business_id
    AND status IN ('confirmed', 'completed', 'cancelled', 'no_show')
    AND start_time >= NOW() - INTERVAL '30 days';

  -- Si no hay citas, retornar 0
  IF total_appointments = 0 THEN
    RETURN 0;
  END IF;

  -- Contar citas completadas
  SELECT COUNT(*) INTO completed_appointments
  FROM appointments
  WHERE employee_id = p_user_id
    AND business_id = p_business_id
    AND status = 'completed'
    AND start_time >= NOW() - INTERVAL '30 days';

  -- Calcular porcentaje
  occupancy := (completed_appointments::NUMERIC / total_appointments::NUMERIC) * 100;

  RETURN ROUND(occupancy, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. FUNCIÓN RPC: calculate_employee_rating_by_business
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_employee_rating_by_business(
  p_user_id UUID,
  p_business_id UUID
)
RETURNS NUMERIC AS $$
DECLARE
  avg_rating NUMERIC;
BEGIN
  SELECT AVG(rating)::NUMERIC INTO avg_rating
  FROM reviews
  WHERE reviewee_id = p_user_id
    AND business_id = p_business_id
    AND is_visible = true;

  RETURN COALESCE(ROUND(avg_rating, 2), 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. FUNCIÓN RPC: calculate_employee_revenue
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_employee_revenue(
  p_user_id UUID,
  p_business_id UUID
)
RETURNS NUMERIC AS $$
DECLARE
  total_revenue NUMERIC;
BEGIN
  SELECT COALESCE(SUM(total_price), 0)::NUMERIC INTO total_revenue
  FROM appointments
  WHERE employee_id = p_user_id
    AND business_id = p_business_id
    AND status = 'completed'
    AND start_time >= NOW() - INTERVAL '30 days';

  RETURN ROUND(total_revenue, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. FUNCIÓN RPC: update_employee_hierarchy
-- =====================================================

CREATE OR REPLACE FUNCTION update_employee_hierarchy(
  p_user_id UUID,
  p_business_id UUID,
  p_hierarchy_level INTEGER DEFAULT NULL,
  p_reports_to UUID DEFAULT NULL,
  p_job_title TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Validar que el negocio existe
  IF NOT EXISTS (SELECT 1 FROM businesses WHERE id = p_business_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Negocio no encontrado'
    );
  END IF;

  -- Actualizar business_roles si hay cambios de jerarquía
  IF p_hierarchy_level IS NOT NULL OR p_reports_to IS NOT NULL THEN
    UPDATE business_roles
    SET 
      hierarchy_level = COALESCE(p_hierarchy_level, hierarchy_level),
      reports_to = CASE 
        WHEN p_reports_to = 'null'::UUID THEN NULL 
        ELSE COALESCE(p_reports_to, reports_to) 
      END,
      updated_at = NOW()
    WHERE user_id = p_user_id
      AND business_id = p_business_id;
  END IF;

  -- Actualizar business_employees si hay cambio de job_title
  IF p_job_title IS NOT NULL THEN
    UPDATE business_employees
    SET 
      job_title = p_job_title,
      updated_at = NOW()
    WHERE employee_id = p_user_id
      AND business_id = p_business_id;
  END IF;

  RETURN json_build_object(
    'success', true,
    'message', 'Jerarquía actualizada correctamente'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 11. FUNCIÓN RPC: assign_supervisor
-- =====================================================

CREATE OR REPLACE FUNCTION assign_supervisor(
  p_employee_id UUID,
  p_supervisor_id UUID,
  p_business_id UUID
)
RETURNS JSON AS $$
BEGIN
  -- Validar que ambos usuarios son del mismo negocio
  IF NOT EXISTS (
    SELECT 1 FROM business_roles
    WHERE user_id = p_employee_id AND business_id = p_business_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Empleado no encontrado en el negocio'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM business_roles
    WHERE user_id = p_supervisor_id AND business_id = p_business_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Supervisor no encontrado en el negocio'
    );
  END IF;

  -- Actualizar supervisor
  UPDATE business_roles
  SET 
    reports_to = p_supervisor_id,
    updated_at = NOW()
  WHERE user_id = p_employee_id
    AND business_id = p_business_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Supervisor asignado correctamente'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 12. FUNCIÓN RPC: calculate_all_reports_count
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_all_reports_count(
  p_user_id UUID,
  p_business_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  total_reports INTEGER := 0;
  direct_reports UUID[];
  report_id UUID;
BEGIN
  -- Obtener reportes directos
  SELECT ARRAY_AGG(user_id) INTO direct_reports
  FROM business_roles
  WHERE reports_to = p_user_id
    AND business_id = p_business_id
    AND is_active = true;

  -- Si no hay reportes directos, retornar 0
  IF direct_reports IS NULL THEN
    RETURN 0;
  END IF;

  -- Contar reportes directos
  total_reports := array_length(direct_reports, 1);

  -- Recursivamente contar reportes de cada reporte directo
  FOREACH report_id IN ARRAY direct_reports LOOP
    total_reports := total_reports + calculate_all_reports_count(report_id, p_business_id);
  END LOOP;

  RETURN total_reports;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 13. POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Política para business_roles - lectura de jerarquía
DROP POLICY IF EXISTS "Users can view hierarchy of their businesses" ON business_roles;
CREATE POLICY "Users can view hierarchy of their businesses"
  ON business_roles FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
      UNION
      SELECT business_id FROM business_roles WHERE user_id = auth.uid()
    )
  );

-- Política para business_roles - modificación de jerarquía (solo owners)
DROP POLICY IF EXISTS "Only owners can modify hierarchy" ON business_roles;
CREATE POLICY "Only owners can modify hierarchy"
  ON business_roles FOR UPDATE
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- =====================================================
-- 14. PERMISOS ADICIONALES
-- =====================================================

-- Comentarios en tablas para documentación
COMMENT ON COLUMN business_roles.hierarchy_level IS 'Nivel jerárquico: 0=Owner, 1=Admin, 2=Manager, 3=Lead, 4=Staff';
COMMENT ON COLUMN business_roles.reports_to IS 'ID del supervisor directo (NULL para Owner)';
COMMENT ON COLUMN business_employees.job_title IS 'Cargo personalizado del negocio (ej: "Estilista Senior")';

-- =====================================================
-- 15. VERIFICACIÓN FINAL
-- =====================================================

-- Verificar que las funciones fueron creadas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'get_business_hierarchy'
  ) THEN
    RAISE EXCEPTION 'Función get_business_hierarchy no fue creada';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'calculate_employee_occupancy'
  ) THEN
    RAISE EXCEPTION 'Función calculate_employee_occupancy no fue creada';
  END IF;

  RAISE NOTICE 'Migración de Employee Hierarchy completada exitosamente';
END $$;
