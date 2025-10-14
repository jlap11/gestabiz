import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
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
  
  const [wasDown, setWasDown] = useState(false)

  const checkHealth = useCallback(async () => {
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

    // Detectar si Supabase se recuperó después de estar caído
    if (wasDown && supabaseStatus === 'operational') {
      toast.success('Conexión restaurada', {
        description: 'Recargando página para restablecer la conexión...',
        duration: 2000,
      })
      // Esperar 2 segundos para que el usuario vea el mensaje
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    }
    
    // Actualizar el estado "wasDown" para la próxima verificación
    if (supabaseStatus === 'down' && !wasDown) {
      setWasDown(true)
    }

    setStatus({
      supabase: supabaseStatus,
      auth: authStatus,
      database: databaseStatus,
      storage: storageStatus,
      lastChecked: new Date(),
      error,
    })
  }, [wasDown])

  useEffect(() => {
    checkHealth()

    // Re-check every 30 seconds (más frecuente para detectar recovery rápido)
    const interval = setInterval(checkHealth, 30000)

    return () => clearInterval(interval)
  }, [checkHealth])

  return { ...status, refresh: checkHealth }
}
