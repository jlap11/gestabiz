import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Get current time
    const now = new Date()
    console.log(`Processing notifications at: ${now.toISOString()}`)

    // Get pending notifications that are due to be sent
    const { data: notifications, error } = await supabaseClient
      .from('notifications')
      .select(`
        *,
        appointments!inner(
          id,
          title,
          client_name,
          client_email,
          client_phone,
          client_whatsapp,
          start_time,
          end_time,
          business_id,
          services(name)
        ),
        users!inner(
          id,
          full_name,
          business_id,
          notification_preferences
        )
      `)
      .eq('status', 'pending')
      .lte('scheduled_for', now.toISOString())
      .limit(50) // Process in batches

    if (error) {
      throw new Error(`Error fetching notifications: ${error.message}`)
    }

    console.log(`Found ${notifications?.length || 0} notifications to process`)

    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      errors: [] as string[]
    }

    if (!notifications || notifications.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No notifications to process',
          results
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Process each notification
    for (const notification of notifications) {
      results.processed++
      
      try {
        let sent = false
        const appointment = notification.appointments
        const user = notification.users

        // Check if user has this notification type enabled
        const prefs = user.notification_preferences || {}
        
        if (notification.delivery_method === 'email') {
          const emailEnabled = prefs.email && 
            (notification.type.includes('reminder') ? prefs.reminder_24h || prefs.reminder_1h : true)
          
          if (emailEnabled && appointment.client_email) {
            // Send email notification
            const emailResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                to: appointment.client_email,
                subject: notification.title,
                html: formatEmailHtml(notification, appointment),
                text: notification.message
              })
            })

            if (emailResponse.ok) {
              sent = true
            } else {
              const errorData = await emailResponse.text()
              throw new Error(`Email sending failed: ${errorData}`)
            }
          }
        } else if (notification.delivery_method === 'whatsapp') {
          const whatsappEnabled = prefs.whatsapp && 
            (notification.type.includes('reminder') ? prefs.reminder_24h || prefs.reminder_1h : true)
          
          if (whatsappEnabled && appointment.client_whatsapp) {
            // Send WhatsApp notification
            const whatsappResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-whatsapp`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                to: appointment.client_whatsapp,
                message: formatWhatsAppMessage(notification, appointment)
              })
            })

            if (whatsappResponse.ok) {
              sent = true
            } else {
              const errorData = await whatsappResponse.text()
              throw new Error(`WhatsApp sending failed: ${errorData}`)
            }
          }
        }

        // Update notification status
        const { error: updateError } = await supabaseClient
          .from('notifications')
          .update({
            status: sent ? 'sent' : 'failed',
            sent_at: sent ? now.toISOString() : null,
            error_message: sent ? null : 'Delivery method not enabled or contact info missing'
          })
          .eq('id', notification.id)

        if (updateError) {
          throw new Error(`Error updating notification: ${updateError.message}`)
        }

        if (sent) {
          results.sent++
        } else {
          results.failed++
          results.errors.push(`Notification ${notification.id}: delivery not enabled or contact missing`)
        }

      } catch (error) {
        results.failed++
        results.errors.push(`Notification ${notification.id}: ${error.message}`)
        
        // Update notification with error
        await supabaseClient
          .from('notifications')
          .update({
            status: 'failed',
            error_message: error.message
          })
          .eq('id', notification.id)
      }
    }

    // Generate follow-up notifications for inactive clients
    await generateFollowUpNotifications(supabaseClient)

    console.log('Processing completed:', results)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notifications processed successfully',
        results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error processing notifications:', error)
    
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

function formatEmailHtml(notification: any, appointment: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${notification.title}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #6366f1; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .appointment-details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6366f1; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        .button { display: inline-block; background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${notification.title}</h1>
      </div>
      <div class="content">
        <p>Hola ${appointment.client_name},</p>
        <p>${notification.message}</p>
        
        <div class="appointment-details">
          <h3>Detalles de la Cita</h3>
          <p><strong>Servicio:</strong> ${appointment.services?.name || appointment.title}</p>
          <p><strong>Fecha:</strong> ${new Date(appointment.start_time).toLocaleDateString('es-ES')}</p>
          <p><strong>Hora:</strong> ${new Date(appointment.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
          ${appointment.location ? `<p><strong>Ubicación:</strong> ${appointment.location}</p>` : ''}
        </div>
        
        <p>Si necesitas reprogramar o cancelar tu cita, por favor contáctanos lo antes posible.</p>
        
        <div class="footer">
          <p>Este mensaje fue enviado por Bookio</p>
          <p>Si tienes preguntas, responde a este correo o llámanos.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function formatWhatsAppMessage(notification: any, appointment: any): string {
  const date = new Date(appointment.start_time).toLocaleDateString('es-ES')
  const time = new Date(appointment.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  const service = appointment.services?.name || appointment.title
  
  return `${notification.message}

📅 *Detalles de tu cita:*
• Fecha: ${date}
• Hora: ${time}
• Servicio: ${service}
${appointment.location ? `• Ubicación: ${appointment.location}` : ''}

Si necesitas cambios, contáctanos. ¡Te esperamos! 😊`
}

async function generateFollowUpNotifications(supabaseClient: any): Promise<void> {
  try {
    // Find clients who haven't had an appointment in the last 90 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 90)

    const { data: inactiveClients, error } = await supabaseClient
      .from('clients')
      .select(`
        *,
        businesses!inner(
          id,
          users!inner(id, notification_preferences)
        )
      `)
      .eq('status', 'active')
      .eq('is_recurring', true)
      .lt('last_appointment', thirtyDaysAgo.toISOString())

    if (error || !inactiveClients) return

    for (const client of inactiveClients) {
      // Check if we already sent a follow-up recently
      const { data: recentNotifications } = await supabaseClient
        .from('notifications')
        .select('id')
        .eq('type', 'follow_up')
        .eq('business_id', client.business_id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days

      if (recentNotifications && recentNotifications.length > 0) continue

      // Create follow-up notification
      const businessUser = client.businesses.users[0]
      if (!businessUser) continue

      const followUpMessage = `Hola ${client.name}! Notamos que hace tiempo no nos visitas. ¿Te gustaría agendar una nueva cita? ¡Estaremos felices de atenderte nuevamente!`

      // Create WhatsApp follow-up if enabled
      if (businessUser.notification_preferences?.whatsapp && client.whatsapp) {
        await supabaseClient
          .from('notifications')
          .insert({
            user_id: businessUser.id,
            business_id: client.business_id,
            type: 'follow_up',
            title: 'Seguimiento Cliente Inactivo',
            message: followUpMessage,
            scheduled_for: new Date().toISOString(),
            delivery_method: 'whatsapp',
            status: 'pending'
          })
      }

      // Create email follow-up if enabled
      if (businessUser.notification_preferences?.email && client.email) {
        await supabaseClient
          .from('notifications')
          .insert({
            user_id: businessUser.id,
            business_id: client.business_id,
            type: 'follow_up',
            title: 'Te extrañamos - ¡Agenda tu próxima cita!',
            message: followUpMessage,
            scheduled_for: new Date().toISOString(),
            delivery_method: 'email',
            status: 'pending'
          })
      }
    }
  } catch (error) {
    console.error('Error generating follow-up notifications:', error)
  }
}

/* 
This Edge Function should be called periodically (e.g., every 15 minutes) using a cron job or scheduled task.

Setup Instructions:
1. Deploy to Supabase Edge Functions
2. Set up a cron job to call this function regularly:
   - Using GitHub Actions
   - Using Supabase cron (if available)
   - Using external cron service like cron-job.org

Example cron setup (every 15 minutes):
POST https://your-project.supabase.co/functions/v1/process-notifications
Headers:
- Authorization: Bearer YOUR_SERVICE_ROLE_KEY

This function will:
1. Find pending notifications due to be sent
2. Send them via email or WhatsApp based on user preferences
3. Update notification status
4. Generate follow-up notifications for inactive clients
5. Return processing results
*/