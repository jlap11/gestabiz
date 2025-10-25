/**
 * @file FiltersPanel.tsx
 * @description Panel de filtros avanzados para jerarquía de empleados
 * 7 filtros: Búsqueda, Sede, Nivel, Tipo, Departamento, Ocupación, Rating
 * Phase 3 - UI Components
 */

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import type { HierarchyFilters } from '@/types'
import { SearchFilter } from './filters/SearchFilter'
import { LocationFilter } from './filters/LocationFilter'
import { HierarchyLevelFilter } from './filters/HierarchyLevelFilter'
import { EmployeeTypeFilter } from './filters/EmployeeTypeFilter'
import { DepartmentFilter } from './filters/DepartmentFilter'
import { OccupancyRangeFilter } from './filters/OccupancyRangeFilter'
import { RatingRangeFilter } from './filters/RatingRangeFilter'
import { ActiveFiltersIndicator } from './filters/ActiveFiltersIndicator'

// =====================================================
// TIPOS
// =====================================================

interface FiltersPanelProps {
  businessId: string
  filters: HierarchyFilters
  onFiltersChange: (filters: Partial<HierarchyFilters>) => void
  onClear: () => void
}

interface RangeFilter {
  min: number
  max: number
}

// =====================================================
// COMPONENTE
// =====================================================

export function FiltersPanel({
  businessId,
  filters,
  onFiltersChange,
  onClear,
}: Readonly<FiltersPanelProps>) {
  // Estados locales para rangos
  const [occupancyRange, setOccupancyRange] = useState<RangeFilter>({ min: 0, max: 100 })
  const [ratingRange, setRatingRange] = useState<RangeFilter>({ min: 0, max: 5 })
  const [locations, setLocations] = useState<Array<{ id: string; name: string }>>([])

  // Cargar sedes del negocio
  useEffect(() => {
    async function loadLocations() {
      if (!businessId) return

      const { data, error } = await supabase
        .from('locations')
        .select('id, name')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('name')

      if (!error && data) {
        setLocations(data)
      }
    }

    loadLocations()
  }, [businessId])

  // =====================================================
  // HANDLERS
  // =====================================================

  const handleSearchChange = (value: string) => {
    onFiltersChange({ searchQuery: value || undefined })
  }

  const handleLevelChange = (value: string) => {
    const level = value === 'all' ? undefined : parseInt(value)
    onFiltersChange({ hierarchyLevel: level })
  }

  const handleEmployeeTypeChange = (value: string) => {
    onFiltersChange({ employeeType: value === 'all' ? undefined : value })
  }

  const handleDepartmentChange = (value: string) => {
    onFiltersChange({ departmentId: value === 'all' ? undefined : value })
  }

  const handleLocationChange = (value: string) => {
    onFiltersChange({ location_id: value === 'all' ? undefined : value })
  }

  const handleClearAll = () => {
    setOccupancyRange({ min: 0, max: 100 })
    setRatingRange({ min: 0, max: 5 })
    onClear()
  }

  const hasActiveFilters =
    filters.searchQuery ||
    filters.hierarchyLevel !== undefined ||
    filters.employeeType ||
    filters.departmentId ||
    filters.location_id

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filtros</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="h-8 gap-1 min-h-[44px] min-w-[44px]"
            aria-label="Limpiar todos los filtros"
            title="Limpiar todos los filtros"
          >
            <X className="h-3 w-3" aria-hidden="true" />
            Limpiar todo
          </Button>
        )}
      </div>

      {/* FILTROS */}
      <SearchFilter
        value={filters.searchQuery}
        onChange={handleSearchChange}
      />

      <LocationFilter
        value={filters.location_id}
        locations={locations}
        onChange={handleLocationChange}
      />

      <HierarchyLevelFilter
        value={filters.hierarchyLevel}
        onChange={handleLevelChange}
      />

      <EmployeeTypeFilter
        value={filters.employeeType}
        onChange={handleEmployeeTypeChange}
      />

      <DepartmentFilter
        value={filters.departmentId}
        onChange={handleDepartmentChange}
      />

      <OccupancyRangeFilter
        value={occupancyRange}
        onChange={setOccupancyRange}
      />

      <RatingRangeFilter
        value={ratingRange}
        onChange={setRatingRange}
      />

      {/* INDICADOR DE FILTROS ACTIVOS */}
      <ActiveFiltersIndicator
        filters={filters}
        locations={locations}
        onRemoveSearch={() => handleSearchChange('')}
        onRemoveLevel={() => handleLevelChange('all')}
        onRemoveEmployeeType={() => handleEmployeeTypeChange('all')}
        onRemoveLocation={() => handleLocationChange('all')}
      />
    </div>
  )
}

export default FiltersPanel
