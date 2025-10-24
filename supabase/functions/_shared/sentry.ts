/**
 * Sentry Configuration for Edge Functions
 *
 * Configuración centralizada de Sentry para Deno Edge Functions
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/deno/
 */

import * as Sentry from 'https://deno.land/x/sentry@7.114.0/index.mjs'

let sentryInitialized = false

/**
 * Initialize Sentry for Edge Function
 *
 * @param functionName - Nombre de la Edge Function (para tagging)
 * @param options - Opciones adicionales de Sentry
 */
export function initSentry(functionName: string, options?: Partial<Sentry.BrowserOptions>) {
  if (sentryInitialized) {
    return
  }

  const SENTRY_DSN = Deno.env.get('SENTRY_DSN')
  const SENTRY_ENVIRONMENT = Deno.env.get('SENTRY_ENVIRONMENT') || 'production'
  const APP_VERSION = Deno.env.get('APP_VERSION') || 'unknown'

  // Solo inicializar si hay DSN configurado
  if (!SENTRY_DSN || SENTRY_DSN.includes('your-dsn-here')) {
    console.warn(`[${functionName}] Sentry DSN not configured, skipping initialization`)
    return
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    release: APP_VERSION,

    // Sampling
    tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,

    // Context
    initialScope: {
      tags: {
        edge_function: functionName,
        runtime: 'deno',
      },
    },

    // Integrations específicas para Deno
    integrations: [new Sentry.Integrations.HttpContext(), new Sentry.Integrations.LinkedErrors()],

    // Filtros
    beforeSend(event, hint) {
      // Filtrar errores conocidos y no críticos
      const error = hint.originalException as Error

      if (error?.message) {
        // Ignorar timeouts de red (comunes en Edge Functions)
        if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
          return null
        }

        // Ignorar errores de CORS (no son bugs del servidor)
        if (error.message.includes('CORS')) {
          return null
        }
      }

      return event
    },

    ...options,
  })

  sentryInitialized = true
  console.log(`[${functionName}] Sentry initialized successfully`)
}

/**
 * Capture error to Sentry with Edge Function context
 *
 * @param error - Error object
 * @param context - Contexto adicional (request info, user, etc.)
 */
export function captureEdgeFunctionError(
  error: Error,
  context?: {
    functionName?: string
    requestId?: string
    userId?: string
    businessId?: string
    operation?: string
    extra?: Record<string, any>
  }
) {
  if (!sentryInitialized) {
    console.error('Sentry not initialized, logging error locally:', error)
    return
  }

  Sentry.withScope(scope => {
    // Tags
    if (context?.functionName) {
      scope.setTag('function_name', context.functionName)
    }
    if (context?.operation) {
      scope.setTag('operation', context.operation)
    }
    if (context?.requestId) {
      scope.setTag('request_id', context.requestId)
    }

    // User context
    if (context?.userId) {
      scope.setUser({ id: context.userId })
    }

    // Extra context
    if (context?.businessId) {
      scope.setContext('business', { id: context.businessId })
    }
    if (context?.extra) {
      scope.setContext('additional', context.extra)
    }

    // Capture
    Sentry.captureException(error)
  })
}

/**
 * Capture message to Sentry
 *
 * @param message - Mensaje a capturar
 * @param level - Nivel de severidad
 * @param context - Contexto adicional
 */
export function captureEdgeFunctionMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, any>
) {
  if (!sentryInitialized) {
    console.log(`[${level.toUpperCase()}] ${message}`, context)
    return
  }

  Sentry.withScope(scope => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setTag(key, String(value))
      })
    }

    Sentry.captureMessage(message, level)
  })
}

/**
 * Flush Sentry events (importante llamar antes de retornar Response)
 */
export async function flushSentry() {
  if (sentryInitialized) {
    await Sentry.close(2000) // Timeout 2s
  }
}
