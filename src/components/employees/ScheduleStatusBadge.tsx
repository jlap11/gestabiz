import React from 'react'
import { Badge } from '@/components/ui/badge'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { useEmployeeActiveBusiness } from '@/hooks/useEmployeeActiveBusiness'

interface ScheduleStatusBadgeProps {
  employeeId: string | null | undefined
  className?: string
}

export function ScheduleStatusBadge({ employeeId, className }: ScheduleStatusBadgeProps) {
  const result = useEmployeeActiveBusiness(employeeId)

  const getStatusText = (status: typeof result.status) => {
    switch (status) {
      case 'active':
        return 'En horario'
      case 'off-schedule':
        return 'Fuera de horario'
      case 'no-schedule':
        return 'Sin horario'
      case 'not-employee':
      default:
        return 'No asociado'
    }
  }

  const getStatusClasses = (status: typeof result.status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'off-schedule':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'no-schedule':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'not-employee':
      default:
        return 'bg-gray-100 text-gray-500 border-gray-200'
    }
  }

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Badge
          variant="secondary"
          className={`px-2 py-1 rounded-md border ${getStatusClasses(result.status)} ${className || ''}`}
        >
          {getStatusText(result.status)}
        </Badge>
      </HoverCardTrigger>
      <HoverCardContent className="w-72">
        <div className="space-y-2">
          <div className="text-sm font-semibold text-foreground">Estado de horario</div>
          <div className="text-sm text-muted-foreground">
            {result.status === 'active' && 'Dentro del horario laboral configurado.'}
            {result.status === 'off-schedule' && 'Fuera del horario laboral configurado.'}
            {result.status === 'no-schedule' && 'Sin horario definido para hoy.'}
            {result.status === 'not-employee' && 'No se encontraron empleos aprobados.'}
          </div>
          {result.business_name && (
            <div className="text-xs text-muted-foreground">
              Negocio activo:{' '}
              <span className="font-medium text-foreground">{result.business_name}</span>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
