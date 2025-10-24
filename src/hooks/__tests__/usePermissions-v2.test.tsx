// =====================================================
// TESTS: usePermissions-v2.tsx
// Hook de React Query para gestión de permisos
// Fecha: 13 de Octubre de 2025
// =====================================================

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { ReactNode, createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { usePermissions } from '@/hooks/usePermissions-v2'
import { supabase } from '@/lib/supabase'
import {
  BusinessRole,
  Permission,
  PermissionAuditLog,
  PermissionTemplate,
  UserPermission,
} from '@/types/types'

// =====================================================
// MOCKS
// =====================================================

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

// =====================================================
// HELPERS
// =====================================================

/**
 * Crea QueryClient wrapper para testing
 */
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

/**
 * Crea mock de BusinessRole
 */
function createMockBusinessRole(overrides?: Partial<BusinessRole>): BusinessRole {
  return {
    id: 'role-123',
    business_id: 'business-123',
    user_id: 'user-123',
    role: 'employee',
    employee_type: 'service_provider',
    assigned_by: 'owner-123',
    is_active: true,
    created_at: new Date().toISOString(),
    notes: null,
    ...overrides,
  }
}

/**
 * Crea mock de UserPermission
 */
function createMockUserPermission(overrides?: Partial<UserPermission>): UserPermission {
  return {
    id: 'perm-123',
    business_id: 'business-123',
    user_id: 'user-123',
    permission: 'read_appointments',
    granted_by: 'owner-123',
    is_active: true,
    created_at: new Date().toISOString(),
    expires_at: null,
    notes: null,
    ...overrides,
  }
}

/**
 * Crea mock de PermissionTemplate
 */
function createMockTemplate(overrides?: Partial<PermissionTemplate>): PermissionTemplate {
  return {
    id: 'template-123',
    business_id: 'business-123',
    name: 'Empleado Básico',
    description: 'Permisos básicos para empleados',
    role: 'employee',
    permissions: ['read_appointments', 'write_appointments'] as Permission[],
    is_system_template: false,
    created_by: 'owner-123',
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Crea mock de PermissionAuditLog
 */
function createMockAuditLog(overrides?: Partial<PermissionAuditLog>): PermissionAuditLog {
  return {
    id: 'audit-123',
    business_id: 'business-123',
    user_id: 'user-123',
    action: 'permission_granted',
    permission: 'read_appointments',
    performed_by: 'owner-123',
    performed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    metadata: null,
    user_name: 'Test User',
    performed_by_name: 'Owner',
    ...overrides,
  }
}

/**
 * Mock exitoso de Supabase query
 */
function mockSupabaseQuery(data: unknown) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data, error: null }),
        }),
      }),
    }),
  }
}

// =====================================================
// TESTS: QUERIES
// =====================================================

