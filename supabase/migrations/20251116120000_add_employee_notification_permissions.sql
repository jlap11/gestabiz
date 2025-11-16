-- =====================================================
-- MIGRACIÓN: Agregar Permisos de Empleados y Notificaciones
-- Fecha: 2025-11-16
-- Autor: Sistema Fase 5 - Sesión Continuación
-- Descripción: Permisos faltantes para EmployeeManagementNew y BusinessNotificationSettings
-- =====================================================

-- PARTE 1: Agregar permiso settings.edit_notifications
-- Permite a admins editar configuración de notificaciones del negocio
DO $$
DECLARE
  v_admin RECORD;
  v_inserted_count INT := 0;
BEGIN
  RAISE NOTICE '=== INICIANDO INSERCIÓN: settings.edit_notifications ===';
  
  FOR v_admin IN 
    SELECT DISTINCT user_id, business_id
    FROM public.business_roles
    WHERE role = 'admin' AND is_active = true
  LOOP
    INSERT INTO public.user_permissions (
      user_id, 
      business_id, 
      permission, 
      granted_by, 
      is_active, 
      created_at
    )
    VALUES (
      v_admin.user_id, 
      v_admin.business_id, 
      'settings.edit_notifications',
      v_admin.user_id, 
      true, 
      NOW()
    )
    ON CONFLICT (user_id, business_id, permission) DO NOTHING;
    
    GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
    IF v_inserted_count > 0 THEN
      RAISE NOTICE 'Permiso settings.edit_notifications aplicado a admin % en negocio %', 
        v_admin.user_id, v_admin.business_id;
    END IF;
  END LOOP;
END $$;

-- PARTE 2: Agregar permiso employees.approve
-- Permite a admins aprobar solicitudes de empleados
DO $$
DECLARE
  v_admin RECORD;
  v_inserted_count INT := 0;
BEGIN
  RAISE NOTICE '=== INICIANDO INSERCIÓN: employees.approve ===';
  
  FOR v_admin IN 
    SELECT DISTINCT user_id, business_id
    FROM public.business_roles
    WHERE role = 'admin' AND is_active = true
  LOOP
    INSERT INTO public.user_permissions (
      user_id, 
      business_id, 
      permission, 
      granted_by, 
      is_active, 
      created_at
    )
    VALUES (
      v_admin.user_id, 
      v_admin.business_id, 
      'employees.approve',
      v_admin.user_id, 
      true, 
      NOW()
    )
    ON CONFLICT (user_id, business_id, permission) DO NOTHING;
    
    GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
    IF v_inserted_count > 0 THEN
      RAISE NOTICE 'Permiso employees.approve aplicado a admin % en negocio %', 
        v_admin.user_id, v_admin.business_id;
    END IF;
  END LOOP;
END $$;

-- PARTE 3: Agregar permiso employees.reject
-- Permite a admins rechazar solicitudes de empleados
DO $$
DECLARE
  v_admin RECORD;
  v_inserted_count INT := 0;
BEGIN
  RAISE NOTICE '=== INICIANDO INSERCIÓN: employees.reject ===';
  
  FOR v_admin IN 
    SELECT DISTINCT user_id, business_id
    FROM public.business_roles
    WHERE role = 'admin' AND is_active = true
  LOOP
    INSERT INTO public.user_permissions (
      user_id, 
      business_id, 
      permission, 
      granted_by, 
      is_active, 
      created_at
    )
    VALUES (
      v_admin.user_id, 
      v_admin.business_id, 
      'employees.reject',
      v_admin.user_id, 
      true, 
      NOW()
    )
    ON CONFLICT (user_id, business_id, permission) DO NOTHING;
    
    GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
    IF v_inserted_count > 0 THEN
      RAISE NOTICE 'Permiso employees.reject aplicado a admin % en negocio %', 
        v_admin.user_id, v_admin.business_id;
    END IF;
  END LOOP;
END $$;

-- PARTE 4: Registrar en audit log
INSERT INTO public.permission_audit_log (
  business_id,
  user_id,
  action,
  permission,
  new_value,
  performed_by,
  performed_at,
  notes
)
SELECT 
  business_id,
  user_id,
  'grant' as action,
  'settings.edit_notifications' as permission,
  'true' as new_value,
  user_id as performed_by,
  NOW() as performed_at,
  'Fase 5 - Sesión Continuación: Permisos para BusinessNotificationSettings y EmployeeManagementNew' as notes
FROM public.business_roles
WHERE role = 'admin' AND is_active = true;

INSERT INTO public.permission_audit_log (
  business_id,
  user_id,
  action,
  permission,
  new_value,
  performed_by,
  performed_at,
  notes
)
SELECT 
  business_id,
  user_id,
  'grant' as action,
  'employees.approve' as permission,
  'true' as new_value,
  user_id as performed_by,
  NOW() as performed_at,
  'Fase 5 - Sesión Continuación: Permisos para BusinessNotificationSettings y EmployeeManagementNew' as notes
FROM public.business_roles
WHERE role = 'admin' AND is_active = true;

INSERT INTO public.permission_audit_log (
  business_id,
  user_id,
  action,
  permission,
  new_value,
  performed_by,
  performed_at,
  notes
)
SELECT 
  business_id,
  user_id,
  'grant' as action,
  'employees.reject' as permission,
  'true' as new_value,
  user_id as performed_by,
  NOW() as performed_at,
  'Fase 5 - Sesión Continuación: Permisos para BusinessNotificationSettings y EmployeeManagementNew' as notes
FROM public.business_roles
WHERE role = 'admin' AND is_active = true;

-- PARTE 5: Verificación final
DO $$
DECLARE
  v_admin_count INT;
  v_settings_count INT;
  v_approve_count INT;
  v_reject_count INT;
BEGIN
  -- Contar admins activos
  SELECT COUNT(DISTINCT user_id) INTO v_admin_count
  FROM public.business_roles
  WHERE role = 'admin' AND is_active = true;
  
  -- Contar permisos insertados
  SELECT COUNT(*) INTO v_settings_count
  FROM public.user_permissions
  WHERE permission = 'settings.edit_notifications';
  
  SELECT COUNT(*) INTO v_approve_count
  FROM public.user_permissions
  WHERE permission = 'employees.approve';
  
  SELECT COUNT(*) INTO v_reject_count
  FROM public.user_permissions
  WHERE permission = 'employees.reject';
  
  RAISE NOTICE '=== VERIFICACIÓN FINAL ===';
  RAISE NOTICE 'Admins activos encontrados: %', v_admin_count;
  RAISE NOTICE 'Permisos settings.edit_notifications: %', v_settings_count;
  RAISE NOTICE 'Permisos employees.approve: %', v_approve_count;
  RAISE NOTICE 'Permisos employees.reject: %', v_reject_count;
  RAISE NOTICE 'Total esperado por permiso: % (admins × negocios)', v_admin_count;
  
  IF v_settings_count > 0 AND v_approve_count > 0 AND v_reject_count > 0 THEN
    RAISE NOTICE '✅ MIGRACIÓN EXITOSA: Todos los permisos insertados';
  ELSE
    RAISE WARNING '⚠️ VERIFICAR: Algunos permisos pueden no haberse insertado correctamente';
  END IF;
END $$;
