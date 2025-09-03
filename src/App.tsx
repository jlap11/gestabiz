import React, { Suspense, lazy, useEffect, useState } from 'react'
import type { User } from '@/types'
import { Toaster } from '@/components/ui/sonner'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { APP_CONFIG } from '@/constants'

// Only use contexts when they're needed
const ThemeProvider = lazy(() => import('@/contexts/ThemeContext').then(m => ({ default: m.ThemeProvider })))
const LanguageProvider = lazy(() => import('@/contexts/LanguageContext').then(m => ({ default: m.LanguageProvider })))
const AppStateProvider = lazy(() => import('@/contexts/AppStateContext').then(m => ({ default: m.AppStateProvider })))

// Lazy load main application components
const AuthScreen = lazy(() => import('@/components/auth/AuthScreen'))
const MainApp = lazy(() => import('@/components/MainApp'))

// Loading component
function AppLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <h2 className="text-lg font-semibold text-foreground">{APP_CONFIG.NAME}</h2>
        <p className="text-muted-foreground">Cargando aplicación...</p>
      </div>
    </div>
  )
}

// Simple demo user for now
const DEMO_USER: User = {
  id: 'demo-user',
  email: 'demo@example.com',
  name: 'Usuario Demo',
  username: 'usuario.demo',
  role: 'client' as const,
  business_id: undefined,
  location_id: undefined,
  phone: '+52 55 1234 5678',
  language: 'es' as const,
  notification_preferences: {
    email: true,
    push: true,
    browser: true,
    whatsapp: false,
    reminder_24h: true,
    reminder_1h: true,
    reminder_15m: false,
    daily_digest: false,
    weekly_report: false
  },
  permissions: [],
  timezone: 'America/Mexico_City',
  avatar_url: undefined,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_active: true
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)
  const [currentUser, setCurrentUser] = React.useState<User>(DEMO_USER)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Rehidrata estado desde localStorage al iniciar
  useEffect(() => {
    try {
      const rawUser = window.localStorage.getItem('current-user')
      if (rawUser) {
        const parsed = JSON.parse(rawUser) as User
        setCurrentUser(parsed)
      }
      const rawAuth = window.localStorage.getItem('auth')
      if (rawAuth === '1') {
        setIsAuthenticated(true)
      }
    } catch {
      // noop
    }
  }, [])

  // Persiste usuario al cambiar
  useEffect(() => {
    try {
      window.localStorage.setItem('current-user', JSON.stringify(currentUser))
    } catch {
      // noop
    }
  }, [currentUser])

  // Persiste flag de autenticación
  useEffect(() => {
    try {
      window.localStorage.setItem('auth', isAuthenticated ? '1' : '0')
    } catch {
      // noop
    }
  }, [isAuthenticated])

  const renderCurrentView = () => {
    if (isLoggingOut) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background animate-fadeOut">
          <div className="flex flex-col items-center gap-4">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-bounce">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <h2 className="text-2xl font-bold text-primary">¡Sesión cerrada exitosamente!</h2>
            <p className="text-muted-foreground">Redirigiendo al inicio de sesión...</p>
          </div>
        </div>
      )
    }

    if (!isAuthenticated) {
      return <AuthScreen onLogin={() => setIsAuthenticated(true)} />
    }

    return (
      <MainApp 
        user={currentUser} 
        onLogout={() => {
          setIsLoggingOut(true)
          setTimeout(() => {
            setIsAuthenticated(false)
            setCurrentUser(DEMO_USER)
            setIsLoggingOut(false)
            try {
              window.localStorage.removeItem('auth')
              window.localStorage.removeItem('current-user')
            } catch { /* empty */ }
          }, 1500)
        }}
        onUserUpdate={(u) => {
          setCurrentUser(u)
          try {
            window.localStorage.setItem('current-user', JSON.stringify(u))
          } catch { /* empty */ }
        }}
      />
    )
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<AppLoader />}>
        <ThemeProvider>
          <LanguageProvider>
            <AppStateProvider>
              <Suspense fallback={<AppLoader />}>
                {renderCurrentView()}
              </Suspense>
              <Toaster richColors closeButton />
            </AppStateProvider>
          </LanguageProvider>
        </ThemeProvider>
      </Suspense>
    </ErrorBoundary>
  )
}

export default App