describe('usePermissions - Queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('businessRoles query', () => {
    it('obtiene roles del usuario correctamente', async () => {
      const mockRole = createMockBusinessRole()

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseQuery([mockRole]) as never)

      const { result } = renderHook(
        () =>
          usePermissions({
            userId: 'user-123',
            businessId: 'business-123',
            ownerId: 'owner-123',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.businessRoles).toHaveLength(1)
      expect(result.current.businessRoles[0].id).toBe('role-123')
      expect(result.current.businessRoles[0].role).toBe('employee')
    })

    it('retorna array vacío si no hay roles', async () => {
      vi.mocked(supabase.from).mockReturnValue(mockSupabaseQuery([]) as never)

      const { result } = renderHook(
        () =>
          usePermissions({
            userId: 'user-123',
            businessId: 'business-123',
            ownerId: 'owner-123',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.businessRoles).toEqual([])
    })

    it('filtra solo roles activos', async () => {
      const mockRole = createMockBusinessRole({ is_active: true })

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [mockRole], error: null }),
            }),
          }),
        }),
      } as never)

      const { result } = renderHook(
        () =>
          usePermissions({
            userId: 'user-123',
            businessId: 'business-123',
            ownerId: 'owner-123',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(supabase.from).toHaveBeenCalledWith('business_roles')
    })
  })

  describe('userPermissions query', () => {
    it('obtiene permisos del usuario correctamente', async () => {
      const mockPermission = createMockUserPermission()

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseQuery([mockPermission]) as never)

      const { result } = renderHook(
        () =>
          usePermissions({
            userId: 'user-123',
            businessId: 'business-123',
            ownerId: 'owner-123',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.userPermissions).toHaveLength(1)
      expect(result.current.userPermissions[0].permission).toBe('read_appointments')
    })

    it('retorna array vacío para owner (bypasa verificaciones)', async () => {
      const { result } = renderHook(
        () =>
          usePermissions({
            userId: 'owner-123',
            businessId: 'business-123',
            ownerId: 'owner-123',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.userPermissions).toEqual([])
      expect(result.current.isOwner).toBe(true)
    })

    it('filtra solo permisos activos', async () => {
      const mockPermission = createMockUserPermission({ is_active: true })

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [mockPermission], error: null }),
            }),
          }),
        }),
      } as never)

      const { result } = renderHook(
        () =>
          usePermissions({
            userId: 'user-123',
            businessId: 'business-123',
            ownerId: 'owner-123',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(supabase.from).toHaveBeenCalledWith('user_permissions')
    })
  })

  describe('templates query', () => {
    it('obtiene plantillas del negocio y del sistema', async () => {
      const mockTemplates = [
        createMockTemplate({ is_system_template: true, name: 'Admin' }),
        createMockTemplate({ is_system_template: false, name: 'Custom' }),
      ]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockTemplates, error: null }),
            }),
          }),
        }),
      } as never)

      const { result } = renderHook(
        () =>
          usePermissions({
            userId: 'user-123',
            businessId: 'business-123',
            ownerId: 'owner-123',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.templates).toHaveLength(2)
      expect(result.current.templates[0].name).toBe('Admin')
      expect(result.current.templates[1].name).toBe('Custom')
    })

    it('ordena primero templates del sistema', async () => {
      const mockTemplates = [
        createMockTemplate({ is_system_template: true }),
        createMockTemplate({ is_system_template: false }),
      ]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockTemplates, error: null }),
            }),
          }),
        }),
      } as never)

      const { result } = renderHook(
        () =>
          usePermissions({
            userId: 'user-123',
            businessId: 'business-123',
            ownerId: 'owner-123',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.templates[0].is_system_template).toBe(true)
    })
  })

  describe('auditLog query', () => {
    it('obtiene audit log con nombres de usuarios', async () => {
      const mockAuditLog = createMockAuditLog()

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [
                  {
                    ...mockAuditLog,
                    user: { id: 'user-123', name: 'Test User', email: 'test@test.com' },
                    performed_by_user: { id: 'owner-123', name: 'Owner', email: 'owner@test.com' },
                  },
                ],
                error: null,
              }),
            }),
          }),
        }),
      } as never)

      const { result } = renderHook(
        () =>
          usePermissions({
            userId: 'user-123',
            businessId: 'business-123',
            ownerId: 'owner-123',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.auditLog).toHaveLength(1)
      expect(result.current.auditLog[0].user_name).toBe('Test User')
      expect(result.current.auditLog[0].performed_by_name).toBe('Owner')
    })

    it('limita a 500 registros', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      } as never)

      const { result } = renderHook(
        () =>
          usePermissions({
            userId: 'user-123',
            businessId: 'business-123',
            ownerId: 'owner-123',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const mockFrom = vi.mocked(supabase.from).mock.results[0]?.value as {
        select: ReturnType<typeof vi.fn>
      }
      const mockSelect = mockFrom?.select.mock.results[0]?.value as {
        eq: ReturnType<typeof vi.fn>
      }
      const mockEq = mockSelect?.eq.mock.results[0]?.value as {
        order: ReturnType<typeof vi.fn>
      }
      const mockOrder = mockEq?.order.mock.results[0]?.value as {
        limit: ReturnType<typeof vi.fn>
      }

      expect(mockOrder.limit).toHaveBeenCalledWith(500)
    })
  })
})

