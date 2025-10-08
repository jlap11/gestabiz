 
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
    await switchRole(role, businessId)
    // Optionally refresh data after role change
    setCurrentView('dashboard')
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'profile':
        return <ProfilePage user={user} onClose={() => setCurrentView('dashboard')} />
      case 'dashboard':
      default:
        return <Dashboard user={user} {...supabaseData} />
    }
  }

  // Seleccionar el layout según el rol activo del usuario
  const getLayoutComponent = () => {
    if (user.activeRole === 'admin') return AdminLayout
    if (user.activeRole === 'employee') return EmployeeLayout
    return ClientLayout
  }

  const LayoutComponent = getLayoutComponent()

  return (
    <LayoutComponent
      user={user}
      currentView={currentView}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    >
      {/* Role Selector - show when user has multiple roles */}
      {roles.length > 1 && (
        <div className="mb-4">
          <RoleSelector
            roles={roles}
            activeRole={activeRole}
            activeBusiness={activeBusiness}
            onRoleChange={handleRoleChange}
          />
        </div>
      )}
      
      {renderCurrentView()}
    </LayoutComponent>
  )
}

export default MainApp
