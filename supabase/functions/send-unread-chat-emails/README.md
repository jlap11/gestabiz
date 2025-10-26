# Edge Function: send-unread-chat-emails

## 📋 Descripción

Edge Function que envía emails a **clientes** (no admins ni empleados) que tienen mensajes de chat sin leer después de **15 minutos**.

## 🎯 Objetivo

Notificar proactivamente a los clientes sobre mensajes pendientes para mejorar la comunicación y evitar que pierdan oportunidades de negocio.

## 🔄 Funcionamiento

### 1. Búsqueda de Mensajes No Leídos

```sql
SELECT * FROM in_app_notifications
WHERE type = 'chat_message'
  AND status = 'unread'
  AND created_at < NOW() - INTERVAL '15 minutes'
```

### 2. Filtrado de Clientes

Para cada usuario con mensajes no leídos:

- ✅ **SÍ notificar**: Si es cliente (no tiene negocios ni es empleado)
- ❌ **NO notificar**: Si es admin (owner de algún negocio)
- ❌ **NO notificar**: Si es empleado (vinculado a algún negocio)
- ❌ **NO notificar**: Si tiene preferencia explícita de NO recibir emails de chat

### 3. Agrupación y Envío

- Agrupa mensajes por conversación
- Muestra preview del último mensaje de cada conversación
- Cuenta total de mensajes no leídos
- Envía un solo email con todas las conversaciones

### 4. Registro y Prevención de Duplicados

- Marca notificaciones con `metadata.email_reminder_sent = true`
- Evita enviar emails duplicados por la misma notificación

## 📧 Ejemplo de Email

```
💬 Nuevos Mensajes
Tienes 3 mensajes sin leer

Hola Juan,

Has recibido mensajes que aún no has leído en las últimas horas:

┌─────────────────────────────────────────┐
│ 👤 José Luis Avila                      │
│ 2 mensajes nuevos                       │
│                                          │
│ "Hola, ¿ya viste mi propuesta?"        │
│ 15 oct, 17:30                           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 👤 María González                       │
│ 1 mensaje nuevo                         │
│                                          │
│ "¿Confirmamos la cita de mañana?"      │
│ 15 oct, 18:45                           │
└─────────────────────────────────────────┘

[Ver Mensajes Completos] → Link al chat
```

## 🔧 Configuración

### Variables de Entorno

```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
APP_URL=https://appointsync.app (o https://localhost:5173 para dev)
```

### Despliegue

```bash
npx supabase functions deploy send-unread-chat-emails --no-verify-jwt
```

### Configurar Cron Job

En el Dashboard de Supabase:

1. Ir a **Edge Functions** → `send-unread-chat-emails`
2. Pestaña **Settings**
3. Activar **Cron Schedule**
4. Configurar: `*/15 * * * *` (cada 15 minutos)
5. Guardar

Expresión cron:
```
*/15 * * * *
│   │ │ │ │
│   │ │ │ └─── día de la semana (0-6, 0=domingo)
│   │ │ └───── mes (1-12)
│   │ └─────── día del mes (1-31)
│   └───────── hora (0-23)
└─────────────── minuto (0-59)
```

## 🧪 Testing Manual

### Opción 1: Invocar desde CLI

```bash
npx supabase functions invoke send-unread-chat-emails --no-verify-jwt
```

### Opción 2: Invocar desde código

```typescript
const { data, error } = await supabase.functions.invoke('send-unread-chat-emails')

console.log('Resultado:', data)
// {
//   success: true,
//   emails_sent: 2,
//   total_clients: 2,
//   results: [...]
// }
```

### Opción 3: cURL

