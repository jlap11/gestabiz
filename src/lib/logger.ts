/**
 * Logger Utility - Sistema de logging unificado con Sentry + Supabase
 *
 * **Dual Logging**: Envía logs a Sentry (cloud) Y Supabase (database) simultáneamente
 *
 * **Features**:
 * - 4 niveles: error, warn, info, fatal
 * - Rate limiting (max 100 errores idénticos/hora vía hash)
 * - Sampling en producción (30% por defecto)
 * - Context injection automático (user, session, route)
 * - Stack trace cleaning
 * - GDPR compliance (logs purgados a los 90 días)
 *
 * **Usage**:
 * ```ts
 * import { logger } from '@/lib/logger';
 *
 * // En hooks
 * logger.error('Failed to load appointments', error, { component: 'useAppointments' });
 *
 * // En componentes
 * logger.warn('User not found', { userId: '123' });
 *
 * // Fatal (requiere atención inmediata)
 * logger.fatal('Database connection lost', error);
 * ```
 */

import * as Sentry from '@sentry/react'
import { supabase } from './supabase'

// ===== TYPES =====
type LogLevel = 'debug' | 'info' | 'warning' | 'error' | 'fatal'
type LogSource =
  | 'frontend-web'
  | 'frontend-mobile'
  | 'frontend-extension'
  | 'edge-function'
  | 'database'
  | 'cron-job'

interface LogContext {
  component?: string
  userId?: string
  sessionId?: string
  route?: string
  [key: string]: unknown
}

interface LogOptions {
  level?: LogLevel
  source?: LogSource
  context?: LogContext
  skipSentry?: boolean
  skipSupabase?: boolean
}

// ===== CONFIG =====
const CONFIG = {
  IS_PRODUCTION: import.meta.env.PROD,
  SAMPLE_RATE: Number.parseFloat(import.meta.env.VITE_SENTRY_SAMPLE_RATE || '0.3'),
  SOURCE: 'frontend-web' as LogSource,
  ENVIRONMENT: import.meta.env.PROD ? 'production' : 'development',
}

// ===== HELPER FUNCTIONS =====

/**
 * Decide si un log debe ser enviado basándose en sampling rate
 */
function shouldSample(): boolean {
  if (!CONFIG.IS_PRODUCTION) return true // Siempre en dev
  return Math.random() < CONFIG.SAMPLE_RATE
}

/**
 * Obtiene contexto automático del navegador/sesión
 */
function getAutoContext(): Partial<LogContext> {
  return {
    route: globalThis.location?.pathname,
    sessionId: sessionStorage.getItem('session_id') || undefined,
    // userId se inyecta manualmente en cada log si está disponible
  }
}

/**
 * Genera hash MD5 simplificado (para rate limiting)
 */
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0 // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16)
}

/**
 * Limpia stack trace para Sentry
 */
function cleanStackTrace(error: Error): string {
  return error.stack?.split('\n').slice(0, 10).join('\n') || error.message
}

// ===== CORE LOGGER CLASS =====

class Logger {
  /**
   * Log de error (nivel ERROR)
   * Envía a Sentry + Supabase automáticamente
   */
  async error(
    message: string,
    error?: Error | unknown,
    context?: LogContext,
    options?: LogOptions
  ): Promise<void> {
    return this.log({
      level: 'error',
      message,
      error,
      context,
      ...options,
    })
  }

  /**
   * Log de warning (nivel WARNING)
   * Solo va a Supabase, no a Sentry (para no consumir cuota)
   */
  async warn(message: string, context?: LogContext, options?: LogOptions): Promise<void> {
    return this.log({
      level: 'warning',
      message,
      context,
      skipSentry: true, // Warnings no van a Sentry
      ...options,
    })
  }

  /**
   * Log de info (nivel INFO)
   * Solo va a Supabase
   */
  async info(message: string, context?: LogContext, options?: LogOptions): Promise<void> {
    return this.log({
      level: 'info',
      message,
      context,
      skipSentry: true, // Info no va a Sentry
      ...options,
    })
  }

  /**
   * Log de fatal (nivel FATAL)
   * SIEMPRE va a Sentry + Supabase, ignora sampling
   */
  async fatal(
    message: string,
    error?: Error | unknown,
    context?: LogContext,
    options?: LogOptions
  ): Promise<void> {
    return this.log({
      level: 'fatal',
      message,
      error,
      context,
      skipSampling: true, // Fatal siempre se envía
      ...options,
    })
  }

