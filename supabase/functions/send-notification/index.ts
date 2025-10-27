import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { initSentry, captureEdgeFunctionError, flushSentry } from '../_shared/sentry.ts'
import { sendBrevoEmail, createBasicEmailTemplate } from '../_shared/brevo.ts'

// Initialize Sentry
initSentry('send-notification')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRequest {
  type: 'appointment_reminder' | 'appointment_confirmation' | 'appointment_cancellation' | 
        'appointment_location_update' |
        'appointment_new_client' | 'appointment_new_employee' | 'appointment_new_business' |
        'email_verification' | 'phone_verification_sms' | 'phone_verification_whatsapp' |
        'employee_request_new' | 'employee_request_accepted' | 'employee_request_rejected' |
        'job_vacancy_new' | 'job_application_new' | 'job_application_accepted' | 
        'job_application_rejected' | 'job_application_interview'
  
  recipient_user_id?: string
  recipient_email?: string
  recipient_phone?: string
  recipient_whatsapp?: string
  recipient_name?: string
  
  business_id?: string
  appointment_id?: string
  
  data: any // Datos específicos del tipo de notificación
  
  force_channels?: ('email' | 'sms' | 'whatsapp' | 'in_app')[] // Forzar canales específicos
  skip_preferences?: boolean // Ignorar preferencias del usuario (para verificaciones)
  
  // Campos específicos para notificaciones in-app
  action_url?: string // URL de navegación al hacer clic
  priority?: number // -1: low, 0: normal, 1: high, 2: urgent
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const request: NotificationRequest = await req.json()
    
    // Determinar canales a usar
    const channels = await determineChannels(supabase, request)
    
    // Preparar contenido de la notificación
    const content = await prepareNotificationContent(request)
    
    // Enviar por cada canal
    const results = []
    
    for (const channel of channels) {
      try {
        let sent = false
        let externalId = null
        let errorMsg = null

        switch (channel) {
          case 'email': {
            const emailResult = await sendEmail(request, content)
            sent = emailResult.success
            externalId = ('messageId' in emailResult) ? emailResult.messageId : null
            errorMsg = emailResult.error || null
            break
          }
            
          case 'sms': {
            const smsResult = await sendSMS(request, content)
            sent = smsResult.success
            externalId = smsResult.id
            errorMsg = smsResult.error
            break
          }
            
          case 'whatsapp': {
            const waResult = await sendWhatsApp(request, content)
            sent = waResult.success
            externalId = waResult.id
            errorMsg = waResult.error
            break
          }
            
          case 'in_app': {
            const inAppResult = await sendInAppNotification(supabase, request, content)
            sent = inAppResult.success
            externalId = inAppResult.id
            errorMsg = inAppResult.error
            break
          }
        }

        // Registrar en notification_log
        await supabase.from('notification_log').insert({
          business_id: request.business_id,
          appointment_id: request.appointment_id,
          user_id: request.recipient_user_id,
          notification_type: request.type,
          channel: channel,
          recipient_name: request.recipient_name,
          recipient_contact: getRecipientContact(request, channel),
          subject: content.subject,
          message: content.message,
          status: sent ? 'sent' : 'failed',
          sent_at: sent ? new Date().toISOString() : null,
          external_id: externalId,
          error_message: errorMsg,
          metadata: request.data
        })

        results.push({
          channel,
          sent,
          externalId,
          error: errorMsg
        })

        // Si se envió exitosamente y no requiere fallback, salir
        if (sent && !request.force_channels) {
          break
        }
      } catch (error) {
        console.error(`Error sending via ${channel}:`, error)
        results.push({
          channel,
          sent: false,
          error: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: results.some(r => r.sent),
        type: request.type,
        channels_attempted: results.length,
        channels_succeeded: results.filter(r => r.sent).length,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error in send-notification:', error)
    
    // Capture error to Sentry
    captureEdgeFunctionError(error as Error, {
      functionName: 'send-notification',
      operation: 'main',
      extra: { requestBody: await req.clone().text() }
    })
    
    await flushSentry()
    
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

// ============================================================================
// Funciones auxiliares
// ============================================================================

type NotificationChannel = 'email' | 'sms' | 'whatsapp' | 'in_app'

async function determineChannels(
  supabase: any,
  request: NotificationRequest
): Promise<NotificationChannel[]> {
  
  // Si se fuerzan canales específicos
  if (request.force_channels && request.force_channels.length > 0) {
    return request.force_channels
  }

  // Si se ignoran preferencias (ej: verificaciones)
  if (request.skip_preferences) {
    // Determinar qué canal usar basado en qué contacto está disponible
    const channels: NotificationChannel[] = []
    if (request.recipient_email) channels.push('email')
    if (request.recipient_whatsapp) channels.push('whatsapp')
    if (request.recipient_phone) channels.push('sms')
    return channels.slice(0, 1) // Solo uno para verificaciones
  }

  // Obtener preferencias del usuario
  if (request.recipient_user_id) {
    const { data: userPrefs } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', request.recipient_user_id)
      .single()

    if (userPrefs && userPrefs.notification_preferences) {
      const typePrefs = userPrefs.notification_preferences[request.type]
      
      if (typePrefs) {
        const channels: NotificationChannel[] = []
        // Siempre agregar in_app primero si está habilitado
        if (userPrefs.in_app_enabled !== false) channels.push('in_app')
        if (typePrefs.email && userPrefs.email_enabled) channels.push('email')
        if (typePrefs.whatsapp && userPrefs.whatsapp_enabled) channels.push('whatsapp')
        if (typePrefs.sms && userPrefs.sms_enabled) channels.push('sms')
        
        if (channels.length > 0) return channels
      }
    }
  }

  // Obtener configuración del negocio si aplica
  if (request.business_id) {
    const { data: bizSettings } = await supabase
      .from('business_notification_settings')
      .select('*')
      .eq('business_id', request.business_id)
      .single()

    if (bizSettings && bizSettings.channel_priority) {
      const channels: ('email' | 'sms' | 'whatsapp')[] = []
      for (const channel of bizSettings.channel_priority) {
        if (
          (channel === 'email' && bizSettings.email_enabled) ||
          (channel === 'sms' && bizSettings.sms_enabled) ||
          (channel === 'whatsapp' && bizSettings.whatsapp_enabled)
        ) {
          channels.push(channel)
        }
      }
      
      if (channels.length > 0) return channels
    }
  }

  // Default: email
  return ['email']
}

async function prepareNotificationContent(request: NotificationRequest) {
  const templates = {
    appointment_confirmation: {
      subject: '✅ Cita Confirmada',
      message: `Hola {{name}},\n\nTu cita ha sido confirmada:\n\n📅 Fecha: {{date}}\n🕐 Hora: {{time}}\n📍 Lugar: {{location}}\n📝 Servicio: {{service}}\n\n¡Te esperamos!`
    },
    appointment_reminder: {
      subject: '🔔 Recordatorio de Cita',
      message: `Hola {{name}},\n\nTe recordamos que tienes una cita:\n\n📅 Fecha: {{date}}\n🕐 Hora: {{time}}\n📍 Lugar: {{location}}\n📝 Servicio: {{service}}\n\n¡Nos vemos pronto!`
    },
    appointment_cancellation: {
      subject: '❌ Cita Cancelada',
      message: `Hola {{name}},\n\nTu cita del {{date}} a las {{time}} ha sido cancelada.\n\nSi deseas reprogramar, contáctanos.`
    },
    appointment_location_update: {
      subject: '📍 Cambio de ubicación de tu cita',
      message: `Hola {{name}},\n\nLa sede de tu cita ha cambiado.\n\n📅 Fecha: {{date}}\n🕐 Hora: {{time}}\n📍 Nueva dirección: {{new_address}}\n\nSi necesitas ajustar tu cita, contáctanos.`
    },
    appointment_new_client: {
      subject: '✅ Cita Agendada Exitosamente',
      message: `Hola {{client_name}},\n\n¡Tu cita ha sido agendada exitosamente!\n\n📅 Fecha: {{date}}\n🕐 Hora: {{time}}\n📍 Lugar: {{location}}\n📝 Servicio: {{service}}\n👨‍💼 Profesional: {{employee_name}}\n\n¡Te esperamos!`
    },
    appointment_new_employee: {
      subject: '📅 Nueva Cita Asignada',
      message: `Hola {{employee_name}},\n\nSe te ha asignado una nueva cita:\n\n👤 Cliente: {{client_name}}\n📅 Fecha: {{date}}\n🕐 Hora: {{time}}\n📝 Servicio: {{service}}`
    },
    appointment_new_business: {
      subject: '🎉 Nueva Cita Agendada',
      message: `Nueva cita registrada:\n\n👤 Cliente: {{client_name}}\n👨‍💼 Empleado: {{employee_name}}\n📅 Fecha: {{date}}\n🕐 Hora: {{time}}\n📝 Servicio: {{service}}`
    },
    employee_request_new: {
      subject: '👔 Nueva Solicitud de Empleado',
      message: `{{user_name}} desea unirse a tu equipo en {{business_name}}.\n\nRevisa su perfil y responde a la solicitud.`
    },
    employee_request_accepted: {
      subject: '🎉 ¡Solicitud Aceptada!',
      message: `¡Felicidades {{name}}!\n\nTu solicitud para unirte a {{business_name}} ha sido aceptada.\n\nYa puedes comenzar a gestionar citas.`
    },
    employee_request_rejected: {
      subject: 'Actualización de Solicitud',
      message: `Hola {{name}},\n\nLamentamos informarte que tu solicitud para {{business_name}} no fue aceptada en esta ocasión.`
    },
    job_application_new: {
      subject: '📋 Nueva Aplicación a Vacante',
      message: `{{user_name}} ha aplicado a la vacante: {{vacancy_title}}\n\nRevisa su perfil y experiencia.`
    },
    job_application_accepted: {
      subject: '🎉 ¡Aplicación Aceptada!',
      message: `¡Felicidades {{name}}!\n\nTu aplicación para {{vacancy_title}} en {{business_name}} ha sido aceptada.\n\nNos pondremos en contacto pronto.`
    },
    job_application_interview: {
      subject: '📞 Invitación a Entrevista',
      message: `Hola {{name}},\n\n¡Nos gustó tu perfil!\n\nTe invitamos a una entrevista para {{vacancy_title}}.\n\nFecha: {{date}}\nHora: {{time}}`
    },
    email_verification: {
      subject: '✉️ Verifica tu Email',
      message: `Hola {{name}},\n\nPor favor verifica tu email usando este código:\n\n{{code}}\n\nO haz clic en: {{link}}`
    },
    phone_verification_sms: {
      subject: 'Código de Verificación',
      message: `Tu código de verificación es: {{code}}`
    },
    phone_verification_whatsapp: {
      subject: 'Verificación de WhatsApp',
      message: `Hola {{name}}, tu código de verificación es: {{code}}`
    }
  }

  const template = templates[request.type] || {
    subject: 'Notificación',
    message: JSON.stringify(request.data)
  }

  // Reemplazar variables
  let subject = template.subject
  let message = template.message

  for (const [key, value] of Object.entries(request.data || {})) {
    const placeholder = `{{${key}}}`
    subject = subject.replace(new RegExp(placeholder, 'g'), value)
    message = message.replace(new RegExp(placeholder, 'g'), value)
  }

  return { subject, message }
}

// Helper para cargar template HTML personalizado
async function loadHTMLTemplate(templateName: string, data: any): Promise<string | null> {
  try {
    // En producción, cargar desde Supabase Storage o archivo local
    const templatePath = `../templates/${templateName}.html`
    
    // Por ahora retornamos null para usar template básico
    // TODO: Implementar carga de template desde storage
    return null
  } catch (error) {
    console.error(`Error loading template ${templateName}:`, error)
    return null
  }
}

// Helper para renderizar template HTML con datos
function renderHTMLTemplate(template: string, data: any): string {
  let rendered = template
  
  // Reemplazar variables {{variable}}
  for (const [key, value] of Object.entries(data)) {
    const placeholder = new RegExp(`{{${key}}}`, 'g')
    rendered = rendered.replace(placeholder, String(value || ''))
  }
  
  // Manejar condicionales {{#if variable}}...{{/if}}
  rendered = rendered.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, variable, content) => {
    return data[variable] ? content : ''
  })
  
  return rendered
}

function getRecipientContact(request: NotificationRequest, channel: string): string {
  switch (channel) {
    case 'email': return request.recipient_email || ''
    case 'sms': return request.recipient_phone || ''
    case 'whatsapp': return request.recipient_whatsapp || request.recipient_phone || ''
    default: return ''
  }
}

async function sendEmail(request: NotificationRequest, content: any) {
  if (!request.recipient_email) {
    return { success: false, error: 'Recipient email missing' }
  }

  try {
    let htmlBody = ''
    
    // Usar template HTML personalizado para job_application_new
    if (request.type === 'job_application_new' || request.type === 'job_application_accepted' || request.type === 'job_application_interview') {
      // Intentar cargar template HTML personalizado
      const templateName = request.type === 'job_application_new' ? 'job-application' : request.type
      const customTemplate = await loadHTMLTemplate(templateName, request.data)
      
      if (customTemplate) {
        htmlBody = renderHTMLTemplate(customTemplate, request.data)
      } else {
        // Fallback al template básico desde brevo.ts
        htmlBody = createBasicEmailTemplate(
          content.subject,
          content.message
        )
      }
    } else {
      // Template básico para otros tipos
      htmlBody = createBasicEmailTemplate(
        content.subject,
        content.message
      )
    }
    
    // Enviar email usando Brevo
    const result = await sendBrevoEmail({
      to: request.recipient_email,
      subject: content.subject,
      htmlBody: htmlBody,
      textBody: content.message,
      fromEmail: 'no-reply@gestabiz.com',
      fromName: 'Gestabiz'
    })
    
    return result
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Helper para enviar email con AWS SES usando fetch (sin SDK)
async function sendSESEmail(params: any, accessKeyId: string, secretAccessKey: string, region: string) {
  try {
    // Preparar el body como query string para SES
    const formData = new URLSearchParams({
      'Action': 'SendEmail',
      'Source': params.Source,
      'Destination.ToAddresses.member.1': params.Destination.ToAddresses[0],
      'Message.Subject.Data': params.Message.Subject.Data,
      'Message.Subject.Charset': 'UTF-8',
      'Message.Body.Text.Data': params.Message.Body.Text.Data,
      'Message.Body.Text.Charset': 'UTF-8',
      'Message.Body.Html.Data': params.Message.Body.Html.Data,
      'Message.Body.Html.Charset': 'UTF-8'
    })

    // AWS Signature V4
    const host = `email.${region}.amazonaws.com`
    const endpoint = `https://${host}/`
    const method = 'POST'
    const service = 'ses'
    
    const now = new Date()
    const dateStamp = now.toISOString().split('T')[0].replace(/-/g, '')
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
    
    // Crear signature
    const canonicalUri = '/'
    const canonicalQuerystring = ''
    const canonicalHeaders = `content-type:application/x-www-form-urlencoded\nhost:${host}\nx-amz-date:${amzDate}\n`
    const signedHeaders = 'content-type;host;x-amz-date'
    const payloadHash = await sha256(formData.toString())
    const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQuerystring}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`
    
    const algorithm = 'AWS4-HMAC-SHA256'
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
    const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${await sha256(canonicalRequest)}`
    
    const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service)
    const signature = await hmacSha256(signingKey, stringToSign)
    
    const authorizationHeader = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Amz-Date': amzDate,
        'Authorization': authorizationHeader
      },
      body: formData.toString()
    })

    const responseText = await response.text()
    
    if (response.ok) {
      // Extraer MessageId del XML response
      const messageIdMatch = responseText.match(/<MessageId>([^<]+)<\/MessageId>/)
      const messageId = messageIdMatch ? messageIdMatch[1] : 'unknown'
      return { success: true, id: messageId }
    } else {
      return { success: false, error: responseText }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Funciones auxiliares para AWS Signature V4
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

async function hmacSha256(key: ArrayBuffer | Uint8Array, message: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message))
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

async function getSignatureKey(key: string, dateStamp: string, regionName: string, serviceName: string): Promise<Uint8Array> {
  const kDate = await hmacSha256Raw(new TextEncoder().encode('AWS4' + key), dateStamp)
  const kRegion = await hmacSha256Raw(kDate, regionName)
  const kService = await hmacSha256Raw(kRegion, serviceName)
  const kSigning = await hmacSha256Raw(kService, 'aws4_request')
  return kSigning
}

async function hmacSha256Raw(key: Uint8Array | ArrayBuffer, message: string): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message))
  return new Uint8Array(signature)
}

