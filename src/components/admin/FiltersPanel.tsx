/**
 * @file FiltersPanel.tsx
 * @description Panel de filtros avanzados para jerarquía de empleados
 * 7 filtros: Búsqueda, Sede, Nivel, Tipo, Departamento, Ocupación, Rating
 * Phase 3 - UI Components
 */

import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { supabase } from '@/lib/supabase'
import type { HierarchyFilters } from '@/types'

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

export function FiltersPanel({ businessId, filters, onFiltersChange, onClear }: FiltersPanelProps) {
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
            className="h-8 gap-1"
          >
            <X className="h-3 w-3" />
            Limpiar todo
          </Button>
        )}
      </div>

      {/* BÚSQUEDA */}
      <div className="space-y-2">
        <Label htmlFor="search">Buscar</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Nombre, email o cargo..."
            value={filters.searchQuery || ''}
            onChange={e => handleSearchChange(e.target.value)}
            className="pl-9"
          />
          {filters.searchQuery && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* FILTRO POR SEDE */}
      <div className="space-y-2">
        <Label htmlFor="location">Sede</Label>
        <Select
          value={filters.location_id || 'all'}
          onValueChange={handleLocationChange}
        >
          <SelectTrigger id="location">
            <SelectValue placeholder="Todas las sedes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las sedes</SelectItem>
            {locations.map(location => (
              <SelectItem key={location.id} value={location.id}>
                {location.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* NIVEL JERÁRQUICO */}
      <div className="space-y-2">
        <Label htmlFor="level">Nivel Jerárquico</Label>
        <Select
          value={filters.hierarchyLevel !== undefined ? String(filters.hierarchyLevel) : 'all'}
          onValueChange={handleLevelChange}
        >
          <SelectTrigger id="level">
            <SelectValue placeholder="Todos los niveles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los niveles</SelectItem>
            <SelectItem value="0">Nivel 0 - Owner</SelectItem>
            <SelectItem value="1">Nivel 1 - Admin</SelectItem>
            <SelectItem value="2">Nivel 2 - Manager</SelectItem>
            <SelectItem value="3">Nivel 3 - Team Lead</SelectItem>
            <SelectItem value="4">Nivel 4 - Staff</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* TIPO DE EMPLEADO */}
      <div className="space-y-2">
        <Label htmlFor="employee-type">Tipo de Empleado</Label>
        <Select
          value={filters.employeeType || 'all'}
          onValueChange={handleEmployeeTypeChange}
        >
          <SelectTrigger id="employee-type">
            <SelectValue placeholder="Todos los tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="service_provider">Proveedor de Servicio</SelectItem>
            <SelectItem value="support_staff">Personal de Apoyo</SelectItem>
            <SelectItem value="location_manager">Gerente de Sede</SelectItem>
            <SelectItem value="team_lead">Líder de Equipo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* DEPARTAMENTO */}
      <div className="space-y-2">
        <Label htmlFor="department">Departamento</Label>
        <Select
          value={filters.departmentId || 'all'}
          onValueChange={handleDepartmentChange}
        >
          <SelectTrigger id="department">
            <SelectValue placeholder="Todos los departamentos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los departamentos</SelectItem>
            <SelectItem value="sales">Ventas</SelectItem>
            <SelectItem value="operations">Operaciones</SelectItem>
            <SelectItem value="customer-service">Atención al Cliente</SelectItem>
            <SelectItem value="technical">Técnico</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* RANGO DE OCUPACIÓN */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Ocupación</Label>
          <span className="text-sm text-muted-foreground">
            {occupancyRange.min}% - {occupancyRange.max}%
          </span>
        </div>
        <Slider
          min={0}
          max={100}
          step={5}
          value={[occupancyRange.min, occupancyRange.max]}
          onValueChange={([min, max]) => setOccupancyRange({ min, max })}
          className="w-full"
        />
      </div>

      {/* RANGO DE RATING */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Rating</Label>
          <span className="text-sm text-muted-foreground">
            {ratingRange.min.toFixed(1)} - {ratingRange.max.toFixed(1)} ⭐
          </span>
        </div>
        <Slider
          min={0}
          max={5}
          step={0.5}
          value={[ratingRange.min, ratingRange.max]}
          onValueChange={([min, max]) => setRatingRange({ min, max })}
          className="w-full"
        />
      </div>

      {/* INDICADOR DE FILTROS ACTIVOS */}
      {hasActiveFilters && (
        <div className="pt-4 border-t">
          <div className="flex flex-wrap gap-2">
            {filters.searchQuery && (
              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-xs">
                <span className="font-medium">Búsqueda:</span>
                <span>{filters.searchQuery}</span>
                <button onClick={() => handleSearchChange('')}>
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {filters.hierarchyLevel !== undefined && (
              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-xs">
                <span className="font-medium">Nivel:</span>
                <span>{filters.hierarchyLevel}</span>
                <button onClick={() => handleLevelChange('all')}>
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {filters.employeeType && (
              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-xs">
                <span className="font-medium">Tipo:</span>
                <span>{filters.employeeType}</span>
                <button onClick={() => handleEmployeeTypeChange('all')}>
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {filters.location_id && (
              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-xs">
                <span className="font-medium">Sede:</span>
                <span>{locations.find(l => l.id === filters.location_id)?.name || filters.location_id}</span>
                <button onClick={() => handleLocationChange('all')}>
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default FiltersPanel
