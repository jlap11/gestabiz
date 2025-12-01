-- =====================================================
-- MIGRACIÓN: Auto-asignación de permisos a business owners
-- Fecha: 19 de noviembre de 2025
-- Autor: TI-Turing Team (QA Testing Fix)
-- Descripción: Asigna automáticamente permisos completos a owners cuando crean negocios
-- Prioridad: P0 (BLOQUEANTE) - Soluciona BUG-004
-- =====================================================

-- =====================================================
-- PASO 1: Crear función que asigna permisos a owner
-- =====================================================

CREATE OR REPLACE FUNCTION auto_assign_permissions_to_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_permission TEXT;
  v_permissions_count INT := 0;
BEGIN
  RAISE NOTICE '🔐 Auto-asignando permisos a owner % del negocio %', NEW.owner_id, NEW.id;

  -- Lista completa de permisos que se asignan a owners (79 permisos totales)
  -- Agrupados por categoría para mejor legibilidad
  FOR v_permission IN 
    SELECT unnest(ARRAY[
      -- Business Management (5)
      'business.view', 'business.edit', 'business.delete', 'business.settings', 'business.categories',
      
      -- Locations (5)
      'locations.view', 'locations.create', 'locations.edit', 'locations.delete', 'locations.assign_employees',
      
      -- Services (5)
      'services.view', 'services.create', 'services.edit', 'services.delete', 'services.prices',
      
      -- Resources (4) - NUEVO (Sistema de Modelo de Negocio Flexible)
      'resources.view', 'resources.create', 'resources.edit', 'resources.delete',
      
      -- Employees (8)
      'employees.view', 'employees.create', 'employees.edit', 'employees.delete', 
      'employees.assign_services', 'employees.view_payroll', 'employees.manage_payroll', 'employees.set_schedules',
      
      -- Appointments (7)
      'appointments.view_all', 'appointments.view_own', 'appointments.create', 'appointments.edit', 
      'appointments.delete', 'appointments.assign', 'appointments.confirm',
      
      -- Appointments Client Permissions (3) - NUEVO
      'appointments.cancel_own', 'appointments.reschedule_own', 'appointments.view_history',
      
      -- Clients (7)
      'clients.view', 'clients.create', 'clients.edit', 'clients.delete', 
      'clients.export', 'clients.communication', 'clients.history',
      
      -- Accounting (9)
      'accounting.view', 'accounting.tax_config', 'accounting.expenses.view', 'accounting.expenses.create', 
      'accounting.expenses.pay', 'accounting.payroll.view', 'accounting.payroll.create', 
      'accounting.payroll.config', 'accounting.export',
      
      -- Expenses (2) - NUEVO
      'expenses.create', 'expenses.delete',
      
      -- Reports (4)
      'reports.view_financial', 'reports.view_operations', 'reports.export', 'reports.analytics',
      
      -- Permissions Management (5)
      'permissions.view', 'permissions.assign_admin', 'permissions.assign_employee', 
      'permissions.modify', 'permissions.revoke',
      
      -- Recruitment (4) - NUEVO
      'recruitment.view', 'recruitment.create_vacancy', 'recruitment.view_applications', 'recruitment.approve_hire',
      
      -- Chat (3) - NUEVO (Phase 5)
      'chat.view_all', 'chat.delete', 'chat.moderate',
      
      -- Reviews (4) - NUEVO
      'reviews.create', 'reviews.moderate', 'reviews.respond', 'reviews.toggle_visibility',
      
      -- Favorites (1) - NUEVO
      'favorites.toggle',
      
      -- Notifications (3) - NUEVO
      'notifications.send', 'notifications.bulk', 'notifications.manage',
      
      -- Settings (3)
      'settings.view', 'settings.edit_own', 'settings.edit_business',
      
      -- Absences (2) - NUEVO (Sistema de Ausencias)
      'absences.approve', 'absences.request',
      
      -- Sales (1) - NUEVO (Ventas Rápidas)
      'sales.create',
      
      -- Billing (2) - NUEVO
      'billing.manage', 'billing.view'
    ])
  LOOP
    -- Insertar permiso en user_permissions
    INSERT INTO public.user_permissions (
      user_id,
      business_id,
      permission,
      granted_by,
      is_active,
      created_at,
      notes
    )
    VALUES (
      NEW.owner_id,
      NEW.id,
      v_permission,
      NEW.owner_id, -- Auto-granted por creación de negocio
      true,
      NOW(),
      'Auto-asignado al crear negocio (trigger: auto_assign_permissions_to_owner)'
    )
    ON CONFLICT (user_id, business_id, permission) DO NOTHING;

    GET DIAGNOSTICS v_permissions_count = ROW_COUNT;
    
    IF v_permissions_count > 0 THEN
      RAISE NOTICE '  ✓ Permiso asignado: %', v_permission;
    END IF;
  END LOOP;

  RAISE NOTICE '✅ Total de permisos asignados a owner % en negocio %', NEW.owner_id, NEW.id;
  
  RETURN NEW;
END;
$$;

-- Agregar comentario a la función
COMMENT ON FUNCTION auto_assign_permissions_to_owner() IS 
'Trigger function: Auto-asigna TODOS los permisos al owner cuando crea un negocio (79 permisos totales)';

-- =====================================================
-- PASO 2: Crear trigger AFTER INSERT en businesses
-- =====================================================

