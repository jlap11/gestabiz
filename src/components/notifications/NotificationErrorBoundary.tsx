import React from 'react'
import { Bell, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ErrorBoundary } from '@/components/ErrorBoundary'

/**
 * ErrorBoundary especializado para el sistema de notificaciones
 * Muestra un fallback compacto dentro del popover
 */
export function NotificationErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      componentName="Notifications"
      fallback={
        <div className="flex flex-col items-center justify-center p-6 space-y-4 h-[400px]">
          <Alert variant="destructive" className="max-w-sm">
            <Bell className="h-4 w-4" />
            <AlertTitle>Error en notificaciones</AlertTitle>
            <AlertDescription>
              No pudimos cargar tus notificaciones. Intenta recargar la página.
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
            aria-label="Recargar notificaciones"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Recargar
          </Button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * ErrorBoundary compacto para items individuales de notificación
 */
export function NotificationItemErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      componentName="Notifications.Item"
      fallback={
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-muted-foreground">
          <p className="font-medium text-destructive">Error al cargar notificación</p>
          <p className="text-xs mt-1">Esta notificación no se pudo mostrar</p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}
