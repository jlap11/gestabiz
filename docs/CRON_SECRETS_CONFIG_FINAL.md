# Configuración de Secrets para Cron Jobs - Guía Completa

## 🎯 Resumen Ejecutivo

Los cron jobs de PostgreSQL necesitan autenticarse para invocar Edge Functions. Esta guía explica cómo configurar el `service_role_key` de forma segura usando `ALTER DATABASE`.

### ⚠️ Requisito Crítico

**DEBES ejecutar el script desde el Dashboard de Supabase**, NO desde la CLI:

- ✅ **Dashboard** > **SQL Editor** → Tiene permisos de superusuario
- ❌ `npx supabase db push` → Falla con "permission denied"

---

## 📋 Arquitectura de Secrets

### Separación de Responsabilidades

```
┌─────────────────────────────────────────────────────────┐
│  Edge Functions (Deno Runtime)                         │
│  ────────────────────────────────────────────────────── │
│  Secrets almacenados en Supabase Edge Function Secrets:│
│  • BREVO_API_KEY ← Email transaccional                  │
│  • BREVO_SMTP_HOST, BREVO_SMTP_PORT                    │
│  • BREVO_SMTP_USER, BREVO_SMTP_PASSWORD                │
│  • TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN ← SMS         │
│  • TWILIO_PHONE_NUMBER, WHATSAPP_PHONE_NUMBER          │
│  • SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY             │
│  • SUPPORT_EMAIL                                        │
└─────────────────────────────────────────────────────────┘
                          ↑
                          │ HTTP POST con Bearer token
                          │
┌─────────────────────────────────────────────────────────┐
│  PostgreSQL pg_cron Jobs                                │
│  ────────────────────────────────────────────────────── │
│  Solo necesita:                                         │
│  • app.supabase_service_role_key (vía ALTER DATABASE)   │
│                                                         │
│  Usado ÚNICAMENTE para autenticar llamadas HTTP        │
└─────────────────────────────────────────────────────────┘
```

### ¿Por qué NO duplicar todos los secrets?

| ✅ Enfoque Actual (Recomendado) | ❌ Duplicación Completa |
|----------------------------------|------------------------|
| 1 secret en PostgreSQL | 10+ secrets en PostgreSQL |
| Single source of truth | Sincronización manual necesaria |
| Cambios solo en Edge Functions | Cambios en 2 lugares |
| Menos superficie de ataque | Mayor riesgo de seguridad |
| Arquitectura limpia | Acoplamiento innecesario |

**Razón**: Los Edge Functions ya tienen TODOS los secrets. PostgreSQL solo necesita autenticarse para llamar a esas funciones.

---

## 🚀 Guía de Configuración Paso a Paso

### Paso 1: Obtener el Service Role Key

1. Ve a **Dashboard de Supabase**
2. Navega a **Settings** > **API**
3. En la sección "Project API keys", encuentra **service_role** (secret)
4. Haz clic en el icono de "copiar" para copiar la clave
5. Debería verse como: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (muy larga)

⚠️ **SEGURIDAD**: Esta clave da acceso administrativo total. NO la compartas ni la subas a Git.

### Paso 2: Abrir SQL Editor del Dashboard

1. En el Dashboard de Supabase, ve a **SQL Editor** (icono de base de datos en el menú izquierdo)
2. Haz clic en **New query** para abrir un editor en blanco
3. Alternativamente, carga el archivo `scripts/configure-cron-secrets.sql`

### Paso 3: Configurar el Secret

Copia y pega este comando, **reemplazando** `YOUR_SERVICE_ROLE_KEY_HERE` con la clave que copiaste:

```sql
ALTER DATABASE postgres 
SET app.supabase_service_role_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

**Ejemplo completo**:
```sql
-- ANTES (placeholder)
ALTER DATABASE postgres 
SET app.supabase_service_role_key = 'YOUR_SERVICE_ROLE_KEY_HERE';

-- DESPUÉS (con tu clave real)
ALTER DATABASE postgres 
SET app.supabase_service_role_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrYW5jb2NrenZjcW9ycWJ3dHloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5ODg3MDQwMCwiZXhwIjoyMDE0NDQ2NDAwfQ.abc123xyz789...';
```

### Paso 4: Ejecutar el Script Completo

Si cargaste `scripts/configure-cron-secrets.sql`:

1. **Edita** la línea del `ALTER DATABASE` con tu service_role_key real
2. Haz clic en **Run** (o presiona `Ctrl+Enter`)
3. El script ejecutará todos los pasos de configuración y verificación

Si copiaste el comando manualmente, ejecútalo presionando **Run**.

### Paso 5: Verificar Configuración

Ejecuta este query en el mismo SQL Editor:

```sql
SELECT current_setting('app.supabase_service_role_key', true) as configured_key;
```

**Resultado esperado**:
- ✅ Devuelve tu service_role_key completo
- ❌ Si devuelve `NULL`, el `ALTER DATABASE` no se ejecutó correctamente

### Paso 6: Probar Funciones Manualmente

```sql
-- Probar función de recordatorios
SELECT public.invoke_process_reminders();

