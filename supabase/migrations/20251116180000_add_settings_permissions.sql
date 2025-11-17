-- =====================================================================================
-- Migration: 20251116180000_add_settings_permissions.sql
-- Descripción: Agrega permisos para gestión de configuraciones
-- Autor: Sistema de Permisos v2.0
-- Fecha: 2025-11-16
-- Fase: 5 - Protección de Módulos con PermissionGate
--
-- PERMISOS AGREGADOS (2 tipos):
-- 1. settings.edit_business - CompleteUnifiedSettings Admin: Editar info del negocio
-- 2. employees.edit_own_profile - CompleteUnifiedSettings Employee: Editar perfil propio
--
-- ALCANCE: Todos los administradores de todos los negocios (54 admin-business)
-- REGISTROS ESPERADOS: 108 permisos (54 × 2)
-- =====================================================================================

-- =====================================================================================
-- PASO 1: Insertar permisos para EDITAR INFO DEL NEGOCIO
-- =====================================================================================
INSERT INTO user_permissions (business_id, user_id, permission, granted_by, is_active)
SELECT 
    br.business_id,
    br.user_id,
    'settings.edit_business' AS permission,
    b.owner_id AS granted_by,
    TRUE AS is_active
FROM business_roles br
JOIN businesses b ON b.id = br.business_id
WHERE br.role = 'admin'
ON CONFLICT (business_id, user_id, permission) 
DO UPDATE SET
    is_active = TRUE,
    granted_by = EXCLUDED.granted_by,
    updated_at = NOW();

-- =====================================================================================
-- PASO 2: Insertar permisos para EDITAR PERFIL PROPIO (EMPLEADO)
-- =====================================================================================
INSERT INTO user_permissions (business_id, user_id, permission, granted_by, is_active)
SELECT 
    br.business_id,
    br.user_id,
    'employees.edit_own_profile' AS permission,
    b.owner_id AS granted_by,
    TRUE AS is_active
FROM business_roles br
JOIN businesses b ON b.id = br.business_id
WHERE br.role = 'admin'
ON CONFLICT (business_id, user_id, permission) 
DO UPDATE SET
    is_active = TRUE,
    granted_by = EXCLUDED.granted_by,
    updated_at = NOW();

-- =====================================================================================
-- VERIFICACIÓN: Contar permisos insertados
-- =====================================================================================
DO $$
DECLARE
    v_settings_edit_business_count INTEGER;
    v_employees_edit_profile_count INTEGER;
    v_total_expected INTEGER := 108; -- 54 admin-business × 2 permisos
    v_total_actual INTEGER;
BEGIN
    -- Contar permisos insertados
    SELECT COUNT(*) INTO v_settings_edit_business_count 
    FROM user_permissions 
    WHERE permission = 'settings.edit_business';
    
    SELECT COUNT(*) INTO v_employees_edit_profile_count 
    FROM user_permissions 
    WHERE permission = 'employees.edit_own_profile';
    
    v_total_actual := v_settings_edit_business_count + v_employees_edit_profile_count;
    
    -- Mostrar resumen
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRACIÓN COMPLETADA: 20251116180000';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'settings.edit_business: % permisos', v_settings_edit_business_count;
    RAISE NOTICE 'employees.edit_own_profile: % permisos', v_employees_edit_profile_count;
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE 'TOTAL INSERTADO: % permisos', v_total_actual;
    RAISE NOTICE 'ESPERADO: % permisos', v_total_expected;
    RAISE NOTICE '';
    
    IF v_total_actual >= v_total_expected THEN
        RAISE NOTICE '✅ MIGRACIÓN EXITOSA: Todos los permisos insertados correctamente';
    ELSE
        RAISE WARNING '⚠️ ADVERTENCIA: Solo % de % permisos esperados', v_total_actual, v_total_expected;
    END IF;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;

-- =====================================================================================
-- COMENTARIOS FINALES
-- =====================================================================================
COMMENT ON TABLE user_permissions IS 'Sistema de permisos granulares v2.0 - Actualizado 2025-11-16';

-- Fin de migración 20251116180000
