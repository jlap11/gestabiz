import { describe, expect, it } from 'vitest'
import {
  ALL_PERMISSIONS,
  PERMISSION_CATEGORIES,
  PERMISSION_DESCRIPTIONS,
  canProvideServices,
  convertLegacyPermissions,
  getUserActivePermissions,
  getUserBusinessRole,
  hasAllPermissions,
  hasAnyPermission,
  hasBusinessRole,
  hasPermission,
  isBusinessOwner,
} from '@/lib/permissions-v2'
import type { BusinessRole, UserPermission } from '@/types/types'

/**
 * Helper para crear mock de UserPermission
 */
function createMockUserPermission(overrides?: Partial<UserPermission>): UserPermission {
  return {
    id: '1',
    user_id: 'user-123',
    business_id: 'business-abc',
    permission: 'business.view',
    granted_by: 'owner-id',
    granted_at: new Date().toISOString(),
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Helper para crear mock de BusinessRole
 */
function createMockBusinessRole(overrides?: Partial<BusinessRole>): BusinessRole {
  return {
    id: '1',
    business_id: 'business-abc',
    user_id: 'user-123',
    role: 'admin',
    assigned_at: new Date().toISOString(),
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

describe('permissions-v2.ts - Core Library', () => {
  // =====================================================
  // CONSTANTES
  // =====================================================
  describe('Constantes de permisos', () => {
    it('debe tener 60 permisos totales en ALL_PERMISSIONS', () => {
      expect(ALL_PERMISSIONS).toHaveLength(60)
    })

    it('debe tener descripciones para todos los permisos', () => {
      const permissionsWithoutDescription = ALL_PERMISSIONS.filter(
        perm => !PERMISSION_DESCRIPTIONS[perm]
      )
      expect(permissionsWithoutDescription).toHaveLength(0)
    })

    it('debe tener 11 categorías de permisos', () => {
      const categories = Object.keys(PERMISSION_CATEGORIES)
      expect(categories).toHaveLength(11)
    })

    it('debe tener todos los permisos organizados en categorías', () => {
      const allCategoryPermissions = Object.values(PERMISSION_CATEGORIES).flatMap(
        cat => cat.permissions
      )
      expect(allCategoryPermissions).toHaveLength(60)
      expect(allCategoryPermissions.sort()).toEqual(ALL_PERMISSIONS.sort())
    })

    it('no debe haber permisos duplicados', () => {
      const uniquePermissions = new Set(ALL_PERMISSIONS)
      expect(uniquePermissions.size).toBe(ALL_PERMISSIONS.length)
    })

    it('todas las descripciones deben ser strings no vacíos', () => {
      Object.values(PERMISSION_DESCRIPTIONS).forEach(desc => {
        expect(typeof desc).toBe('string')
        expect(desc.length).toBeGreaterThan(0)
      })
    })

    it('todas las categorías deben tener label', () => {
      Object.values(PERMISSION_CATEGORIES).forEach(cat => {
        expect(cat.label).toBeTruthy()
        expect(typeof cat.label).toBe('string')
      })
    })
  })

  // =====================================================
  // isBusinessOwner()
  // =====================================================
  describe('isBusinessOwner()', () => {
    it('debe retornar true si userId === ownerId', () => {
      expect(isBusinessOwner('user-123', 'user-123')).toBe(true)
    })

    it('debe retornar false si userId !== ownerId', () => {
      expect(isBusinessOwner('user-123', 'user-456')).toBe(false)
    })

    it('debe retornar false si userId es vacío', () => {
      expect(isBusinessOwner('', 'user-456')).toBe(false)
    })

    it('debe retornar false si ownerId es vacío', () => {
      expect(isBusinessOwner('user-123', '')).toBe(false)
    })

    it('debe ser case-sensitive', () => {
      expect(isBusinessOwner('USER-123', 'user-123')).toBe(false)
    })
  })

  // =====================================================
  // hasPermission()
  // =====================================================
  describe('hasPermission()', () => {
    const userId = 'user-123'
    const ownerId = 'owner-456'

    it('debe retornar true si el usuario tiene el permiso', () => {
      const permissions = [createMockUserPermission({ permission: 'business.view' })]
      expect(hasPermission(userId, ownerId, permissions, 'business.view')).toBe(true)
    })

    it('debe retornar false si el usuario NO tiene el permiso', () => {
      const permissions = [createMockUserPermission({ permission: 'business.view' })]
      expect(hasPermission(userId, ownerId, permissions, 'business.delete')).toBe(false)
    })

    it('debe retornar false con array vacío', () => {
      expect(hasPermission(userId, ownerId, [], 'business.view')).toBe(false)
    })

    it('debe ignorar permisos inactivos', () => {
      const permissions = [
        createMockUserPermission({ permission: 'business.view', is_active: false }),
      ]
      expect(hasPermission(userId, ownerId, permissions, 'business.view')).toBe(false)
    })

    it('debe ignorar permisos expirados', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const permissions = [
        createMockUserPermission({
          permission: 'business.view',
          expires_at: yesterday.toISOString(),
        }),
      ]
      expect(hasPermission(userId, ownerId, permissions, 'business.view')).toBe(false)
    })

    it('debe retornar true si es Admin Dueño (bypassa verificaciones)', () => {
      expect(hasPermission('owner-123', 'owner-123', [], 'business.delete')).toBe(true)
    })
  })

  // =====================================================
  // hasAnyPermission()
  // =====================================================
  describe('hasAnyPermission()', () => {
    const userId = 'user-123'
    const ownerId = 'owner-456'

    it('debe retornar true si el usuario tiene alguno de los permisos', () => {
      const permissions = [createMockUserPermission({ permission: 'business.view' })]
      expect(
        hasAnyPermission(userId, ownerId, permissions, ['business.view', 'business.edit'])
      ).toBe(true)
    })

    it('debe retornar false si el usuario NO tiene ninguno', () => {
      const permissions = [createMockUserPermission({ permission: 'business.view' })]
      expect(
        hasAnyPermission(userId, ownerId, permissions, ['business.delete', 'business.edit'])
      ).toBe(false)
    })

    it('debe manejar array vacío de permisos requeridos', () => {
      const permissions = [createMockUserPermission({ permission: 'business.view' })]
      expect(hasAnyPermission(userId, ownerId, permissions, [])).toBe(false)
    })

    it('debe retornar true si es Admin Dueño', () => {
      expect(hasAnyPermission('owner-123', 'owner-123', [], ['business.delete'])).toBe(true)
    })
  })

  // =====================================================
  // hasAllPermissions()
  // =====================================================
  describe('hasAllPermissions()', () => {
    const userId = 'user-123'
    const ownerId = 'owner-456'

    it('debe retornar true si el usuario tiene todos los permisos', () => {
      const permissions = [
        createMockUserPermission({ id: '1', permission: 'business.view' }),
        createMockUserPermission({ id: '2', permission: 'business.edit' }),
      ]
      expect(
        hasAllPermissions(userId, ownerId, permissions, ['business.view', 'business.edit'])
      ).toBe(true)
    })

    it('debe retornar false si falta algún permiso', () => {
      const permissions = [createMockUserPermission({ permission: 'business.view' })]
      expect(
        hasAllPermissions(userId, ownerId, permissions, ['business.view', 'business.edit'])
      ).toBe(false)
    })

    it('debe retornar true con array vacío de permisos requeridos', () => {
      const permissions = [createMockUserPermission({ permission: 'business.view' })]
      expect(hasAllPermissions(userId, ownerId, permissions, [])).toBe(true)
    })

    it('debe retornar true si es Admin Dueño', () => {
      expect(
        hasAllPermissions('owner-123', 'owner-123', [], ['business.delete', 'business.edit'])
      ).toBe(true)
    })
  })

  // =====================================================
  // getUserActivePermissions()
  // =====================================================
  describe('getUserActivePermissions()', () => {
    it('debe retornar todos los permisos si es Admin Dueño', () => {
      const result = getUserActivePermissions('owner-id', 'owner-id', [])
      expect(result).toHaveLength(60)
      expect(result).toEqual(ALL_PERMISSIONS)
    })

    it('debe retornar solo permisos activos del usuario', () => {
      const permissions = [
        createMockUserPermission({
          id: '1',
          permission: 'business.view',
          is_active: true,
        }),
        createMockUserPermission({
          id: '2',
          permission: 'business.edit',
          is_active: false,
        }),
      ]
      const result = getUserActivePermissions('user-123', 'owner-id', permissions)
      expect(result).toHaveLength(1)
      expect(result).toEqual(['business.view'])
    })

    it('debe filtrar permisos expirados', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const permissions = [
        createMockUserPermission({
          id: '1',
          permission: 'business.view',
          expires_at: yesterday.toISOString(),
        }),
      ]
      const result = getUserActivePermissions('user-123', 'owner-id', permissions)
      expect(result).toHaveLength(0)
    })
  })

  // =====================================================
  // hasBusinessRole()
  // =====================================================
  describe('hasBusinessRole()', () => {
    it('debe retornar true si el usuario tiene el rol en el negocio', () => {
      const roles = [createMockBusinessRole({ business_id: 'business-1', role: 'admin' })]
      expect(hasBusinessRole(roles, 'business-1', 'admin')).toBe(true)
    })

    it('debe retornar false si el usuario NO tiene el rol', () => {
      const roles = [createMockBusinessRole({ business_id: 'business-1', role: 'admin' })]
      expect(hasBusinessRole(roles, 'business-1', 'employee')).toBe(false)
    })

    it('debe retornar false si es otro negocio', () => {
      const roles = [createMockBusinessRole({ business_id: 'business-1', role: 'admin' })]
      expect(hasBusinessRole(roles, 'business-2', 'admin')).toBe(false)
    })

    it('debe ignorar roles inactivos', () => {
      const roles = [
        createMockBusinessRole({ business_id: 'business-1', role: 'admin', is_active: false }),
      ]
      expect(hasBusinessRole(roles, 'business-1', 'admin')).toBe(false)
    })
  })

  // =====================================================
  // getUserBusinessRole()
  // =====================================================
  describe('getUserBusinessRole()', () => {
    it('debe retornar el rol del usuario en el negocio', () => {
      const roles = [createMockBusinessRole({ business_id: 'business-1', role: 'admin' })]
      expect(getUserBusinessRole(roles, 'business-1')).toBe('admin')
    })

    it('debe retornar null si no tiene rol en el negocio', () => {
      const roles = [createMockBusinessRole({ business_id: 'business-1', role: 'admin' })]
      expect(getUserBusinessRole(roles, 'business-2')).toBe(null)
    })

    it('debe ignorar roles inactivos', () => {
      const roles = [
        createMockBusinessRole({ business_id: 'business-1', role: 'admin', is_active: false }),
      ]
      expect(getUserBusinessRole(roles, 'business-1')).toBe(null)
    })
  })

  // =====================================================
  // canProvideServices()
  // =====================================================
  describe('canProvideServices()', () => {
    it('debe retornar true si es service_provider', () => {
      const roles = [
        createMockBusinessRole({
          business_id: 'business-1',
          role: 'employee',
          employee_type: 'service_provider',
        }),
      ]
      expect(canProvideServices(roles, 'business-1')).toBe(true)
    })

    it('debe retornar false si es support_staff', () => {
      const roles = [
        createMockBusinessRole({
          business_id: 'business-1',
          role: 'employee',
          employee_type: 'support_staff',
        }),
      ]
      expect(canProvideServices(roles, 'business-1')).toBe(false)
    })

    it('debe retornar false si es admin', () => {
      const roles = [createMockBusinessRole({ business_id: 'business-1', role: 'admin' })]
      expect(canProvideServices(roles, 'business-1')).toBe(false)
    })
  })

  // =====================================================
  // convertLegacyPermissions()
  // =====================================================
  describe('convertLegacyPermissions()', () => {
    it('debe convertir permisos legacy a granulares', () => {
      const result = convertLegacyPermissions(['read_appointments'])
      expect(result).toContain('appointments.view_all')
      expect(result).toContain('appointments.view_own')
    })

    it('debe manejar múltiples permisos legacy', () => {
      const result = convertLegacyPermissions(['read_appointments', 'write_appointments'])
      expect(result.length).toBeGreaterThan(2)
      expect(result).toContain('appointments.view_all')
      expect(result).toContain('appointments.create')
    })

    it('debe manejar permisos legacy desconocidos', () => {
      const result = convertLegacyPermissions(['unknown_permission'])
      expect(result).toEqual([])
    })

    it('debe remover duplicados', () => {
      const result = convertLegacyPermissions(['read_appointments', 'read_appointments'])
      const uniqueCount = new Set(result).size
      expect(uniqueCount).toBe(result.length)
    })
  })
})
