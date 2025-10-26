/**
 * Utility para gestionar navegación de notificaciones
 * Traduce tipos de notificaciones a rutas/destinos
 */

import type { InAppNotification } from '@/types/types'

export interface NotificationNavigationConfig {
  destination: 'internal' | 'external' | 'modal' | 'none'
  path?: string
  modalType?: string
  modalProps?: Record<string, string | number | boolean | object>
}

/**
 * Convierte valores de data a string de forma segura
 */
function getDataId(data: InAppNotification['data'], key: string): string {
  if (!data) return ''
  const value = data[key as keyof typeof data]
  if (typeof value === 'string') return value
  if (typeof value === 'number') return value.toString()
  return ''
}

/**
 * Maneja notificaciones de aplicaciones a vacantes
 */
function handleJobApplicationNavigation(
  data: InAppNotification['data']
): NotificationNavigationConfig {
  const vacancyId = getDataId(data, 'vacancy_id')
  return {
    destination: 'internal',
    path: vacancyId ? `/mis-empleos/vacante/${vacancyId}` : '/mis-empleos',
    modalType: 'vacancy_applications',
    modalProps: vacancyId ? { vacancyId } : {}
  }
}

/**
 * Maneja notificaciones de citas
 */
function handleAppointmentNavigation(
  data: InAppNotification['data']
): NotificationNavigationConfig {
  const appointmentId = getDataId(data, 'appointment_id')
  return {
    destination: 'internal',
    path: appointmentId ? `/citas/${appointmentId}` : '/citas',
    modalType: 'appointment',
    modalProps: appointmentId ? { appointmentId } : {}
  }
}

/**
 * Maneja notificaciones de chat
 */
function handleChatNavigation(
  data: InAppNotification['data']
): NotificationNavigationConfig {
  const conversationId = getDataId(data, 'conversation_id')
  return {
    destination: 'internal',
    path: conversationId ? `/chat/${conversationId}` : '/chat',
    modalType: 'chat',
    modalProps: conversationId ? { conversationId } : {}
  }
}

/**
 * Maneja notificaciones de solicitudes de empleados
 */
function handleEmployeeRequestNavigation(
  data: InAppNotification['data']
): NotificationNavigationConfig {
  const requestId = getDataId(data, 'request_id')
  return {
    destination: 'internal',
    path: requestId ? `/admin/empleados/solicitudes/${requestId}` : '/admin/empleados',
    modalType: 'employee_request',
    modalProps: requestId ? { requestId } : {}
  }
}

/**
 * Maneja notificaciones de reseñas
 */
function handleReviewsNavigation(
  data: InAppNotification['data']
): NotificationNavigationConfig {
  const businessId = getDataId(data, 'business_id')
  return {
    destination: 'internal',
    path: businessId ? `/negocio/${businessId}/resenas` : '/negocios',
    modalType: 'reviews',
    modalProps: businessId ? { businessId } : {}
  }
}

/**
 * Maneja notificaciones de solicitudes de ausencia
 */
function handleAbsenceRequestNavigation(
  data: InAppNotification['data']
): NotificationNavigationConfig {
  const absenceId = getDataId(data, 'absenceId')
  return {
    destination: 'internal',
    path: '/admin',
    modalType: 'absence_approval',
    modalProps: absenceId ? { absenceId } : {}
  }
}

/**
 * Obtiene la configuración de navegación basada en tipo de notificación
 */
