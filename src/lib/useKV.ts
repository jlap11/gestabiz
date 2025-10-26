import { useEffect, useState } from 'react'

// Hook de persistencia sencillo basado en localStorage
export function useKV<T>(key: string, initialValue: T): [T, (updater: T | ((prev: T) => T)) => Promise<T>] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue
    try {
      const raw = window.localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // noop
    }
  }, [key, value])

  const update = async (updater: T | ((prev: T) => T)) => {
    let next: T
    setValue(prev => {
      next = typeof updater === 'function' ? (updater as (p: T) => T)(prev) : updater
      return next
    })
    return Promise.resolve(next!)
  }

  return [value, update]
}
