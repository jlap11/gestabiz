/**
 * @file EmployeeListView.tsx
 * @description Vista de lista/tabla de empleados con ordenamiento y expansión
 * Phase 3 - UI Components
 */

import { useState } from 'react'
import { ArrowUpDown, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmployeeCard } from './EmployeeCard'
import type { EmployeeHierarchy } from '@/types'

// =====================================================
// TIPOS
// =====================================================

interface EmployeeListViewProps {
  employees: EmployeeHierarchy[]
  onEmployeeSelect?: (employee: EmployeeHierarchy) => void
  onEdit?: (employee: EmployeeHierarchy) => void
  onViewProfile?: (employee: EmployeeHierarchy) => void
  onAssignSupervisor?: (employee: EmployeeHierarchy) => void
}

type SortField = 'name' | 'level' | 'occupancy' | 'rating' | 'revenue'
type SortDirection = 'asc' | 'desc'

// =====================================================
// COMPONENTE
// =====================================================

export function EmployeeListView({
  employees,
  onEmployeeSelect,
  onEdit,
  onViewProfile,
  onAssignSupervisor,
}: EmployeeListViewProps) {
  const [sortField, setSortField] = useState<SortField>('level')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set())

  // =====================================================
  // SORTING
  // =====================================================

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedEmployees = [...employees].sort((a, b) => {
    let comparison = 0

    switch (sortField) {
      case 'name':
        comparison = a.full_name.localeCompare(b.full_name)
        break
      case 'level':
        comparison = a.hierarchy_level - b.hierarchy_level
        break
      case 'occupancy':
        comparison = (a.occupancy_percentage || 0) - (b.occupancy_percentage || 0)
        break
      case 'rating':
        comparison = (a.average_rating || 0) - (b.average_rating || 0)
        break
      case 'revenue':
        comparison = (a.total_revenue || 0) - (b.total_revenue || 0)
        break
    }

    return sortDirection === 'asc' ? comparison : -comparison
  })

  // =====================================================
  // EXPANSION
  // =====================================================

  const toggleExpand = (userId: string) => {
    setExpandedEmployees(prev => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }

  const getSubordinates = (userId: string): EmployeeHierarchy[] => {
    return employees.filter(emp => emp.reports_to === userId)
  }

  // =====================================================
  // RENDER SORT BUTTON
  // =====================================================

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="gap-1 h-8"
    >
      {label}
      <ArrowUpDown className={`h-3 w-3 ${sortField === field ? 'text-primary' : 'text-muted-foreground'}`} />
    </Button>
  )

  // =====================================================
  // RENDER EMPLOYEE ROW
  // =====================================================

  const renderEmployeeRow = (employee: EmployeeHierarchy, depth = 0) => {
    const subordinates = getSubordinates(employee.user_id)
    const isExpanded = expandedEmployees.has(employee.user_id)
    const hasSubordinates = subordinates.length > 0

    return (
      <div key={employee.user_id}>
        {/* MAIN ROW */}
        <div
          className="relative"
          style={{ paddingLeft: `${depth * 2}rem` }}
        >
          {/* EXPAND TOGGLE */}
          {hasSubordinates && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleExpand(employee.user_id)}
              className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
              style={{ left: `${depth * 2}rem` }}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* EMPLOYEE CARD */}
          <div
            className={hasSubordinates ? 'pl-8' : ''}
            onClick={() => onEmployeeSelect?.(employee)}
          >
            <EmployeeCard
              employee={employee}
              onEdit={onEdit}
              onViewProfile={onViewProfile}
              onAssignSupervisor={onAssignSupervisor}
            />
          </div>
        </div>

        {/* SUBORDINATES (Recursive) */}
        {isExpanded && hasSubordinates && (
          <div className="mt-2 space-y-2">
            {subordinates.map(sub => renderEmployeeRow(sub, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  // =====================================================
  // RENDER
  // =====================================================

  // Filtrar solo empleados de nivel top (sin supervisor o supervisor no en la lista)
  const topLevelEmployees = sortedEmployees.filter(
    emp => !emp.reports_to || !employees.find(e => e.user_id === emp.reports_to)
  )

  return (
    <div className="space-y-4">
      {/* SORT CONTROLS */}
      <div className="flex items-center gap-2 pb-3 border-b">
        <span className="text-sm font-medium text-muted-foreground">Ordenar por:</span>
        <div className="flex items-center gap-1">
          <SortButton field="name" label="Nombre" />
          <SortButton field="level" label="Nivel" />
          <SortButton field="occupancy" label="Ocupación" />
          <SortButton field="rating" label="Rating" />
          <SortButton field="revenue" label="Revenue" />
        </div>
      </div>

      {/* EMPLOYEES LIST */}
      {employees.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No hay empleados para mostrar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {topLevelEmployees.map(employee => renderEmployeeRow(employee))}
        </div>
      )}
    </div>
  )
}

export default EmployeeListView
