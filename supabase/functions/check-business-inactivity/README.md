# Edge Function: check-business-inactivity

## Descripción
Esta función Edge revisa todos los negocios para aplicar reglas de inactividad automáticas:

1. **Desactivar** negocios inactivos por 30+ días
2. **Advertir** negocios sin clientes después de 1 año (eliminar en 7 días)
3. **Eliminar** negocios que recibieron advertencia hace 7+ días

Se ejecuta automáticamente vía cron job diario.

## Reglas de Inactividad

### Regla 1: Desactivación por inactividad (30 días)
- **Condición**: `last_activity_at` > 30 días atrás
- **Acción**: 
  - Cambia `is_active` a `false`
  - Envía email al owner
  - Crea notificación in-app
- **Reversible**: Sí, owner puede reactivar en cualquier momento

### Regla 2: Eliminación por falta de clientes (1 año)
- **Condición**: `first_client_at IS NULL` AND `created_at` > 1 año atrás
- **Acción en primera vez**:
  - Envía email de advertencia
  - Crea notificación in-app
  - Registra advertencia con fecha
- **Acción después de 7 días**:
  - Elimina negocio permanentemente (CASCADE)
  - Envía email de confirmación
- **Reversible**: Solo dentro de los 7 días de advertencia

## Variables de Entorno Requeridas

```bash
# API Key de Resend para envío de emails
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx

# URL de tu proyecto Supabase (ya configurada por defecto)
SUPABASE_URL=https://your-project.supabase.co

# Service Role Key (ya configurada por defecto)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Deployment

### 1. Desplegar la función

```bash
npx supabase functions deploy check-business-inactivity
```

### 2. Configurar Cron Job

Hay dos opciones para configurar el cron job:

#### Opción A: Supabase Cron (pg_cron)

Esta es la opción recomendada. Requiere plan Pro+ en Supabase.

```sql
-- Ejecuta en Supabase SQL Editor

-- 1. Habilitar extensión pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Habilitar extensión pg_net para llamadas HTTP
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 3. Configurar cron job para ejecutar diariamente a las 2 AM UTC
SELECT cron.schedule(
  'check-business-inactivity-daily',
  '0 2 * * *', -- Cron expression: A las 2:00 AM todos los días
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/check-business-inactivity',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- 4. Verificar que el cron job fue creado
SELECT * FROM cron.job WHERE jobname = 'check-business-inactivity-daily';

-- 5. Ver historial de ejecuciones
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'check-business-inactivity-daily')
ORDER BY start_time DESC
LIMIT 10;
```

#### Opción B: GitHub Actions (alternativa sin pg_cron)

Si no tienes acceso a pg_cron, puedes usar GitHub Actions.

Crea `.github/workflows/check-business-inactivity.yml`:

```yaml
name: Check Business Inactivity

on:
  schedule:
    # Ejecutar diariamente a las 2 AM UTC
    - cron: '0 2 * * *'
  workflow_dispatch: # Permite ejecución manual

jobs:
  check-inactivity:
    runs-on: ubuntu-latest
    steps:
      - name: Call Supabase Edge Function
        run: |
          curl -X POST '${{ secrets.SUPABASE_URL }}/functions/v1/check-business-inactivity' \
            -H 'Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}' \
            -H 'Content-Type: application/json' \
            -d '{}'
```

Configura estos secrets en GitHub:
- `SUPABASE_URL`: Tu URL de Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Tu service role key

## Testing

### Test Manual

Puedes ejecutar la función manualmente:

```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/check-business-inactivity' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

### Test de Reglas

Para probar las reglas sin esperar 30 días o 1 año:

```sql
-- Simular negocio inactivo por 30 días
UPDATE businesses
SET last_activity_at = NOW() - INTERVAL '31 days'
WHERE id = 'test-business-id';

-- Simular negocio sin clientes de 1 año
UPDATE businesses
SET created_at = NOW() - INTERVAL '366 days',
    first_client_at = NULL
WHERE id = 'test-business-id';

-- Ejecutar función manualmente (ver comando curl arriba)

-- Verificar resultados
SELECT id, name, is_active, last_activity_at, first_client_at
FROM businesses
WHERE id = 'test-business-id';

-- Verificar notificaciones creadas
SELECT * FROM notifications
WHERE metadata->>'business_id' = 'test-business-id'
ORDER BY created_at DESC;
```

## Respuesta de la Función

La función devuelve un JSON con estadísticas de ejecución:

