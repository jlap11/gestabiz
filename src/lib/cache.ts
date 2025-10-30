// Sencillo caché en memoria con TTL y coalescencia de requests
// Uso: withCache(key, () => fetcher(), ttlMs)

type CacheEntry<T> = {
  value: T
  expiresAt: number
}

const store = new Map<string, CacheEntry<any>>()
const inFlight = new Map<string, Promise<any>>()

export function getCache<T = unknown>(key: string): T | undefined {
  const entry = store.get(key)
  if (!entry) return undefined
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return undefined
  }
  return entry.value as T
}

export function setCache<T = unknown>(key: string, value: T, ttlMs: number): void {
  store.set(key, { value, expiresAt: Date.now() + Math.max(0, ttlMs) })
}

export async function withCache<T = unknown>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = 120_000
): Promise<T> {
  const cached = getCache<T>(key)
  if (cached !== undefined) return cached

  // Coalescer: si ya hay una promesa en curso para este key, reutilizarla
  const existing = inFlight.get(key)
  if (existing) return existing as Promise<T>

  const p = (async () => {
    try {
      const result = await fetcher()
      setCache(key, result, ttlMs)
      return result
    } finally {
      inFlight.delete(key)
    }
  })()
  inFlight.set(key, p as Promise<any>)
  return p
}

export function invalidateCache(keyPrefix?: string): void {
  if (!keyPrefix) {
    store.clear()
    inFlight.clear()
    return
  }
  for (const k of Array.from(store.keys())) {
    if (k.startsWith(keyPrefix)) store.delete(k)
  }
  for (const k of Array.from(inFlight.keys())) {
    if (k.startsWith(keyPrefix)) inFlight.delete(k)
  }
}

