/**
 * Edge Function Logger
 * 
 * Sistema de logging unificado para Edge Functions que integra con Sentry
 * y proporciona logging estructurado para desarrollo y producción.
 */

import { captureEdgeFunctionError, captureEdgeFunctionMessage } from './sentry.ts'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  functionName?: string
  requestId?: string
  userId?: string
  businessId?: string
  operation?: string
  extra?: Record<string, any>
}

class EdgeFunctionLogger {
  private functionName: string
  private isDevelopment: boolean

  constructor(functionName: string) {
    this.functionName = functionName
    this.isDevelopment = Deno.env.get('SENTRY_ENVIRONMENT') !== 'production'
  }

  /**
   * Log debug message (only in development)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(`[DEBUG][${this.functionName}] ${message}`, context || {})
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    const logMessage = `[INFO][${this.functionName}] ${message}`
    
    if (this.isDevelopment) {
      console.log(logMessage, context || {})
    }
    
    captureEdgeFunctionMessage(message, 'info', {
      functionName: this.functionName,
      ...context
    })
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    const logMessage = `[WARN][${this.functionName}] ${message}`
    
    console.warn(logMessage, context || {})
    
    captureEdgeFunctionMessage(message, 'warning', {
      functionName: this.functionName,
      ...context
    })
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const logMessage = `[ERROR][${this.functionName}] ${message}`
    
    console.error(logMessage, error, context || {})
    
    if (error instanceof Error) {
      captureEdgeFunctionError(error, {
        functionName: this.functionName,
        operation: message,
        ...context
      })
    } else {
      captureEdgeFunctionMessage(`${message}: ${String(error)}`, 'error', {
        functionName: this.functionName,
        ...context
      })
    }
  }

  /**
   * Log request start
   */
  requestStart(requestId: string, method: string, url: string): void {
    this.info(`Request started: ${method} ${url}`, {
      requestId,
      operation: 'request_start'
    })
  }

  /**
   * Log request end
   */
  requestEnd(requestId: string, status: number, duration?: number): void {
    this.info(`Request completed: ${status}`, {
      requestId,
      operation: 'request_end',
      extra: { status, duration }
    })
  }

  /**
   * Log database operation
   */
  dbOperation(operation: string, table: string, context?: LogContext): void {
    this.debug(`DB Operation: ${operation} on ${table}`, {
      operation: 'db_operation',
      extra: { table, dbOperation: operation },
      ...context
    })
  }

  /**
   * Log external API call
   */
  apiCall(service: string, endpoint: string, method: string, context?: LogContext): void {
    this.debug(`API Call: ${method} ${service}${endpoint}`, {
      operation: 'api_call',
      extra: { service, endpoint, method },
      ...context
    })
  }
}

/**
 * Create logger instance for Edge Function
 */
export function createLogger(functionName: string): EdgeFunctionLogger {
  return new EdgeFunctionLogger(functionName)
}

/**
 * Default logger instance (use createLogger instead for better context)
 */
export const logger = createLogger('unknown')