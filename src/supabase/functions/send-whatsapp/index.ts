import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WhatsAppRequest {
  to: string // Phone number with country code, e.g., "+573001234567"
  message: string
  template_name?: string
  variables?: Record<string, string>
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

    const { to, message, template_name, variables }: WhatsAppRequest = await req.json()

    // Validate phone number format
    if (!to.match(/^\+\d{10,15}$/)) {
      throw new Error('Invalid phone number format. Use international format: +573001234567')
    }

    // Get WhatsApp API credentials from environment
    const whatsappToken = Deno.env.get('WHATSAPP_TOKEN')
    const whatsappPhoneId = Deno.env.get('WHATSAPP_PHONE_ID')
    
    if (!whatsappToken || !whatsappPhoneId) {
      console.log('WhatsApp API not configured. Message simulation only.')
      console.log(`Would send WhatsApp to: ${to}`)
      console.log(`Message: ${message}`)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'WhatsApp message simulated successfully',
          details: { to, message }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    let messagePayload: any

    if (template_name && variables) {
      // Send template message
      messagePayload = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'template',
        template: {
          name: template_name,
          language: { code: 'es' },
          components: [
            {
              type: 'body',
              parameters: Object.values(variables).map(value => ({
                type: 'text',
                text: value
              }))
            }
          ]
        }
      }
    } else {
      // Send text message
      messagePayload = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: message }
      }
    }

    // Send message using WhatsApp Business API
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${whatsappPhoneId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${whatsappToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messagePayload),
      }
    )

    const responseData = await response.json()

    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${JSON.stringify(responseData)}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'WhatsApp message sent successfully',
        whatsapp_message_id: responseData.messages?.[0]?.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    
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

1. Simple text message:
POST /functions/v1/send-whatsapp
{
  "to": "+573001234567",
  "message": "Hola Juan! Te recordamos que tienes una cita mañana a las 10:00 AM para consulta general. ¡Te esperamos!"
}

2. Template message (requires approved template):
POST /functions/v1/send-whatsapp
{
  "to": "+573001234567",
  "template_name": "appointment_reminder",
  "variables": {
    "client_name": "Juan",
    "appointment_date": "15 de enero",
    "appointment_time": "10:00 AM",
    "service_name": "Consulta General"
  }
}

3. Follow-up message for inactive clients:
POST /functions/v1/send-whatsapp
{
  "to": "+573001234567",
  "message": "Hola María! Notamos que hace tiempo no nos visitas. ¿Te gustaría agendar una nueva cita? Responde SÍ para que te contactemos."
}

Setup Instructions:
1. Create a WhatsApp Business Account
2. Set up a WhatsApp Business API app on Meta for Developers
3. Get your Phone Number ID and Access Token
4. Set environment variables in Supabase:
   - WHATSAPP_TOKEN: Your WhatsApp Business API access token
   - WHATSAPP_PHONE_ID: Your WhatsApp Business phone number ID
5. Create and get approval for message templates if needed

Environment Variables needed:
- WHATSAPP_TOKEN
- WHATSAPP_PHONE_ID
*/