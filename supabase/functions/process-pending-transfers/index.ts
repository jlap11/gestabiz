import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Edge Function: process-pending-transfers
 *
 * Propósito: Procesar traslados pendientes cuya fecha efectiva ya pasó.
 *            Esta función debe ejecutarse como CRON job cada hora.
 *
 * Acciones:
 *   1. Buscar traslados pendientes con transfer_effective_date <= NOW()
 *   2. Actualizar location_id a la nueva sede
 *   3. Cambiar transfer_status a 'completed'
 *   4. Limpiar campos de transición
 *   5. Notificar al empleado
 *
 * CRON: 0 * * * * (cada hora en punto)
 */

serve(async req => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔄 [CRON] Iniciando proceso de traslados pendientes')

    // Crear cliente Supabase con service_role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const now = new Date().toISOString()

    // 1. Buscar traslados pendientes cuya fecha efectiva ya pasó
    const { data: pendingTransfers, error: fetchError } = await supabase
      .from('business_employees')
      .select(
        `
        id,
        employee_id,
        business_id,
        location_id,
        transfer_from_location_id,
        transfer_to_location_id,
        transfer_effective_date,
        locations!business_employees_transfer_to_location_id_fkey (name)
      `
      )
      .eq('transfer_status', 'pending')
      .lte('transfer_effective_date', now)

    if (fetchError) {
      console.error('❌ Error al buscar traslados pendientes:', fetchError)
      throw fetchError
    }

    if (!pendingTransfers || pendingTransfers.length === 0) {
      console.log('✅ No hay traslados pendientes para procesar')
      return new Response(
        JSON.stringify({
          success: true,
          processedCount: 0,
          message: 'No pending transfers to process',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`📋 ${pendingTransfers.length} traslados encontrados para procesar`)

    let processedCount = 0
    const errors: Array<{ id: string; error: string }> = []

    // 2. Procesar cada traslado
    for (const transfer of pendingTransfers) {
      try {
        console.log(`🔄 Procesando traslado ${transfer.id}`)

        // Actualizar empleado a nueva sede
        const { error: updateError } = await supabase
          .from('business_employees')
          .update({
            location_id: transfer.transfer_to_location_id,
            transfer_status: 'completed',
            // Limpiar campos de transición (mantener en historial comentado)
            // transfer_from_location_id: null,
            // transfer_to_location_id: null,
            // transfer_effective_date: null,
            // transfer_notice_period_days: null,
            // transfer_scheduled_at: null,
            // transfer_scheduled_by: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', transfer.id)

        if (updateError) {
          console.error(`❌ Error al actualizar traslado ${transfer.id}:`, updateError)
          errors.push({ id: transfer.id, error: updateError.message })
          continue
        }

        console.log(`✅ Traslado ${transfer.id} completado exitosamente`)

        // 3. Notificar al empleado
        const newLocationName = transfer.locations?.name || 'Nueva sede'

        const { error: notifError } = await supabase.from('in_app_notifications').insert({
          user_id: transfer.employee_id,
          type: 'transfer_completed',
          title: 'Traslado completado',
          message: `Tu traslado a ${newLocationName} se ha completado exitosamente. Ya estás operativo en tu nueva sede.`,
          data: {
            business_employee_id: transfer.id,
            new_location_id: transfer.transfer_to_location_id,
            new_location_name: newLocationName,
            completed_at: now,
          },
          read: false,
        })

        if (notifError) {
          console.error(`⚠️ Error al enviar notificación a ${transfer.employee_id}:`, notifError)
        } else {
          console.log(`📬 Notificación enviada a empleado ${transfer.employee_id}`)
        }

        processedCount++
      } catch (error) {
        console.error(`❌ Error al procesar traslado ${transfer.id}:`, error)
        errors.push({ id: transfer.id, error: error.message })
      }
    }

    console.log(
      `✅ Proceso completado: ${processedCount}/${pendingTransfers.length} traslados procesados`
    )

    if (errors.length > 0) {
      console.error('⚠️ Errores encontrados:', errors)
    }

    return new Response(
      JSON.stringify({
        success: true,
        processedCount,
        totalFound: pendingTransfers.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('❌ Error en process-pending-transfers:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
