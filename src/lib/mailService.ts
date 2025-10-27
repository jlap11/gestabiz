import { supabase } from '@/lib/supabase'

type SendCancellationParams = {
  appointmentId: string
  businessId: string
  recipientUserId: string
  recipientEmail?: string | null
  recipientName?: string | null
  date: string
  time: string
  service: string
}

/**
 * Servicio de correo centralizado (MVP)
 * Por ahora solo se usa para notificar cancelaciones de citas,
 * forzando envío por email e in-app, ignorando preferencias.
 */
export async function sendAppointmentCancellationNotification(params: SendCancellationParams) {
  const {
    appointmentId,
    businessId,
    recipientUserId,
    recipientEmail,
    recipientName,
    date,
    time,
    service,
  } = params

  const body = {
    type: 'appointment_cancellation' as const,
    recipient_user_id: recipientUserId,
    recipient_email: recipientEmail || undefined,
    recipient_name: recipientName || 'Cliente',
    business_id: businessId,
    appointment_id: appointmentId,
    data: {
      name: recipientName || 'Cliente',
      date,
      time,
      service,
    },
    // Asegura notificación por la app aunque el usuario no tenga prefs configuradas
    // e intenta email si hay correo disponible
    force_channels: ['in_app', 'email'] as const,
    skip_preferences: true,
    // Navegación sugerida en la app (opcional)
    action_url: `/cliente/citas/${appointmentId}`,
    priority: 1,
  }

  return supabase.functions.invoke('send-notification', { body })
}

