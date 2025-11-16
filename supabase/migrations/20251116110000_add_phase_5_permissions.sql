-- =====================================================
-- FASE 5: NUEVOS PERMISOS PARA MÓDULOS (FASE 5)
-- Fecha: 16 de noviembre de 2025
-- Autor: Sistema de Permisos v2.0
-- =====================================================
-- IMPORTANTE: Este sistema usa TEXT en user_permissions.permission,
-- NO existe tabla permissions separada
-- =====================================================

-- =====================================================
-- FASE 5: NUEVOS PERMISOS PARA MÓDULOS (FASE 5)
-- Fecha: 16 de noviembre de 2025
-- Autor: Sistema de Permisos v2.0
-- =====================================================
-- IMPORTANTE: Este sistema usa TEXT en user_permissions.permission,
-- NO existe tabla permissions separada
-- =====================================================

-- =====================================================
-- APLICAR PERMISOS A ADMINS EXISTENTES
-- =====================================================

-- Aplicar los 15 nuevos permisos a todos los admins activos
DO $$
DECLARE
  v_admin RECORD;
  v_permission_code TEXT;
  v_inserted_count INT := 0;
BEGIN
  RAISE NOTICE 'Iniciando aplicación de permisos a admins existentes...';

  -- Iterar sobre todos los admins activos
  FOR v_admin IN 
    SELECT DISTINCT user_id, business_id
    FROM public.business_roles
    WHERE role = 'admin' AND is_active = true
  LOOP
    -- Iterar sobre los 15 nuevos permisos
    FOR v_permission_code IN 
      SELECT unnest(ARRAY[
        'services.view', 'services.create', 'services.edit', 'services.delete',
        'resources.view', 'resources.create', 'resources.edit', 'resources.delete',
        'recruitment.view', 'recruitment.create_vacancy', 'recruitment.view_applications', 'recruitment.approve_hire',
        'chat.view_all', 'chat.delete', 'reviews.moderate'
      ])
    LOOP
      -- Insertar en user_permissions
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
        v_permission_code,
        v_admin.user_id, -- Auto-granted por migración
        true,
        NOW()
      )
      ON CONFLICT (user_id, business_id, permission) DO NOTHING;

      GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
      
      IF v_inserted_count > 0 THEN
        RAISE NOTICE 'Permiso % aplicado a admin % en negocio %', 
          v_permission_code, v_admin.user_id, v_admin.business_id;
      END IF;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Completado: Permisos aplicados a todos los admins activos';
END $$;

-- =====================================================
-- AUDITORÍA Y VERIFICACIÓN
-- =====================================================

-- Registrar en audit log
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
  user_id,
  business_id,
  'grant',
  'phase_5_permissions',
  '15 nuevos permisos: services.*, resources.*, recruitment.*, chat.*, reviews.*',
  user_id, -- Sistema/Migración
  NOW(),
  'Migración 20251116110000: Fase 5 - Protección de Módulos'
FROM public.business_roles
WHERE role = 'admin' AND is_active = true
GROUP BY user_id, business_id;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

-- Contar permisos por admin
DO $$
DECLARE
  v_admin_count INT;
  v_permission_count INT;
BEGIN
  -- Contar admins activos
  SELECT COUNT(DISTINCT user_id) INTO v_admin_count
  FROM public.business_roles
  WHERE role = 'admin' AND is_active = true;

  -- Contar total de permisos aplicados (buscar cualquier permiso de Fase 5)
  SELECT COUNT(*) INTO v_permission_count
  FROM public.user_permissions
  WHERE permission LIKE 'services.%' 
     OR permission LIKE 'resources.%'
     OR permission LIKE 'recruitment.%'
     OR permission LIKE 'chat.%'
     OR permission LIKE 'reviews.%';

  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICACIÓN FINAL';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Admins activos: %', v_admin_count;
  RAISE NOTICE 'Permisos de Fase 5 aplicados: %', v_permission_count;
  RAISE NOTICE 'Esperados: % permisos (% admins × 15 permisos)', v_admin_count * 15, v_admin_count;
  
  IF v_permission_count >= (v_admin_count * 15) THEN
    RAISE NOTICE '✅ MIGRACIÓN EXITOSA';
  ELSE
    RAISE WARNING '⚠️ Revisar: Menos permisos de los esperados';
  END IF;
  RAISE NOTICE '========================================';
END $$;

-- Fin de migración
