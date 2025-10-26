-- =====================================================
-- MIGRACIÓN: Sincronizar business_roles desde business_employees
-- =====================================================
-- PROPÓSITO: Crear trigger que automáticamente registra empleados 
--            en business_roles cuando se crean en business_employees
-- 
-- PROBLEMA: La RPC get_business_hierarchy usa business_roles
--           pero empleados se registran en business_employees
--           Esto causaba que no aparecieran en gestión de empleados
-- 
-- SOLUCIÓN: Trigger que sincroniza automáticamente ambas tablas
-- =====================================================

-- 1. Crear función para sincronizar business_roles
CREATE OR REPLACE FUNCTION sync_business_roles_from_business_employees()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_id UUID;
  v_assigned_by UUID;
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

  -- Insertar en business_roles si no existe
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
    CASE 
      WHEN NEW.role = 'manager' THEN 'admin'
      ELSE 'employee'
    END,
    CASE 
      WHEN NEW.role = 'manager' THEN 1
      ELSE 4
    END,
    NEW.is_active,
    v_assigned_by
  )
  -- Si ya existe (mismo user_id + business_id), actualizar estado
  ON CONFLICT (user_id, business_id) DO UPDATE
  SET 
    is_active = NEW.is_active,
    role = EXCLUDED.role,
    hierarchy_level = EXCLUDED.hierarchy_level,
    updated_at = NOW()
  WHERE business_roles.is_active != NEW.is_active 
     OR business_roles.role != EXCLUDED.role;

  RETURN NEW;
END;
$$;

-- 2. Crear trigger en INSERT de business_employees
DROP TRIGGER IF EXISTS trg_business_employees_sync_roles_insert ON business_employees;
CREATE TRIGGER trg_business_employees_sync_roles_insert
AFTER INSERT ON business_employees
FOR EACH ROW
EXECUTE FUNCTION sync_business_roles_from_business_employees();

-- 3. Crear trigger en UPDATE de business_employees
DROP TRIGGER IF EXISTS trg_business_employees_sync_roles_update ON business_employees;
CREATE TRIGGER trg_business_employees_sync_roles_update
AFTER UPDATE ON business_employees
FOR EACH ROW
WHEN (OLD.is_active IS DISTINCT FROM NEW.is_active OR OLD.role IS DISTINCT FROM NEW.role)
EXECUTE FUNCTION sync_business_roles_from_business_employees();

-- 4. BACKFILL: Sincronizar empleados existentes que no están en business_roles
INSERT INTO business_roles (
  user_id,
  business_id,
  role,
  hierarchy_level,
  is_active,
  assigned_by
)
SELECT 
  be.employee_id,
  be.business_id,
  CASE WHEN be.role = 'manager' THEN 'admin' ELSE 'employee' END,
  CASE WHEN be.role = 'manager' THEN 1 ELSE 4 END,
  be.is_active,
  b.owner_id
FROM business_employees be
JOIN businesses b ON be.business_id = b.id
WHERE NOT EXISTS (
  SELECT 1 FROM business_roles br 
  WHERE br.user_id = be.employee_id 
  AND br.business_id = be.business_id
)
ON CONFLICT (user_id, business_id) DO NOTHING;

-- 5. Comentario de auditoría
COMMENT ON FUNCTION sync_business_roles_from_business_employees() IS 
'Sincroniza business_roles cuando se crea/actualiza business_employees. 
Asegura que la RPC get_business_hierarchy siempre tenga datos actualizados.';