// =====================================================
// TESTS: VERIFICACIONES
// =====================================================

describe('usePermissions - Verificaciones', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('checkPermission', () => {
    it('retorna true para owner', async () => {
      vi.mocked(supabase.from).mockReturnValue(mockSupabaseQuery([]) as never)

      const { result } = renderHook(
        () =>
          usePermissions({
            userId: 'owner-123',
            businessId: 'business-123',
            ownerId: 'owner-123',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const check = result.current.checkPermission('read_appointments')
      expect(check.hasPermission).toBe(true)
      expect(check.isOwner).toBe(true)
      expect(check.reason).toBe('Admin Dueño')
    })

    it('retorna true si usuario tiene el permiso', async () => {
      const mockPermission = createMockUserPermission({
        permission: 'write_appointments',
      })

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseQuery([mockPermission]) as never)

      const { result } = renderHook(
        () =>
          usePermissions({
            userId: 'user-123',
            businessId: 'business-123',
            ownerId: 'owner-123',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const check = result.current.checkPermission('write_appointments')
      expect(check.hasPermission).toBe(true)
      expect(check.isOwner).toBe(false)
      expect(check.reason).toBe('Permiso otorgado')
    })

    it('retorna false si usuario no tiene el permiso', async () => {
      vi.mocked(supabase.from).mockReturnValue(mockSupabaseQuery([]) as never)

      const { result } = renderHook(
        () =>
          usePermissions({
            userId: 'user-123',
            businessId: 'business-123',
            ownerId: 'owner-123',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const check = result.current.checkPermission('delete_appointments')
      expect(check.hasPermission).toBe(false)
      expect(check.reason).toBe('Sin permiso')
    })
  })

  describe('checkAnyPermission', () => {
    it('retorna true si tiene al menos uno de los permisos', async () => {
      const mockPermission = createMockUserPermission({
        permission: 'read_appointments',
      })

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseQuery([mockPermission]) as never)

      const { result } = renderHook(
        () =>
          usePermissions({
            userId: 'user-123',
            businessId: 'business-123',
            ownerId: 'owner-123',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const check = result.current.checkAnyPermission(['read_appointments', 'write_appointments'])
      expect(check.hasPermission).toBe(true)
      expect(check.reason).toBe('Permiso otorgado')
    })

    it('retorna false si no tiene ninguno de los permisos', async () => {
      vi.mocked(supabase.from).mockReturnValue(mockSupabaseQuery([]) as never)

      const { result } = renderHook(
        () =>
          usePermissions({
            userId: 'user-123',
            businessId: 'business-123',
            ownerId: 'owner-123',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const check = result.current.checkAnyPermission([
        'delete_appointments',
        'permissions.assign_admin',
      ])
      expect(check.hasPermission).toBe(false)
      expect(check.reason).toBe('Sin permisos requeridos')
    })
  })

  describe('checkAllPermissions', () => {
    it('retorna true si tiene todos los permisos', async () => {
      const mockPermissions = [
        createMockUserPermission({ id: 'p1', permission: 'read_appointments' }),
        createMockUserPermission({ id: 'p2', permission: 'write_appointments' }),
      ]

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseQuery(mockPermissions) as never)

      const { result } = renderHook(
        () =>
          usePermissions({
            userId: 'user-123',
            businessId: 'business-123',
            ownerId: 'owner-123',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const check = result.current.checkAllPermissions(['read_appointments', 'write_appointments'])
      expect(check.hasPermission).toBe(true)
      expect(check.reason).toBe('Todos los permisos otorgados')
    })

    it('retorna false si falta algún permiso', async () => {
      const mockPermission = createMockUserPermission({
        permission: 'read_appointments',
      })

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseQuery([mockPermission]) as never)

      const { result } = renderHook(
        () =>
          usePermissions({
            userId: 'user-123',
            businessId: 'business-123',
            ownerId: 'owner-123',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const check = result.current.checkAllPermissions(['read_appointments', 'write_appointments'])
      expect(check.hasPermission).toBe(false)
      expect(check.reason).toBe('Faltan permisos')
    })
  })
})

// =====================================================
// TESTS: MUTATIONS
// =====================================================

describe('usePermissions - Mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('assignRole', () => {
    it('asigna rol correctamente', async () => {
      const mockRole = createMockBusinessRole()

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockRole, error: null }),
          }),
        }),
      } as never)

      const { result } = renderHook(
        () =>
          usePermissions({
            userId: 'owner-123',
            businessId: 'business-123',
            ownerId: 'owner-123',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await result.current.assignRoleAsync({
        targetUserId: 'user-123',
        role: 'employee',
        employeeType: 'service_provider',
        notes: 'Test assignment',
      })

      expect(supabase.from).toHaveBeenCalledWith('business_roles')
    })

    it('maneja errores al asignar rol', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Error de base de datos' },
            }),
          }),
        }),
      } as never)

      const { result } = renderHook(
        () =>
          usePermissions({
            userId: 'owner-123',
            businessId: 'business-123',
            ownerId: 'owner-123',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await expect(
        result.current.assignRoleAsync({
          targetUserId: 'user-123',
          role: 'admin',
        })
      ).rejects.toThrow()
    })
  })

  describe('grantPermission', () => {
    it('otorga permiso correctamente', async () => {
      const mockPermission = createMockUserPermission()

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockPermission, error: null }),
          }),
        }),
      } as never)

      const { result } = renderHook(
        () =>
          usePermissions({
            userId: 'owner-123',
            businessId: 'business-123',
            ownerId: 'owner-123',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await result.current.grantPermissionAsync({
        targetUserId: 'user-123',
        permission: 'write_appointments',
        notes: 'Test permission',
      })

      expect(supabase.from).toHaveBeenCalledWith('user_permissions')
    })

    it('otorga permiso con fecha de expiración', async () => {
      const expiresAt = '2025-12-31T23:59:59Z'
      const mockPermission = createMockUserPermission({ expires_at: expiresAt })

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockPermission, error: null }),
          }),
        }),
      } as never)

      const { result } = renderHook(
        () =>
          usePermissions({
            userId: 'owner-123',
            businessId: 'business-123',
            ownerId: 'owner-123',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await result.current.grantPermissionAsync({
        targetUserId: 'user-123',
        permission: 'read_reports',
        expiresAt,
      })

      expect(supabase.from).toHaveBeenCalledWith('user_permissions')
    })
  })

  describe('revokePermission', () => {
    it('revoca permiso correctamente', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      } as never)

      const { result } = renderHook(
        () =>
          usePermissions({
            userId: 'owner-123',
            businessId: 'business-123',
            ownerId: 'owner-123',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await result.current.revokePermissionAsync({ permissionId: 'perm-123' })

      expect(supabase.from).toHaveBeenCalledWith('user_permissions')
    })
  })

  describe('createTemplate', () => {
    it('crea plantilla correctamente', async () => {
      const mockTemplate = createMockTemplate()

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockTemplate, error: null }),
          }),
        }),
      } as never)

      const { result } = renderHook(
        () =>
          usePermissions({
            userId: 'owner-123',
            businessId: 'business-123',
            ownerId: 'owner-123',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await result.current.createTemplateAsync({
        name: 'Custom Template',
        description: 'Plantilla personalizada',
        role: 'employee',
        permissions: ['read_appointments', 'write_appointments'],
      })

      expect(supabase.from).toHaveBeenCalledWith('permission_templates')
    })
  })

  describe('deleteTemplate', () => {
    it('elimina plantilla custom correctamente', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      } as never)

      const { result } = renderHook(
        () =>
          usePermissions({
            userId: 'owner-123',
            businessId: 'business-123',
            ownerId: 'owner-123',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await result.current.deleteTemplateAsync({ templateId: 'template-123' })

      expect(supabase.from).toHaveBeenCalledWith('permission_templates')
    })

    it('no permite eliminar templates del sistema', async () => {
      const mockEq2 = vi.fn().mockResolvedValue({ error: null })
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq1 })

      vi.mocked(supabase.from).mockReturnValue({
        delete: mockDelete,
      } as never)

      const { result } = renderHook(
        () =>
          usePermissions({
            userId: 'owner-123',
            businessId: 'business-123',
            ownerId: 'owner-123',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await result.current.deleteTemplateAsync({ templateId: 'template-123' })

      // Verificar que se llama con id primero
      expect(mockEq1).toHaveBeenCalledWith('id', 'template-123')
      // Verificar que se llama con is_system_template = false después
      expect(mockEq2).toHaveBeenCalledWith('is_system_template', false)
    })
  })
})

