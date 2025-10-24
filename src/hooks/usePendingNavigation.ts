/**
 * Hook para manejar navegaciones pendientes después de cambio de rol
 * Se debe usar en cada Dashboard para procesar navegaciones que se guardaron
 * durante un cambio de rol
 */

import { useEffect } from 'react'
import { logger } from '../lib/logger'

interface PendingNavigation {
  page: string
  context?: Record<string, unknown>
  timestamp: number
}

/**
 * Hook que verifica si hay una navegación pendiente y la ejecuta
 * @param onNavigate - Callback para ejecutar la navegación
 * @param maxAge - Tiempo máximo en ms que una navegación puede estar pendiente (default: 5000ms)
 */
export function usePendingNavigation(
  onNavigate: (page: string, context?: Record<string, unknown>) => void,
  maxAge: number = 5000
) {
  useEffect(() => {
    const pendingNav = sessionStorage.getItem('pending-navigation')

    if (pendingNav) {
      try {
        const navigation: PendingNavigation = JSON.parse(pendingNav)
        const age = Date.now() - navigation.timestamp

        // Solo ejecutar si no es muy antigua (evitar navegaciones obsoletas)
        if (age < maxAge) {
           
          logger.info(`✅ Processing pending navigation to: ${navigation.page}`, { context: navigation.context })

          // Ejecutar navegación
          onNavigate(navigation.page, navigation.context)

          // Limpiar navegación pendiente
          sessionStorage.removeItem('pending-navigation')
        } else {
           
          logger.warn(`⚠️ Pending navigation too old (${age}ms), discarding`)
          sessionStorage.removeItem('pending-navigation')
        }
      } catch (error) {
         
        logger.error('Error processing pending navigation:', { error })
        sessionStorage.removeItem('pending-navigation')
      }
    }
  }, [onNavigate, maxAge])
}

/**
 * Limpia cualquier navegación pendiente
 * Útil para limpiar cuando el usuario navega manualmente
 */
export function clearPendingNavigation() {
  sessionStorage.removeItem('pending-navigation')
}

/**
 * Verifica si hay una navegación pendiente
 */
export function hasPendingNavigation(): boolean {
  return sessionStorage.getItem('pending-navigation') !== null
}

/**
 * Obtiene la navegación pendiente sin eliminarla
 */
export function getPendingNavigation(): PendingNavigation | null {
  const pending = sessionStorage.getItem('pending-navigation')
  if (!pending) return null

  try {
    return JSON.parse(pending)
  } catch {
    return null
  }
}
