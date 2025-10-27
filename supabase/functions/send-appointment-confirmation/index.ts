import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { appointment_id } = await req.json()

    if (!appointment_id) {
      return new Response(
        JSON.stringify({ error: 'appointment_id is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get appointment with business and client information
    const { data: appointment, error: appointmentError } = await supabaseClient
      .from('appointments')
      .select(`
        *,
        businesses!inner(name, email, phone),
        profiles!appointments_client_id_fkey(full_name, email)
      `)
      .eq('id', appointment_id)
      .eq('status', 'pending')
      .single()

    if (appointmentError || !appointment) {
      return new Response(
        JSON.stringify({ error: 'Appointment not found or not pending' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get business confirmation policy
    const { data: policy } = await supabaseClient
      .from('business_confirmation_policies')
      .select('*')
      .eq('business_id', appointment.business_id)
      .single()

    // Use default policy if none exists
    const confirmationPolicy = policy || {
      confirmation_method: 'email',
      email_enabled: true,
      email_hours_before: 24,
      email_template_subject: 'Confirma tu cita - {{business_name}}',
      email_template_body: 'Hola {{client_name}}, tienes una cita programada para {{appointment_date}} a las {{appointment_time}}. Por favor confirma tu asistencia.'
    }

    // Check if email confirmation is enabled
    if (!confirmationPolicy.email_enabled) {
      return new Response(
        JSON.stringify({ error: 'Email confirmation is disabled for this business' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Generate confirmation token if not exists
    let confirmationToken = appointment.confirmation_token
    if (!confirmationToken) {
      const { data: updatedAppointment, error: updateError } = await supabaseClient
        .rpc('set_appointment_confirmation_deadline', { appointment_id })

      if (updateError) {
        throw new Error(`Failed to set confirmation deadline: ${updateError.message}`)
      }

      // Get the updated appointment with token
      const { data: refreshedAppointment } = await supabaseClient
        .from('appointments')
        .select('confirmation_token')
        .eq('id', appointment_id)
        .single()

      confirmationToken = refreshedAppointment?.confirmation_token
    }

    if (!confirmationToken) {
      throw new Error('Failed to generate confirmation token')
    }

    // Format appointment date and time
    const appointmentDate = new Date(appointment.start_time)
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

    // Get client email (from profile or appointment)
    const clientEmail = appointment.profiles?.email || appointment.client_email
    const clientName = appointment.profiles?.full_name || appointment.client_name || 'Cliente'

    if (!clientEmail) {
      return new Response(
        JSON.stringify({ error: 'Client email not found' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Send confirmation email
    const emailSent = await sendConfirmationEmail({
      to: clientEmail,
      clientName,
      businessName: appointment.businesses.name,
      appointment,
      appointmentDate: formattedDate,
      appointmentTime: formattedTime,
      confirmationToken,
      policy: confirmationPolicy
    })

    if (emailSent) {
      // Update confirmation_sent_at timestamp
      await supabaseClient
        .from('appointments')
        .update({ confirmation_sent_at: new Date().toISOString() })
        .eq('id', appointment_id)
    }

    return new Response(
      JSON.stringify({ 
        success: emailSent,
        message: emailSent ? 'Confirmation email sent successfully' : 'Failed to send confirmation email'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function sendConfirmationEmail({
  to,
  clientName,
  businessName,
  appointment,
  appointmentDate,
  appointmentTime,
  confirmationToken,
  policy
}: {
  to: string
  clientName: string
  businessName: string
  appointment: any
  appointmentDate: string
  appointmentTime: string
  confirmationToken: string
  policy: any
}): Promise<boolean> {
  try {
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://gestabiz.vercel.app'
    const confirmUrl = `${frontendUrl}/confirm-appointment?token=${confirmationToken}`
    const cancelUrl = `${frontendUrl}/cancel-appointment?token=${confirmationToken}`

    // Replace template variables
    const subject = policy.email_template_subject
      .replace('{{business_name}}', businessName)
      .replace('{{client_name}}', clientName)
      .replace('{{appointment_date}}', appointmentDate)
      .replace('{{appointment_time}}', appointmentTime)

    const bodyText = policy.email_template_body
      .replace('{{business_name}}', businessName)
      .replace('{{client_name}}', clientName)
      .replace('{{appointment_date}}', appointmentDate)
      .replace('{{appointment_time}}', appointmentTime)

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .appointment-card { background: white; padding: 25px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0; }
        .appointment-details { margin: 15px 0; }
        .detail-row { margin: 12px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .detail-row:last-child { border-bottom: none; }
        .label { font-weight: bold; color: #374151; display: inline-block; width: 120px; }
        .value { color: #1f2937; }
        .status-badge { background: #f59e0b; color: white; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        .action-buttons { text-align: center; margin: 30px 0; }
        .btn { display: inline-block; padding: 15px 30px; margin: 10px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; }
        .btn-confirm { background: #10b981; color: white; }
        .btn-cancel { background: #ef4444; color: white; }
        .btn:hover { opacity: 0.9; }
        .warning-box { background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
        .deadline { background: #fee2e2; border: 1px solid #ef4444; padding: 15px; border-radius: 6px; margin: 15px 0; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📅 ${businessName}</h1>
          <h2>Confirmación de Cita Requerida</h2>
        </div>
        <div class="content">
          <p>Hola <strong>${clientName}</strong>,</p>
          
          <p>${bodyText}</p>
          
          <div class="appointment-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <h3>📋 Detalles de la Cita</h3>
              <span class="status-badge">PENDIENTE CONFIRMACIÓN</span>
            </div>
            <div class="appointment-details">
              <div class="detail-row">
                <span class="label">Servicio:</span>
                <span class="value">${appointment.title || 'Cita'}</span>
              </div>
              <div class="detail-row">
                <span class="label">Fecha:</span>
                <span class="value">${appointmentDate}</span>
              </div>
              <div class="detail-row">
                <span class="label">Hora:</span>
                <span class="value">${appointmentTime}</span>
              </div>
              <div class="detail-row">
                <span class="label">Duración:</span>
                <span class="value">${appointment.duration || 60} minutos</span>
              </div>
              ${appointment.notes ? `
              <div class="detail-row">
                <span class="label">Notas:</span>
                <span class="value">${appointment.notes}</span>
              </div>
              ` : ''}
            </div>
          </div>

          ${appointment.confirmation_deadline ? `
          <div class="deadline">
            <strong>⏰ Fecha límite para confirmar:</strong><br>
            ${new Date(appointment.confirmation_deadline).toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
          ` : ''}
          
          <div class="action-buttons">
            <a href="${confirmUrl}" class="btn btn-confirm">
              ✅ CONFIRMAR CITA
            </a>
            <a href="${cancelUrl}" class="btn btn-cancel">
              ❌ CANCELAR CITA
            </a>
          </div>
          
          <div class="warning-box">
            <p><strong>⚠️ Importante:</strong></p>
            <ul>
              <li>Debes confirmar tu cita antes de la fecha límite</li>
              <li>Si no confirmas, la cita será marcada automáticamente como "no presentado"</li>
              <li>Para reprogramar, cancela esta cita y agenda una nueva</li>
            </ul>
          </div>

          <p><strong>📞 ¿Necesitas ayuda?</strong></p>
          <p>Si tienes alguna pregunta o necesitas hacer cambios, contáctanos:</p>
          <ul>
            <li>📧 Email: ${appointment.businesses.email || 'No disponible'}</li>
            <li>📱 Teléfono: ${appointment.businesses.phone || 'No disponible'}</li>
          </ul>
        </div>
        <div class="footer">
          <p>Este email fue enviado desde ${businessName} a través de Gestabiz</p>
          <p>Si no solicitaste esta cita, puedes cancelarla usando el botón de arriba</p>
        </div>
      </div>
    </body>
    </html>
    `

    // Send email using Brevo (based on existing setup)
    const brevoApiKey = Deno.env.get('BREVO_API_KEY')
    
    if (!brevoApiKey) {
      console.log('📧 Confirmation email (dev mode):', {
        to,
        subject,
        confirmUrl,
        cancelUrl
      })
      return true // Return true in dev mode
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': brevoApiKey,
      },
      body: JSON.stringify({
        sender: {
          name: businessName,
          email: Deno.env.get('FROM_EMAIL') || 'noreply@gestabiz.app'
        },
        to: [{ email: to, name: clientName }],
        subject,
        htmlContent: htmlContent,
        textContent: `${bodyText}\n\nPara confirmar tu cita, visita: ${confirmUrl}\nPara cancelar tu cita, visita: ${cancelUrl}`
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Brevo API error:', errorData)
      return false
    }

    return true

  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}