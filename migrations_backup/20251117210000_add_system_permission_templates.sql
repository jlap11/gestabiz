-- Migration: Add Permission Templates for Common Roles
-- Created: 2025-11-17
-- Purpose: Add pre-configured permission templates for common business roles
-- Templates: Vendedor (8 permisos), Cajero (6 permisos), Manager de Sede (15 permisos)

-- ============================================================================
-- TEMPLATE 1: VENDEDOR (Sales Representative)
-- ============================================================================
-- Permissions: Create/view appointments, services, manage own sales
-- Use Case: Employee focused on sales and customer booking
-- ============================================================================

INSERT INTO permission_templates (
  business_id,
  name,
  description,
  role,
  permissions,
  is_system_template,
  created_by
)
SELECT 
  b.id,
  'Vendedor',
  'Permisos para representante de ventas: gestión de citas, servicios y ventas propias',
  'employee',
  '[
    "appointments.create",
    "appointments.view",
    "appointments.edit",
    "services.view",
    "locations.view",
    "sales.create",
    "reviews.view",
    "notifications.view"
  ]'::jsonb,
  true,
  b.owner_id
FROM businesses b
ON CONFLICT (business_id, name) DO NOTHING;

-- ============================================================================
-- TEMPLATE 2: CAJERO (Cashier)
-- ============================================================================
-- Permissions: Process sales, view services/appointments, basic accounting
-- Use Case: Employee handling payments and transactions
-- ============================================================================

INSERT INTO permission_templates (
  business_id,
  name,
  description,
  role,
  permissions,
  is_system_template,
  created_by
)
SELECT 
  b.id,
  'Cajero',
  'Permisos para cajero: procesar ventas, transacciones y consultar citas',
  'employee',
  '[
    "sales.create",
    "accounting.create",
    "appointments.view",
    "services.view",
    "locations.view",
    "notifications.view"
  ]'::jsonb,
  true,
  b.owner_id
FROM businesses b
ON CONFLICT (business_id, name) DO NOTHING;

-- ============================================================================
-- TEMPLATE 3: MANAGER DE SEDE (Location Manager)
-- ============================================================================
-- Permissions: Full location management, employee coordination, reporting
-- Use Case: Employee managing a specific location/branch
-- ============================================================================

INSERT INTO permission_templates (
  business_id,
  name,
  description,
  role,
  permissions,
  is_system_template,
  created_by
)
SELECT 
  b.id,
  'Manager de Sede',
  'Permisos para gerente de sede: gestión completa de ubicación, empleados y reportes',
  'employee',
  '[
    "appointments.create",
    "appointments.edit",
    "appointments.view",
    "appointments.cancel",
    "services.view",
    "locations.view",
    "employees.view",
    "sales.create",
    "accounting.view_reports",
    "expenses.view",
    "reviews.view",
    "reviews.respond",
    "notifications.view",
    "notifications.manage",
    "absences.approve"
  ]'::jsonb,
  true,
  b.owner_id
FROM businesses b
ON CONFLICT (business_id, name) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Count templates created per business
SELECT 
  b.name as business_name,
  COUNT(pt.id) as templates_count
FROM businesses b
LEFT JOIN permission_templates pt ON pt.business_id = b.id AND pt.is_system_template = true
GROUP BY b.id, b.name
ORDER BY templates_count DESC;

-- List all system templates
SELECT 
  b.name as business_name,
  pt.name as template_name,
  pt.role,
  jsonb_array_length(pt.permissions) as permissions_count,
  pt.permissions
FROM permission_templates pt
JOIN businesses b ON b.id = pt.business_id
WHERE pt.is_system_template = true
ORDER BY b.name, pt.name;

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

/*
DELETE FROM permission_templates 
WHERE is_system_template = true 
  AND name IN ('Vendedor', 'Cajero', 'Manager de Sede');
*/

-- ============================================================================
-- NOTES
-- ============================================================================

/*
Template Application Example:

-- Apply "Vendedor" template to employee
WITH template AS (
  SELECT permissions FROM permission_templates
  WHERE business_id = 'your_business_id' AND name = 'Vendedor'
  LIMIT 1
),
permisos_array AS (
  SELECT jsonb_array_elements_text(permissions) as permission
  FROM template
)
INSERT INTO user_permissions (business_id, user_id, permission, granted_by, is_active)
SELECT 
  'your_business_id',
  'employee_user_id',
  permission,
  'admin_user_id',
  true
FROM permisos_array
ON CONFLICT (business_id, user_id, permission)
DO UPDATE SET is_active = true, granted_by = EXCLUDED.granted_by, updated_at = NOW();

*/
