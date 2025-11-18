-- =====================================================================
-- MIGRACIÓN 9: Permisos para Gastos Recurrentes y Configuración Salarial
-- =====================================================================
-- Componentes protegidos:
--   24. BusinessRecurringExpenses (Admin - expenses.create, expenses.delete)
--   25. EmployeeSalaryConfig (Admin - employees.edit_salary)
-- 
-- Total: 162 permisos nuevos (3 tipos × 54 admin-business)
-- =====================================================================

-- Verificar permisos existentes antes de insertar
DO $$
DECLARE
  existing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO existing_count
  FROM user_permissions
  WHERE permission IN ('expenses.create', 'expenses.delete', 'employees.edit_salary');
  
  RAISE NOTICE 'Permisos existentes para expenses/salary: %', existing_count;
END $$;
-- PERMISO 1: expenses.create (Crear gastos recurrentes)
-- Componente: BusinessRecurringExpenses - Botón "Agregar Egreso Recurrente"
INSERT INTO user_permissions (business_id, user_id, permission, granted_by, is_active)
SELECT 
  br.business_id,
  br.user_id,
  'expenses.create',
  b.owner_id,
  TRUE
FROM business_roles br
JOIN businesses b ON b.id = br.business_id
WHERE br.role = 'admin'
ON CONFLICT (business_id, user_id, permission) DO NOTHING;
-- PERMISO 2: expenses.delete (Eliminar gastos recurrentes)
-- Componente: BusinessRecurringExpenses - Botón eliminar (Trash2)
INSERT INTO user_permissions (business_id, user_id, permission, granted_by, is_active)
SELECT 
  br.business_id,
  br.user_id,
  'expenses.delete',
  b.owner_id,
  TRUE
FROM business_roles br
JOIN businesses b ON b.id = br.business_id
WHERE br.role = 'admin'
ON CONFLICT (business_id, user_id, permission) DO NOTHING;
-- PERMISO 3: employees.edit_salary (Configurar salarios de empleados)
-- Componente: EmployeeSalaryConfig - Botón "Guardar Configuración de Salario"
INSERT INTO user_permissions (business_id, user_id, permission, granted_by, is_active)
SELECT 
  br.business_id,
  br.user_id,
  'employees.edit_salary',
  b.owner_id,
  TRUE
FROM business_roles br
JOIN businesses b ON b.id = br.business_id
WHERE br.role = 'admin'
ON CONFLICT (business_id, user_id, permission) DO NOTHING;
-- Verificar permisos insertados
DO $$
DECLARE
  new_count INTEGER;
  total_count INTEGER;
  unique_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO new_count
  FROM user_permissions
  WHERE permission IN ('expenses.create', 'expenses.delete', 'employees.edit_salary');
  
  SELECT COUNT(*) INTO total_count FROM user_permissions;
  SELECT COUNT(DISTINCT permission) INTO unique_count FROM user_permissions;
  
  RAISE NOTICE '✅ MIGRACIÓN 9 COMPLETADA:';
  RAISE NOTICE '   - Permisos expenses/salary: %', new_count;
  RAISE NOTICE '   - Total permisos en BD: %', total_count;
  RAISE NOTICE '   - Tipos únicos: %', unique_count;
END $$;
-- COMENTARIOS FINALES:
-- expenses.create: Permite crear gastos recurrentes del negocio (seguros, software, impuestos, etc.)
-- expenses.delete: Permite eliminar gastos recurrentes configurados
-- employees.edit_salary: Permite configurar salarios base y automatización de nómina
-- Total esperado: 162 permisos (3 × 54 admin-business)
-- Progreso Fase 5: 25/30 módulos protegidos (83%);
