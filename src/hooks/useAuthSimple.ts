// Hook simplificado de autenticación
import { useState, useEffect } from 'react'
import { Session } from '@supabase/supabase-js'
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

  useEffect(() => {
    async function getInitialSession() {
      try {
        // Add timeout to prevent infinite loading (30 seconds for slow Supabase start)
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Session timeout after 30s - Supabase may be paused')), 30000)
        })
        
        const sessionPromise = supabase.auth.getSession()
        
        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]).catch(() => {
          return { data: { session: null }, error: null }
        }) as { data: { session: Session | null }, error: unknown }
        
        if (error) {
          // Limpiar localStorage si hay error de sesión
          localStorage.clear()
          setState(prev => ({ ...prev, loading: false, error: null, session: null, user: null }))
          return
        }
        
        if (!session) {
          setState(prev => ({ ...prev, loading: false, session: null, user: null }))
          return
        }

        if (session?.user) {
          // Try to fetch user profile from Supabase (CRITICAL - must exist)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let profileData: any = null
          try {
            const { data, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()
            
            if (profileError) {
              // Usuario huérfano: existe en auth.users pero no en profiles
              // Cerrar sesión automáticamente para evitar inconsistencias
              await supabase.auth.signOut()
              setState(prev => ({ ...prev, loading: false, error: null, session: null, user: null }))
              return
            }
            
            profileData = data
          } catch {
            // En caso de error de red, cerrar sesión por seguridad
            await supabase.auth.signOut()
            setState(prev => ({ ...prev, loading: false, error: null, session: null, user: null }))
            return
          }
          
          // Crear usuario simplificado con datos del perfil
          const user: User = {
            id: session.user.id,
            email: session.user.email!,
            name: profileData?.name || session.user.email!.split('@')[0],
            username: profileData?.username || session.user.email!.split('@')[0],
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
            phone: profileData?.phone || '',
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
            avatar_url: profileData?.avatar_url ? `${profileData.avatar_url}?t=${Date.now()}` : undefined,
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
          setState(prev => ({ ...prev, loading: false }))
        }
      } catch {
        // Limpiar localStorage en caso de error de conexión
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Handle sign out
        if (!session) {
          setState(prev => ({
            ...prev,
            user: null,
            session: null,
            loading: false,
            error: null
          }))
        } 
        // Handle sign in / sign up
        else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          if (session?.user) {
            try {
              // Fetch profile
              const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single()

              if (profileData) {
                const user: User = {
                  id: session.user.id,
                  email: session.user.email!,
                  name: profileData.name || session.user.email!.split('@')[0],
                  username: profileData.username || session.user.email!.split('@')[0],
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
                  phone: profileData.phone || '',
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
                  avatar_url: profileData.avatar_url ? `${profileData.avatar_url}?t=${Date.now()}` : undefined,
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
                // Profile not found, sign out
                await supabase.auth.signOut()
                setState(prev => ({
                  ...prev,
                  user: null,
                  session: null,
                  loading: false,
                  error: null
                }))
              }
            } catch {
              // Error loading profile, sign out for safety
              await supabase.auth.signOut()
              setState(prev => ({
                ...prev,
                user: null,
                session: null,
                loading: false,
                error: null
              }))
            }
          }
        } 
        // Handle token refresh
        else if (event === 'TOKEN_REFRESHED') {
          setState(prev => ({
            ...prev,
            session,
            loading: false
          }))
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return {
    ...state,
    signOut
  }
}
