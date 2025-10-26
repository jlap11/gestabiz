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

    const { appointment } = await req.json()

    if (!appointment) {
      return new Response(
        JSON.stringify({ error: 'Appointment data is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get user and client information
    const { data: user } = await supabaseClient
      .from('users')
      .select('email, full_name')
      .eq('id', appointment.user_id)
      .single()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Format appointment date and time
    const appointmentDateTime = new Date(
      `${appointment.appointment_date}T${appointment.appointment_time}`
    ).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    // Send confirmation email to user
    const userEmailSent = await sendConfirmationEmail({
      to: user.email,
      recipientName: user.full_name || 'User',
      appointment,
      appointmentDateTime,
      isClientEmail: false
    })

    // Send confirmation email to client if email provided
    let clientEmailSent = true
    if (appointment.client_email) {
      clientEmailSent = await sendConfirmationEmail({
        to: appointment.client_email,
        recipientName: appointment.client_name,
        appointment,
        appointmentDateTime,
        isClientEmail: true
      })
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        userEmailSent,
        clientEmailSent: appointment.client_email ? clientEmailSent : null
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
  recipientName,
  appointment,
  appointmentDateTime,
  isClientEmail
}: {
  to: string
  recipientName: string
  appointment: any
  appointmentDateTime: string
  isClientEmail: boolean
}): Promise<boolean> {
  try {
    const subject = isClientEmail 
      ? `Appointment Confirmed - ${appointment.title}`
      : `Appointment Created - ${appointment.title}`

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .appointment-card { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; }
        .appointment-details { margin: 15px 0; }
        .detail-row { margin: 8px 0; }
        .label { font-weight: bold; color: #374151; }
        .status-badge { background: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
        .action-button { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Gestabiz</h1>
          <h2>Appointment ${isClientEmail ? 'Confirmed' : 'Created'}</h2>
        </div>
        <div class="content">
          <p>Hello ${recipientName}!</p>
          
          ${isClientEmail 
            ? '<p>Your appointment has been confirmed. Here are the details:</p>'
            : '<p>You have successfully created a new appointment. Here are the details:</p>'
          }
          
          <div class="appointment-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
              <h3>📋 Appointment Details</h3>
              <span class="status-badge">CONFIRMED</span>
            </div>
            <div class="appointment-details">
              <div class="detail-row">
                <span class="label">Title:</span> ${appointment.title}
              </div>
              <div class="detail-row">
                <span class="label">${isClientEmail ? 'With' : 'Client'}:</span> ${appointment.client_name}
              </div>
              <div class="detail-row">
                <span class="label">Date & Time:</span> ${appointmentDateTime}
              </div>
              <div class="detail-row">
                <span class="label">Duration:</span> ${appointment.duration || 60} minutes
              </div>
              ${appointment.location ? `
              <div class="detail-row">
                <span class="label">Location:</span> ${appointment.location}
              </div>
              ` : ''}
              ${appointment.description ? `
              <div class="detail-row">
                <span class="label">Description:</span> ${appointment.description}
              </div>
              ` : ''}
            </div>
          </div>
          
          ${isClientEmail ? `
          <p><strong>📱 Contact Information:</strong></p>
          <p>If you need to make any changes or have questions, please contact us.</p>
          
          <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p><strong>📝 Please Note:</strong></p>
            <ul>
              <li>Please arrive 10 minutes early for your appointment</li>
              <li>If you need to reschedule, please give at least 24 hours notice</li>
              <li>Bring any relevant documents or materials</li>
            </ul>
          </div>
          ` : `
          <p>You will receive automatic reminders before the appointment.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${Deno.env.get('FRONTEND_URL') || 'https://your-app.vercel.app'}" class="action-button">
              Manage Appointments
            </a>
          </div>
          `}
        </div>
        <div class="footer">
          <p>This confirmation was sent from Gestabiz</p>
          ${!isClientEmail ? `<p><a href="${Deno.env.get('FRONTEND_URL') || 'https://your-app.vercel.app'}">Login to your dashboard</a></p>` : ''}
        </div>
      </div>
    </body>
    </html>
    `

    // Send email using your preferred provider
    const emailProvider = Deno.env.get('EMAIL_PROVIDER') || 'resend'

    if (emailProvider === 'resend') {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: Deno.env.get('FROM_EMAIL') || 'Gestabiz <noreply@Gestabiz.app>',
          to: [to],
          subject,
          html: htmlContent,
        }),
      })

      return response.ok
    } else {
      // Development fallback
      console.log('📧 Confirmation email (dev mode):', {
        to,
        subject,
        isClientEmail,
        appointment: appointment.title
      })
      return true
    }

  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}