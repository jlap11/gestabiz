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
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000) // 10 minutos atrás

    console.log(`Running appointment status updater at ${now.toISOString()}`)
    console.log(`Checking for appointments that should have started before ${tenMinutesAgo.toISOString()}`)

    // 1. Marcar citas pendientes de confirmación como 'expired' si pasó el deadline
    const { data: expiredConfirmations, error: expiredError } = await supabase
      .from('appointments')
      .update({ 
        status: 'expired',
        updated_at: now.toISOString()
      })
      .eq('status', 'pending_confirmation')
      .lt('confirmation_deadline', now.toISOString())
      .select('id, client_id, appointment_date, appointment_time')

    if (expiredError) {
      console.error('Error updating expired confirmations:', expiredError)
    } else {
      console.log(`Updated ${expiredConfirmations?.length || 0} expired confirmation appointments`)
    }

    // 2. Marcar citas confirmadas como 'no_show' si pasaron 10 minutos de la hora programada
    const { data: noShowAppointments, error: noShowError } = await supabase
      .from('appointments')
      .update({ 
        status: 'no_show',
        updated_at: now.toISOString()
      })
      .eq('status', 'confirmed')
      .lt('appointment_date', tenMinutesAgo.toISOString().split('T')[0])
      .or(`appointment_date.eq.${tenMinutesAgo.toISOString().split('T')[0]},appointment_time.lt.${tenMinutesAgo.toTimeString().split(' ')[0]}`)
      .select('id, client_id, appointment_date, appointment_time')

    if (noShowError) {
      console.error('Error updating no-show appointments:', noShowError)
    } else {
      console.log(`Updated ${noShowAppointments?.length || 0} no-show appointments`)
    }

    // 3. Opcional: Enviar notificaciones sobre cambios de estado
    const totalUpdated = (expiredConfirmations?.length || 0) + (noShowAppointments?.length || 0)
    
    if (totalUpdated > 0) {
      // Aquí podrías agregar lógica para enviar notificaciones
      // a los negocios sobre las citas que cambiaron de estado
      console.log(`Total appointments updated: ${totalUpdated}`)
      
      // Ejemplo de notificación (opcional)
      try {
        const notificationsToInsert = []
        
        // Notificaciones para citas expiradas
        if (expiredConfirmations && expiredConfirmations.length > 0) {
          for (const appointment of expiredConfirmations) {
            notificationsToInsert.push({
              user_id: appointment.client_id,
              type: 'appointment_expired',
              title: 'Cita expirada',
              message: `Tu cita del ${appointment.appointment_date} a las ${appointment.appointment_time} ha expirado por falta de confirmación.`,
              data: { appointment_id: appointment.id },
              created_at: now.toISOString()
            })
          }
        }
        
        // Notificaciones para no-shows
        if (noShowAppointments && noShowAppointments.length > 0) {
          for (const appointment of noShowAppointments) {
            notificationsToInsert.push({
              user_id: appointment.client_id,
              type: 'appointment_no_show',
              title: 'Cita marcada como no asistida',
              message: `Tu cita del ${appointment.appointment_date} a las ${appointment.appointment_time} ha sido marcada como no asistida.`,
              data: { appointment_id: appointment.id },
              created_at: now.toISOString()
            })
          }
        }
        
        if (notificationsToInsert.length > 0) {
          const { error: notificationError } = await supabase
            .from('notifications')
            .insert(notificationsToInsert)
            
          if (notificationError) {
            console.error('Error inserting notifications:', notificationError)
          } else {
            console.log(`Inserted ${notificationsToInsert.length} notifications`)
          }
        }
      } catch (notificationErr) {
        console.error('Error handling notifications:', notificationErr)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Appointment status update completed',
        stats: {
          expired_confirmations: expiredConfirmations?.length || 0,
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