async function sendSMS(request: NotificationRequest, content: any) {
  const awsAccessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID')
  const awsSecretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY')
  const awsRegion = Deno.env.get('AWS_REGION') || 'us-east-1'
  
  if (!awsAccessKeyId || !awsSecretAccessKey || !request.recipient_phone) {
    return { success: false, error: 'SMS not configured or recipient missing' }
  }

  try {
    // Preparar mensaje para Amazon SNS
    const message = `${content.subject}\n\n${content.message}`
    
    const params = {
      Message: message,
      PhoneNumber: request.recipient_phone,
      MessageAttributes: {
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Transactional' // Transactional = alta prioridad
        }
      }
    }

    // Usar Amazon SNS para enviar SMS
    const response = await sendSNSMessage(params, awsAccessKeyId, awsSecretAccessKey, awsRegion)
    
    return response
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

// Helper para enviar SMS con Amazon SNS
async function sendSNSMessage(params: any, accessKeyId: string, secretAccessKey: string, region: string) {
  try {
    const host = `sns.${region}.amazonaws.com`
    const endpoint = `https://${host}/`
    const method = 'POST'
    const service = 'sns'
    
    const now = new Date()
    const dateStamp = now.toISOString().split('T')[0].replace(/-/g, '')
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
    
    // Preparar el body
    const bodyParams = new URLSearchParams({
      'Action': 'Publish',
      'Message': params.Message,
      'PhoneNumber': params.PhoneNumber,
      'MessageAttributes.entry.1.Name': 'AWS.SNS.SMS.SMSType',
      'MessageAttributes.entry.1.Value.DataType': 'String',
      'MessageAttributes.entry.1.Value.StringValue': 'Transactional'
    })
    
    const payloadHash = await sha256(bodyParams.toString())
    
    // Crear canonical request
    const canonicalUri = '/'
    const canonicalQuerystring = ''
    const canonicalHeaders = `content-type:application/x-www-form-urlencoded\nhost:${host}\nx-amz-date:${amzDate}\n`
    const signedHeaders = 'content-type;host;x-amz-date'
    const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQuerystring}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`
    
    // Crear string to sign
    const algorithm = 'AWS4-HMAC-SHA256'
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
    const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${await sha256(canonicalRequest)}`
    
    // Calcular signature
    const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service)
    const signature = await hmacSha256(signingKey, stringToSign)
    
    const authorizationHeader = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Amz-Date': amzDate,
        'Authorization': authorizationHeader
      },
      body: bodyParams.toString()
    })

    const responseText = await response.text()
    
    if (response.ok) {
      // Extraer MessageId del XML response
      const messageIdMatch = responseText.match(/<MessageId>([^<]+)<\/MessageId>/)
      const messageId = messageIdMatch ? messageIdMatch[1] : 'unknown'
      return { success: true, id: messageId }
    } else {
      return { success: false, error: responseText }
    }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

