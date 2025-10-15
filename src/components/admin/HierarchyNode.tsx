/**
 * @file HierarchyNode.tsx
 * @description Nodo de organigrama con avatar y métricas
 * Usado en HierarchyMapView
 * Phase 3 - UI Components
 */

import { ChevronDown, ChevronRight, Users } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { EmployeeHierarchy } from '@/types'

// =====================================================
// TIPOS
// =====================================================

interface HierarchyNodeProps {
  employee: EmployeeHierarchy
  isExpanded?: boolean
  onToggleExpand?: () => void
  onClick?: () => void
  depth?: number
  className?: string
}

// =====================================================
// HELPERS
// =====================================================

const getLevelColor = (level: number): string => {
  switch (level) {
    case 0:
      return 'border-purple-500 bg-purple-50 dark:bg-purple-950'
    case 1:
      return 'border-blue-500 bg-blue-50 dark:bg-blue-950'
    case 2:
      return 'border-green-500 bg-green-50 dark:bg-green-950'
    case 3:
      return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950'
    case 4:
      return 'border-gray-500 bg-gray-50 dark:bg-gray-950'
    default:
      return 'border-gray-300 bg-gray-50 dark:bg-gray-900'
  }
}

const getLevelLabel = (level: number): string => {
  switch (level) {
    case 0:
      return 'Owner'
    case 1:
      return 'Admin'
    case 2:
      return 'Manager'
    case 3:
      return 'Lead'
    case 4:
      return 'Staff'
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

export function HierarchyNode({
  employee,
  isExpanded = false,
  onToggleExpand,
  onClick,
  depth = 0,
  className,
}: Readonly<HierarchyNodeProps>) {
  const initials = getInitials(employee.full_name)
  const hasSubordinates = employee.direct_reports_count > 0

  return (
    <div
      className={cn(
        'relative w-64 rounded-lg border-2 p-4 shadow-sm transition-all hover:shadow-md cursor-pointer',
        getLevelColor(employee.hierarchy_level),
        className
      )}
      onClick={onClick}
    >
      {/* EXPAND TOGGLE */}
      {hasSubordinates && onToggleExpand && (
        <button
          onClick={e => {
            e.stopPropagation()
            onToggleExpand()
          }}
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-background border-2 p-1 hover:bg-accent z-10"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      )}

      <div className="space-y-3">
        {/* HEADER - Avatar y nombre */}
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-background">
            <AvatarImage src={employee.avatar_url || undefined} alt={employee.full_name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{employee.full_name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {employee.job_title || employee.employee_type}
            </p>
          </div>
        </div>

        {/* NIVEL */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {getLevelLabel(employee.hierarchy_level)}
          </Badge>
          {hasSubordinates && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              {employee.direct_reports_count}
            </div>
          )}
        </div>

        {/* MÉTRICAS COMPACTAS */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t text-xs">
          <div className="text-center">
            <p className="text-muted-foreground">Ocup.</p>
            <p className="font-semibold">
              {employee.occupancy_percentage !== null
                ? `${employee.occupancy_percentage.toFixed(0)}%`
                : '-'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Rating</p>
            <p className="font-semibold">
              {employee.average_rating !== null ? `${employee.average_rating.toFixed(1)} ⭐` : '-'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Rev.</p>
            <p className="font-semibold">
              {employee.total_revenue !== null ? `$${(employee.total_revenue / 1000).toFixed(0)}k` : '-'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HierarchyNode
