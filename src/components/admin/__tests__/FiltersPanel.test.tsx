// ============================================================================
// TESTS: FiltersPanel Component
// Tests para el panel de filtros de jerarquía de empleados
// ============================================================================

import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FiltersPanel } from '../FiltersPanel'
import type { HierarchyFilters } from '@/types'

describe('FiltersPanel', () => {
  const defaultFilters: HierarchyFilters = {
    searchQuery: undefined,
    hierarchyLevel: undefined,
    employeeType: undefined,
    departmentId: undefined,
  }

  const mockOnFiltersChange = vi.fn()
  const mockOnClear = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Renderizado inicial', () => {
    it('debería renderizar el componente', () => {
      render(
        <FiltersPanel
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onClear={mockOnClear}
        />
      )

      expect(screen.getByText('Filtros')).toBeInTheDocument()
    })

    it('debería mostrar todos los campos de filtro', () => {
      render(
        <FiltersPanel
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onClear={mockOnClear}
        />
      )

      expect(screen.getByLabelText('Buscar')).toBeInTheDocument()
      expect(screen.getByLabelText('Nivel Jerárquico')).toBeInTheDocument()
      expect(screen.getByLabelText('Tipo de Empleado')).toBeInTheDocument()
      expect(screen.getByLabelText('Departamento')).toBeInTheDocument()
      expect(screen.getByText('Ocupación')).toBeInTheDocument()
      expect(screen.getByText('Rating')).toBeInTheDocument()
    })

    it('NO debería mostrar botón "Limpiar todo" sin filtros activos', () => {
      render(
        <FiltersPanel
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onClear={mockOnClear}
        />
      )

      expect(screen.queryByText('Limpiar todo')).not.toBeInTheDocument()
    })

    it('debería mostrar botón "Limpiar todo" con filtros activos', () => {
      const filtersWithSearch: HierarchyFilters = {
        ...defaultFilters,
        searchQuery: 'John',
      }

      render(
        <FiltersPanel
          filters={filtersWithSearch}
          onFiltersChange={mockOnFiltersChange}
          onClear={mockOnClear}
        />
      )

      expect(screen.getByText('Limpiar todo')).toBeInTheDocument()
    })
  })

  describe('Filtro de Búsqueda', () => {
    it('debería actualizar el filtro de búsqueda al escribir', () => {
      render(
        <FiltersPanel
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onClear={mockOnClear}
        />
      )

      const searchInput = screen.getByPlaceholderText('Nombre, email o cargo...')
      fireEvent.change(searchInput, { target: { value: 'John Doe' } })

      expect(mockOnFiltersChange).toHaveBeenCalledWith({ searchQuery: 'John Doe' })
    })

    it('debería mostrar el valor del filtro de búsqueda', () => {
      const filtersWithSearch: HierarchyFilters = {
        ...defaultFilters,
        searchQuery: 'Jane Smith',
      }

      render(
        <FiltersPanel
          filters={filtersWithSearch}
          onFiltersChange={mockOnFiltersChange}
          onClear={mockOnClear}
        />
      )

      const searchInput = screen.getByPlaceholderText('Nombre, email o cargo...')
      expect(searchInput).toHaveValue('Jane Smith')
    })

    it('debería limpiar el filtro de búsqueda al hacer clic en X', () => {
      const filtersWithSearch: HierarchyFilters = {
        ...defaultFilters,
        searchQuery: 'Test',
      }

      render(
        <FiltersPanel
          filters={filtersWithSearch}
          onFiltersChange={mockOnFiltersChange}
          onClear={mockOnClear}
        />
      )

      // Buscar el botón X dentro del input de búsqueda
      const searchContainer = screen.getByPlaceholderText('Nombre, email o cargo...').closest('div')
      const clearButton = within(searchContainer!).getByRole('button')

      fireEvent.click(clearButton)

      expect(mockOnFiltersChange).toHaveBeenCalledWith({ searchQuery: '' })
    })
  })

  describe('Filtro de Nivel Jerárquico', () => {
    it('debería actualizar el filtro de nivel', () => {
      render(
        <FiltersPanel
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onClear={mockOnClear}
        />
      )

      const levelSelect = screen.getByLabelText('Nivel Jerárquico')
      fireEvent.click(levelSelect)

      // Simular selección de nivel 2
      const level2Option = screen.getByText('Nivel 2 - Manager')
      fireEvent.click(level2Option)

      expect(mockOnFiltersChange).toHaveBeenCalledWith({ hierarchyLevel: 2 })
    })

    it('debería mostrar "Todos los niveles" cuando no hay filtro', () => {
      render(
        <FiltersPanel
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onClear={mockOnClear}
        />
      )

      const levelSelect = screen.getByLabelText('Nivel Jerárquico')
      expect(levelSelect).toHaveTextContent('Todos los niveles')
    })

    it('debería limpiar el filtro al seleccionar "Todos los niveles"', () => {
      const filtersWithLevel: HierarchyFilters = {
        ...defaultFilters,
        hierarchyLevel: 2,
      }

      render(
        <FiltersPanel
          filters={filtersWithLevel}
          onFiltersChange={mockOnFiltersChange}
          onClear={mockOnClear}
        />
      )

      const levelSelect = screen.getByLabelText('Nivel Jerárquico')
      fireEvent.click(levelSelect)

      const allLevelsOption = screen.getByText('Todos los niveles')
      fireEvent.click(allLevelsOption)

      expect(mockOnFiltersChange).toHaveBeenCalledWith({ hierarchyLevel: undefined })
    })
  })

  describe('Filtro de Tipo de Empleado', () => {
    it('debería actualizar el filtro de tipo', () => {
      render(
        <FiltersPanel
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onClear={mockOnClear}
        />
      )

      const typeSelect = screen.getByLabelText('Tipo de Empleado')
      fireEvent.click(typeSelect)

      const providerOption = screen.getByText('Proveedor de Servicio')
      fireEvent.click(providerOption)

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        employeeType: 'service_provider',
      })
    })

    it('debería limpiar el filtro al seleccionar "Todos los tipos"', () => {
      const filtersWithType: HierarchyFilters = {
        ...defaultFilters,
        employeeType: 'service_provider',
      }

      render(
        <FiltersPanel
          filters={filtersWithType}
          onFiltersChange={mockOnFiltersChange}
          onClear={mockOnClear}
        />
      )

      const typeSelect = screen.getByLabelText('Tipo de Empleado')
      fireEvent.click(typeSelect)

      const allTypesOption = screen.getByText('Todos los tipos')
      fireEvent.click(allTypesOption)

      expect(mockOnFiltersChange).toHaveBeenCalledWith({ employeeType: undefined })
    })
  })

  describe('Filtro de Departamento', () => {
    it('debería actualizar el filtro de departamento', () => {
      render(
        <FiltersPanel
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onClear={mockOnClear}
        />
      )

      const deptSelect = screen.getByLabelText('Departamento')
      fireEvent.click(deptSelect)

      const salesOption = screen.getByText('Ventas')
      fireEvent.click(salesOption)

      expect(mockOnFiltersChange).toHaveBeenCalledWith({ departmentId: 'sales' })
    })

    it('debería limpiar el filtro al seleccionar "Todos los departamentos"', () => {
      const filtersWithDept: HierarchyFilters = {
        ...defaultFilters,
        departmentId: 'sales',
      }

      render(
        <FiltersPanel
          filters={filtersWithDept}
          onFiltersChange={mockOnFiltersChange}
          onClear={mockOnClear}
        />
      )

      const deptSelect = screen.getByLabelText('Departamento')
      fireEvent.click(deptSelect)

      const allDeptsOption = screen.getByText('Todos los departamentos')
      fireEvent.click(allDeptsOption)

      expect(mockOnFiltersChange).toHaveBeenCalledWith({ departmentId: undefined })
    })
  })

  describe('Botón Limpiar Todo', () => {
    it('debería llamar a onClear al hacer clic en "Limpiar todo"', () => {
      const filtersWithMultiple: HierarchyFilters = {
        searchQuery: 'Test',
        hierarchyLevel: 2,
        employeeType: 'service_provider',
        departmentId: 'sales',
      }

      render(
        <FiltersPanel
          filters={filtersWithMultiple}
          onFiltersChange={mockOnFiltersChange}
          onClear={mockOnClear}
        />
      )

      const clearButton = screen.getByText('Limpiar todo')
      fireEvent.click(clearButton)

      expect(mockOnClear).toHaveBeenCalled()
    })
  })

  describe('Indicadores de Filtros Activos', () => {
    it('debería mostrar chip para búsqueda activa', () => {
      const filtersWithSearch: HierarchyFilters = {
        ...defaultFilters,
        searchQuery: 'John',
      }

      render(
        <FiltersPanel
          filters={filtersWithSearch}
          onFiltersChange={mockOnFiltersChange}
          onClear={mockOnClear}
        />
      )

      expect(screen.getByText('Búsqueda:')).toBeInTheDocument()
      expect(screen.getByText('John')).toBeInTheDocument()
    })

    it('debería mostrar chip para nivel activo', () => {
      const filtersWithLevel: HierarchyFilters = {
        ...defaultFilters,
        hierarchyLevel: 2,
      }

      render(
        <FiltersPanel
          filters={filtersWithLevel}
          onFiltersChange={mockOnFiltersChange}
          onClear={mockOnClear}
        />
      )

      expect(screen.getByText('Nivel:')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('debería mostrar chip para tipo activo', () => {
      const filtersWithType: HierarchyFilters = {
        ...defaultFilters,
        employeeType: 'service_provider',
      }

      render(
        <FiltersPanel
          filters={filtersWithType}
          onFiltersChange={mockOnFiltersChange}
          onClear={mockOnClear}
        />
      )

      expect(screen.getByText('Tipo:')).toBeInTheDocument()
      expect(screen.getByText('service_provider')).toBeInTheDocument()
    })

    it('debería mostrar múltiples chips cuando hay múltiples filtros', () => {
      const filtersWithMultiple: HierarchyFilters = {
        searchQuery: 'Test',
        hierarchyLevel: 2,
        employeeType: 'service_provider',
        departmentId: undefined,
      }

      render(
        <FiltersPanel
          filters={filtersWithMultiple}
          onFiltersChange={mockOnFiltersChange}
          onClear={mockOnClear}
        />
      )

      expect(screen.getByText('Búsqueda:')).toBeInTheDocument()
      expect(screen.getByText('Nivel:')).toBeInTheDocument()
      expect(screen.getByText('Tipo:')).toBeInTheDocument()
    })
  })

  describe('Sliders de Rangos', () => {
    it('debería mostrar rango de ocupación inicial', () => {
      render(
        <FiltersPanel
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onClear={mockOnClear}
        />
      )

      expect(screen.getByText('0% - 100%')).toBeInTheDocument()
    })

    it('debería mostrar rango de rating inicial', () => {
      render(
        <FiltersPanel
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onClear={mockOnClear}
        />
      )

      expect(screen.getByText(/0\.0 - 5\.0/)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('debería tener labels para todos los inputs', () => {
      render(
        <FiltersPanel
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onClear={mockOnClear}
        />
      )

      expect(screen.getByLabelText('Buscar')).toBeInTheDocument()
      expect(screen.getByLabelText('Nivel Jerárquico')).toBeInTheDocument()
      expect(screen.getByLabelText('Tipo de Empleado')).toBeInTheDocument()
      expect(screen.getByLabelText('Departamento')).toBeInTheDocument()
      expect(screen.getByText('Ocupación')).toBeInTheDocument()
      expect(screen.getByText('Rating')).toBeInTheDocument()
    })

    it('debería tener botón "Limpiar todo" accesible cuando hay filtros', () => {
      const filtersWithSearch: HierarchyFilters = {
        ...defaultFilters,
        searchQuery: 'Test',
      }

      render(
        <FiltersPanel
          filters={filtersWithSearch}
          onFiltersChange={mockOnFiltersChange}
          onClear={mockOnClear}
        />
      )

      const clearButton = screen.getByText('Limpiar todo').closest('button')
      expect(clearButton).toBeInTheDocument()
    })
  })
})
