import { useState } from 'react'
import { Activity, AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { useServiceStatus, ServiceStatus } from '@/hooks/useServiceStatus'
import { cn } from '@/lib/utils'

interface ServiceStatusBadgeProps {
  variant?: 'minimal' | 'detailed'
  className?: string
}

export function ServiceStatusBadge({ variant = 'minimal', className }: ServiceStatusBadgeProps) {
  const { supabase, auth, database, storage, lastChecked, error, refresh } = useServiceStatus()
  const [isExpanded, setIsExpanded] = useState(false)

  const getStatusColor = (status: ServiceStatus) => {
    switch (status) {
      case 'operational':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'down':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'checking':
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: ServiceStatus) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-4 w-4" />
      case 'degraded':
        return <AlertCircle className="h-4 w-4" />
      case 'down':
        return <XCircle className="h-4 w-4" />
      case 'checking':
        return <Activity className="h-4 w-4 animate-pulse" />
    }
  }

  const getStatusText = (status: ServiceStatus) => {
    switch (status) {
      case 'operational':
        return 'Operacional'
      case 'degraded':
        return 'Degradado'
      case 'down':
        return 'Inactivo'
      case 'checking':
        return 'Verificando...'
    }
  }

  if (variant === 'minimal') {
    return (
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
          getStatusColor(supabase),
          'hover:shadow-md',
          className
        )}
      >
        {getStatusIcon(supabase)}
        <span>{getStatusText(supabase)}</span>
        
        {isExpanded && (
          <div className="fixed inset-0 bg-black/20 z-50 flex items-start justify-center pt-20" onClick={() => setIsExpanded(false)}>
            <div 
              className="bg-card border border-border rounded-lg shadow-xl p-4 w-96 max-w-[90vw]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Estado de Servicios
                </h3>
                <button 
                  onClick={() => refresh()}
                  className="p-1 hover:bg-muted rounded transition-colors"
                  title="Actualizar estado"
                >
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-2">
                <ServiceItem label="Supabase" status={supabase} />
                <ServiceItem label="Autenticación" status={auth} />
                <ServiceItem label="Base de datos" status={database} />
                <ServiceItem label="Almacenamiento" status={storage} />
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}

              {lastChecked && (
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  Última verificación: {lastChecked.toLocaleTimeString('es')}
                </p>
              )}

              <div className="mt-4 pt-4 border-t border-border">
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1 justify-center"
                >
                  Ver Dashboard de Supabase →
                </a>
              </div>
            </div>
          </div>
        )}
      </button>
    )
  }

  // Detailed variant
  return (
    <div className={cn('bg-card border border-border rounded-lg p-4 space-y-3', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Estado de Servicios
        </h3>
        <button 
          onClick={() => refresh()}
          className="p-1 hover:bg-muted rounded transition-colors"
          title="Actualizar estado"
        >
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="space-y-2">
        <ServiceItem label="Supabase" status={supabase} />
        <ServiceItem label="Autenticación" status={auth} />
        <ServiceItem label="Base de datos" status={database} />
        <ServiceItem label="Almacenamiento" status={storage} />
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {lastChecked && (
        <p className="text-xs text-muted-foreground text-center">
          Última verificación: {lastChecked.toLocaleTimeString('es')}
        </p>
      )}
    </div>
  )
}

function ServiceItem({ label, status }: { label: string; status: ServiceStatus }) {
  const getStatusColor = (status: ServiceStatus) => {
    switch (status) {
      case 'operational':
        return 'text-green-600'
      case 'degraded':
        return 'text-yellow-600'
      case 'down':
        return 'text-red-600'
      case 'checking':
        return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: ServiceStatus) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-4 w-4" />
      case 'degraded':
        return <AlertCircle className="h-4 w-4" />
      case 'down':
        return <XCircle className="h-4 w-4" />
      case 'checking':
        return <Activity className="h-4 w-4 animate-pulse" />
    }
  }

  const getStatusText = (status: ServiceStatus) => {
    switch (status) {
      case 'operational':
        return 'Operacional'
      case 'degraded':
        return 'Degradado'
      case 'down':
        return 'Inactivo'
      case 'checking':
        return 'Verificando...'
    }
  }

  return (
    <div className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg">
      <span className="text-sm text-foreground">{label}</span>
      <div className={cn('flex items-center gap-2 text-xs font-medium', getStatusColor(status))}>
        {getStatusIcon(status)}
        <span>{getStatusText(status)}</span>
      </div>
    </div>
  )
}
