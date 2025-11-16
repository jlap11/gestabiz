/**
 * Hook unificado de permisos - Sistema v2.0
 * 
 * Este hook actúa como wrapper del sistema de permisos v2.0, manteniendo
 * compatibilidad con código existente que usa la API legacy.
 * 
 * @version 2.0.0
 * @date 16/11/2025
 * @see src/lib/permissions-v2.ts - Sistema completo de 55+ permisos
 * @see src/hooks/usePermissions-v2.tsx - Hook base con React Query
 */

import { useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Permission } from '@/types/types'
import { usePermissions as usePermissionsV2 } from './usePermissions-v2'

/**
 * Hook unificado de permisos con API compatible
 * 
 * Obtiene businessId del contexto de autenticación actual.
 * Usa sistema v2.0 internamente pero expone API legacy + v2.
 * 
 * @param businessId - ID del negocio (opcional, usa contexto si no se provee)
 * @returns API de permisos unificada (legacy + v2)
 * 
 * @example API Legacy (compatible con código existente)
 * ```tsx
 * const { hasPermission, isAdmin } = usePermissions();
 * if (hasPermission('accounting.view')) {
 *   // Mostrar módulo de contabilidad
 * }
 * ```
 * 
 * @example API v2 (recomendada para nuevo código)
 * ```tsx
 * const { checkPermission } = usePermissions();
 * const result = checkPermission('employees.edit');
 * if (!result.hasPermission) {
 *   console.log('Razón:', result.reason);
 * }
 * ```
 */
export function usePermissions(businessId?: string) {
  const { user, currentBusinessId, businessOwnerId } = useAuth()
  
  // Usar businessId del contexto o el provisto como parámetro
  const finalBusinessId = businessId || currentBusinessId || ''
  const userId = user?.id || ''
  const ownerId = businessOwnerId || ''
  
  // Hook v2 base (solo si tenemos los datos necesarios)
  const v2Enabled = !!(userId && finalBusinessId && ownerId)
  
  const v2Hook = usePermissionsV2({
    userId,
    businessId: finalBusinessId,
    ownerId,
  })
  
  // Si no está habilitado o no hay datos, retornar API sin permisos
  if (!v2Enabled || !user) {
    return {
      // API Legacy
      hasPermission: () => false,
      
      // API v2
      checkPermission: (permission: Permission) => ({
        hasPermission: false,
        isOwner: false,
        reason: 'Usuario no autenticado'
      }),
      checkAnyPermission: () => ({ hasPermission: false, isOwner: false }),
      checkAllPermissions: () => ({ hasPermission: false, isOwner: false }),
      
      // Flags
      isOwner: false,
      isAdmin: false,
      isEmployee: false,
      canProvideServices: false,
      
      // Datos
      userPermissions: [],
      businessRoles: [],
      getActivePermissions: () => [],
      
      // Loading states
      isLoading: false,
      
      // Contexto
      businessId: finalBusinessId,
      userId: userId
    }
  }
  
  // Extraer funciones y datos del hook v2
  const {
    checkPermission: v2CheckPermission,
    checkAnyPermission,
    checkAllPermissions,
    isOwner,
    isAdmin,
    isEmployee,
    canProvideServices,
    userPermissions,
    businessRoles,
    getActivePermissions,
    isLoading
  } = v2Hook
  
  // ============================================================
  // API LEGACY (para compatibilidad con código existente)
  // ============================================================
  
  /**
   * Verifica si el usuario tiene un permiso específico (API legacy)
   * 
   * @deprecated Usar checkPermission() para obtener más contexto
   * @param permission - Permiso a verificar
   * @returns true si tiene el permiso, false en caso contrario
   */
  const hasPermission = useCallback((permission: Permission): boolean => {
    if (isOwner) return true
    const result = v2CheckPermission(permission)
    return result.hasPermission
  }, [v2CheckPermission, isOwner])
  
  // ============================================================
  // API V2 (recomendada para nuevo código)
  // ============================================================
  
  /**
   * Verifica permiso y retorna objeto con contexto completo
   * 
   * @param permission - Permiso a verificar
   * @returns Objeto con hasPermission, isOwner, reason
   */
  const checkPermission = useCallback((permission: Permission) => {
    return v2CheckPermission(permission)
  }, [v2CheckPermission])
  
  return {
    // ========== API Legacy (compatible) ==========
    hasPermission,
    
    // ========== API v2 (extendida) ==========
    checkPermission,
    checkAnyPermission,
    checkAllPermissions,
    
    // ========== Flags útiles ==========
    isOwner,
    isAdmin,
    isEmployee,
    canProvideServices,
    
    // ========== Datos raw ==========
    userPermissions,
    businessRoles,
    getActivePermissions,
    
    // ========== Loading states ==========
    isLoading,
    
    // ========== Contexto ==========
    businessId: finalBusinessId,
    userId: userId
  }
}

/**
 * Hook helper para verificación simple de permiso
 * 
 * @param permission - Permiso a verificar
 * @param businessId - ID del negocio (opcional)
 * @returns true si tiene permiso, false en caso contrario
 * 
 * @example
 * ```tsx
 * const canEdit = useHasPermission('employees.edit');
 * if (!canEdit) return <AccessDenied />;
 * ```
 */
export function useHasPermission(permission: Permission, businessId?: string): boolean {
  const { hasPermission } = usePermissions(businessId)
  return hasPermission(permission)
}

/**
 * Hook helper para verificar múltiples permisos (ANY - OR lógico)
 * 
 * @param permissions - Array de permisos a verificar
 * @param businessId - ID del negocio (opcional)
 * @returns true si tiene al menos uno de los permisos
 * 
 * @example
 * ```tsx
 * const canManageEmployees = useHasAnyPermission([
 *   'employees.edit',
 *   'employees.delete'
 * ]);
 * ```
 */
export function useHasAnyPermission(permissions: Permission[], businessId?: string): boolean {
  const { checkAnyPermission } = usePermissions(businessId)
  const result = checkAnyPermission(permissions)
  return result.hasPermission
}

/**
 * Hook helper para verificar múltiples permisos (ALL - AND lógico)
 * 
 * @param permissions - Array de permisos a verificar
 * @param businessId - ID del negocio (opcional)
 * @returns true si tiene todos los permisos
 * 
 * @example
 * ```tsx
 * const canFullAccountingAccess = useHasAllPermissions([
 *   'accounting.view',
 *   'accounting.export'
 * ]);
 * ```
 */
export function useHasAllPermissions(permissions: Permission[], businessId?: string): boolean {
  const { checkAllPermissions } = usePermissions(businessId)
  const result = checkAllPermissions(permissions)
  return result.hasPermission
}