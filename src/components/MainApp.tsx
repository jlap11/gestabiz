 
import React from 'react'
import { useAuthSimple } from '@/hooks/useAuthSimple'
import { useSupabaseData } from '@/hooks/useSupabaseData'
import { useUserRoles } from '@/hooks/useUserRoles'
import ProfilePage from '@/components/settings/ProfilePage'
import Dashboard from '@/components/dashboard/Dashboard'
import AdminLayout from '@/components/layout/AdminLayout'
import EmployeeLayout from '@/components/layout/EmployeeLayout'
import ClientLayout from '@/components/layout/ClientLayout'
import { RoleSelector } from '@/components/ui/RoleSelector'
import { EmployeeOnboarding } from '@/components/employee/EmployeeOnboarding'
import { AdminOnboarding } from '@/components/admin/AdminOnboarding'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface MainAppProps {
  onLogout: () => void
}

function MainApp({ onLogout }: Readonly<MainAppProps>) {
  const { user, signOut } = useAuthSimple()
  const [currentView, setCurrentView] = React.useState('dashboard')
  
  // Manage user roles and active role switching
  const { roles, activeRole, activeBusiness, switchRole } = useUserRoles(user)
  
  // Initialize Supabase data loading
  const supabaseData = useSupabaseData({ user, autoFetch: true })
  
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
    console.log('[MainApp] handleRoleChange called with:', { role, businessId })
    console.log('[MainApp] Current activeRole:', activeRole)
    console.log('[MainApp] Available roles:', roles)
    await switchRole(role, businessId)
    // Optionally refresh data after role change
    setCurrentView('dashboard')
  }

  // Check if user needs onboarding (role selected but no business assigned)
  const needsEmployeeOnboarding = activeRole === 'employee' && !activeBusiness
  const needsAdminOnboarding = activeRole === 'admin' && !activeBusiness

  console.log('[MainApp] Onboarding check:', {
    activeRole,
    activeBusiness,
    needsEmployeeOnboarding,
    needsAdminOnboarding,
  })

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
          onBusinessCreated={() => {
            // Refresh page to reload with new business
            window.location.reload()
          }}
        />
      )
    }

    // Normal views
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
            console.log('Book appointment clicked')
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
