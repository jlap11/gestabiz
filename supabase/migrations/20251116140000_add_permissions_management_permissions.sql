-- =====================================================================================
-- Migration: 20251116140000_add_permissions_management_permissions.sql
-- Descripción: Agregar permisos de gestión de permisos para PermissionsManager
-- Fecha: 2025-11-16
-- Autor: Fase 5 - Sistema de Permisos Granulares
-- =====================================================================================

-- Permisos a insertar:
-- 1. permissions.assign_role - Asignar roles a usuarios
-- 2. permissions.edit - Editar permisos de usuarios
-- 3. permissions.delete - Eliminar permisos de usuarios

-- =====================================================================================
-- PART 1: INSERTAR PERMISOS PARA TODOS LOS ADMINS ACTIVOS
-- =====================================================================================

DO $$
DECLARE
  v_admin RECORD;
  v_inserted_count INT := 0;
  v_total_inserted INT := 0;
  v_permission TEXT;
  v_permissions TEXT[] := ARRAY['permissions.assign_role', 'permissions.edit', 'permissions.delete'];
BEGIN
  RAISE NOTICE '=== INICIANDO INSERCIÓN: Permisos de Gestión de Permisos ===';
  RAISE NOTICE 'Permisos a insertar: permissions.assign_role, permissions.edit, permissions.delete';
  
  -- Iterar sobre cada permiso
  FOREACH v_permission IN ARRAY v_permissions
  LOOP
    RAISE NOTICE '';
    RAISE NOTICE '--- Procesando permiso: % ---', v_permission;
    v_inserted_count := 0;
    
    -- Insertar permiso para cada combinación admin-business
    FOR v_admin IN 
      SELECT DISTINCT 
        br.user_id,
        br.business_id
      FROM public.business_roles br
      WHERE br.role = 'admin' 
        AND br.is_active = true
      ORDER BY br.business_id, br.user_id
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
        v_permission,
        v_admin.user_id, -- Auto-granted
        true,
        NOW()
      )
      ON CONFLICT (user_id, business_id, permission) DO NOTHING;
      
      -- Contar inserciones exitosas
      GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
      IF v_inserted_count > 0 THEN
        v_total_inserted := v_total_inserted + 1;
      END IF;
    END LOOP;
    
    RAISE NOTICE 'Permiso % aplicado a % admin-business combinations', v_permission, v_inserted_count;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== FINALIZADA INSERCIÓN: Permisos de Gestión ===';
  RAISE NOTICE 'Total de permisos insertados: %', v_total_inserted;
END $$;

-- =====================================================================================
-- PART 2: REGISTRAR EN AUDIT LOG
-- =====================================================================================

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
  br.business_id,
  br.user_id,
  'grant',
  unnested_permission,
  'true',
  br.user_id,
  NOW(),
  'Fase 5 - Migración 20251116140000: Permisos para PermissionsManager (asignar roles, editar y eliminar permisos)'
FROM public.business_roles br
CROSS JOIN LATERAL unnest(ARRAY['permissions.assign_role', 'permissions.edit', 'permissions.delete']) AS unnested_permission
WHERE br.role = 'admin' 
  AND br.is_active = true;

-- =====================================================================================
-- PART 3: VERIFICACIÓN Y REPORTE FINAL
-- =====================================================================================

DO $$
DECLARE
  v_admin_count INT;
  v_business_count INT;
  v_expected_total INT;
  v_assign_role_count INT;
  v_edit_count INT;
  v_delete_count INT;
  v_total_count INT;
BEGIN
  -- Contar admins y negocios únicos
  SELECT 
    COUNT(DISTINCT user_id),
    COUNT(DISTINCT business_id)
  INTO v_admin_count, v_business_count
  FROM public.business_roles
  WHERE role = 'admin' AND is_active = true;
  
  -- Calcular total esperado
  SELECT COUNT(*) INTO v_expected_total
  FROM public.business_roles
  WHERE role = 'admin' AND is_active = true;
  
  v_expected_total := v_expected_total * 3; -- 3 permisos por admin-business
  
  -- Contar permisos insertados por tipo
  SELECT COUNT(*) INTO v_assign_role_count
  FROM public.user_permissions
  WHERE permission = 'permissions.assign_role' AND is_active = true;
  
  SELECT COUNT(*) INTO v_edit_count
  FROM public.user_permissions
  WHERE permission = 'permissions.edit' AND is_active = true;
  
  SELECT COUNT(*) INTO v_delete_count
  FROM public.user_permissions
  WHERE permission = 'permissions.delete' AND is_active = true;
  
  v_total_count := v_assign_role_count + v_edit_count + v_delete_count;
  
  -- Reporte final
  RAISE NOTICE '';
  RAISE NOTICE '=== VERIFICACIÓN FINAL ===';
  RAISE NOTICE 'Admins activos únicos: %', v_admin_count;
  RAISE NOTICE 'Negocios únicos: %', v_business_count;
  RAISE NOTICE 'Total esperado de permisos: % (% admin-business × 3 permisos)', v_expected_total, v_expected_total / 3;
  RAISE NOTICE '';
  RAISE NOTICE 'Permisos insertados por tipo:';
  RAISE NOTICE '  - permissions.assign_role: %', v_assign_role_count;
  RAISE NOTICE '  - permissions.edit: %', v_edit_count;
  RAISE NOTICE '  - permissions.delete: %', v_delete_count;
  RAISE NOTICE 'Total permisos insertados: %', v_total_count;
  RAISE NOTICE '';
  
  -- Validar resultado
  IF v_total_count = v_expected_total THEN
    RAISE NOTICE '✅ MIGRACIÓN EXITOSA: Todos los permisos insertados correctamente';
    RAISE NOTICE 'PermissionsManager ahora completamente funcional para todos los admins';
  ELSIF v_total_count > 0 THEN
    RAISE WARNING '⚠️ VERIFICAR: Se insertaron % permisos de % esperados', v_total_count, v_expected_total;
    RAISE WARNING 'Revisar conflictos o permisos duplicados';
  ELSE
    RAISE WARNING '❌ ERROR: No se insertaron permisos. Revisar configuración de business_roles';
  END IF;
END $$;
