// App simplificado para debuggear el problema de carga infinita
import React, { useState, useEffect } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { APP_CONFIG } from '@/constants'
import { supabase } from '@/lib/supabase'
import '@/debug-config'

// Import contexts directly
import { ThemeProvider } from '@/contexts/ThemeContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { AppStateProvider } from '@/contexts/AppStateContext'

// Simple loading component
function AppLoader({ message = "Cargando aplicación..." }: { message?: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <h2 className="text-lg font-semibold text-foreground">{APP_CONFIG.NAME}</h2>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

// Minimal login screen
function SimpleLoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      console.log('🔐 Attempting login with:', email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.log('❌ Login error:', error.message)
        setError(error.message)
      } else {
        console.log('✅ Login successful:', data.user?.email)
      }
    } catch (err) {
      console.log('💥 Login exception:', err)
      setError('Error inesperado al iniciar sesión')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-md p-6 bg-card rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6">{APP_CONFIG.NAME}</h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-md"
              placeholder="tu@email.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-md"
              placeholder="••••••••"
              required
            />
          </div>
          
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full p-3 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}

// Simple dashboard
function SimpleDashboard({ user }: { user: any }) {
  const handleLogout = async () => {
    console.log('👋 Logging out...')
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b px-4 py-2 flex justify-between items-center">
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">Hola, {user.email}</span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
      
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Bienvenido</h2>
        <p>Esta es una versión simplificada para debuggear el problema de carga.</p>
        <pre className="mt-4 p-4 bg-gray-100 rounded-md text-sm">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>
    </div>
  )
}

function AppContentSimple() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('🚀 Initializing simple auth...')
    
    let isMounted = true

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('📊 Initial session:', { session: session?.user?.email, error })
      
      if (!isMounted) return
      
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      
      setUser(session?.user || null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔔 Auth changed:', event, session?.user?.email)
        
        if (!isMounted) return
        
        setUser(session?.user || null)
        setLoading(false)
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return <AppLoader message="Verificando autenticación..." />
  }

  if (error) {
    return <AppLoader message={`Error: ${error}`} />
  }

  if (!user) {
    return <SimpleLoginScreen />
  }

  return <SimpleDashboard user={user} />
}

function AppSimple() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <AppStateProvider>
            <AppContentSimple />
            <Toaster richColors closeButton />
          </AppStateProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default AppSimple
