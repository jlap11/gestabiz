# Configuración del Cron Job para Confirmación y Recordatorios de Citas

Este documento explica cómo configurar y gestionar el cron job que actualiza automáticamente el estado de las citas pendientes de confirmación.

## Descripción

El sistema incluye un cron job que se ejecuta cada 30 minutos para:
- Verificar citas con estado `pending_confirmation` que han expirado (más de 24 horas sin confirmar)
- Cambiar automáticamente su estado a `cancelled`
- Registrar la cancelación automática en el sistema

Adicionalmente, existe un cron job horario para recordatorios de citas (Edge Function `process-reminders`) que:
- Envía recordatorios 24 horas antes y 1 hora antes de cada cita
- Usa ventanas móviles de 30 minutos para cubrir citas a la media hora
- Crea y actualiza registros en `notifications` (sent/failed)

## Configuración en Desarrollo Local

### Prerequisitos
- Supabase CLI instalado
- Docker ejecutándose (para Supabase local)

### Pasos
1. Iniciar Supabase local:
   ```bash
   npx supabase start
   ```

2. Aplicar la migración del cron job:
   ```bash
   npx supabase db push
   ```

3. Verificar que el cron job está configurado:
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'appointment-status-updater';
   ```

## Configuración en Producción

### 1. Habilitar pg_cron
1. Ir al Dashboard de Supabase
2. Navegar a **Database > Extensions**
3. Buscar y habilitar la extensión **pg_cron**

### 2. Configurar la Variable de Entorno
Asegurarse de que la variable `SERVICE_ROLE_KEY` esté configurada en las variables de entorno de las Edge Functions.

### 3. Programar los Cron Jobs
Ejecutar en el SQL Editor de Supabase:

```sql
SELECT cron.schedule(
  'appointment-status-updater',
  '*/30 * * * *',
  'SELECT invoke_appointment_status_updater();'
);

-- Recordatorios de citas (cada hora)
SELECT cron.schedule(
  'process-appointment-reminders-hourly',
  '0 * * * *',
  'SELECT public.invoke_process_reminders();'
);
```

### 4. Verificar la Configuración
```sql
-- Ver jobs programados
SELECT * FROM cron.job;

-- Ver historial de ejecuciones
SELECT * FROM cron.job_run_details 
WHERE jobname = 'appointment-status-updater' 
ORDER BY start_time DESC 
LIMIT 10;
```

## Gestión del Cron Job

### Verificar Estado
```sql
-- Ver si el job está activo
SELECT jobname, schedule, active, database 
FROM cron.job 
WHERE jobname = 'appointment-status-updater';
```

### Ver Logs de Ejecución
```sql
-- Ver últimas 20 ejecuciones
SELECT 
  start_time,
  end_time,
  status,
  return_message,
  (end_time - start_time) as duration
FROM cron.job_run_details 
WHERE jobname = 'appointment-status-updater'
ORDER BY start_time DESC 
LIMIT 20;
```

### Pausar/Reanudar el Job
```sql
-- Pausar
UPDATE cron.job SET active = false WHERE jobname = 'appointment-status-updater';

-- Reanudar
UPDATE cron.job SET active = true WHERE jobname = 'appointment-status-updater';
```

### Cambiar Frecuencia
```sql
-- Cambiar a cada 30 minutos
SELECT cron.alter_job('appointment-status-updater', schedule => '*/30 * * * *');
```

### Eliminar el Job
```sql
SELECT cron.unschedule('appointment-status-updater');
```

## Monitoreo y Troubleshooting

### Verificar que la Edge Function Responde
```bash
curl -X POST 'https://dkancockzvcqorqbwtyh.supabase.co/functions/v1/appointment-status-updater' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"source": "manual_test"}'
```

### Logs de las Edge Functions
1. Ir al Dashboard de Supabase
2. Navegar a **Edge Functions > appointment-status-updater** y **process-reminders**
3. Ver la pestaña **Logs** para revisar ejecuciones

### Problemas Comunes

#### El cron job no se ejecuta
- Verificar que pg_cron esté habilitado
- Verificar que el job esté activo: `SELECT active FROM cron.job WHERE jobname = 'appointment-status-updater'`
- Revisar logs de cron: `SELECT * FROM cron.job_run_details WHERE jobname = 'appointment-status-updater' ORDER BY start_time DESC LIMIT 5`

#### Error de autorización
- Verificar que la variable `SERVICE_ROLE_KEY` esté configurada correctamente
- Verificar que la URL de la Edge Function sea correcta

#### La Edge Function falla
- Revisar logs en el Dashboard de Supabase
- Verificar que todas las dependencias estén disponibles
- Probar la función manualmente

## Configuración Recomendada

### Frecuencia
- **Desarrollo**: Cada 5–15 minutos para pruebas rápidas
- **Producción**: Cada 30 minutos (balance entre carga y consistencia)

### Monitoreo
- Configurar alertas para fallos consecutivos del cron job
- Revisar logs semanalmente
- Monitorear el rendimiento de la Edge Function

### Backup
- Mantener respaldos de la configuración del cron job
- Documentar cualquier cambio en la frecuencia o lógica

## Comandos Útiles

```sql
-- Ejecutar manualmente (para pruebas)
SELECT invoke_appointment_status_updater();

-- Forzar procesamiento de recordatorios
SELECT public.invoke_process_reminders();

-- Ver próxima ejecución programada
SELECT jobname, schedule, 
       CASE 
         WHEN active THEN 'Activo' 
         ELSE 'Inactivo' 
       END as estado
FROM cron.job 
WHERE jobname = 'appointment-status-updater';

-- Próxima ejecución de recordatorios
SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'process-appointment-reminders-hourly';

-- Estadísticas de ejecución
SELECT 
  COUNT(*) as total_ejecuciones,
  COUNT(CASE WHEN status = 'succeeded' THEN 1 END) as exitosas,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as fallidas,
  AVG(EXTRACT(EPOCH FROM (end_time - start_time))) as duracion_promedio_segundos
FROM cron.job_run_details 
WHERE jobname = 'appointment-status-updater'
  AND start_time >= NOW() - INTERVAL '7 days';

-- Estadísticas de recordatorios
SELECT 
  COUNT(*) as total_ejecuciones,
  COUNT(CASE WHEN status = 'succeeded' THEN 1 END) as exitosas,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as fallidas
FROM cron.job_run_details 
WHERE jobname = 'process-appointment-reminders-hourly'
  AND start_time >= NOW() - INTERVAL '7 days';
```
