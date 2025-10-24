/**
 * @file useEmployeeMetrics.ts
 * @description React Query hook para métricas individuales de empleados
 * Calcula ocupación, rating promedio y revenue total por empleado
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// =====================================================
// TIPOS
// =====================================================

export interface EmployeeMetrics {
  occupancy: number | null
  rating: number | null
  revenue: number | null
}

export interface UseEmployeeMetricsOptions {
  enableOccupancy?: boolean
  enableRating?: boolean
  enableRevenue?: boolean
  staleTime?: number
}

// =====================================================
// HOOK PRINCIPAL
// =====================================================

/**
 * Hook para obtener métricas individuales de un empleado en un negocio
 * @param employeeId - ID del empleado (user_id en business_employees)
 * @param businessId - ID del negocio
 * @param options - Opciones de configuración (habilitar/deshabilitar métricas específicas)
 */
export function useEmployeeMetrics(
  employeeId: string | null,
  businessId: string | null,
  options: UseEmployeeMetricsOptions = {}
) {
  const {
    enableOccupancy = true,
    enableRating = true,
    enableRevenue = true,
    staleTime = 10 * 60 * 1000, // Cache por 10 minutos por defecto
  } = options

  const enabled = !!employeeId && !!businessId

  // =====================================================
  // QUERY: Ocupación
  // =====================================================

  const {
    data: occupancyData,
    isLoading: isLoadingOccupancy,
    error: occupancyError,
    refetch: refetchOccupancy,
  } = useQuery({
    queryKey: ['employeeOccupancy', employeeId, businessId],
    queryFn: async () => {
      if (!employeeId || !businessId) return null

      const { data, error } = await supabase.rpc('calculate_employee_occupancy', {
        p_user_id: employeeId,
        p_business_id: businessId,
      })

      if (error) throw new Error(error.message)

      // La función RPC devuelve un número (porcentaje)
      return typeof data === 'number' ? data : null
    },
    enabled: enabled && enableOccupancy,
    staleTime,
    gcTime: staleTime * 2,
  })

  // =====================================================
  // QUERY: Rating Promedio
  // =====================================================

  const {
    data: ratingData,
    isLoading: isLoadingRating,
    error: ratingError,
    refetch: refetchRating,
  } = useQuery({
    queryKey: ['employeeRating', employeeId, businessId],
    queryFn: async () => {
      if (!employeeId || !businessId) return null

      const { data, error } = await supabase.rpc('calculate_employee_rating_by_business', {
        p_user_id: employeeId,
        p_business_id: businessId,
      })

      if (error) throw new Error(error.message)

      // La función RPC devuelve un número (rating promedio)
      return typeof data === 'number' ? data : null
    },
    enabled: enabled && enableRating,
    staleTime,
    gcTime: staleTime * 2,
  })

  // =====================================================
  // QUERY: Revenue Total
  // =====================================================

  const {
    data: revenueData,
    isLoading: isLoadingRevenue,
    error: revenueError,
    refetch: refetchRevenue,
  } = useQuery({
    queryKey: ['employeeRevenue', employeeId, businessId],
    queryFn: async () => {
      if (!employeeId || !businessId) return null

      const { data, error } = await supabase.rpc('calculate_employee_revenue', {
        p_user_id: employeeId,
        p_business_id: businessId,
      })

      if (error) throw new Error(error.message)

      // La función RPC devuelve un número (revenue total)
      return typeof data === 'number' ? data : null
    },
    enabled: enabled && enableRevenue,
    staleTime,
    gcTime: staleTime * 2,
  })

  // =====================================================
  // HELPERS
  // =====================================================

  /**
   * Refrescar todas las métricas habilitadas
   */
  const refetchAll = async () => {
    const promises: Promise<unknown>[] = []
    if (enableOccupancy) promises.push(refetchOccupancy())
    if (enableRating) promises.push(refetchRating())
    if (enableRevenue) promises.push(refetchRevenue())
    await Promise.all(promises)
  }

  /**
   * Verifica si alguna métrica está cargando
   */
  const isLoading =
    (enableOccupancy && isLoadingOccupancy) ||
    (enableRating && isLoadingRating) ||
    (enableRevenue && isLoadingRevenue)

  /**
   * Verifica si hay algún error
   */
  const hasError = !!occupancyError || !!ratingError || !!revenueError

  /**
   * Obtiene el primer error disponible
   */
  const error = occupancyError || ratingError || revenueError || null

  /**
   * Obtiene todas las métricas en un objeto
   */
  const metrics: EmployeeMetrics = {
    occupancy: occupancyData ?? null,
    rating: ratingData ?? null,
    revenue: revenueData ?? null,
  }

  // =====================================================
  // RETURN
  // =====================================================

  return {
    // Métricas individuales
    occupancy: occupancyData ?? null,
    rating: ratingData ?? null,
    revenue: revenueData ?? null,

    // Objeto combinado
    metrics,

    // Estados de carga individuales
    isLoadingOccupancy,
    isLoadingRating,
    isLoadingRevenue,

    // Estado de carga global
    isLoading,

    // Errores individuales
    occupancyError,
    ratingError,
    revenueError,

    // Error global
    error,
    hasError,

    // Acciones
    refetch: refetchAll,
    refetchOccupancy,
    refetchRating,
    refetchRevenue,
  }
}

export default useEmployeeMetrics
