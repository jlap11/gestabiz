// Supabase Edge Function: Send Email Reminders
// Deploy with: supabase functions deploy send-email-reminder

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { notificationId, appointmentId } = await req.json()

    // Get the notification and appointment details
    const { data: notification, error: notificationError } = await supabaseClient
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .single()

    if (notificationError) {
      throw new Error(`Failed to fetch notification: ${notificationError.message}`)
    }

    const { data: appointment, error: appointmentError } = await supabaseClient
      .from('appointments')
      .select(`
        *,
        users!inner(email, full_name, timezone)
      `)
      .eq('id', appointmentId)
      .single()

    if (appointmentError) {
      throw new Error(`Failed to fetch appointment: ${appointmentError.message}`)
    }

    // Format appointment time for the user's timezone
    const appointmentDate = new Date(appointment.start_time)
    const formattedDate = appointmentDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    const formattedTime = appointmentDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    })

    // Prepare email content
    const emailSubject = `Recordatorio: ${appointment.title}`
    const emailBody = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">📅 Recordatorio de Cita</h1>
            </div>
            
            <div style="background: white; padding: 30px; border: 1px solid #e1e5e9; border-radius: 0 0 10px 10px;">
              <h2 style="color: #667eea; margin-top: 0;">Detalles de su cita:</h2>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0;"><strong>Título:</strong> ${appointment.title}</p>
                <p style="margin: 0 0 10px 0;"><strong>Fecha:</strong> ${formattedDate}</p>
                <p style="margin: 0 0 10px 0;"><strong>Hora:</strong> ${formattedTime}</p>
                ${appointment.location ? `<p style="margin: 0 0 10px 0;"><strong>Ubicación:</strong> ${appointment.location}</p>` : ''}
                ${appointment.description ? `<p style="margin: 0 0 10px 0;"><strong>Descripción:</strong> ${appointment.description}</p>` : ''}
              </div>

              ${appointment.notes ? `
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; color: #856404;"><strong>Notas:</strong> ${appointment.notes}</p>
                </div>
              ` : ''}

              <div style="margin: 30px 0; text-align: center;">
                <p style="margin: 0; color: #6c757d;">
                  Este es un recordatorio automático enviado por Gestabiz.
                </p>
              </div>

              <div style="border-top: 1px solid #e1e5e9; padding-top: 20px; margin-top: 30px; text-align: center; color: #6c757d; font-size: 12px;">
                <p>Gestabiz - Sistema de Gestión de Citas</p>
                <p>Si tienes alguna pregunta, contacta directamente con tu proveedor de servicios.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    // Send email using Resend (you can also use SendGrid, Mailgun, etc.)
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured')
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Gestabiz <noreply@your-domain.com>',
        to: [appointment.users.email],
        subject: emailSubject,
        html: emailBody,
      }),
    })

    if (!emailResponse.ok) {
      const emailError = await emailResponse.text()
      throw new Error(`Failed to send email: ${emailError}`)
    }

    const emailResult = await emailResponse.json()

    // Update notification status
    const { error: updateError } = await supabaseClient
      .from('notifications')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', notificationId)

    if (updateError) {
      console.error('Failed to update notification status:', updateError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailId: emailResult.id,
        message: 'Email reminder sent successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error sending email reminder:', error)

    // Update notification status to failed if we have the notificationId
    if (req.method === 'POST') {
      try {
        const { notificationId } = await req.clone().json()
        if (notificationId) {
          const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
          )
          
          await supabaseClient
            .from('notifications')
            .update({
              status: 'failed',
              error_message: error.message,
            })
            .eq('id', notificationId)
        }
      } catch (updateError) {
        console.error('Failed to update notification status:', updateError)
      }
    }

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