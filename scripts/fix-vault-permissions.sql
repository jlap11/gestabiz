-- =====================================================
-- SOLUCIÓN: Otorgar permisos a las funciones para leer Vault
-- =====================================================
-- Ejecutar en: Dashboard > SQL Editor
-- =====================================================

-- 1. Otorgar permisos de lectura en vault.decrypted_secrets
GRANT SELECT ON vault.decrypted_secrets TO postgres;
GRANT USAGE ON SCHEMA vault TO postgres;

-- 2. Verificar que ahora sí puede leer el secret
SELECT 
  CASE 
    WHEN decrypted_secret IS NOT NULL THEN '✅ Permisos OK - Secret leído correctamente'
    ELSE '❌ Secret es NULL - Verificar que existe'
  END as status,
  LENGTH(decrypted_secret) as key_length
FROM vault.decrypted_secrets
WHERE name = 'SUPABASE_SERVICE_ROLE_KEY';

-- 3. Probar funciones nuevamente
SELECT public.invoke_process_reminders();
SELECT public.invoke_appointment_status_updater();

-- 4. Revisar logs (ahora debería mostrar success)
SELECT 
  job_name,
  status,
  message,
  created_at
FROM public.cron_execution_logs
ORDER BY created_at DESC
LIMIT 5;
