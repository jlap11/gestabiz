# Configuración de Brevo para Envío de Emails

## Cambio de AWS SES a Brevo

A partir de octubre 2025, toda la aplicación utiliza **Brevo (Sendinblue)** como proveedor de emails transaccionales.

### Razones del cambio:
- ✅ Plan gratuito generoso: 300 emails/día
- ✅ API más simple y confiable en Edge Functions
- ✅ Sin configuración compleja de AWS
- ✅ Dashboard amigable para monitorear envíos
- ✅ Sin necesidad de verificar dominios (uso inmediato)

---

## Configuración de Secrets en Supabase

Para configurar Brevo en Supabase, ejecuta los siguientes comandos en PowerShell:

```powershell
# Configurar Brevo API Key (REQUERIDO)
npx supabase secrets set BREVO_API_KEY=your-brevo-api-key

# Configurar SMTP (opcional, fallback si API falla)
npx supabase secrets set BREVO_SMTP_HOST=smtp-relay.brevo.com
npx supabase secrets set BREVO_SMTP_PORT=587
npx supabase secrets set BREVO_SMTP_USER=no-reply@gestabiz.com
npx supabase secrets set BREVO_SMTP_PASSWORD=xsmtpsib-YOUR_SMTP_PASSWORD_HERE

# Configurar email de soporte
npx supabase secrets set SUPPORT_EMAIL=soporte@gestabiz.com
```

---

## Obtener API Key de Brevo

1. Crea una cuenta en [Brevo](https://www.brevo.com/)
2. Ve a **Settings → SMTP & API**
3. Crea una nueva API Key con permisos de "Send emails"
4. Copia la API Key (empieza con `xkeysib-...`)
5. Configúrala en Supabase con el comando anterior

---

## Archivos Modificados

### 1. Utilidad Compartida
**Archivo**: `supabase/functions/_shared/brevo.ts`

Nuevo módulo con funciones:
- `sendBrevoEmail()`: Envía emails usando API de Brevo
- `createBasicEmailTemplate()`: Template HTML base para Gestabiz
- `isValidEmail()`: Validador de emails

### 2. Edge Functions Actualizadas
- ✅ `send-notification/index.ts`: Función principal de notificaciones
- ✅ `send-bug-report-email/index.ts`: Reportes de bugs

Todas las demás funciones que envían emails lo hacen a través de `send-notification`, por lo que **NO requieren cambios adicionales**.

---

## Uso en Código

### Enviar Email Básico
```typescript
import { sendBrevoEmail } from '../_shared/brevo.ts'

const result = await sendBrevoEmail({
  to: 'usuario@example.com',
  subject: 'Bienvenido a Gestabiz',
  htmlBody: '<h1>Hola!</h1><p>Gracias por registrarte.</p>',
  textBody: 'Hola! Gracias por registrarte.'
})

if (result.success) {
  console.log('Email enviado:', result.messageId)
} else {
  console.error('Error:', result.error)
}
```

### Usar Template Básico
```typescript
import { sendBrevoEmail, createBasicEmailTemplate } from '../_shared/brevo.ts'

const htmlBody = createBasicEmailTemplate(
  'Confirmación de Cita',
  'Tu cita ha sido confirmada para el 25 de octubre a las 3:00 PM.',
  'Ver Detalles',
  'https://gestabiz.com/citas/123'
)

await sendBrevoEmail({
  to: 'cliente@example.com',
  subject: 'Cita Confirmada',
  htmlBody: htmlBody
})
```

---

## Despliegue

Después de configurar los secrets, **despliega las Edge Functions** que fueron modificadas:

```powershell
# Desplegar send-notification (función principal)
npx supabase functions deploy send-notification

# Desplegar send-bug-report-email
npx supabase functions deploy send-bug-report-email
```

---

## Migración de Variables (Limpiar AWS)

Si previamente tenías configuradas variables de AWS SES, puedes eliminarlas (opcional):

```powershell
npx supabase secrets unset AWS_ACCESS_KEY_ID
npx supabase secrets unset AWS_SECRET_ACCESS_KEY
npx supabase secrets unset AWS_REGION
npx supabase secrets unset SES_FROM_EMAIL
```

---

## Límites del Plan Gratuito de Brevo

| Característica | Límite |
|---------------|--------|
| Emails/día | 300 |
| Emails/mes | 9,000 |
| Lista de contactos | Ilimitada |
| Templates | Ilimitados |
| API calls | Ilimitadas |

**Nota**: Para más de 300 emails/día, considera actualizar a un plan de pago ($25/mes por 20,000 emails).

---

## Monitoreo

Puedes monitorear el envío de emails en:
- **Brevo Dashboard**: https://app.brevo.com/statistics/email
- **Logs de Edge Functions**: Supabase Dashboard → Edge Functions → Logs

---

## Troubleshooting

### Error: "BREVO_API_KEY not configured"
**Solución**: Asegúrate de haber configurado el secret en Supabase:
```powershell
npx supabase secrets set BREVO_API_KEY=your-api-key
```

### Error: "Brevo API error: 401"
**Solución**: Tu API Key es inválida o ha expirado. Genera una nueva en Brevo Dashboard.

### Error: "Brevo API error: 403"
**Solución**: Tu API Key no tiene permisos para enviar emails. Ve a Brevo Dashboard → Settings → API Keys y asegúrate de que tenga el permiso "Send emails".

### Error: "Daily limit exceeded"
**Solución**: Has alcanzado el límite de 300 emails/día. Espera hasta mañana o actualiza a un plan de pago.

---

## Contacto

Para cualquier duda sobre la configuración de Brevo, contacta al equipo de TI-Turing:
- Email: soporte@gestabiz.com
- GitHub: https://github.com/TI-Turing/appointsync-pro

---

*Última actualización: 22 de octubre de 2025*
