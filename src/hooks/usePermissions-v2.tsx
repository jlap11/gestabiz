// =====================================================
// HOOK: usePermissions v2.0 - APPOINTSYNC PRO
// Fecha: 13 de Octubre de 2025
// =====================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  Permission,
  BusinessRole,
  UserPermission,
  PermissionTemplate,
  PermissionAuditLog,
} from '@/types/types'
import {
  isBusinessOwner,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserActivePermissions,
  hasBusinessRole,
  getUserBusinessRole,
  canProvideServices,
} from '@/lib/permissions-v2'

// =====================================================
// TIPOS
// =====================================================

export interface UsePermissionsOptions {
  userId: string
  businessId: string
  ownerId: string
}

export interface PermissionCheckResult {
  hasPermission: boolean
  isOwner: boolean
  reason?: string
}

// =====================================================
// HOOK PRINCIPAL
// =====================================================

export function usePermissions({ userId, businessId, ownerId }: UsePermissionsOptions) {
  const queryClient = useQueryClient()

  // =====================================================
  // QUERIES
  // =====================================================

  /**
   * Obtiene roles del usuario en el negocio
   */
  const { data: businessRoles, isLoading: loadingRoles } = useQuery({
    queryKey: ['business-roles', userId, businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('business_id', businessId)
        .eq('is_active', true)

      if (error) throw error
      return data as BusinessRole[]
    },
    enabled: !!userId && !!businessId,
  })

  /**
   * Obtiene permisos del usuario en el negocio
   */
  const { data: userPermissions, isLoading: loadingPermissions } = useQuery({
    queryKey: ['user-permissions', userId, businessId],
    queryFn: async () => {
      // Si es owner, retornar array vacío (bypasea verificaciones)
      if (userId === ownerId) {
        return [] as UserPermission[]
      }

      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', userId)
        .eq('business_id', businessId)
        .eq('is_active', true)

      if (error) throw error
      return data as UserPermission[]
    },
    enabled: !!userId && !!businessId,
  })

  /**
   * Obtiene plantillas de permisos
   */
  const { data: templates, isLoading: loadingTemplates } = useQuery({
    queryKey: ['permission-templates', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permission_templates')
        .select('*')
        .or(`business_id.eq.${businessId},is_system_template.eq.true`)
        .order('is_system_template', { ascending: false })
        .order('name')

      if (error) throw error
      return data as PermissionTemplate[]
    },
    enabled: !!businessId,
  })

  /**
   * Obtiene audit log de permisos
   */
  const { data: auditLog, isLoading: loadingAuditLog } = useQuery({
    queryKey: ['permission-audit-log', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permission_audit_log')
        .select(`
          *,
          user:profiles!permission_audit_log_user_id_fkey (id, name, email),
          performed_by_user:profiles!permission_audit_log_performed_by_fkey (id, name, email)
        `)
        .eq('business_id', businessId)
        .order('performed_at', { ascending: false })
        .limit(500)

      if (error) throw error
      
      // Mapear datos para incluir nombres calculados y created_at
      const mapped = (data || []).map(entry => ({
        ...entry,
        created_at: entry.performed_at, // Usar performed_at como created_at
        user_name: entry.user?.name || 'Usuario desconocido',
        performed_by_name: entry.performed_by_user?.name || 'Sistema',
      }))
      
      return mapped as PermissionAuditLog[]
    },
    enabled: !!businessId,
  })

  // =====================================================
  // VERIFICACIONES
  // =====================================================

  const isOwner = isBusinessOwner(userId, ownerId)
  const isAdmin = hasBusinessRole(businessRoles || [], businessId, 'admin')
  const isEmployee = hasBusinessRole(businessRoles || [], businessId, 'employee')
  const role = getUserBusinessRole(businessRoles || [], businessId)
  const canOfferServices = canProvideServices(businessRoles || [], businessId)

  /**
   * Verifica si tiene un permiso específico
   */
  const checkPermission = (permission: Permission): PermissionCheckResult => {
    if (isOwner) {
      return { hasPermission: true, isOwner: true, reason: 'Admin Dueño' }
    }

    const result = hasPermission(userId, ownerId, userPermissions || [], permission)
    return {
      hasPermission: result,
      isOwner: false,
      reason: result ? 'Permiso otorgado' : 'Sin permiso',
    }
  }

  /**
   * Verifica si tiene CUALQUIERA de los permisos
   */
  const checkAnyPermission = (permissions: Permission[]): PermissionCheckResult => {
    if (isOwner) {
      return { hasPermission: true, isOwner: true, reason: 'Admin Dueño' }
    }

    const result = hasAnyPermission(userId, ownerId, userPermissions || [], permissions)
    return {
      hasPermission: result,
      isOwner: false,
      reason: result ? 'Permiso otorgado' : 'Sin permisos requeridos',
    }
  }

  /**
   * Verifica si tiene TODOS los permisos
   */
  const checkAllPermissions = (permissions: Permission[]): PermissionCheckResult => {
    if (isOwner) {
      return { hasPermission: true, isOwner: true, reason: 'Admin Dueño' }
    }

    const result = hasAllPermissions(userId, ownerId, userPermissions || [], permissions)
    return {
      hasPermission: result,
      isOwner: false,
      reason: result ? 'Todos los permisos otorgados' : 'Faltan permisos',
    }
  }

  /**
   * Obtiene todos los permisos activos del usuario
   */
  const activePermissions = getUserActivePermissions(
    userId,
    ownerId,
    userPermissions || []
  )

  // =====================================================
  // MUTATIONS
  // =====================================================

  /**
   * Asignar rol a usuario
   */
  const assignRole = useMutation({
    mutationFn: async ({
      targetUserId,
      role,
      employeeType,
      notes,
    }: {
      targetUserId: string
      role: 'admin' | 'employee'
      employeeType?: 'service_provider' | 'support_staff'
      notes?: string
    }) => {
      const { data, error } = await supabase
        .from('business_roles')
        .insert({
          business_id: businessId,
          user_id: targetUserId,
          role,
          employee_type: employeeType,
          assigned_by: userId,
          notes,
        })
        .select()
        .single()

      if (error) throw error
      return data as BusinessRole
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-roles'] })
      queryClient.invalidateQueries({ queryKey: ['permission-audit-log'] })
    },
  })

  /**
   * Revocar rol de usuario
   */
  const revokeRole = useMutation({
    mutationFn: async ({ roleId }: { roleId: string }) => {
      const { error } = await supabase
        .from('business_roles')
        .delete()
        .eq('id', roleId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-roles'] })
      queryClient.invalidateQueries({ queryKey: ['permission-audit-log'] })
    },
  })

  /**
   * Otorgar permiso a usuario
   */
  const grantPermission = useMutation({
    mutationFn: async ({
      targetUserId,
      permission,
      expiresAt,
      notes,
    }: {
      targetUserId: string
      permission: Permission
      expiresAt?: string
      notes?: string
    }) => {
      const { data, error } = await supabase
        .from('user_permissions')
        .insert({
          business_id: businessId,
          user_id: targetUserId,
          permission,
          granted_by: userId,
          expires_at: expiresAt,
          notes,
        })
        .select()
        .single()

      if (error) throw error
      return data as UserPermission
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-permissions'] })
      queryClient.invalidateQueries({ queryKey: ['permission-audit-log'] })
    },
  })

  /**
   * Revocar permiso de usuario
   */
  const revokePermission = useMutation({
    mutationFn: async ({ permissionId }: { permissionId: string }) => {
      const { error } = await supabase
        .from('user_permissions')
        .delete()
        .eq('id', permissionId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-permissions'] })
      queryClient.invalidateQueries({ queryKey: ['permission-audit-log'] })
    },
  })

  /**
   * Aplicar plantilla de permisos a usuario
   */
  const applyTemplate = useMutation({
    mutationFn: async ({
      targetUserId,
      templateId,
    }: {
      targetUserId: string
      templateId: string
    }) => {
      // Obtener plantilla
      const template = templates?.find((t) => t.id === templateId)
      if (!template) throw new Error('Template not found')

      // Insertar permisos en batch
      const permissions = template.permissions.map((permission) => ({
        business_id: businessId,
        user_id: targetUserId,
        permission,
        granted_by: userId,
        notes: `Aplicado desde plantilla: ${template.name}`,
      }))

      const { data, error } = await supabase
        .from('user_permissions')
        .upsert(permissions, { onConflict: 'business_id,user_id,permission' })
        .select()

      if (error) throw error
      return data as UserPermission[]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-permissions'] })
      queryClient.invalidateQueries({ queryKey: ['permission-audit-log'] })
    },
  })

  /**
   * Crear plantilla de permisos
   */
  const createTemplate = useMutation({
    mutationFn: async ({
      name,
      description,
      role,
      permissions,
    }: {
      name: string
      description?: string
      role: 'admin' | 'employee'
      permissions: Permission[]
    }) => {
      const { data, error } = await supabase
        .from('permission_templates')
        .insert({
          business_id: businessId,
          name,
          description,
          role,
          permissions: JSON.stringify(permissions),
          created_by: userId,
        })
        .select()
        .single()

      if (error) throw error
      return data as PermissionTemplate
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permission-templates'] })
    },
  })

  /**
   * Eliminar plantilla de permisos
   */
  const deleteTemplate = useMutation({
    mutationFn: async ({ templateId }: { templateId: string }) => {
      const { error } = await supabase
        .from('permission_templates')
        .delete()
        .eq('id', templateId)
        .eq('is_system_template', false) // No permitir eliminar templates del sistema

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permission-templates'] })
    },
  })

  // =====================================================
  // RETURN
  // =====================================================

  return {
    // Estado
    isLoading: loadingRoles || loadingPermissions,
    isOwner,
    isAdmin,
    isEmployee,
    role,
    canOfferServices,

    // Datos
    businessRoles: businessRoles || [],
    userPermissions: userPermissions || [],
    activePermissions,
    templates: templates || [],
    auditLog: auditLog || [],

    // Verificaciones
    checkPermission,
    checkAnyPermission,
    checkAllPermissions,

    // Mutations
    assignRole: assignRole.mutate,
    assignRoleAsync: assignRole.mutateAsync,
    isAssigningRole: assignRole.isPending,

    revokeRole: revokeRole.mutate,
    revokeRoleAsync: revokeRole.mutateAsync,
    isRevokingRole: revokeRole.isPending,

    grantPermission: grantPermission.mutate,
    grantPermissionAsync: grantPermission.mutateAsync,
    isGrantingPermission: grantPermission.isPending,

    revokePermission: revokePermission.mutate,
    revokePermissionAsync: revokePermission.mutateAsync,
    isRevokingPermission: revokePermission.isPending,

    applyTemplate: applyTemplate.mutate,
    applyTemplateAsync: applyTemplate.mutateAsync,
    isApplyingTemplate: applyTemplate.isPending,

    createTemplate: createTemplate.mutate,
    createTemplateAsync: createTemplate.mutateAsync,
    isCreatingTemplate: createTemplate.isPending,

    deleteTemplate: deleteTemplate.mutate,
    deleteTemplateAsync: deleteTemplate.mutateAsync,
    isDeletingTemplate: deleteTemplate.isPending,
  }
}

// =====================================================
// HOOK SIMPLIFICADO PARA VERIFICACIÓN RÁPIDA
// =====================================================

/**
 * Hook simplificado para verificar un solo permiso
 */
export function useHasPermission(
  userId: string,
  businessId: string,
  ownerId: string,
  permission: Permission
): boolean {
  const { checkPermission, isLoading } = usePermissions({ userId, businessId, ownerId })

  if (isLoading) return false
  return checkPermission(permission).hasPermission
}

/**
 * Hook simplificado para verificar rol de Admin Dueño
 */
export function useIsBusinessOwner(userId: string, ownerId: string): boolean {
  return isBusinessOwner(userId, ownerId)
}
