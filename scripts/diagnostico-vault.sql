-- =====================================================
-- DIAGNÓSTICO: Verificar nombre exacto del secret
-- =====================================================

-- 1. Ver TODOS los secrets en Vault (para ver el nombre exacto)
SELECT 
  id,
  name,
  description,
  created_at
FROM vault.secrets
ORDER BY created_at DESC;

-- 2. Intentar leer el secret directamente (con el nombre exacto que veas arriba)
SELECT decrypted_secret
FROM vault.decrypted_secrets
WHERE name = 'SUPABASE_SERVICE_ROLE_KEY';
-- Si esto devuelve NULL, hay problema de permisos

-- 3. Verificar el código de la función (para ver qué nombre está buscando)
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'invoke_process_reminders';
