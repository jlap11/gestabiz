-- =====================================================================================
-- Migration: 20251116160000_add_appointments_client_permissions.sql
-- Descripción: Agrega permisos para gestión de citas por clientes
-- Autor: Sistema de Permisos v2.0
-- Fecha: 2025-11-16
-- Fase: 5 - Protección de Módulos con PermissionGate
--
-- PERMISOS AGREGADOS (3 tipos):
-- 1. appointments.create - AppointmentWizard: Crear nuevas citas
-- 2. appointments.cancel_own - ClientDashboard: Cancelar citas propias
-- 3. appointments.reschedule_own - ClientDashboard: Reprogramar citas propias
--
-- ALCANCE: Todos los administradores de todos los negocios (54 admin-business)
-- REGISTROS ESPERADOS: 162 permisos (54 × 3)
-- =====================================================================================

-- =====================================================================================
-- PASO 1: Insertar permisos para CREAR CITAS
-- =====================================================================================
INSERT INTO user_permissions (business_id, user_id, permission, granted_by, is_active)
SELECT 
    br.business_id,
    br.user_id,
    'appointments.create' AS permission,
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
-- PASO 2: Insertar permisos para CANCELAR CITAS PROPIAS
-- =====================================================================================
INSERT INTO user_permissions (business_id, user_id, permission, granted_by, is_active)
SELECT 
    br.business_id,
    br.user_id,
    'appointments.cancel_own' AS permission,
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
-- PASO 3: Insertar permisos para REPROGRAMAR CITAS PROPIAS
-- =====================================================================================
INSERT INTO user_permissions (business_id, user_id, permission, granted_by, is_active)
SELECT 
    br.business_id,
    br.user_id,
    'appointments.reschedule_own' AS permission,
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
    v_appointments_create_count INTEGER;
    v_appointments_cancel_count INTEGER;
    v_appointments_reschedule_count INTEGER;
    v_total_expected INTEGER := 162; -- 54 admin-business × 3 permisos
    v_total_actual INTEGER;
BEGIN
    -- Contar permisos insertados
    SELECT COUNT(*) INTO v_appointments_create_count 
    FROM user_permissions 
    WHERE permission = 'appointments.create';
    
    SELECT COUNT(*) INTO v_appointments_cancel_count 
    FROM user_permissions 
    WHERE permission = 'appointments.cancel_own';
    
    SELECT COUNT(*) INTO v_appointments_reschedule_count 
    FROM user_permissions 
    WHERE permission = 'appointments.reschedule_own';
    
    v_total_actual := v_appointments_create_count + v_appointments_cancel_count + v_appointments_reschedule_count;
    
    -- Mostrar resumen
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRACIÓN COMPLETADA: 20251116160000';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'appointments.create: % permisos', v_appointments_create_count;
    RAISE NOTICE 'appointments.cancel_own: % permisos', v_appointments_cancel_count;
    RAISE NOTICE 'appointments.reschedule_own: % permisos', v_appointments_reschedule_count;
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
-- Fin de migración 20251116160000;
