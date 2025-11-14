# Sistema de Secretos para Cron Jobs

## 🔐 Arquitectura de Secretos

### ✅ NO Duplicamos Secretos

**Los secretos de Edge Functions (BREVO_API_KEY, TWILIO, etc.) YA están configurados** en Supabase Dashboard > Edge Functions > Secrets.

**PostgreSQL solo necesita UNA variable**: `app.supabase_service_role_key`

### Flujo de Autenticación

```
┌──────────────────┐
│ Cron Job         │ Ejecuta cada hora
└────────┬─────────┘
         │
         ▼
┌────────────────────────────────┐
│ invoke_process_reminders()     │ Función PostgreSQL
│ - Lee: app.supabase_service... │ (ÚNICO secreto en PostgreSQL)
│ - Llama Edge Function          │
└────────┬───────────────────────┘
         │ HTTP POST con Bearer token
         ▼
┌────────────────────────────────┐
│ Edge Function: process-remind. │ 
│ ✓ BREVO_API_KEY                │ (Secretos YA configurados
│ ✓ TWILIO_*                     │  en Edge Functions)
│ ✓ SUPPORT_EMAIL                │
└────────────────────────────────┘
```

### Por Qué Es Mejor

1. ✅ **Un solo lugar**: Secretos de email/SMS en Edge Functions (ya configurados)
2. ✅ **Un solo secreto en PostgreSQL**: Solo service_role_key para autenticar
3. ✅ **No duplicación**: No hay que sincronizar secretos entre sistemas
4. ✅ **Más seguro**: Menos superficies de ataque

## 📋 Configuración de Secretos

### Paso 1: Obtener Service Role Key

1. Ir a Supabase Dashboard
2. Navegar a **Settings > API**
3. Copiar el **service_role key** (secret) - ⚠️ NO el anon key

### Paso 2: Configurar en PostgreSQL

Ejecutar en **Supabase SQL Editor**:

```sql
-- Usar el MISMO service_role_key que ya tienes en Edge Functions > Secrets
-- (Es el mismo que aparece en Dashboard > Settings > API > service_role)
ALTER DATABASE postgres 
SET app.supabase_service_role_key = 'eyJhbG...COPIA_DE_SUPABASE_SERVICE_ROLE_KEY';
```

**⚠️ IMPORTANTE**: 
- Usa el **mismo valor** que `SUPABASE_SERVICE_ROLE_KEY` en Edge Functions
- NO es un secreto nuevo, es el mismo del proyecto
- Los demás secretos (BREVO_API_KEY, etc.) permanecen solo en Edge Functions

### Paso 3: Verificar Configuración

```sql
-- Ver si está configurado (no muestra el valor completo por seguridad)
SELECT 
  CASE 
    WHEN current_setting('app.supabase_service_role_key', true) IS NOT NULL 
    THEN '✓ Configurado'
    ELSE '✗ FALTA CONFIGURAR'
  END as service_role_status,
  current_setting('app.supabase_url', true) as url_configured;
```

### Paso 4: Probar Funciones

```sql
-- Probar invocación de recordatorios
SELECT public.invoke_process_reminders();

-- Ver logs de ejecución
SELECT * FROM public.cron_execution_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

## 🔧 Cómo Funcionan los Secretos

### Arquitectura

```
┌─────────────────────┐
│  Cron Job (pg_cron) │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ invoke_process_reminders()          │
│ SECURITY DEFINER                    │
│ - Lee app.supabase_service_role_key │
│ - Llama Edge Function con Bearer    │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ Edge Function: process-reminders    │
│ - Envía recordatorios               │
│ - Actualiza notifications           │
└─────────────────────────────────────┘
```

### Variables de Configuración

| Variable | Tipo | Descripción |
|----------|------|-------------|
| `app.supabase_service_role_key` | Secret | Service role key para autenticación |
| `app.supabase_url` | Config | URL del proyecto (auto-configurada) |

### Funciones Actualizadas

1. **`invoke_process_reminders()`**
   - Lee secreto con `current_setting('app.supabase_service_role_key', true)`
   - Invoca Edge Function con `net.http_post()`
   - Registra logs en `cron_execution_logs`

2. **`invoke_appointment_status_updater()`**
   - Misma arquitectura
   - Actualiza estado de citas

## 📊 Monitoreo

### Ver Logs de Ejecución

```sql
-- Logs de cron jobs
SELECT 
  job_name,
  status,
  message,
  created_at
FROM public.cron_execution_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### Ver Estado de Cron Jobs

```sql
-- Cron jobs activos
SELECT 
  jobname,
  schedule,
  active,
  database
FROM cron.job
WHERE jobname IN ('appointment-status-updater', 'process-appointment-reminders-hourly');
```

### Ver Últimas Ejecuciones de pg_cron

```sql
-- Historial de ejecuciones
SELECT 
  jobname,
  start_time,
  status,
  return_message
FROM cron.job_run_details
WHERE jobname IN ('appointment-status-updater', 'process-appointment-reminders-hourly')
ORDER BY start_time DESC
LIMIT 20;
```

## 🔄 Actualización de Secretos

Si necesitas cambiar el service role key:

```sql
-- 1. Cambiar el secreto
ALTER DATABASE postgres 
SET app.supabase_service_role_key = 'NUEVO_KEY_AQUI';

-- 2. Verificar que se aplicó
SELECT 
  CASE 
    WHEN current_setting('app.supabase_service_role_key', true) IS NOT NULL 
    THEN '✓ Actualizado'
    ELSE '✗ Error'
  END as status;

-- 3. Probar inmediatamente
SELECT public.invoke_process_reminders();
```

## 🚨 Troubleshooting

### Error: "Missing configuration"

**Síntoma**: Funciones fallan con mensaje "Missing configuration"

**Solución**:
```sql
-- Verificar configuración
SELECT current_setting('app.supabase_service_role_key', true);

-- Si retorna NULL, configurar:
ALTER DATABASE postgres 
SET app.supabase_service_role_key = 'TU_KEY_AQUI';
```

### Error: "Failed to invoke Edge Function"

**Síntoma**: Logs muestran "failed" status

**Pasos de diagnóstico**:
1. Verificar que Edge Function está desplegada: `npx supabase functions list`
2. Verificar que el service role key es correcto
3. Ver logs de Edge Function en Dashboard > Edge Functions > Logs

### Recordatorios No Llegan

**Checklist**:
- [ ] Service role key configurado correctamente
- [ ] Cron job `process-appointment-reminders-hourly` está activo
- [ ] Edge Function `process-reminders` está desplegada
- [ ] Variables de entorno de Edge Function configuradas (BREVO_API_KEY, etc.)
- [ ] Hay citas confirmadas en las próximas 24-25 horas

## 📁 Archivos Relacionados

- `supabase/migrations/20251114000003_use_secrets_for_cron.sql` - Migración de secretos
- `scripts/configure-cron-jobs-manual.sql` - Script de configuración manual
- `supabase/functions/process-reminders/index.ts` - Edge Function de recordatorios
- `docs/cron-job-setup.md` - Documentación original de cron jobs

## 🔒 Mejores Prácticas de Seguridad

1. ✅ **NUNCA** commits el service role key en git
2. ✅ **NUNCA** uses el service role key en código cliente
3. ✅ **SIEMPRE** usa `SECURITY DEFINER` para funciones que acceden a secretos
4. ✅ **ROTAR** el service role key periódicamente
5. ✅ **REVISAR** logs de ejecución regularmente para detectar accesos sospechosos
