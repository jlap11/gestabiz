 
import React from 'react'
import { useAuthSimple } from '@/hooks/useAuthSimple'
import { useSupabaseData } from '@/hooks/useSupabaseData'
import { useUserRoles } from '@/hooks/useUserRoles'
import { useAdminBusinesses } from '@/hooks/useAdminBusinesses'
import ProfilePage from '@/components/settings/ProfilePage'
import Dashboard from '@/components/dashboard/Dashboard'
import AdminLayout from '@/components/layout/AdminLayout'
import EmployeeLayout from '@/components/layout/EmployeeLayout'
import ClientLayout from '@/components/layout/ClientLayout'
import { RoleSelector } from '@/components/ui/RoleSelector'
import { EmployeeOnboarding } from '@/components/employee/EmployeeOnboarding'
import { AdminOnboarding } from '@/components/admin/AdminOnboarding'
import { AdminDashboard } from '@/components/admin/AdminDashboard'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface MainAppProps {
  onLogout: () => void
}

function MainApp({ onLogout }: Readonly<MainAppProps>) {
  const { user, signOut } = useAuthSimple()
  const [currentView, setCurrentView] = React.useState('dashboard')
  const [selectedBusinessId, setSelectedBusinessId] = React.useState<string | undefined>()
  const [isCreatingNewBusiness, setIsCreatingNewBusiness] = React.useState(false)
  
  // Manage user roles and active role switching
  const { roles, activeRole, activeBusiness, switchRole } = useUserRoles(user)
  
  // Fetch admin businesses if user is admin
  const { businesses, isLoading: isLoadingBusinesses, refetch: refetchBusinesses } = useAdminBusinesses(
    activeRole === 'admin' ? user?.id : undefined
  )
  
  // Initialize Supabase data loading
  const supabaseData = useSupabaseData({ user, autoFetch: true })
  
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

  const handleNavigate = (view: string) => {
    setCurrentView(view)
  }
  
  const handleRoleChange = async (role: import('@/types').UserRole, businessId?: string) => {
    await switchRole(role, businessId)
    setCurrentView('dashboard')
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

  // Role Selector Component (extracted to pass as prop)
  const roleSelectorComponent = (
    <RoleSelector
      roles={roles}
      activeRole={activeRole}
      activeBusiness={activeBusiness}
      onRoleChange={handleRoleChange}
    />
  )

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
        />
      )
    }

    // Normal views for employee and client
    switch (currentView) {
      case 'profile':
        return <ProfilePage user={user} onClose={() => setCurrentView('dashboard')} />
      case 'dashboard':
      default:
        return <Dashboard user={user} {...supabaseData} roleSelector={roleSelectorComponent} />
    }
  }

  // Seleccionar el layout según el rol activo del hook useUserRoles
  const getLayoutComponent = () => {
    if (activeRole === 'admin') return AdminLayout
    if (activeRole === 'employee') return EmployeeLayout
    return ClientLayout
  }

  const LayoutComponent = getLayoutComponent()

  // Action button varies by role
  const getActionButton = () => {
    if (activeRole === 'client') {
      // For client: Book New Appointment button
      // TODO: This should trigger appointment creation flow
      return (
        <Button 
          onClick={() => {
            // TODO: Implement appointment creation
            // console.log('Book appointment clicked')
          }}
          className="bg-[#FF8C00] hover:bg-[#FF7A00] text-white font-semibold px-6"
        >
          <Plus className="h-5 w-5 mr-2" />
          Book New Appointment
        </Button>
      )
    }
    
    // For admin/employee: Will be customized later
    // TODO: Add specific action buttons for admin and employee roles
    return null
  }

  const actionButton = getActionButton()

  return (
    <LayoutComponent
      user={user}
      currentView={currentView}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      roleSelector={roleSelectorComponent}
      actionButton={actionButton}
      headerTitle={
        activeRole === 'admin' 
          ? 'Admin Dashboard' 
          : activeRole === 'employee' 
          ? 'Employee Dashboard' 
          : undefined // Client uses default "Welcome back, {name}!"
      }
      headerSubtitle={
        activeRole === 'admin' 
          ? 'Manage your business and team' 
          : activeRole === 'employee' 
          ? 'View and manage appointments' 
          : "Here's a look at your upcoming appointments"
      }
    >
      {renderCurrentView()}
    </LayoutComponent>
  )
}

export default MainApp
