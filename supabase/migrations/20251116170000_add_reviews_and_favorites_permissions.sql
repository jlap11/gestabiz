-- =====================================================================================
-- Migration: 20251116170000_add_reviews_and_favorites_permissions.sql
-- Descripción: Agrega permisos para reviews y favoritos
-- Autor: Sistema de Permisos v2.0
-- Fecha: 2025-11-16
-- Fase: 5 - Protección de Módulos con PermissionGate
--
-- PERMISOS AGREGADOS (2 tipos):
-- 1. reviews.create - ReviewForm: Crear reviews de servicios/negocios
-- 2. favorites.toggle - BusinessProfile: Agregar/quitar negocios favoritos
--
-- ALCANCE: Todos los administradores de todos los negocios (54 admin-business)
-- REGISTROS ESPERADOS: 108 permisos (54 × 2)
-- =====================================================================================

-- =====================================================================================
-- PASO 1: Insertar permisos para CREAR REVIEWS
-- =====================================================================================
INSERT INTO user_permissions (business_id, user_id, permission, granted_by, is_active)
SELECT 
    br.business_id,
    br.user_id,
    'reviews.create' AS permission,
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
-- PASO 2: Insertar permisos para TOGGLE FAVORITOS
-- =====================================================================================
INSERT INTO user_permissions (business_id, user_id, permission, granted_by, is_active)
SELECT 
    br.business_id,
    br.user_id,
    'favorites.toggle' AS permission,
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
    v_reviews_create_count INTEGER;
    v_favorites_toggle_count INTEGER;
    v_total_expected INTEGER := 108; -- 54 admin-business × 2 permisos
    v_total_actual INTEGER;
BEGIN
    -- Contar permisos insertados
    SELECT COUNT(*) INTO v_reviews_create_count 
    FROM user_permissions 
    WHERE permission = 'reviews.create';
    
    SELECT COUNT(*) INTO v_favorites_toggle_count 
    FROM user_permissions 
    WHERE permission = 'favorites.toggle';
    
    v_total_actual := v_reviews_create_count + v_favorites_toggle_count;
    
    -- Mostrar resumen
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRACIÓN COMPLETADA: 20251116170000';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'reviews.create: % permisos', v_reviews_create_count;
    RAISE NOTICE 'favorites.toggle: % permisos', v_favorites_toggle_count;
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

-- Fin de migración 20251116170000
