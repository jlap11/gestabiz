/**
 * @file EmployeeCard.tsx
 * @description Card de empleado individual con avatar, métricas y acciones
 * Usado en EmployeeListView
 * Phase 3 - UI Components
 */

import { MoreVertical, User, TrendingUp, Star, DollarSign, Edit, Eye, UserPlus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { EmployeeHierarchy } from '@/types'

// =====================================================
// TIPOS
// =====================================================

interface EmployeeCardProps {
  employee: EmployeeHierarchy
  onEdit?: (employee: EmployeeHierarchy) => void
  onViewProfile?: (employee: EmployeeHierarchy) => void
  onAssignSupervisor?: (employee: EmployeeHierarchy) => void
  compact?: boolean
}

// =====================================================
// HELPERS
// =====================================================

const getLevelBadgeColor = (level: number): string => {
  switch (level) {
    case 0:
      return 'bg-purple-500/10 text-purple-700 dark:text-purple-400'
    case 1:
      return 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
    case 2:
      return 'bg-green-500/10 text-green-700 dark:text-green-400'
    case 3:
      return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
    case 4:
      return 'bg-gray-500/10 text-gray-700 dark:text-gray-400'
    default:
      return 'bg-gray-500/10 text-gray-700 dark:text-gray-400'
  }
}

const getLevelLabel = (level: number): string => {
  switch (level) {
    case 0:
      return 'Propietario'
    case 1:
      return 'Administrador'
    case 2:
      return 'Gerente'
    case 3:
      return 'Líder'
    case 4:
      return 'Personal'
    default:
      return `Nivel ${level}`
  }
}

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// =====================================================
// COMPONENTE
// =====================================================

export function EmployeeCard({
  employee,
  onEdit,
  onViewProfile,
  onAssignSupervisor,
  compact = false,
}: EmployeeCardProps) {
  const initials = getInitials(employee.full_name)

  // =====================================================
  // RENDER COMPACT
  // =====================================================

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors">
        <Avatar className="h-10 w-10">
          <AvatarImage src={employee.avatar_url || undefined} alt={employee.full_name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{employee.full_name}</p>
          <p className="text-sm text-muted-foreground truncate">
            {employee.job_title || employee.employee_type}
          </p>
        </div>
        <Badge className={getLevelBadgeColor(employee.hierarchy_level)}>
          {getLevelLabel(employee.hierarchy_level)}
        </Badge>
      </div>
    )
  }

  // =====================================================
  // RENDER FULL
  // =====================================================

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {/* AVATAR */}
        <Avatar className="h-16 w-16">
          <AvatarImage src={employee.avatar_url || undefined} alt={employee.full_name} />
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>

        {/* MAIN CONTENT */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* HEADER */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg truncate">{employee.full_name}</h3>
                {!employee.is_active && (
                  <Badge variant="outline" className="text-xs">
                    Inactivo
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {employee.job_title || employee.employee_type}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{employee.email}</p>
            </div>

            {/* ACTIONS DROPDOWN */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewProfile?.(employee)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Ver perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit?.(employee)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar jerarquía
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAssignSupervisor?.(employee)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Asignar supervisor
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* HIERARCHY INFO */}
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className={getLevelBadgeColor(employee.hierarchy_level)}>
              {getLevelLabel(employee.hierarchy_level)}
            </Badge>
            {employee.supervisor_name && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                Reporta a: <span className="font-medium">{employee.supervisor_name}</span>
              </div>
            )}
            {employee.direct_reports_count > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                {employee.direct_reports_count} subordinado{employee.direct_reports_count > 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* METRICS */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t">
            {/* OCUPACIÓN */}
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-blue-500/10 p-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ocupación</p>
                <p className="font-semibold">
                  {employee.occupancy_rate !== null && employee.occupancy_rate !== undefined
                    ? `${Number(employee.occupancy_rate).toFixed(0)}%`
                    : 'N/A'}
                </p>
              </div>
            </div>

            {/* RATING */}
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-yellow-500/10 p-2">
                <Star className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Rating</p>
                <p className="font-semibold">
                  {employee.average_rating !== null && employee.average_rating !== undefined
                    ? `${Number(employee.average_rating).toFixed(1)} ⭐`
                    : 'N/A'}
                </p>
              </div>
            </div>

            {/* REVENUE */}
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-green-500/10 p-2">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Revenue</p>
                <p className="font-semibold">
                  {employee.gross_revenue !== null && employee.gross_revenue !== undefined
                    ? `$${(Number(employee.gross_revenue) / 1000).toFixed(0)}k`
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default EmployeeCard
