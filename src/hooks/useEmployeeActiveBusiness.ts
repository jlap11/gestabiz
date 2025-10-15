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
            work_schedule,
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

        // 2. Determinar día y hora actual
        const now = new Date()
        const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'lowercase' }) // monday, tuesday, etc.
        const currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) // HH:mm

        console.log('[useEmployeeActiveBusiness] Current day:', dayOfWeek, 'time:', currentTime)

        // 3. Buscar negocio activo según horario
        for (const empBusiness of employeeBusinesses) {
          const schedule = empBusiness.work_schedule as Record<string, any> | null
          const business = (empBusiness.businesses as any)

          if (!schedule || !business) continue

          // Verificar si hay horario para hoy
          const todaySchedule = schedule[dayOfWeek]
          
          if (!todaySchedule) continue

          const isActive = todaySchedule.is_active ?? true
          const startTime = todaySchedule.start_time || '09:00'
          const endTime = todaySchedule.end_time || '18:00'

          console.log('[useEmployeeActiveBusiness] Checking business:', business.name, {
            isActive,
            startTime,
            endTime,
            currentTime,
          })

          // Si el día está activo y está dentro del rango de horas
          if (isActive && currentTime >= startTime && currentTime <= endTime) {
            setResult({
              business_id: business.id,
              business_name: business.name,
              business_logo_url: business.logo_url || null,
              is_within_schedule: true,
              status: 'active',
            })
            return
          }
        }

        // 4. Si no está dentro del horario pero tiene negocios, mostrar el primero como fallback
        const firstBusiness = (employeeBusinesses[0].businesses as any)
        setResult({
          business_id: firstBusiness?.id || null,
          business_name: firstBusiness?.name || null,
          business_logo_url: firstBusiness?.logo_url || null,
          is_within_schedule: false,
          status: employeeBusinesses[0].work_schedule ? 'off-schedule' : 'no-schedule',
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
