import React from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { MessageCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ErrorBoundary } from '@/components/ErrorBoundary'

/**
 * ErrorBoundary especializado para el sistema de chat
 * Muestra un fallback más compacto y contextual
 */
export function ChatErrorBoundary({ children }: Readonly<{ children: React.ReactNode }>) {
  const { t } = useLanguage()
  return (
    <ErrorBoundary
      componentName="Chat"
      fallback={
        <div className="flex flex-col items-center justify-center h-full p-6 space-y-4">
          <Alert variant="destructive" className="max-w-md">
            <MessageCircle className="h-4 w-4" />
            <AlertTitle>Error en el chat</AlertTitle>
            <AlertDescription>
              No pudimos cargar el chat correctamente. Por favor intenta recargar.
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
            aria-label="Recargar chat"
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
 * ErrorBoundary compacto para componentes individuales del chat
 * (p.ej. MessageBubble, ChatInput)
 */
export function ChatComponentErrorBoundary({
  children,
  componentName,
}: {
  children: React.ReactNode
  componentName: string
}) {
  return (
    <ErrorBoundary
      componentName={`Chat.${componentName}`}
      fallback={
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-muted-foreground">
          <p className="font-medium text-destructive">Error en {componentName}</p>
          <p className="text-xs mt-1">Este componente no se pudo cargar</p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}
