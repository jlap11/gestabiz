// Hook simplificado de autenticación para debuggear
import { useState, useEffect } from 'react'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { User } from '@/types'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
}

export function useAuthSimple() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null
  })

  console.log('🔄 useAuthSimple state:', state)

  useEffect(() => {
    console.log('🚀 useAuthSimple - Getting initial session...')
    
    async function getInitialSession() {
      try {
        console.log('📡 Calling supabase.auth.getSession()...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        console.log('📊 Session result:', { session, error })
        
        if (error) {
          console.log('❌ Session error:', error.message)
          // Limpiar localStorage si hay error de sesión
          if (error.message.includes('Failed to fetch') || error.message.includes('refresh')) {
            console.log('🧹 Limpiando localStorage debido a sesión corrupta...')
            localStorage.clear()
          }
          setState(prev => ({ ...prev, loading: false, error: null, session: null, user: null }))
          return
        }

        if (session?.user) {
          console.log('✅ Session found, user:', session.user.email)
          
          // Crear usuario simplificado
          const user: User = {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.email!.split('@')[0],
            username: session.user.email!.split('@')[0],
            role: 'client',
            business_id: undefined,
            location_id: undefined,
            phone: '',
            language: 'es',
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
          
          console.log('👤 Created user object:', user)
          setState(prev => ({
            ...prev,
            user,
            session,
            loading: false,
            error: null
          }))
        } else {
          console.log('❌ No session found')
          setState(prev => ({ ...prev, loading: false }))
        }
      } catch (error) {
        console.log('💥 Error in getInitialSession:', error)
        // Limpiar localStorage en caso de error de conexión
        console.log('🧹 Limpiando localStorage debido a error de conexión...')
        localStorage.clear()
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: null,
          session: null,
          user: null
        }))
      }
    }

    getInitialSession()

    // Listen for auth changes
    console.log('👂 Setting up auth state listener...')
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Auth state changed:', event, session?.user?.email)
        
        if (session?.user) {
          const user: User = {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.email!.split('@')[0],
            username: session.user.email!.split('@')[0],
            role: 'client',
            business_id: undefined,
            location_id: undefined,
            phone: '',
            language: 'es',
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
          
          setState(prev => ({
            ...prev,
            user,
            session,
            loading: false,
            error: null
          }))
        } else {
          setState(prev => ({
            ...prev,
            user: null,
            session: null,
            loading: false,
            error: null
          }))
        }
      }
    )

    return () => {
      console.log('🧹 Cleaning up auth listener...')
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    console.log('👋 Signing out...')
    await supabase.auth.signOut()
  }

  return {
    ...state,
    signOut
  }
}
