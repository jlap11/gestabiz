import { useEffect, useState } from 'react'

const STORAGE_KEY_PREFIX = 'preferred-city'
const DEFAULT_REGION_ID = '7f9b5c84-93ab-44e7-b07d-4f6e7d4c6e4b' // Bogotá D.C.
const DEFAULT_CITY_ID = null // Bogotá D.C. no necesita ciudad

interface PreferredCityData {
  regionId: string
  regionName: string
  cityId: string | null
  cityName: string | null
}

export function usePreferredCity() {
  const [preferredRegionId, setPreferredRegionId] = useState<string | null>(null)
  const [preferredRegionName, setPreferredRegionName] = useState<string | null>(null)
  const [preferredCityId, setPreferredCityId] = useState<string | null>(null)
  const [preferredCityName, setPreferredCityName] = useState<string | null>(null)

  // Load from localStorage on mount and listen for storage changes
  useEffect(() => {
    const loadFromStorage = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_PREFIX)
        if (stored) {
          const data: PreferredCityData = JSON.parse(stored)
          setPreferredRegionId(data.regionId)
          setPreferredRegionName(data.regionName)
          setPreferredCityId(data.cityId)
          setPreferredCityName(data.cityName)
        } else {
          // Set default to Bogotá D.C.
          setPreferredRegionId(DEFAULT_REGION_ID)
          setPreferredRegionName('Bogotá D.C.')
          setPreferredCityId(DEFAULT_CITY_ID)
          setPreferredCityName(null)
        }
      } catch {
        // Fallback to default on error
        setPreferredRegionId(DEFAULT_REGION_ID)
        setPreferredRegionName('Bogotá D.C.')
        setPreferredCityId(DEFAULT_CITY_ID)
        setPreferredCityName(null)
      }
    }

    // Load on mount
    loadFromStorage()

    // Listen for storage changes from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_PREFIX) {
        loadFromStorage()
      }
    }

    // Also listen for custom storage events from same tab
    const handleCustomStorageChange = () => {
      loadFromStorage()
    }

    globalThis.window?.addEventListener('storage', handleStorageChange)
    globalThis.window?.addEventListener('preferred-city-changed', handleCustomStorageChange)

    return () => {
      globalThis.window?.removeEventListener('storage', handleStorageChange)
      globalThis.window?.removeEventListener('preferred-city-changed', handleCustomStorageChange)
    }
  }, [])

  const setPreferredCity = (
    regionId: string,
    regionName: string,
    cityId: string | null,
    cityName: string | null
  ) => {
    try {
      const data: PreferredCityData = {
        regionId,
        regionName,
        cityId,
        cityName,
      }
      localStorage.setItem(STORAGE_KEY_PREFIX, JSON.stringify(data))
      setPreferredRegionId(regionId)
      setPreferredRegionName(regionName)
      setPreferredCityId(cityId)
      setPreferredCityName(cityName)

      // Emit custom event to notify other components using this hook
      if (typeof globalThis !== 'undefined' && globalThis.window) {
        globalThis.window.dispatchEvent(new CustomEvent('preferred-city-changed'))
      }
    } catch {
      // Silent error - continue with operation
    }
  }

  return {
    preferredRegionId,
    preferredRegionName,
    preferredCityId,
    preferredCityName,
    setPreferredCity,
  }
}
