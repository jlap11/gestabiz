// ============================================================================
// HOOK: useBusinessTaxConfig
// Hook con caché para obtener configuración fiscal del negocio
// Usa React Query para caché con TTL de 1 hora
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import supabase from '@/lib/supabase';
import type { TaxConfiguration } from '@/types/accounting.types';

interface UseBusinessTaxConfigReturn {
  config: TaxConfiguration | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  updateConfig: (config: Partial<TaxConfiguration>) => Promise<void>;
}

const CACHE_TIME = 60 * 60 * 1000; // 1 hora en milisegundos
const STALE_TIME = 30 * 60 * 1000; // 30 minutos

/**
 * Hook para obtener y cachear configuración fiscal del negocio
 * @param businessId - ID del negocio
 * @returns Configuración fiscal con caché, loading, error y funciones de actualización
 */
export function useBusinessTaxConfig(businessId: string): UseBusinessTaxConfigReturn {
  const queryClient = useQueryClient();

  // Query con caché
  const {
    data: config,
    isLoading: loading,
    error,
    refetch,
  } = useQuery<TaxConfiguration | null, Error>({
    queryKey: ['tax-config', businessId],
    queryFn: async () => {
      const { data, error: fetchError } = await supabase
        .from('tax_configurations')
        .select('*')
        .eq('business_id', businessId)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      return (data as TaxConfiguration) ?? null;
    },
    gcTime: CACHE_TIME, // Tiempo que los datos permanecen en caché
    staleTime: STALE_TIME, // Tiempo antes de considerar datos obsoletos
    refetchOnWindowFocus: false, // No refetch al enfocar ventana
    refetchOnMount: false, // No refetch al montar componente si hay caché
    retry: 2, // Reintentar 2 veces en caso de error
  });

  // Mutation para actualizar configuración
  const mutation = useMutation({
    mutationFn: async (updates: Partial<TaxConfiguration>) => {
      const { error: updateError } = await supabase
        .from('tax_configurations')
        .upsert({
          business_id: businessId,
          ...updates,
          updated_at: new Date().toISOString(),
        });

      if (updateError) {
        throw updateError;
      }
    },
    onSuccess: () => {
      // Invalidar caché para refetch automático
      queryClient.invalidateQueries({ queryKey: ['tax-config', businessId] });
    },
  });

  const updateConfig = async (updates: Partial<TaxConfiguration>) => {
    await mutation.mutateAsync(updates);
  };

  return {
    config: config ?? null,
    loading,
    error: error as Error | null,
    refetch,
    updateConfig,
  };
}

/**
 * Hook para pre-cargar configuración fiscal en caché
 * Útil para prefetch antes de navegar a página de configuración
 */
export function usePrefetchTaxConfig() {
  const queryClient = useQueryClient();

  return (businessId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['tax-config', businessId],
      queryFn: async () => {
        const { data } = await supabase
          .from('tax_configurations')
          .select('*')
          .eq('business_id', businessId)
          .maybeSingle();

        return (data as TaxConfiguration | null) ?? null;
      },
      gcTime: CACHE_TIME,
      staleTime: STALE_TIME,
    });
  };
}

/**
 * Hook para invalidar caché de configuración fiscal
 * Útil después de operaciones que modifican la configuración externamente
 */
export function useInvalidateTaxConfig() {
  const queryClient = useQueryClient();

  return (businessId?: string) => {
    if (businessId) {
      queryClient.invalidateQueries({ queryKey: ['tax-config', businessId] });
    } else {
      // Invalidar todas las configuraciones fiscales
      queryClient.invalidateQueries({ queryKey: ['tax-config'] });
    }
  };
}