export function getNotificationNavigation(
  notification: InAppNotification
): NotificationNavigationConfig {
  const { type, data, action_url } = notification

  // Notificaciones de aplicaciones a vacantes
  if (type === 'job_application_new') {
    return handleJobApplicationNavigation(data)
  }

  // Notificaciones de citas
  if (type?.startsWith('appointment_') || type?.startsWith('reminder_')) {
    return handleAppointmentNavigation(data)
  }

  // Notificaciones de chat
  if (type === 'chat_message') {
    return handleChatNavigation(data)
  }

  // Notificaciones de empleados (solicitudes)
  if (
    type === 'employee_request_new' ||
    type === 'employee_request_accepted' ||
    type === 'employee_request_rejected'
  ) {
    return handleEmployeeRequestNavigation(data)
  }

  // Notificaciones de reseñas
  if (type === 'daily_digest' || type === 'weekly_summary') {
    return handleReviewsNavigation(data)
  }

  // Notificaciones de solicitudes de ausencia
  if (type === 'absence_request') {
    return handleAbsenceRequestNavigation(data)
  }

  // Notificaciones de sistema (si tienen action_url)
  if (type?.startsWith('system_') && action_url) {
    return {
      destination: 'external',
      path: action_url
    }
  }

  // Default: sin navegación
  return {
    destination: 'none'
  }
}

export function handleNotificationNavigation(
  notification: InAppNotification,
  navigate: (path: string) => void,
  options?: {
    openModal?: (type: string, props: Record<string, string | number | boolean | object>) => void
  }
): void {
  const config = getNotificationNavigation(notification)

  switch (config.destination) {
    case 'internal':
      if (config.path) {
        navigate(config.path)
      }
      // También abrir modal si se especifica
      if (config.modalType && options?.openModal) {
        options.openModal(config.modalType, config.modalProps || {})
      }
      break

    case 'external':
      if (config.path) {
        window.open(config.path, '_blank')
      }
      break

    case 'modal':
      if (config.modalType && options?.openModal) {
        options.openModal(config.modalType, config.modalProps || {})
      }
      break

    case 'none':
    default:
      // No hacer nada
      break
  }
}

/**
 * Obtiene un label amigable para el tipo de notificación
 */
export function getNotificationTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    // Aplicaciones
    'job_application_new': 'Nueva aplicación',
    'job_application_received': 'Aplicación recibida',
    'job_application_accepted': 'Aplicación aceptada',
    'job_application_rejected': 'Aplicación rechazada',
    
    // Citas
    'appointment_created': 'Cita creada',
    'appointment_confirmed': 'Cita confirmada',
    'appointment_cancelled': 'Cita cancelada',
    'appointment_rescheduled': 'Cita reprogramada',
    'appointment_reminder': 'Recordatorio de cita',
    'reminder_24h': 'Recordatorio (24h)',
    'reminder_1h': 'Recordatorio (1h)',
    'reminder_15m': 'Recordatorio (15m)',
    
    // Chat
    'chat_message': 'Nuevo mensaje',
    'chat_message_received': 'Mensaje recibido',
    
    // Empleados
    'employee_request_new': 'Nueva solicitud de empleado',
    'employee_request_pending': 'Solicitud pendiente',
    'employee_request_approved': 'Solicitud aprobada',
    'employee_request_rejected': 'Solicitud rechazada',
    
    // Ausencias
    'absence_request': 'Nueva solicitud de ausencia',
    
    // Reseñas
    'review_received': 'Nueva reseña',
    'review_response_received': 'Respuesta a reseña',
    
    // Sistema
    'system_announcement': 'Anuncio del sistema',
    'system_update': 'Actualización disponible',
    'system_maintenance': 'Mantenimiento programado'
  }

  return labels[type] || type
}

/**
 * Obtiene un icono recomendado para el tipo de notificación
 */
export function getNotificationTypeIcon(type: string) {
  if (type?.startsWith('job_application')) return 'briefcase'
  if (type?.startsWith('appointment') || type?.startsWith('reminder')) return 'calendar'
  if (type?.startsWith('absence')) return 'calendar'
  if (type?.startsWith('chat')) return 'message-circle'
  if (type?.startsWith('employee')) return 'users'
  if (type?.startsWith('review')) return 'star'
  if (type?.startsWith('system')) return 'alert-circle'
  return 'bell'
}
