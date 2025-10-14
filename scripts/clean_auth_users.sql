-- ============================================================
-- SCRIPT PARA LIMPIAR USUARIOS DE auth.users
-- ============================================================
-- IMPORTANTE: Este script debe ejecutarse desde el SQL Editor 
-- de Supabase Dashboard con permisos de service_role
--
-- ADVERTENCIA: Esto eliminará TODOS los usuarios de autenticación
-- excepto aquellos que se excluyan explícitamente.
-- ============================================================

-- Paso 1: Mostrar todos los usuarios actuales (para verificar antes de borrar)
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at,
  CASE 
    WHEN last_sign_in_at IS NULL THEN 'Nunca ha iniciado sesión'
    WHEN last_sign_in_at > NOW() - INTERVAL '7 days' THEN 'Activo en última semana'
    WHEN last_sign_in_at > NOW() - INTERVAL '30 days' THEN 'Activo en último mes'
    ELSE 'Inactivo más de 30 días'
  END as status
FROM auth.users
ORDER BY last_sign_in_at DESC NULLS LAST;

-- ============================================================
-- OPCIÓN 1: ELIMINAR TODOS LOS USUARIOS (excepto tu cuenta)
-- ============================================================
-- Descomenta y ajusta el email de tu cuenta si quieres preservarla:

/*
DELETE FROM auth.users
WHERE email != 'jlap.11@hotmail.com';  -- 👈 Cambia por tu email si quieres mantener tu cuenta

SELECT COUNT(*) as usuarios_restantes FROM auth.users;
*/

-- ============================================================
-- OPCIÓN 2: ELIMINAR TODOS LOS USUARIOS SIN EXCEPCIÓN
-- ============================================================
-- Descomenta si quieres eliminar TODO (incluyendo tu cuenta):

/*
DELETE FROM auth.users;

SELECT COUNT(*) as usuarios_restantes FROM auth.users;
*/

-- ============================================================
-- OPCIÓN 3: ELIMINAR SOLO USUARIOS DE TESTING (recomendado)
-- ============================================================
-- Elimina solo usuarios de testing, preservando cuentas reales:

/*
DELETE FROM auth.users
WHERE 
  email LIKE '%@appointsync.test%'  -- Usuarios de testing
  OR email LIKE '%@example.com%'     -- Usuarios de ejemplo
  OR email LIKE '%test%'              -- Cualquier email con "test"
  OR last_sign_in_at IS NULL;        -- Usuarios que nunca iniciaron sesión

SELECT COUNT(*) as usuarios_restantes FROM auth.users;
*/

-- ============================================================
-- OPCIÓN 4: ELIMINAR USUARIOS INACTIVOS (más de 30 días)
-- ============================================================

/*
DELETE FROM auth.users
WHERE 
  last_sign_in_at < NOW() - INTERVAL '30 days'
  OR last_sign_in_at IS NULL;

SELECT COUNT(*) as usuarios_restantes FROM auth.users;
*/

-- ============================================================
-- VERIFICACIÓN FINAL
-- ============================================================
-- Ejecuta esto DESPUÉS de hacer el DELETE para confirmar:

/*
SELECT 
  COUNT(*) as total_usuarios,
  COUNT(CASE WHEN last_sign_in_at IS NOT NULL THEN 1 END) as con_sesion,
  COUNT(CASE WHEN last_sign_in_at IS NULL THEN 1 END) as sin_sesion
FROM auth.users;
*/

-- ============================================================
-- LIMPIEZA DE SESIONES ACTIVAS
-- ============================================================
-- OPCIONAL: Si quieres cerrar todas las sesiones activas sin borrar usuarios:

/*
-- Esto elimina todas las sesiones de auth.sessions
DELETE FROM auth.sessions;

-- Esto elimina todos los refresh tokens
DELETE FROM auth.refresh_tokens;

SELECT 'Todas las sesiones han sido cerradas' as resultado;
*/

-- ============================================================
-- NOTAS IMPORTANTES:
-- ============================================================
-- 1. auth.users tiene CASCADE DELETE configurado, por lo que también eliminará:
--    - auth.identities (identidades OAuth)
--    - auth.sessions (sesiones activas)
--    - auth.refresh_tokens (tokens de refresco)
--    - auth.mfa_factors (factores MFA si están configurados)
--
-- 2. PERO NO eliminará automáticamente:
--    - Registros en public.profiles (debes limpiarlos con script separado)
--    - Registros en public.businesses
--    - Otros datos de la aplicación
--
-- 3. Para una limpieza completa, ejecuta PRIMERO el script 
--    01_clean_transactional_data.sql (que limpia profiles y otros)
--    y DESPUÉS este script (que limpia auth.users)
--
-- 4. No puedes recuperar usuarios eliminados. Asegúrate de hacer
--    un backup si es necesario.
--
-- ============================================================
