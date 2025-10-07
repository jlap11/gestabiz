 
import React from 'react'
import { useAuthSimple } from '@/hooks/useAuthSimple'
import { useSupabaseData } from '@/hooks/useSupabaseData'
import ProfilePage from '@/components/settings/ProfilePage'
import Dashboard from '@/components/dashboard/Dashboard'
import AdminLayout from '@/components/layout/AdminLayout'
import EmployeeLayout from '@/components/layout/EmployeeLayout'
import ClientLayout from '@/components/layout/ClientLayout'

interface MainAppProps {
  onLogout: () => void
}

function MainApp({ onLogout }: Readonly<MainAppProps>) {
  const { user, signOut } = useAuthSimple()
  const [currentView, setCurrentView] = React.useState('dashboard')
  
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

  const renderCurrentView = () => {
    switch (currentView) {
      case 'profile':
        return <ProfilePage user={user} onClose={() => setCurrentView('dashboard')} />
      case 'dashboard':
      default:
        return <Dashboard user={user} {...supabaseData} />
    }
  }

  // Seleccionar el layout según el rol del usuario
  const getLayoutComponent = () => {
    if (user.role === 'admin') return AdminLayout
    if (user.role === 'employee') return EmployeeLayout
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
      {renderCurrentView()}
    </LayoutComponent>
  )
}

export default MainApp
