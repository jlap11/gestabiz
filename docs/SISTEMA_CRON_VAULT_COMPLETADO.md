# ✅ Sistema de Cron Jobs con Vault - COMPLETADO

## 📊 Resumen de Configuración

### Estado Final
- ✅ **Vault configurado**: Secret `SUPABASE_SERVICE_ROLE_KEY` creado
- ✅ **Permisos otorgados**: `GRANT SELECT ON vault.decrypted_secrets TO postgres`
- ✅ **Funciones actualizadas**: Ambas funciones leen desde Vault correctamente
- ✅ **Cron jobs activos**: `process-appointment-reminders-hourly` y `appointment-status-updater`
- ✅ **Logs muestran success**: Sistema funcionando correctamente

---

## 🔧 Configuración Aplicada

### 1. Secret en Vault
```sql
-- Ejecutado manualmente en Dashboard > SQL Editor
SELECT vault.create_secret(
  'eyJhbGci...', -- service_role_key desde Dashboard > Settings > API
  'SUPABASE_SERVICE_ROLE_KEY',
  'Service role key for authenticating Edge Function calls from cron jobs'
);
```

### 2. Permisos de Lectura
```sql
-- Ejecutado manualmente en Dashboard > SQL Editor
GRANT SELECT ON vault.decrypted_secrets TO postgres;
GRANT USAGE ON SCHEMA vault TO postgres;
```

### 3. Funciones Recreadas
```sql
-- invoke_process_reminders() - Lee desde Vault
-- invoke_appointment_status_updater() - Lee desde Vault
```

---

## 📋 Migraciones Sincronizadas

Todas las migraciones están aplicadas y sincronizadas:

```
Local = Remote (27 migraciones)
├── 20251114000000 - Payment amounts system
├── 20251114000001 - Completed_at field
├── 20251114000002 - Cron environment setup
├── 20251114000003 - Cron functions (hardcoded)
├── 20251114000004 - Cron functions simplified
└── 20251114000005 - Vault secrets (✅ ACTUALIZADO)
```

**Archivo local actualizado**: `supabase/migrations/20251114000005_use_vault_for_secrets.sql`
- ✅ Refleja el código actual en Supabase
- ✅ Incluye lectura desde `vault.decrypted_secrets`
- ✅ Manejo de errores correcto
- ✅ Logs detallados

---

## 🎯 Cómo Funciona

### Flujo de Ejecución Automática

```
┌─────────────────────────────────────────────┐
│ pg_cron (PostgreSQL Extension)              │
│ ─────────────────────────────────────────── │
│ • process-appointment-reminders-hourly      │
│   Schedule: 0 * * * * (cada hora)           │
│                                             │
│ • appointment-status-updater                │
│   Schedule: */30 * * * * (cada 30 min)      │
└─────────┬───────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────┐
│ Funciones PostgreSQL                        │
│ ─────────────────────────────────────────── │
│ invoke_process_reminders()                  │
│ invoke_appointment_status_updater()         │
│                                             │
│ 1. Lee service_role_key desde Vault        │
│ 2. Llama Edge Function vía HTTP            │
│ 3. Registra resultado en logs               │
└─────────┬───────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────┐
│ Vault (Supabase Integration)               │
│ ─────────────────────────────────────────── │
│ Secret: SUPABASE_SERVICE_ROLE_KEY          │
│ Value: eyJhbGci... (encriptado)            │
│                                             │
│ Permisos: postgres tiene SELECT            │
└─────────┬───────────────────────────────────┘
          │ Authorization: Bearer eyJhbGci...
          ▼
┌─────────────────────────────────────────────┐
│ Edge Functions (Deno Runtime)              │
│ ─────────────────────────────────────────── │
│ process-reminders:                          │
│ • Busca citas próximas (24h, 1h)           │
│ • Crea notificaciones                       │
│ • Envía emails/SMS/WhatsApp                 │
│                                             │
│ appointment-status-updater:                 │
│ • Actualiza estados de citas vencidas       │
└─────────────────────────────────────────────┘
```

---

## 📝 Archivos Importantes

### Scripts Ejecutados Manualmente
1. ✅ `scripts/configure-cron-jobs-manual.sql` - Crear secret en Vault
2. ✅ `scripts/recrear-funciones-vault.sql` - Recrear funciones + permisos

### Scripts de Verificación
- `scripts/verificar-cron-jobs.sql` - Verificación completa del sistema
- `scripts/diagnostico-vault.sql` - Diagnóstico de problemas

### Migraciones
- `supabase/migrations/20251114000005_use_vault_for_secrets.sql` - Funciones con Vault

### Documentación
- `docs/VAULT_SETUP_GUIA_RAPIDA.md` - Guía rápida de configuración
- `docs/CRON_SECRETS_CONFIG_FINAL.md` - Guía completa (ALTER DATABASE approach - obsoleto)

---

## ✅ Validación del Sistema

### Comandos de Verificación

```sql
-- 1. Verificar que el secret existe
SELECT name, created_at 
FROM vault.secrets 
WHERE name = 'SUPABASE_SERVICE_ROLE_KEY';

-- 2. Verificar logs recientes (deben mostrar 'success')
SELECT job_name, status, message, created_at
FROM cron_execution_logs
ORDER BY created_at DESC
LIMIT 10;

-- 3. Verificar cron jobs activos
SELECT jobname, schedule, active
FROM cron.job
WHERE jobname IN ('process-appointment-reminders-hourly', 'appointment-status-updater');

-- 4. Ver historial de ejecuciones automáticas
SELECT jobname, status, start_time
FROM cron.job_run_details
WHERE start_time > NOW() - INTERVAL '24 hours'
ORDER BY start_time DESC
LIMIT 10;
```

---

## 🔒 Seguridad

### ✅ Implementado
- Secret encriptado en Vault (en reposo)
- Permisos granulares (solo postgres puede leer)
- Funciones SECURITY DEFINER (ejecución controlada)
- Logs de auditoría en `cron_execution_logs`

### 🛡️ Mejores Prácticas Aplicadas
- Service role key solo en Vault (no hardcodeado)
- No se expone en código fuente
- No se duplica en múltiples lugares
- Fácil rotación con `vault.update_secret()`

---

## 🚀 Próximos Pasos (Opcional)

### Monitoreo Proactivo
```sql
-- Ver si hay errores recientes
SELECT COUNT(*) as errores_ultimas_24h
FROM cron_execution_logs
WHERE status = 'failed' 
  AND created_at > NOW() - INTERVAL '24 hours';

-- Si hay errores, investigar
SELECT job_name, message, details
FROM cron_execution_logs
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 5;
```

### Configurar Alertas (Dashboard)
1. Ve a **Dashboard** > **Database** > **Logs**
2. Crea alerta para mensajes con "failed" en `cron_execution_logs`
3. Recibe notificación si los cron jobs fallan

---

## 📚 Referencias

- [Supabase Vault Docs](https://supabase.com/docs/guides/database/vault)
- [pg_cron Extension](https://github.com/citusdata/pg_cron)
- [Edge Functions](https://supabase.com/docs/guides/functions)

---

**Fecha de configuración**: Noviembre 14, 2025  
**Estado**: ✅ COMPLETADO Y FUNCIONANDO  
**Configurado por**: Scripts manuales en Dashboard SQL Editor  
**Próxima revisión**: Verificar logs semanalmente