```json
{
  "success": true,
  "message": "Business inactivity check completed",
  "stats": {
    "total_checked": 150,
    "deactivated": 5,
    "warned": 2,
    "deleted": 1,
    "details": {
      "deactivated_businesses": [
        {
          "id": "uuid-1",
          "name": "Barbería Moderna",
          "days_inactive": 45
        }
      ],
      "warned_businesses": [
        {
          "id": "uuid-2",
          "name": "Salón Sin Uso",
          "days_since_creation": 380
        }
      ],
      "deleted_businesses": [
        {
          "id": "uuid-3",
          "name": "Negocio Viejo",
          "days_since_creation": 400
        }
      ]
    }
  },
  "timestamp": "2025-10-11T02:00:00.000Z"
}
```

## Monitoreo y Logs

### Ver Logs de Ejecución

1. Ve a Supabase Dashboard > Edge Functions > check-business-inactivity > Logs
2. Filtra por fecha para ver ejecuciones diarias
3. Busca errores o warnings

### Ver Logs del Cron Job (pg_cron)

```sql
-- Ver últimas 20 ejecuciones
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'check-business-inactivity-daily')
ORDER BY start_time DESC
LIMIT 20;

-- Ver solo ejecuciones fallidas
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'check-business-inactivity-daily')
  AND status = 'failed'
ORDER BY start_time DESC;
```

### Alertas

Configura alertas para recibir notificaciones si el cron falla:

```sql
-- Crear función para enviar alerta si el cron falla
CREATE OR REPLACE FUNCTION alert_on_cron_failure()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'failed' THEN
    -- Enviar notificación al admin principal
    INSERT INTO notifications (user_id, type, title, message)
    SELECT 
      'admin-user-id',
      'system_alert',
      'Cron job falló',
      'El cron job check-business-inactivity falló: ' || NEW.return_message;
  END IF;
  RETURN NEW;
END;
$$;

-- Crear trigger
CREATE TRIGGER trigger_alert_cron_failure
AFTER INSERT ON cron.job_run_details
FOR EACH ROW
WHEN (NEW.jobid = (SELECT jobid FROM cron.job WHERE jobname = 'check-business-inactivity-daily'))
EXECUTE FUNCTION alert_on_cron_failure();
```

## Troubleshooting

### Cron no se ejecuta

1. **Verifica que pg_cron esté habilitado**:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```

2. **Verifica sintaxis del cron expression**:
   - `0 2 * * *` = Diariamente a las 2 AM
   - `0 */6 * * *` = Cada 6 horas
   - `0 0 * * 0` = Semanalmente los domingos a medianoche

3. **Revisa logs de ejecución**:
   ```sql
   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;
   ```

### Emails no se envían

1. **Verifica RESEND_API_KEY**:
   ```bash
   npx supabase secrets list
   ```

2. **Verifica dominio en Resend**:
   - Dominio debe estar verificado
   - Para testing usa `onboarding@resend.dev`

3. **Revisa rate limits de Resend**:
   - Free tier: 100 emails/día
   - Paid: según plan

### Negocios no se eliminan

1. **Verifica CASCADE en foreign keys**:
   ```sql
   SELECT
     tc.constraint_name,
     tc.table_name,
     kcu.column_name,
     ccu.table_name AS foreign_table_name,
     ccu.column_name AS foreign_column_name,
     rc.delete_rule
   FROM information_schema.table_constraints AS tc
   JOIN information_schema.key_column_usage AS kcu
     ON tc.constraint_name = kcu.constraint_name
   JOIN information_schema.constraint_column_usage AS ccu
     ON ccu.constraint_name = tc.constraint_name
   JOIN information_schema.referential_constraints AS rc
     ON rc.constraint_name = tc.constraint_name
   WHERE tc.constraint_type = 'FOREIGN KEY'
     AND ccu.table_name = 'businesses';
   ```

2. **Asegúrate de que las tablas relacionadas tengan ON DELETE CASCADE**

## Mejoras Futuras

- [ ] Dashboard de estadísticas de inactividad
- [ ] Configurar días de inactividad por negocio (override global rules)
- [ ] Exportar datos antes de eliminar (backup automático)
- [ ] Permitir "snooze" de eliminación (extender 30 días más)
- [ ] Notificaciones push además de email
- [ ] Analytics de tasa de reactivación
- [ ] Webhooks para integraciones externas

## Desactivar Cron Job

Si necesitas pausar el cron job:

```sql
-- Eliminar cron job
SELECT cron.unschedule('check-business-inactivity-daily');

-- O deshabilitarlo temporalmente
UPDATE cron.job
SET active = false
WHERE jobname = 'check-business-inactivity-daily';

-- Reactivarlo
UPDATE cron.job
SET active = true
WHERE jobname = 'check-business-inactivity-daily';
```
