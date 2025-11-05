// Supabase Edge Function: Send WhatsApp Reminders
// Deploy with: npx supabase functions deploy send-whatsapp-reminder

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    }
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { notificationId, appointmentId } = await req.json()
    if (!notificationId || !appointmentId) {
      throw new Error('notificationId and appointmentId are required')
    }

    // Fetch appointment with client contact and business_id
    const { data: appointment, error: apptErr } = await supabase
      .from('appointments')
      .select(`
        id, title, start_time, business_id,
        client:profiles!client_id(id, full_name, phone, whatsapp)
      `)
      .eq('id', appointmentId)
      .single()
    if (apptErr || !appointment) throw new Error('Appointment not found')

    // Business-level channel gating
    const { data: bizSettings, error: bizErr } = await supabase
      .from('business_notification_settings')
      .select('*')
      .eq('business_id', appointment.business_id)
      .single()

    if (bizErr) {
      await supabase
        .from('notifications')
        .update({ status: 'cancelled', error_message: 'Business settings not found for WhatsApp channel' })
        .eq('id', notificationId)
      return new Response(JSON.stringify({ success: false, error: 'Business settings not found' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    const notifTypes = (bizSettings?.notification_types ?? {}) as Record<string, { enabled?: boolean; channels?: string[] }>
    const reminderCfg = notifTypes['appointment_reminder'] || { enabled: true, channels: ['email', 'whatsapp'] }
    const waAllowed = Boolean(bizSettings?.whatsapp_enabled) && Boolean(reminderCfg.enabled) && (reminderCfg.channels || []).includes('whatsapp')
    if (!waAllowed) {
      await supabase
        .from('notifications')
        .update({ status: 'cancelled', error_message: 'WhatsApp disabled by business settings' })
        .eq('id', notificationId)
      return new Response(JSON.stringify({ success: false, error: 'WhatsApp disabled by business settings' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    const phoneRaw = appointment.client?.whatsapp ?? appointment.client?.phone ?? ''
    const phoneDigits = String(phoneRaw).replace(/\D/g, '')
    if (!phoneDigits) throw new Error('Client phone/WhatsApp not available')

    const msg = `Hola ${appointment.client?.full_name ?? ''}, te recordamos tu cita a las ${new Date(appointment.start_time).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}.`

    // Example integration with Twilio WhatsApp if configured
    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')
    const TWILIO_WHATSAPP_NUMBER = Deno.env.get('TWILIO_WHATSAPP_NUMBER')

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER) {
      throw new Error('WhatsApp provider not configured')
    }

    const to = `whatsapp:+${phoneDigits}`
    const from = `whatsapp:${TWILIO_WHATSAPP_NUMBER}`

    // Twilio API call
    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)
    const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: 'POST',
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ To: to, From: from, Body: msg })
    })
    if (!resp.ok) {
      const txt = await resp.text()
      throw new Error(`Failed to send WhatsApp: ${txt}`)
    }

    await supabase
      .from('notifications')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', notificationId)

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
  } catch (error) {
    // Best-effort failure mark
    try {
      const cloned = await req.clone().json().catch(() => null)
      const nid = cloned?.notificationId
      if (nid) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )
        await supabase
          .from('notifications')
          .update({ status: 'failed', error_message: String(error) })
          .eq('id', nid)
      }
    } catch (_) {}

    return new Response(JSON.stringify({ success: false, error: String(error) }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
  }
})
