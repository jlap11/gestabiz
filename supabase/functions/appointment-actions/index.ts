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
    const { appointmentId, action, reason } = await req.json()

    if (!appointmentId || !action) {
      throw new Error('Missing required parameters: appointmentId and action')
    }

    // Get Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get appointment details
    const { data: appointment, error: fetchError } = await supabaseClient
      .from('appointments')
      .select(
        `
        *,
        service:services(name),
        client:profiles!appointments_client_id_fkey(full_name, email, phone),
        employee:profiles!appointments_employee_id_fkey(full_name),
        business:businesses(name, phone)
      `
      )
      .eq('id', appointmentId)
      .single()

    if (fetchError || !appointment) {
      throw new Error(`Appointment not found: ${fetchError?.message}`)
    }

    let updateData: any = {}
    let notificationTitle = ''
    let notificationMessage = ''

    switch (action) {
      case 'confirm':
        updateData = { status: 'confirmed' }
        notificationTitle = 'Cita Confirmada'
        notificationMessage = `Tu cita para ${appointment.service?.name || 'el servicio'} ha sido confirmada.`
        break

      case 'cancel':
        updateData = {
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancel_reason: reason || 'Cancelado por el negocio',
        }
        notificationTitle = 'Cita Cancelada'
        notificationMessage = `Tu cita para ${appointment.service?.name || 'el servicio'} ha sido cancelada.${reason ? ` Motivo: ${reason}` : ''}`
        break

      case 'complete':
        updateData = { status: 'completed' }
        notificationTitle = 'Cita Completada'
        notificationMessage = `Tu cita para ${appointment.service?.name || 'el servicio'} ha sido completada. ¡Gracias por visitarnos!`
        break

      case 'no_show':
        updateData = { status: 'no_show' }
        notificationTitle = 'Cita - No Show'
        notificationMessage = `No asististe a tu cita programada para ${appointment.service?.name || 'el servicio'}.`
        break

      default:
        throw new Error(`Invalid action: ${action}`)
    }

    // Update appointment
    const { error: updateError } = await supabaseClient
      .from('appointments')
      .update(updateData)
      .eq('id', appointmentId)

    if (updateError) {
      throw updateError
    }

    // Create notification for client
    const { error: notificationError } = await supabaseClient.from('notifications').insert({
      user_id: appointment.client_id,
      type: action === 'confirm' ? 'appointment_confirmed' : 'appointment_cancelled',
      title: notificationTitle,
      message: notificationMessage,
      appointment_id: appointmentId,
    })

    if (notificationError) {
      console.error('Error creating notification:', notificationError)
      // Don't fail the entire operation if notification fails
    }

    // Send WhatsApp message if phone number exists and action is important
    if (appointment.client?.phone && ['confirm', 'cancel'].includes(action)) {
      await sendWhatsAppMessage({
        phone: appointment.client.phone,
        message: createWhatsAppMessage(action, appointment),
        appointmentId,
      })
    }

    // Send email notification
    if (appointment.client?.email) {
      await sendEmailNotification({
        to: appointment.client.email,
        subject: notificationTitle,
        message: notificationMessage,
        appointmentDetails: {
          serviceName: appointment.service?.name || 'Servicio',
          businessName: appointment.business?.name || 'Negocio',
          startTime: appointment.start_time,
          endTime: appointment.end_time,
        },
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Appointment ${action}ed successfully`,
        appointmentId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in appointment-actions function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

function createWhatsAppMessage(action: string, appointment: any): string {
  const startDate = new Date(appointment.start_time)
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

  const businessName = appointment.business?.name || 'Nuestro negocio'
  const serviceName = appointment.service?.name || 'el servicio'

  switch (action) {
    case 'confirm':
      return `¡Hola! 👋\n\nTu cita para *${serviceName}* ha sido confirmada ✅\n\n📅 Fecha: ${dateStr}\n🕐 Hora: ${timeStr}\n🏢 ${businessName}\n\n¡Te esperamos!`

    case 'cancel':
      return `Hola 👋\n\nTe informamos que tu cita para *${serviceName}* programada para el ${dateStr} a las ${timeStr} ha sido cancelada.\n\n🏢 ${businessName}\n\nPuedes reagendar cuando gustes. ¡Gracias por tu comprensión!`

    default:
      return `Actualización de tu cita para *${serviceName}* en ${businessName} - ${dateStr} a las ${timeStr}`
  }
}

async function sendWhatsAppMessage(params: {
  phone: string
  message: string
  appointmentId: string
}): Promise<boolean> {
  try {
    // You can integrate with WhatsApp Business API or services like Twilio, ChatAPI, etc.
    // For demo purposes, we'll just log the message

    console.log(`WHATSAPP TO: ${params.phone}`)
    console.log(`MESSAGE: ${params.message}`)
    console.log(`APPOINTMENT ID: ${params.appointmentId}`)

    // Example integration with Twilio WhatsApp API:
    /*
    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')
    const TWILIO_WHATSAPP_FROM = Deno.env.get('TWILIO_WHATSAPP_FROM') // e.g., 'whatsapp:+14155238886'
    
    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WHATSAPP_FROM) {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`
      
      const formData = new URLSearchParams()
      formData.append('From', TWILIO_WHATSAPP_FROM)
      formData.append('To', `whatsapp:${params.phone}`)
      formData.append('Body', params.message)
      
      const response = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      })
      
      if (response.ok) {
        console.log(`WhatsApp message sent successfully to ${params.phone}`)
        return true
      } else {
        const errorData = await response.text()
        console.error(`Failed to send WhatsApp message to ${params.phone}:`, errorData)
        return false
      }
    }
    */

    console.log('WhatsApp service not configured, message logged instead')
    return true // Return true for development
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    return false
  }
}

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
    // Use your preferred email service
    console.log(`EMAIL TO: ${params.to}`)
    console.log(`SUBJECT: ${params.subject}`)
    console.log(`MESSAGE: ${params.message}`)

    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}
