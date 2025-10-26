/**
 * Hook para manejar la Sede Preferida/Administrada del negocio
 * Se guarda en localStorage para persistencia entre sesiones
 */

import { useState, useEffect } from 'react'

const STORAGE_KEY_PREFIX = 'preferred-location-'

export interface PreferredLocationHook {
  preferredLocationId: string | null
  setPreferredLocation: (locationId: string | null) => void
  isAllLocations: boolean
}

/**
 * Hook para obtener y establecer la sede preferida de un negocio
 * @param businessId ID del negocio
 * @returns { preferredLocationId, setPreferredLocation, isAllLocations }
 */
export function usePreferredLocation(businessId: string | undefined): PreferredLocationHook {
  const [preferredLocationId, setPreferredLocationId] = useState<string | null>(null)

  // Cargar desde localStorage al montar
  useEffect(() => {
    if (!businessId) return

    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${businessId}`)
    if (stored) {
      setPreferredLocationId(stored === 'all' ? null : stored)
    }
  }, [businessId])

  // Función para actualizar la sede preferida
  const setPreferredLocation = (locationId: string | null) => {
    if (!businessId) return

    // Si es null, significa "Todas las sedes"
    const valueToStore = locationId || 'all'
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${businessId}`, valueToStore)
    setPreferredLocationId(locationId)
  }

  const isAllLocations = preferredLocationId === null

  return {
    preferredLocationId,
    setPreferredLocation,
    isAllLocations,
  }
}
