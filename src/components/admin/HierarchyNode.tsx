/**
 * @file HierarchyNode.tsx
 * @description Nodo de organigrama con avatar y métricas
 * Usado en HierarchyMapView
 * Phase 3 - UI Components
 */

import { ChevronDown, ChevronRight, Users } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/contexts/LanguageContext'
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
      return 'border-purple-500 bg-purple-900 text-white'
    case 1:
      return 'border-blue-500 bg-blue-900 text-white'
    case 2:
      return 'border-green-500 bg-green-900 text-white'
    case 3:
      return 'border-yellow-500 bg-yellow-900 text-white'
    case 4:
      return 'border-gray-500 bg-gray-900 text-white'
    default:
      return 'border-gray-300 bg-gray-900 text-white'
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
  const { t } = useLanguage()
  const initials = getInitials(employee.full_name)
  const hasSubordinates = employee.direct_reports_count > 0

  const getLevelLabelI18n = (level: number): string => {
    switch (level) {
      case 0:
        return t('hierarchy.levels.owner')
      case 1:
        return t('hierarchy.levels.admin')
      case 2:
        return t('hierarchy.levels.manager')
      case 3:
        return t('hierarchy.levels.lead')
      case 4:
        return t('hierarchy.levels.staff')
      default:
        return `${t('hierarchy.levels.level')} ${level}`
    }
  }

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
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
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
            <p className="font-semibold truncate text-white">{employee.full_name}</p>
            <p className="text-xs text-gray-300 truncate">
              {employee.job_title || employee.employee_type}
            </p>
          </div>
        </div>

        {/* NIVEL */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs bg-white/20 border-white/50 text-white">
            {getLevelLabelI18n(employee.hierarchy_level)}
          </Badge>
          {hasSubordinates && (
            <div className="flex items-center gap-1 text-xs text-gray-300">
              <Users className="h-3 w-3" />
              {employee.direct_reports_count}
            </div>
          )}
        </div>

        {/* MÉTRICAS COMPACTAS */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/20 text-xs">
          <div className="text-center">
            <p className="text-gray-300">{t('hierarchy.metrics.occupancy')}</p>
            <p className="font-semibold text-white">
              {employee.occupancy_rate !== null && employee.occupancy_rate !== undefined
                ? `${Number(employee.occupancy_rate).toFixed(0)}%`
                : '-'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-300">{t('hierarchy.metrics.rating')}</p>
            <p className="font-semibold text-white">
              {employee.average_rating !== null && employee.average_rating !== undefined
                ? `${Number(employee.average_rating).toFixed(1)} ⭐`
                : '-'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-300">{t('hierarchy.metrics.revenue')}</p>
            <p className="font-semibold text-white">
              {employee.gross_revenue !== null && employee.gross_revenue !== undefined
                ? `$${(Number(employee.gross_revenue) / 1000).toFixed(0)}k`
                : '-'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HierarchyNode
