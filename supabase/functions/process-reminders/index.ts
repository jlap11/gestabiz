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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Obtener fecha/hora actual
    const now = new Date()
    
    // Buscar citas que necesitan recordatorios
    // Buscaremos citas en las próximas 25 horas (para capturar recordatorios de 24h)
    const futureLimit = new Date(now.getTime() + 25 * 60 * 60 * 1000)
    
    const { data: upcomingAppointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select(`
        id,
        business_id,
        employee_id,
        client_id,
        service_id,
        location_id,
        start_time,
        end_time,
        status,
        reminder_sent,
        notes,
        business:businesses(id, name),
        service:services(id, name, duration, price),
        location:locations(id, name, address),
        client:profiles!client_id(id, full_name, email, phone, whatsapp),
        employee:profiles!employee_id(id, full_name, email, phone)
      `)
      .in('status', ['pending', 'confirmed'])
      .gte('start_time', now.toISOString())
      .lte('start_time', futureLimit.toISOString())
      .order('start_time', { ascending: true })

    if (appointmentsError) {
      throw appointmentsError
    }

    const results = []
    let remindersProcessed = 0
    let remindersSent = 0

    for (const appointment of upcomingAppointments || []) {
      try {
        // Obtener configuración de notificaciones del negocio
        const { data: businessSettings } = await supabase
          .from('business_notification_settings')
          .select('reminder_times, email_enabled, sms_enabled, whatsapp_enabled')
          .eq('business_id', appointment.business_id)
          .single()

        const reminderTimes = businessSettings?.reminder_times || [1440, 60] // Default: 24h y 1h

        // Calcular tiempo hasta la cita (en minutos)
        const appointmentTime = new Date(appointment.start_time)
        const minutesUntilAppointment = Math.floor((appointmentTime.getTime() - now.getTime()) / (1000 * 60))

        // Verificar si algún tiempo de recordatorio coincide
        let shouldSendReminder = false
        let reminderType = ''

        for (const reminderMinutes of reminderTimes) {
          // Permitir un margen de ±5 minutos
          if (Math.abs(minutesUntilAppointment - reminderMinutes) <= 5) {
            shouldSendReminder = true
            reminderType = reminderMinutes >= 1440 ? '24 horas' : 
                          reminderMinutes >= 60 ? '1 hora' : 
                          `${reminderMinutes} minutos`
            break
          }
        }

        if (!shouldSendReminder) {
          continue
        }

        // Verificar si ya se envió recordatorio para este intervalo
        const { data: existingLog } = await supabase
          .from('notification_log')
          .select('id')
          .eq('appointment_id', appointment.id)
          .eq('notification_type', 'appointment_reminder')
          .gte('created_at', new Date(now.getTime() - 10 * 60 * 1000).toISOString()) // Últimos 10 minutos
          .limit(1)

        if (existingLog && existingLog.length > 0) {
          // Ya se envió un recordatorio recientemente
          continue
        }

        remindersProcessed++

        // Enviar notificación al cliente
        const clientNotificationResult = await supabase.functions.invoke('send-notification', {
          body: {
            type: 'appointment_reminder',
            recipient_user_id: appointment.client_id,
            recipient_email: appointment.client?.email,
            recipient_phone: appointment.client?.phone,
            recipient_whatsapp: appointment.client?.whatsapp,
            recipient_name: appointment.client?.full_name,
            business_id: appointment.business_id,
            appointment_id: appointment.id,
            data: {
              name: appointment.client?.full_name,
              business_name: appointment.business?.name,
              date: new Date(appointment.start_time).toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }),
              time: new Date(appointment.start_time).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
              }),
              location: appointment.location?.address || appointment.location?.name || 'Por confirmar',
              service: appointment.service?.name || 'Servicio',
              reminder_time: reminderType
            }
          }
        })

        if (clientNotificationResult.error) {
          throw new Error(`Failed to send client reminder: ${clientNotificationResult.error}`)
        }

        remindersSent++

        // Actualizar appointment para marcar que se envió recordatorio
        if (minutesUntilAppointment <= 60) {
          // Solo marcar como enviado si es el recordatorio final (1 hora o menos)
          await supabase
            .from('appointments')
            .update({ reminder_sent: true })
            .eq('id', appointment.id)
        }

        results.push({
          appointment_id: appointment.id,
          client: appointment.client?.full_name,
          time_until: `${minutesUntilAppointment} minutos`,
          reminder_type: reminderType,
          status: 'sent'
        })

      } catch (error) {
        results.push({
          appointment_id: appointment.id,
          status: 'failed',
          error: (error as Error).message
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed_at: now.toISOString(),
        appointments_checked: upcomingAppointments?.length || 0,
        reminders_processed: remindersProcessed,
        reminders_sent: remindersSent,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: (error as Error).message,
        stack: (error as Error).stack
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
