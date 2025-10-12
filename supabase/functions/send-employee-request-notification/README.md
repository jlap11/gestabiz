# Edge Function: send-employee-request-notification

## Descripción
Esta función Edge envía notificaciones por email al dueño de un negocio cuando un empleado solicita unirse a través del sistema de códigos de invitación.

## Trigger Automático
Se ejecuta automáticamente cuando se inserta un nuevo registro en la tabla `employee_requests` vía trigger de base de datos.

## Variables de Entorno Requeridas

Configura estas variables en tu proyecto de Supabase:

```bash
# API Key de Resend para envío de emails
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx

# URL de tu proyecto Supabase (ya configurada por defecto)
SUPABASE_URL=https://your-project.supabase.co

# Service Role Key (ya configurada por defecto)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Obtener API Key de Resend

1. Ve a [resend.com](https://resend.com) y crea una cuenta
2. Crea un nuevo API Key en el dashboard
3. Configura un dominio verificado (o usa el sandbox para testing)
4. Añade la API key a Supabase:

```bash
npx supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
```

## Deployment

### 1. Desplegar la función

```bash
npx supabase functions deploy send-employee-request-notification
```

### 2. Aplicar la migración del trigger

```bash
# Opción A: Via Supabase CLI
npx supabase db push

# Opción B: Via SQL Editor en Supabase Dashboard
# Copia y ejecuta el contenido de:
# supabase/migrations/20251011000002_add_employee_request_notification_trigger.sql
```

### 3. Configurar settings de la base de datos (pg_net)

La función usa `pg_net` para llamadas HTTP asíncronas. Necesitas habilitar la extensión:

```sql
-- Ejecuta en Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Configura las variables para el trigger
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://your-project.supabase.co';
ALTER DATABASE postgres SET app.settings.anon_key = 'your_anon_key';
```

## Testing

### Test Manual

Puedes probar la función manualmente con curl:

```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/send-employee-request-notification' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "request_id": "uuid-of-existing-request"
  }'
```

### Test con Trigger

1. Crea una solicitud de empleado desde la UI (EmployeeOnboarding)
2. Verifica que el owner del negocio reciba el email
3. Revisa los logs en Supabase Dashboard > Edge Functions > send-employee-request-notification

## Estructura del Email

El email incluye:
- Nombre y datos del solicitante (full_name, email, phone)
- Código de invitación usado
- Mensaje opcional del solicitante
- Fecha de la solicitud
- Botón para ir al dashboard y aprobar/rechazar
- Alerta sobre acción pendiente

## Troubleshooting

### Email no se envía

1. **Verifica RESEND_API_KEY**:
   ```bash
   npx supabase secrets list
   ```

2. **Revisa logs de la función**:
   - Ve a Supabase Dashboard > Edge Functions > send-employee-request-notification > Logs

3. **Verifica dominio en Resend**:
   - El dominio `appointsync.pro` debe estar verificado en Resend
   - Para testing, usa el sandbox: `onboarding@resend.dev`

4. **Revisa que pg_net esté habilitado**:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_net';
   ```

### Trigger no se ejecuta

1. **Verifica que el trigger existe**:
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE trigger_name = 'trigger_notify_employee_request';
   ```

2. **Revisa warnings en logs de Postgres**:
   - Supabase Dashboard > Database > Logs

3. **Prueba la función manualmente**:
   ```sql
   SELECT notify_employee_request();
   ```

## Limitaciones

- Requiere extensión `pg_net` (disponible en planes Supabase Pro+)
- Sin `pg_net`, el trigger loguea un warning pero no falla la transacción
- Rate limits de Resend: 
  - Free tier: 100 emails/día
  - Paid: según plan contratado

## Alternativas sin pg_net

Si no tienes pg_net disponible, puedes:

1. **Llamar la función desde el cliente**:
   ```typescript
   // En useEmployeeRequests.ts después de createRequest()
   await supabase.functions.invoke('send-employee-request-notification', {
     body: { request_id: newRequest.id }
   })
   ```

2. **Usar webhooks de Supabase** (Database Webhooks en Dashboard)

3. **Polling periódico** con cron job que revisa requests nuevos

## Mejoras Futuras

- [ ] Template más elaborado con diseño responsive
- [ ] Soporte para múltiples idiomas
- [ ] Notificaciones in-app además de email
- [ ] WhatsApp notifications (usando Twilio)
- [ ] Digest diario de solicitudes pendientes
- [ ] Analytics de tasa de apertura/clicks
