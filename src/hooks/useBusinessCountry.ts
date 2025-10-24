/**
 * Hook: useBusinessCountry
 *
 * Obtiene el país del negocio para cargar sus festivos públicos
 *
 * @param businessId - ID del negocio
 * @returns { countryId, country, loading, error }
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export interface BusinessCountry {
  id: string
  name: string
  country: string
}

export function useBusinessCountry(businessId: string | null | undefined) {
  return useQuery({
    queryKey: ['business-country', businessId],
    queryFn: async () => {
      if (!businessId) return null

      const { data, error } = await supabase
        .from('businesses')
        .select('id, name, country')
        .eq('id', businessId)
        .single()

      if (error) {
    logger.error('Error fetching business country:', { error })
    throw error
  }

      return data as BusinessCountry
    },
    enabled: !!businessId,
    staleTime: 1000 * 60 * 60, // 1 hora
    gcTime: 1000 * 60 * 60 * 24, // 24 horas (antes "cacheTime")
  })
}
