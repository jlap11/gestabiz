import React, { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { APP_CONFIG } from '@/constants'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Import contexts directly instead of lazy loading them
import { ThemeProvider } from '@/contexts/ThemeContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { AppStateProvider } from '@/contexts/AppStateContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'

// Google Analytics 4
import { initializeGA4 } from '@/lib/ga4'
import { hasAnalyticsConsent } from '@/hooks/useAnalytics'
import { CookieConsent } from '@/components/CookieConsent'

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
const LandingPage = lazy(() => import('@/components/landing/LandingPage').then(m => ({ default: m.LandingPage })))
const AuthScreen = lazy(() => import('@/components/auth/AuthScreen'))
const MainApp = lazy(() => import('@/components/MainApp'))
const PublicBusinessProfile = lazy(() => import('@/pages/PublicBusinessProfile'))

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

// Protected Route wrapper para rutas autenticadas
function ProtectedRoute({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <AppLoader />
  }

  if (!user) {
    // Redirigir a login guardando la URL de origen
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }

  return <>{children}</>
}

// Wrapper para MainApp con NotificationProvider
function AuthenticatedApp() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  
  if (!user) {
    return <Navigate to="/login" replace />
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <NotificationProvider userId={user.id}>
      <MainApp onLogout={handleLogout} />
    </NotificationProvider>
  )
}

function AppRoutes() {
  const navigate = useNavigate();
  
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/" element={<LandingPage onNavigateToAuth={() => navigate('/login')} />} />
      <Route path="/login" element={<AuthScreen onLoginSuccess={() => navigate('/app', { replace: true })} />} />
      <Route path="/register" element={<AuthScreen onLoginSuccess={() => navigate('/app', { replace: true })} />} />
      
      {/* Perfil público de negocio - accesible sin autenticación */}
      <Route path="/negocio/:slug" element={<PublicBusinessProfile />} />
      
      {/* Rutas protegidas - requieren autenticación */}
      <Route
        path="/app/*"
        element={
          <ProtectedRoute>
            <AuthenticatedApp />
          </ProtectedRoute>
        }
      />
      
      {/* Redirigir rutas no encontradas */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  // Inicializar Google Analytics 4 si hay consentimiento
  useEffect(() => {
    if (hasAnalyticsConsent()) {
      initializeGA4()
    }
  }, [])

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<AppLoader />}>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <LanguageProvider>
                <AppStateProvider>
                  <AuthProvider>
                    <AppRoutes />
                    <CookieConsent />
                    {/* Toaster global para todas las rutas, incluidas públicas */}
                    <Toaster richColors closeButton />
                  </AuthProvider>
                </AppStateProvider>
              </LanguageProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App