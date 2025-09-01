// Supabase Edge Function: sync-appointments
// File: supabase/functions/sync-appointments/index.ts

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { method } = req
    const url = new URL(req.url)
    const userId = url.searchParams.get('user_id')

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'user_id parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    switch (method) {
      case 'GET':
        // Get user's appointments for browser extension
        const { data: appointments, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'scheduled')
          .gte('start_time', new Date().toISOString())
          .order('start_time', { ascending: true })
          .limit(5)

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true, appointments }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'POST':
        // Create new appointment
        const appointmentData = await req.json()
        
        const { data: newAppointment, error: createError } = await supabase
          .from('appointments')
          .insert({
            ...appointmentData,
            user_id: userId
          })
          .select()
          .single()

        if (createError) throw createError

        return new Response(
          JSON.stringify({ success: true, appointment: newAppointment }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'PUT':
        // Update appointment
        const updateData = await req.json()
        const appointmentId = url.searchParams.get('appointment_id')

        if (!appointmentId) {
          return new Response(
            JSON.stringify({ error: 'appointment_id parameter is required for updates' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { data: updatedAppointment, error: updateError } = await supabase
          .from('appointments')
          .update(updateData)
          .eq('id', appointmentId)
          .eq('user_id', userId)
          .select()
          .single()

        if (updateError) throw updateError

        return new Response(
          JSON.stringify({ success: true, appointment: updatedAppointment }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('Error in sync-appointments function:', error)
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})