import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  subject: string
  html: string
  text?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { to, subject, html, text }: EmailRequest = await req.json()

    // In a real implementation, you would use a service like SendGrid, Resend, or similar
    // For this example, we'll simulate sending the email
    
    // Example with SendGrid (you would need to add the SendGrid API key)
    const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY')
    
    if (!sendGridApiKey) {
      console.log('SendGrid API key not configured. Email simulation only.')
      console.log(`Would send email to: ${to}`)
      console.log(`Subject: ${subject}`)
      console.log(`Content: ${text || html}`)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email simulated successfully',
          details: { to, subject }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Send email using SendGrid
    const emailData = {
      personalizations: [{
        to: [{ email: to }],
        subject: subject
      }],
      from: { 
        email: Deno.env.get('FROM_EMAIL') || 'noreply@Gestabiz.com',
        name: 'Gestabiz'
      },
      content: [
        {
          type: 'text/html',
          value: html
        },
        ...(text ? [{
          type: 'text/plain',
          value: text
        }] : [])
      ]
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendGridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`SendGrid error: ${error}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully' 
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
        status: 400,
      }
    )
  }
})

/* 
Usage examples:

1. Appointment reminder:
POST /functions/v1/send-email
{
  "to": "client@example.com",
  "subject": "Recordatorio de Cita - Gestabiz",
  "html": "<h1>Recordatorio</h1><p>Tu cita es mañana a las 10:00 AM</p>",
  "text": "Recordatorio: Tu cita es mañana a las 10:00 AM"
}

2. Appointment confirmation:
POST /functions/v1/send-email
{
  "to": "client@example.com",
  "subject": "Cita Confirmada - Gestabiz",
  "html": "<h1>Cita Confirmada</h1><p>Tu cita ha sido confirmada para el 15 de enero a las 2:00 PM</p>"
}

3. Weekly report:
POST /functions/v1/send-email
{
  "to": "admin@business.com",
  "subject": "Reporte Semanal - Gestabiz",
  "html": "<h1>Reporte Semanal</h1><p>Esta semana tuviste 25 citas, 20 completadas...</p>"
}
*/