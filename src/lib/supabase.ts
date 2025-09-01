import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-key'
const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true' || supabaseUrl.includes('demo.supabase.co')

// For development purposes, we'll create a mock client if real credentials aren't available
export const supabase = isDemoMode 
  ? createMockClient()
  : createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })

// Mock client for development when Supabase isn't configured
function createMockClient() {
  const mockUser = {
    id: 'demo-user-id',
    email: 'demo@example.com',
    user_metadata: { full_name: 'Demo User' },
    app_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    role: 'authenticated'
  }

  const mockSession = {
    user: mockUser,
    access_token: 'mock-token',
    refresh_token: 'mock-refresh',
    expires_in: 3600,
    token_type: 'bearer' as const,
    expires_at: Date.now() + 3600000
  }

  return {
    auth: {
      getSession: () => Promise.resolve({ 
        data: { session: mockSession }, 
        error: null 
      }),
      getUser: () => Promise.resolve({ data: { user: mockUser }, error: null }),
      onAuthStateChange: (callback: any) => {
        // Simulate logged in state for demo
        setTimeout(() => {
          callback('SIGNED_IN', mockSession)
        }, 100)
        return { data: { subscription: { unsubscribe: () => {} } } }
      },
      signInWithPassword: () => Promise.resolve({ 
        data: { user: mockUser, session: mockSession }, 
        error: null 
      }),
      signUp: () => Promise.resolve({ 
        data: { user: mockUser, session: mockSession }, 
        error: null 
      }),
      signInWithOAuth: () => Promise.resolve({ 
        data: { provider: 'google', url: 'mock-url' }, 
        error: null 
      }),
      signOut: () => Promise.resolve({ error: null }),
      resetPasswordForEmail: () => Promise.resolve({ 
        data: {}, 
        error: null 
      })
    },
    from: (table: string) => ({
      select: (columns?: string) => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'No rows found' } })
        }),
        then: (resolve: any) => resolve({ data: [], error: null })
      }),
      insert: () => Promise.resolve({ data: [], error: null }),
      update: () => Promise.resolve({ data: [], error: null }),
      delete: () => Promise.resolve({ data: [], error: null }),
      upsert: () => Promise.resolve({ data: [], error: null })
    }),
    channel: () => ({
      on: () => ({}),
      subscribe: () => ({})
    })
  } as any
}

// Auth helpers
export const auth = supabase.auth

// Database helpers
export const db = supabase

export default supabase