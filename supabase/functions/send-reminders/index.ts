import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get current time
    const now = new Date()
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)

    // Find notifications that need to be sent
    const { data: notifications, error: fetchError } = await supabaseClient
      .from('notifications')
      .select(
        `
        *,
        appointment:appointments(
          *,
          service:services(name),
          client:profiles!appointments_client_id_fkey(full_name, email),
          business:businesses(name)
        )
      `
      )
      .lte('scheduled_for', oneHourFromNow.toISOString())
      .eq('sent_via_email', false)
      .not('appointment_id', 'is', null)

    if (fetchError) {
      throw fetchError
    }

    console.log(`Found ${notifications?.length || 0} notifications to process`)

    let processedCount = 0
    let errorCount = 0

    // Process each notification
    for (const notification of notifications || []) {
      try {
        const appointment = notification.appointment
        if (!appointment || !appointment.client) {
          console.log(
            `Skipping notification ${notification.id} - missing appointment or client data`
          )
          continue
        }

        // Send email notification using a mail service
        const emailSent = await sendEmailNotification({
          to: appointment.client.email,
          subject: notification.title,
          message: notification.message,
          appointmentDetails: {
            serviceName: appointment.service?.name || 'Servicio',
            businessName: appointment.business?.name || 'Negocio',
            startTime: appointment.start_time,
            endTime: appointment.end_time,
          },
        })

        if (emailSent) {
          // Mark notification as sent
          await supabaseClient
            .from('notifications')
            .update({
              sent_via_email: true,
              metadata: { sent_at: new Date().toISOString() },
            })
            .eq('id', notification.id)

          processedCount++
          console.log(`Sent notification ${notification.id} to ${appointment.client.email}`)
        } else {
          errorCount++
          console.log(`Failed to send notification ${notification.id}`)
        }
      } catch (error) {
        errorCount++
        console.error(`Error processing notification ${notification.id}:`, error)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedCount,
        errors: errorCount,
        total: notifications?.length || 0,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in send-reminders function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

async function sendEmailNotification(params: {
  to: string
  subject: string
  message: string
  appointmentDetails: {
    serviceName: string
    businessName: string
    startTime: string
    endTime: string
  }
}): Promise<boolean> {
  try {
    // Format dates
    const startDate = new Date(params.appointmentDetails.startTime)
    const endDate = new Date(params.appointmentDetails.endTime)

    const dateStr = startDate.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    const timeStr = startDate.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    })

    // Create email HTML
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6366f1; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .appointment-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .btn { display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Gestabiz</h1>
            <p>Recordatorio de Cita</p>
          </div>
          
          <div class="content">
            <h2>${params.subject}</h2>
            <p>${params.message}</p>
            
            <div class="appointment-card">
              <h3>Detalles de tu cita:</h3>
              <p><strong>Servicio:</strong> ${params.appointmentDetails.serviceName}</p>
              <p><strong>Negocio:</strong> ${params.appointmentDetails.businessName}</p>
              <p><strong>Fecha:</strong> ${dateStr}</p>
              <p><strong>Hora:</strong> ${timeStr}</p>
            </div>
            
            <p>¡Te esperamos!</p>
          </div>
          
          <div class="footer">
            <p>Este es un recordatorio automático de Gestabiz</p>
            <p>Si necesitas cancelar o reprogramar tu cita, ponte en contacto con el negocio.</p>
          </div>
        </div>
      </body>
      </html>
    `

    // Use Resend (popular email service) or configure your preferred email service
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

    if (RESEND_API_KEY) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Gestabiz <noreply@Gestabiz.com>',
          to: [params.to],
          subject: params.subject,
          html: htmlContent,
        }),
      })

      if (response.ok) {
        console.log(`Email sent successfully to ${params.to}`)
        return true
      } else {
        const errorData = await response.text()
        console.error(`Failed to send email to ${params.to}:`, errorData)
        return false
      }
    } else {
      // Fallback: Log email content (for development)
      console.log(`EMAIL TO: ${params.to}`)
      console.log(`SUBJECT: ${params.subject}`)
      console.log(`CONTENT: ${params.message}`)
      console.log('Email service not configured, email logged instead')
      return true // Return true for development
    }
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}
