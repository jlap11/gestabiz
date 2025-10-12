# Sistema de Notificaciones Multicanal - AppointSync Pro

## 📋 Resumen Ejecutivo

Sistema completo de notificaciones que soporta 3 canales (Email, SMS, WhatsApp) con:
- Configuración personalizada por usuario y por negocio
- Sistema de vacantes laborales con notificaciones
- Verificación de email y teléfono
- Fallback automático entre canales
- Tracking completo de envío y entrega

---

## 📊 Estructura de Base de Datos

### Tablas Creadas

#### 1. `business_notification_settings`
Configuración de notificaciones por negocio.

**Campos clave:**
- `business_id` - UUID del negocio
- `email_enabled`, `sms_enabled`, `whatsapp_enabled` - Canales habilitados
- `channel_priority` - Array con orden de prioridad: `['whatsapp', 'email', 'sms']`
- `reminder_times` - Array de minutos antes: `[1440, 60]` (24h y 1h)
- `notification_types` - JSONB con configuración por tipo
- `use_fallback` - Si falla un canal, usar el siguiente

**Trigger:** Crea configuración default al crear un negocio

#### 2. `user_notification_preferences`
Preferencias personales de cada usuario.

**Campos clave:**
- `user_id` - UUID del usuario
- `email_enabled`, `sms_enabled`, `whatsapp_enabled` - Canales habilitados
- `email_verified`, `phone_verified`, `whatsapp_verified` - Estados de verificación
- `notification_preferences` - JSONB con preferencias por tipo de notificación
- `do_not_disturb_enabled` - No molestar
- `do_not_disturb_start/end` - Horarios

**Ejemplo de preferences JSONB:**
```json
{
  "appointment_reminder": {"email": true, "sms": false, "whatsapp": true},
  "appointment_confirmation": {"email": true, "sms": false, "whatsapp": true},
  "job_application_accepted": {"email": true, "sms": true, "whatsapp": true}
}
```

**Trigger:** Crea preferencias default al crear un usuario

#### 3. `notification_log`
Registro de todas las notificaciones enviadas.

**Campos clave:**
- `notification_type` - Tipo de notificación (enum)
- `channel` - Canal usado: email/sms/whatsapp
- `recipient_contact` - Email, teléfono o WhatsApp
- `status` - pending, sent, failed, delivered, read
- `sent_at`, `delivered_at` - Timestamps
- `external_id` - ID del servicio externo (Twilio/Resend/WhatsApp)
- `retry_count` - Número de reintentos

#### 4. `job_vacancies`
Vacantes laborales publicadas por negocios.

**Campos clave:**
- `business_id` - Negocio que publica
- `title`, `description` - Info de la vacante
- `position_type` - full_time, part_time, freelance, temporary
- `required_services` - UUID[] de servicios requeridos
- `status` - open, paused, closed, filled
- `applications_count` - Contador automático

#### 5. `job_applications`
Aplicaciones de usuarios a vacantes.

**Campos clave:**
- `vacancy_id`, `user_id`, `business_id` - Relaciones
- `status` - pending, reviewing, interview, accepted, rejected
- `cover_letter` - Carta de presentación
- `interview_scheduled_at` - Fecha de entrevista
- `rating` - Puntuación del admin (1-5)

---

## 🔔 Tipos de Notificaciones

### Citas (Appointments)
1. **appointment_reminder** - Recordatorio antes de la cita
2. **appointment_confirmation** - Cuando se confirma la cita
3. **appointment_cancellation** - Cuando se cancela
4. **appointment_rescheduled** - Cuando se reprograma
5. **appointment_new_client** - Al cliente cuando agenda
6. **appointment_new_employee** - Al empleado cuando le asignan una cita
7. **appointment_new_business** - Al negocio cuando hay nueva cita

### Verificación
1. **email_verification** - Código para verificar email
2. **phone_verification_sms** - Código por SMS
3. **phone_verification_whatsapp** - Código por WhatsApp

### Solicitudes de Empleo
1. **employee_request_new** - Al admin cuando recibe solicitud
2. **employee_request_accepted** - Al usuario cuando lo aceptan
3. **employee_request_rejected** - Al usuario cuando lo rechazan

### Vacantes Laborales
1. **job_vacancy_new** - Nueva vacante publicada
2. **job_application_new** - Al admin: nueva aplicación recibida
3. **job_application_accepted** - Al aplicante: fue aceptado
4. **job_application_rejected** - Al aplicante: fue rechazado
5. **job_application_interview** - Invitación a entrevista

### Sistema
1. **daily_digest** - Resumen diario
2. **weekly_summary** - Resumen semanal
3. **account_activity** - Actividad de cuenta
4. **security_alert** - Alerta de seguridad

---

## 🚀 Edge Function: `send-notification`

### Endpoint
```
POST https://YOUR_PROJECT.supabase.co/functions/v1/send-notification
```

