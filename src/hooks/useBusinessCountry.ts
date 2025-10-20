/**
 * Hook: useBusinessCountry
 * 
 * Obtiene el país del negocio para cargar sus festivos públicos
 * 
 * @param businessId - ID del negocio
 * @returns { countryId, country, loading, error }
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface BusinessCountry {
  id: string;
  name: string;
  country_id: string;
}

export function useBusinessCountry(businessId: string | null | undefined) {
  return useQuery({
    queryKey: ['business-country', businessId],
    queryFn: async () => {
      if (!businessId) return null;

      const { data, error } = await supabase
        .from('businesses')
        .select('id, name, country_id')
        .eq('id', businessId)
        .single();

      if (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching business country:', error);
        throw error;
      }

      return data as BusinessCountry;
    },
    enabled: !!businessId,
    staleTime: 1000 * 60 * 60, // 1 hora
    gcTime: 1000 * 60 * 60 * 24, // 24 horas (antes "cacheTime")
  });
}
