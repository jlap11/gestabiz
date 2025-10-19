-- ============================================================================
-- CLEAN ALL DATABASE SCRIPT - LIMPIEZA TOTAL
-- ============================================================================
-- ⚠️  ADVERTENCIA: Este script ELIMINA ABSOLUTAMENTE TODO
-- INCLUYE: usuarios, negocios, empleados, sedes, servicios, configuraciones
-- PRESERVA: Solo catálogos del sistema (business_categories)
-- 
-- ⚠️  ESTO ES IRREVERSIBLE - HACER BACKUP ANTES DE EJECUTAR
-- 
-- Ejecución: Copiar y ejecutar en Supabase SQL Editor
-- ============================================================================

BEGIN;

-- ============================================================================
-- PASO 1: ELIMINAR TRIGGERS DE AUDITORÍA (evitar conflictos)
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_audit_user_permissions ON public.user_permissions;
DROP TRIGGER IF EXISTS trigger_audit_business_roles ON public.business_roles;

-- ============================================================================
-- PASO 2: LIMPIAR LOGS DE AUDITORÍA
-- ============================================================================
DELETE FROM public.permission_audit_log;
DELETE FROM public.billing_audit_log;

-- ============================================================================
-- PASO 3: ELIMINAR PERMISOS Y ROLES
-- ============================================================================
DELETE FROM public.user_permissions;
DELETE FROM public.business_roles;

-- ============================================================================
-- PASO 4: ELIMINAR CONFIGURACIONES DE NEGOCIOS
-- ============================================================================
DELETE FROM public.business_notification_settings;

-- ============================================================================
-- PASO 5: ELIMINAR RELACIONES DE SERVICIOS
-- ============================================================================
DELETE FROM public.employee_services;
DELETE FROM public.location_services;

-- ============================================================================
-- PASO 6: ELIMINAR EMPLEADOS
-- ============================================================================
DELETE FROM public.business_employees;

-- ============================================================================
-- PASO 7: ELIMINAR SISTEMA DE RECLUTAMIENTO
-- ============================================================================
DELETE FROM public.job_vacancies;
DELETE FROM public.employee_profiles;

-- ============================================================================
-- PASO 8: ELIMINAR SERVICIOS
-- ============================================================================
DELETE FROM public.services;

-- ============================================================================
-- PASO 9: ELIMINAR UBICACIONES/SEDES
-- ============================================================================
DELETE FROM public.locations;

-- ============================================================================
-- PASO 10: ELIMINAR NEGOCIOS
-- ============================================================================
DELETE FROM public.businesses;

-- ============================================================================
-- PASO 11: ELIMINAR PERFILES DE USUARIOS
-- ============================================================================
DELETE FROM public.profiles;

-- ============================================================================
-- PASO 12: ELIMINAR USUARIOS DE AUTENTICACIÓN (⚠️ IRREVERSIBLE)
-- ============================================================================
DELETE FROM auth.users;

-- ============================================================================
-- PASO 13: RECREAR TRIGGERS DE AUDITORÍA
-- ============================================================================
CREATE TRIGGER trigger_audit_user_permissions
    AFTER INSERT OR UPDATE OR DELETE ON public.user_permissions
    FOR EACH ROW
    EXECUTE FUNCTION audit_user_permissions_changes();

CREATE TRIGGER trigger_audit_business_roles
    AFTER INSERT OR UPDATE OR DELETE ON public.business_roles
    FOR EACH ROW
    EXECUTE FUNCTION audit_business_roles_changes();

COMMIT;

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================
SELECT 'LIMPIEZA TOTAL COMPLETADA - BASE DE DATOS VACÍA' as status;

-- Verificar que todo esté en 0
SELECT 'auth.users' as tabla, COUNT(*) as registros FROM auth.users
UNION ALL SELECT 'profiles', COUNT(*) FROM public.profiles
UNION ALL SELECT 'businesses', COUNT(*) FROM public.businesses
UNION ALL SELECT 'locations', COUNT(*) FROM public.locations
UNION ALL SELECT 'services', COUNT(*) FROM public.services
UNION ALL SELECT 'business_employees', COUNT(*) FROM public.business_employees
UNION ALL SELECT 'job_vacancies', COUNT(*) FROM public.job_vacancies
UNION ALL SELECT 'user_permissions', COUNT(*) FROM public.user_permissions
UNION ALL SELECT 'business_roles', COUNT(*) FROM public.business_roles;

-- Verificar catálogos preservados
SELECT 'CATÁLOGOS PRESERVADOS' as categoria, 'business_categories' as tabla, COUNT(*) as registros 
FROM public.business_categories;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
-- 
-- 1. Este script ELIMINA TODO incluyendo usuarios de auth.users
-- 2. Es IRREVERSIBLE - no hay forma de recuperar sin backup
-- 3. SOLO se preservan las categorías de negocio (catálogo del sistema)
-- 4. Los triggers de auditoría se eliminan temporalmente y se recrean al final
-- 5. Ejecutar SOLO en ambientes de desarrollo/testing
-- 6. NUNCA ejecutar en producción sin supervisión
-- 7. Hacer BACKUP completo antes de ejecutar
-- 
-- Después de esta limpieza, la base de datos estará en estado inicial:
-- - 0 usuarios
-- - 0 negocios
-- - 0 sedes
-- - 0 servicios
-- - 0 empleados
-- - 0 configuraciones
-- - Solo catálogos del sistema (90 business_categories)
-- 
-- ============================================================================