-- Probar función de actualización de estados
SELECT public.invoke_appointment_status_updater();
```

**Resultado esperado**:
```
invoke_process_reminders
------------------------
(sin resultado visible - la función retorna void)
```

### Paso 7: Revisar Logs de Ejecución

```sql
SELECT 
  job_name,
  status,
  message,
  details,
  created_at
FROM public.cron_execution_logs
ORDER BY created_at DESC
LIMIT 5;
```

**Resultado esperado**:
| job_name | status | message | created_at |
|----------|--------|---------|------------|
| process-reminders | success | Successfully invoked Edge Function | 2025-11-14 10:30:00 |
| appointment-status-updater | success | Successfully invoked Edge Function | 2025-11-14 10:00:00 |

⚠️ Si ves `status = 'failed'`, revisa el campo `message` para diagnóstico.

### Paso 8: Verificar Cron Jobs Activos

```sql
SELECT 
  jobname,
  schedule,
  command,
  active
FROM cron.job
WHERE jobname IN ('process-appointment-reminders-hourly', 'appointment-status-updater')
ORDER BY jobname;
```

**Resultado esperado**:
| jobname | schedule | active |
|---------|----------|--------|
| appointment-status-updater | */30 * * * * | true |
| process-appointment-reminders-hourly | 0 * * * * | true |

---

## 🔍 Diagnóstico y Troubleshooting

### Problema 1: `current_setting()` devuelve NULL

**Causa**: El `ALTER DATABASE` no se ejecutó o falló silenciosamente.

**Solución**:
1. Verifica que ejecutaste desde **SQL Editor del Dashboard** (no CLI)
2. Revisa que no haya errores de sintaxis en el comando
3. Asegúrate de reemplazar `YOUR_SERVICE_ROLE_KEY_HERE` con la clave real

### Problema 2: Logs muestran "Service role key not configured"

**Causa**: La función está leyendo `current_setting()` pero devuelve NULL.

**Solución**:
```sql
-- Verificar configuración actual
SELECT current_setting('app.supabase_service_role_key', true);

-- Si es NULL, volver a ejecutar ALTER DATABASE
ALTER DATABASE postgres 
SET app.supabase_service_role_key = 'TU_SERVICE_ROLE_KEY_AQUI';
```

### Problema 3: "Permission denied" al ejecutar ALTER DATABASE

**Causa**: Intentaste ejecutar desde Supabase CLI en lugar del Dashboard.

**Solución**:
- ❌ NO uses: `npx supabase db push` o `npx supabase db execute`
- ✅ USA: Dashboard > SQL Editor

### Problema 4: Cron jobs no se ejecutan automáticamente

**Verifica que los jobs estén activos**:
```sql
SELECT jobname, active FROM cron.job;
```

**Si están inactivos, reactívalos**:
```sql
SELECT cron.alter_job(job_id, active := true)
FROM cron.job
WHERE jobname = 'process-appointment-reminders-hourly';
```

### Problema 5: Edge Function devuelve 401 Unauthorized

**Causa**: El service_role_key configurado no es válido o está incorrecto.

**Solución**:
1. Ve a Dashboard > Settings > API
2. Verifica que copiaste el **service_role** (NO el anon key)
3. Vuelve a ejecutar `ALTER DATABASE` con la clave correcta

---

## 📚 Comandos Útiles de Diagnóstico

### Ver historial de ejecuciones de cron jobs (últimas 24h)

```sql
SELECT 
  jobname,
  status,
  start_time,
  end_time,
  return_message
FROM cron.job_run_details
WHERE start_time > NOW() - INTERVAL '24 hours'
ORDER BY start_time DESC
LIMIT 20;
```

### Ver próximas ejecuciones programadas

```sql
SELECT 
  jobname,
  schedule,
  CASE 
    WHEN active THEN 'Activo ✓'
    ELSE 'Inactivo ✗'
  END as estado
