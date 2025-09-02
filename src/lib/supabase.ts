import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-key'
const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true' || supabaseUrl.includes('demo.supabase.co')

// For development purposes, we'll create a mock client if real credentials aren't available
export const supabase = isDemoMode 
  ? createMockClient()
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })

// Mock client for development when Supabase isn't configured
type SupabaseLike = ReturnType<typeof createClient>
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

  // helper stubs to keep nesting shallow
  function stubSingleOk() { return Promise.resolve({ data: null, error: null as unknown as { code: string; message: string } }) }
  function stubSingleNotFound() { return Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'No rows found' } }) }
  function stubSelect() { return { single: stubSingleOk } }
  function stubEqUpdate() { return { select: stubSelect } }
  function makeQuery() {
    return {
      eq: (_c?: string, _v?: unknown) => makeQuery(),
      in: (_c?: string, _v?: unknown[]) => makeQuery(),
      gt: (_c?: string, _v?: unknown) => makeQuery(),
      gte: (_c?: string, _v?: unknown) => makeQuery(),
      lte: (_c?: string, _v?: unknown) => makeQuery(),
      order: (_c?: string, _o?: unknown) => Promise.resolve({ data: [], error: null }),
      limit: (_n?: number) => makeQuery(),
      select: (_columns?: string) => makeQuery(),
      single: stubSingleNotFound,
      maybeSingle: () => Promise.resolve({ data: null, error: null })
    }
  }

  const client = {
    auth: {
      getSession: () => Promise.resolve({ 
        data: { session: mockSession }, 
        error: null 
      }),
      getUser: () => Promise.resolve({ data: { user: mockUser }, error: null }),
  onAuthStateChange: (callback: (event: string, session: typeof mockSession) => void) => {
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
     from: (_table: string) => ({
       ...makeQuery(),
       insert: (_payload: unknown) => ({ select: () => ({ single: stubSingleOk }) }),
       update: (_payload: unknown) => ({ eq: (_c?: string, _v?: unknown) => stubEqUpdate() }),
       delete: () => ({ eq: (_c?: string, _v?: unknown) => Promise.resolve({ error: null }) }),
       upsert: (_payload: unknown) => ({ select: () => ({ single: stubSingleOk }) })
     }),
    channel: (_name: string) => {
      const ch = {
        on: () => ch,
        subscribe: () => ch
      }
      return ch
    },
    removeChannel: (_: unknown) => {}
  } as unknown

  return client as SupabaseLike
}

// Auth helpers
export const auth = supabase.auth

// Database helpers
export const db = supabase

export default supabase