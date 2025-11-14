# ✅ Configuración de Vault para Cron Jobs - Guía Rápida

## 🎯 ¿Qué hacer ahora?

Vault **YA está instalado** en tu proyecto (lo veo en Dashboard > Integrations). Solo necesitas crear el secret con tu `service_role_key`.

---

## 📋 Pasos (5 minutos)

### Paso 1: Obtener tu Service Role Key

1. Ve a **Dashboard de Supabase** ([dashboard.supabase.com](https://dashboard.supabase.com))
2. Selecciona tu proyecto: `gestabiz` (dkancockzvcqorqbwtyh)
3. Ve a **Settings** > **API**
4. En la sección "Project API keys", copia el **service_role** (secret)
   - Se ve como: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Paso 2: Abrir SQL Editor

1. En el Dashboard, ve a **SQL Editor** (icono de base de datos en menú lateral)
2. Haz clic en **New query**

### Paso 3: Crear el Secret en Vault

Copia y pega esto, **reemplazando** `YOUR_SERVICE_ROLE_KEY_HERE` con la clave que copiaste:

```sql
SELECT vault.create_secret(
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',  -- ⚠️ REEMPLAZA ESTO con tu service_role_key real
  'SUPABASE_SERVICE_ROLE_KEY',
  'Service role key for authenticating Edge Function calls from cron jobs'
);
```

**Ejemplo completo**:
```sql
-- ANTES (incorrecto)
SELECT vault.create_secret(
  'YOUR_SERVICE_ROLE_KEY_HERE',
  'SUPABASE_SERVICE_ROLE_KEY',
  'Service role key for authenticating Edge Function calls from cron jobs'
);

-- DESPUÉS (con tu clave real)
SELECT vault.create_secret(
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrYW5jb2NrenZjcW9ycWJ3dHloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5ODg3MDQwMCwiZXhwIjoyMDE0NDQ2NDAwfQ.TU_CLAVE_REAL_COMPLETA_AQUI',
  'SUPABASE_SERVICE_ROLE_KEY',
  'Service role key for authenticating Edge Function calls from cron jobs'
);
```

### Paso 4: Verificar que se creó correctamente

Ejecuta esto en el mismo SQL Editor:

```sql
SELECT 
  id,
  name,
  description,
  created_at
FROM vault.secrets
WHERE name = 'SUPABASE_SERVICE_ROLE_KEY';
```

**Resultado esperado**:
```
id   | name                        | description                                    | created_at
-----+-----------------------------+------------------------------------------------+------------
uuid | SUPABASE_SERVICE_ROLE_KEY  | Service role key for auth...                   | 2025-11-14...
```

### Paso 5: Probar las funciones de cron

```sql
-- Probar función de recordatorios
SELECT public.invoke_process_reminders();

-- Probar función de actualización de estados
SELECT public.invoke_appointment_status_updater();
```

### Paso 6: Revisar logs

```sql
SELECT 
  job_name,
  status,
  message,
  created_at
FROM public.cron_execution_logs
ORDER BY created_at DESC
LIMIT 5;
```

**Resultado esperado**:
```
job_name          | status  | message                               | created_at
------------------+---------+---------------------------------------+------------
process-reminders | success | Successfully invoked Edge Function   | 2025-11-14...
```

---

## ✅ Validación Final

Después de ejecutar los pasos, confirma:

- [ ] `vault.secrets` tiene 1 fila con `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `invoke_process_reminders()` ejecuta sin errores
- [ ] `cron_execution_logs` muestra status='success'
- [ ] Cron jobs están activos:
  ```sql
  SELECT jobname, active FROM cron.job 
  WHERE jobname IN ('process-appointment-reminders-hourly', 'appointment-status-updater');
  ```

---

## 🔐 Ventajas de Usar Vault

| Característica | Vault | ALTER DATABASE |
|----------------|-------|----------------|
| Requiere permisos superusuario | ❌ NO | ✅ SÍ |
| Encriptación en reposo | ✅ SÍ | ❌ NO |
| Auditoría de accesos | ✅ SÍ | ❌ NO |
| Rotación fácil de secrets | ✅ SÍ | ⚠️ Manual |
| Interfaz en Dashboard | ✅ SÍ (Integrations) | ❌ NO |

---

## 🛠️ Comandos Útiles

### Actualizar un secret existente

Si necesitas cambiar la clave en el futuro:

```sql
SELECT vault.update_secret(
  (SELECT id FROM vault.secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY'),
  'NUEVO_SERVICE_ROLE_KEY_AQUI',
  'Service role key for authenticating Edge Function calls from cron jobs'
);
```

### Ver todos los secrets (solo nombres)

```sql
SELECT id, name, description, created_at
FROM vault.secrets
ORDER BY created_at DESC;
```

### Eliminar un secret (si necesitas recrearlo)

```sql
SELECT vault.delete_secret(
  (SELECT id FROM vault.secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY')
);
```

---

## 🆘 Problemas Comunes

### Error: "Secret with name already exists"

**Solución**: Ya creaste el secret antes. Usa `vault.update_secret()` en lugar de `vault.create_secret()`.

### Error: "relation vault.secrets does not exist"

**Solución**: Vault no está instalado. Ve a Dashboard > Integrations > Vault > Install.

### Logs muestran "Service role key not found in Vault"

**Solución**: 
1. Verifica que el secret se creó: `SELECT * FROM vault.secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY'`
2. Si no existe, ejecuta `vault.create_secret()` nuevamente

---

## 📚 Documentación Completa

Para más detalles, revisa:
- `scripts/configure-cron-jobs-manual.sql` - Script completo con todos los pasos
- `docs/CRON_SECRETS_CONFIG_FINAL.md` - Guía detallada (si prefieres ALTER DATABASE)
- [Supabase Vault Docs](https://supabase.com/docs/guides/database/vault)

---

**Estado**: ✅ Migración aplicada | ⏳ Pendiente configurar secret en Vault  
**Tiempo estimado**: 5 minutos  
**Fecha**: Noviembre 14, 2025
