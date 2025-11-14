import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailData {
  to: string
  subject: string
  html: string
  text?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Process pending notifications
    const { data: pendingNotifications, error: fetchError } = await supabaseClient
      .from('notification_queue')
      .select(`
        *,
        appointments (
          title,
          start_datetime,
          location,
          location_id,
          locations!appointments_location_id_fkey (name, address, city),
          clients (name, email)
        ),
        users (email, name)
      `)
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())

    if (fetchError) {
      throw new Error(`Failed to fetch notifications: ${fetchError.message}`)
    }

    const results = []

    for (const notification of pendingNotifications || []) {
      try {
        let emailSent = false

        if (notification.method === 'email') {
          const emailData = await generateEmailContent(notification)
          emailSent = await sendEmail(emailData)
        }

        // Update notification status
        const updateData = emailSent 
          ? { status: 'sent', sent_at: new Date().toISOString() }
          : { 
              status: 'failed', 
              attempts: notification.attempts + 1,
              error_message: 'Failed to send email'
            }

        await supabaseClient
          .from('notification_queue')
          .update(updateData)
          .eq('id', notification.id)

        results.push({
          id: notification.id,
          status: emailSent ? 'sent' : 'failed',
          type: notification.type
        })

      } catch (error) {
        console.error(`Error processing notification ${notification.id}:`, error)
        
        await supabaseClient
          .from('notification_queue')
          .update({
            status: 'failed',
            attempts: notification.attempts + 1,
            error_message: error.message
          })
          .eq('id', notification.id)

        results.push({
          id: notification.id,
          status: 'failed',
          error: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        results 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in send-notifications function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

async function generateEmailContent(notification: any): Promise<EmailData> {
  const appointment = notification.appointments
  const user = notification.users
  const client = appointment.clients
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const supabase = (supabaseUrl && supabaseServiceKey) ? createClient(supabaseUrl, supabaseServiceKey) : null
  
  const appointmentDate = new Date(appointment.start_datetime)
  const formattedDate = appointmentDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const formattedTime = appointmentDate.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  })

  // Resolver ubicación/dirección y ciudad
  const isUUID = (s?: string) => !!s && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(s).trim())
  const resolveCityName = async (cityOrUuid?: string): Promise<string | undefined> => {
    const candidate = (cityOrUuid || '').trim()
    if (!candidate) return undefined
    if (!isUUID(candidate)) return candidate
    try {
      if (!supabase) return candidate
      const { data: cityRow } = await supabase
        .from('cities')
        .select('name')
        .eq('id', candidate)
        .single()
      return cityRow?.name || candidate
    } catch (_) {
      return candidate
    }
  }

  const locationRel = Array.isArray(appointment.locations) ? appointment.locations[0] : appointment.locations
  let locationName: string | undefined = locationRel?.name || appointment.location
  let address: string | undefined = locationRel?.address
  let city: string | undefined = locationRel?.city

  // Si address contiene UUID como ciudad, separarlo
  if (address && /,\s*[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(address)) {
    const match = address.match(/^(.*?),\s*([0-9a-f-]{36})$/i)
    if (match) {
      address = match[1]
      city = city || match[2]
    }
  }
  city = await resolveCityName(city)
  const addressLine = address ? `${address}${city ? `, ${city}` : ''}` : undefined

  switch (notification.type) {
    case 'reminder':
      return {
        to: user.email,
        subject: `🔔 Recordatorio: ${appointment.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3B82F6;">Recordatorio de Cita</h2>
            <div style="background-color: #F8FAFC; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0; color: #1E293B;">${appointment.title}</h3>
              <p style="margin: 10px 0; color: #64748B;">
                <strong>Cliente:</strong> ${client.name}<br>
                <strong>Fecha:</strong> ${formattedDate}<br>
                <strong>Hora:</strong> ${formattedTime}
                ${locationName ? `<br><strong>Ubicación:</strong> ${locationName}` : ''}
                ${addressLine ? `<br><strong>Dirección:</strong> ${addressLine}` : ''}
              </p>
            </div>
            <p style="color: #64748B; font-size: 14px;">
              Este es un recordatorio automático de tu sistema Gestabiz.
            </p>
          </div>
        `,
        text: `Recordatorio: ${appointment.title} con ${client.name} el ${formattedDate} a las ${formattedTime}${locationName ? ` - Ubicación: ${locationName}` : ''}${addressLine ? ` - Dirección: ${addressLine}` : ''}`
      }

    case 'confirmation':
      return {
        to: client.email || user.email,
        subject: `✅ Cita Confirmada: ${appointment.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10B981;">Cita Confirmada</h2>
            <div style="background-color: #F0FDF4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
              <h3 style="margin: 0; color: #1E293B;">${appointment.title}</h3>
              <p style="margin: 10px 0; color: #64748B;">
                <strong>Cliente:</strong> ${client.name}<br>
                <strong>Fecha:</strong> ${formattedDate}<br>
                <strong>Hora:</strong> ${formattedTime}
                ${locationName ? `<br><strong>Ubicación:</strong> ${locationName}` : ''}
                ${addressLine ? `<br><strong>Dirección:</strong> ${addressLine}` : ''}
              </p>
            </div>
            <p style="color: #64748B; font-size: 14px;">
              Tu cita ha sido confirmada exitosamente.
            </p>
          </div>
        `,
        text: `Cita confirmada: ${appointment.title} con ${client.name} el ${formattedDate} a las ${formattedTime}${locationName ? ` - Ubicación: ${locationName}` : ''}${addressLine ? ` - Dirección: ${addressLine}` : ''}`
      }

    case 'cancellation':
      return {
        to: client.email || user.email,
        subject: `❌ Cita Cancelada: ${appointment.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #EF4444;">Cita Cancelada</h2>
            <div style="background-color: #FEF2F2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #EF4444;">
              <h3 style="margin: 0; color: #1E293B;">${appointment.title}</h3>
              <p style="margin: 10px 0; color: #64748B;">
                <strong>Cliente:</strong> ${client.name}<br>
                <strong>Fecha:</strong> ${formattedDate}<br>
                <strong>Hora:</strong> ${formattedTime}
              </p>
            </div>
            <p style="color: #64748B; font-size: 14px;">
              Esta cita ha sido cancelada. Si necesitas reagendar, por favor contacta con nosotros.
            </p>
          </div>
        `,
        text: `Cita cancelada: ${appointment.title} con ${client.name} el ${formattedDate} a las ${formattedTime}`
      }

    default:
      throw new Error(`Unknown notification type: ${notification.type}`)
  }
}

async function sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    // Using Supabase's built-in email service or integrate with SendGrid/Resend
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured')
      return false
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Gestabiz <noreply@Gestabiz.com>',
        to: [emailData.to],
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Email sending failed:', errorText)
      return false
    }

    const result = await response.json()
    console.log('Email sent successfully:', result.id)
    return true

  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}
