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
          // COMMENTED OUT: This was too aggressive - clearing localStorage on ANY fetch error
          // including rate limits, network timeouts, etc. was causing session loss on F5
          // // Limpiar localStorage si hay error de sesión
          // if (error.message.includes('Failed to fetch') || error.message.includes('refresh')) {
          //   console.log('🧹 Limpiando localStorage debido a sesión corrupta...')
          //   localStorage.clear()
          // }
          setState(prev => ({ ...prev, loading: false, error: null, session: null, user: null }))
          return
        }

        if (session?.user) {
          console.log('✅ Session found, user:', session.user.email)
          
          // Fetch profile in the background WITHOUT waiting (non-blocking)
          supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
            .then(({ data }) => {
              if (data) {
                console.log('📸 Profile data from DB:', data)
              }
            })
            .catch((err) => {
              console.log('⚠️ Profile fetch exception:', err)
            })
          
          // Crear usuario simplificado con soporte multi-rol
          const user: User = {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata?.full_name || session.user.email!.split('@')[0],
            username: session.user.email!.split('@')[0],
            roles: [{
              id: 'simple-client-role',
              user_id: session.user.id,
              role: 'client',
              business_id: null,
              is_active: true,
              created_at: new Date().toISOString()
            }],
            activeRole: 'client',
            role: 'client', // Legacy support
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
            avatar_url: session.user.user_metadata?.avatar_url || undefined,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_active: true
          }
          
          console.log('👤 Created user object with avatar:', user.avatar_url)
          
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
        // COMMENTED OUT: This was destroying sessions on ANY error including rate limits
        // // Limpiar localStorage en caso de error de conexión
        // console.log('🧹 Limpiando localStorage debido a error de conexión...')
        // localStorage.clear()
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: error instanceof Error ? error.message : 'Unknown error',
          // DON'T clear session/user - let them persist through temporary errors
          // session: null,
          // user: null
        }))
      }
    }

    getInitialSession()

    // Listen for auth changes
    console.log('👂 Setting up auth state listener...')
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Auth state changed:', event, session?.user?.email)
        
        if (!session) {
          console.log('👋 User signed out in listener')
          setState(prev => ({
            ...prev,
            user: null,
            session: null,
            loading: false,
            error: null
          }))
          return
        }
        
        // Handle SIGNED_IN event - create user and update state immediately
        if (event === 'SIGNED_IN') {
          console.log('✅ User signed in - updating state immediately')
          
          // Don't fetch profile - it will be fetched in background
          // This ensures immediate response and prevents hanging
          
          // Fetch profile in background (non-blocking)
          supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
            .then(({ data }) => {
              if (data) {
                console.log('📸 Profile data fetched:', data)
              }
            })
            .catch((err) => {
              console.log('⚠️ Profile fetch exception:', err)
            })
          
          // Create user object immediately from session metadata
          const user: User = {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata?.full_name || session.user.email!.split('@')[0],
            username: session.user.email!.split('@')[0],
            roles: [{
              id: 'simple-client-role',
              user_id: session.user.id,
              role: 'client',
              business_id: null,
              is_active: true,
              created_at: new Date().toISOString()
            }],
            activeRole: 'client',
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
            avatar_url: session.user.user_metadata?.avatar_url || undefined,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_active: true
          }
          
          console.log('� User created from SIGNED_IN event:', user.email)
          setState(prev => ({
            ...prev,
            user,
            session,
            loading: false,
            error: null
          }))
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token refreshed, keeping current user state')
          setState(prev => ({
            ...prev,
            session,
            loading: false
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
