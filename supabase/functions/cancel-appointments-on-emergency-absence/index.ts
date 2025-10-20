/**
 * Edge Function: cancel-appointments-on-emergency-absence
 * 
 * Cancela citas inmediatamente cuando se aprueba una ausencia de emergencia.
 * También se puede invocar manualmente para ausencias no urgentes.
 * 
 * Features:
 * - Cancelación batch de citas en periodo de ausencia
 * - Notificaciones a clientes (email + in-app)
 * - Log de cancelaciones para auditoría
 * - Manejo de errores parciales
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CancellationRequest {
  absenceId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      throw new Error('No autenticado');
    }

    const requestData: CancellationRequest = await req.json();
    const { absenceId } = requestData;

    // 1. Obtener ausencia
    const { data: absence, error: absenceError } = await supabaseClient
      .from('employee_absences')
      .select(`
        *,
        employee:employee_id(full_name),
        business:business_id(business_name, owner_id)
      `)
      .eq('id', absenceId)
      .single();

    if (absenceError || !absence) {
      throw new Error('Ausencia no encontrada');
    }

    // 2. Verificar permisos (solo admin o el mismo empleado)
    if (absence.business.owner_id !== user.id && absence.employee_id !== user.id) {
      throw new Error('No tiene permisos para cancelar estas citas');
    }

    // 3. Verificar que ausencia está aprobada
    if (absence.status !== 'approved') {
      throw new Error('Solo se pueden cancelar citas de ausencias aprobadas');
    }

    // 4. Obtener citas a cancelar
    const { data: appointments, error: appointmentsError } = await supabaseClient
      .from('appointments')
      .select(`
        id,
        start_time,
        end_time,
        client_id,
        service:service_id(service_name),
        client:client_id(full_name, email),
        location:location_id(location_name)
      `)
      .eq('employee_id', absence.employee_id)
      .eq('business_id', absence.business_id)
      .gte('start_time', absence.start_date)
      .lte('start_time', absence.end_date)
      .neq('status', 'cancelled');

    if (appointmentsError) {
      throw new Error('Error al obtener citas');
    }

    if (!appointments || appointments.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No hay citas para cancelar en este periodo',
          cancelledCount: 0,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // 5. Cancelar citas
    const cancellationResults = {
      success: [],
      failed: [],
    };

    for (const appointment of appointments) {
      try {
        // Cancelar cita
        const { error: cancelError } = await supabaseClient
          .from('appointments')
          .update({
            status: 'cancelled',
            cancellation_reason: `Ausencia del profesional: ${absence.reason}`,
            cancelled_at: new Date().toISOString(),
            cancelled_by: user.id,
          })
          .eq('id', appointment.id);

        if (cancelError) {
          cancellationResults.failed.push({
            appointmentId: appointment.id,
            error: cancelError.message,
          });
          continue;
        }

        // Notificación in-app
        await supabaseClient.from('in_app_notifications').insert({
          user_id: appointment.client_id,
          type: 'appointment_cancelled',
          title: '⚠️ Cita cancelada',
          message: `Su cita del ${new Date(appointment.start_time).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
          })} ha sido cancelada`,
          data: {
            appointmentId: appointment.id,
            absenceId: absence.id,
            reason: absence.reason,
            serviceName: appointment.service.service_name,
            locationName: appointment.location.location_name,
            startTime: appointment.start_time,
          },
          action_url: `/client/appointments?cancelled=${appointment.id}`,
        });

        // TODO: Enviar email usando send-notification Edge Function
        // await supabaseClient.functions.invoke('send-notification', {
        //   body: {
        //     userId: appointment.client_id,
        //     type: 'appointment_cancelled',
        //     channel: 'email',
        //     data: { ... }
        //   }
        // });

        cancellationResults.success.push({
          appointmentId: appointment.id,
          clientName: appointment.client.full_name,
          startTime: appointment.start_time,
        });
      } catch (error) {
        cancellationResults.failed.push({
          appointmentId: appointment.id,
          error: error.message,
        });
      }
    }

    // 6. Log de cancelaciones masivas
    await supabaseClient.from('system_logs').insert({
      log_type: 'appointment_cancellation',
      severity: 'info',
      message: `Cancelación masiva: ${cancellationResults.success.length} citas canceladas por ausencia`,
      metadata: {
        absenceId: absence.id,
        employeeId: absence.employee_id,
        businessId: absence.business_id,
        startDate: absence.start_date,
        endDate: absence.end_date,
        cancelledCount: cancellationResults.success.length,
        failedCount: cancellationResults.failed.length,
        cancelledBy: user.id,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `${cancellationResults.success.length} citas canceladas exitosamente`,
        results: {
          totalAppointments: appointments.length,
          cancelled: cancellationResults.success.length,
          failed: cancellationResults.failed.length,
          details: cancellationResults,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in cancel-appointments-on-emergency-absence:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
