-- ============================================================================
-- MIGRACIÓN: Agregar permiso sales.create para QuickSaleForm
-- Fecha: 2025-11-16
-- Descripción: Inserta permiso sales.create para todos los admins activos
-- Componente Afectado: QuickSaleForm (registro de ventas rápidas)
-- ============================================================================

-- PARTE 1: Insertar permiso sales.create para todos los admins activos
DO $$
DECLARE
  v_admin RECORD;
  v_inserted_count INT := 0;
BEGIN
  RAISE NOTICE '=== INICIANDO INSERCIÓN: sales.create ===';
  
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
      'sales.create',
      v_admin.user_id, -- Auto-granted (migración automática)
      true,
      NOW()
    )
    ON CONFLICT (user_id, business_id, permission) DO NOTHING;
    
    GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
    IF v_inserted_count > 0 THEN
      RAISE NOTICE 'Permiso sales.create aplicado a admin % en negocio %', 
        v_admin.user_id, v_admin.business_id;
    END IF;
  END LOOP;
  
  RAISE NOTICE '=== FINALIZADA INSERCIÓN: sales.create ===';
END $$;

-- PARTE 2: Registrar en audit log
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
  'grant',
  'sales.create',
  'true',
  user_id,
  NOW(),
  'Fase 5 - Migración 20251116130000: Permiso para QuickSaleForm (registro de ventas rápidas)'
FROM public.business_roles
WHERE role = 'admin' AND is_active = true;

-- PARTE 3: Verificación final
DO $$
DECLARE
  v_admin_count INT;
  v_sales_count INT;
BEGIN
  -- Contar admins activos
  SELECT COUNT(DISTINCT user_id) INTO v_admin_count
  FROM public.business_roles
  WHERE role = 'admin' AND is_active = true;
  
  -- Contar permisos sales.create insertados
  SELECT COUNT(*) INTO v_sales_count
  FROM public.user_permissions
  WHERE permission = 'sales.create' AND is_active = true;
  
  RAISE NOTICE '=== VERIFICACIÓN FINAL ===';
  RAISE NOTICE 'Admins activos encontrados: %', v_admin_count;
  RAISE NOTICE 'Permisos sales.create insertados: %', v_sales_count;
  RAISE NOTICE 'Total esperado: 54 permisos (24 admins × múltiples negocios)';
  
  IF v_sales_count > 0 THEN
    RAISE NOTICE '✅ MIGRACIÓN EXITOSA: Permiso sales.create insertado correctamente';
  ELSE
    RAISE WARNING '⚠️ VERIFICAR: No se insertaron permisos sales.create';
  END IF;
END $$;
