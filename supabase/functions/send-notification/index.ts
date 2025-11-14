import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// Sentry deshabilitado temporalmente para evitar fallos en carga del worker
import { sendBrevoEmail, createBasicEmailTemplate } from '../_shared/brevo.ts'
import { initSentry, captureEdgeFunctionError, captureEdgeFunctionMessage, flushSentry } from '../_shared/sentry.ts'

// Initialize Sentry (se activa solo si existe SENTRY_DSN)
initSentry('send-notification')

// Dominios permitidos para CORS (producción); localhost es dinámico
const allowedOrigins = [
  'https://gestabiz.com',
  'https://www.gestabiz.com'
]

function isLocalOrigin(origin: string) {
  try {
    const u = new URL(origin)
    return (
      u.hostname === 'localhost' ||
      u.hostname === '127.0.0.1'
    )
  } catch {
    return false
  }
}

function getCorsHeaders(origin: string | null, accessControlRequestHeaders?: string | null) {
  let allowedOrigin = allowedOrigins[0]
  if (origin) {
    if (isLocalOrigin(origin)) {
      // Permitir cualquier puerto en localhost/127.0.0.1 (Vite/Next/etc.)
      allowedOrigin = origin
    } else if (allowedOrigins.includes(origin)) {
      allowedOrigin = origin
    }
  }

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': accessControlRequestHeaders || 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  }
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
  const requestId = crypto.randomUUID()
  const origin = req.headers.get('origin')
  const acrh = req.headers.get('Access-Control-Request-Headers')
  const corsHeaders = getCorsHeaders(origin, acrh)
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 [SEND-NOTIFICATION] Función iniciada')
    captureEdgeFunctionMessage('send-notification:start', 'info', { request_id: requestId })
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const request: NotificationRequest = await req.json()
    
    console.log('📨 [SEND-NOTIFICATION] Solicitud recibida:', {
      type: request.type,
      recipient_user_id: request.recipient_user_id,
      recipient_email: request.recipient_email,
      business_id: request.business_id,
      appointment_id: request.appointment_id,
      force_channels: request.force_channels,
      skip_preferences: request.skip_preferences,
      priority: request.priority,
      action_url: request.action_url,
      data: request.data
    })
    captureEdgeFunctionMessage('send-notification:request', 'info', {
      request_id: requestId,
      type: request.type,
      has_recipient_email: Boolean(request.recipient_email),
      has_recipient_user_id: Boolean(request.recipient_user_id),
      business_id: request.business_id || 'none',
      appointment_id: request.appointment_id || 'none'
    })
    
    // Determinar canales a usar
    console.log('🔍 [SEND-NOTIFICATION] Determinando canales...')
    const channels = await determineChannels(supabase, request)
    console.log('📡 [SEND-NOTIFICATION] Canales determinados:', channels)
    captureEdgeFunctionMessage('send-notification:channels', 'info', { request_id: requestId, channels: channels.join(',') })
    
    // Preparar contenido de la notificación
    console.log('📝 [SEND-NOTIFICATION] Preparando contenido...')
    const content = await prepareNotificationContent(request, supabase)
    console.log('📄 [SEND-NOTIFICATION] Contenido preparado:', {
      subject: content.subject,
      message: content.message,
      html: content.html ? 'HTML presente' : 'Sin HTML'
    })
    
    // Enriquecer destinatario: si falta email pero tenemos user_id, resolver desde profiles
    if (!request.recipient_email && request.recipient_user_id) {
      console.log('🧩 [SEND-NOTIFICATION] Resolviendo email desde profiles para user_id:', request.recipient_user_id)
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', request.recipient_user_id)
        .single()
      if (profile?.email) {
        request.recipient_email = profile.email
        if (!request.recipient_name && profile.full_name) {
          request.recipient_name = profile.full_name
        }
        console.log('✅ [SEND-NOTIFICATION] Email resuelto:', request.recipient_email)
      } else {
        console.warn('⚠️ [SEND-NOTIFICATION] No se pudo resolver email para user_id:', {
          recipient_user_id: request.recipient_user_id,
          profileErr
        })
      }
    }
    
    // Construir diagnósticos ligeros (sin exponer secretos)
    const diagnostics = {
      env: {
        hasBrevoApiKey: Boolean(Deno.env.get('BREVO_API_KEY')),
        fromEmail: Deno.env.get('FROM_EMAIL') || Deno.env.get('BREVO_SMTP_USER') || 'noreply@gestabiz.app'
      },
      recipient: {
        email: request.recipient_email || null,
        name: request.recipient_name || null
      },
      cors: {
        origin,
        allowedOrigin: corsHeaders['Access-Control-Allow-Origin'],
        requestedHeaders: acrh || null
      },
      channels_selected: channels
    }
    console.log('🧪 [SEND-NOTIFICATION] Diagnósticos:', diagnostics)
    captureEdgeFunctionMessage('send-notification:diagnostics', 'info', { request_id: requestId, hasBrevoApiKey: String(diagnostics.env.hasBrevoApiKey), fromEmail: diagnostics.env.fromEmail })

    // Enviar por cada canal
    console.log('📤 [SEND-NOTIFICATION] Iniciando envío por canales...')
    const results = []
    
    for (const channel of channels) {
      console.log(`🔄 [SEND-NOTIFICATION] Procesando canal: ${channel}`)
      try {
        let sent = false
        let externalId = null
        let errorMsg = null

        switch (channel) {
          case 'email': {
            console.log('📧 [EMAIL] Enviando email...')
            const emailResult = await sendEmail(request, content)
            console.log('📧 [EMAIL] Resultado:', emailResult)
            sent = emailResult.success
            externalId = ('messageId' in emailResult) ? emailResult.messageId : null
            errorMsg = emailResult.error || null
            break
          }
            
          case 'sms': {
            console.log('📱 [SMS] Enviando SMS...')
            const smsResult = await sendSMS(request, content)
            console.log('📱 [SMS] Resultado:', smsResult)
            sent = smsResult.success
            externalId = smsResult.id
            errorMsg = smsResult.error
            break
          }
            
          case 'whatsapp': {
            console.log('💬 [WHATSAPP] Enviando WhatsApp...')
            const waResult = await sendWhatsApp(request, content)
            console.log('💬 [WHATSAPP] Resultado:', waResult)
            sent = waResult.success
            externalId = waResult.id
            errorMsg = waResult.error
            break
          }
            
          case 'in_app': {
            console.log('🔔 [IN-APP] Enviando notificación in-app...')
            const inAppResult = await sendInAppNotification(supabase, request, content)
            console.log('🔔 [IN-APP] Resultado:', inAppResult)
            sent = inAppResult.success
            externalId = inAppResult.id
            errorMsg = inAppResult.error
            break
          }
        }

        console.log(`📊 [${channel.toUpperCase()}] Estado final:`, { sent, externalId, errorMsg })

        // Registrar en notification_log
        console.log('💾 [SEND-NOTIFICATION] Registrando en notification_log...')
        const logData = {
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
        }
        console.log('💾 [SEND-NOTIFICATION] Datos del log:', logData)
        
        const logResult = await supabase.from('notification_log').insert(logData)
        console.log('💾 [SEND-NOTIFICATION] Resultado del log:', logResult)

        results.push({
          channel,
          sent,
          externalId,
          error: errorMsg
        })

        // Si se envió exitosamente y no requiere fallback, salir
        if (sent && !request.force_channels) {
          console.log(`✅ [SEND-NOTIFICATION] Envío exitoso por ${channel}, terminando proceso`)
          break
        }
      } catch (error) {
        console.error(`❌ [SEND-NOTIFICATION] Error enviando por ${channel}:`, error)
        results.push({
          channel,
          sent: false,
          error: error.message
        })
      }
    }

    const responseBody = {
      success: results.some(r => r.sent),
      type: request.type,
      channels_attempted: results.length,
      channels_succeeded: results.filter(r => r.sent).length,
      results,
      diagnostics,
      trace_id: requestId
    }
    captureEdgeFunctionMessage('send-notification:response', responseBody.success ? 'info' : 'warning', { request_id: requestId, channels_succeeded: responseBody.channels_succeeded })
    await flushSentry()
    return new Response(
      JSON.stringify(responseBody),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error in send-notification:', error)
    captureEdgeFunctionError(error as Error, {
      functionName: 'send-notification',
      requestId,
      operation: 'serve'
    })
    
    // Sentry disabled: log request body for diagnostics only
    try {
      console.error('[send-notification] Request body snapshot:', await req.clone().text())
    } catch {}

    // Diagnósticos mínimos también en error
    const errorDiagnostics: any = {
      env: {
        hasBrevoApiKey: Boolean(Deno.env.get('BREVO_API_KEY')),
        fromEmail: Deno.env.get('FROM_EMAIL') || Deno.env.get('BREVO_SMTP_USER') || 'noreply@gestabiz.app'
      },
      cors: {
        origin,
        allowedOrigin: corsHeaders['Access-Control-Allow-Origin'],
        requestedHeaders: acrh || null
      },
      recipient: null
    }

    try {
      const bodyText = await req.clone().text()
      const parsed = JSON.parse(bodyText || '{}')
      errorDiagnostics.recipient = {
        email: parsed?.recipient_email || null,
        name: parsed?.recipient_name || null
      }
    } catch {}
    
    const errorBody = { error: (error as Error).message, diagnostics: errorDiagnostics, trace_id: requestId }
    await flushSentry()
    return new Response(
      JSON.stringify(errorBody),
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

async function prepareNotificationContent(request: NotificationRequest, supabase?: any) {
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

  // Intentar enriquecer variables desde appointment_details si hay appointment_id
  let appointment: any | null = null
  console.log('🔍 [DEBUG] Iniciando enriquecimiento de datos...')
  console.log('🔍 [DEBUG] appointment_id:', request.appointment_id)
  console.log('🔍 [DEBUG] request.data:', JSON.stringify(request.data, null, 2))
  
  try {
    if (request.appointment_id) {
      console.log('🔍 [DEBUG] Consultando appointment_details para ID:', request.appointment_id)
      
      // Crear cliente admin para consultar la vista
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )
      
      const { data: appt, error: apptError } = await supabaseAdmin
        .from('appointment_details')
        .select('id, client_name, employee_name, service_name, location_name, start_time')
        .eq('id', request.appointment_id)
        .single()
        
      if (apptError) {
        console.error('❌ [DEBUG] Error consultando appointment_details:', apptError)
      } else if (appt) {
        console.log('✅ [DEBUG] appointment_details encontrado:', JSON.stringify(appt, null, 2))
        appointment = appt
      } else {
        console.log('⚠️ [DEBUG] No se encontró appointment_details para ID:', request.appointment_id)
      }
    } else {
      console.log('⚠️ [DEBUG] No appointment_id proporcionado, saltando consulta appointment_details')
    }
  } catch (e) {
    console.warn('❌ [DEBUG] No se pudo cargar appointment_details:', e)
  }

  // Fallbacks inteligentes: si la vista no devolvió datos, resolver por IDs recibidos en request.data
  console.log('🔍 [DEBUG] Iniciando fallbacks por IDs...')
  try {
    const d = request.data || {}
    console.log('🔍 [DEBUG] Data disponible para fallbacks:', JSON.stringify(d, null, 2))

    // Crear cliente admin para los fallbacks
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Cliente
    if ((!appointment?.client_name || appointment?.client_name === '') && typeof d.client_id === 'string') {
      console.log('🔍 [DEBUG] Buscando client_name para ID:', d.client_id)
      const { data: clientRow, error: clientError } = await supabaseAdmin
        .from('profiles')
        .select('full_name')
        .eq('id', d.client_id)
        .single()
      console.log('🔍 [DEBUG] Resultado consulta cliente:', clientRow, 'Error:', clientError)
      if (clientRow?.full_name) {
        appointment = { ...(appointment || {}), client_name: clientRow.full_name }
        console.log('✅ [DEBUG] client_name enriquecido:', clientRow.full_name)
      }
    }

      // Empleado
      if ((!appointment?.employee_name || appointment?.employee_name === '') && typeof d.employee_id === 'string') {
        console.log('🔍 [DEBUG] Buscando employee_name para ID:', d.employee_id)
        const { data: empRow, error: empError } = await supabaseAdmin
          .from('profiles')
          .select('full_name')
          .eq('id', d.employee_id)
          .single()
        console.log('🔍 [DEBUG] Resultado consulta empleado:', empRow, 'Error:', empError)
        if (empRow?.full_name) {
          appointment = { ...(appointment || {}), employee_name: empRow.full_name }
          console.log('✅ [DEBUG] employee_name enriquecido:', empRow.full_name)
        }
      }

      // Servicio
      if ((!appointment?.service_name || appointment?.service_name === '') && typeof d.service_id === 'string') {
        console.log('🔍 [DEBUG] Buscando service_name para ID:', d.service_id)
        const { data: svcRow, error: svcError } = await supabaseAdmin
          .from('services')
          .select('name')
          .eq('id', d.service_id)
          .single()
        console.log('🔍 [DEBUG] Resultado consulta servicio:', svcRow, 'Error:', svcError)
        if (svcRow?.name) {
          appointment = { ...(appointment || {}), service_name: svcRow.name }
          console.log('✅ [DEBUG] service_name enriquecido:', svcRow.name)
        }
      }

      // Sede / ubicación: siempre intentar enriquecer dirección y ciudad si tenemos location_id
      if (typeof d.location_id === 'string') {
        console.log('🔍 [DEBUG] Buscando datos de ubicación para ID:', d.location_id)
        const { data: locRow, error: locError } = await supabaseAdmin
          .from('locations')
          .select('name, address, city')
          .eq('id', d.location_id)
          .single()
        console.log('🔍 [DEBUG] Resultado consulta ubicación:', locRow, 'Error:', locError)
        if (locRow?.name && (!appointment?.location_name || appointment?.location_name === '')) {
          appointment = { ...(appointment || {}), location_name: locRow.name }
          console.log('✅ [DEBUG] location_name enriquecido:', locRow.name)
        }
        if (locRow?.address) {
          appointment = { ...(appointment || {}), location_address: locRow.address }
          console.log('✅ [DEBUG] location_address enriquecido:', locRow.address)
        }
        if (locRow?.city) {
          // Puede venir como nombre o como UUID; si es UUID, resolver nombre desde cities
          const cityCandidate = String(locRow.city).trim()
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(cityCandidate)
          if (isUuid) {
            try {
              const { data: cityRow } = await supabaseAdmin
                .from('cities')
                .select('name')
                .eq('id', cityCandidate)
                .single()
              const cityName = cityRow?.name || cityCandidate
              appointment = { ...(appointment || {}), location_city: cityName }
              console.log('✅ [DEBUG] location_city (resuelta por UUID) enriquecido:', cityName)
            } catch (e) {
              appointment = { ...(appointment || {}), location_city: cityCandidate }
              console.log('⚠️ [DEBUG] No se pudo resolver ciudad por UUID, usando valor original:', cityCandidate)
            }
          } else {
            appointment = { ...(appointment || {}), location_city: cityCandidate }
            console.log('✅ [DEBUG] location_city enriquecido:', cityCandidate)
          }
        }
      }

      // Fecha/hora desde appointment_date en payload
      if ((!appointment?.start_time || appointment?.start_time === '') && typeof d.appointment_date === 'string') {
        // Guardamos ISO para usar formato más abajo
        appointment = { ...(appointment || {}), start_time: d.appointment_date }
      }
  } catch (e) {
    console.warn('[prepareNotificationContent] Fallbacks por IDs fallaron:', e)
  }

  // Formateadores de fecha/hora en español
  const formatDate = (iso?: string) => {
    if (!iso) return ''
    const d = new Date(iso)
    return d.toLocaleDateString('es-ES', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })
  }
  const formatTime = (iso?: string) => {
    if (!iso) return ''
    const d = new Date(iso)
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  }

  // Normalizar variables con alias y fallbacks
  console.log('🔍 [DEBUG] Datos disponibles para normalización:')
  console.log('🔍 [DEBUG] - request.data:', JSON.stringify(request.data, null, 2))
  console.log('🔍 [DEBUG] - appointment:', JSON.stringify(appointment, null, 2))
  
  const data = request.data || {}
  const vars: Record<string, string> = {}

  // Nombre genérico del destinatario
  vars['name'] = String(
    data.name ?? request.recipient_name ?? ''
  )

  // Cliente
  vars['client_name'] = String(
    data.client_name ?? appointment?.client_name ?? request.recipient_name ?? ''
  )

  // Empleado/profesional
  vars['employee_name'] = String(
    data.employee_name ?? appointment?.employee_name ?? ''
  )

  // Servicio
  vars['service'] = String(
    data.service ?? data.service_name ?? appointment?.service_name ?? ''
  )

  // Ubicación
  vars['location'] = String(
    data.location ?? data.location_name ?? appointment?.location_name ?? ''
  )
  // Dirección de la sede (si está disponible)
  if (typeof data.new_address === 'string' && data.new_address) {
    vars['new_address'] = data.new_address
  }
  vars['address'] = String(
    (typeof data.address === 'string' ? data.address : '') ||
    (typeof data.location_address === 'string' ? data.location_address : '') ||
    (typeof (appointment && appointment.location_address) === 'string' ? appointment.location_address : '') ||
    ''
  )
  // Ciudad de la sede (si está disponible)
  vars['city'] = String(
    (typeof data.city === 'string' ? data.city : '') ||
    (typeof (appointment && (appointment as any).location_city) === 'string' ? (appointment as any).location_city : '') ||
    ''
  )
  
  console.log('🔍 [DEBUG] Variables normalizadas iniciales:', JSON.stringify(vars, null, 2))

  // Si la ciudad aún parece un UUID, resolverla con la tabla cities para mostrar nombre
  try {
    const cityCandidate = (vars['city'] || '').trim()
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(cityCandidate)
    if (isUuid) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )
      const { data: cityRow } = await supabaseAdmin
        .from('cities')
        .select('name')
        .eq('id', cityCandidate)
        .single()
      if (cityRow?.name) {
        vars['city'] = cityRow.name
        console.log('✅ [DEBUG] city resuelta por UUID:', cityRow.name)
      }
    }
  } catch (e) {
    console.log('⚠️ [DEBUG] Falló resolución de city por UUID, se mantiene valor original')
  }

  // Fecha y hora
  const startIso = appointment?.start_time as string | undefined
  // Si tenemos ISO, formateamos siempre a humano; si solo viene en data, intentamos formatear
  const isoFromData = typeof data.appointment_date === 'string' ? data.appointment_date : undefined
  const isoCandidate = startIso || isoFromData
  vars['date'] = (data.date && String(data.date)) || (isoCandidate ? formatDate(isoCandidate) : '')
  vars['time'] = (data.time && String(data.time)) || (isoCandidate ? formatTime(isoCandidate) : '')

  // Otros campos comunes (por si las plantillas los usan)
  if (typeof data.business_name === 'string') vars['business_name'] = data.business_name
  if (typeof data.new_address === 'string') vars['new_address'] = data.new_address
  if (typeof data.user_name === 'string') vars['user_name'] = data.user_name

  console.log('🔍 [DEBUG] Variables finales antes del reemplazo:', JSON.stringify(vars, null, 2))
  console.log('🔍 [DEBUG] Subject template:', template.subject)
  console.log('🔍 [DEBUG] Message template:', template.message)
  
  // Reemplazar variables en subject y message
  let subject = template.subject
  let message = template.message

  // Primero con datos originales
  for (const [key, value] of Object.entries(data)) {
    const placeholder = `{{${key}}}`
    subject = subject.replace(new RegExp(placeholder, 'g'), String(value ?? ''))
    message = message.replace(new RegExp(placeholder, 'g'), String(value ?? ''))
  }

  // Luego asegurar los alias/fallbacks
  for (const [key, value] of Object.entries(vars)) {
    const placeholder = `{{${key}}}`
    subject = subject.replace(new RegExp(placeholder, 'g'), value)
    message = message.replace(new RegExp(placeholder, 'g'), value)
  }
  
  console.log('🔍 [DEBUG] Subject procesado:', subject)
  console.log('🔍 [DEBUG] Message procesado:', message)

  // Añadir dirección de la sede al correo del cliente si existe
  try {
    if (request.type === 'appointment_new_client') {
      const address = (vars['address'] || '').trim()
      const city = (vars['city'] || '').trim()
      if (address) {
        const locationText = `📍 Lugar: ${vars['location'] || ''}`
        const addressText = `📍 Dirección: ${address}${city ? `, ${city}` : ''}`
        if (message.includes(locationText) && !message.includes(addressText)) {
          message = message.replace(locationText, `${locationText}\n${addressText}`)
        } else if (!message.includes(addressText)) {
          message = `${message}\n${addressText}`
        }
      }
    }
  } catch (_) {
    // No bloquear envío por errores menores de formato
  }

  // Saneado final: si aún faltan campos críticos para ciertos tipos, añadimos avisos
  const criticalByType: Record<string, string[]> = {
    appointment_new_employee: ['client_name', 'date', 'time', 'service'],
    appointment_new_client: ['date', 'time', 'location', 'service'],
    appointment_confirmation: ['date', 'time', 'location', 'service'],
    appointment_reminder: ['date', 'time'],
  }
  const crit = criticalByType[request.type] || []
  const missing = crit.filter(k => (vars[k] || '').trim() === '')
  if (missing.length > 0) {
    console.warn('[prepareNotificationContent] Campos faltantes en plantilla:', { type: request.type, missing })
    // Ajustar a un mensaje genérico para evitar enviar email “vacío”
    const genericMap: Record<string, string> = {
      appointment_new_employee: 'Se te ha asignado una nueva cita. Revisa la app para ver detalles completos.',
      appointment_new_client: 'Tu cita fue registrada correctamente. Revisa la app para ver detalles completos.',
      appointment_confirmation: 'Tu cita ha sido confirmada. Revisa la app para ver detalles completos.',
      appointment_reminder: 'Tienes una cita próxima. Revisa la app para ver detalles completos.',
    }
    const generic = genericMap[request.type] || 'Tienes una notificación. Revisa la app para más detalles.'
    message = generic
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
  console.log('📧 [SEND-EMAIL] Iniciando función sendEmail')
  console.log('📧 [SEND-EMAIL] Request:', {
    type: request.type,
    recipient_email: request.recipient_email,
    recipient_name: request.recipient_name
  })
  console.log('📧 [SEND-EMAIL] Content:', {
    subject: content.subject,
    message: content.message?.substring(0, 100) + '...'
  })

  if (!request.recipient_email) {
    console.error('❌ [SEND-EMAIL] Email del destinatario faltante')
    return { success: false, error: 'Recipient email missing' }
  }

  try {
    let htmlBody = ''
    
    console.log('🎨 [SEND-EMAIL] Preparando template HTML...')
    
    // Usar template HTML personalizado para job_application_new
    if (request.type === 'job_application_new' || request.type === 'job_application_accepted' || request.type === 'job_application_interview') {
      console.log('🎨 [SEND-EMAIL] Usando template personalizado para:', request.type)
      // Intentar cargar template HTML personalizado
      const templateName = request.type === 'job_application_new' ? 'job-application' : request.type
      const customTemplate = await loadHTMLTemplate(templateName, request.data)
      
      if (customTemplate) {
        console.log('✅ [SEND-EMAIL] Template personalizado cargado')
        htmlBody = renderHTMLTemplate(customTemplate, request.data)
      } else {
        console.log('⚠️ [SEND-EMAIL] Template personalizado no encontrado, usando básico')
        // Fallback al template básico desde brevo.ts
        htmlBody = createBasicEmailTemplate(
          content.subject,
          content.message
        )
      }
    } else {
      console.log('🎨 [SEND-EMAIL] Usando template básico para:', request.type)
      // Template básico para otros tipos
      htmlBody = createBasicEmailTemplate(
        content.subject,
        content.message
      )
    }
    
    console.log('📄 [SEND-EMAIL] HTML Body preparado, longitud:', htmlBody.length)

    // Validación extra: si el mensaje quedó demasiado genérico o vacío, evitar enviar basura
    const isEmptyContent = !content.message || content.message.trim().length < 10
    if (isEmptyContent) {
      console.warn('⚠️ [SEND-EMAIL] Contenido insuficiente. Se ajustará a mensaje seguro.')
      content.subject = content.subject || 'Notificación'
      content.message = 'Tienes una nueva notificación en Gestabiz. Abre la app para ver los detalles.'
      htmlBody = createBasicEmailTemplate(content.subject, content.message)
    }
    
    // Enviar email usando Brevo
    console.log('🚀 [SEND-EMAIL] Enviando email con Brevo...')
    const emailParams = {
      to: request.recipient_email,
      subject: content.subject,
      htmlBody: htmlBody,
      textBody: content.message,
      fromEmail: Deno.env.get('FROM_EMAIL') || Deno.env.get('BREVO_SMTP_USER') || 'noreply@gestabiz.app',
      fromName: 'Gestabiz'
    }
    console.log('📨 [SEND-EMAIL] Parámetros de Brevo:', {
      to: emailParams.to,
      subject: emailParams.subject,
      fromEmail: emailParams.fromEmail,
      fromName: emailParams.fromName,
      htmlBodyLength: emailParams.htmlBody.length,
      textBodyLength: emailParams.textBody.length
    })
    
    const result = await sendBrevoEmail(emailParams)
    
    console.log('📧 [SEND-EMAIL] Resultado de Brevo:', result)
    
    if (result.success) {
      console.log('✅ [SEND-EMAIL] Email enviado exitosamente')
    } else {
      console.error('❌ [SEND-EMAIL] Error enviando email:', result.error)
    }
    
    return result
  } catch (error) {
    console.error('❌ [SEND-EMAIL] Excepción en sendEmail:', error)
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
