# ✅ Configuración de Secrets para Cron Jobs - COMPLETADA

## 📊 Estado Actual

### ✅ Completado en Esta Sesión

1. **Migración aplicada**: `20251114000005_use_vault_for_secrets.sql`
   - ✅ Funciones `invoke_process_reminders()` y `invoke_appointment_status_updater()` creadas
   - ✅ Usan `current_setting('app.supabase_service_role_key', true)` para leer la clave
   - ✅ Logs automáticos en `cron_execution_logs`
   - ✅ NO requiere extensión Vault (no disponible en tu proyecto)

2. **Scripts de configuración creados**:
   - ✅ `scripts/configure-cron-secrets.sql` - Script completo con todos los pasos
   - ✅ `docs/CRON_SECRETS_CONFIG_FINAL.md` - Guía detallada de 300+ líneas

3. **Arquitectura establecida**:
   - ✅ Edge Functions conservan TODOS sus secrets (BREVO_API_KEY, TWILIO_*, etc)
   - ✅ PostgreSQL solo necesita UNA variable: `app.supabase_service_role_key`
   - ✅ No hay duplicación innecesaria de secrets

---

## 🎯 PRÓXIMOS PASOS (Requieren Tu Acción)

### Paso 1: Configurar el Service Role Key

**⚠️ IMPORTANTE**: Debes ejecutar esto desde el **Dashboard de Supabase**, NO desde la terminal.

1. Ve a **Dashboard de Supabase** ([dashboard.supabase.com](https://dashboard.supabase.com))
2. Selecciona tu proyecto (dkancockzvcqorqbwtyh)
3. Ve a **Settings** > **API**
4. Copia el **service_role** key (secret) - debería verse como `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Paso 2: Ejecutar Script de Configuración

1. Abre **SQL Editor** en el Dashboard (icono de base de datos en menú lateral)
2. Haz clic en **New query**
3. Copia el contenido del archivo `scripts/configure-cron-secrets.sql`
4. **Reemplaza** `YOUR_SERVICE_ROLE_KEY_HERE` con la clave que copiaste en el Paso 1
5. Ejecuta el script completo (botón **Run** o `Ctrl+Enter`)

**Ejemplo del comando crítico**:
```sql
ALTER DATABASE postgres 
SET app.supabase_service_role_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrYW5jb2NrenZjcW9ycWJ3dHloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5ODg3MDQwMCwiZXhwIjoyMDE0NDQ2NDAwfQ.TU_CLAVE_REAL_AQUI';
```

### Paso 3: Verificar Configuración

Ejecuta estos queries en el mismo SQL Editor:

```sql
-- Debe devolver tu service_role_key (NO NULL)
SELECT current_setting('app.supabase_service_role_key', true);

-- Probar función manualmente
SELECT public.invoke_process_reminders();

-- Revisar logs (debe aparecer status='success')
SELECT job_name, status, message, created_at
FROM public.cron_execution_logs
ORDER BY created_at DESC
LIMIT 5;
```

---

## 🔍 Qué Esperar

### ✅ Resultado Exitoso

Si todo está configurado correctamente, verás:

1. **current_setting()** devuelve tu service_role_key completo
2. **invoke_process_reminders()** ejecuta sin errores
3. **cron_execution_logs** muestra:
   ```
   job_name: process-reminders
   status: success
   message: Successfully invoked Edge Function
   ```

### ❌ Posibles Errores

| Error | Causa | Solución |
|-------|-------|----------|
| `current_setting()` devuelve NULL | ALTER DATABASE no se ejecutó | Verifica que ejecutaste desde Dashboard SQL Editor |
| "Service role key not configured" en logs | current_setting() devuelve NULL | Ejecuta ALTER DATABASE nuevamente |
| "Permission denied" al ejecutar ALTER DATABASE | Intentaste desde CLI | DEBES usar Dashboard > SQL Editor |

---

## 📚 Recursos Disponibles

1. **Guía completa**: `docs/CRON_SECRETS_CONFIG_FINAL.md`
   - 300+ líneas de documentación detallada
   - Troubleshooting exhaustivo
   - Preguntas frecuentes
   - Mejores prácticas de seguridad

2. **Script de configuración**: `scripts/configure-cron-secrets.sql`
   - Todos los comandos necesarios en un solo archivo
   - Comentarios explicativos en cada paso
   - Queries de verificación incluidos

3. **Documentación anterior**: `docs/CRON_SECRETS_SETUP.md`
   - Arquitectura de secrets
   - Explicación del diseño

---

## 🎓 Conceptos Clave

### ¿Por qué desde el Dashboard y NO la CLI?

```
Supabase CLI user:
  └── postgres role
      └── Permisos limitados (no es owner de database)
      └── ❌ ALTER DATABASE postgres → Permission denied

Dashboard SQL Editor:
  └── supabase_admin role
      └── Permisos de superusuario
      └── ✅ ALTER DATABASE postgres → Success
```

### ¿Por qué no duplicar todos los secrets?

**Edge Functions** ya tienen configurados:
- BREVO_API_KEY
- BREVO_SMTP_*
- TWILIO_*
- WHATSAPP_*

**PostgreSQL** solo necesita autenticarse para LLAMAR a esas funciones, no ejecutar la lógica directamente.

**Resultado**: 1 secret en PostgreSQL vs 10+ → Más simple, más seguro, más mantenible.

---

## ✅ Checklist de Validación

Después de ejecutar el script, confirma:

- [ ] `current_setting('app.supabase_service_role_key', true)` devuelve tu clave (NO NULL)
- [ ] `SELECT public.invoke_process_reminders()` ejecuta sin errores
- [ ] `cron_execution_logs` tiene al menos 1 entry con status='success'
- [ ] Los cron jobs están activos:
  ```sql
  SELECT jobname, active FROM cron.job 
  WHERE jobname IN ('process-appointment-reminders-hourly', 'appointment-status-updater');
  ```
  Ambos deben mostrar `active = true`

---

## 🆘 Si Necesitas Ayuda

1. **Revisa los logs detallados**:
   ```sql
   SELECT * FROM cron_execution_logs ORDER BY created_at DESC LIMIT 10;
   ```

2. **Consulta la guía completa**: `docs/CRON_SECRETS_CONFIG_FINAL.md`

3. **Verifica que copiaste la clave correcta**:
   - Dashboard > Settings > API
   - Sección "Project API keys"
   - **service_role** (secret) - NO el anon key

---

## 📝 Resumen de Archivos Creados/Modificados

```
✅ Migraciones aplicadas:
   supabase/migrations/20251114000005_use_vault_for_secrets.sql

✅ Scripts creados:
   scripts/configure-cron-secrets.sql (NUEVO)

✅ Documentación actualizada:
   docs/CRON_SECRETS_CONFIG_FINAL.md (NUEVO - Guía completa)
   docs/CRON_SECRETS_SETUP.md (EXISTENTE - Arquitectura)

⚠️ Pendiente de eliminar (obsoletos):
   scripts/configure-vault-secrets.sql (Vault approach - NO funciona)
```

---

**Estado**: ✅ Configuración del lado de PostgreSQL COMPLETADA  
**Próximo paso**: **ACCIÓN MANUAL REQUERIDA** - Ejecutar script desde Dashboard SQL Editor  
**Tiempo estimado**: 5 minutos  
**Fecha**: Noviembre 14, 2025
