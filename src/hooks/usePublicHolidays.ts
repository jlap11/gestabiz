/**
 * Hook: usePublicHolidays
 *
 * Obtiene días festivos públicos para un país específico
 * Utiliza React Query con caché de 24 horas
 *
 * @param countryId - ID del país (UUID)
 * @param year - (Opcional) Año específico. Si no se proporciona, obtiene el año actual
 * @returns { holidays, loading, error, isHoliday }
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { logger } from '../lib/logger'

export interface Holiday {
  id: string
  country_id: string
  name: string
  holiday_date: string // formato: YYYY-MM-DD
  is_recurring: boolean
  description?: string
  created_at: string
  updated_at: string
}

export interface UsePublicHolidaysResult {
  holidays: Holiday[]
  loading: boolean
  error: Error | null
  isHoliday: (date: Date | string) => boolean
  getHolidayName: (date: Date | string) => string | null
}

// Mapa de nombres de países a UUIDs para normalización
const COUNTRY_UUID_MAP: Record<string, string> = {
  Colombia: '01b4e9d1-a84e-41c9-8768-253209225a21',
  colombia: '01b4e9d1-a84e-41c9-8768-253209225a21',
  CO: '01b4e9d1-a84e-41c9-8768-253209225a21',
}

export function usePublicHolidays(
  countryId: string | null | undefined,
  year?: number
): UsePublicHolidaysResult {
  const currentYear = year || new Date().getFullYear()

  // ✅ Normalizar countryId: convertir nombre de país a UUID si es necesario
  const normalizedCountryId = countryId ? COUNTRY_UUID_MAP[countryId] || countryId : null

  const {
    data: holidays = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ['public-holidays', normalizedCountryId, currentYear],
    queryFn: async () => {
      if (!normalizedCountryId) return []

      // Obtener festivos para el año especificado
      const startDate = `${currentYear}-01-01`
      const endDate = `${currentYear}-12-31`

      const { data, error: queryError } = await supabase
        .from('public_holidays')
        .select('*')
        .eq('country_id', normalizedCountryId)
        .gte('holiday_date', startDate)
        .lte('holiday_date', endDate)
        .order('holiday_date', { ascending: true })

      if (queryError) {
         
        logger.error('Error fetching holidays:', { error: queryError })
        throw queryError
      }

      return (data || []) as Holiday[]
    },
    enabled: !!normalizedCountryId,
    staleTime: 1000 * 60 * 60 * 24, // 24 horas
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 días (antes "cacheTime")
  })

  // Helper: Verificar si una fecha es festivo
  const isHoliday = (date: Date | string): boolean => {
    let dateStr: string

    if (typeof date === 'string') {
      dateStr = date // Asumir que está en formato YYYY-MM-DD
    } else {
      dateStr = format(date, 'yyyy-MM-dd')
    }

    return holidays.some(holiday => holiday.holiday_date === dateStr)
  }

  // Helper: Obtener nombre del festivo para una fecha
  const getHolidayName = (date: Date | string): string | null => {
    let dateStr: string

    if (typeof date === 'string') {
      dateStr = date
    } else {
      dateStr = format(date, 'yyyy-MM-dd')
    }

    const holiday = holidays.find(h => h.holiday_date === dateStr)
    return holiday?.name || null
  }

  return {
    holidays,
    loading,
    error: error instanceof Error ? error : null,
    isHoliday,
    getHolidayName,
  }
}
