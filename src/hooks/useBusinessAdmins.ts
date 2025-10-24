/**
 * useBusinessAdmins Hook
 *
 * Obtiene el administrador (owner) de un negocio con información de TODAS sus sedes.
 *
 * IMPORTANTE: Cada negocio tiene UN administrador ÚNICO, vinculado a TODAS las sedes.
 * NO se duplica el admin por cada sede. Retorna un array con UN solo elemento.
 *
 * @author Gestabiz Team
 * @version 1.1.0
 * @date 2025-10-19
 */

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export interface BusinessAdminLocation {
  location_id: string
  location_name: string
  location_address: string
  location_city: string
  location_state: string
  latitude: number | null
  longitude: number | null
  distance_km?: number
}

export interface BusinessAdmin {
  user_id: string
  full_name: string
  email: string
  avatar_url: string | null
  locations: BusinessAdminLocation[]
  closest_location?: BusinessAdminLocation
}

interface UseBusinessAdminsOptions {
  businessId: string
  userLocation?: {
    latitude: number
    longitude: number
  } | null
}

/**
 * Calcula la distancia entre dos puntos geográficos usando la fórmula de Haversine
 * @returns distancia en kilómetros
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function useBusinessAdmins({ businessId, userLocation }: UseBusinessAdminsOptions) {
  const [admins, setAdmins] = useState<BusinessAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const computeAdminLocations = useCallback(
    (
      locations: Array<{
        id: string
        name: string
        address: string
        city: string
        state: string
        latitude: number | null
        longitude: number | null
      }>
    ): BusinessAdminLocation[] => {
      const locList: BusinessAdminLocation[] = locations.map(location => ({
        location_id: location.id,
        location_name: location.name,
        location_address: location.address,
        location_city: location.city,
        location_state: location.state || '',
        latitude: location.latitude ? Number(location.latitude) : null,
        longitude: location.longitude ? Number(location.longitude) : null,
      }))

      if (!userLocation) return locList

      for (const loc of locList) {
        if (loc.latitude !== null && loc.longitude !== null) {
          loc.distance_km = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            loc.latitude,
            loc.longitude
          )
        }
      }

      locList.sort((a, b) => {
        const distA = a.distance_km ?? Infinity
        const distB = b.distance_km ?? Infinity
        return distA - distB
      })

      return locList
    },
    [userLocation]
  )

  const fetchAdmins = useCallback(async () => {
    if (!businessId) return

    try {
      setLoading(true)
      setError(null)

      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('owner_id')
        .eq('id', businessId)
        .single()

      if (businessError) throw businessError

      const { data: ownerProfile, error: ownerError } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .eq('id', businessData.owner_id)
        .single()

      if (ownerError) throw ownerError

      const { data: locations, error: locationsError } = await supabase
        .from('locations')
        .select('id, name, address, city, state, latitude, longitude')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('name')

      if (locationsError) throw locationsError

      if (!locations?.length) {
        setAdmins([])
        return
      }

      const adminLocations = computeAdminLocations(locations)

      const admin: BusinessAdmin = {
        user_id: ownerProfile.id,
        full_name: ownerProfile.full_name ?? 'Administrador',
        email: ownerProfile.email,
        avatar_url: ownerProfile.avatar_url,
        locations: adminLocations,
        closest_location:
          adminLocations[0] && adminLocations[0].distance_km === undefined
            ? undefined
            : adminLocations[0],
      }

      setAdmins([admin])
    } catch (err) {
      // eslint-disable-next-line no-console
      logger.error('Error fetching business admins:', { error: err })
      setError(err instanceof Error ? err.message : 'Error al cargar administradores')
    } finally {
      setLoading(false)
    }
  }, [businessId, computeAdminLocations])

  useEffect(() => {
    fetchAdmins()
  }, [fetchAdmins])

  return {
    admins,
    loading,
    error,
    refetch: fetchAdmins,
  }
}
