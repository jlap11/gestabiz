/**
 * useEmployeeActiveBusinesshook - Determina el negocio activo de un empleado según horario
 * 
 * Para empleados con múltiples negocios, determina en cuál debería estar
 * trabajando según el horario actual y los horarios configurados.
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface BusinessSchedule {
  business_id: string
  business_name: string
  business_logo_url: string | null
  schedule: {
    [key: string]: {
      // monday, tuesday, etc.
      is_active: boolean
      start_time: string // HH:mm format
      end_time: string // HH:mm format
    }
  }
}

interface ActiveBusinessResult {
  business_id: string | null
  business_name: string | null
  business_logo_url: string | null
  is_within_schedule: boolean // Si está dentro del horario laboral
  status: 'active' | 'off-schedule' | 'no-schedule' | 'not-employee'
}

/**
 * Hook para determinar el negocio activo de un empleado
 * @param employeeId - ID del empleado (user_id)
 * @returns Información del negocio activo y estado del horario
 */
export function useEmployeeActiveBusiness(employeeId: string | null | undefined): ActiveBusinessResult {
  const [result, setResult] = useState<ActiveBusinessResult>({
    business_id: null,
    business_name: null,
    business_logo_url: null,
    is_within_schedule: false,
    status: 'not-employee',
  })

  useEffect(() => {
    if (!employeeId) {
      setResult({
        business_id: null,
        business_name: null,
        business_logo_url: null,
        is_within_schedule: false,
        status: 'not-employee',
      })
      return
    }

    async function fetchActiveBusinessAsync() {
      try {
        // 1. Obtener todos los negocios donde el empleado trabaja
        const { data: employeeBusinesses, error } = await supabase
          .from('business_employees')
          .select(`
            business_id,
            businesses!inner (
              id,
              name,
              logo_url
            )
          `)
          .eq('employee_id', employeeId)
          .eq('status', 'active')

        if (error) {
          console.error('[useEmployeeActiveBusiness] Error fetching businesses:', error)
          setResult({
            business_id: null,
            business_name: null,
            business_logo_url: null,
            is_within_schedule: false,
            status: 'not-employee',
          })
          return
        }

        if (!employeeBusinesses || employeeBusinesses.length === 0) {
          setResult({
            business_id: null,
            business_name: null,
            business_logo_url: null,
            is_within_schedule: false,
            status: 'not-employee',
          })
          return
        }

        // 2. Si hay negocios, devolver el primero (sin validación de horario)
        // TODO: Implementar tabla work_schedules para validación de horarios
        const firstBusiness = (employeeBusinesses[0].businesses as any)
        
        setResult({
          business_id: firstBusiness?.id || null,
          business_name: firstBusiness?.name || null,
          business_logo_url: firstBusiness?.logo_url || null,
          is_within_schedule: true, // Asumimos siempre activo por ahora
          status: 'active',
        })
      } catch (err) {
        console.error('[useEmployeeActiveBusiness] Unexpected error:', err)
        setResult({
          business_id: null,
          business_name: null,
          business_logo_url: null,
          is_within_schedule: false,
          status: 'not-employee',
        })
      }
    }

    fetchActiveBusinessAsync()
  }, [employeeId])

  return result
}
