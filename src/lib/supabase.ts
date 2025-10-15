import { createClient } from '@supabase/supabase-js'

// ✨ FIX: Validación más robusta de variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || 'https://demo.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || 'demo-key'

// Permite activar demo mode también vía process.env (útil en tests)
type GlobalWithProcess = typeof globalThis & { process?: { env?: Record<string, string | undefined> } }
const gwp = globalThis as GlobalWithProcess
const demoFlag = typeof gwp !== 'undefined' && gwp.process?.env?.VITE_DEMO_MODE === 'true'

// ✨ FIX: Detectar si las variables están vacías o son placeholders
const hasValidCredentials = 
  supabaseUrl && 
  supabaseUrl !== '' && 
  supabaseUrl !== 'undefined' &&
  !supabaseUrl.includes('demo.supabase.co') &&
  supabaseAnonKey && 
  supabaseAnonKey !== '' && 
  supabaseAnonKey !== 'undefined' &&
  supabaseAnonKey !== 'demo-key'

const isDemoMode = demoFlag || 
                   import.meta.env.VITE_DEMO_MODE === 'true' || 
                   !hasValidCredentials

// ✨ DEBUG: Log configuración en desarrollo/producción
if (typeof window !== 'undefined') {
  console.log('[Supabase Init] Configuration:', {
    url: supabaseUrl?.substring(0, 30) + '...',
    hasKey: !!supabaseAnonKey && supabaseAnonKey !== 'demo-key',
    isDemoMode,
    hasValidCredentials,
    env: import.meta.env.MODE
  })
}

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

  // helper stubs to keep nesting shallow and lint clean
  function stubSingleOk() {
    return Promise.resolve({ data: null, error: null as unknown as { code: string; message: string } })
  }
  function stubSingleNotFound() { return Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'No rows found' } }) }
  function stubSelect() { return { single: stubSingleOk } }
  function stubEqUpdate() { return { select: stubSelect } }
  function makeQuery() {
    const api = {
      select: (_columns?: string) => api,
      eq: (_c?: string, _v?: unknown) => api,
      neq: (_c?: string, _v?: unknown) => api,
      in: (_c?: string, _v?: unknown[]) => api,
      gt: (_c?: string, _v?: unknown) => api,
      gte: (_c?: string, _v?: unknown) => api,
      lt: (_c?: string, _v?: unknown) => api,
      lte: (_c?: string, _v?: unknown) => api,
      order: (_c?: string, _o?: unknown) => api,
      limit: (_n?: number) => api,
      range: (_from?: number, _to?: number) => api,
      single: stubSingleNotFound,
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      then: (onfulfilled: (v: { data: unknown[]; error: null }) => unknown) => Promise.resolve(onfulfilled({ data: [], error: null }))
    }
    return api
  }

  const client = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: mockSession }, error: null }),
      getUser: () => Promise.resolve({ data: { user: mockUser }, error: null }),
      onAuthStateChange: (callback: (event: string, session: typeof mockSession) => void) => {
        // Simulate logged in state for demo
        setTimeout(() => { callback('SIGNED_IN', mockSession) }, 100)
        return { data: { subscription: { unsubscribe: () => {} } } }
      },
      signInWithPassword: () => Promise.resolve({ data: { user: mockUser, session: mockSession }, error: null }),
      signUp: () => Promise.resolve({ data: { user: mockUser, session: mockSession }, error: null }),
      signInWithOAuth: () => Promise.resolve({ data: { provider: 'google', url: 'mock-url' }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      resetPasswordForEmail: () => Promise.resolve({ data: {}, error: null })
    },
    from: (_table: string) => {
      const q = makeQuery()
      return {
        select: q.select,
        eq: q.eq,
        neq: q.neq,
        in: q.in,
        gt: q.gt,
        gte: q.gte,
        lt: q.lt,
        lte: q.lte,
        order: q.order,
        limit: q.limit,
        range: q.range,
        single: q.single,
        maybeSingle: q.maybeSingle,
        then: q.then,
        insert: (_payload: unknown) => ({ select: () => ({ single: stubSingleOk }) }),
        update: (_payload: unknown) => ({ eq: (_c?: string, _v?: unknown) => stubEqUpdate() }),
        delete: () => ({ eq: (_c?: string, _v?: unknown) => Promise.resolve({ error: null }) }),
        upsert: (_payload: unknown) => ({ select: () => ({ single: stubSingleOk }) })
      }
    },
    channel: (_name: string) => {
      const ch = { on: () => ch, subscribe: () => ch }
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