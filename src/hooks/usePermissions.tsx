/* eslint-disable react-refresh/only-export-components */
import React, { useMemo } from 'react'
import { Permission, User, UserRole } from '@/types'
import { ROLE_DESCRIPTIONS, getRolePermissions, userHasPermission } from '@/lib/permissions'

export function usePermissions(user: User | null) {
  const permissions = useMemo(() => {
    if (!user) {
      return {
        hasPermission: () => false,
        rolePermissions: [],
        canRead: () => false,
        canWrite: () => false,
        canDelete: () => false,
        canManage: () => false,
        isAdmin: false,
        isEmployee: false,
        isClient: false,
        roleDescription: '',
      }
    }

    // Use activeRole instead of legacy role field
    const activeRole = user.activeRole
    const rolePermissions = getRolePermissions(activeRole)
    const isAdmin = activeRole === 'admin'
    const isEmployee = activeRole === 'employee'
    const isClient = activeRole === 'client'

    return {
      hasPermission: (permission: Permission) =>
        userHasPermission(activeRole, user.permissions, permission),

      rolePermissions,

      canRead: (resource: string) =>
        userHasPermission(activeRole, user.permissions, `read_${resource}` as Permission),

      canWrite: (resource: string) =>
        userHasPermission(activeRole, user.permissions, `write_${resource}` as Permission),

      canDelete: (resource: string) =>
        userHasPermission(activeRole, user.permissions, `delete_${resource}` as Permission),

      canManage: (resource: string) =>
        userHasPermission(activeRole, user.permissions, `manage_${resource}` as Permission),

      isAdmin,
      isEmployee,
      isClient,

      roleDescription: ROLE_DESCRIPTIONS[activeRole] || '',
    }
  }, [user])

  return permissions
}

// Hook for business-specific permissions
export function useBusinessPermissions(user: User | null, businessId?: string) {
  const basePermissions = usePermissions(user)

  const businessPermissions = useMemo(() => {
    if (!user || !businessId) {
      return {
        ...basePermissions,
        canAccessBusiness: false,
        isBusinessOwner: false,
        isBusinessMember: false,
      }
    }

    const canAccessBusiness = user.business_id === businessId || basePermissions.isAdmin
    const isBusinessOwner = basePermissions.isAdmin && user.business_id === businessId
    const isBusinessMember = user.business_id === businessId

    return {
      ...basePermissions,
      canAccessBusiness,
      isBusinessOwner,
      isBusinessMember,
    }
  }, [user, businessId, basePermissions])

  return businessPermissions
}

// Hook for location-specific permissions
export function useLocationPermissions(user: User | null, locationId?: string) {
  const basePermissions = usePermissions(user)

  const locationPermissions = useMemo(() => {
    if (!user || !locationId) {
      return {
        ...basePermissions,
        canAccessLocation: false,
        isLocationAssigned: false,
      }
    }

    const canAccessLocation = user.location_id === locationId || basePermissions.isAdmin
    const isLocationAssigned = user.location_id === locationId

    return {
      ...basePermissions,
      canAccessLocation,
      isLocationAssigned,
    }
  }, [user, locationId, basePermissions])

  return locationPermissions
}

// Component wrapper for permission-based rendering
interface PermissionGuardProps {
  user: User | null
  permission?: Permission
  role?: UserRole
  businessId?: string
  locationId?: string
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function PermissionGuard({
  user,
  permission,
  role,
  businessId,
  locationId,
  fallback = null,
  children,
}: Readonly<PermissionGuardProps>) {
  const permissions = usePermissions(user)
  const businessPermissions = useBusinessPermissions(user, businessId)
  const locationPermissions = useLocationPermissions(user, locationId)

  // Check role requirement
  if (role && user?.role !== role) {
    return <>{fallback}</>
  }

  // Check permission requirement
  if (permission && !permissions.hasPermission(permission)) {
    return <>{fallback}</>
  }

  // Check business access requirement
  if (businessId && !businessPermissions.canAccessBusiness) {
    return <>{fallback}</>
  }

  // Check location access requirement
  if (locationId && !locationPermissions.canAccessLocation) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// Hook for navigation permissions
export function useNavigationPermissions(user: User | null) {
  const permissions = usePermissions(user)

  return useMemo(
    () => ({
      showDashboard: true, // Everyone can see dashboard
      showAppointments: permissions.canRead('appointments'),
      showClients: permissions.canRead('clients'),
      showEmployees: permissions.canRead('employees') || permissions.isAdmin,
      showReports: permissions.canRead('reports') || permissions.isAdmin,
      showBusiness:
        permissions.canRead('business') || permissions.canWrite('business') || permissions.isAdmin,
      showLocations:
        permissions.canRead('locations') ||
        permissions.canWrite('locations') ||
        permissions.isAdmin,
      showServices: permissions.canRead('services'),
      showSettings: true, // Everyone can see their own settings
      showAnalytics: permissions.canRead('reports') || permissions.isAdmin,
      canCreateAppointments: permissions.canWrite('appointments'),
      canManageUsers:
        permissions.canWrite('employees') ||
        permissions.canDelete('employees') ||
        permissions.isAdmin,
      canManageSettings: permissions.hasPermission('manage_settings') || permissions.isAdmin,
      canViewRecurringClients: true, // Available to all business users
      canSendWhatsApp: permissions.isAdmin || permissions.isEmployee,
    }),
    [permissions]
  )
}
