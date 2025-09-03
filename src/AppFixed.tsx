import React from 'react'
import { Toaster } from '@/components/ui/sonner'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useAuthFixed } from './useAuthFixed'

// Import contexts directly
import { ThemeProvider } from '@/contexts/ThemeContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { AppStateProvider } from '@/contexts/AppStateContext'

function AppLoader({ message = "Cargando aplicación..." }: { readonly message?: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

function SimpleLoginForm() {
  const [email, setEmail] = React.useState('emily.yaneth2807@gmail.com')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const { supabase } = await import('@/lib/supabase')
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        alert('Error: ' + error.message)
      }
    } catch (err) {
      alert('Error: ' + String(err))
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Login</h1>
          <p className="text-muted-foreground mt-2">AppointSync Pro</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

function SimpleDashboard({ user }: { readonly user: { id: string; email: string; role: string } }) {
  const { logout } = useAuthFixed()
  
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Bienvenido, {user.email}</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
          >
            Cerrar Sesión
          </button>
        </header>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-2">Usuario</h3>
            <p>ID: {user.id.substring(0, 8)}...</p>
            <p>Email: {user.email}</p>
            <p>Rol: {user.role}</p>
          </div>
          
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-2">Estado</h3>
            <p className="text-green-600">✅ Conectado</p>
            <p className="text-green-600">✅ Autenticado</p>
          </div>
          
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-2">Acciones</h3>
            <button className="block w-full text-left px-3 py-2 rounded hover:bg-muted mb-2">
              Ver Citas
            </button>
            <button className="block w-full text-left px-3 py-2 rounded hover:bg-muted">
              Configuración
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AppContentFixed() {
  const { user, loading, error } = useAuthFixed()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Verificando autenticación...</p>
          <button 
            onClick={() => {
              // Clear all local storage and cookies
              localStorage.clear()
              sessionStorage.clear()
              document.cookie.split(";").forEach(c => {
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
              })
              window.location.reload()
            }}
            className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
          >
            Limpiar sesión y recargar
          </button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold text-destructive">Error</h1>
          <p className="text-muted-foreground">{error}</p>
          <div className="space-x-2">
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Reintentar
            </button>
            <button 
              onClick={() => {
                localStorage.clear()
                sessionStorage.clear()
                window.location.reload()
              }}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
            >
              Limpiar datos
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <SimpleLoginForm />
  }

  return <SimpleDashboard user={user} />
}

export default function AppFixed() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <AppStateProvider>
            <AppContentFixed />
            <Toaster />
          </AppStateProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
