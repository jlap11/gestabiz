import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  subject: string
  message: string
  template?: 'reminder' | 'confirmation' | 'cancellation' | 'follow_up'
  appointmentData?: any
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, message, template, appointmentData }: EmailRequest = await req.json()

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Email service configuration (using Resend as example)
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (!resendApiKey) {
      throw new Error('Email service not configured')
    }

    // Build email content based on template
    let emailContent = message
    let emailSubject = subject

    if (template && appointmentData) {
      switch (template) {
        case 'reminder':
          emailSubject = `Recordatorio: ${appointmentData.title}`
          emailContent = `
            Hola ${appointmentData.client_name},
            
            Te recordamos que tienes una cita programada:
            
            📅 Fecha: ${new Date(appointmentData.start_time).toLocaleDateString('es-ES')}
            🕐 Hora: ${new Date(appointmentData.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            📍 Lugar: ${appointmentData.location || 'Por confirmar'}
            📝 Servicio: ${appointmentData.title}
            
            ${appointmentData.notes ? `Notas: ${appointmentData.notes}` : ''}
            
            ¡Te esperamos!
          `
          break
        case 'confirmation':
          emailSubject = `Cita Confirmada: ${appointmentData.title}`
          emailContent = `
            Hola ${appointmentData.client_name},
            
            Tu cita ha sido confirmada:
            
            📅 Fecha: ${new Date(appointmentData.start_time).toLocaleDateString('es-ES')}
            🕐 Hora: ${new Date(appointmentData.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            📍 Lugar: ${appointmentData.location || 'Por confirmar'}
            📝 Servicio: ${appointmentData.title}
            
            Si necesitas cancelar o reprogramar, por favor contáctanos lo antes posible.
          `
          break
        case 'cancellation':
          emailSubject = `Cita Cancelada: ${appointmentData.title}`
          emailContent = `
            Hola ${appointmentData.client_name},
            
            Lamentamos informarte que tu cita ha sido cancelada:
            
            📅 Fecha: ${new Date(appointmentData.start_time).toLocaleDateString('es-ES')}
            🕐 Hora: ${new Date(appointmentData.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            📝 Servicio: ${appointmentData.title}
            
            ${appointmentData.cancelled_reason ? `Motivo: ${appointmentData.cancelled_reason}` : ''}
            
            Puedes agendar una nueva cita cuando gustes.
          `
          break
        case 'follow_up':
          emailSubject = `Nos gustaría verte de nuevo`
          emailContent = `
            Hola ${appointmentData.client_name},
            
            Ha pasado un tiempo desde tu última visita. Nos gustaría saber de ti y ofrecerte nuestros servicios nuevamente.
            
            ¿Te gustaría agendar una nueva cita?
            
            ¡Esperamos verte pronto!
          `
          break
      }
    }

    // Send email using Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'AppointmentPro <no-reply@appointmentpro.com>',
        to: [to],
        subject: emailSubject,
        html: emailContent.replace(/\n/g, '<br>'),
        text: emailContent,
      }),
    })

    if (!emailResponse.ok) {
      const error = await emailResponse.text()
      throw new Error(`Failed to send email: ${error}`)
    }

    const emailResult = await emailResponse.json()

    // Log the email sending in database (optional)
    try {
      await supabase
        .from('email_logs')
        .insert({
          recipient: to,
          subject: emailSubject,
          template_used: template,
          status: 'sent',
          external_id: emailResult.id,
          sent_at: new Date().toISOString()
        })
    } catch (logError) {
      console.warn('Failed to log email:', logError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        id: emailResult.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})