/**
 * Sistema de mapeo de notificaciones a roles
 * Permite cambio automático de rol antes de navegar
 */

import type { InAppNotification } from '@/types/types'

export type UserRole = 'admin' | 'employee' | 'client'

export interface RoleNavigationConfig {
  /** Rol requerido para esta navegación */
  requiredRole: UserRole
  /** Ruta dentro del dashboard del rol */
  path: string
  /** Página/vista específica dentro del dashboard */
  page?: string
  /** Contexto adicional para pasar al componente */
  context?: Record<string, unknown>
}

/**
 * Mapa de tipos de notificación a configuración de rol y navegación
 */
const NOTIFICATION_ROLE_MAP: Record<string, RoleNavigationConfig> = {
  // ========================================
  // ADMIN ROLE - Notificaciones de negocio
  // ========================================
  'job_application_new': {
    requiredRole: 'admin',
    path: '/admin',
    page: 'recruitment', // Cambiado de 'vacancies' a 'recruitment'
    context: {} // vacancy_id se añade dinámicamente
  },
  'job_application_received': {
    requiredRole: 'admin',
    path: '/admin',
    page: 'recruitment', // Cambiado de 'vacancies' a 'recruitment'
    context: {}
  },
  'employee_request_new': {
    requiredRole: 'admin',
    path: '/admin',
    page: 'employees',
    context: {}
  },
  'employee_request_pending': {
    requiredRole: 'admin',
    path: '/admin',
    page: 'employees',
    context: {}
  },
  'review_received': {
    requiredRole: 'admin',
    path: '/admin',
    page: 'reviews',
    context: {}
  },
  'business_verification_approved': {
    requiredRole: 'admin',
    path: '/admin',
    page: 'settings',
    context: {}
  },
  'business_verification_rejected': {
    requiredRole: 'admin',
    path: '/admin',
    page: 'settings',
    context: {}
  },

  // ========================================
  // EMPLOYEE ROLE - Notificaciones de empleado
  // ========================================
  'employee_request_approved': {
    requiredRole: 'employee',
    path: '/employee',
    page: 'dashboard',
    context: {}
  },
  'employee_request_rejected': {
    requiredRole: 'employee',
    path: '/employee',
    page: 'dashboard',
    context: {}
  },
  'job_application_accepted': {
    requiredRole: 'employee',
    path: '/employee',
    page: 'applications',
    context: {}
  },
  'job_application_rejected': {
    requiredRole: 'employee',
    path: '/employee',
    page: 'applications',
    context: {}
  },
  'shift_assigned': {
    requiredRole: 'employee',
    path: '/employee',
    page: 'schedule',
    context: {}
  },
  'shift_cancelled': {
    requiredRole: 'employee',
    path: '/employee',
    page: 'schedule',
    context: {}
  },

  // ========================================
  // CLIENT ROLE - Notificaciones de cliente
  // ========================================
  'appointment_created': {
    requiredRole: 'client',
    path: '/client',
    page: 'appointments',
    context: {}
  },
  'appointment_confirmed': {
    requiredRole: 'client',
    path: '/client',
    page: 'appointments',
    context: {}
  },
  'appointment_cancelled': {
    requiredRole: 'client',
    path: '/client',
    page: 'appointments',
    context: {}
  },
  'appointment_rescheduled': {
    requiredRole: 'client',
    path: '/client',
    page: 'appointments',
    context: {}
  },
  'appointment_reminder': {
    requiredRole: 'client',
    path: '/client',
    page: 'appointments',
    context: {}
  },
  'reminder_24h': {
    requiredRole: 'client',
    path: '/client',
    page: 'appointments',
    context: {}
  },
  'reminder_1h': {
    requiredRole: 'client',
    path: '/client',
    page: 'appointments',
    context: {}
  },
  'reminder_15m': {
    requiredRole: 'client',
    path: '/client',
    page: 'appointments',
    context: {}
  },

  // ========================================
  // COMPARTIDAS - Se decide por contexto
  // ========================================
  'chat_message': {
    requiredRole: 'client', // Default, se ajusta dinámicamente
    path: '/client',
    page: 'chat',
    context: {}
  },
  'chat_message_received': {
    requiredRole: 'client', // Default, se ajusta dinámicamente
    path: '/client',
    page: 'chat',
    context: {}
  },

  // ========================================
  // SISTEMA - No requieren cambio de rol
  // ========================================
  'system_announcement': {
    requiredRole: 'client', // Cualquier rol puede verlo
    path: '/client',
    page: 'notifications',
    context: {}
  },
  'system_update': {
    requiredRole: 'client',
    path: '/client',
    page: 'notifications',
    context: {}
  },
  'system_maintenance': {
    requiredRole: 'client',
    path: '/client',
    page: 'notifications',
    context: {}
  }
}

/**
 * Obtiene la configuración de rol para un tipo de notificación
 */
