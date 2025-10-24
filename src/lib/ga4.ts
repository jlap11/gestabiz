/**
 * Google Analytics 4 - Inicialización y Configuración
 *
 * Este archivo maneja la inicialización de GA4 de forma separada del sistema
 * de analytics existente para chat/notificaciones.
 *
 * Uso:
 * - Importar en App.tsx una sola vez
 * - Llamar initializeGA4() en useEffect
 * - Usar hook useAnalytics para tracking
 */

import ReactGA from 'react-ga4'

let isInitialized = false

export function initializeGA4() {
  // Evitar doble inicialización
  if (isInitialized) {
    return
  }

  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID
  const isDevelopment = import.meta.env.DEV

  // No inicializar en desarrollo (a menos que se fuerce)
  const forceInDev = import.meta.env.VITE_GA_FORCE_IN_DEV === 'true'

  if (!measurementId) {
    return
  }

  if (isDevelopment && !forceInDev) {
    return
  }

  try {
    // Inicializar GA4
    ReactGA.initialize(measurementId, {
      gaOptions: {
        siteSpeedSampleRate: 100,
        anonymizeIp: true,
        debug_mode: isDevelopment,
      },
      gtagOptions: {
        anonymize_ip: true,
        cookie_flags: 'SameSite=None;Secure',
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      },
    })

    isInitialized = true

    // Track initial pageview
    ReactGA.send({
      hitType: 'pageview',
      page: window.location.pathname + window.location.search,
    })
  } catch (error) {
    // Silent fail
  }
}

/**
 * Actualizar consentimiento GDPR
 */
export function updateGA4Consent(hasConsent: boolean) {
  if (!isInitialized || typeof window === 'undefined' || !('gtag' in window)) {
    return
  }

  try {
    const gtagFn = window.gtag as (...args: unknown[]) => void

    gtagFn('consent', 'update', {
      analytics_storage: hasConsent ? 'granted' : 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    })
  } catch {
    // Silent fail
  }
}

/**
 * Verificar si GA4 está inicializado
 */
export function isGA4Ready(): boolean {
  return isInitialized
}
