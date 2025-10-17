import { useState, useEffect, useCallback } from 'react'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { User } from '@/types'
import { toast } from 'sonner'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
}

interface SignUpData {
  email: string
  password: string
  full_name?: string
  phone?: string
}

interface SignInData {
  email: string
  password: string
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null
  })

  // Convert Supabase User to our User type
  const convertToUser = useCallback(async (supabaseUser: SupabaseUser): Promise<User | null> => {
    try {
      // Check if this is demo mode
      if (supabaseUser.id === 'demo-user-id') {
        return {
          id: 'demo-user-id',
          email: 'demo@example.com',
          name: 'Demo User',
          avatar_url: undefined,
          roles: [{ 
            id: 'demo-role-1', 
            user_id: 'demo-user-id',
            role: 'admin', 
            business_id: null,
            is_active: true,
            created_at: new Date().toISOString()
          }],
          activeRole: 'admin',
          role: 'admin', // Legacy support
          phone: '+1234567890',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true,
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
          timezone: 'America/Mexico_City'
        }
      }

      // First try to get the user profile from our profiles table
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        return null
      }

      // If profile exists, fetch user roles and return complete user object
      if (profile) {
        // Fetch user roles from user_roles table
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select(`
            id,
            role,
            business_id,
            is_active,
            businesses:business_id (
              id,
              name
            )
          `)
          .eq('user_id', profile.id)
          .order('is_active', { ascending: false })

        if (rolesError) {
          // If error fetching roles, use legacy single role from profile
          return {
            id: profile.id,
            email: profile.email,
            name: profile.full_name || '',
            avatar_url: profile.avatar_url,
            roles: [{ 
              id: 'legacy-role', 
              user_id: profile.id,
              role: profile.role, 
              business_id: null,
              is_active: true,
              created_at: profile.created_at
            }],
            activeRole: profile.active_role || profile.role,
            role: profile.active_role || profile.role, // Legacy support
            phone: profile.phone,
            created_at: profile.created_at,
            updated_at: profile.updated_at,
            is_active: profile.is_active,
            language: profile.settings?.language || 'es',
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
            timezone: 'America/Mexico_City'
          }
        }

        // Map roles with business information
        const mappedRoles = (userRoles || []).map(r => {
          let businessName: string | undefined
          if (r.businesses) {
            businessName = Array.isArray(r.businesses) ? r.businesses[0]?.name : (r.businesses as { name?: string }).name
          }
          
          return {
            id: r.id,
            user_id: profile.id,
            role: r.role,
            business_id: r.business_id,
            business_name: businessName,
            is_active: r.is_active,
            created_at: new Date().toISOString() // Use current time as fallback
          }
        })

        // Determine active role
        const activeRole = profile.active_role || mappedRoles.find(r => r.is_active)?.role || mappedRoles[0]?.role || 'client'
        const activeRoleAssignment = mappedRoles.find(r => r.role === activeRole)

        return {
          id: profile.id,
          email: profile.email,
          name: profile.full_name || '',
          avatar_url: profile.avatar_url,
          roles: mappedRoles,
          activeRole,
          activeBusiness: activeRoleAssignment?.business_id ? {
            id: activeRoleAssignment.business_id,
            name: activeRoleAssignment.business_name || ''
          } : undefined,
          role: activeRole, // Legacy support
          business_id: activeRoleAssignment?.business_id || undefined, // Legacy support
          phone: profile.phone,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
          is_active: profile.is_active,
          language: profile.settings?.language || 'es',
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
          timezone: 'America/Mexico_City'
        }
      }

      // If no profile exists, create one
      const newProfile: import('@/types/database').Database['public']['Tables']['profiles']['Insert'] = {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email!.split('@')[0],
        avatar_url: supabaseUser.user_metadata?.avatar_url || null,
        role: 'client' as const,
        phone: null,
        settings: {
          language: 'es',
          theme: 'dark',
          notifications: {
            email: true,
            push: true,
            whatsapp: false
          }
        } as unknown as import('@/types/database').Json,
        is_active: true
      }

      const { data: createdProfile, error: createError } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single()

      if (createError) {
        // Profile created successfully or error occurred
        return null
      }

      // Create initial client role for new user
      await supabase
        .from('user_roles')
        .insert({
          user_id: createdProfile.id,
          role: 'client',
          business_id: null,
          is_active: true
        })

      return {
        id: createdProfile.id,
        email: createdProfile.email,
        name: createdProfile.full_name || '',
        avatar_url: createdProfile.avatar_url,
        roles: [{
          id: 'initial-client-role',
          user_id: createdProfile.id,
          role: 'client',
          business_id: null,
          is_active: true,
          created_at: createdProfile.created_at
        }],
        activeRole: 'client',
        role: 'client', // Legacy support
        phone: createdProfile.phone,
        created_at: createdProfile.created_at,
        updated_at: createdProfile.updated_at,
        is_active: createdProfile.is_active,
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
        timezone: 'America/Mexico_City'
      }
  } catch {
      // Error converting user - return null
      return null
    }
  }, [])

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    async function getInitialSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          // Error getting initial session
          setState(prev => ({ ...prev, loading: false, error: error.message }))
          return
        }

        if (session?.user && mounted) {
          const user = await convertToUser(session.user)
          setState(prev => ({
            ...prev,
            user,
            session,
            loading: false,
            error: null
          }))
        } else if (mounted) {
          setState(prev => ({ ...prev, loading: false }))
        }
  } catch {
        // Error in getInitialSession
        if (mounted) {
          setState(prev => ({ 
            ...prev, 
            loading: false, 
    error: 'Unknown error' 
          }))
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        if (session?.user) {
          const user = await convertToUser(session.user)
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
      mounted = false
      subscription.unsubscribe()
    }
  }, [convertToUser])

  // Sign up with email and password
  const signUp = useCallback(async (data: SignUpData) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name || '',
            phone: data.phone || ''
          }
        }
      })

      if (error) {
        setState(prev => ({ ...prev, loading: false, error: error.message }))
        toast.error(error.message)
        return { success: false, error: error.message }
      }

      // If user was created successfully
      if (authData.user) {
        // If there's a session (email confirmation disabled), create profile and log in
        if (authData.session) {
          // Create profile in profiles table
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              email: authData.user.email,
              full_name: data.full_name || '',
              phone: data.phone || '',
              role: 'client', // Default role
              is_active: true
            })

          if (profileError) {
            // Profile might already exist (duplicate signup attempt)
            if (profileError.code !== '23505') { // 23505 = unique violation
              toast.error('Error al crear perfil de usuario')
              setState(prev => ({ ...prev, loading: false }))
              return { success: false, error: profileError.message }
            }
          }

          // Convert to User and update state
          const user = await convertToUser(authData.user)
          setState(prev => ({
            ...prev,
            user,
            session: authData.session,
            loading: false,
            error: null
          }))
          
          toast.success(`¡Bienvenido, ${data.full_name || data.email}!`)
          return { success: true, needsEmailConfirmation: false }
        } else {
          // Email confirmation is required
          toast.success('Revisa tu email para confirmar tu cuenta')
          setState(prev => ({ ...prev, loading: false }))
          return { success: true, needsEmailConfirmation: true }
        }
      }

      setState(prev => ({ ...prev, loading: false }))
      return { success: false, error: 'No se pudo crear el usuario' }
  } catch {
      const message = 'Error desconocido'
      setState(prev => ({ ...prev, loading: false, error: message }))
      toast.error(message)
      return { success: false, error: message }
    }
  }, [convertToUser])

  // Sign in with email and password
  const signIn = useCallback(async (data: SignInData) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      })

      if (error) {
        setState(prev => ({ ...prev, loading: false, error: error.message }))
        toast.error(error.message)
        return { success: false, error: error.message }
      }

      if (authData.user) {
        const user = await convertToUser(authData.user)
        setState(prev => ({
          ...prev,
          user,
          session: authData.session,
          loading: false,
          error: null
        }))
        toast.success(`¡Bienvenido, ${user?.name || data.email}!`)
        return { success: true, user }
      }

      return { success: false, error: 'No se pudo autenticar' }
  } catch {
      const message = 'Error desconocido'
      setState(prev => ({ ...prev, loading: false, error: message }))
      toast.error(message)
      return { success: false, error: message }
    }
  }, [convertToUser])

  // Sign in with Google
  const signInWithGoogle = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      })

      if (error) {
        setState(prev => ({ ...prev, loading: false, error: error.message }))
        toast.error(error.message)
        return { success: false, error: error.message }
      }

      // OAuth redirect will handle the rest
      return { success: true }
    } catch {
      const message = 'Error desconocido'
      setState(prev => ({ ...prev, loading: false, error: message }))
      toast.error(message)
      return { success: false, error: message }
    }
  }, [])

  // Sign out
  const signOut = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }))

      const { error } = await supabase.auth.signOut()

      if (error) {
        setState(prev => ({ ...prev, loading: false, error: error.message }))
        toast.error(error.message)
        return { success: false, error: error.message }
      }

      setState(prev => ({
        ...prev,
        user: null,
        session: null,
        loading: false,
        error: null
      }))

      toast.success('Sesión cerrada correctamente')
      return { success: true }
  } catch {
      const message = 'Error desconocido'
      setState(prev => ({ ...prev, loading: false, error: message }))
      toast.error(message)
      return { success: false, error: message }
    }
  }, [])

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        setState(prev => ({ ...prev, loading: false, error: error.message }))
        toast.error(error.message)
        return { success: false, error: error.message }
      }

      setState(prev => ({ ...prev, loading: false }))
      toast.success('Revisa tu email para restablecer tu contraseña')
      return { success: true }
  } catch {
      const message = 'Error desconocido'
      setState(prev => ({ ...prev, loading: false, error: message }))
      toast.error(message)
      return { success: false, error: message }
    }
  }, [])

  // Update user profile
  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!state.user) return { success: false, error: 'No user logged in' }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

    const { error } = await supabase
        .from('profiles')
        .update({
          full_name: updates.name,
          avatar_url: updates.avatar_url,
          phone: updates.phone,
      // Nota: actualizar role desde cliente solo es seguro en modo demo; en prod usar Edge Function
      ...(updates.role ? { role: updates.role } : {}),
          settings: {
            language: updates.language,
            theme: 'dark', // Keep current theme
            notifications: updates.notification_preferences
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', state.user.id)

      if (error) {
        setState(prev => ({ ...prev, loading: false, error: error.message }))
        toast.error(error.message)
        return { success: false, error: error.message }
      }

      // Update local state
  const updatedUser: User = {
        ...state.user,
        ...updates,
        updated_at: new Date().toISOString()
      }

      setState(prev => ({
        ...prev,
        user: updatedUser,
        loading: false,
        error: null
      }))

      toast.success('Perfil actualizado correctamente')
      return { success: true, user: updatedUser }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setState(prev => ({ ...prev, loading: false, error: message }))
      toast.error(message)
      return { success: false, error: message }
    }
  }, [state.user])

  return {
    user: state.user,
    session: state.session,
    loading: state.loading,
    error: state.error,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updateProfile
  }
}