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
  // Clave de almacenamiento por usuario para evitar fugas de contexto entre cuentas
  const storageKey = user?.id ? `${ACTIVE_ROLE_KEY}:${user.id}` : ACTIVE_ROLE_KEY

  // Persist active role context in localStorage (por usuario)
  const [storedContext, setStoredContext] = useKV<StoredRoleContext | null>(storageKey, null)
  const [roles, setRoles] = useState<UserRoleAssignment[]>([])

  // Inicializar desde storedContext para evitar "parpadeo" hacia Cliente tras login
  const [activeRole, setActiveRole] = useState<UserRole>(() => storedContext?.role ?? 'client')
  const [activeBusiness, setActiveBusiness] = useState<{ id: string; name: string } | undefined>(() => {
    return storedContext?.businessId && storedContext?.businessName
      ? { id: storedContext.businessId, name: storedContext.businessName }
      : undefined
  })
  const [isLoading, setIsLoading] = useState(false)

  // Migrar una vez desde la clave global si existe y aún no hay valor por usuario
  useEffect(() => {
    if (!user?.id || typeof window === 'undefined') return
    const oldKey = ACTIVE_ROLE_KEY
    const newKey = `${ACTIVE_ROLE_KEY}:${user.id}`
    try {
      const oldVal = window.localStorage.getItem(oldKey)
      const newVal = window.localStorage.getItem(newKey)
      if (oldVal && !newVal) {
        window.localStorage.setItem(newKey, oldVal)
      }
    } catch {}
  }, [user?.id])

  // Use ref to avoid infinite loop in fetchUserRoles dependencies
  const storedContextRef = useRef(storedContext)
  const setStoredContextRef = useRef(setStoredContext)
  
  // Keep refs updated
  useEffect(() => {
    storedContextRef.current = storedContext
    setStoredContextRef.current = setStoredContext
  }, [storedContext, setStoredContext])

  // Sincronizar estado cuando cambie storedContext (por ejemplo, al cambiar de usuario)
  useEffect(() => {
    if (storedContext) {
      setActiveRole(storedContext.role)
      if (storedContext.businessId && storedContext.businessName) {
        setActiveBusiness({ id: storedContext.businessId, name: storedContext.businessName })
      } else {
        setActiveBusiness(undefined)
      }
    } else {
      setActiveRole('client')
      setActiveBusiness(undefined)
    }
  }, [storedContext])

  // Flag to prevent multiple fetches
  const hasFetchedRef = useRef(false)

  // Fetch user available roles dynamically based on relationships
  const fetchUserRoles = useCallback(async () => {
    if (!user?.id) {
      return
    }

    setIsLoading(true)
    try {
      // Build role assignments array based on actual relationships
      const roleAssignments: UserRoleAssignment[] = []

      // 1. Get businesses owned by user (admin role)
      const { data: ownedBusinesses, error: businessError } = await supabase
        .from('businesses')
        .select('id, name')
        .eq('owner_id', user.id)
        
      if (businessError) {
        throw businessError
      }

      if (ownedBusinesses && ownedBusinesses.length > 0) {
        ownedBusinesses.forEach((business) => {
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

      // 2. Get businesses where user is employee (approved)
      const { data: employeeRelations, error: employeeError } = await supabase
        .from('business_employees')
        .select('business_id, status, businesses:business_id(id, name)')
        .eq('employee_id', user.id)
        .eq('status', 'approved')
      
      if (employeeError) {
        throw employeeError
      }

      if (employeeRelations && employeeRelations.length > 0) {
        employeeRelations.forEach((rel) => {
          const bizData = rel.businesses
          const biz = Array.isArray(bizData) ? bizData[0] : bizData
          const business = biz || { id: rel.business_id, name: undefined }

          if (business?.id) {
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

      setRoles(roleAssignments)

      // Restore previous role context from localStorage
      const currentStoredContext = storedContextRef.current
      
      if (currentStoredContext) {
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
        // No stored context - default to client role (first time user)
        setActiveRole('client')
        setActiveBusiness(undefined)
        setStoredContextRef.current({ role: 'client' })
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
      if (!user?.id) {
        toast.error('Usuario no autenticado')
        return false
      }

      // Check if user has this role WITH a business
      const hasRole = roles.find(r => 
        r.role === newRole && 
        (businessId ? r.business_id === businessId : r.business_id === null)
      )

      // For admin/employee roles: Allow switching even without business (will show onboarding)
      // For client role: Always available to everyone
      const canSwitch = hasRole || newRole === 'client' || newRole === 'admin' || newRole === 'employee'

      if (!canSwitch) {
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
          } else {
            // Store without business name if not available
            setStoredContextRef.current({ role: newRole, businessId })
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
        
        toast.success(`Cambiado a rol ${roleLabel}`)

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