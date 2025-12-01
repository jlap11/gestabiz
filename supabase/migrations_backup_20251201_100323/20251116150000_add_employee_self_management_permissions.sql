-- =====================================================================================
-- Migration: 20251116150000_add_employee_self_management_permissions.sql
-- Descripción: Agregar permisos de autogestión para empleados (horarios y ausencias)
-- Fecha: 2025-11-16
-- Autor: Fase 5 - Sistema de Permisos Granulares
-- =====================================================================================

-- Permisos a insertar:
-- 1. employees.edit_own_schedule - Editar propio horario de trabajo
-- 2. employees.request_time_off - Solicitar tiempo libre/ausencias

-- =====================================================================================
-- PART 1: INSERTAR PERMISOS PARA TODOS LOS ADMINS ACTIVOS
-- =====================================================================================

DO $$
DECLARE
  v_admin RECORD;
  v_inserted_count INT := 0;
  v_total_inserted INT := 0;
  v_permission TEXT;
  v_permissions TEXT[] := ARRAY['employees.edit_own_schedule', 'employees.request_time_off'];
BEGIN
  RAISE NOTICE '=== INICIANDO INSERCIÓN: Permisos de Autogestión de Empleados ===';
  RAISE NOTICE 'Permisos a insertar: employees.edit_own_schedule, employees.request_time_off';
  
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
  RAISE NOTICE '=== FINALIZADA INSERCIÓN: Permisos de Autogestión ===';
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
  'Fase 5 - Migración 20251116150000: Permisos para WorkScheduleEditor y TimeOffRequestModal (autogestión de empleados)'
FROM public.business_roles br
CROSS JOIN LATERAL unnest(ARRAY['employees.edit_own_schedule', 'employees.request_time_off']) AS unnested_permission
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
  v_schedule_count INT;
  v_timeoff_count INT;
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
  
  v_expected_total := v_expected_total * 2; -- 2 permisos por admin-business
  
  -- Contar permisos insertados por tipo
  SELECT COUNT(*) INTO v_schedule_count
  FROM public.user_permissions
  WHERE permission = 'employees.edit_own_schedule' AND is_active = true;
  
  SELECT COUNT(*) INTO v_timeoff_count
  FROM public.user_permissions
  WHERE permission = 'employees.request_time_off' AND is_active = true;
  
  v_total_count := v_schedule_count + v_timeoff_count;
  
  -- Reporte final
  RAISE NOTICE '';
  RAISE NOTICE '=== VERIFICACIÓN FINAL ===';
  RAISE NOTICE 'Admins activos únicos: %', v_admin_count;
  RAISE NOTICE 'Negocios únicos: %', v_business_count;
  RAISE NOTICE 'Total esperado de permisos: % (% admin-business × 2 permisos)', v_expected_total, v_expected_total / 2;
  RAISE NOTICE '';
  RAISE NOTICE 'Permisos insertados por tipo:';
  RAISE NOTICE '  - employees.edit_own_schedule: %', v_schedule_count;
  RAISE NOTICE '  - employees.request_time_off: %', v_timeoff_count;
  RAISE NOTICE 'Total permisos insertados: %', v_total_count;
  RAISE NOTICE '';
  
  -- Validar resultado
  IF v_total_count = v_expected_total THEN
    RAISE NOTICE '✅ MIGRACIÓN EXITOSA: Todos los permisos insertados correctamente';
    RAISE NOTICE 'WorkScheduleEditor y TimeOffRequestModal ahora completamente funcionales';
  ELSIF v_total_count > 0 THEN
    RAISE WARNING '⚠️ VERIFICAR: Se insertaron % permisos de % esperados', v_total_count, v_expected_total;
    RAISE WARNING 'Revisar conflictos o permisos duplicados';
  ELSE
    RAISE WARNING '❌ ERROR: No se insertaron permisos. Revisar configuración de business_roles';
  END IF;
END $$;
