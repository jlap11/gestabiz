import React, { useEffect, Suspense, lazy } from 'react'
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
const DEMO_USER = {
  id: 'demo-user',
  email: 'demo@example.com',
  name: 'Usuario Demo',
  role: 'client' as const,
  business_id: undefined,
  location_id: undefined,
  phone: undefined,
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

  return (
    <ErrorBoundary>
      <Suspense fallback={<AppLoader />}>
        <ThemeProvider>
          <LanguageProvider>
            <AppStateProvider>
              <Suspense fallback={<AppLoader />}>
                {!isAuthenticated ? (
                  <AuthScreen onLogin={() => setIsAuthenticated(true)} />
                ) : (
                  <MainApp user={DEMO_USER} onLogout={() => setIsAuthenticated(false)} />
                )}
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
