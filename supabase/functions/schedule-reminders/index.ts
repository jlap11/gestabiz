import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const { appointmentId } = await req.json()

    if (!appointmentId) {
      throw new Error('Appointment ID is required')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get appointment details
    const { data: appointment, error: appointmentError } = await supabaseClient
      .from('appointments')
      .select(`
        *,
        clients (name, email, phone),
        users (email, name)
      `)
      .eq('id', appointmentId)
      .single()

    if (appointmentError || !appointment) {
      throw new Error(`Appointment not found: ${appointmentError?.message}`)
    }

    // Get user notification settings
    const { data: settings } = await supabaseClient
      .from('notification_settings')
      .select('*')
      .eq('user_id', appointment.user_id)
      .single()

    // Use default settings if none exist
    const reminderTimes = settings?.reminder_times || [1440, 60] // 24h and 1h before

    const results = []

    // Schedule reminders
    for (const minutes of reminderTimes) {
      const appointmentDateTime = new Date(appointment.start_datetime)
      const reminderDateTime = new Date(appointmentDateTime.getTime() - minutes * 60000)

      // Only schedule if reminder time is in the future
      if (reminderDateTime > new Date()) {
        // Email reminder
        if (settings?.email_reminders !== false) {
          const { error: emailError } = await supabaseClient
            .from('notification_queue')
            .insert({
              user_id: appointment.user_id,
              appointment_id: appointmentId,
              type: 'reminder',
              method: 'email',
              scheduled_for: reminderDateTime.toISOString(),
              status: 'pending'
            })

          if (emailError) {
            console.error('Error scheduling email reminder:', emailError)
          } else {
            results.push({
              type: 'reminder',
              method: 'email',
              scheduled_for: reminderDateTime.toISOString(),
              minutes_before: minutes
            })
          }
        }

        // SMS reminder (if enabled and phone number available)
        if (settings?.sms_reminders && appointment.clients.phone) {
          const { error: smsError } = await supabaseClient
            .from('notification_queue')
            .insert({
              user_id: appointment.user_id,
              appointment_id: appointmentId,
              type: 'reminder',
              method: 'sms',
              scheduled_for: reminderDateTime.toISOString(),
              status: 'pending'
            })

          if (smsError) {
            console.error('Error scheduling SMS reminder:', smsError)
          } else {
            results.push({
              type: 'reminder',
              method: 'sms',
              scheduled_for: reminderDateTime.toISOString(),
              minutes_before: minutes
            })
          }
        }
      }
    }

    // Schedule confirmation notification (if enabled)
    if (settings?.appointment_confirmations !== false) {
      const { error: confirmationError } = await supabaseClient
        .from('notification_queue')
        .insert({
          user_id: appointment.user_id,
          appointment_id: appointmentId,
          type: 'confirmation',
          method: 'email',
          scheduled_for: new Date().toISOString(), // Send immediately
          status: 'pending'
        })

      if (!confirmationError) {
        results.push({
          type: 'confirmation',
          method: 'email',
          scheduled_for: new Date().toISOString()
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        appointmentId,
        scheduledNotifications: results.length,
        notifications: results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error in schedule-reminders function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})