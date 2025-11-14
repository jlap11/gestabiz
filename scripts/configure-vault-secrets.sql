-- ==========================================
-- CONFIGURACIÓN CON VAULT DE SUPABASE
-- ==========================================
-- Este método NO requiere permisos de superusuario
-- Usa el Vault nativo de Supabase para secretos

-- PASO 1: Verificar que Vault está habilitado
SELECT installed_version 
FROM pg_available_extensions 
WHERE name = 'vault';

-- Si no está instalado, ejecutar:
-- CREATE EXTENSION IF NOT EXISTS vault;

-- PASO 2: Crear el secreto en Vault
-- IMPORTANTE: Reemplaza 'TU_SERVICE_ROLE_KEY_AQUI' con el valor real
-- Obtén el service_role_key de: Dashboard > Settings > API > service_role

SELECT vault.create_secret(
  'SUPABASE_SERVICE_ROLE_KEY',  -- Nombre del secreto
  'TU_SERVICE_ROLE_KEY_AQUI',    -- ⚠️ REEMPLAZAR CON TU KEY REAL
  'Service role key for Edge Function authentication'  -- Descripción
);

-- PASO 3: Verificar que el secreto se creó correctamente
SELECT 
  id,
  name,
  description,
  created_at
FROM vault.secrets
WHERE name = 'SUPABASE_SERVICE_ROLE_KEY';

-- PASO 4: Verificar que las funciones pueden leer el secreto
-- (Solo muestra que existe, no el valor por seguridad)
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✓ Secreto configurado correctamente en Vault'
    ELSE '✗ Secreto NO encontrado - Ejecuta PASO 2'
  END as status
FROM vault.decrypted_secrets
WHERE name = 'SUPABASE_SERVICE_ROLE_KEY';

-- PASO 5: Probar la función de recordatorios
SELECT public.invoke_process_reminders();

-- PASO 6: Ver logs de ejecución
SELECT 
  job_name,
  status,
  message,
  created_at,
  details
FROM public.cron_execution_logs
ORDER BY created_at DESC
LIMIT 5;

-- PASO 7: Verificar que los cron jobs están activos
SELECT 
  jobname,
  schedule,
  active,
  database
FROM cron.job
WHERE jobname IN ('appointment-status-updater', 'process-appointment-reminders-hourly');

-- ==========================================
-- COMANDOS ÚTILES PARA VAULT
-- ==========================================

-- Ver todos los secretos en Vault (solo nombres, no valores)
SELECT id, name, description, created_at
FROM vault.secrets
ORDER BY created_at DESC;

-- Actualizar un secreto existente
-- SELECT vault.update_secret(
--   (SELECT id FROM vault.secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY'),
--   'NUEVO_VALOR_AQUI',
--   'Service role key for Edge Function authentication'
-- );

-- Eliminar un secreto (si necesitas recrearlo)
-- DELETE FROM vault.secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY';

-- ==========================================
-- TROUBLESHOOTING
-- ==========================================

-- Si ves error "Service role key not found in Vault":
-- 1. Verifica que el secreto existe:
SELECT * FROM vault.secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY';

-- 2. Verifica que la función puede leerlo:
SELECT name FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY';

-- 3. Si no existe, créalo con el PASO 2

-- Si ves error "extension vault does not exist":
-- Habilitar la extensión vault:
CREATE EXTENSION IF NOT EXISTS vault;

-- Luego volver al PASO 2