  /**
   * Método interno unificado de logging
   */
  private async log({
    level,
    message,
    error,
    context = {},
    source = CONFIG.SOURCE,
    skipSentry = false,
    skipSupabase = false,
    skipSampling = false,
  }: LogOptions & {
    message: string
    error?: Error | unknown
    skipSampling?: boolean
  }): Promise<void> {
    // Sampling (excepto fatal)
    if (!skipSampling && !shouldSample()) {
      return
    }

    // Merge contexts
    const fullContext = {
      ...getAutoContext(),
      ...context,
    }

    // Stack trace
    const stackTrace = error instanceof Error ? cleanStackTrace(error) : undefined

    // Error hash (para rate limiting)
    const errorHash = simpleHash(`${source}:${message}:${fullContext.component || ''}`)

    // Enviar a Sentry (si corresponde)
    if (!skipSentry && (level === 'error' || level === 'fatal')) {
      if (error instanceof Error) {
        Sentry.captureException(error, {
          level: level === 'fatal' ? 'fatal' : 'error',
          tags: {
            component: fullContext.component,
            source,
          },
          extra: fullContext,
        })
      } else {
        Sentry.captureMessage(message, {
          level: level === 'fatal' ? 'fatal' : 'error',
          tags: {
            component: fullContext.component,
            source,
          },
          extra: fullContext,
        })
      }
    }

    // Enviar a Supabase (si corresponde)
    if (!skipSupabase) {
      try {
        const { error: rpcError } = await supabase.rpc('log_error_event', {
          p_source: source,
          p_level: level,
          p_message: message,
          p_stack_trace: stackTrace,
          p_user_id: fullContext.userId,
          p_session_id: fullContext.sessionId,
          p_component: fullContext.component,
          p_context: fullContext as Record<string, unknown>,
          p_environment: CONFIG.ENVIRONMENT,
          p_error_hash: errorHash,
        })

        if (rpcError) {
          // Fallback si falla Supabase: solo console en dev
          if (!CONFIG.IS_PRODUCTION) {
            // eslint-disable-next-line no-console
            console.error('[Logger] Failed to log to Supabase:', rpcError)
          }
        }
      } catch (rpcError) {
        // Silencioso en producción para no causar errores secundarios
        if (!CONFIG.IS_PRODUCTION) {
          // eslint-disable-next-line no-console
          console.error('[Logger] Exception logging to Supabase:', rpcError)
        }
      }
    }

    // Log to console en development
    if (!CONFIG.IS_PRODUCTION && level) {
      let logFn = console.info // eslint-disable-line no-console
      if (level === 'fatal' || level === 'error') {
        logFn = console.error // eslint-disable-line no-console
      } else if (level === 'warning') {
        logFn = console.warn // eslint-disable-line no-console
      }

      logFn(`[${level.toUpperCase()}] ${message}`, {
        error,
        context: fullContext,
      })
    }
  }

  /**
   * Log de inicio de sesión (usa tabla login_logs)
   */
  async logLogin({
    email,
    status,
    method,
    userId,
    ipAddress,
    userAgent,
    metadata = {},
  }: {
    email: string
    status: 'success' | 'failure' | 'blocked'
    method: 'password' | 'google' | 'magic_link' | 'extension' | 'password_reset'
    userId?: string
    ipAddress?: string
    userAgent?: string
    metadata?: Record<string, unknown>
  }): Promise<void> {
    try {
      const { error } = await supabase.rpc('log_login_event', {
        p_email: email,
        p_status: status,
        p_method: method,
        p_user_id: userId,
        p_ip_address: ipAddress,
        p_user_agent: userAgent || navigator.userAgent,
        p_metadata: metadata,
      })

      if (error) {
        if (!CONFIG.IS_PRODUCTION) {
          // eslint-disable-next-line no-console
          console.error('[Logger] Failed to log login:', error)
        }
      }
    } catch (rpcError) {
      if (!CONFIG.IS_PRODUCTION) {
        // eslint-disable-next-line no-console
        console.error('[Logger] Exception logging login:', rpcError)
      }
    }
  }
}

// ===== SINGLETON EXPORT =====
export const logger = new Logger()
