 
import React from 'react'
import { useLanguage } from '@/contexts'
import { useAuthSimple } from '@/hooks/useAuthSimple'
import { useSupabaseData } from '@/hooks/useSupabaseData'
import { Button } from '@/components/ui/button'
import { generateHandle } from '@/lib/utils'
import ProfilePage from '@/components/settings/ProfilePage'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

// Import screens directly instead of lazy loading
import Dashboard from '@/components/dashboard/Dashboard'

interface MainAppProps {
  onLogout: () => void
}

function MainApp({ onLogout }: Readonly<MainAppProps>) {
  const { t } = useLanguage()
  const { user, signOut } = useAuthSimple()
  const [showProfile, setShowProfile] = React.useState(false)
  
  // Calcular valores dependientes
  const handleText = React.useMemo(() => {
    if (!user) return ''
    return user.username ? `@${user.username}` : generateHandle(user.name)
  }, [user])
  
  const initials = React.useMemo(() => 
    user ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : '', 
    [user]
  )
  
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

  const renderCurrentView = () => (
    showProfile 
      ? <ProfilePage user={user} onClose={() => setShowProfile(false)} /> 
      : <Dashboard user={user} {...supabaseData} />
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Temporary navigation */}
      <div className="bg-card border-b px-4 py-2 flex justify-between items-center">
        <h1 className="text-lg font-semibold">{t('nav.dashboard')}</h1>
        <div className="flex items-center gap-4">
          <button
            className="flex items-center gap-2 text-sm text-muted-foreground hover:underline"
            title={`${user.name}`}
            onClick={() => setShowProfile(true)}
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={user.avatar_url || ''} alt={user.name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <span>{handleText}</span>
          </button>
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
