import { X } from 'lucide-react'
import type { HierarchyFilters } from '@/types'

interface ActiveFiltersIndicatorProps {
  filters: HierarchyFilters
  locations: Array<{ id: string; name: string }>
  onRemoveSearch: () => void
  onRemoveLevel: () => void
  onRemoveEmployeeType: () => void
  onRemoveLocation: () => void
}

export function ActiveFiltersIndicator({
  filters,
  locations,
  onRemoveSearch,
  onRemoveLevel,
  onRemoveEmployeeType,
  onRemoveLocation,
}: ActiveFiltersIndicatorProps) {
  const hasActiveFilters =
    filters.searchQuery ||
    filters.hierarchyLevel !== undefined ||
    filters.employeeType ||
    filters.departmentId ||
    filters.location_id

  if (!hasActiveFilters) {
    return null
  }

  return (
    <div className="pt-4 border-t">
      <div className="flex flex-wrap gap-2">
        {filters.searchQuery && (
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-xs">
            <span className="font-medium">Búsqueda:</span>
            <span>{filters.searchQuery}</span>
            <button onClick={onRemoveSearch} aria-label="Quitar filtro de búsqueda" title="Quitar filtro de búsqueda">
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
        )}
        {filters.hierarchyLevel !== undefined && (
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-xs">
            <span className="font-medium">Nivel:</span>
            <span>{filters.hierarchyLevel}</span>
            <button onClick={onRemoveLevel} aria-label="Quitar filtro de nivel" title="Quitar filtro de nivel">
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
        )}
        {filters.employeeType && (
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-xs">
            <span className="font-medium">Tipo:</span>
            <span>{filters.employeeType}</span>
            <button onClick={onRemoveEmployeeType} aria-label="Quitar filtro de tipo" title="Quitar filtro de tipo">
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
        )}
        {filters.location_id && (
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-xs">
            <span className="font-medium">Sede:</span>
            <span>
              {locations.find(l => l.id === filters.location_id)?.name || filters.location_id}
            </span>
            <button onClick={onRemoveLocation} aria-label="Quitar filtro de sede" title="Quitar filtro de sede">
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}