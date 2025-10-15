/**
 * @file EmployeeManagementHierarchy.tsx
 * @description Componente principal para gestión de jerarquía de empleados
 * Vista dual: Lista y Mapa organizacional con filtros avanzados
 * Phase 3 - UI Components
 */

import { useState } from 'react'
import { Users, List, Network, Filter } from 'lucide-react'
import { useBusinessHierarchy } from '@/hooks/useBusinessHierarchy'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FiltersPanel } from './FiltersPanel'
import { EmployeeListView } from './EmployeeListView'
import { HierarchyMapView } from './HierarchyMapView'
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

  // Hook principal de jerarquía
  const {
    data: employees,
    isLoading,
    error,
    filters,
    updateFilters,
    clearFilters,
  } = useBusinessHierarchy(businessId)

  // =====================================================
  // ESTADÍSTICAS HEADER
  // =====================================================

  const stats = {
    total: employees.length,
    byLevel: {
      0: employees.filter(e => e.hierarchy_level === 0).length, // Owner
      1: employees.filter(e => e.hierarchy_level === 1).length, // Admin
      2: employees.filter(e => e.hierarchy_level === 2).length, // Manager
      3: employees.filter(e => e.hierarchy_level === 3).length, // Lead
      4: employees.filter(e => e.hierarchy_level === 4).length, // Staff
    },
    avgOccupancy: employees.length > 0
      ? employees.reduce((acc, e) => acc + (e.occupancy_percentage || 0), 0) / employees.length
      : 0,
    avgRating: employees.length > 0
      ? employees.reduce((acc, e) => acc + (e.average_rating || 0), 0) / employees.length
      : 0,
  }

  // =====================================================
  // HANDLERS
  // =====================================================

  const handleEmployeeClick = (employee: EmployeeHierarchy) => {
    onEmployeeSelect?.(employee)
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6 max-w-md">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="rounded-full bg-destructive/10 p-3">
              <Users className="h-6 w-6 text-destructive" />
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
    <div className="flex flex-col gap-6 p-6">
      {/* HEADER CON ESTADÍSTICAS */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t('employees.management.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('employees.management.subtitle')}
            </p>
          </div>

          {/* VIEW MODE TOGGLE */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="gap-2 min-h-[44px]"
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">{t('employees.management.listView')}</span>
              <span className="sm:hidden">Lista</span>
            </Button>
            <Button
              variant={viewMode === 'map' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('map')}
              className="gap-2 min-h-[44px]"
            >
              <Network className="h-4 w-4" />
              <span className="hidden sm:inline">{t('employees.management.mapView')}</span>
              <span className="sm:hidden">Mapa</span>
            </Button>
          </div>
        </div>

        {/* STATS CARDS - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t('employees.management.totalEmployees')}
                </p>
                <p className="text-xl sm:text-2xl font-bold mt-1">{stats.total}</p>
              </div>
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary opacity-20" />
            </div>
          </Card>

          <Card className="p-3 sm:p-4">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                {t('employees.management.byLevel')}
              </p>
              <div className="grid grid-cols-5 gap-0.5 sm:gap-1 text-xs">
                <div className="text-center">
                  <div className="font-bold text-base sm:text-lg">{stats.byLevel[0]}</div>
                  <div className="text-muted-foreground text-[10px] sm:text-xs">Own</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-base sm:text-lg">{stats.byLevel[1]}</div>
                  <div className="text-muted-foreground text-[10px] sm:text-xs">Adm</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-base sm:text-lg">{stats.byLevel[2]}</div>
                  <div className="text-muted-foreground text-[10px] sm:text-xs">Mgr</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-base sm:text-lg">{stats.byLevel[3]}</div>
                  <div className="text-muted-foreground text-[10px] sm:text-xs">Lead</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-base sm:text-lg">{stats.byLevel[4]}</div>
                  <div className="text-muted-foreground text-[10px] sm:text-xs">Staff</div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-3 sm:p-4">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {t('employees.management.avgOccupancy')}
              </p>
              <p className="text-xl sm:text-2xl font-bold mt-1">{stats.avgOccupancy.toFixed(1)}%</p>
            </div>
          </Card>

          <Card className="p-3 sm:p-4">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {t('employees.management.avgRating')}
              </p>
              <p className="text-xl sm:text-2xl font-bold mt-1">{stats.avgRating.toFixed(1)} ⭐</p>
            </div>
          </Card>
        </div>
      </div>

      {/* FILTERS BAR */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            onClick={toggleFilters}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            {t('employees.management.filters')}
            {(filters.searchQuery || filters.hierarchyLevel !== undefined || filters.employeeType || filters.departmentId) && (
              <span className="ml-1 rounded-full bg-primary-foreground px-2 py-0.5 text-xs">
                {[filters.searchQuery, filters.hierarchyLevel, filters.employeeType, filters.departmentId].filter(Boolean).length}
              </span>
            )}
          </Button>

          {(filters.searchQuery || filters.hierarchyLevel !== undefined || filters.employeeType || filters.departmentId) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
            >
              {t('employees.management.clearFilters')}
            </Button>
          )}
        </div>

        <div className="text-sm text-muted-foreground">
          {employees.length} {t('employees.management.employeesShown')}
        </div>
      </div>

      {/* FILTERS PANEL (Collapsible) */}
      {showFilters && (
        <Card className="p-4">
          <FiltersPanel
            filters={filters}
            onFiltersChange={updateFilters}
            onClear={handleClearFilters}
          />
        </Card>
      )}

      {/* MAIN CONTENT - LIST OR MAP VIEW */}
      <div className="flex-1">
        {viewMode === 'list' ? (
          <Card className="p-6">
            <EmployeeListView
              employees={employees}
              onEmployeeSelect={handleEmployeeClick}
              onEdit={handleEmployeeClick}
              onViewProfile={handleEmployeeClick}
              onAssignSupervisor={handleEmployeeClick}
            />
          </Card>
        ) : (
          <Card className="p-6">
            <HierarchyMapView
              employees={employees}
              onEmployeeSelect={handleEmployeeClick}
            />
          </Card>
        )}
      </div>
    </div>
  )
}

export default EmployeeManagementHierarchy
