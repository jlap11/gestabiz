import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendBrevoEmail, createBasicEmailTemplate } from '../_shared/brevo.ts'

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
    // Initialize Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const now = new Date()
    const nowIso = now.toISOString()

    console.log(`Running appointment status updater at ${nowIso}`)
    console.log(`Marking appointments as no_show when auto_no_show_at or end_time <= now`)

    // Marcar citas como 'no_show' si su ventana de auto-no-show pasó
    // o si la cita ya terminó y no se marcó como completada/cancelada
    const { data: noShowAppointments, error: noShowError } = await supabase
      .from('appointments')
      .update({ 
        status: 'no_show',
        updated_at: nowIso
      })
      .in('status', ['confirmed', 'in_progress'])
      .or(`auto_no_show_at.lte.${nowIso},end_time.lte.${nowIso}`)
      .select('id, client_id, start_time, end_time')

    if (noShowError) {
      console.error('Error updating no-show appointments:', noShowError)
    } else {
      console.log(`Updated ${noShowAppointments?.length || 0} no-show appointments`)
    }

    // Nota: la inserción de notificaciones se omite aquí para evitar desalineaciones
    // con enums divergentes de notificaciones. Se puede reactivar cuando estén unificados.
    const totalUpdated = noShowAppointments?.length || 0
    if (totalUpdated > 0) {
      console.log(`Total appointments marked as no_show: ${totalUpdated}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Appointment status update completed',
        stats: {
          no_show_appointments: noShowAppointments?.length || 0,
          total_updated: totalUpdated
        },
        timestamp: now.toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in appointment status updater:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
