import React, { Suspense } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useUserRoles } from '@/hooks/useUserRoles'
import { useAdminBusinesses } from '@/hooks/useAdminBusinesses'
import { useEmployeeBusinesses } from '@/hooks/useEmployeeBusinesses'
import { SuspenseFallback } from '@/components/ui/loading-spinner'
import { toast } from 'sonner'

// Lazy load components for better performance
const EmployeeOnboarding = React.lazy(() =>
  import('@/components/employee/EmployeeOnboarding').then(m => ({ default: m.EmployeeOnboarding }))
)
const AdminOnboarding = React.lazy(() =>
  import('@/components/admin/AdminOnboarding').then(m => ({ default: m.AdminOnboarding }))
)
const AdminDashboard = React.lazy(() =>
  import('@/components/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard }))
)
const EmployeeDashboard = React.lazy(() =>
  import('@/components/employee/EmployeeDashboard').then(m => ({ default: m.EmployeeDashboard }))
)
const ClientDashboard = React.lazy(() =>
  import('@/components/client/ClientDashboard').then(m => ({ default: m.ClientDashboard }))
)

interface MainAppProps {
  onLogout: () => void
}

function MainApp({ onLogout }: Readonly<MainAppProps>) {
  const { user, signOut } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedBusinessId, setSelectedBusinessId] = React.useState<string | undefined>()
  const [isCreatingNewBusiness, setIsCreatingNewBusiness] = React.useState(false)
  const [bookingContext, setBookingContext] = React.useState<{
    businessId?: string
    serviceId?: string
    locationId?: string
    employeeId?: string
  } | null>(null)

  // Manage user roles and active role switching
  const { roles, activeRole, activeBusiness, switchRole } = useUserRoles(user)

  // Fetch admin businesses if user is admin
  const {
    businesses,
    isLoading: isLoadingBusinesses,
    refetch: refetchBusinesses,
  } = useAdminBusinesses(activeRole === 'admin' ? user?.id : undefined)

  // Fetch employee businesses (for all users to check if they have employments)
  const { businesses: employeeBusinesses, loading: isLoadingEmployeeBusinesses } =
    useEmployeeBusinesses(
      user?.id,
      true // Include businesses where user is owner
    )


  // Extract booking context from URL params (from public profile redirect)
  React.useEffect(() => {
    const businessId = searchParams.get('businessId')
    const serviceId = searchParams.get('serviceId')
    const locationId = searchParams.get('locationId')
    const employeeId = searchParams.get('employeeId')

    if (businessId || serviceId || locationId || employeeId) {
      setBookingContext({
        businessId: businessId || undefined,
        serviceId: serviceId || undefined,
        locationId: locationId || undefined,
        employeeId: employeeId || undefined,
      })

      // Clear params from URL after extracting
      setSearchParams({})
    }
  }, [searchParams, setSearchParams])

  // Auto-select business if there's only one or use activeBusiness
  React.useEffect(() => {
    if (activeRole === 'admin' && businesses.length > 0 && !isCreatingNewBusiness) {
      if (!selectedBusinessId) {
        // Prefer activeBusiness, then first in list
        const initialId = activeBusiness?.id || businesses[0].id
        setSelectedBusinessId(initialId)
      }
    }
  }, [activeRole, businesses, activeBusiness, selectedBusinessId, isCreatingNewBusiness])

  // Si no hay usuario autenticado, no renderizar nada (el App.tsx maneja esto)
  if (!user) {
    return null
  }

  const handleLogout = async () => {
    try {
      await signOut()
      if (onLogout) onLogout()
    } catch (err) {
      toast.error('No se pudo cerrar sesión. Intenta de nuevo.')
    }
  }

  const handleBusinessCreated = async () => {
    try {
      await refetchBusinesses()
      setIsCreatingNewBusiness(false)
    } catch (err) {
      toast.error('Error al actualizar negocios después de crear uno.')
    }
  }

  const handleBusinessUpdate = async () => {
    try {
      await refetchBusinesses()
    } catch (err) {
      toast.error('Error al refrescar negocios después de actualizar.')
    }
  }

  const handleCreateNewBusiness = () => {
    // Clear selected business to show onboarding
    setIsCreatingNewBusiness(true) // Activar modo "creando nuevo"
    setSelectedBusinessId(undefined)
  }

  // Check if employee needs onboarding: NO businesses linked AND not loading
  // NOTE: Changed logic - show dashboard always, handle onboarding inside MyEmployments
  const needsEmployeeOnboarding = false // Disabled - employees always see dashboard

  // Get selected business for AdminDashboard
  const selectedBusiness = businesses.find(b => b.id === selectedBusinessId)

  // Admin needs onboarding if: no businesses OR no business selected (creating new)
  const needsAdminOnboarding =
    activeRole === 'admin' && (businesses.length === 0 || !selectedBusiness) && !isLoadingBusinesses

  const renderCurrentView = () => {
    // Show onboarding screens if needed (within layout)
    if (needsEmployeeOnboarding) {
      return (
        <EmployeeOnboarding
          user={user}
          onRequestCreated={() => {
            // Refresh roles after request created
            window.location.reload()
          }}
        />
      )
    }

    if (needsAdminOnboarding) {
      return (
        <AdminOnboarding
          user={user}
          onBusinessCreated={handleBusinessCreated}
          currentRole={activeRole}
          availableRoles={roles.map(r => r.role)}
          onRoleChange={switchRole}
          onLogout={handleLogout}
          businesses={businesses}
          onSelectBusiness={setSelectedBusinessId}
          onNavigateToAdmin={() => {
            // When user clicks non-onboarding pages, show AdminDashboard instead
            // The logic will fallthrough to show AdminDashboard if a business is selected
            if (businesses.length > 0 && !selectedBusinessId) {
              setSelectedBusinessId(businesses[0].id)
            }
          }}
        />
      )
    }

    // Admin with businesses: Show AdminDashboard
    if (activeRole === 'admin' && selectedBusiness) {
      return (
        <AdminDashboard
          business={selectedBusiness}
          businesses={businesses}
          onSelectBusiness={setSelectedBusinessId}
          onCreateNew={handleCreateNewBusiness}
          onUpdate={handleBusinessUpdate}
          onLogout={handleLogout}
          currentRole={activeRole}
          availableRoles={roles.map(r => r.role)}
          onRoleChange={switchRole}
          user={user}
        />
      )
    }

    // Employee view
    if (activeRole === 'employee') {
      return (
        <EmployeeDashboard
          currentRole={activeRole}
          availableRoles={roles.map(r => r.role)}
          onRoleChange={switchRole}
          onLogout={handleLogout}
          user={user}
          businessId={employeeBusinesses[0]?.id}
        />
      )
    }

    // Client view (default)
    return (
      <ClientDashboard
        currentRole={activeRole}
        availableRoles={roles.map(r => r.role)}
        onRoleChange={switchRole}
        onLogout={handleLogout}
        user={user}
        initialBookingContext={bookingContext}
      />
    )
  }

  // All roles now use UnifiedLayout via their respective dashboards
  return <Suspense fallback={<SuspenseFallback />}>{renderCurrentView()}</Suspense>
}

export default MainApp