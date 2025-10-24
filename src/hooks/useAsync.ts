import { useCallback, useEffect, useRef, useState } from 'react'

export type AsyncStatus = 'idle' | 'pending' | 'success' | 'error'

export interface UseAsyncOptions<T> {
  auto?: boolean
  fn?: () => Promise<T>
  deps?: any[]
}

export interface UseAsyncResult<T> {
  status: AsyncStatus
  data: T | null
  error: Error | null
  run: (fn?: () => Promise<T>) => Promise<T | null>
  reset: () => void
  setData: (value: T | null) => void
}

/**
 * useAsync
 *
 * Un hook pequeño y reusable para manejar estados de operaciones async.
 * - Estados: idle, pending, success, error
 * - API clara: run, reset, setData
 * - Opción de ejecución automática con deps
 *
 * Ejemplo básico:
 * const userReq = useAsync<User>({ fn: () => api.getUser(), auto: true, deps: [userId] })
 * if (userReq.status === 'pending') return <Spinner />
 *
 * Ejecución manual:
 * const req = useAsync()
 * const onClick = () => req.run(() => api.save(data))
 */
export function useAsync<T>(options: UseAsyncOptions<T> = {}): UseAsyncResult<T> {
  const { auto = false, fn, deps = [] } = options

  const [status, setStatus] = useState<AsyncStatus>('idle')
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const safeSetState = useCallback(<K extends 'status' | 'data' | 'error'>(key: K, value: any) => {
    if (!mountedRef.current) return
    switch (key) {
      case 'status':
        setStatus(value as AsyncStatus)
        break
      case 'data':
        setData(value as T | null)
        break
      case 'error':
        setError(value as Error | null)
        break
    }
  }, [])

  const run = useCallback(
    async (runner?: () => Promise<T>): Promise<T | null> => {
      const exec = runner || fn
      if (!exec) {
        console.warn('useAsync.run llamado sin función. Define fn en options o pásala al run().')
        return null
      }
      safeSetState('status', 'pending')
      safeSetState('error', null)
      try {
        const result = await exec()
        safeSetState('data', result)
        safeSetState('status', 'success')
        return result
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err))
        safeSetState('error', e)
        safeSetState('status', 'error')
        return null
      }
    },
    [fn, safeSetState]
  )

  const reset = useCallback(() => {
    safeSetState('status', 'idle')
    safeSetState('data', null)
    safeSetState('error', null)
  }, [safeSetState])

  // Auto-run cuando auto=true y hay fn
  useEffect(() => {
    if (auto && fn) {
      run()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return {
    status,
    data,
    error,
    run,
    reset,
    setData,
  }
}
