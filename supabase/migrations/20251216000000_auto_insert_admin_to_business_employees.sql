-- =====================================================================
-- Migración: Auto-inserción de admins en business_employees
-- Fecha: 16/11/2025
-- Autor: TI-Turing Team
-- Descripción: Implementa trigger automático y backfill histórico
-- =====================================================================

-- PASO 1: Crear función que inserta admin como employee
-- =====================================================================

CREATE OR REPLACE FUNCTION auto_insert_admin_as_employee()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Solo ejecutar si:
  -- 1. El rol es 'admin'
  -- 2. El registro está activo
  -- 3. Es un INSERT o el is_active cambió a true
  IF NEW.role = 'admin' AND NEW.is_active = true THEN
    -- Insertar en business_employees si no existe
    INSERT INTO business_employees (
      employee_id,
      business_id,
      role,
      employee_type,
      status,
      is_active,
      hire_date,
      offers_services,
      created_at,
      updated_at
    )
    VALUES (
      NEW.user_id,              -- employee_id (es el mismo user_id)
      NEW.business_id,
      'manager',                -- rol en business_employees
      'location_manager',       -- tipo de empleado
      'approved',               -- pre-aprobado
      true,                     -- activo
      CURRENT_DATE,             -- fecha de contratación hoy
      false,                    -- admins no ofrecen servicios directos
      NOW(),
      NOW()
    )
    ON CONFLICT (employee_id, business_id) 
    DO UPDATE SET
      -- Si ya existe, actualizar campos clave
      is_active = true,
      status = 'approved',
      role = 'manager',
      updated_at = NOW();
    
    RAISE NOTICE 'Admin % registrado en business_employees para negocio %', 
                 NEW.user_id, NEW.business_id;
  END IF;
  
  RETURN NEW;
END;
$$;
-- Agregar comentario a la función
COMMENT ON FUNCTION auto_insert_admin_as_employee() IS 
'Trigger function: Auto-registra admins en business_employees como managers al asignar rol admin en business_roles';
-- =====================================================================
-- PASO 2: Crear trigger AFTER INSERT OR UPDATE
-- =====================================================================

DROP TRIGGER IF EXISTS trg_auto_insert_admin_as_employee ON business_roles;
CREATE TRIGGER trg_auto_insert_admin_as_employee
  AFTER INSERT OR UPDATE OF role, is_active ON business_roles
  FOR EACH ROW
  EXECUTE FUNCTION auto_insert_admin_as_employee();
-- Agregar comentario al trigger
COMMENT ON TRIGGER trg_auto_insert_admin_as_employee ON business_roles IS 
'Auto-registra admins en business_employees cuando se les asigna rol admin';
-- =====================================================================
-- PASO 3: Backfill de admins existentes
-- =====================================================================

-- Insertar TODOS los admins activos que no estén en business_employees
INSERT INTO business_employees (
  employee_id,
  business_id,
  role,
  employee_type,
  status,
  is_active,
  hire_date,
  offers_services,
  created_at,
  updated_at
)
SELECT 
  br.user_id,                  -- employee_id
  br.business_id,
  'manager',                   -- rol
  'location_manager',          -- tipo
  'approved',                  -- status
  true,                        -- is_active
  COALESCE(br.created_at::date, CURRENT_DATE), -- usar fecha de asignación de rol
  false,                       -- offers_services
  NOW(),
  NOW()
FROM business_roles br
WHERE br.role = 'admin' 
  AND br.is_active = true
  AND NOT EXISTS (
    -- No insertar duplicados
    SELECT 1 
    FROM business_employees be 
    WHERE be.employee_id = br.user_id 
      AND be.business_id = br.business_id
  )
ON CONFLICT (employee_id, business_id) DO NOTHING;
-- Log de resultados
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM business_employees be
  INNER JOIN business_roles br ON be.employee_id = br.user_id AND be.business_id = br.business_id
  WHERE br.role = 'admin' AND br.is_active = true;
  
  RAISE NOTICE 'Backfill completado: % admins registrados en business_employees', v_count;
END $$;
-- =====================================================================
-- PASO 4: Verificación post-migración
-- =====================================================================

-- Query de validación (debe retornar 0 filas)
DO $$
DECLARE
  v_missing INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_missing
  FROM business_roles br
  WHERE br.role = 'admin' AND br.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM business_employees be 
      WHERE be.employee_id = br.user_id AND be.business_id = br.business_id
    );
  
  IF v_missing > 0 THEN
    RAISE WARNING '⚠️ Aún faltan % admins por migrar a business_employees', v_missing;
  ELSE
    RAISE NOTICE '✅ Todos los admins están registrados en business_employees';
  END IF;
END $$;
