// Supabase Edge Function: process-reminders
// Runs hourly to send 24h and 1h appointment reminders.
// Windowing accounts for half-hour slots: [24h, 24.5h] and [1h, 1.5h].

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Permitir llamadas internas desde cron jobs (sin autenticación externa)
    // La Edge Function usa sus propias variables de entorno de Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const now = new Date()
    const addMinutes = (d: Date, m: number) => new Date(d.getTime() + m * 60 * 1000)

    // Windows to catch hourly cron and half-hour appointments
    const windowStart24h = addMinutes(now, 24 * 60)
    const windowEnd24h = addMinutes(now, 24 * 60 + 30)

    const windowStart1h = addMinutes(now, 60)
    const windowEnd1h = addMinutes(now, 60 + 30)

    // Fetch appointments in both windows
    const { data: appts24h, error: err24 } = await supabase
      .from('appointments')
      .select('*')
      .in('status', ['confirmed', 'scheduled'])
      .gte('start_time', windowStart24h.toISOString())
      .lte('start_time', windowEnd24h.toISOString())

    if (err24) throw new Error(`Failed to fetch 24h window appointments: ${err24.message}`)

    const { data: appts1h, error: err1 } = await supabase
      .from('appointments')
      .select('*')
      .in('status', ['confirmed', 'scheduled'])
      .gte('start_time', windowStart1h.toISOString())
      .lte('start_time', windowEnd1h.toISOString())

    if (err1) throw new Error(`Failed to fetch 1h window appointments: ${err1.message}`)

    const whatsappConfigured = !!(Deno.env.get('TWILIO_ACCOUNT_SID') && Deno.env.get('TWILIO_AUTH_TOKEN') && Deno.env.get('TWILIO_WHATSAPP_NUMBER'))
    const smsConfigured = !!(Deno.env.get('TWILIO_ACCOUNT_SID') && Deno.env.get('TWILIO_AUTH_TOKEN') && Deno.env.get('TWILIO_SMS_NUMBER'))

    const notificationsToCreate: Array<{
      appointment_id: string
      user_id: string | null
      type: 'reminder_24h' | 'reminder_1h'
      title: string
      message: string
      scheduled_for: string
      delivery_method: 'email' | 'whatsapp' | 'sms'
    }> = []

    // Helper to check if notification exists
    const hasNotification = async (appointmentId: string, type: string, delivery?: 'email' | 'whatsapp' | 'sms') => {
      let query = supabase
        .from('notifications')
        .select('id')
        .eq('appointment_id', appointmentId)
        .eq('type', type)
      if (delivery) {
        query = query.eq('delivery_method', delivery)
      }
      const { data } = await query.limit(1)
      return (data ?? []).length > 0
    }

    // Build notifications for 24h window
    for (const appt of appts24h ?? []) {
      // Email siempre a 24h
      const existsEmail24 = await hasNotification(appt.id, 'reminder_24h', 'email')
      if (!existsEmail24) {
        notificationsToCreate.push({
          appointment_id: appt.id,
          user_id: appt.client_id ?? appt.user_id ?? null,
          type: 'reminder_24h',
          title: 'Recordatorio de cita (24h)',
          message: `Tu cita es mañana: ${appt.title ?? ''}`,
          scheduled_for: now.toISOString(),
          delivery_method: 'email',
        })
      }

      // WhatsApp opcional a 24h si está configurado
      if (whatsappConfigured) {
        const existsWa24 = await hasNotification(appt.id, 'reminder_24h', 'whatsapp')
        if (!existsWa24) {
          notificationsToCreate.push({
            appointment_id: appt.id,
            user_id: appt.client_id ?? appt.user_id ?? null,
            type: 'reminder_24h',
            title: 'Recordatorio de cita (24h)',
            message: `Tu cita es mañana: ${appt.title ?? ''}`,
            scheduled_for: now.toISOString(),
            delivery_method: 'whatsapp',
          })
        }
      }

      // SMS opcional a 24h si está configurado
      if (smsConfigured) {
        const existsSms24 = await hasNotification(appt.id, 'reminder_24h', 'sms')
        if (!existsSms24) {
          notificationsToCreate.push({
            appointment_id: appt.id,
            user_id: appt.client_id ?? appt.user_id ?? null,
            type: 'reminder_24h',
            title: 'Recordatorio de cita (24h)',
            message: `Tu cita es mañana: ${appt.title ?? ''}`,
            scheduled_for: now.toISOString(),
            delivery_method: 'sms',
          })
        }
      }
    }

    // Build notifications for 1h window
    for (const appt of appts1h ?? []) {
      // Always schedule email for 1h
      const existsEmail = await hasNotification(appt.id, 'reminder_1h', 'email')
      if (!existsEmail) {
        notificationsToCreate.push({
          appointment_id: appt.id,
          user_id: appt.client_id ?? appt.user_id ?? null,
          type: 'reminder_1h',
          title: 'Recordatorio de cita (1h)',
          message: `Tu cita es en 1 hora: ${appt.title ?? ''}`,
          scheduled_for: now.toISOString(),
          delivery_method: 'email',
        })
      }

      // Schedule WhatsApp only if provider configured
      if (whatsappConfigured) {
        const existsWa = await hasNotification(appt.id, 'reminder_1h', 'whatsapp')
        if (!existsWa) {
          notificationsToCreate.push({
            appointment_id: appt.id,
            user_id: appt.client_id ?? appt.user_id ?? null,
            type: 'reminder_1h',
            title: 'Recordatorio de cita (1h)',
            message: `Tu cita es en 1 hora: ${appt.title ?? ''}`,
            scheduled_for: now.toISOString(),
            delivery_method: 'whatsapp',
          })
        }
      }

      // Schedule SMS only if provider configured
      if (smsConfigured) {
        const existsSms = await hasNotification(appt.id, 'reminder_1h', 'sms')
        if (!existsSms) {
          notificationsToCreate.push({
            appointment_id: appt.id,
            user_id: appt.client_id ?? appt.user_id ?? null,
            type: 'reminder_1h',
            title: 'Recordatorio de cita (1h)',
            message: `Tu cita es en 1 hora: ${appt.title ?? ''}`,
            scheduled_for: now.toISOString(),
            delivery_method: 'sms',
          })
        }
      }
    }

    let created: any[] = []
    if (notificationsToCreate.length > 0) {
      const { data: inserted, error: insertErr } = await supabase
        .from('notifications')
        .insert(
          notificationsToCreate.map(n => ({
            ...n,
            status: 'queued',
          }))
        )
        .select('*')
      if (insertErr) throw new Error(`Failed to insert notifications: ${insertErr.message}`)
      created = inserted ?? []
    }

    // Fire actual senders (dual channel when configured)
    for (const n of created) {
      try {
        if (n.type === 'reminder_24h') {
          if (n.delivery_method === 'whatsapp') {
            await fetch(`${supabaseUrl}/functions/v1/send-whatsapp-reminder`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ notificationId: n.id, appointmentId: n.appointment_id, type: n.type }),
            })
          } else if (n.delivery_method === 'sms') {
            await fetch(`${supabaseUrl}/functions/v1/send-sms-reminder`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ notificationId: n.id, appointmentId: n.appointment_id, type: n.type }),
            })
          } else {
            await fetch(`${supabaseUrl}/functions/v1/send-email-reminder`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ notificationId: n.id, appointmentId: n.appointment_id, type: n.type }),
            })
          }
        } else if (n.type === 'reminder_1h') {
          if (n.delivery_method === 'whatsapp') {
            await fetch(`${supabaseUrl}/functions/v1/send-whatsapp-reminder`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ notificationId: n.id, appointmentId: n.appointment_id, type: n.type }),
            })
          } else if (n.delivery_method === 'sms') {
            await fetch(`${supabaseUrl}/functions/v1/send-sms-reminder`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ notificationId: n.id, appointmentId: n.appointment_id, type: n.type }),
            })
          } else {
            await fetch(`${supabaseUrl}/functions/v1/send-email-reminder`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ notificationId: n.id, appointmentId: n.appointment_id, type: n.type }),
            })
          }
        }
      } catch (sendErr) {
        // Mark notification failed
        await supabase
          .from('notifications')
          .update({ status: 'failed', error_message: `${sendErr}` })
          .eq('id', n.id)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          window24h: { start: windowStart24h.toISOString(), end: windowEnd24h.toISOString(), count: (appts24h ?? []).length },
          window1h: { start: windowStart1h.toISOString(), end: windowEnd1h.toISOString(), count: (appts1h ?? []).length },
          created: created.length,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
