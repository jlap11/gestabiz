# Sistema de Recordatorios Automáticos

## Descripción General

Sistema automático que procesa citas próximas cada 5 minutos y envía recordatorios a los clientes según la configuración del negocio. Utiliza Edge Functions de Supabase y cron jobs para la ejecución programada.

## Arquitectura

```
┌─────────────────┐
│   Cron Job      │  Ejecuta cada 5 minutos
│   (pg_cron)     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  Edge Function              │
│  process-reminders          │
│  1. Query citas próximas    │
│  2. Calcular tiempos        │
│  3. Verificar si enviar     │
│  4. Llamar send-notification│
│  5. Registrar en log        │
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Edge Function              │
│  send-notification          │
│  - Determinar canales       │
│  - Enviar por AWS/WhatsApp  │
│  - Registrar resultado      │
└─────────────────────────────┘
```

## Componentes

### 1. Edge Function: process-reminders

**Archivo:** `supabase/functions/process-reminders/index.ts`

**Funcionalidad:**
- Se ejecuta cada 5 minutos vía cron job
- Busca citas en las próximas 25 horas con status `scheduled`
- Para cada cita:
  - Obtiene configuración del negocio (`business_notification_settings`)
  - Lee los `reminder_times` (ej: [1440, 60] = 24h y 1h antes)
  - Calcula minutos hasta la cita
  - Si coincide con algún reminder_time (±5 min de margen):
    - Verifica que no se haya enviado recordatorio reciente
    - Invoca `send-notification` con tipo `appointment_reminder`
    - Marca la cita como `reminder_sent: true` si es recordatorio final (≤60 min)

**Respuesta:**
```json
{
  "success": true,
  "processed_at": "2025-12-20T10:15:00.000Z",
  "appointments_checked": 15,
  "reminders_processed": 3,
  "reminders_sent": 3,
  "results": [
    {
      "appointment_id": "uuid",
      "client": "Juan Pérez",
      "time_until": "60 minutos",
      "reminder_type": "1 hora",
      "status": "sent"
    }
  ]
}
```

### 2. Cron Job Configuration

**Archivo:** `supabase/migrations/20251220000002_setup_reminder_cron.sql`

**Elementos:**
- **Función PL/pgSQL:** `invoke_process_reminders()`
  - Lee configuración de Supabase (service_role_key, supabase_url)
  - Invoca Edge Function vía `net.http_post()`
  - Registra ejecución en logs
  
- **Cron Job:** `process-appointment-reminders`
  - Programación: `*/5 * * * *` (cada 5 minutos)
  - Ejecuta: `SELECT invoke_process_reminders();`

**Configuración requerida en Supabase:**
```sql
-- En Dashboard -> Settings -> API, configurar:
ALTER DATABASE postgres SET app.settings.service_role_key = 'tu-service-role-key';
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://tuproyecto.supabase.co';
```

### 3. Tablas involucradas

**appointments:**
- `reminder_sent`: Boolean que indica si ya se envió recordatorio final
- Se actualiza solo para recordatorios ≤60 minutos

**business_notification_settings:**
- `reminder_times`: Array de minutos antes de la cita (ej: [1440, 60, 30])
- `email_enabled`, `sms_enabled`, `whatsapp_enabled`: Canales activos
- `channel_priority`: Orden de preferencia ['whatsapp', 'email', 'sms']

**notification_log:**
- Registra cada intento de notificación
- `notification_type`: 'appointment_reminder'
- `appointment_id`: Referencia a la cita
- `status`: 'pending', 'sent', 'failed', 'delivered'
- `created_at`: Timestamp del envío

## Flujo de Ejecución

1. **Trigger automático (cada 5 minutos)**
   ```
   Cron Job → invoke_process_reminders() → Edge Function
   ```

2. **Procesamiento de citas**
   ```sql
   SELECT appointments
   WHERE status = 'scheduled'
     AND start_time >= NOW()
     AND start_time <= NOW() + INTERVAL '25 hours'
   ORDER BY start_time ASC
   ```

3. **Cálculo de coincidencia**
   ```typescript
   const minutesUntilAppointment = (appointmentTime - now) / 60000
   const shouldSend = reminderTimes.some(time => 
     Math.abs(minutesUntilAppointment - time) <= 5
   )
   ```

4. **Envío de notificación**
   ```typescript
   await supabase.functions.invoke('send-notification', {
     body: {
       type: 'appointment_reminder',
       recipient_user_id: client_id,
       recipient_email: client.email,
       recipient_phone: client.phone,
       business_id: appointment.business_id,
       appointment_id: appointment.id,
       data: {
         name: client.name,
         date: '20 de diciembre de 2025',
         time: '15:30',
         location: 'Av. Principal 123',
         service: 'Corte de cabello',
         reminder_time: '1 hora'
       }
     }
   })
   ```

## Configuración de Tiempos de Recordatorio

Los negocios pueden configurar múltiples tiempos de recordatorio:

