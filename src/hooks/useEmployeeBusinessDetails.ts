import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface EmployeeBusinessDetails {
  // Business info
  business_id: string
  business_name: string
  business_description: string | null
  business_logo_url: string | null
  business_phone: string | null
  business_email: string | null
  business_website: string | null
  business_rating: number
  business_reviews: number
  category_name: string | null
  subcategories: Array<{ name: string }> | null

  // Employee info
  location_id: string | null
  location_name: string | null
  location_address: string | null
  role: string | null
  employee_type: string | null
  job_title: string | null
  salary_base: number | null
  salary_type: string | null
  contract_type: string | null
  hire_date: string | null
  is_active: boolean

  // Employee performance
  employee_avg_rating: number
  employee_total_reviews: number
  services_count: number
  completed_appointments: number
}

interface UseEmployeeBusinessDetailsResult {
  details: EmployeeBusinessDetails | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook para obtener detalles completos de un empleo específico
 * Incluye info del negocio, sede, salario, calificaciones y estadísticas
 */
export function useEmployeeBusinessDetails(
  employeeId: string | null | undefined,
  businessId: string | null | undefined
): UseEmployeeBusinessDetailsResult {
  const [details, setDetails] = useState<EmployeeBusinessDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDetails = useCallback(async () => {
    if (!employeeId || !businessId) {
      setDetails(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Llamar a la RPC function
      const { data, error: rpcError } = await supabase.rpc('get_employee_business_details', {
        p_employee_id: employeeId,
        p_business_id: businessId,
      })

      if (rpcError) throw rpcError

      // La function devuelve array con 1 fila
      if (data && data.length > 0) {
        setDetails(data[0])
      } else {
        setDetails(null)
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error al cargar detalles del empleo'
      setError(errorMessage)
      setDetails(null)
    } finally {
      setLoading(false)
    }
  }, [employeeId, businessId])

  useEffect(() => {
    fetchDetails()
  }, [fetchDetails])

  return {
    details,
    loading,
    error,
    refetch: fetchDetails,
  }
}
