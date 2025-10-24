import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Edge Function: cancel-future-appointments-on-transfer
 *
 * Propósito: Cancelar automáticamente citas futuras cuando un empleado
 *            programa un traslado de sede, y notificar a los clientes.
 *
 * Input:
 *   - businessEmployeeId: UUID del registro en business_employees
 *   - effectiveDate: Fecha en que el traslado se hace efectivo
 *   - employeeId: UUID del empleado (para notificaciones)
 *
 * Output:
 *   - cancelledCount: Número de citas canceladas
 *   - notificationsSent: Número de notificaciones enviadas
 */

interface RequestBody {
  businessEmployeeId: string
  effectiveDate: string
  employeeId: string
}

serve(async req => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parsear body
    const { businessEmployeeId, effectiveDate, employeeId }: RequestBody = await req.json()

    if (!businessEmployeeId || !effectiveDate || !employeeId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Crear cliente Supabase con service_role key (permisos completos)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('🔄 Iniciando cancelación de citas futuras', {
      businessEmployeeId,
      effectiveDate,
      employeeId,
    })

    // 1. Buscar citas a cancelar (posteriores a fecha efectiva)
    const { data: appointmentsToCancel, error: fetchError } = await supabase
      .from('appointments')
      .select(
        `
        id,
        client_id,
        start_time,
        end_time,
        service_id,
        location_id,
        services (name),
        profiles (name, email),
        locations (name)
      `
      )
      .eq('employee_id', businessEmployeeId)
      .gte('start_time', effectiveDate)
      .in('status', ['pending', 'confirmed'])

    if (fetchError) {
      console.error('❌ Error al buscar citas:', fetchError)
      throw fetchError
    }

    if (!appointmentsToCancel || appointmentsToCancel.length === 0) {
      console.log('✅ No hay citas para cancelar')
      return new Response(
        JSON.stringify({
          success: true,
          cancelledCount: 0,
          notificationsSent: 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`📋 ${appointmentsToCancel.length} citas encontradas para cancelar`)

    // 2. Cancelar citas
    const appointmentIds = appointmentsToCancel.map(apt => apt.id)
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: employeeId,
        cancel_reason: 'Traslado de empleado a otra sede',
      })
      .in('id', appointmentIds)

    if (updateError) {
      console.error('❌ Error al cancelar citas:', updateError)
      throw updateError
    }

    console.log('✅ Citas canceladas exitosamente')

    // 3. Enviar notificaciones in-app a cada cliente
    let notificationsSent = 0

    for (const appointment of appointmentsToCancel) {
      try {
        const appointmentDate = new Date(appointment.start_time).toLocaleDateString('es', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })

        // Notificación in-app
        const { error: notifError } = await supabase.from('in_app_notifications').insert({
          user_id: appointment.client_id,
          type: 'appointment_cancelled_transfer',
          title: 'Cita cancelada por traslado',
          message: `Tu cita del ${appointmentDate} ha sido cancelada debido a un traslado del profesional a otra sede. Disculpa las molestias.`,
          data: {
            appointment_id: appointment.id,
            reason: 'employee_transfer',
            effective_date: effectiveDate,
            service_name: appointment.services?.name,
            location_name: appointment.locations?.name,
          },
          read: false,
        })

        if (notifError) {
          console.error('❌ Error al crear notificación in-app:', notifError)
        } else {
          notificationsSent++
        }

        // 4. Enviar email via send-notification function
        try {
          const emailPayload = {
            user_id: appointment.client_id,
            channel: 'email',
            type: 'appointment_cancelled',
            data: {
              client_name: appointment.profiles?.name,
              client_email: appointment.profiles?.email,
              appointment_date: appointmentDate,
              service_name: appointment.services?.name,
              location_name: appointment.locations?.name,
              cancel_reason: 'Traslado de empleado a otra sede',
            },
          }

          const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify(emailPayload),
          })

          if (!emailResponse.ok) {
            console.error('⚠️ Error al enviar email:', await emailResponse.text())
          } else {
            console.log(`📧 Email enviado a ${appointment.profiles?.email}`)
          }
        } catch (emailError) {
          console.error('⚠️ Error al enviar email:', emailError)
        }
      } catch (error) {
        console.error('⚠️ Error al procesar notificación:', error)
      }
    }

    console.log(
      `✅ Proceso completado: ${appointmentIds.length} citas canceladas, ${notificationsSent} notificaciones enviadas`
    )

    return new Response(
      JSON.stringify({
        success: true,
        cancelledCount: appointmentIds.length,
        notificationsSent,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('❌ Error en cancel-future-appointments-on-transfer:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