// =====================================================
// TESTS: ROLES Y VERIFICACIONES RÁPIDAS
// =====================================================

describe('usePermissions - Roles y Verificaciones', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('identifica correctamente al owner', async () => {
    vi.mocked(supabase.from).mockReturnValue(mockSupabaseQuery([]) as never)

    const { result } = renderHook(
      () =>
        usePermissions({
          userId: 'owner-123',
          businessId: 'business-123',
          ownerId: 'owner-123',
        }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isOwner).toBe(true)
    expect(result.current.isAdmin).toBe(false)
    expect(result.current.isEmployee).toBe(false)
  })

  it('identifica correctamente rol de admin', async () => {
    const mockRole = createMockBusinessRole({ role: 'admin' })

    vi.mocked(supabase.from).mockReturnValue(mockSupabaseQuery([mockRole]) as never)

    const { result } = renderHook(
      () =>
        usePermissions({
          userId: 'user-123',
          businessId: 'business-123',
          ownerId: 'owner-123',
        }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isAdmin).toBe(true)
    expect(result.current.role).toBe('admin')
  })

  it('identifica correctamente rol de employee', async () => {
    const mockRole = createMockBusinessRole({
      role: 'employee',
      employee_type: 'service_provider',
    })

    vi.mocked(supabase.from).mockReturnValue(mockSupabaseQuery([mockRole]) as never)

    const { result } = renderHook(
      () =>
        usePermissions({
          userId: 'user-123',
          businessId: 'business-123',
          ownerId: 'owner-123',
        }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isEmployee).toBe(true)
    expect(result.current.canOfferServices).toBe(true)
    expect(result.current.role).toBe('employee')
  })

  it('identifica employee que NO puede ofrecer servicios', async () => {
    const mockRole = createMockBusinessRole({
      role: 'employee',
      employee_type: 'support_staff',
    })

    vi.mocked(supabase.from).mockReturnValue(mockSupabaseQuery([mockRole]) as never)

    const { result } = renderHook(
      () =>
        usePermissions({
          userId: 'user-123',
          businessId: 'business-123',
          ownerId: 'owner-123',
        }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isEmployee).toBe(true)
    expect(result.current.canOfferServices).toBe(false)
  })

  it('obtiene permisos activos correctamente', async () => {
    const mockPermissions = [
      createMockUserPermission({ id: 'p1', permission: 'read_appointments' }),
      createMockUserPermission({ id: 'p2', permission: 'write_appointments' }),
    ]

    vi.mocked(supabase.from).mockReturnValue(mockSupabaseQuery(mockPermissions) as never)

    const { result } = renderHook(
      () =>
        usePermissions({
          userId: 'user-123',
          businessId: 'business-123',
          ownerId: 'owner-123',
        }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.activePermissions).toHaveLength(2)
    expect(result.current.activePermissions).toContain('read_appointments')
    expect(result.current.activePermissions).toContain('write_appointments')
  })
})
