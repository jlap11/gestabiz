-- ============================================================================
-- MIGRACIÓN: Auto-insertar owner como empleado en business_employees
-- Fecha: 19 de octubre, 2025
-- Descripción: Crea trigger para agregar automáticamente el owner como 
--              empleado al crear un negocio, y backfill de datos existentes
-- ============================================================================

-- =====================================================
-- FUNCIÓN: auto_insert_owner_to_business_employees
-- =====================================================
CREATE OR REPLACE FUNCTION auto_insert_owner_to_business_employees()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar el owner como empleado con role 'manager'
  -- IMPORTANTE: employee_type debe ser: service_provider, support_staff, location_manager, o team_lead
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
    'location_manager',  -- Owner como location_manager (gestor de la ubicación/negocio)
    NOW(),
    NOW()
  )
  ON CONFLICT (business_id, employee_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER: trigger_auto_insert_owner_to_business_employees
-- =====================================================
DROP TRIGGER IF EXISTS trigger_auto_insert_owner_to_business_employees ON businesses;
CREATE TRIGGER trigger_auto_insert_owner_to_business_employees
  AFTER INSERT ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION auto_insert_owner_to_business_employees();

-- =====================================================
-- BACKFILL: Agregar owners existentes que no están en business_employees
-- =====================================================
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
SELECT 
  b.id as business_id,
  b.owner_id as employee_id,
  'manager' as role,
  'approved' as status,
  true as is_active,
  COALESCE(b.created_at::date, CURRENT_DATE) as hire_date,
  'location_manager' as employee_type,  -- Owner como location_manager
  NOW() as created_at,
  NOW() as updated_at
FROM businesses b
LEFT JOIN business_employees be ON be.business_id = b.id AND be.employee_id = b.owner_id
WHERE be.id IS NULL  -- Solo insertar si no existe
  AND b.owner_id IS NOT NULL  -- Solo si hay un owner válido
ON CONFLICT (business_id, employee_id) DO NOTHING;

-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON FUNCTION auto_insert_owner_to_business_employees() IS 
'Función que agrega automáticamente al owner como empleado (manager) cuando se crea un negocio';

COMMENT ON TRIGGER trigger_auto_insert_owner_to_business_employees ON businesses IS 
'Trigger que ejecuta la función auto_insert_owner_to_business_employees después de crear un negocio';

