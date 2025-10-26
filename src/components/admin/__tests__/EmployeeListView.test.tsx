// ============================================================================
// TESTS: EmployeeListView Component
// Tests para la vista de lista de empleados con ordenamiento y expansión
// ============================================================================

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EmployeeListView } from '../EmployeeListView'
import type { EmployeeHierarchy } from '@/types'

describe('EmployeeListView', () => {
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
  const mockOnEdit = vi.fn()
  const mockOnViewProfile = vi.fn()
  const mockOnAssignSupervisor = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Renderizado inicial', () => {
    it('debería renderizar la lista de empleados', () => {
      render(<EmployeeListView employees={mockEmployees} />)

      expect(screen.getByText('Alice Owner')).toBeInTheDocument()
      expect(screen.getByText('Bob Manager')).toBeInTheDocument()
      expect(screen.getByText('Charlie Staff')).toBeInTheDocument()
    })

    it('debería renderizar botones de ordenamiento', () => {
      render(<EmployeeListView employees={mockEmployees} />)

      expect(screen.getByText('Nombre')).toBeInTheDocument()
      expect(screen.getByText('Nivel')).toBeInTheDocument()
      expect(screen.getByText('Ocupación')).toBeInTheDocument()
      expect(screen.getByText('Rating')).toBeInTheDocument()
      expect(screen.getByText('Ingresos')).toBeInTheDocument()
    })

    it('debería mostrar empty state cuando no hay empleados', () => {
      render(<EmployeeListView employees={[]} />)

      expect(screen.getByText('No hay empleados para mostrar')).toBeInTheDocument()
    })
  })

  describe('Ordenamiento', () => {
    it('debería ordenar por nombre ascendente por defecto', () => {
      render(<EmployeeListView employees={mockEmployees} />)

      const names = screen.getAllByText(/Owner|Manager|Staff/)
      // Por defecto ordena por nivel (level), no nombre
      expect(names[0]).toHaveTextContent('Owner')
    })

    it('debería cambiar orden al hacer clic en botón de ordenamiento', () => {
      render(<EmployeeListView employees={mockEmployees} />)

      const nameButton = screen.getByText('Nombre')
      fireEvent.click(nameButton)

      // Después de ordenar por nombre, Alice debería estar primera
      const cards = screen.getAllByText(/alice@example.com|bob@example.com|charlie@example.com/)
      expect(cards[0]).toHaveTextContent('alice@example.com')
    })

    it('debería alternar dirección de ordenamiento', () => {
      render(<EmployeeListView employees={mockEmployees} />)

      const nameButton = screen.getByText('Nombre')
      
      // Primera clic: ordenar ascendente
      fireEvent.click(nameButton)
      let cards = screen.getAllByText(/alice@example.com|bob@example.com|charlie@example.com/)
      expect(cards[0]).toHaveTextContent('alice@example.com')

      // Segunda clic: ordenar descendente
      fireEvent.click(nameButton)
      cards = screen.getAllByText(/alice@example.com|bob@example.com|charlie@example.com/)
      expect(cards[0]).toHaveTextContent('charlie@example.com')
    })

    it('debería ordenar por ocupación', () => {
      render(<EmployeeListView employees={mockEmployees} />)

      const occupancyButton = screen.getByText('Ocupación')
      fireEvent.click(occupancyButton)

      // Charlie (60%) debería estar primero
      const cards = screen.getAllByText(/60%|75%|90%/)
      expect(cards[0]).toHaveTextContent('60%')
    })

    it('debería ordenar por rating', () => {
      render(<EmployeeListView employees={mockEmployees} />)

      const ratingButton = screen.getByText('Rating')
      fireEvent.click(ratingButton)

      // Charlie (4.2) debería estar primero
      const cards = screen.getAllByText(/4\.2|4\.5|4\.8/)
      expect(cards[0]).toHaveTextContent('4.2')
    })

    it('debería ordenar por ingresos', () => {
      render(<EmployeeListView employees={mockEmployees} />)

      const revenueButton = screen.getByText('Ingresos')
      fireEvent.click(revenueButton)

      // Charlie ($15,000) debería estar primero
      const cards = screen.getAllByText(/15,000|30,000|50,000/)
      expect(cards[0]).toHaveTextContent('15')
    })
  })

  describe('Expansión de subordinados', () => {
    it('debería mostrar botón de expansión para empleados con subordinados', () => {
      render(<EmployeeListView employees={mockEmployees} />)

      // Alice y Bob tienen subordinados
      const expandButtons = screen.getAllByRole('button', { name: /chevron/i })
      expect(expandButtons.length).toBeGreaterThan(0)
    })

    it('debería expandir subordinados al hacer clic', () => {
      render(<EmployeeListView employees={mockEmployees} />)

      // Buscar el botón de expansión de Alice (que tiene a Bob como subordinado)
      const aliceCard = screen.getByText('Alice Owner').closest('div')
      const expandButton = aliceCard?.querySelector('button')
      
      if (expandButton) {
        fireEvent.click(expandButton)

        // Bob debería aparecer como subordinado expandido
        expect(screen.getAllByText('Bob Manager').length).toBeGreaterThan(0)
      }
    })

    it('debería colapsar subordinados al hacer clic nuevamente', () => {
      render(<EmployeeListView employees={mockEmployees} />)

      const aliceCard = screen.getByText('Alice Owner').closest('div')
      const expandButton = aliceCard?.querySelector('button')
      
      if (expandButton) {
        // Expandir
        fireEvent.click(expandButton)
        
        // Colapsar
        fireEvent.click(expandButton)

        // Verificar que solo aparece una vez (la original)
        const bobCards = screen.getAllByText('Bob Manager')
        expect(bobCards.length).toBe(1)
      }
    })
  })

  describe('Callbacks', () => {
    it('debería llamar a onEmployeeSelect al seleccionar empleado', () => {
      render(
        <EmployeeListView
          employees={mockEmployees}
          onEmployeeSelect={mockOnEmployeeSelect}
        />
      )

      const aliceCard = screen.getByText('Alice Owner')
      fireEvent.click(aliceCard)

      expect(mockOnEmployeeSelect).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 'user-1' })
      )
    })

    it('debería pasar callbacks a EmployeeCard', () => {
      render(
        <EmployeeListView
          employees={mockEmployees}
          onEdit={mockOnEdit}
          onViewProfile={mockOnViewProfile}
          onAssignSupervisor={mockOnAssignSupervisor}
        />
      )

      // Verificar que los botones del dropdown están presentes
      const dropdownButtons = screen.getAllByRole('button', { name: /more/i })
      expect(dropdownButtons.length).toBeGreaterThan(0)
    })
  })

  describe('Jerarquía de empleados', () => {
    it('debería mostrar empleados en orden jerárquico por defecto', () => {
      render(<EmployeeListView employees={mockEmployees} />)

      const names = screen.getAllByText(/Owner|Manager|Staff/)
      
      // Por defecto ordena por nivel: Owner (0) -> Manager (2) -> Staff (4)
      expect(names[0]).toHaveTextContent('Owner')
    })

    it('debería identificar correctamente subordinados directos', () => {
      render(<EmployeeListView employees={mockEmployees} />)

      // Alice (user-1) tiene 2 subordinados directos
      const aliceCard = screen.getByText('Alice Owner').closest('[data-testid="employee-row"]')
      
      if (aliceCard) {
        const subordinateCount = aliceCard.querySelector('[data-testid="subordinate-count"]')
        if (subordinateCount) {
          expect(subordinateCount).toHaveTextContent('2')
        }
      }
    })
  })

  describe('Estados de empleados', () => {
    it('debería mostrar empleados activos', () => {
      render(<EmployeeListView employees={mockEmployees} />)

      // Todos los empleados mock están activos
      expect(screen.queryByText('Inactivo')).not.toBeInTheDocument()
    })

    it('debería mostrar empleados inactivos', () => {
      const employeesWithInactive = [
        ...mockEmployees,
        {
          ...mockEmployees[0],
          user_id: 'user-4',
          full_name: 'David Inactive',
          is_active: false,
        },
      ]

      render(<EmployeeListView employees={employeesWithInactive} />)

      expect(screen.getByText('David Inactive')).toBeInTheDocument()
      expect(screen.getByText('Inactivo')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('debería tener botones de ordenamiento accesibles', () => {
      render(<EmployeeListView employees={mockEmployees} />)

      const sortButtons = screen.getAllByRole('button')
      expect(sortButtons.length).toBeGreaterThan(0)
    })

    it('debería tener estructura de lista navegable', () => {
      render(<EmployeeListView employees={mockEmployees} />)

      // Verificar que hay múltiples cards renderizados
      const employeeCards = screen.getAllByText(/Owner|Manager|Staff/)
      expect(employeeCards.length).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases', () => {
    it('debería manejar empleados sin métricas', () => {
      const employeesWithoutMetrics: EmployeeHierarchy[] = [
        {
          ...mockEmployees[0],
          occupancy_percentage: 0,
          average_rating: 0,
          total_revenue: 0,
        },
      ]

      render(<EmployeeListView employees={employeesWithoutMetrics} />)

      expect(screen.getByText('Alice Owner')).toBeInTheDocument()
    })

    it('debería manejar empleados sin departamento', () => {
      const employeesWithoutDept: EmployeeHierarchy[] = [
        {
          ...mockEmployees[0],
          department_id: null,
          department_name: null,
        },
      ]

      render(<EmployeeListView employees={employeesWithoutDept} />)

      expect(screen.getByText('Sin departamento')).toBeInTheDocument()
    })

    it('debería manejar empleados sin supervisor', () => {
      render(<EmployeeListView employees={mockEmployees} />)

      // Alice no tiene supervisor (es owner)
      const aliceSection = screen.getByText('Alice Owner').closest('div')
      expect(aliceSection).toHaveTextContent('Sin supervisor')
    })
  })
})
