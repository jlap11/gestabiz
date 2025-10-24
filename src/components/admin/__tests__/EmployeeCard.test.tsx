// ============================================================================
// TESTS: EmployeeCard Component
// Tests para el card de empleado individual
// ============================================================================

import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EmployeeCard } from '../EmployeeCard'
import type { EmployeeHierarchy } from '@/types'

describe('EmployeeCard', () => {
  const mockEmployee: EmployeeHierarchy = {
    user_id: 'user-123',
    full_name: 'John Doe',
    email: 'john@example.com',
    role: 'employee',
    employee_type: 'fullTime',
    hierarchy_level: 2,
    job_title: 'Manager',
    reports_to: 'user-456',
    supervisor_name: 'Jane Smith',
    supervisor_email: 'jane@example.com',
    direct_reports_count: 3,
    occupancy_percentage: 75,
    average_rating: 4.5,
    total_revenue: 15000,
    department_id: 'dept-1',
    department_name: 'Sales',
    is_active: true,
    hire_date: '2023-01-15',
    phone: '+1234567890',
    avatar_url: 'https://example.com/avatar.jpg',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  const mockOnEdit = vi.fn()
  const mockOnViewProfile = vi.fn()
  const mockOnAssignSupervisor = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Renderizado Normal', () => {
    it('debería renderizar el nombre del empleado', () => {
      render(<EmployeeCard employee={mockEmployee} />)

      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('debería renderizar el email del empleado', () => {
      render(<EmployeeCard employee={mockEmployee} />)

      expect(screen.getByText('john@example.com')).toBeInTheDocument()
    })

    it('debería renderizar el cargo (job_title)', () => {
      render(<EmployeeCard employee={mockEmployee} />)

      expect(screen.getByText('Manager')).toBeInTheDocument()
    })

    it('debería renderizar el badge de nivel jerárquico', () => {
      render(<EmployeeCard employee={mockEmployee} />)

      expect(screen.getByText('Manager')).toBeInTheDocument()
    })

    it('debería renderizar el avatar con iniciales', () => {
      render(<EmployeeCard employee={mockEmployee} />)

      // Buscar por el texto de las iniciales
      expect(screen.getByText('JD')).toBeInTheDocument()
    })

    it('debería renderizar métricas (ocupación, rating, revenue)', () => {
      render(<EmployeeCard employee={mockEmployee} />)

      expect(screen.getByText('75%')).toBeInTheDocument()
      expect(screen.getByText('4.5')).toBeInTheDocument()
      expect(screen.getByText(/15/)).toBeInTheDocument() // $15,000 o similar
    })

    it('debería renderizar contador de reportes directos', () => {
      render(<EmployeeCard employee={mockEmployee} />)

      expect(screen.getByText('3')).toBeInTheDocument()
    })
  })

  describe('Renderizado Compacto', () => {
    it('debería renderizar versión compacta', () => {
      render(<EmployeeCard employee={mockEmployee} compact />)

      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Manager')).toBeInTheDocument()
    })

    it('debería renderizar avatar en modo compacto', () => {
      render(<EmployeeCard employee={mockEmployee} compact />)

      expect(screen.getByText('JD')).toBeInTheDocument()
    })
  })

  describe('Acciones del Card', () => {
    it('debería llamar a onEdit al hacer clic en "Editar"', () => {
      render(<EmployeeCard employee={mockEmployee} onEdit={mockOnEdit} />)

      // Abrir dropdown
      const dropdownButton = screen.getByRole('button', { name: /more/i })
      fireEvent.click(dropdownButton)

      // Hacer clic en Editar
      const editOption = screen.getByText('Editar')
      fireEvent.click(editOption)

      expect(mockOnEdit).toHaveBeenCalledWith(mockEmployee)
    })

    it('debería llamar a onViewProfile al hacer clic en "Ver Perfil"', () => {
      render(<EmployeeCard employee={mockEmployee} onViewProfile={mockOnViewProfile} />)

      const dropdownButton = screen.getByRole('button', { name: /more/i })
      fireEvent.click(dropdownButton)

      const viewOption = screen.getByText('Ver Perfil')
      fireEvent.click(viewOption)

      expect(mockOnViewProfile).toHaveBeenCalledWith(mockEmployee)
    })

    it('debería llamar a onAssignSupervisor al hacer clic en "Asignar Supervisor"', () => {
      render(<EmployeeCard employee={mockEmployee} onAssignSupervisor={mockOnAssignSupervisor} />)

      const dropdownButton = screen.getByRole('button', { name: /more/i })
      fireEvent.click(dropdownButton)

      const assignOption = screen.getByText('Asignar Supervisor')
      fireEvent.click(assignOption)

      expect(mockOnAssignSupervisor).toHaveBeenCalledWith(mockEmployee)
    })
  })

  describe('Estados del Empleado', () => {
    it('debería mostrar empleado activo', () => {
      render(<EmployeeCard employee={mockEmployee} />)

      // El card no debería tener indicador de inactivo
      expect(screen.queryByText('Inactivo')).not.toBeInTheDocument()
    })

    it('debería mostrar empleado inactivo', () => {
      const inactiveEmployee: EmployeeHierarchy = {
        ...mockEmployee,
        is_active: false,
      }

      render(<EmployeeCard employee={inactiveEmployee} />)

      expect(screen.getByText('Inactivo')).toBeInTheDocument()
    })
  })

  describe('Supervisor Info', () => {
    it('debería mostrar nombre del supervisor', () => {
      render(<EmployeeCard employee={mockEmployee} />)

      expect(screen.getByText(/Jane Smith/)).toBeInTheDocument()
    })

    it('debería mostrar "Sin supervisor" cuando no hay reports_to', () => {
      const employeeWithoutSupervisor: EmployeeHierarchy = {
        ...mockEmployee,
        reports_to: null,
        supervisor_name: null,
        supervisor_email: null,
      }

      render(<EmployeeCard employee={employeeWithoutSupervisor} />)

      expect(screen.getByText('Sin supervisor')).toBeInTheDocument()
    })
  })

  describe('Niveles Jerárquicos', () => {
    it('debería mostrar badge correcto para nivel 0 (Owner)', () => {
      const ownerEmployee: EmployeeHierarchy = {
        ...mockEmployee,
        hierarchy_level: 0,
        job_title: 'Owner',
      }

      render(<EmployeeCard employee={ownerEmployee} />)

      expect(screen.getByText('Owner')).toBeInTheDocument()
    })

    it('debería mostrar badge correcto para nivel 1 (Admin)', () => {
      const adminEmployee: EmployeeHierarchy = {
        ...mockEmployee,
        hierarchy_level: 1,
        job_title: 'Admin',
      }

      render(<EmployeeCard employee={adminEmployee} />)

      expect(screen.getByText('Admin')).toBeInTheDocument()
    })

    it('debería mostrar badge correcto para nivel 3 (Lead)', () => {
      const leadEmployee: EmployeeHierarchy = {
        ...mockEmployee,
        hierarchy_level: 3,
        job_title: 'Team Lead',
      }

      render(<EmployeeCard employee={leadEmployee} />)

      expect(screen.getByText('Team Lead')).toBeInTheDocument()
    })

    it('debería mostrar badge correcto para nivel 4 (Staff)', () => {
      const staffEmployee: EmployeeHierarchy = {
        ...mockEmployee,
        hierarchy_level: 4,
        job_title: 'Staff Member',
      }

      render(<EmployeeCard employee={staffEmployee} />)

      expect(screen.getByText('Staff Member')).toBeInTheDocument()
    })
  })

  describe('Métricas', () => {
    it('debería mostrar ocupación 0% correctamente', () => {
      const employeeWithZeroOccupancy: EmployeeHierarchy = {
        ...mockEmployee,
        occupancy_percentage: 0,
      }

      render(<EmployeeCard employee={employeeWithZeroOccupancy} />)

      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('debería mostrar ocupación 100% correctamente', () => {
      const employeeWithFullOccupancy: EmployeeHierarchy = {
        ...mockEmployee,
        occupancy_percentage: 100,
      }

      render(<EmployeeCard employee={employeeWithFullOccupancy} />)

      expect(screen.getByText('100%')).toBeInTheDocument()
    })

    it('debería mostrar rating 0 cuando es null', () => {
      const employeeWithNoRating = {
        ...mockEmployee,
        average_rating: 0,
      }

      render(<EmployeeCard employee={employeeWithNoRating} />)

      expect(screen.getByText('0.0')).toBeInTheDocument()
    })

    it('debería mostrar revenue $0 cuando es 0', () => {
      const employeeWithNoRevenue = {
        ...mockEmployee,
        total_revenue: 0,
      }

      render(<EmployeeCard employee={employeeWithNoRevenue} />)

      expect(screen.getByText('$0')).toBeInTheDocument()
    })
  })

  describe('Departamento', () => {
    it('debería mostrar nombre del departamento', () => {
      render(<EmployeeCard employee={mockEmployee} />)

      expect(screen.getByText('Sales')).toBeInTheDocument()
    })

    it('debería mostrar "Sin departamento" cuando no hay department_name', () => {
      const employeeWithoutDept: EmployeeHierarchy = {
        ...mockEmployee,
        department_id: null,
        department_name: null,
      }

      render(<EmployeeCard employee={employeeWithoutDept} />)

      expect(screen.getByText('Sin departamento')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('debería tener botón de dropdown accesible', () => {
      render(<EmployeeCard employee={mockEmployee} />)

      const dropdownButton = screen.getByRole('button', { name: /more/i })
      expect(dropdownButton).toBeInTheDocument()
    })

    it('debería tener avatar con alt text o fallback', () => {
      render(<EmployeeCard employee={mockEmployee} />)

      // Verificar que existe el avatar (con iniciales como fallback)
      expect(screen.getByText('JD')).toBeInTheDocument()
    })
  })

  describe('Props Opcionales', () => {
    it('debería funcionar sin callbacks', () => {
      render(<EmployeeCard employee={mockEmployee} />)

      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('debería renderizar sin avatar_url', () => {
      const employeeWithoutAvatar: EmployeeHierarchy = {
        ...mockEmployee,
        avatar_url: null,
      }

      render(<EmployeeCard employee={employeeWithoutAvatar} />)

      // Debería mostrar iniciales
      expect(screen.getByText('JD')).toBeInTheDocument()
    })
  })
})
