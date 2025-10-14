import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export type ServiceStatus = 'operational' | 'degraded' | 'down' | 'checking'

interface ServiceHealth {
  supabase: ServiceStatus
  auth: ServiceStatus
  database: ServiceStatus
  storage: ServiceStatus
  lastChecked: Date | null
  error: string | null
}

export function useServiceStatus() {
  const [status, setStatus] = useState<ServiceHealth>({
    supabase: 'checking',
    auth: 'checking',
    database: 'checking',
    storage: 'checking',
    lastChecked: null,
    error: null,
  })

  const checkHealth = async () => {
    const startTime = Date.now()
    let supabaseStatus: ServiceStatus = 'operational'
    let authStatus: ServiceStatus = 'operational'
    let databaseStatus: ServiceStatus = 'operational'
    let storageStatus: ServiceStatus = 'operational'
    let error: string | null = null

    try {
      // Check 1: Auth service (fast check)
      const authPromise = supabase.auth.getSession()
      const authTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth timeout')), 5000)
      )

      await Promise.race([authPromise, authTimeout])
        .then(() => {
          authStatus = 'operational'
        })
        .catch(() => {
          authStatus = 'down'
          supabaseStatus = 'degraded'
        })

      // Check 2: Database access (simple query)
      if (authStatus === 'operational') {
        const dbPromise = supabase.from('profiles').select('count', { count: 'exact', head: true })
        const dbTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database timeout')), 5000)
        )

        await Promise.race([dbPromise, dbTimeout])
          .then((result: unknown) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error: dbError } = result as any
            if (dbError) {
              databaseStatus = 'degraded'
              supabaseStatus = 'degraded'
            } else {
              databaseStatus = 'operational'
            }
          })
          .catch(() => {
            databaseStatus = 'down'
            supabaseStatus = 'degraded'
          })
      }

      // Check 3: Storage access
      if (authStatus === 'operational') {
        try {
          const { data: buckets } = await supabase.storage.listBuckets()
          storageStatus = buckets ? 'operational' : 'degraded'
        } catch {
          storageStatus = 'degraded'
        }
      }

      // Overall status
      const responseTime = Date.now() - startTime
      if (responseTime > 10000) {
        supabaseStatus = 'degraded'
        error = 'Servicios lentos (>10s). El proyecto pudo haber estado pausado.'
      } else if (authStatus === 'down' || databaseStatus === 'down') {
        supabaseStatus = 'down'
        error = 'No se pudo conectar con Supabase. Verifica tu conexión o el estado del proyecto.'
      }

    } catch (err) {
      supabaseStatus = 'down'
      authStatus = 'down'
      databaseStatus = 'down'
      storageStatus = 'down'
      error = err instanceof Error ? err.message : 'Error desconocido'
    }

    setStatus({
      supabase: supabaseStatus,
      auth: authStatus,
      database: databaseStatus,
      storage: storageStatus,
      lastChecked: new Date(),
      error,
    })
  }

  useEffect(() => {
    checkHealth()

    // Re-check every 60 seconds
    const interval = setInterval(checkHealth, 60000)

    return () => clearInterval(interval)
  }, [])

  return { ...status, refresh: checkHealth }
}
