import React, { Suspense, lazy, useState } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { APP_CONFIG } from '@/constants'
import { useAuthSimple } from '@/hooks/useAuthSimple'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Import contexts directly instead of lazy loading them
import { ThemeProvider } from '@/contexts/ThemeContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { AppStateProvider } from '@/contexts/AppStateContext'
import { NotificationProvider } from '@/contexts/NotificationContext'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

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

function AppContent() {
  const { user, loading, session, signOut } = useAuthSimple()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showLanding, setShowLanding] = useState(!user && !session) // Solo mostrar landing si NO hay sesión
  const [forceShowLogin, setForceShowLogin] = useState(false)

  // Si estamos cargando la autenticación, mostrar loader
  if (loading) {
    return <AppLoader />
  }

  // Si está cerrando sesión, mostrar animación
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
          <p className="text-muted-foreground">Redirigiendo a la página principal...</p>
        </div>
      </div>
    )
  }

  // Mostrar landing page si no hay sesión activa
  if (showLanding && !user && !session) {
    const LandingPage = lazy(() => import('@/components/landing/LandingPage').then(m => ({ default: m.LandingPage })))
    return (
      <Suspense fallback={<AppLoader />}>
        <LandingPage 
          onNavigateToAuth={() => {
            setShowLanding(false)
          }} 
        />
      </Suspense>
    )
  }

  // Si no hay usuario autenticado (o se forzó el login), mostrar AuthScreen
  if ((!user || !session) || forceShowLogin) {
    return <AuthScreen />
  }

  // Usuario autenticado, mostrar app principal
  return (
    <MainApp 
      onLogout={async () => {
        setIsLoggingOut(true)
        await signOut()
        setTimeout(() => {
          setIsLoggingOut(false)
          setShowLanding(true)
          setForceShowLogin(false)
        }, 1500)
      }}
    />
  )
}

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<AppLoader />}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <LanguageProvider>
              <AppStateProvider>
                {/* AppWithNotifications maneja el provider de notificaciones */}
                <AppWithNotifications />
              </AppStateProvider>
            </LanguageProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </Suspense>
    </ErrorBoundary>
  )
}

// Componente intermedio para obtener userId ANTES de montar NotificationProvider
function AppWithNotifications() {
  const { user, loading } = useAuthSimple()
  
  console.log('[AppWithNotifications] User state:', { userId: user?.id, loading })
  
  // Esperar a que se resuelva la autenticación
  if (loading) {
    return <AppLoader />
  }
  
  return (
    <NotificationProvider userId={user?.id || null}>
      <Suspense fallback={<AppLoader />}>
        <AppContent />
      </Suspense>
      <Toaster richColors closeButton />
    </NotificationProvider>
  )
}

export default App