export function getNotificationRoleConfig(
  notification: InAppNotification
): RoleNavigationConfig | null {
  const config = NOTIFICATION_ROLE_MAP[notification.type]
  
  if (!config) {
    console.warn(`No role mapping found for notification type: ${notification.type}`)
    return null
  }

  // Clonar config para no mutar el original
  const roleConfig: RoleNavigationConfig = {
    ...config,
    context: { ...config.context }
  }

  // Añadir IDs relevantes al contexto desde notification.data
  if (notification.data) {
    if (notification.data.vacancy_id) {
      roleConfig.context!.vacancyId = notification.data.vacancy_id
    }
    if (notification.data.appointment_id) {
      roleConfig.context!.appointmentId = notification.data.appointment_id
    }
    if (notification.data.conversation_id) {
      roleConfig.context!.conversationId = notification.data.conversation_id
    }
    if (notification.data.request_id) {
      roleConfig.context!.requestId = notification.data.request_id
    }
    if (notification.data.business_id) {
      roleConfig.context!.businessId = notification.data.business_id
    }
  }

  return roleConfig
}

/**
 * Determina si se necesita cambiar de rol para navegar
 */
export function needsRoleSwitch(
  notification: InAppNotification,
  currentRole: UserRole
): boolean {
  const config = getNotificationRoleConfig(notification)
  if (!config) return false
  
  return config.requiredRole !== currentRole
}

/**
 * Obtiene el rol requerido para una notificación
 */
export function getRequiredRole(
  notification: InAppNotification
): UserRole | null {
  const config = getNotificationRoleConfig(notification)
  return config?.requiredRole || null
}

/**
 * Verifica si un usuario tiene acceso a un rol específico
 * (esto debería integrarse con tu sistema de roles existente)
 */
export function userHasRole(
  userId: string,
  role: UserRole,
  userRoles?: UserRole[]
): boolean {
  // Si se pasan los roles del usuario, verificar
  if (userRoles) {
    return userRoles.includes(role)
  }
  
  // Por defecto, todos tienen acceso a client
  if (role === 'client') return true
  
  // Para admin y employee, se necesita verificar en BD
  // Esta función debería integrarse con useUserRoles
  return true // Temporal - implementar verificación real
}

/**
 * Interfaz para el callback de cambio de rol
 */
export type RoleSwitchCallback = (newRole: UserRole) => Promise<void> | void

/**
 * Interfaz para el callback de navegación
 */
export type NavigationCallback = (page: string, context?: Record<string, unknown>) => void

/**
 * Maneja el flujo completo: cambio de rol + navegación
 */
export async function handleNotificationWithRoleSwitch(
  notification: InAppNotification,
  currentRole: UserRole,
  switchRole: RoleSwitchCallback,
  navigate: NavigationCallback,
  options?: {
    /** Roles disponibles del usuario */
    availableRoles?: UserRole[]
    /** Callback de error */
    onError?: (error: Error) => void
    /** Callback de éxito */
    onSuccess?: () => void
  }
): Promise<void> {
  try {
    const config = getNotificationRoleConfig(notification)
    
    if (!config) {
      throw new Error(`No navigation config for notification type: ${notification.type}`)
    }

    const { requiredRole, page, context } = config

    // Verificar que el usuario tenga acceso al rol requerido
    if (options?.availableRoles && !options.availableRoles.includes(requiredRole)) {
      throw new Error(`User does not have access to role: ${requiredRole}`)
    }

    // Si necesita cambiar de rol, guardar navegación pendiente
    if (requiredRole !== currentRole) {
      // eslint-disable-next-line no-console
      console.log(`🔄 Switching role from ${currentRole} to ${requiredRole}`)
      
      // Guardar navegación pendiente en sessionStorage para que persista tras re-render
      const pendingNavigation = {
        page,
        context,
        timestamp: Date.now()
      }
      sessionStorage.setItem('pending-navigation', JSON.stringify(pendingNavigation))
      
      // Cambiar rol (esto causará re-render del layout)
      await switchRole(requiredRole)

      // En este punto el layout se re-renderiza y el nuevo dashboard
      // ejecutará usePendingNavigation para completar el flujo.
      options?.onSuccess?.()
      return
    }

    // Mismo rol, navegar directamente
    if (page) {
      // eslint-disable-next-line no-console
      console.log(`📍 Navigating to page: ${page}`, context)
      navigate(page, context)
    }

    options?.onSuccess?.()
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error handling notification with role switch:', error)
    sessionStorage.removeItem('pending-navigation')
    options?.onError?.(error as Error)
  }
}

/**
 * Obtiene un label descriptivo del rol
 */
export function getRoleLabel(role: UserRole, locale: 'es' | 'en' = 'es'): string {
  const labels: Record<UserRole, Record<string, string>> = {
    admin: { es: 'Administrador', en: 'Administrator' },
    employee: { es: 'Empleado', en: 'Employee' },
    client: { es: 'Cliente', en: 'Client' }
  }
  
  return labels[role]?.[locale] || role
}