### Request Body
```typescript
{
  type: 'appointment_confirmation',
  recipient_user_id: 'uuid-del-usuario',
  recipient_email: 'user@example.com',
  recipient_phone: '+573001234567',
  recipient_whatsapp: '+573001234567',
  recipient_name: 'Juan Pérez',
  business_id: 'uuid-del-negocio',
  appointment_id: 'uuid-de-la-cita',
  data: {
    name: 'Juan Pérez',
    date: '15/10/2025',
    time: '10:00 AM',
    location: 'Calle 123',
    service: 'Corte de Cabello'
  },
  force_channels: ['email', 'whatsapp'], // Opcional
  skip_preferences: false // Opcional, para verificaciones
}
```

### Response
```typescript
{
  success: true,
  type: 'appointment_confirmation',
  channels_attempted: 2,
  channels_succeeded: 2,
  results: [
    {
      channel: 'whatsapp',
      sent: true,
      externalId: 'wamid.xxx',
      error: null
    },
    {
      channel: 'email',
      sent: true,
      externalId: 'email-id-xxx',
      error: null
    }
  ]
}
```

### Lógica de Canales

1. **Si `force_channels` está presente:** Usa solo esos canales
2. **Si `skip_preferences` es true:** Usa el primer canal disponible (para verificaciones)
3. **Si hay `recipient_user_id`:** Consulta `user_notification_preferences`
4. **Si hay `business_id`:** Consulta `business_notification_settings`
5. **Default:** Solo email

### Fallback Automático
Si `use_fallback` está habilitado y falla el primer canal, intenta con el siguiente en la lista de prioridad.

---

## 🔧 Configuración de Servicios Externos

### Variables de Entorno Requeridas

#### AWS (Amazon SES para Email y Amazon SNS para SMS)
```bash
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_REGION=us-east-1  # O tu región preferida
SES_FROM_EMAIL=notificaciones@appointsync.com  # Debe estar verificado en SES
```

**Setup en AWS:**
1. **Amazon SES** (Simple Email Service):
   - Ir a AWS Console > Amazon SES
   - Verificar dominio o email en "Verified identities"
   - Si estás en sandbox, también verifica emails de destino
   - Solicitar salir de sandbox para envíos sin restricciones
   - Configurar DKIM y SPF para mejor deliverability

2. **Amazon SNS** (Simple Notification Service):
   - Ir a AWS Console > Amazon SNS
   - Habilitar SMS en "Text messaging (SMS)"
   - Configurar "Monthly spending limit" según tu presupuesto
   - Verificar que tu región soporta SMS (us-east-1, us-west-2, eu-west-1, etc.)

3. **IAM Permissions:**
   Crear usuario IAM con estas políticas:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "ses:SendEmail",
           "ses:SendRawEmail"
         ],
         "Resource": "*"
       },
       {
         "Effect": "Allow",
         "Action": [
           "sns:Publish"
         ],
         "Resource": "*"
       }
     ]
   }
   ```

#### WhatsApp Business API
```bash
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxx
WHATSAPP_PHONE_NUMBER_ID=123456789012345
```

**Setup:**
- Registrarse en Meta Business Suite
- Crear app de WhatsApp Business
- Obtener access token y phone number ID
- Configurar webhook para delivery status (opcional)

#### Supabase
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx
```

---

## 📱 Integración en el Código

### Ejemplo 1: Enviar confirmación de cita
```typescript
import { supabase } from '@/lib/supabase'

async function confirmAppointment(appointmentId: string) {
  // 1. Obtener datos de la cita
  const { data: appointment } = await supabase
    .from('appointments')
    .select('*, client:profiles(*)')
    .eq('id', appointmentId)
    .single()
  
  // 2. Enviar notificación
  const { data, error } = await supabase.functions.invoke('send-notification', {
    body: {
      type: 'appointment_confirmation',
      recipient_user_id: appointment.client_id,
      recipient_email: appointment.client.email,
      recipient_phone: appointment.client.phone,
      recipient_name: appointment.client.name,
      business_id: appointment.business_id,
      appointment_id: appointmentId,
      data: {
        name: appointment.client.name,
        date: new Date(appointment.start_time).toLocaleDateString('es-ES'),
        time: new Date(appointment.start_time).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        location: appointment.location || 'Por confirmar',
        service: appointment.title
      }
    }
  })
  
  return { success: !error, data, error }
}
```

### Ejemplo 2: Notificar al empleado de nueva cita
```typescript
async function notifyEmployeeNewAppointment(appointmentId: string) {
  const { data: appointment } = await supabase
    .from('appointments')
    .select('*, employee:profiles!user_id(*), client:profiles!client_id(*)')
    .eq('id', appointmentId)
    .single()
  
  await supabase.functions.invoke('send-notification', {
    body: {
      type: 'appointment_new_employee',
      recipient_user_id: appointment.user_id,
      recipient_email: appointment.employee.email,
      recipient_phone: appointment.employee.phone,
      recipient_name: appointment.employee.name,
      business_id: appointment.business_id,
      appointment_id: appointmentId,
      data: {
        employee_name: appointment.employee.name,
        client_name: appointment.client.name,
        date: new Date(appointment.start_time).toLocaleDateString('es-ES'),
        time: new Date(appointment.start_time).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        service: appointment.title
      }
    }
  })
}
```

