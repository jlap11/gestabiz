import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, UserRole, UserRoleAssignment } from '@/types/types'
import { useKV } from '@/lib/useKV'
import { toast } from 'sonner'

const ACTIVE_ROLE_KEY = 'user-active-role'

interface StoredRoleContext {
  role: UserRole
  businessId?: string
  businessName?: string
}

export function useUserRoles(user: User | null) {
  const [roles, setRoles] = useState<UserRoleAssignment[]>([])
  const [activeRole, setActiveRole] = useState<UserRole>('client')
  const [activeBusiness, setActiveBusiness] = useState<{ id: string; name: string } | undefined>()
  const [isLoading, setIsLoading] = useState(false)

  // Persist active role context in localStorage
  const [storedContext, setStoredContext] = useKV<StoredRoleContext | null>(ACTIVE_ROLE_KEY, null)
  
  // Use ref to avoid infinite loop in fetchUserRoles dependencies
  const storedContextRef = useRef(storedContext)
  const setStoredContextRef = useRef(setStoredContext)
  
  // Keep refs updated
  useEffect(() => {
    storedContextRef.current = storedContext
    setStoredContextRef.current = setStoredContext
  }, [storedContext, setStoredContext])

  // Flag to prevent multiple fetches
  const hasFetchedRef = useRef(false)

  // Fetch user available roles dynamically based on relationships
  const fetchUserRoles = useCallback(async () => {
    if (!user?.id) {
      console.log('[useUserRoles] No user.id, skipping role fetch')
      return
    }

    console.log('[useUserRoles] Fetching roles for user:', user.id)
    setIsLoading(true)
    try {
      // Build role assignments array based on actual relationships
      const roleAssignments: UserRoleAssignment[] = []

      // 1. Get businesses owned by user (admin role)
      const { data: ownedBusinesses, error: businessError } = await supabase
        .from('businesses')
        .select('id, name')
        .eq('owner_id', user.id)
      
      console.log('[useUserRoles] Owned businesses:', ownedBusinesses)

      if (businessError && businessError.code !== 'PGRST116') {
        throw businessError
      }

      // Add admin roles for owned businesses
      if (ownedBusinesses && ownedBusinesses.length > 0) {
        ownedBusinesses.forEach(business => {
          roleAssignments.push({
            id: `${user.id}-admin-${business.id}`,
            user_id: user.id,
            role: 'admin',
            business_id: business.id,
            business_name: business.name,
            is_active: true,
            created_at: user.created_at,
          })
        })
      }

      // 2. Get businesses where user is employee
      const { data: employeeBusinesses, error: empError } = await supabase
        .from('business_employees')
        .select('business_id, businesses(id, name)')
        .eq('employee_id', user.id)
      
      console.log('[useUserRoles] Employee businesses:', employeeBusinesses)

      if (empError && empError.code !== 'PGRST116') {
        throw empError
      }

      // Add employee roles
      if (employeeBusinesses && employeeBusinesses.length > 0) {
        employeeBusinesses.forEach(emp => {
          const business = Array.isArray(emp.businesses) ? emp.businesses[0] : emp.businesses
          if (business) {
            roleAssignments.push({
              id: `${user.id}-employee-${business.id}`,
              user_id: user.id,
              role: 'employee',
              business_id: business.id,
              business_name: business.name,
              is_active: true,
              created_at: user.created_at,
            })
          }
        })
      }

      // 3. Always add employee role (everyone can be an employee)
      // Note: Even if user has no business_employees relationship, they can switch to employee role
      // and will see the employee onboarding to join a business
      const hasEmployeeRole = roleAssignments.some(r => r.role === 'employee')
      if (!hasEmployeeRole) {
        roleAssignments.push({
          id: `${user.id}-employee`,
          user_id: user.id,
          role: 'employee',
          business_id: null,
          is_active: true,
          created_at: user.created_at,
        })
      }

      // 4. Always add client role (everyone can book appointments)
      roleAssignments.push({
        id: `${user.id}-client`,
        user_id: user.id,
        role: 'client',
        business_id: null,
        is_active: true,
        created_at: user.created_at,
      })

      console.log('[useUserRoles] Final role assignments:', roleAssignments)
      setRoles(roleAssignments)

      // Restore previous role context from localStorage or default to first available
      const currentStoredContext = storedContextRef.current
      
      // Allow admin/employee roles even without businesses (will show onboarding)
      const hasStoredRole = currentStoredContext && (
        roleAssignments.find(r => 
          r.role === currentStoredContext.role && 
          (currentStoredContext.businessId ? r.business_id === currentStoredContext.businessId : true)
        ) ||
        currentStoredContext.role === 'admin' ||
        currentStoredContext.role === 'employee' ||
        currentStoredContext.role === 'client'
      )
      
      console.log('[useUserRoles] Stored context:', currentStoredContext, 'Has stored role?', !!hasStoredRole)
      
      if (hasStoredRole && currentStoredContext) {
        // Restore stored context (even if no business, to trigger onboarding)
        console.log('[useUserRoles] Restoring stored role:', currentStoredContext.role)
        setActiveRole(currentStoredContext.role)
        if (currentStoredContext.businessId && currentStoredContext.businessName) {
          setActiveBusiness({
            id: currentStoredContext.businessId,
            name: currentStoredContext.businessName,
          })
        } else {
          setActiveBusiness(undefined)
        }
      } else {
        // Default to first available role (prefer admin > employee > client)
        console.log('[useUserRoles] No stored context, using default role')
        const defaultRole = roleAssignments.find(r => r.role === 'admin') 
          || roleAssignments.find(r => r.role === 'employee')
          || roleAssignments.find(r => r.role === 'client')
        
        if (defaultRole) {
          setActiveRole(defaultRole.role)
          if (defaultRole.business_id && defaultRole.business_name) {
            setActiveBusiness({
              id: defaultRole.business_id,
              name: defaultRole.business_name,
            })
            setStoredContextRef.current({
              role: defaultRole.role,
              businessId: defaultRole.business_id,
              businessName: defaultRole.business_name,
            })
          } else {
            setStoredContextRef.current({ role: defaultRole.role })
          }
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching user roles:', error)
      toast.error('Error al cargar roles disponibles')
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, user?.created_at])

  // Load roles on mount (only once per user)
  useEffect(() => {
    if (user?.id && !hasFetchedRef.current) {
      hasFetchedRef.current = true
      fetchUserRoles()
    }
  }, [user?.id, fetchUserRoles])

  // Reset fetch flag when user changes
  useEffect(() => {
    if (user?.id) {
      hasFetchedRef.current = false
    }
  }, [user?.id])

  // Function to switch active role (no database update needed!)
  const switchRole = useCallback(
    async (newRole: UserRole, businessId?: string) => {
      console.log('[useUserRoles] switchRole called:', { newRole, businessId, availableRoles: roles })
      
      if (!user?.id) {
        console.log('[useUserRoles] switchRole: No user.id')
        toast.error('Usuario no autenticado')
        return false
      }

      // Check if user has this role WITH a business
      const hasRole = roles.find(r => 
        r.role === newRole && 
        (businessId ? r.business_id === businessId : r.business_id === null)
      )

      console.log('[useUserRoles] switchRole: Has role?', hasRole)

      // For admin/employee roles: Allow switching even without business (will show onboarding)
      // For client role: Always available to everyone
      const canSwitch = hasRole || newRole === 'client' || newRole === 'admin' || newRole === 'employee'

      if (!canSwitch) {
        console.log('[useUserRoles] switchRole: Cannot switch to this role')
        toast.error('No tienes acceso a este rol')
        return false
      }

      try {
        // Update local state
        setActiveRole(newRole)

        // Update active business context
        if (businessId && (newRole === 'admin' || newRole === 'employee')) {
          const roleAssignment = roles.find(
            r => r.role === newRole && r.business_id === businessId
          )
          if (roleAssignment?.business_name) {
            const business = { id: businessId, name: roleAssignment.business_name }
            setActiveBusiness(business)
            
            // Store in localStorage
            setStoredContextRef.current({
              role: newRole,
              businessId: businessId,
              businessName: roleAssignment.business_name,
            })
          }
        } else {
          // No business context (will trigger onboarding if needed)
          setActiveBusiness(undefined)
          setStoredContextRef.current({ role: newRole })
        }

        // Get role label for toast
        let roleLabel = 'Cliente'
        if (newRole === 'admin') roleLabel = 'Administrador'
        else if (newRole === 'employee') roleLabel = 'Empleado'
        
        console.log('[useUserRoles] switchRole: Success, role changed to', newRole)
        toast.success(`Cambiado a rol ${roleLabel}`)

        // No reload needed - state update will trigger re-render
        // The component will automatically show the new role's view
        
        return true
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error switching role:', error)
        toast.error('Error al cambiar de rol')
        return false
      }
    },
    [user?.id, roles]
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
