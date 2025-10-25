
// Hook simplificado de autenticación para debuggear
import { useEffect, useState } from 'react'
import { Session, User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { User } from '@/types'
import type { Database } from '@/types/database'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
}

// Helper para logs de debug (solo en dev)
const isDev = import.meta.env.DEV
import { logger } from '@/lib/logger'
const debugLog = (...args: unknown[]) => {
  if (isDev) {
    logger.info('useAuthSimple debug', { args, component: 'useAuthSimple' })
  }
}

type ProfileRow = Database['public']['Tables']['profiles']['Row']

const defaultPreferences: User['notification_preferences'] = {
  email: true,
  push: true,
  browser: true,
  whatsapp: false,
  reminder_24h: true,
  reminder_1h: true,
  reminder_15m: false,
  daily_digest: false,
  weekly_report: false,
}

const buildUserFromSession = (sessionUser: SupabaseUser, profile?: ProfileRow | null): User => {
  const baseEmail = sessionUser.email ?? ''
  const baseName =
    sessionUser.user_metadata?.full_name ||
    profile?.full_name ||
    (baseEmail ? baseEmail.split('@')[0] : 'Usuario')
  const username = sessionUser.user_metadata?.username || baseEmail.split('@')[0] || baseName
  const isActive = profile?.is_active ?? true

  return {
    id: sessionUser.id,
    email: baseEmail,
    name: baseName,
    username,
    avatar_url: sessionUser.user_metadata?.avatar_url || profile?.avatar_url || undefined,
    timezone: profile?.timezone || 'America/Mexico_City',
    roles: [
      {
        id: profile ? `simple-role-${profile.id}` : 'simple-role-default',
        user_id: sessionUser.id,
        role: 'client',
        business_id: null,
        is_active: isActive,
        created_at: profile?.created_at || new Date().toISOString(),
      },
    ],
    activeRole: 'client',
    activeBusiness: undefined,
    role: 'client',
    business_id: undefined,
    location_id: undefined,
    phone: profile?.phone || sessionUser.user_metadata?.phone || '',
    language: (profile?.language as User['language']) || 'es',
    notification_preferences:
      (profile?.notification_preferences as User['notification_preferences']) || defaultPreferences,
    permissions: [],
    created_at: profile?.created_at || new Date().toISOString(),
    updated_at: profile?.updated_at || new Date().toISOString(),
    is_active: isActive,
    deactivated_at: profile?.deactivated_at || undefined,
    last_login: profile?.last_login || undefined,
    accountInactive: profile ? profile.is_active === false : undefined,
  }
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
    debugLog('🚀 useAuthSimple - Getting initial session...')
    let mounted = true

    const hydrateUserProfile = async (sessionObj: Session) => {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sessionObj.user.id)
          .single()

        if (profileError) {
          debugLog('⚠️ Profile fetch error:', profileError)
          return
        }

        if (profileData && mounted) {
          const hydratedUser = buildUserFromSession(sessionObj.user, profileData)
          debugLog(
            '✅ Hydrated user with profile data. accountInactive:',
            hydratedUser.accountInactive
          )
          setState(prev => ({
            ...prev,
            user: hydratedUser,
            session: sessionObj,
            loading: false,
            error: null,
          }))
        }
      } catch (error) {
        debugLog('💥 Error hydrating user profile:', error)
      }
    }

    async function getInitialSession() {
      try {
        debugLog('📡 Calling supabase.auth.getSession()...')
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()
        debugLog('📊 Session result:', { session, error })

        if (error) {
          debugLog('❌ Session error:', error.message)
          if (mounted) {
            setState(prev => ({ ...prev, loading: false, error: null, session: null, user: null }))
          }
          return
        }

        if (session?.user && mounted) {
          const fallbackUser = buildUserFromSession(session.user)
          setState(prev => ({
            ...prev,
            user: fallbackUser,
            session,
            loading: false,
            error: null,
          }))
          void hydrateUserProfile(session)
        } else if (mounted) {
          setState(prev => ({ ...prev, loading: false }))
        }
      } catch (error) {
        debugLog('💥 Error in getInitialSession:', error)
        if (mounted) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          }))
        }
      }
    }

    void getInitialSession()

    debugLog('👂 Setting up auth state listener...')
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      debugLog('🔔 Auth state changed:', event, session?.user?.email)

      if (!mounted) {
        return
      }

      if (!session) {
        debugLog('👋 User signed out in listener')
        setState(prev => ({
          ...prev,
          user: null,
          session: null,
          loading: false,
          error: null,
        }))
        return
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const fallbackUser = buildUserFromSession(session.user)
        setState(prev => ({
          ...prev,
          user: fallbackUser,
          session,
          loading: false,
          error: null,
        }))

        // Hydrate with latest profile data after optimistic update
        void hydrateUserProfile(session)
      } else {
        setState(prev => ({
          ...prev,
          session,
          loading: false,
        }))
      }
    })

    return () => {
      mounted = false
      debugLog('🧹 Cleaning up auth listener...')
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    debugLog('👋 Signing out...')
    await supabase.auth.signOut()
  }

  const signIn = async (data: { email: string; password: string }) => {
    debugLog('🔐 Signing in with email/password...')
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        debugLog('❌ Sign in error:', error.message)
        return { success: false, error: error.message, user: null }
      }

      if (authData.user) {
        // Fetch profile to check if account is active
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single()

        const user = buildUserFromSession(authData.user, profile)
        debugLog('✅ Sign in successful')
        return { success: true, user, error: null }
      }

      return { success: false, error: 'No user returned', user: null }
    } catch (error) {
      debugLog('💥 Sign in exception:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        user: null,
      }
    }
  }

  const signUp = async (data: { email: string; password: string; full_name?: string }) => {
    debugLog('📝 Signing up new user...')
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name || data.email.split('@')[0],
          },
        },
      })

      if (error) {
        debugLog('❌ Sign up error:', error.message)
        return { success: false, error: error.message, needsEmailConfirmation: false }
      }

      // Check if email confirmation is required
      const needsEmailConfirmation = authData.user && !authData.session

      if (needsEmailConfirmation) {
        debugLog('📧 Email confirmation required')
        return { success: true, needsEmailConfirmation: true, error: null }
      }

      debugLog('✅ Sign up successful')
      return { success: true, needsEmailConfirmation: false, error: null }
    } catch (error) {
      debugLog('💥 Sign up exception:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        needsEmailConfirmation: false,
      }
    }
  }

  const signInWithGoogle = async () => {
    debugLog('🔐 Signing in with Google...')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${globalThis.location.origin}/app`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        debugLog('❌ Google sign in error:', error.message)
        return { success: false, error: error.message }
      }

      debugLog('✅ Google OAuth initiated')
      return { success: true, error: null }
    } catch (error) {
      debugLog('💥 Google sign in exception:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  return {
    ...state,
    signOut,
    signIn,
    signUp,
    signInWithGoogle,
  }
}
