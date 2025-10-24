import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WhatsAppRequest {
  to: string
  message: string
  appointmentData?: any
}

serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, message, appointmentData }: WhatsAppRequest = await req.json()

    // WhatsApp Business API configuration
    const whatsappToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN')
    const whatsappPhoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')

    if (!whatsappToken || !whatsappPhoneNumberId) {
      throw new Error('WhatsApp API not configured')
    }

    // Clean phone number (remove any non-digits except +)
    const cleanedPhone = to.replace(/[^\d+]/g, '')

    // Build WhatsApp message
    let whatsappMessage = message

    if (appointmentData) {
      whatsappMessage = `
🗓️ *Recordatorio de Cita*

👋 Hola ${appointmentData.client_name},

Tienes una cita programada:

📅 *Fecha:* ${new Date(appointmentData.start_time).toLocaleDateString('es-ES')}
🕐 *Hora:* ${new Date(appointmentData.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
📍 *Lugar:* ${appointmentData.location || 'Por confirmar'}
📝 *Servicio:* ${appointmentData.title}

${appointmentData.notes ? `📋 *Notas:* ${appointmentData.notes}` : ''}

¡Te esperamos! 😊

Si necesitas cancelar o reprogramar, por favor responde a este mensaje.
      `.trim()
    }

    // Send WhatsApp message using WhatsApp Business API
    const whatsappResponse = await fetch(
      `https://graph.facebook.com/v18.0/${whatsappPhoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${whatsappToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanedPhone,
          type: 'text',
          text: {
            body: whatsappMessage,
          },
        }),
      }
    )

    if (!whatsappResponse.ok) {
      const error = await whatsappResponse.text()
      throw new Error(`Failed to send WhatsApp message: ${error}`)
    }

    const whatsappResult = await whatsappResponse.json()

    return new Response(
      JSON.stringify({
        success: true,
        message: 'WhatsApp message sent successfully',
        messageId: whatsappResult.messages?.[0]?.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)

    // Fallback: Log the attempt for manual follow-up
    console.log('WhatsApp message that failed to send:', {
      to: req.json().then(data => data.to),
      message: req.json().then(data => data.message),
      timestamp: new Date().toISOString(),
    })

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        fallback: 'Message logged for manual follow-up',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