DROP TRIGGER IF EXISTS trg_auto_assign_permissions_to_owner ON businesses;

CREATE TRIGGER trg_auto_assign_permissions_to_owner
  AFTER INSERT ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_permissions_to_owner();

-- Agregar comentario al trigger
COMMENT ON TRIGGER trg_auto_assign_permissions_to_owner ON businesses IS 
'Auto-asigna todos los permisos al owner cuando se crea un negocio nuevo';

-- =====================================================
-- PASO 3: Backfill - Asignar permisos a owners existentes SIN permisos
-- =====================================================

DO $$
DECLARE
  v_business RECORD;
  v_permission TEXT;
  v_total_businesses INT := 0;
  v_total_permissions_inserted INT := 0;
  v_inserted_count INT;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'BACKFILL: Asignando permisos a owners existentes';
  RAISE NOTICE '========================================';

  -- Iterar sobre todos los negocios
  FOR v_business IN 
    SELECT id, owner_id, name
    FROM businesses
    WHERE owner_id IS NOT NULL
    ORDER BY created_at ASC
  LOOP
    v_total_businesses := v_total_businesses + 1;
    
    RAISE NOTICE 'Procesando negocio: % (ID: %, Owner: %)', 
                 v_business.name, v_business.id, v_business.owner_id;

    -- Asignar los 79 permisos completos
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
        notes
      )
      VALUES (
        v_business.owner_id,
        v_business.id,
        v_permission,
        v_business.owner_id,
        true,
        NOW(),
        'Backfill: Migración 20251119000000 - Auto-asignación inicial de permisos'
      )
      ON CONFLICT (user_id, business_id, permission) DO NOTHING;

      GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
      v_total_permissions_inserted := v_total_permissions_inserted + v_inserted_count;
    END LOOP;

    RAISE NOTICE '  ✅ Negocio % procesado', v_business.name;
  END LOOP;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'BACKFILL COMPLETADO';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Negocios procesados: %', v_total_businesses;
  RAISE NOTICE 'Permisos insertados: %', v_total_permissions_inserted;
  RAISE NOTICE 'Promedio permisos/negocio: %', 
               CASE WHEN v_total_businesses > 0 
                    THEN v_total_permissions_inserted / v_total_businesses 
                    ELSE 0 
               END;
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- PASO 4: Registrar en audit log (resumen global)
-- =====================================================

INSERT INTO public.permission_audit_log (
  user_id,
  business_id,
  action,
  permission,
  new_value,
  performed_by,
  performed_at,
  notes
)
SELECT 
  b.owner_id,
  b.id,
  'grant',
  'owner_full_permissions',
  '79 permisos completos (business.*, locations.*, services.*, resources.*, employees.*, appointments.*, clients.*, accounting.*, expenses.*, reports.*, permissions.*, recruitment.*, chat.*, reviews.*, favorites.*, notifications.*, settings.*, absences.*, sales.*, billing.*)',
  b.owner_id, -- Auto-granted
  NOW(),
  'Migración 20251119000000: Auto-asignación de permisos a owners (Backfill + Trigger)'
FROM businesses b
WHERE b.owner_id IS NOT NULL
GROUP BY b.owner_id, b.id;

-- =====================================================
-- PASO 5: Verificación final
-- =====================================================

DO $$
DECLARE
  v_businesses_count INT;
  v_owners_with_permissions INT;
  v_total_permissions INT;
  v_avg_permissions_per_owner NUMERIC;
BEGIN
  -- Contar negocios totales
  SELECT COUNT(*) INTO v_businesses_count
  FROM businesses
  WHERE owner_id IS NOT NULL;

  -- Contar owners con al menos 1 permiso
  SELECT COUNT(DISTINCT user_id) INTO v_owners_with_permissions
  FROM user_permissions
  WHERE user_id IN (SELECT DISTINCT owner_id FROM businesses WHERE owner_id IS NOT NULL);

  -- Contar total de permisos asignados a owners
  SELECT COUNT(*) INTO v_total_permissions
  FROM user_permissions
  WHERE user_id IN (SELECT DISTINCT owner_id FROM businesses WHERE owner_id IS NOT NULL);

  -- Calcular promedio
  v_avg_permissions_per_owner := CASE 
    WHEN v_owners_with_permissions > 0 
    THEN v_total_permissions::NUMERIC / v_owners_with_permissions 
    ELSE 0 
  END;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICACIÓN FINAL';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total negocios: %', v_businesses_count;
  RAISE NOTICE 'Owners con permisos: %', v_owners_with_permissions;
  RAISE NOTICE 'Total permisos asignados: %', v_total_permissions;
  RAISE NOTICE 'Promedio permisos/owner: % (esperado: 79)', ROUND(v_avg_permissions_per_owner, 2);
  
  IF v_owners_with_permissions >= v_businesses_count AND v_avg_permissions_per_owner >= 75 THEN
    RAISE NOTICE '✅ MIGRACIÓN EXITOSA - Todos los owners tienen permisos completos';
  ELSE
    RAISE WARNING '⚠️ REVISAR: Algunos owners pueden no tener todos los permisos';
    RAISE WARNING '   Owners esperados: %, Owners con permisos: %', v_businesses_count, v_owners_with_permissions;
  END IF;
  
  RAISE NOTICE '========================================';
END $$;

-- Fin de migración
