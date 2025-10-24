/**
 * Analytics Service
 *
 * Sistema de tracking de eventos para chat y notificaciones.
 * Soporta múltiples proveedores (Google Analytics, Mixpanel, etc.)
 * y modo dev para debugging.
 *
 * Features:
 * - Tracking de eventos con propiedades
 * - Soporte múltiples proveedores
 * - Modo dev con logs en consola
 * - Type-safe events
 * - Privacy-first (respeta DNT)
 */

// ==================== TIPOS ====================

export type AnalyticsProvider = 'google' | 'mixpanel' | 'custom' | 'console'

export interface AnalyticsConfig {
  /** Habilitar/deshabilitar analytics globalmente */
  enabled: boolean
  /** Proveedores activos */
  providers: AnalyticsProvider[]
  /** Respetar Do Not Track del navegador */
  respectDNT: boolean
  /** Modo debug (logs en consola) */
  debug: boolean
}

export interface AnalyticsEvent {
  /** Categoría del evento (chat, notifications, etc.) */
  category: string
  /** Acción realizada (send, read, open, etc.) */
  action: string
  /** Label opcional para contexto adicional */
  label?: string
  /** Valor numérico opcional */
  value?: number
  /** Propiedades adicionales */
  properties?: Record<string, string | number | boolean>
}

// ==================== EVENTOS PREDEFINIDOS ====================

export const ChatEvents = {
  MESSAGE_SENT: 'message_sent',
  MESSAGE_EDITED: 'message_edited',
  MESSAGE_DELETED: 'message_deleted',
  MESSAGE_REPLIED: 'message_replied',
  CONVERSATION_OPENED: 'conversation_opened',
  CONVERSATION_ARCHIVED: 'conversation_archived',
  CONVERSATION_MUTED: 'conversation_muted',
  CONVERSATION_PINNED: 'conversation_pinned',
  TYPING_STARTED: 'typing_started',
  ATTACHMENT_SENT: 'attachment_sent',
  SEARCH_PERFORMED: 'search_performed',
} as const

export const NotificationEvents = {
  NOTIFICATION_RECEIVED: 'notification_received',
  NOTIFICATION_READ: 'notification_read',
  NOTIFICATION_CLICKED: 'notification_clicked',
  NOTIFICATION_ARCHIVED: 'notification_archived',
  NOTIFICATION_DELETED: 'notification_deleted',
  NOTIFICATION_CENTER_OPENED: 'notification_center_opened',
  NOTIFICATION_CENTER_CLOSED: 'notification_center_closed',
  ALL_NOTIFICATIONS_READ: 'all_notifications_read',
} as const

// ==================== CONFIGURACIÓN ====================

const defaultConfig: AnalyticsConfig = {
  enabled: import.meta.env.PROD, // Solo en producción por defecto
  providers: ['console'], // Console logger por defecto
  respectDNT: true,
  debug: import.meta.env.DEV,
}

let config: AnalyticsConfig = { ...defaultConfig }

/**
 * Configurar analytics
 */
export function configureAnalytics(newConfig: Partial<AnalyticsConfig>) {
  config = { ...config, ...newConfig }

  if (config.debug) {
    // eslint-disable-next-line no-console
    console.log('[Analytics] Configured:', config)
  }
}

/**
 * Verificar si analytics está habilitado
 */
function isAnalyticsEnabled(): boolean {
  // Respetar Do Not Track
  if (config.respectDNT && navigator.doNotTrack === '1') {
    return false
  }

  return config.enabled
}

// ==================== TRACKING ====================

/**
 * Track event genérico
 */
export function trackEvent(event: AnalyticsEvent) {
  if (!isAnalyticsEnabled()) {
    return
  }

  const { category, action, label, value, properties } = event

  // Log en consola si debug está habilitado
  if (config.debug) {
    // eslint-disable-next-line no-console
    console.log('[Analytics]', {
      category,
      action,
      label,
      value,
      properties,
      timestamp: new Date().toISOString(),
    })
  }

  // Enviar a cada proveedor activo
  config.providers.forEach(provider => {
    try {
      switch (provider) {
        case 'google':
          trackGoogleAnalytics(event)
          break
        case 'mixpanel':
          trackMixpanel(event)
          break
        case 'console':
          // Ya logueado arriba si debug=true
          break
        case 'custom':
          // Placeholder para custom provider
          break
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`[Analytics] Error tracking to ${provider}:`, error)
    }
  })
}

/**
 * Track event de chat
 */
export function trackChatEvent(
  action: string,
  properties?: Record<string, string | number | boolean>
) {
  trackEvent({
    category: 'chat',
    action,
    properties,
  })
}

/**
 * Track event de notificaciones
 */
export function trackNotificationEvent(
  action: string,
  properties?: Record<string, string | number | boolean>
) {
  trackEvent({
    category: 'notifications',
    action,
    properties,
  })
}

// ==================== PROVEEDORES ====================

/**
 * Track a Google Analytics (GA4)
 */
function trackGoogleAnalytics(event: AnalyticsEvent) {
  if (typeof window === 'undefined' || !window.gtag) {
    return
  }

  const { category, action, label, value, properties } = event

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value,
    ...properties,
  })
}

/**
 * Track a Mixpanel
 */
function trackMixpanel(event: AnalyticsEvent) {
  if (typeof window === 'undefined' || !window.mixpanel) {
    return
  }

  const { action, properties } = event

  window.mixpanel.track(action, properties)
}

// ==================== UTILIDADES ====================

/**
 * Track timing (performance metrics)
 */
export function trackTiming(category: string, variable: string, value: number, label?: string) {
  if (!isAnalyticsEnabled()) {
    return
  }

  if (config.debug) {
    // eslint-disable-next-line no-console
    console.log('[Analytics] Timing:', { category, variable, value, label })
  }

  if (window.gtag) {
    window.gtag('event', 'timing_complete', {
      name: variable,
      value,
      event_category: category,
      event_label: label,
    })
  }
}

/**
 * Track error
 */
export function trackError(category: string, message: string, fatal: boolean = false) {
  if (!isAnalyticsEnabled()) {
    return
  }

  trackEvent({
    category,
    action: 'error',
    label: message,
    properties: { fatal },
  })
}

// ==================== TYPES GLOBALES ====================

declare global {
  interface Window {
    gtag?: (command: string, targetId: string, config?: Record<string, unknown>) => void
    mixpanel?: {
      track: (event: string, properties?: Record<string, unknown>) => void
    }
  }
}

// ==================== EXPORTS ====================

export default {
  configure: configureAnalytics,
  trackEvent,
  trackChatEvent,
  trackNotificationEvent,
  trackTiming,
  trackError,
  ChatEvents,
  NotificationEvents,
}
