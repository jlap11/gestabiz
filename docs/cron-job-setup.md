# Configuración del Cron Job para Confirmación de Citas

Este documento explica cómo configurar y gestionar el cron job que actualiza automáticamente el estado de las citas pendientes de confirmación.

## Descripción

El sistema incluye un cron job que se ejecuta cada 10 minutos para:
- Verificar citas con estado `pending_confirmation` que han expirado (más de 24 horas sin confirmar)
- Cambiar automáticamente su estado a `cancelled`
- Registrar la cancelación automática en el sistema

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

### 3. Programar el Cron Job
Ejecutar en el SQL Editor de Supabase:

```sql
SELECT cron.schedule(
  'appointment-status-updater',
  '*/10 * * * *',
  'SELECT invoke_appointment_status_updater();'
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
-- Cambiar a cada 5 minutos
SELECT cron.alter_job('appointment-status-updater', schedule => '*/5 * * * *');

-- Cambiar a cada 15 minutos
SELECT cron.alter_job('appointment-status-updater', schedule => '*/15 * * * *');
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

### Logs de la Edge Function
1. Ir al Dashboard de Supabase
2. Navegar a **Edge Functions > appointment-status-updater**
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
- **Desarrollo**: Cada 5 minutos para pruebas rápidas
- **Producción**: Cada 10 minutos (balance entre responsividad y carga del servidor)

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

-- Ver próxima ejecución programada
SELECT jobname, schedule, 
       CASE 
         WHEN active THEN 'Activo' 
         ELSE 'Inactivo' 
       END as estado
FROM cron.job 
WHERE jobname = 'appointment-status-updater';

-- Estadísticas de ejecución
SELECT 
  COUNT(*) as total_ejecuciones,
  COUNT(CASE WHEN status = 'succeeded' THEN 1 END) as exitosas,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as fallidas,
  AVG(EXTRACT(EPOCH FROM (end_time - start_time))) as duracion_promedio_segundos
FROM cron.job_run_details 
WHERE jobname = 'appointment-status-updater'
  AND start_time >= NOW() - INTERVAL '7 days';
```