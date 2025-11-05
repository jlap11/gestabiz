// Supabase Edge Function: Process Scheduled Notifications
// Deploy with: supabase functions deploy process-notifications
// This function should be called periodically (e.g., every 5 minutes) using a cron job

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

    // Get pending notifications that are due to be sent
    const now = new Date().toISOString()
    const { data: pendingNotifications, error: fetchError } = await supabaseClient
      .from('notifications')
      .select(`
        id,
        appointment_id,
        type,
        delivery_method,
        scheduled_for,
        appointments!inner(
          id,
          title,
          start_time,
          business_id,
          user_id,
          users!inner(
            email,
            full_name,
            notification_preferences
          )
        )
      `)
      .eq('status', 'pending')
      .lte('scheduled_for', now)
      .limit(50) // Process max 50 notifications per run

    if (fetchError) {
      throw new Error(`Failed to fetch pending notifications: ${fetchError.message}`)
    }

    const results = []

    for (const notification of pendingNotifications) {
      try {
        const userPrefs = notification.appointments.users.notification_preferences

        // Check if user has enabled this type of notification
        let shouldSend = false
        switch (notification.delivery_method) {
          case 'email':
            shouldSend = userPrefs.email
            break
          case 'push':
            shouldSend = userPrefs.push
            break
          case 'browser':
            shouldSend = userPrefs.browser
            break
        }

        if (!shouldSend) {
          // Mark as cancelled if user has disabled this notification type
          await supabaseClient
            .from('notifications')
            .update({
              status: 'cancelled',
              error_message: 'User has disabled this notification type'
            })
            .eq('id', notification.id)

          results.push({
            notificationId: notification.id,
            status: 'cancelled',
            reason: 'User preference disabled'
          })
          continue
        }

        // Optionally gate against business settings before dispatch
        let allowChannel = true
        if (notification.appointments?.business_id) {
          const { data: bizSettings } = await supabaseClient
            .from('business_notification_settings')
            .select('*')
            .eq('business_id', notification.appointments.business_id)
            .single()

          if (bizSettings) {
            const notifTypes = (bizSettings.notification_types ?? {}) as Record<string, { enabled?: boolean; channels?: string[] }>
            const reminderCfg = notifTypes['appointment_reminder'] || { enabled: true, channels: ['email', 'whatsapp'] }
            const channels = reminderCfg.channels || []
            if (notification.delivery_method === 'email') {
              allowChannel = Boolean(bizSettings.email_enabled) && Boolean(reminderCfg.enabled) && channels.includes('email')
            } else if (notification.delivery_method === 'sms') {
              allowChannel = Boolean(bizSettings.sms_enabled) && Boolean(reminderCfg.enabled) && channels.includes('sms')
            } else if (notification.delivery_method === 'whatsapp') {
              allowChannel = Boolean(bizSettings.whatsapp_enabled) && Boolean(reminderCfg.enabled) && channels.includes('whatsapp')
            }
          }
        }

        if (!allowChannel) {
          await supabaseClient
            .from('notifications')
            .update({ status: 'cancelled', error_message: 'Channel disabled by business settings' })
            .eq('id', notification.id)

          results.push({ notificationId: notification.id, status: 'cancelled', method: notification.delivery_method })
          continue
        }

        // Process based on delivery method
        if (notification.delivery_method === 'email') {
          // Call the email reminder function
          const emailResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email-reminder`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              notificationId: notification.id,
              appointmentId: notification.appointment_id
            })
          })

          if (emailResponse.ok) {
            results.push({
              notificationId: notification.id,
              status: 'sent',
              method: 'email'
            })
          } else {
            const error = await emailResponse.text()
            results.push({
              notificationId: notification.id,
              status: 'failed',
              method: 'email',
              error: error
            })
          }
        } else if (notification.delivery_method === 'whatsapp') {
          const waResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-whatsapp-reminder`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              notificationId: notification.id,
              appointmentId: notification.appointment_id,
            })
          })

          if (waResponse.ok) {
            results.push({ notificationId: notification.id, status: 'sent', method: 'whatsapp' })
          } else {
            const error = await waResponse.text()
            results.push({ notificationId: notification.id, status: 'failed', method: 'whatsapp', error })
          }
        } else if (notification.delivery_method === 'sms') {
          const smsResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-sms-reminder`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              notificationId: notification.id,
              appointmentId: notification.appointment_id,
              type: notification.type,
            })
          })

          if (smsResponse.ok) {
            results.push({ notificationId: notification.id, status: 'sent', method: 'sms' })
          } else {
            const error = await smsResponse.text()
            results.push({ notificationId: notification.id, status: 'failed', method: 'sms', error })
          }
        } else if (notification.delivery_method === 'push') {
          // For push notifications, you would integrate with Firebase Cloud Messaging
          // or another push notification service
          // For now, we'll mark as sent (implement push notifications separately)
          await supabaseClient
            .from('notifications')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
            })
            .eq('id', notification.id)

          results.push({
            notificationId: notification.id,
            status: 'sent',
            method: 'push',
            note: 'Push notifications not implemented yet'
          })
        } else if (notification.delivery_method === 'browser') {
          // For browser notifications, we'll mark as sent
          // The actual browser notification will be shown by the web app when the user is online
          await supabaseClient
            .from('notifications')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
            })
            .eq('id', notification.id)

          results.push({
            notificationId: notification.id,
            status: 'sent',
            method: 'browser'
          })
        }

      } catch (error) {
        console.error(`Failed to process notification ${notification.id}:`, error)
        
        // Mark notification as failed
        await supabaseClient
          .from('notifications')
          .update({
            status: 'failed',
            error_message: error.message
          })
          .eq('id', notification.id)

        results.push({
          notificationId: notification.id,
          status: 'failed',
          error: error.message
        })
      }
    }

    // Clean up old processed notifications (older than 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { error: cleanupError } = await supabaseClient
      .from('notifications')
      .delete()
      .in('status', ['sent', 'failed', 'cancelled'])
      .lt('created_at', thirtyDaysAgo.toISOString())

    if (cleanupError) {
      console.error('Failed to clean up old notifications:', cleanupError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results: results,
        message: `Processed ${results.length} notifications`
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