```typescript
// Ejemplos comunes:
reminder_times: [1440]        // Solo 24 horas antes
reminder_times: [1440, 60]    // 24 horas y 1 hora antes
reminder_times: [1440, 120, 30] // 24h, 2h y 30 min antes
reminder_times: [60]          // Solo 1 hora antes (para negocios pequeños)
```

**Recomendaciones:**
- **Spa/Salones:** [1440, 60] - Recordatorios con anticipación
- **Consultorios:** [1440, 120] - Tiempo para prepararse
- **Servicios rápidos:** [60, 30] - Solo recordatorios cercanos
- **Eventos importantes:** [10080, 1440, 60] - 1 semana, 1 día, 1 hora

## Prevención de Duplicados

El sistema previene envíos duplicados mediante:

1. **Ventana de tiempo:** Margen de ±5 minutos para coincidencia
2. **Verificación de log reciente:**
   ```typescript
   const { data: existingLog } = await supabase
     .from('notification_log')
     .select('id')
     .eq('appointment_id', appointment.id)
     .eq('notification_type', 'appointment_reminder')
     .gte('created_at', now - 10 minutes)
   
   if (existingLog?.length > 0) {
     // Ya se envió, saltar
     continue
   }
   ```

3. **Flag reminder_sent:** Solo se actualiza en recordatorio final

## Monitoreo y Debugging

### Ver ejecuciones del cron job:
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid IN (
  SELECT jobid FROM cron.job 
  WHERE jobname = 'process-appointment-reminders'
) 
ORDER BY start_time DESC 
LIMIT 20;
```

### Ver recordatorios enviados:
```sql
SELECT 
  nl.*,
  a.title as appointment_title,
  a.start_time,
  p.name as client_name,
  p.email as client_email
FROM notification_log nl
JOIN appointments a ON nl.appointment_id = a.id
JOIN profiles p ON a.client_id = p.id
WHERE nl.notification_type = 'appointment_reminder'
  AND nl.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY nl.created_at DESC;
```

### Estadísticas de envío:
```sql
SELECT 
  channel,
  status,
  COUNT(*) as count,
  ROUND(AVG(retry_count), 2) as avg_retries
FROM notification_log
WHERE notification_type = 'appointment_reminder'
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY channel, status
ORDER BY channel, status;
```

## Manejo de Errores

**Errores comunes y soluciones:**

1. **Credenciales AWS faltantes:**
   - Error: `AWS_ACCESS_KEY_ID not configured`
   - Solución: Configurar variables en Supabase Dashboard → Settings → Edge Functions

2. **Cron job no ejecuta:**
   - Verificar: `SELECT * FROM cron.job WHERE jobname = 'process-appointment-reminders'`
   - Verificar: Configuración `app.settings.*` en PostgreSQL

3. **Notificaciones no llegan:**
   - Verificar canales habilitados en `business_notification_settings`
   - Verificar preferencias en `user_notification_preferences`
   - Revisar `notification_log` para mensajes de error

4. **Recordatorios duplicados:**
   - Verificar intervalo del cron (debe ser ≥5 minutos)
   - Revisar lógica de ventana de tiempo en `process-reminders`

## Optimizaciones

**Performance:**
- Query limitado a 25 horas futuras (reduce escaneo)
- Índices en `appointments(status, start_time)`
- Procesamiento batch (no bloquea otros cron jobs)

**Costos:**
- Cada ejecución procesa solo citas elegibles
- Sin envíos duplicados = reducción de costos AWS
- Fallback solo si falla canal primario

**Escalabilidad:**
- Edge Functions escalan automáticamente
- Cron jobs independientes por función
- Logs con retención configurable (30-90 días)

## Desactivación Temporal

Para pausar el sistema de recordatorios:

```sql
-- Desactivar cron job
SELECT cron.unschedule('process-appointment-reminders');

-- Reactivar
SELECT cron.schedule(
  'process-appointment-reminders',
  '*/5 * * * *',
  'SELECT invoke_process_reminders();'
);
```

## Testing Manual

Invocar función directamente:

```bash
# Usando Supabase CLI
npx supabase functions invoke process-reminders \
  --env-file .env

# Usando curl con service role key
curl -X POST 'https://tuproyecto.supabase.co/functions/v1/process-reminders' \
  -H "Authorization: Bearer TU_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

## Roadmap Futuro

**Funcionalidades planeadas:**
- [ ] Recordatorios por SMS para clientes sin email verificado
- [ ] Personalización de mensajes por negocio
- [ ] Confirmación de asistencia (reply con Sí/No)
- [ ] Integración con Google Calendar para sincronizar recordatorios
- [ ] Dashboard de métricas de recordatorios en AdminDashboard
- [ ] A/B testing de tiempos óptimos de recordatorio por industria
- [ ] Machine learning para predecir mejor hora de envío por cliente

## Referencias

- Edge Function principal: `supabase/functions/process-reminders/index.ts`
- Configuración cron: `supabase/migrations/20251220000002_setup_reminder_cron.sql`
- Sistema de notificaciones completo: `SISTEMA_NOTIFICACIONES_COMPLETO.md`
- Documentación pg_cron: https://github.com/citusdata/pg_cron
