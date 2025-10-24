/**
 * Hook: useCompletedAppointments
 *
 * Hook compartido para obtener citas completadas de un cliente
 * Consolida 3 queries separadas en 1 sola query con caché
 *
 * Usado por:
 * - useMandatoryReviews: Contar citas sin review
 * - ClientHistory: Mostrar historial completo
 * - Otros componentes que necesiten citas completadas
 *
 * @param clientId - ID del cliente
 * @returns { appointments, loading, error, helpers }
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { QUERY_CONFIG } from '@/lib/queryConfig'

export interface CompletedAppointment {
  id: string
  start_time: string
  end_time: string
  status: string
  notes: string | null
  business_id: string
  service_id: string
  employee_id: string
  location_id: string
  created_at: string
  updated_at: string
  businesses: {
    id: string
    name: string
  }
  services: {
    id: string
    name: string
    price: number
  }
}

export interface UseCompletedAppointmentsResult {
  appointments: CompletedAppointment[]
  loading: boolean
  error: Error | null
  // Helper functions para filtrado local
  getByBusinessId: (businessId: string) => CompletedAppointment[]
  getIds: () => string[]
  count: number
}

export function useCompletedAppointments(
  clientId: string | null | undefined
): UseCompletedAppointmentsResult {
  const {
    data: appointments = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: QUERY_CONFIG.KEYS.COMPLETED_APPOINTMENTS(clientId || ''),
    queryFn: async () => {
      if (!clientId) return []

      const { data, error: queryError } = await supabase
        .from('appointments')
        .select(
          `
          id,
          start_time,
          end_time,
          status,
          notes,
          business_id,
          service_id,
          employee_id,
          location_id,
          created_at,
          updated_at,
          businesses!inner (
            id,
            name
          ),
          services!inner (
            id,
            name,
            price
          )
        `
        )
        .eq('client_id', clientId)
        .eq('status', 'completed')
        .order('start_time', { ascending: false })

      if (queryError) {
        // eslint-disable-next-line no-console
        console.error('Error fetching completed appointments:', queryError)
        throw queryError
      }

      // Transform data to match our interface
      return (data || []).map(apt => ({
        ...apt,
        businesses: apt.businesses[0] || { id: '', name: '' },
        services: apt.services[0] || { id: '', name: '', price: 0 },
      })) as CompletedAppointment[]
    },
    enabled: !!clientId,
    staleTime: QUERY_CONFIG.STABLE.staleTime, // 5 minutos
    gcTime: QUERY_CONFIG.STABLE.gcTime,
  })

  // Helper functions para filtrado local
  const getByBusinessId = (businessId: string): CompletedAppointment[] => {
    return appointments.filter(apt => apt.business_id === businessId)
  }

  const getIds = (): string[] => {
    return appointments.map(apt => apt.id)
  }

  return {
    appointments,
    loading,
    error: error as Error | null,
    getByBusinessId,
    getIds,
    count: appointments.length,
  }
}