```bash
curl -X POST \
  'https://dkancockzvcqorqbwtyh.supabase.co/functions/v1/send-unread-chat-emails' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

## 📊 Respuesta de la Función

### Éxito (200)

```json
{
  "success": true,
  "message": "Sent 2 emails",
  "emails_sent": 2,
  "total_clients": 2,
  "results": [
    {
      "email": "juan@example.com",
      "success": true,
      "unread_count": 3
    },
    {
      "email": "maria@example.com",
      "success": true,
      "unread_count": 1
    }
  ]
}
```

### Sin Mensajes Pendientes (200)

```json
{
  "success": true,
  "message": "No unread messages found",
  "emails_sent": 0
}
```

### Error (500)

```json
{
  "error": "Error message details"
}
```

## 🔍 Logs

La función genera logs detallados:

```
[send-unread-chat-emails] 🔍 Buscando mensajes no leídos mayores a 15 minutos...
[send-unread-chat-emails] 📊 Found 5 unread notifications
[send-unread-chat-emails] 👥 Agrupados en 2 usuarios
[send-unread-chat-emails] ✅ Usuario Juan Pérez es CLIENTE
[send-unread-chat-emails] ⏭️ Usuario Admin User es admin/employee, omitiendo
[send-unread-chat-emails] 📧 Enviando emails a 1 clientes...
[send-unread-chat-emails] ✅ Email enviado a juan@example.com
[send-unread-chat-emails] 🎉 Completado: 1/1 emails enviados
```

## 🔐 Seguridad

- ✅ Usa `SUPABASE_SERVICE_ROLE_KEY` para acceso completo
- ✅ Respeta preferencias de notificación del usuario
- ✅ Solo notifica a clientes (filtra admins/employees)
- ✅ Previene duplicados con metadata tracking
- ✅ Rate limit automático (cada 15 minutos vía cron)

## 📈 Métricas

Para monitorear el sistema:

```sql
-- Cuántos emails de recordatorio se han enviado hoy
SELECT COUNT(*) as emails_sent_today
FROM in_app_notifications
WHERE type = 'chat_message'
  AND metadata->>'email_reminder_sent' = 'true'
  AND DATE(metadata->>'email_sent_at') = CURRENT_DATE;

-- Promedio de tiempo entre mensaje y email enviado
SELECT AVG(
  EXTRACT(EPOCH FROM (metadata->>'email_sent_at')::timestamp - created_at) / 60
) as avg_minutes_to_email
FROM in_app_notifications
WHERE type = 'chat_message'
  AND metadata->>'email_reminder_sent' = 'true'
  AND created_at > NOW() - INTERVAL '7 days';

-- Clientes que más emails de recordatorio reciben
SELECT 
  p.full_name,
  p.email,
  COUNT(*) as reminder_count
FROM in_app_notifications n
JOIN profiles p ON p.id = n.user_id
WHERE n.type = 'chat_message'
  AND n.metadata->>'email_reminder_sent' = 'true'
  AND n.created_at > NOW() - INTERVAL '30 days'
GROUP BY p.id, p.full_name, p.email
ORDER BY reminder_count DESC
LIMIT 10;
```

## 🐛 Troubleshooting

### Email no se envía

1. Verificar que `send-notification` function esté desplegada
2. Verificar variables de entorno (AWS SES configurado)
3. Revisar logs de la función en Supabase Dashboard

### Cliente no recibe email siendo cliente

1. Verificar que no sea owner de ningún negocio
2. Verificar que no esté en `business_employees`
3. Verificar preferencias en `user_notification_preferences`

### Emails duplicados

1. Verificar que cron job NO esté configurado < 15 minutos
2. Verificar que metadata.email_reminder_sent se esté guardando

## 🔗 Enlaces

- [Documentación Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Documentación Supabase Cron Jobs](https://supabase.com/docs/guides/functions/schedule-functions)
- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)

## 📝 Changelog

- **2025-10-16**: Creación inicial
  - Envío automático de emails a clientes con mensajes no leídos > 15 min
  - Filtrado por rol (solo clientes)
  - Respeto de preferencias de notificación
  - Preview de mensajes en email
  - Prevención de duplicados con metadata
