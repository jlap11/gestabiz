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

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

export interface Holiday {
  id: string;
  country_id: string;
  name: string;
  holiday_date: string; // formato: YYYY-MM-DD
  is_recurring: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface UsePublicHolidaysResult {
  holidays: Holiday[];
  loading: boolean;
  error: Error | null;
  isHoliday: (date: Date | string) => boolean;
  getHolidayName: (date: Date | string) => string | null;
}

export function usePublicHolidays(
  countryId: string | null | undefined,
  year?: number
): UsePublicHolidaysResult {
  const currentYear = year || new Date().getFullYear();

  const { data: holidays = [], isLoading: loading, error } = useQuery({
    queryKey: ['public-holidays', countryId, currentYear],
    queryFn: async () => {
      if (!countryId) return [];

      // Obtener festivos para el año especificado
      const startDate = `${currentYear}-01-01`;
      const endDate = `${currentYear}-12-31`;

      const { data, error: queryError } = await supabase
        .from('public_holidays')
        .select('*')
        .eq('country_id', countryId)
        .gte('holiday_date', startDate)
        .lte('holiday_date', endDate)
        .order('holiday_date', { ascending: true });

      if (queryError) {
        // eslint-disable-next-line no-console
        console.error('Error fetching holidays:', queryError);
        throw queryError;
      }

      return (data || []) as Holiday[];
    },
    enabled: !!countryId,
    staleTime: 1000 * 60 * 60 * 24, // 24 horas
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 días (antes "cacheTime")
  });

  // Helper: Verificar si una fecha es festivo
  const isHoliday = (date: Date | string): boolean => {
    let dateStr: string;

    if (typeof date === 'string') {
      dateStr = date; // Asumir que está en formato YYYY-MM-DD
    } else {
      dateStr = format(date, 'yyyy-MM-dd');
    }

    return holidays.some((holiday) => holiday.holiday_date === dateStr);
  };

  // Helper: Obtener nombre del festivo para una fecha
  const getHolidayName = (date: Date | string): string | null => {
    let dateStr: string;

    if (typeof date === 'string') {
      dateStr = date;
    } else {
      dateStr = format(date, 'yyyy-MM-dd');
    }

    const holiday = holidays.find((h) => h.holiday_date === dateStr);
    return holiday?.name || null;
  };

  return {
    holidays,
    loading,
    error: error instanceof Error ? error : null,
    isHoliday,
    getHolidayName,
  };
}
