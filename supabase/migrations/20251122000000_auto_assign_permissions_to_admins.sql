-- =====================================================
-- MIGRACIÓN: Auto-asignación de permisos a business admins
-- Fecha: 22 de noviembre de 2025
-- Autor: TI-Turing Team (Bug Fix Sesión 6)
-- Descripción: Asigna automáticamente permisos completos a admins en business_roles
-- Prioridad: P2 (ALTA) - Soluciona botones faltantes en AdminDashboard
-- =====================================================

-- =====================================================
-- PASO 1: Backfill - Asignar permisos a admins existentes
-- =====================================================

DO $$
DECLARE
  v_admin RECORD;
  v_permission TEXT;
  v_count INT := 0;
  v_total INT := 0;
BEGIN
  RAISE NOTICE '🔐 INICIANDO: Auto-asignación de permisos a administradores existentes';
  
  -- Iterar sobre todos los admins en business_roles
  FOR v_admin IN 
    SELECT br.business_id, br.user_id, b.name as business_name
    FROM business_roles br
    JOIN businesses b ON b.id = br.business_id
    WHERE br.role = 'admin'
  LOOP
    v_count := 0;
    RAISE NOTICE '  → Procesando admin % en negocio % (%)', v_admin.user_id, v_admin.business_id, v_admin.business_name;
    
    -- Lista completa de permisos para admins (79 permisos - igual que owners)
    FOR v_permission IN 
      SELECT unnest(ARRAY[
        -- Business Management (5)
        'business.view', 'business.edit', 'business.delete', 'business.settings', 'business.categories',
        
        -- Locations (5)
        'locations.view', 'locations.create', 'locations.edit', 'locations.delete', 'locations.assign_employees',
        
        -- Services (5)
        'services.view', 'services.create', 'services.edit', 'services.delete', 'services.prices',
        
        -- Resources (4)
        'resources.view', 'resources.create', 'resources.edit', 'resources.delete',
        
        -- Employees (8)
        'employees.view', 'employees.create', 'employees.edit', 'employees.delete', 
        'employees.assign_services', 'employees.view_payroll', 'employees.manage_payroll', 'employees.set_schedules',
        
        -- Appointments (7)
        'appointments.view_all', 'appointments.view_own', 'appointments.create', 'appointments.edit', 
        'appointments.delete', 'appointments.assign', 'appointments.confirm',
        
        -- Appointments Client Permissions (3)
        'appointments.cancel_own', 'appointments.reschedule_own', 'appointments.view_history',
        
        -- Clients (7)
        'clients.view', 'clients.create', 'clients.edit', 'clients.delete', 
        'clients.export', 'clients.communication', 'clients.history',
        
        -- Accounting (9)
        'accounting.view', 'accounting.tax_config', 'accounting.expenses.view', 'accounting.expenses.create', 
        'accounting.expenses.pay', 'accounting.payroll.view', 'accounting.payroll.create', 
        'accounting.payroll.config', 'accounting.export',
        
        -- Expenses (2)
        'expenses.create', 'expenses.delete',
        
        -- Reports (4)
        'reports.view_financial', 'reports.view_operations', 'reports.export', 'reports.analytics',
        
        -- Permissions Management (5)
        'permissions.view', 'permissions.assign_admin', 'permissions.assign_employee', 
        'permissions.modify', 'permissions.revoke',
        
        -- Recruitment (4)
        'recruitment.view', 'recruitment.create_vacancy', 'recruitment.view_applications', 'recruitment.approve_hire',
        
        -- Chat (3)
        'chat.view_all', 'chat.delete', 'chat.moderate',
        
        -- Reviews (4)
        'reviews.create', 'reviews.moderate', 'reviews.respond', 'reviews.toggle_visibility',
        
        -- Favorites (1)
        'favorites.toggle',
        
        -- Notifications (3)
        'notifications.send', 'notifications.bulk', 'notifications.manage',
        
        -- Settings (3)
        'settings.view', 'settings.edit_own', 'settings.edit_business',
        
        -- Absences (2)
        'absences.approve', 'absences.request',
        
        -- Sales (1)
        'sales.create',
        
        -- Billing (2)
        'billing.manage', 'billing.view'
      ])
    LOOP
      -- Insertar permiso (ON CONFLICT DO NOTHING para evitar duplicados)
      INSERT INTO public.user_permissions (
        user_id,
        business_id,
        permission,
        granted_by,
        is_active,
        created_at,
        updated_at
      )
      VALUES (
        v_admin.user_id,
        v_admin.business_id,
        v_permission,
        NULL,  -- Auto-asignado por sistema
        TRUE,
        NOW(),
        NOW()
      )
      ON CONFLICT (business_id, user_id, permission) DO NOTHING;
      
      -- Incrementar contador si se insertó
      IF FOUND THEN
        v_count := v_count + 1;
      END IF;
    END LOOP;
    
    v_total := v_total + v_count;
    RAISE NOTICE '    ✅ Asignados % permisos', v_count;
    
  END LOOP;
  
  RAISE NOTICE '🎉 COMPLETADO: % permisos asignados en total a administradores', v_total;
  