### Ejemplo 3: Verificación de email
```typescript
async function sendEmailVerification(userId: string, email: string, name: string) {
  // Generar código
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  
  // Guardar código en DB (implementar tabla verification_codes)
  await supabase.from('verification_codes').insert({
    user_id: userId,
    code,
    type: 'email',
    expires_at: new Date(Date.now() + 15 * 60 * 1000) // 15 minutos
  })
  
  // Enviar notificación
  await supabase.functions.invoke('send-notification', {
    body: {
      type: 'email_verification',
      recipient_email: email,
      recipient_name: name,
      skip_preferences: true, // Ignorar preferencias
      force_channels: ['email'], // Solo email
      data: {
        name,
        code,
        link: `https://appointsync.com/verify-email?code=${code}`
      }
    }
  })
}
```

---

## 🎨 UI Components Pendientes

### 1. Componente de Configuración de Notificaciones
**Ubicación:** `src/components/settings/NotificationSettings.tsx`

**Features:**
- Toggle para habilitar/deshabilitar cada canal
- Configuración por tipo de notificación
- Horarios de no molestar
- Resúmenes diarios/semanales

### 2. Panel de Historial de Notificaciones
**Ubicación:** `src/components/admin/NotificationHistory.tsx`

**Features:**
- Lista de notificaciones enviadas
- Filtros por canal, estado, tipo
- Tasas de entrega y apertura
- Gráficos de estadísticas

### 3. Configuración de Negocio
**Ubicación:** `src/components/admin/BusinessNotificationSettings.tsx`

**Features:**
- Canales habilitados para el negocio
- Prioridad de canales
- Tiempos de recordatorios
- Configuración de contactos (email from, teléfonos)

---

## ⚙️ Cron Jobs Necesarios

### 1. Procesador de Recordatorios
```sql
SELECT cron.schedule(
  'process-appointment-reminders',
  '*/5 * * * *', -- Cada 5 minutos
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT.supabase.co/functions/v1/process-reminders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  ) AS request_id;
  $$
);
```

### 2. Resúmenes Diarios
```sql
SELECT cron.schedule(
  'send-daily-digests',
  '0 18 * * *', -- Todos los días a las 6pm
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT.supabase.co/functions/v1/send-daily-digest',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  ) AS request_id;
  $$
);
```

---

## 🔐 Seguridad y RLS

Todas las tablas tienen RLS habilitado:

- **business_notification_settings:** Solo owners y empleados pueden ver/modificar
- **user_notification_preferences:** Solo el usuario puede ver/modificar sus preferencias
- **notification_log:** Owners y empleados pueden ver logs de su negocio
- **job_vacancies:** Todos pueden ver vacantes abiertas, solo owners pueden crear/editar
- **job_applications:** Usuarios ven sus aplicaciones, owners ven aplicaciones a sus vacantes

---

## 📈 Próximos Pasos

1. ✅ Migración de base de datos ejecutada
2. ✅ Edge Function `send-notification` creada
3. ⏳ Crear Edge Function `process-reminders`
4. ⏳ Crear UI de configuración de notificaciones (usuario)
5. ⏳ Crear UI de configuración de notificaciones (negocio)
6. ⏳ Crear panel de historial de notificaciones
7. ⏳ Implementar sistema de vacantes completo (UI)
8. ⏳ Configurar cron jobs en Supabase
9. ⏳ Testing end-to-end de cada tipo de notificación
10. ⏳ Documentación de setup de servicios externos

---

## 🧪 Testing

### Test Manual de Email
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/send-notification \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "appointment_confirmation",
    "recipient_email": "test@example.com",
    "recipient_name": "Test User",
    "data": {
      "name": "Test User",
      "date": "15/10/2025",
      "time": "10:00 AM",
      "location": "Test Location",
      "service": "Test Service"
    },
    "force_channels": ["email"]
  }'
```

---

## 📞 Soporte

Para configurar los servicios externos:
- **Amazon SES:** https://docs.aws.amazon.com/ses/
- **Amazon SNS:** https://docs.aws.amazon.com/sns/
- **WhatsApp Business:** https://developers.facebook.com/docs/whatsapp

### Ventajas de usar AWS:
- ✅ **Escalabilidad:** Millones de emails/SMS por día
- ✅ **Confiabilidad:** 99.9% uptime SLA
- ✅ **Costo:** Pay-as-you-go, muy económico
  - SES: $0.10 por 1,000 emails
  - SNS SMS: $0.00645 por SMS en USA (varía por país)
- ✅ **Deliverability:** Alto rate de entrega con DKIM/SPF
- ✅ **Integración:** Mismo proveedor para múltiples servicios

---

**Fecha de creación:** 12 de octubre de 2025
**Versión:** 1.0.0
**Autor:** AppointSync Pro Team
