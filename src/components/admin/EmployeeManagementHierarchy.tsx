/**
 * @file EmployeeManagementHierarchy.tsx
 * @description Componente principal para gestión de jerarquía de empleados
 * Vista dual: Lista y Mapa organizacional con filtros avanzados
 * Phase 3 - UI Components
 */

import { useEffect, useState } from 'react'
import { Filter } from 'lucide-react'
import { useBusinessHierarchy } from '@/hooks/useBusinessHierarchy'
import { usePreferredLocation } from '@/hooks/usePreferredLocation'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FiltersPanel } from './FiltersPanel'
import { EmployeeListView } from './EmployeeListView'
import { HierarchyMapView } from './HierarchyMapView'
import { EmployeeProfileModal } from './EmployeeProfileModal'
import { EmployeeHeader } from './EmployeeHeader'
import { EmployeeStatsCards } from './EmployeeStatsCards'
import type { EmployeeHierarchy } from '@/types'

// =====================================================
// TIPOS
// =====================================================

interface EmployeeManagementHierarchyProps {
  businessId: string
  onEmployeeSelect?: (employee: EmployeeHierarchy) => void
}

type ViewMode = 'list' | 'map'

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function EmployeeManagementHierarchy({
  businessId,
  onEmployeeSelect,
}: EmployeeManagementHierarchyProps) {
  const { t } = useLanguage()
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeHierarchy | null>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  // Hook de sede preferida
  const { preferredLocationId } = usePreferredLocation(businessId)

  // Hook principal de jerarquía
  const {
    data: employees,
    isLoading,
    error,
    filters,
    updateFilters,
    clearFilters,
  } = useBusinessHierarchy(businessId)

  // Pre-seleccionar sede preferida al montar el componente
  useEffect(() => {
    if (preferredLocationId && !filters.location_id) {
      updateFilters({ location_id: preferredLocationId })
    }
  }, [preferredLocationId, filters.location_id, updateFilters])

  // =====================================================
  // HANDLERS
  // =====================================================

  const handleEmployeeClick = (employee: EmployeeHierarchy) => {
    setSelectedEmployee(employee)
    setIsProfileModalOpen(true)
    onEmployeeSelect?.(employee)
  }

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
  }

  const toggleFilters = () => {
    setShowFilters(prev => !prev)
  }

  const handleClearFilters = () => {
    clearFilters()
    setShowFilters(false)
  }

  // =====================================================
  // LOADING & ERROR STATES
  // =====================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" role="status" aria-label={t('common.loading')}>
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" role="alert">
        <Card className="p-6 max-w-md">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="rounded-full bg-destructive/10 p-3">
              <Users className="h-6 w-6 text-destructive" aria-hidden="true" />
            </div>
            <h3 className="font-semibold text-lg">{t('common.error')}</h3>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
        </Card>
      </div>
    )
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <main 
      className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-6 max-w-[100vw] overflow-x-hidden" 
      role="main" 
      aria-labelledby="employee-management-title"
    >
      <h1 id="employee-management-title" className="sr-only">
        {t('employees.management.title')}
      </h1>

      {/* HEADER */}
      <EmployeeHeader 
        viewMode={viewMode} 
        onViewModeChange={handleViewModeChange} 
      />

      {/* STATS CARDS */}
      <EmployeeStatsCards employees={employees} />

      {/* FILTERS BAR */}
      <section 
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4" 
        role="region" 
        aria-labelledby="filters-section-title"
      >
        <h3 id="filters-section-title" className="sr-only">
          Filtros y controles
        </h3>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            onClick={toggleFilters}
            className="gap-2 min-h-[44px] min-w-[44px] focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label={t('employees.management.filters')}
            title={t('employees.management.filters')}
            aria-expanded={showFilters}
          >
            <Filter className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t('employees.management.filters')}</span>
            <span className="sm:hidden">Filtros</span>
            {(filters.searchQuery ||
              filters.hierarchyLevel !== undefined ||
              filters.employeeType ||
              filters.departmentId) && (
              <span className="ml-1 rounded-full bg-primary-foreground px-2 py-0.5 text-xs" aria-label={`${[
                filters.searchQuery,
                filters.hierarchyLevel,
                filters.employeeType,
                filters.departmentId,
              ].filter(Boolean).length} filtros activos`}>
                {
                  [
                    filters.searchQuery,
                    filters.hierarchyLevel,
                    filters.employeeType,
                    filters.departmentId,
                  ].filter(Boolean).length
                }
              </span>
            )}
          </Button>

          {(filters.searchQuery ||
            filters.hierarchyLevel !== undefined ||
            filters.employeeType ||
            filters.departmentId) && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClearFilters} 
              className="min-h-[44px] min-w-[44px] focus:ring-2 focus:ring-primary focus:ring-offset-2" 
              aria-label={t('employees.management.clearFilters')} 
              title={t('employees.management.clearFilters')}
            >
              <span className="hidden sm:inline">{t('employees.management.clearFilters')}</span>
              <span className="sm:hidden">Limpiar</span>
            </Button>
          )}
        </div>

        <div className="text-sm text-muted-foreground" aria-live="polite" aria-atomic="true">
          {employees.length} {t('employees.management.employeesShown')}
        </div>
      </section>

      {/* FILTERS PANEL (Collapsible) */}
      {showFilters && (
        <section role="region" aria-labelledby="filters-panel-title">
          <h3 id="filters-panel-title" className="sr-only">
            Panel de filtros
          </h3>
          <Card className="p-4">
            <FiltersPanel
              businessId={businessId}
              filters={filters}
              onFiltersChange={updateFilters}
              onClear={handleClearFilters}
            />
          </Card>
        </section>
      )}

      {/* MAIN CONTENT - LIST OR MAP VIEW */}
      <section className="flex-1" role="region" aria-labelledby="main-content-title">
        <h3 id="main-content-title" className="sr-only">
          {viewMode === 'list' ? 'Vista de lista de empleados' : 'Vista de mapa organizacional'}
        </h3>
        
        {viewMode === 'list' ? (
          <Card className="p-3 sm:p-6 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
            <EmployeeListView
              employees={employees}
              businessId={businessId}
              onEmployeeSelect={handleEmployeeClick}
              onEdit={handleEmployeeClick}
              onViewProfile={handleEmployeeClick}
              onAssignSupervisor={handleEmployeeClick}
            />
          </Card>
        ) : (
          <Card className="p-3 sm:p-6 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
            <HierarchyMapView employees={employees} onEmployeeSelect={handleEmployeeClick} />
          </Card>
        )}
      </section>

      {/* EMPLOYEE PROFILE MODAL */}
      <EmployeeProfileModal
        employee={selectedEmployee}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </main>
  )
}

export default EmployeeManagementHierarchy

