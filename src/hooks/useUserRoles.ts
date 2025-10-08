import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, UserRole, UserRoleAssignment } from '@/types/types'
import { useKV } from '@/lib/useKV'

const ACTIVE_ROLE_KEY = 'user-active-role'
const ACTIVE_BUSINESS_KEY = 'user-active-business'

export function useUserRoles(user: User | null) {
  const [roles, setRoles] = useState<UserRoleAssignment[]>(user?.roles || [])
  const [activeRole, setActiveRole] = useState<UserRole>(user?.activeRole || 'client')
  const [activeBusiness, setActiveBusiness] = useState<{ id: string; name: string } | undefined>(
    user?.activeBusiness
  )
  const [isLoading, setIsLoading] = useState(false)

  // Persist active role and business in localStorage
  const [, setStoredRole] = useKV<UserRole>(ACTIVE_ROLE_KEY, 'client')
  const [, setStoredBusiness] = useKV<{ id: string; name: string } | null>(ACTIVE_BUSINESS_KEY, null)

  // Fetch user roles from Supabase
  const fetchUserRoles = useCallback(async () => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          role,
          business_id,
          is_active,
          created_at,
          business:businesses(name)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (error) throw error

      const roleAssignments: UserRoleAssignment[] = (data || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        role: item.role,
        business_id: item.business_id,
        business_name: item.business?.[0]?.name,
        is_active: item.is_active,
        created_at: item.created_at,
      }))

      setRoles(roleAssignments)

      // If no active role set, default to first available or client
      if (!activeRole || !roleAssignments.find(r => r.role === activeRole)) {
        const defaultRole = roleAssignments[0]
        if (defaultRole) {
          setActiveRole(defaultRole.role)
          if (defaultRole.business_id && defaultRole.business_name) {
            setActiveBusiness({
              id: defaultRole.business_id,
              name: defaultRole.business_name,
            })
          }
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching user roles:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, activeRole])

  // Load roles on mount
  useEffect(() => {
    if (user?.id) {
      fetchUserRoles()
    }
  }, [user?.id, fetchUserRoles])

  // Function to switch active role
  const switchRole = useCallback(
    async (newRole: UserRole, businessId?: string) => {
      if (!user?.id) return false

      try {
        // Call Supabase function to update active role
        const { data, error } = await supabase.rpc('switch_active_role', {
          user_uuid: user.id,
          new_role: newRole,
          new_business_id: businessId || null,
        })

        if (error) throw error

        if (data) {
          setActiveRole(newRole)
          setStoredRole(newRole)

          // Update active business
          if (businessId && (newRole === 'admin' || newRole === 'employee')) {
            const roleAssignment = roles.find(
              r => r.role === newRole && r.business_id === businessId
            )
            if (roleAssignment?.business_name) {
              const business = { id: businessId, name: roleAssignment.business_name }
              setActiveBusiness(business)
              setStoredBusiness(business)
            }
          } else {
            setActiveBusiness(undefined)
            setStoredBusiness(null)
          }

          // Reload page to refresh data with new role context
          window.location.reload()
          return true
        }

        return false
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error switching role:', error)
        return false
      }
    },
    [user?.id, roles, setStoredRole, setStoredBusiness]
  )

  // Check if user has a specific role
  const hasRole = useCallback(
    (role: UserRole): boolean => {
      return roles.some(r => r.role === role && r.is_active)
    },
    [roles]
  )

  // Get roles for a specific type
  const getRolesByType = useCallback(
    (role: UserRole): UserRoleAssignment[] => {
      return roles.filter(r => r.role === role && r.is_active)
    },
    [roles]
  )

  return {
    roles,
    activeRole,
    activeBusiness,
    isLoading,
    switchRole,
    hasRole,
    getRolesByType,
    refetchRoles: fetchUserRoles,
  }
}