FROM cron.job
WHERE active = true;
```

### Forzar ejecución manual de un cron job

```sql
-- NO recomendado en producción, solo para testing
SELECT cron.schedule('test-run-now', '* * * * *', 'SELECT public.invoke_process_reminders()');
-- Esperar 1-2 minutos, luego eliminar
SELECT cron.unschedule('test-run-now');
```

### Ver todas las configuraciones de base de datos

```sql
SELECT 
  name,
  setting
FROM pg_settings
WHERE name LIKE 'app.%';
```

---

## 🎓 Preguntas Frecuentes

### ¿La configuración es permanente?

✅ **SÍ**. `ALTER DATABASE` es persistente y sobrevive a:
- Reinicios del servidor
- Despliegues de migraciones
- Actualizaciones de Supabase

Solo necesitas configurarlo **UNA VEZ**.

### ¿Cómo cambio la clave en el futuro?

Simplemente vuelve a ejecutar `ALTER DATABASE` con el nuevo valor:

```sql
ALTER DATABASE postgres 
SET app.supabase_service_role_key = 'NUEVO_VALOR_AQUI';
```

No es necesario eliminar la configuración anterior.

### ¿Puedo ver el valor configurado?

✅ **SÍ**, con este query:

```sql
SELECT current_setting('app.supabase_service_role_key', true);
```

⚠️ **SEGURIDAD**: Este valor es sensible. No lo compartas ni lo captures en screenshots.

### ¿Por qué no usar variables de entorno de PostgreSQL?

**Razón**: Las variables de entorno estándar de PostgreSQL no son accesibles desde funciones SQL SECURITY DEFINER.

`ALTER DATABASE SET` crea una configuración específica de la base de datos que SÍ es accesible desde funciones con `current_setting()`.

### ¿Los Edge Functions tienen el mismo secret?

✅ **SÍ**. El `SUPABASE_SERVICE_ROLE_KEY` en Edge Functions > Secrets debería ser el **mismo valor** que configuras en PostgreSQL.

Esto permite que ambos sistemas se autentiquen entre sí.

### ¿Qué pasa si alguien obtiene esta clave?

⚠️ **RIESGO ALTO**. El service_role_key da acceso administrativo total a tu proyecto Supabase:
- Leer/escribir/eliminar cualquier dato
- Bypasear Row Level Security (RLS)
- Ejecutar funciones privilegiadas

**Medidas de seguridad**:
1. NO subir a repositorios Git
2. NO compartir en chats/emails
3. Rotar periódicamente (Dashboard > Settings > API > "Regenerate service_role key")
4. Usar solo en backend/server-side code
5. Monitorear logs de uso sospechoso

---

## 🔐 Mejores Prácticas de Seguridad

### ✅ DO (Hacer)

1. **Ejecutar ALTER DATABASE solo desde Dashboard SQL Editor** (conexión segura HTTPS)
2. **Usar el service_role_key de Dashboard > Settings > API** (fuente oficial)
3. **Configurar UNA sola vez** y validar con `current_setting()`
4. **Revisar logs regularmente** para detectar fallos
5. **Documentar en un password manager** (1Password, LastPass, etc)

### ❌ DON'T (No Hacer)

1. ❌ Hardcodear secrets en código fuente
2. ❌ Subir secrets a repositorios Git (ni siquiera en commits privados)
3. ❌ Compartir service_role_key por email/Slack/Discord
4. ❌ Usar el mismo secret en múltiples proyectos
5. ❌ Ejecutar `ALTER DATABASE` desde scripts automatizados (CLI)

---

## 📝 Checklist de Configuración

```
□ Obtener service_role_key de Dashboard > Settings > API
□ Abrir Dashboard > SQL Editor (NO Supabase CLI)
□ Cargar scripts/configure-cron-secrets.sql
□ Reemplazar 'YOUR_SERVICE_ROLE_KEY_HERE' con clave real
□ Ejecutar ALTER DATABASE
□ Verificar con current_setting() (debe devolver la clave)
□ Probar invoke_process_reminders() manualmente
□ Revisar cron_execution_logs (debe haber status='success')
□ Verificar cron.job (ambos jobs active=true)
□ Documentar clave en password manager seguro
□ Configurar alertas de monitoreo (opcional)
```

---

## 🆘 Soporte y Recursos

- **Documentación Oficial**: [Supabase pg_cron](https://supabase.com/docs/guides/database/extensions/pg_cron)
- **Supabase Discord**: [discord.gg/supabase](https://discord.gg/supabase)
- **GitHub Issues**: Reportar bugs en el repositorio del proyecto

---

**Última actualización**: Noviembre 14, 2025  
**Versión del sistema**: v2.0 (ALTER DATABASE approach)
