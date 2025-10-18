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

// Helper para logs de debug (solo en dev)
const isDev = import.meta.env.DEV
const debugLog = (...args: unknown[]) => {
  if (isDev) console.log(...args)
}

export function useAuthSimple() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  })

  debugLog('🔄 useAuthSimple state:', state)

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
          
          // Fetch profile BLOCKING - wait for profile to check is_active status
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()
            
            if (profileError) {
              console.log('⚠️ Profile fetch error:', profileError)
            }
            
            if (profileData) {
              console.log('📸 Profile data from DB:', profileData)
              
              // Check if user is deactivated
              if (profileData.is_active === false) {
                console.log('🚫 User account is deactivated')
                // Clear session and redirect to login
                await supabase.auth.signOut()
                setState(prev => ({ 
                  ...prev, 
                  loading: false, 
                  error: 'Tu cuenta ha sido desactivada. Por favor contacta al administrador.',
                  session: null, 
                  user: null 
                }))
                return
              }
            }
            
            // Crear usuario con datos reales del perfil
            const user: User = {
              id: session.user.id,
              email: session.user.email!,
              name: session.user.user_metadata?.full_name || profileData?.full_name || session.user.email!.split('@')[0],
              username: session.user.email!.split('@')[0],
              roles: [{
                id: 'simple-client-role',
                user_id: session.user.id,
                role: 'client',
                business_id: null,
                is_active: profileData?.is_active ?? true,
                created_at: new Date().toISOString()
              }],
              activeRole: 'client',
              role: 'client',
              business_id: undefined,
              location_id: undefined,
              phone: profileData?.phone || '',
              language: profileData?.language || 'es',
              notification_preferences: profileData?.notification_preferences || {
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
              timezone: profileData?.timezone || 'America/Mexico_City',
              avatar_url: session.user.user_metadata?.avatar_url || profileData?.avatar_url || undefined,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              is_active: profileData?.is_active ?? true
            }
            
            console.log('👤 Created user object from real profile data, is_active:', user.is_active)
            
            setState(prev => ({
              ...prev,
              user,
              session,
              loading: false,
              error: null
            }))
          } catch (error) {
            console.log('💥 Error fetching profile:', error)
            // Create user anyway, but we couldn't verify is_active
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
            
            setState(prev => ({
              ...prev,
              user,
              session,
              loading: false,
              error: null
            }))
          }
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
          console.log('✅ User signed in - checking profile status...')
          
          try {
            // Fetch profile BLOCKING for SIGNED_IN event
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()
            
            if (profileError) {
              console.log('⚠️ Profile fetch error in SIGNED_IN:', profileError)
            }
            
            if (profileData) {
              console.log('📸 Profile data fetched in SIGNED_IN:', profileData)
              
              // Check if user is deactivated
              if (profileData.is_active === false) {
                console.log('🚫 User account is deactivated in SIGNED_IN')
                // Clear session and don't allow login
                await supabase.auth.signOut()
                setState(prev => ({ 
                  ...prev, 
                  user: null,
                  session: null,
                  loading: false,
                  error: 'Tu cuenta ha sido desactivada. Por favor contacta al administrador.'
                }))
                return
              }
            }
            
            // Create user object with profile data
            const user: User = {
              id: session.user.id,
              email: session.user.email!,
              name: session.user.user_metadata?.full_name || profileData?.full_name || session.user.email!.split('@')[0],
              username: session.user.email!.split('@')[0],
              roles: [{
                id: 'simple-client-role',
                user_id: session.user.id,
                role: 'client',
                business_id: null,
                is_active: profileData?.is_active ?? true,
                created_at: new Date().toISOString()
              }],
              activeRole: 'client',
              role: 'client',
              business_id: undefined,
              location_id: undefined,
              phone: profileData?.phone || '',
              language: profileData?.language || 'es',
              notification_preferences: profileData?.notification_preferences || {
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
              timezone: profileData?.timezone || 'America/Mexico_City',
              avatar_url: session.user.user_metadata?.avatar_url || profileData?.avatar_url || undefined,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              is_active: profileData?.is_active ?? true
            }
            
            console.log('✅ User created from SIGNED_IN event with is_active:', user.is_active)
            setState(prev => ({
              ...prev,
              user,
              session,
              loading: false,
              error: null
            }))
          } catch (error) {
            console.log('💥 Error in SIGNED_IN handler:', error)
            // Create user anyway as fallback
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
            
            setState(prev => ({
              ...prev,
              user,
              session,
              loading: false,
              error: null
            }))
          }
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
