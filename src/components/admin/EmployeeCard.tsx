/**
 * @file EmployeeCard.tsx
 * @description Card de empleado individual con avatar, métricas y acciones
 * Usado en EmployeeListView
 * Phase 3 - UI Components
 */

import { DollarSign, Edit, Eye, MoreVertical, Star, TrendingUp, User, UserPlus } from 'lucide-react'
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
import { HierarchyLevelSelector } from './HierarchyLevelSelector'
import { useUpdateEmployeeHierarchySimple } from '@/hooks/useUpdateEmployeeHierarchy'
import { useLanguage } from '@/contexts/LanguageContext'
import type { EmployeeHierarchy } from '@/types'

// =====================================================
// TIPOS
// =====================================================

interface EmployeeCardProps {
  employee: EmployeeHierarchy
  businessId: string
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

const getLevelLabel = (level: number, t: (key: string) => string): string => {
  const levelKey = `employees.levels.${level}` as const
  const label = t(levelKey)

  // Fallback si la traducción no existe
  if (label === levelKey) {
    return `${t('employees.list.level')} ${level}`
  }

  return label
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
  businessId,
  onEdit,
  onViewProfile,
  onAssignSupervisor,
  compact = false,
}: Readonly<EmployeeCardProps>) {
  const { t } = useLanguage()
  const initials = getInitials(employee.full_name)
  const employeeId = employee.user_id ?? employee.employee_id
  const { updateLevel, isUpdating } = useUpdateEmployeeHierarchySimple(businessId)

  const handleLevelChange = async (newLevel: number) => {
    if (!employeeId) {
      return
    }

    await updateLevel(employeeId, newLevel, employee.full_name)
  }

  // =====================================================
  // RENDER COMPACT - Mobile Optimized
  // =====================================================

  if (compact) {
    return (
      <div 
        className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors touch-manipulation min-h-[60px]"
        role="button"
        tabIndex={0}
        aria-label={`Empleado ${employee.full_name}, ${employee.job_title || employee.employee_type}`}
      >
        <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
          <AvatarImage src={employee.avatar_url || undefined} alt={employee.full_name} />
          <AvatarFallback className="text-xs sm:text-sm">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate text-sm sm:text-base">{employee.full_name}</p>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            {employee.job_title || employee.employee_type}
          </p>
        </div>
        <Badge className={`${getLevelBadgeColor(employee.hierarchy_level)} text-xs flex-shrink-0`}>
          {getLevelLabel(employee.hierarchy_level, t)}
        </Badge>
      </div>
    )
  }

  // =====================================================
  // RENDER FULL - Mobile First Design
  // =====================================================

  return (
    <Card className="p-3 sm:p-4 hover:shadow-md transition-shadow duration-200 touch-manipulation">
      <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
        {/* AVATAR - Responsive Size */}
        <Avatar className="h-12 w-12 sm:h-16 sm:w-16 flex-shrink-0 mx-auto sm:mx-0">
          <AvatarImage src={employee.avatar_url || undefined} alt={employee.full_name} />
          <AvatarFallback className="text-sm sm:text-lg">{initials}</AvatarFallback>
        </Avatar>

        {/* MAIN CONTENT */}
        <div className="flex-1 min-w-0 space-y-2 sm:space-y-3 w-full">
          {/* HEADER - Mobile Optimized */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                <h3 className="font-semibold text-base sm:text-lg truncate">{employee.full_name}</h3>
                {!employee.is_active && (
                  <Badge variant="outline" className="text-xs self-center sm:self-auto">
                    {t('employees.card.inactive')}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {employee.job_title || employee.employee_type}
              </p>
              <p className="text-xs text-muted-foreground mt-1 truncate">{employee.email}</p>
            </div>

            {/* ACTIONS DROPDOWN - Touch Friendly */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-9 w-9 sm:h-8 sm:w-8 p-0 self-center sm:self-start touch-manipulation"
                  aria-label={`Acciones para ${employee.full_name}`}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem 
                  onClick={() => onViewProfile?.(employee)}
                  className="cursor-pointer touch-manipulation min-h-[44px] sm:min-h-auto"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {t('employees.card.viewProfile')}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onEdit?.(employee)}
                  className="cursor-pointer touch-manipulation min-h-[44px] sm:min-h-auto"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {t('employees.card.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onAssignSupervisor?.(employee)}
                  className="cursor-pointer touch-manipulation min-h-[44px] sm:min-h-auto"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {t('employees.card.assignSupervisor')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* HIERARCHY INFO - Mobile Responsive */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className="self-center sm:self-auto">
              <HierarchyLevelSelector
                currentLevel={employee.hierarchy_level}
                employeeId={employeeId ?? ''}
                employeeName={employee.full_name}
                onLevelChange={handleLevelChange}
                disabled={isUpdating}
                size="sm"
                variant="outline"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-1 sm:gap-3 text-center sm:text-left">
              {employee.supervisor_name && (
                <div className="flex items-center justify-center sm:justify-start gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">
                    {t('employees.card.supervisor')}: <span className="font-medium">{employee.supervisor_name}</span>
                  </span>
                </div>
              )}
              {employee.direct_reports_count > 0 && (
                <div className="flex items-center justify-center sm:justify-start gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3 flex-shrink-0" />
                  <span>{employee.direct_reports_count} {t('employees.card.subordinates')}</span>
                </div>
              )}
            </div>
          </div>

          {/* METRICS - Mobile First Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t">
            {/* OCUPACIÓN */}
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-0 rounded-lg sm:rounded-none bg-muted/30 sm:bg-transparent">
              <div className="rounded-full bg-blue-500/10 p-2 flex-shrink-0">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground truncate">{t('employees.card.occupancy')}</p>
                <p className="font-semibold text-sm sm:text-base">
                  {employee.occupancy_rate !== null && employee.occupancy_rate !== undefined
                    ? `${Number(employee.occupancy_rate).toFixed(0)}%`
                    : 'N/A'}
                </p>
              </div>
            </div>

            {/* RATING */}
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-0 rounded-lg sm:rounded-none bg-muted/30 sm:bg-transparent">
              <div className="rounded-full bg-yellow-500/10 p-2 flex-shrink-0">
                <Star className="h-4 w-4 text-yellow-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground truncate">{t('employees.card.rating')}</p>
                <p className="font-semibold text-sm sm:text-base">
                  {employee.average_rating !== null && employee.average_rating !== undefined
                    ? `${Number(employee.average_rating).toFixed(1)} ⭐`
                    : 'N/A'}
                </p>
              </div>
            </div>

            {/* REVENUE */}
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-0 rounded-lg sm:rounded-none bg-muted/30 sm:bg-transparent">
              <div className="rounded-full bg-green-500/10 p-2 flex-shrink-0">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground truncate">{t('employees.card.revenue')}</p>
                <p className="font-semibold text-sm sm:text-base">
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