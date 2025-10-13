import React from 'react'
import { useAuthSimple } from '@/hooks/useAuthSimple'
import { useUserRoles } from '@/hooks/useUserRoles'
import { useAdminBusinesses } from '@/hooks/useAdminBusinesses'
import { EmployeeOnboarding } from '@/components/employee/EmployeeOnboarding'
import { AdminOnboarding } from '@/components/admin/AdminOnboarding'
import { AdminDashboard } from '@/components/admin/AdminDashboard'
import { EmployeeDashboard } from '@/components/employee/EmployeeDashboard'
import { ClientDashboard } from '@/components/client/ClientDashboard'

interface MainAppProps {
  onLogout: () => void
}

function MainApp({ onLogout }: Readonly<MainAppProps>) {
  const { user, signOut } = useAuthSimple()
  const [selectedBusinessId, setSelectedBusinessId] = React.useState<string | undefined>()
  const [isCreatingNewBusiness, setIsCreatingNewBusiness] = React.useState(false)
  
  // Manage user roles and active role switching
  const { roles, activeRole, activeBusiness, switchRole } = useUserRoles(user)
  
  // Fetch admin businesses if user is admin
  const { businesses, isLoading: isLoadingBusinesses, refetch: refetchBusinesses } = useAdminBusinesses(
    activeRole === 'admin' ? user?.id : undefined
  )
  
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
    await signOut()
    if (onLogout) onLogout()
  }

  const handleBusinessCreated = async () => {
    // Refresh businesses list after creation
    await refetchBusinesses()
    // Reset creation mode to allow auto-selection of the new business
    setIsCreatingNewBusiness(false)
    // Auto-select the new business (will be first in list after refetch)
  }

  const handleBusinessUpdate = async () => {
    // Refresh businesses list after update
    await refetchBusinesses()
  }

  const handleCreateNewBusiness = () => {
    // Clear selected business to show onboarding
    setIsCreatingNewBusiness(true) // Activar modo "creando nuevo"
    setSelectedBusinessId(undefined)
  }

  // Check if user needs onboarding (role selected but no business assigned)
  const needsEmployeeOnboarding = activeRole === 'employee' && !activeBusiness
  
  // Get selected business for AdminDashboard
  const selectedBusiness = businesses.find((b) => b.id === selectedBusinessId)
  
  // Admin needs onboarding if: no businesses OR no business selected (creating new)
  const needsAdminOnboarding = activeRole === 'admin' && 
                                (businesses.length === 0 || !selectedBusiness) && 
                                !isLoadingBusinesses

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
          currentRole={activeRole}
          availableRoles={roles.map(r => r.role)}
          onRoleChange={switchRole}
          onLogout={handleLogout}
        />
      )
    }

    if (needsAdminOnboarding) {
      return (
        <AdminOnboarding
          user={user}
          onBusinessCreated={handleBusinessCreated}
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
      />
    )
  }

  // All roles now use UnifiedLayout via their respective dashboards
  return <>{renderCurrentView()}</>
}

export default MainApp