END $$;

-- =====================================================
-- PASO 2: Crear trigger para futuros admins
-- =====================================================

-- Función que se ejecuta cuando se inserta/actualiza un admin en business_roles
CREATE OR REPLACE FUNCTION auto_assign_permissions_to_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_permission TEXT;
  v_count INT := 0;
BEGIN
  -- Solo aplicar si es un admin (role = 'admin')
  IF NEW.role != 'admin' THEN
    RETURN NEW;
  END IF;

  RAISE NOTICE '🔐 Auto-asignando permisos a admin % del negocio %', NEW.user_id, NEW.business_id;

  -- Lista completa de permisos para admins (79 permisos)
  FOR v_permission IN 
    SELECT unnest(ARRAY[
      'business.view', 'business.edit', 'business.delete', 'business.settings', 'business.categories',
      'locations.view', 'locations.create', 'locations.edit', 'locations.delete', 'locations.assign_employees',
      'services.view', 'services.create', 'services.edit', 'services.delete', 'services.prices',
      'resources.view', 'resources.create', 'resources.edit', 'resources.delete',
      'employees.view', 'employees.create', 'employees.edit', 'employees.delete', 
      'employees.assign_services', 'employees.view_payroll', 'employees.manage_payroll', 'employees.set_schedules',
      'appointments.view_all', 'appointments.view_own', 'appointments.create', 'appointments.edit', 
      'appointments.delete', 'appointments.assign', 'appointments.confirm',
      'appointments.cancel_own', 'appointments.reschedule_own', 'appointments.view_history',
      'clients.view', 'clients.create', 'clients.edit', 'clients.delete', 
      'clients.export', 'clients.communication', 'clients.history',
      'accounting.view', 'accounting.tax_config', 'accounting.expenses.view', 'accounting.expenses.create', 
      'accounting.expenses.pay', 'accounting.payroll.view', 'accounting.payroll.create', 
      'accounting.payroll.config', 'accounting.export',
      'expenses.create', 'expenses.delete',
      'reports.view_financial', 'reports.view_operations', 'reports.export', 'reports.analytics',
      'permissions.view', 'permissions.assign_admin', 'permissions.assign_employee', 
      'permissions.modify', 'permissions.revoke',
      'recruitment.view', 'recruitment.create_vacancy', 'recruitment.view_applications', 'recruitment.approve_hire',
      'chat.view_all', 'chat.delete', 'chat.moderate',
      'reviews.create', 'reviews.moderate', 'reviews.respond', 'reviews.toggle_visibility',
      'favorites.toggle',
      'notifications.send', 'notifications.bulk', 'notifications.manage',
      'settings.view', 'settings.edit_own', 'settings.edit_business',
      'absences.approve', 'absences.request',
      'sales.create',
      'billing.manage', 'billing.view'
    ])
  LOOP
    INSERT INTO public.user_permissions (
      user_id,
      business_id,
      permission,
      granted_by,
      is_active,
      created_at,
      updated_at
    )
    VALUES (
      NEW.user_id,
      NEW.business_id,
      v_permission,
      NULL,
      TRUE,
      NOW(),
      NOW()
    )
    ON CONFLICT (business_id, user_id, permission) DO NOTHING;
    
    IF FOUND THEN
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RAISE NOTICE '  ✅ Asignados % permisos al admin %', v_count, NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Crear trigger para INSERT y UPDATE en business_roles
DROP TRIGGER IF EXISTS trg_auto_assign_permissions_to_admin ON business_roles;

CREATE TRIGGER trg_auto_assign_permissions_to_admin
  AFTER INSERT OR UPDATE OF role ON business_roles
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_permissions_to_admin();

-- =====================================================
-- PASO 3: Comentarios y documentación
-- =====================================================

COMMENT ON FUNCTION auto_assign_permissions_to_admin() IS 
'Auto-asigna 79 permisos completos a usuarios cuando se les asigna role=admin en business_roles. 
Trigger ejecutado automáticamente en INSERT/UPDATE. 
Fecha: 22 Nov 2025 | Bug Fix Sesión 6';

-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================
