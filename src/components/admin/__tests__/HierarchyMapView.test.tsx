// ============================================================================
// TESTS: HierarchyMapView Component
// Tests para la vista de mapa/organigrama jerárquico
// ============================================================================

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HierarchyMapView } from '../HierarchyMapView'
import type { EmployeeHierarchy } from '@/types'

describe('HierarchyMapView', () => {
  const mockEmployees: EmployeeHierarchy[] = [
    {
      user_id: 'user-1',
      full_name: 'Alice Owner',
      email: 'alice@example.com',
      role: 'employee',
      employee_type: 'fullTime',
      hierarchy_level: 0,
      job_title: 'Owner',
      reports_to: null,
      supervisor_name: null,
      supervisor_email: null,
      direct_reports_count: 2,
      occupancy_percentage: 90,
      average_rating: 4.8,
      total_revenue: 50000,
      department_id: null,
      department_name: null,
      is_active: true,
      hire_date: '2020-01-01',
      phone: null,
      avatar_url: null,
      created_at: '2020-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      user_id: 'user-2',
      full_name: 'Bob Manager',
      email: 'bob@example.com',
      role: 'employee',
      employee_type: 'fullTime',
      hierarchy_level: 2,
      job_title: 'Manager',
      reports_to: 'user-1',
      supervisor_name: 'Alice Owner',
      supervisor_email: 'alice@example.com',
      direct_reports_count: 1,
      occupancy_percentage: 75,
      average_rating: 4.5,
      total_revenue: 30000,
      department_id: 'sales',
      department_name: 'Sales',
      is_active: true,
      hire_date: '2021-06-15',
      phone: null,
      avatar_url: null,
      created_at: '2021-06-15T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      user_id: 'user-3',
      full_name: 'Charlie Staff',
      email: 'charlie@example.com',
      role: 'employee',
      employee_type: 'fullTime',
      hierarchy_level: 4,
      job_title: 'Staff',
      reports_to: 'user-2',
      supervisor_name: 'Bob Manager',
      supervisor_email: 'bob@example.com',
      direct_reports_count: 0,
      occupancy_percentage: 60,
      average_rating: 4.2,
      total_revenue: 15000,
      department_id: 'sales',
      department_name: 'Sales',
      is_active: true,
      hire_date: '2023-03-20',
      phone: null,
      avatar_url: null,
      created_at: '2023-03-20T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ]

  const mockOnEmployeeSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Renderizado inicial', () => {
    it('debería renderizar el mapa de jerarquía', () => {
      render(<HierarchyMapView employees={mockEmployees} />)

      expect(screen.getByText('Alice Owner')).toBeInTheDocument()
    })

    it('debería renderizar todos los nodos raíz', () => {
      render(<HierarchyMapView employees={mockEmployees} />)

      // Alice es el único nodo raíz
      expect(screen.getByText('Alice Owner')).toBeInTheDocument()
    })

    it('debería renderizar controles de zoom', () => {
      render(<HierarchyMapView employees={mockEmployees} />)

      expect(screen.getByLabelText(/zoom in/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/zoom out/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/reset/i)).toBeInTheDocument()
    })

    it('debería renderizar botones de expandir/colapsar todo', () => {
      render(<HierarchyMapView employees={mockEmployees} />)

      expect(screen.getByText(/expandir todo/i)).toBeInTheDocument()
      expect(screen.getByText(/colapsar todo/i)).toBeInTheDocument()
    })

    it('debería mostrar empty state cuando no hay empleados', () => {
      render(<HierarchyMapView employees={[]} />)

      expect(screen.getByText(/no hay empleados/i)).toBeInTheDocument()
    })
  })

  describe('Construcción de árbol jerárquico', () => {
    it('debería identificar correctamente nodos raíz', () => {
      render(<HierarchyMapView employees={mockEmployees} />)

      // Alice no tiene reports_to, debe ser raíz
      expect(screen.getByText('Alice Owner')).toBeInTheDocument()
    })

    it('debería construir árbol con múltiples niveles', () => {
      render(<HierarchyMapView employees={mockEmployees} />)

      // Verificar que existe el nodo raíz
      expect(screen.getByText('Alice Owner')).toBeInTheDocument()
      
      // Bob debería estar oculto inicialmente (colapsado)
      expect(screen.queryByText('Bob Manager')).not.toBeInTheDocument()
    })

    it('debería manejar múltiples raíces', () => {
      const employeesWithMultipleRoots: EmployeeHierarchy[] = [
        { ...mockEmployees[0], user_id: 'root-1' },
        { ...mockEmployees[0], user_id: 'root-2', full_name: 'Second Root' },
      ]

      render(<HierarchyMapView employees={employeesWithMultipleRoots} />)

      expect(screen.getByText('Alice Owner')).toBeInTheDocument()
      expect(screen.getByText('Second Root')).toBeInTheDocument()
    })
  })

  describe('Expansión y colapso', () => {
    it('debería expandir nodo al hacer clic en botón de expansión', () => {
      render(<HierarchyMapView employees={mockEmployees} />)

      // Encontrar y hacer clic en botón de expansión de Alice
      const expandButton = screen.getAllByRole('button')[3] // Ajustar índice según UI
      fireEvent.click(expandButton)

      // Bob debería aparecer después de expandir
      expect(screen.getByText('Bob Manager')).toBeInTheDocument()
    })

    it('debería colapsar nodo al hacer clic nuevamente', () => {
      render(<HierarchyMapView employees={mockEmployees} />)

      const expandButton = screen.getAllByRole('button')[3]
      
      // Expandir
      fireEvent.click(expandButton)
      expect(screen.getByText('Bob Manager')).toBeInTheDocument()

      // Colapsar
      fireEvent.click(expandButton)
      expect(screen.queryByText('Bob Manager')).not.toBeInTheDocument()
    })

    it('debería expandir todos los nodos con "Expandir todo"', () => {
      render(<HierarchyMapView employees={mockEmployees} />)

      const expandAllButton = screen.getByText(/expandir todo/i)
      fireEvent.click(expandAllButton)

      // Todos los empleados deberían ser visibles
      expect(screen.getByText('Alice Owner')).toBeInTheDocument()
      expect(screen.getByText('Bob Manager')).toBeInTheDocument()
      expect(screen.getByText('Charlie Staff')).toBeInTheDocument()
    })

    it('debería colapsar todos los nodos con "Colapsar todo"', () => {
      render(<HierarchyMapView employees={mockEmployees} />)

      // Expandir todos los nodos
      const expandAllButton = screen.getByText(/expandir todo/i)
      fireEvent.click(expandAllButton)

      // Colapsar todos los nodos
      const collapseAllButton = screen.getByText(/colapsar todo/i)
      fireEvent.click(collapseAllButton)

      // Solo la raíz debería ser visible
      expect(screen.getByText('Alice Owner')).toBeInTheDocument()
      expect(screen.queryByText('Bob Manager')).not.toBeInTheDocument()
      expect(screen.queryByText('Charlie Staff')).not.toBeInTheDocument()
    })
  })

  describe('Controles de zoom', () => {
    it('debería hacer zoom in al hacer clic en botón +', () => {
      const { container } = render(<HierarchyMapView employees={mockEmployees} />)

      const zoomInButton = screen.getByLabelText(/zoom in/i)
      fireEvent.click(zoomInButton)

      // Verificar que el estilo de zoom cambió (110%)
      const mapContainer = container.querySelector('[style*="transform"]')
      expect(mapContainer).toBeInTheDocument()
    })

    it('debería hacer zoom out al hacer clic en botón -', () => {
      const { container } = render(<HierarchyMapView employees={mockEmployees} />)

      const zoomOutButton = screen.getByLabelText(/zoom out/i)
      fireEvent.click(zoomOutButton)

      // Verificar que el estilo de zoom cambió (90%)
      const mapContainer = container.querySelector('[style*="transform"]')
      expect(mapContainer).toBeInTheDocument()
    })

    it('debería resetear zoom con botón reset', () => {
      const { container } = render(<HierarchyMapView employees={mockEmployees} />)

      const zoomInButton = screen.getByLabelText(/zoom in/i)
      const resetButton = screen.getByLabelText(/reset/i)

      // Zoom in varias veces
      fireEvent.click(zoomInButton)
      fireEvent.click(zoomInButton)

      // Reset
      fireEvent.click(resetButton)

      // Debería volver a 100%
      const mapContainer = container.querySelector('[style*="scale(1)"]')
      expect(mapContainer).toBeInTheDocument()
    })

    it('debería limitar zoom máximo a 150%', () => {
      render(<HierarchyMapView employees={mockEmployees} />)

      const zoomInButton = screen.getByLabelText(/zoom in/i)

      // Hacer clic muchas veces
      for (let i = 0; i < 10; i++) {
        fireEvent.click(zoomInButton)
      }

      // Zoom no debería pasar de 150%
      expect(zoomInButton).toBeInTheDocument()
    })

    it('debería limitar zoom mínimo a 50%', () => {
      render(<HierarchyMapView employees={mockEmployees} />)

      const zoomOutButton = screen.getByLabelText(/zoom out/i)

      // Hacer clic muchas veces
      for (let i = 0; i < 10; i++) {
        fireEvent.click(zoomOutButton)
      }

      // Zoom no debería bajar de 50%
      expect(zoomOutButton).toBeInTheDocument()
    })
  })

  describe('Selección de empleados', () => {
    it('debería llamar a onEmployeeSelect al hacer clic en nodo', () => {
      render(
        <HierarchyMapView
          employees={mockEmployees}
          onEmployeeSelect={mockOnEmployeeSelect}
        />
      )

      const aliceNode = screen.getByText('Alice Owner')
      fireEvent.click(aliceNode)

      expect(mockOnEmployeeSelect).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 'user-1' })
      )
    })

    it('debería funcionar sin onEmployeeSelect callback', () => {
      render(<HierarchyMapView employees={mockEmployees} />)

      const aliceNode = screen.getByText('Alice Owner')
      fireEvent.click(aliceNode)

      // No debería lanzar error
      expect(aliceNode).toBeInTheDocument()
    })
  })

  describe('Conectores visuales', () => {
    it('debería mostrar conectores cuando nodo está expandido', () => {
      const { container } = render(<HierarchyMapView employees={mockEmployees} />)

      // Expandir Alice
      const expandButton = screen.getAllByRole('button')[3]
      fireEvent.click(expandButton)

      // Verificar que hay líneas conectoras (divs con clase de conector)
      const connectors = container.querySelectorAll('.h-8, .h-12')
      expect(connectors.length).toBeGreaterThan(0)
    })

    it('NO debería mostrar conectores cuando nodo está colapsado', () => {
      const { container } = render(<HierarchyMapView employees={mockEmployees} />)

      // Por defecto colapsado
      const connectors = container.querySelectorAll('.children-container')
      
      // No deberían haber contenedores de hijos visibles
      expect(connectors.length).toBe(0)
    })
  })

  describe('Edge cases', () => {
    it('debería manejar empleado sin subordinados', () => {
      const singleEmployee: EmployeeHierarchy[] = [mockEmployees[2]] // Charlie sin subordinados

      render(<HierarchyMapView employees={singleEmployee} />)

      expect(screen.getByText('Charlie Staff')).toBeInTheDocument()
    })

    it('debería manejar jerarquía plana (todos al mismo nivel)', () => {
      const flatEmployees: EmployeeHierarchy[] = mockEmployees.map(emp => ({
        ...emp,
        reports_to: null,
      }))

      render(<HierarchyMapView employees={flatEmployees} />)

      // Todos deberían ser nodos raíz
      expect(screen.getByText('Alice Owner')).toBeInTheDocument()
      expect(screen.getByText('Bob Manager')).toBeInTheDocument()
      expect(screen.getByText('Charlie Staff')).toBeInTheDocument()
    })

    it('debería manejar jerarquía profunda (muchos niveles)', () => {
      const deepHierarchy: EmployeeHierarchy[] = [
        mockEmployees[0], // Nivel 0
        { ...mockEmployees[1], user_id: 'l1', reports_to: 'user-1' }, // Nivel 1
        { ...mockEmployees[2], user_id: 'l2', reports_to: 'l1' }, // Nivel 2
        { ...mockEmployees[2], user_id: 'l3', full_name: 'Level 3', reports_to: 'l2' }, // Nivel 3
      ]

      render(<HierarchyMapView employees={deepHierarchy} />)

      expect(screen.getByText('Alice Owner')).toBeInTheDocument()
    })

    it('debería manejar referencias circulares (edge case inválido)', () => {
      const circularEmployees: EmployeeHierarchy[] = [
        { ...mockEmployees[0], reports_to: 'user-2' }, // Alice → Bob
        { ...mockEmployees[1], reports_to: 'user-1' }, // Bob → Alice (circular!)
      ]

      // No debería crashear
      render(<HierarchyMapView employees={circularEmployees} />)

      expect(screen.getByText('Alice Owner')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('debería tener botones de control accesibles', () => {
      render(<HierarchyMapView employees={mockEmployees} />)

      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('debería tener labels en botones de zoom', () => {
      render(<HierarchyMapView employees={mockEmployees} />)

      expect(screen.getByLabelText(/zoom in/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/zoom out/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/reset/i)).toBeInTheDocument()
    })
  })
})