async function sendWhatsApp(request: NotificationRequest, content: any) {
  const whatsappToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN')
  const whatsappPhoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')
  
  const recipient = request.recipient_whatsapp || request.recipient_phone
  
  if (!whatsappToken || !whatsappPhoneNumberId || !recipient) {
    return { success: false, error: 'WhatsApp not configured or recipient missing' }
  }

  try {
    const cleanedPhone = recipient.replace(/[^\d+]/g, '')
    
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${whatsappPhoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${whatsappToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanedPhone,
          type: 'text',
          text: {
            body: `*${content.subject}*\n\n${content.message}`
          }
        })
      }
    )

    const data = await response.json()
    
    if (response.ok) {
      return { success: true, id: data.messages?.[0]?.id }
    } else {
      return { success: false, error: data.error?.message || 'Failed to send WhatsApp' }
    }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

async function sendInAppNotification(
  supabase: any,
  request: NotificationRequest,
  content: any
) {
  if (!request.recipient_user_id) {
    return { success: false, error: 'Recipient user_id required for in-app notifications' }
  }

  try {
    // Usar directamente el tipo del request (ya está alineado con notification_type_enum)
    // No necesitamos mapeo porque el tipo ya es correcto desde el origen
    const inAppType = request.type

    // Preparar data JSONB (incluir appointment_id si existe)
    const notificationData = {
      ...request.data,
      ...(request.appointment_id && { appointment_id: request.appointment_id })
    }

    // Llamar a la función SQL helper para crear la notificación
    const { data, error } = await supabase.rpc('create_in_app_notification', {
      p_user_id: request.recipient_user_id,
      p_type: inAppType,
      p_title: content.subject,
      p_body: content.message, // ✅ CORREGIDO: Era p_message, ahora es p_body
      p_data: notificationData,
      p_business_id: request.business_id || null,
      p_priority: request.priority ?? 0,
      p_action_url: request.action_url || null
    })

    if (error) {
      console.error('Error creating in-app notification:', error)
      return { success: false, error: error.message }
    }

    return { success: true, id: data }
  } catch (error) {
    console.error('Exception in sendInAppNotification:', error)
    return { success: false, error: (error as Error).message }
  }
}
