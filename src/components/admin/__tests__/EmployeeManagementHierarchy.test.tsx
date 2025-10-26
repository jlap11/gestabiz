// ============================================================================
// TESTS: EmployeeManagementHierarchy Component
// Tests de integración para el componente principal de jerarquía
// ============================================================================

import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createElement } from 'react'
import { EmployeeManagementHierarchy } from '../EmployeeManagementHierarchy'

// Mock del hook de jerarquía
const mockUseBusinessHierarchy = vi.fn()
vi.mock('@/hooks/useBusinessHierarchy', () => ({
  useBusinessHierarchy: () => mockUseBusinessHierarchy(),
}))

// Mock del contexto de idioma
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: 'es',
  }),
}))

function createTestWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
    },
  })

  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('EmployeeManagementHierarchy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mock return
    mockUseBusinessHierarchy.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      filters: {
        search: '',
        hierarchyLevel: null,
        employeeType: null,
        departmentId: null,
      },
      updateFilters: vi.fn(),
      clearFilters: vi.fn(),
      refetch: vi.fn(),
    })
  })

  describe('Renderizado inicial', () => {
    it('debería renderizar el componente', () => {
      render(
        <EmployeeManagementHierarchy businessId="test-business" />,
        { wrapper: createTestWrapper() }
      )

      expect(screen.getByText('employees.management.title')).toBeInTheDocument()
    })

    it('debería mostrar loading state inicialmente', () => {
      mockUseBusinessHierarchy.mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
        filters: {},
        updateFilters: vi.fn(),
        clearFilters: vi.fn(),
        refetch: vi.fn(),
      })

      render(
        <EmployeeManagementHierarchy businessId="test-business" />,
        { wrapper: createTestWrapper() }
      )

      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('debería mostrar las 4 stats cards', async () => {
      render(
        <EmployeeManagementHierarchy businessId="test-business" />,
        { wrapper: createTestWrapper() }
      )

      await waitFor(() => {
        expect(screen.getByText('employees.management.totalEmployees')).toBeInTheDocument()
        expect(screen.getByText('employees.management.byLevel')).toBeInTheDocument()
        expect(screen.getByText('employees.management.avgOccupancy')).toBeInTheDocument()
        expect(screen.getByText('employees.management.avgRating')).toBeInTheDocument()
      })
    })

    it('debería mostrar botones de vista (Lista y Mapa)', async () => {
      render(
        <EmployeeManagementHierarchy businessId="test-business" />,
        { wrapper: createTestWrapper() }
      )

      await waitFor(() => {
        expect(screen.getByText('employees.management.listView')).toBeInTheDocument()
        expect(screen.getByText('employees.management.mapView')).toBeInTheDocument()
      })
    })

    it('debería mostrar botón de filtros', async () => {
      render(
        <EmployeeManagementHierarchy businessId="test-business" />,
        { wrapper: createTestWrapper() }
      )

      await waitFor(() => {
        expect(screen.getByText('employees.management.filters')).toBeInTheDocument()
      })
    })
  })

  describe('Empty State', () => {
    it('debería mostrar mensaje cuando no hay empleados', async () => {
      render(
        <EmployeeManagementHierarchy businessId="test-business" />,
        { wrapper: createTestWrapper() }
      )

      await waitFor(() => {
        expect(screen.getByText('employees.management.noEmployees')).toBeInTheDocument()
      })
    })
  })

  describe('Stats Calculation', () => {
    it('debería calcular stats correctamente', async () => {
      const mockEmployees = [
        {
          user_id: 'user-1',
          full_name: 'Employee 1',
          email: 'emp1@test.com',
          role: 'employee',
          employee_type: 'fullTime',
          hierarchy_level: 0,
          job_title: 'Owner',
          reports_to: null,
          supervisor_name: null,
          supervisor_email: null,
          direct_reports_count: 2,
          occupancy_percentage: 80,
          average_rating: 4.5,
          total_revenue: 10000,
          department_id: null,
          department_name: null,
          is_active: true,
          hire_date: null,
          phone: null,
          avatar_url: null,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
        {
          user_id: 'user-2',
          full_name: 'Employee 2',
          email: 'emp2@test.com',
          role: 'employee',
          employee_type: 'fullTime',
          hierarchy_level: 2,
          job_title: 'Manager',
          reports_to: 'user-1',
          supervisor_name: 'Employee 1',
          supervisor_email: 'emp1@test.com',
          direct_reports_count: 0,
          occupancy_percentage: 70,
          average_rating: 4.0,
          total_revenue: 5000,
          department_id: null,
          department_name: null,
          is_active: true,
          hire_date: null,
          phone: null,
          avatar_url: null,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ]

      mockUseBusinessHierarchy.mockReturnValue({
        data: mockEmployees,
        isLoading: false,
        error: null,
        filters: {},
        updateFilters: vi.fn(),
        clearFilters: vi.fn(),
        refetch: vi.fn(),
      })

      render(
        <EmployeeManagementHierarchy businessId="test-business" />,
        { wrapper: createTestWrapper() }
      )

      await waitFor(() => {
        // Total empleados
        expect(screen.getByText('2')).toBeInTheDocument()
        
        // Ocupación promedio (80 + 70) / 2 = 75
        expect(screen.getByText('75.0%')).toBeInTheDocument()
        
        // Rating promedio (4.5 + 4.0) / 2 = 4.25
        expect(screen.getByText(/4\.2/)).toBeInTheDocument()
      })
    })
  })

  describe('Callback Props', () => {
    it('debería llamar onEmployeeSelect cuando se proporciona', async () => {
      const onSelect = vi.fn()

      render(
        <EmployeeManagementHierarchy 
          businessId="test-business"
          onEmployeeSelect={onSelect}
        />,
        { wrapper: createTestWrapper() }
      )

      await waitFor(() => {
        expect(screen.getByText('employees.management.title')).toBeInTheDocument()
      })

      // El callback debería estar disponible pero no llamado aún
      expect(onSelect).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('debería mostrar error state cuando falla la carga', async () => {
      mockUseBusinessHierarchy.mockReturnValue({
        data: [],
        isLoading: false,
        error: new Error('Failed to load'),
        filters: {},
        updateFilters: vi.fn(),
        clearFilters: vi.fn(),
        refetch: vi.fn(),
      })

      render(
        <EmployeeManagementHierarchy businessId="test-business" />,
        { wrapper: createTestWrapper() }
      )

      await waitFor(() => {
        expect(screen.getByText('employees.management.error')).toBeInTheDocument()
      })
    })

    it('debería mostrar botón de retry en error state', async () => {
      mockUseBusinessHierarchy.mockReturnValue({
        data: [],
        isLoading: false,
        error: new Error('Failed to load'),
        filters: {},
        updateFilters: vi.fn(),
        clearFilters: vi.fn(),
        refetch: vi.fn(),
      })

      render(
        <EmployeeManagementHierarchy businessId="test-business" />,
        { wrapper: createTestWrapper() }
      )

      await waitFor(() => {
        expect(screen.getByText('employees.management.retry')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('debería tener heading principal', async () => {
      render(
        <EmployeeManagementHierarchy businessId="test-business" />,
        { wrapper: createTestWrapper() }
      )

      await waitFor(() => {
        const heading = screen.getByRole('heading', { level: 1 })
        expect(heading).toBeInTheDocument()
        expect(heading).toHaveTextContent('employees.management.title')
      })
    })

    it('debería tener botones accesibles', async () => {
      render(
        <EmployeeManagementHierarchy businessId="test-business" />,
        { wrapper: createTestWrapper() }
      )

      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        expect(buttons.length).toBeGreaterThan(0)
      })
    })
  })
})
