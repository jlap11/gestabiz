// Supabase Edge Function: send-notification-reminders
// File: supabase/functions/send-notification-reminders/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Notification {
  id: string
  user_id: string
  appointment_id: string
  type: string
  title: string
  message: string
  scheduled_for: string
  delivery_method: string
  appointment?: {
    title: string
    start_time: string
    client_name: string
    location: string
  }
  profile?: {
    email: string
    full_name: string
    notification_preferences: any
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get pending notifications that are due to be sent
    const { data: notifications, error: fetchError } = await supabase
      .from('notifications')
      .select(`
        *,
        appointment:appointments(title, start_time, client_name, location),
        profile:profiles(email, full_name, notification_preferences)
      `)
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .limit(100)

    if (fetchError) {
      throw fetchError
    }

    console.log(`Processing ${notifications?.length || 0} notifications`)

    const results = []

    for (const notification of notifications || []) {
      try {
        let success = false
        
        // Check if user has enabled this notification method
        const prefs = notification.profile?.notification_preferences || {}
        
        switch (notification.delivery_method) {
          case 'email':
            if (prefs.email !== false) {
              success = await sendEmailNotification(notification)
            }
            break
          case 'push':
            if (prefs.push !== false) {
              success = await sendPushNotification(notification)
            }
            break
          case 'browser':
            if (prefs.browser !== false) {
              success = await sendBrowserNotification(notification)
            }
            break
        }

        // Update notification status
        const status = success ? 'sent' : 'failed'
        await supabase
          .from('notifications')
          .update({ 
            status,
            sent_at: new Date().toISOString()
          })
          .eq('id', notification.id)

        results.push({
          id: notification.id,
          type: notification.type,
          delivery_method: notification.delivery_method,
          status
        })

      } catch (error) {
        console.error(`Error processing notification ${notification.id}:`, error)
        
        // Mark as failed
        await supabase
          .from('notifications')
          .update({ status: 'failed' })
          .eq('id', notification.id)

        results.push({
          id: notification.id,
          type: notification.type,
          delivery_method: notification.delivery_method,
          status: 'failed',
          error: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        results 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in send-notification-reminders function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function sendEmailNotification(notification: Notification): Promise<boolean> {
  try {
    // You can integrate with SendGrid, Resend, or any email service
    // This is a basic example using the Fetch API to send to an email service
    
    const emailData = {
      to: notification.profile?.email,
      subject: notification.title,
      html: generateEmailHTML(notification),
      text: generateEmailText(notification)
    }

    // Example with SendGrid (replace with your preferred email service)
    if (Deno.env.get('SENDGRID_API_KEY')) {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: emailData.to }],
            subject: emailData.subject
          }],
          from: { 
            email: Deno.env.get('FROM_EMAIL') || 'noreply@Gestabiz.com',
            name: 'Gestabiz'
          },
          content: [
            { type: 'text/plain', value: emailData.text },
            { type: 'text/html', value: emailData.html }
          ]
        })
      })

      return response.ok
    }

    // Fallback: log email content (for development)
    console.log('Email notification:', emailData)
    return true

  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

async function sendPushNotification(notification: Notification): Promise<boolean> {
  try {
    // Implement push notification logic here
    // You can use Firebase Cloud Messaging, OneSignal, or similar services
    
    console.log('Push notification:', {
      userId: notification.user_id,
      title: notification.title,
      body: notification.message
    })
    
    // For now, just return true (implement actual push notification service)
    return true
    
  } catch (error) {
    console.error('Error sending push notification:', error)
    return false
  }
}

async function sendBrowserNotification(notification: Notification): Promise<boolean> {
  try {
    // Browser notifications are typically handled on the client side
    // This could trigger a real-time event via Supabase realtime
    
    console.log('Browser notification:', {
      userId: notification.user_id,
      title: notification.title,
      body: notification.message
    })
    
    return true
    
  } catch (error) {
    console.error('Error sending browser notification:', error)
    return false
  }
}

function generateEmailHTML(notification: Notification): string {
  const appointment = notification.appointment
  const startTime = new Date(appointment?.start_time || '').toLocaleString()
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>${notification.title}</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #ddd; }
            .appointment-details { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
            .footer { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📅 ${notification.title}</h1>
            </div>
            <div class="content">
                <p>Hello ${notification.profile?.full_name || 'there'},</p>
                <p>${notification.message}</p>
                
                <div class="appointment-details">
                    <h3>Appointment Details:</h3>
                    <p><strong>Title:</strong> ${appointment?.title}</p>
                    <p><strong>Date & Time:</strong> ${startTime}</p>
                    ${appointment?.client_name ? `<p><strong>Client:</strong> ${appointment.client_name}</p>` : ''}
                    ${appointment?.location ? `<p><strong>Location:</strong> ${appointment.location}</p>` : ''}
                </div>
                
                <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}" class="button">
                    View Appointment
                </a>
            </div>
            <div class="footer">
                <p>This is an automated reminder from Gestabiz</p>
                <p>To stop receiving these emails, update your notification preferences in the app</p>
            </div>
        </div>
    </body>
    </html>
  `
}

function generateEmailText(notification: Notification): string {
  const appointment = notification.appointment
  const startTime = new Date(appointment?.start_time || '').toLocaleString()
  
  return `
${notification.title}

Hello ${notification.profile?.full_name || 'there'},

${notification.message}

Appointment Details:
- Title: ${appointment?.title}
- Date & Time: ${startTime}
${appointment?.client_name ? `- Client: ${appointment.client_name}` : ''}
${appointment?.location ? `- Location: ${appointment.location}` : ''}

View your appointment: ${Deno.env.get('APP_URL') || 'https://your-app-url.com'}

This is an automated reminder from Gestabiz.
To stop receiving these emails, update your notification preferences in the app.
  `
}