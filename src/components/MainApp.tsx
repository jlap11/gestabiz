import { useState } from 'react'
import { User } from '@/types'
import { useLanguage } from '@/contexts'
import { useAuth } from '@/hooks/useAuth'
import { useSupabaseData } from '@/hooks/useSupabaseData'
import { Button } from '@/components/ui/button'

// Import screens directly instead of lazy loading
import Dashboard from '@/components/dashboard/Dashboard'

interface MainAppProps {
  user: User
  onLogout: () => void
}

function AppLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    </div>
  )
}

function MainApp({ user }: MainAppProps) {
  const { t } = useLanguage()
  const { signOut } = useAuth()
  const [currentView, setCurrentView] = useState('dashboard')

  // Initialize Supabase data loading
  const supabaseData = useSupabaseData({ user, autoFetch: true })

  const handleLogout = async () => {
    await signOut()
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard user={user} {...supabaseData} />
      default:
        return <Dashboard user={user} {...supabaseData} />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Temporary navigation */}
      <div className="bg-card border-b px-4 py-2 flex justify-between items-center">
        <h1 className="text-lg font-semibold">{t('nav.dashboard')}</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {user.name} ({user.role})
          </span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            {t('auth.logout')}
          </Button>
        </div>
      </div>

      <div className="p-4">
        {renderCurrentView()}
      </div>
    </div>
  )
}

export default MainApp
