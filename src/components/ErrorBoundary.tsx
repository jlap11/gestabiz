import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, Home, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  /** Nombre descriptivo del componente para logs */
  componentName?: string
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  errorId?: string
}

/**
 * ErrorBoundary mejorado con:
 * - Logging estructurado con componentName
 * - Error ID único para trazabilidad
 * - UI responsive y accesible
 * - Detalles de error en modo dev
 * - Botones de recuperación
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = Date.now().toString(36) + Math.random().toString(36).substring(2)
    return { hasError: true, error, errorId }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo })

    const { componentName, onError } = this.props

    // Log estructurado para debugging
    const prefix = componentName ? `[ErrorBoundary - ${componentName}]` : '[ErrorBoundary]'
    // eslint-disable-next-line no-console
    console.error(prefix, {
      error,
      errorInfo,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
    })

    // Call optional error handler
    onError?.(error, errorInfo)

    // En producción, enviar a servicio de tracking (Sentry, LogRocket, etc.)
    if (import.meta.env.PROD) {
      this.logErrorToService(error, errorInfo)
    }
  }

  /**
   * Enviar error a servicio externo (placeholder)
   */
  private logErrorToService(error: Error, errorInfo: ErrorInfo) {
    // Placeholder para integración futura con Sentry, LogRocket, etc.
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      componentName: this.props.componentName,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    }

    // eslint-disable-next-line no-console
    console.log('[ErrorBoundary] Would send to tracking service:', errorData)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, errorId: undefined })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
              <CardTitle className="text-xl">Oops! Algo salió mal</CardTitle>
              <CardDescription>
                Ocurrió un error inesperado. Por favor intenta actualizar la página o contacta
                soporte si el problema persiste.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {import.meta.env.DEV && this.state.error && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Detalles del Error
                  </summary>
                  <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
              {this.state.errorId && (
                <p className="text-xs text-muted-foreground text-center">
                  Error ID: {this.state.errorId}
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  className="flex-1"
                  aria-label="Intentar recuperar la aplicación"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Intentar de nuevo
                </Button>
                <Button
                  onClick={this.handleReload}
                  className="flex-1"
                  aria-label="Recargar la página completa"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recargar página
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
