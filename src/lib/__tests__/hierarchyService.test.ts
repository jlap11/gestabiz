// ============================================================================
// TESTS: hierarchyService
// Tests unitarios para el servicio de jerarquía de empleados
// ============================================================================

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { hierarchyService } from '../hierarchyService'
import supabase from '@/lib/supabase'
import type { EmployeeHierarchy } from '@/types/types'

// Mock de Supabase
vi.mock('@/lib/supabase', () => ({
  default: {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
    })),
  },
}))

describe('hierarchyService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getBusinessHierarchy', () => {
    it('debería obtener la jerarquía completa de un negocio', async () => {
      const mockHierarchy: EmployeeHierarchy[] = [
        {
          id: 'emp-1',
          user_id: 'user-1',
          business_id: 'biz-1',
          name: 'John Owner',
          email: 'john@test.com',
          avatar_url: null,
          hierarchy_level: 0,
          supervisor_id: null,
          supervisor_name: null,
          department_id: null,
          department_name: null,
          employee_type: 'fullTime',
          is_active: true,
          subordinate_count: 2,
          subordinates: [],
          occupancy_rate: 85.5,
          average_rating: 4.8,
          total_revenue: 15000,
          appointments_completed: 120,
          appointments_pending: 10,
          appointments_cancelled: 5,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ]

      const mockRpc = vi.fn().mockResolvedValue({
        data: mockHierarchy,
        error: null,
      })

      vi.mocked(supabase.rpc).mockImplementation(mockRpc)

      const result = await hierarchyService.getBusinessHierarchy('biz-1')

      expect(mockRpc).toHaveBeenCalledWith('get_business_hierarchy', {
        p_business_id: 'biz-1',
      })
      expect(result).toEqual(mockHierarchy)
    })

    it('debería lanzar error si falla la llamada RPC', async () => {
      const mockError = { message: 'Database error', code: 'PGRST116' }

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: mockError,
      })

      await expect(hierarchyService.getBusinessHierarchy('biz-1')).rejects.toThrow(
        'Error fetching business hierarchy: Database error'
      )
    })

    it('debería retornar array vacío si no hay datos', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: null,
      })

      const result = await hierarchyService.getBusinessHierarchy('biz-1')

      expect(result).toEqual([])
    })
  })

  describe('updateEmployeeHierarchy', () => {
    it('debería actualizar el nivel jerárquico de un empleado', async () => {
      const mockUpdated = {
        id: 'emp-1',
        hierarchy_level: 2,
        updated_at: '2025-01-02T00:00:00Z',
      }

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockUpdated,
              error: null,
            }),
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as any)

      const result = await hierarchyService.updateEmployeeHierarchy({
        employeeId: 'emp-1',
        hierarchyLevel: 2,
      })

      expect(supabase.from).toHaveBeenCalledWith('business_employees')
      expect(mockUpdate).toHaveBeenCalledWith({
        hierarchy_level: 2,
      })
      expect(result).toEqual(mockUpdated)
    })

    it('debería actualizar supervisor y nivel jerárquico', async () => {
      const mockUpdated = {
        id: 'emp-1',
        hierarchy_level: 3,
        supervisor_id: 'emp-2',
        updated_at: '2025-01-02T00:00:00Z',
      }

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockUpdated,
              error: null,
            }),
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as any)

      const result = await hierarchyService.updateEmployeeHierarchy({
        employeeId: 'emp-1',
        hierarchyLevel: 3,
        supervisorId: 'emp-2',
      })

      expect(mockUpdate).toHaveBeenCalledWith({
        hierarchy_level: 3,
        supervisor_id: 'emp-2',
      })
      expect(result).toEqual(mockUpdated)
    })

    it('debería lanzar error si falla la actualización', async () => {
      const mockError = { message: 'Update failed', code: 'PGRST204' }

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as any)

      await expect(
        hierarchyService.updateEmployeeHierarchy({
          employeeId: 'emp-1',
          hierarchyLevel: 2,
        })
      ).rejects.toThrow('Error updating employee hierarchy: Update failed')
    })
  })

  describe('assignSupervisor', () => {
    it('debería asignar un supervisor a un empleado', async () => {
      const mockUpdated = {
        id: 'emp-1',
        supervisor_id: 'emp-2',
        updated_at: '2025-01-02T00:00:00Z',
      }

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockUpdated,
              error: null,
            }),
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as any)

      const result = await hierarchyService.assignSupervisor({
        employeeId: 'emp-1',
        supervisorId: 'emp-2',
      })

      expect(supabase.from).toHaveBeenCalledWith('business_employees')
      expect(mockUpdate).toHaveBeenCalledWith({
        supervisor_id: 'emp-2',
      })
      expect(result).toEqual(mockUpdated)
    })

    it('debería permitir remover supervisor (null)', async () => {
      const mockUpdated = {
        id: 'emp-1',
        supervisor_id: null,
        updated_at: '2025-01-02T00:00:00Z',
      }

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockUpdated,
              error: null,
            }),
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as any)

      const result = await hierarchyService.assignSupervisor({
        employeeId: 'emp-1',
        supervisorId: null,
      })

      expect(mockUpdate).toHaveBeenCalledWith({
        supervisor_id: null,
      })
      expect(result).toEqual(mockUpdated)
    })

    it('debería lanzar error si falla la asignación', async () => {
      const mockError = { message: 'Assignment failed', code: 'PGRST301' }

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as any)

      await expect(
        hierarchyService.assignSupervisor({
          employeeId: 'emp-1',
          supervisorId: 'emp-2',
        })
      ).rejects.toThrow('Error assigning supervisor: Assignment failed')
    })
  })

  describe('calculateEmployeeMetrics', () => {
    it('debería calcular métricas con datos completos', () => {
      const employee: EmployeeHierarchy = {
        id: 'emp-1',
        user_id: 'user-1',
        business_id: 'biz-1',
        name: 'Test Employee',
        email: 'test@test.com',
        avatar_url: null,
        hierarchy_level: 2,
        supervisor_id: 'emp-0',
        supervisor_name: 'Manager',
        department_id: 'dept-1',
        department_name: 'Sales',
        employee_type: 'fullTime',
        is_active: true,
        subordinate_count: 3,
        subordinates: [],
        occupancy_rate: 75.5,
        average_rating: 4.2,
        total_revenue: 8500,
        appointments_completed: 50,
        appointments_pending: 8,
        appointments_cancelled: 2,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      }

      const result = hierarchyService.calculateEmployeeMetrics(employee)

      expect(result).toEqual({
        occupancy: 75.5,
        rating: 4.2,
        revenue: 8500,
        appointmentsCompleted: 50,
        appointmentsPending: 8,
        appointmentsCancelled: 2,
        totalAppointments: 60,
        subordinateCount: 3,
      })
    })

    it('debería manejar valores null/undefined con defaults', () => {
      const employee: EmployeeHierarchy = {
        id: 'emp-1',
        user_id: 'user-1',
        business_id: 'biz-1',
        name: 'Test Employee',
        email: 'test@test.com',
        avatar_url: null,
        hierarchy_level: 4,
        supervisor_id: null,
        supervisor_name: null,
        department_id: null,
        department_name: null,
        employee_type: 'partTime',
        is_active: true,
        subordinate_count: 0,
        subordinates: [],
        occupancy_rate: null,
        average_rating: null,
        total_revenue: null,
        appointments_completed: null,
        appointments_pending: null,
        appointments_cancelled: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      }

      const result = hierarchyService.calculateEmployeeMetrics(employee)

      expect(result).toEqual({
        occupancy: 0,
        rating: 0,
        revenue: 0,
        appointmentsCompleted: 0,
        appointmentsPending: 0,
        appointmentsCancelled: 0,
        totalAppointments: 0,
        subordinateCount: 0,
      })
    })

    it('debería calcular total de citas correctamente', () => {
      const employee: EmployeeHierarchy = {
        id: 'emp-1',
        user_id: 'user-1',
        business_id: 'biz-1',
        name: 'Test Employee',
        email: 'test@test.com',
        avatar_url: null,
        hierarchy_level: 3,
        supervisor_id: 'emp-2',
        supervisor_name: null,
        department_id: null,
        department_name: null,
        employee_type: 'fullTime',
        is_active: true,
        subordinate_count: 1,
        subordinates: [],
        occupancy_rate: 90,
        average_rating: 5,
        total_revenue: 12000,
        appointments_completed: 100,
        appointments_pending: 20,
        appointments_cancelled: 10,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      }

      const result = hierarchyService.calculateEmployeeMetrics(employee)

      expect(result.totalAppointments).toBe(130) // 100 + 20 + 10
    })
  })
})
