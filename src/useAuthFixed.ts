import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface AppUser {
  id: string
  email: string
  role: 'admin' | 'employee' | 'client'
  business_id?: string
}

export function useAuthFixed() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('🔄 useAuthFixed: Starting...')
    let isMounted = true
    
    // Get initial session with timeout
    const getInitialSession = async () => {
      try {
        console.log('📡 Getting session...')
        
        // Add timeout to prevent hanging
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 5000)
        )
        
        const { data: { session }, error: sessionError } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any
        
        if (!isMounted) return
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError)
          setError(sessionError.message)
          setLoading(false)
          return
        }

        if (session?.user) {
          console.log('✅ Found session for:', session.user.email)
          console.log('👤 User ID:', session.user.id)
          
          // Create basic user first (don't wait for profile)
          const basicUser: AppUser = {
            id: session.user.id,
            email: session.user.email || '',
            role: 'client'
          }
          
          if (isMounted) {
            setUser(basicUser)
            setLoading(false)
          }
          
          // Try to get profile in background
          try {
            console.log('📋 Fetching profile...')
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('id, role, business_id')
              .eq('id', session.user.id)
              .single()

            if (isMounted) {
              if (profileError) {
                console.warn('⚠️ Profile error:', profileError.message)
                // Keep basic user
              } else {
                console.log('✅ Profile found:', profile)
                const fullUser: AppUser = {
                  id: session.user.id,
                  email: session.user.email || '',
                  role: profile.role || 'client',
                  business_id: profile.business_id
                }
                setUser(fullUser)
              }
            }
          } catch (profileErr) {
            console.warn('⚠️ Profile fetch failed:', profileErr)
            // Keep basic user
          }
        } else {
          console.log('ℹ️ No session found')
          if (isMounted) {
            setUser(null)
            setLoading(false)
          }
        }
        
        console.log('✅ useAuthFixed: Initial load complete')
        
      } catch (err) {
        console.error('💥 useAuthFixed error:', err)
        if (isMounted) {
          setError(String(err))
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth change:', event, session?.user?.email)
      
      if (!isMounted) return
      
      if (session?.user) {
        // User logged in/session refreshed
        const basicUser: AppUser = {
          id: session.user.id,
          email: session.user.email || '',
          role: 'client'
        }
        setUser(basicUser)
        
        // Try to get profile
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, role, business_id')
            .eq('id', session.user.id)
            .single()

          if (isMounted && profile) {
            const fullUser: AppUser = {
              id: session.user.id,
              email: session.user.email || '',
              role: profile.role || 'client',
              business_id: profile.business_id
            }
            setUser(fullUser)
          }
        } catch (err) {
          console.warn('Profile fetch in auth change failed:', err)
        }
      } else {
        // User logged out
        setUser(null)
      }
      
      setLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const logout = async () => {
    console.log('🚪 Logging out...')
    setLoading(true)
    try {
      await supabase.auth.signOut()
      setUser(null)
    } catch (err) {
      console.error('❌ Logout error:', err)
      setError(String(err))
    }
    setLoading(false)
  }

  return {
    user,
    loading,
    error,
    logout,
    isAuthenticated: !!user
  }
}
