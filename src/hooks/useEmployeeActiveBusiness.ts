/**
 * useEmployeeActiveBusinesshook - Determina el negocio activo de un empleado según horario
 *
 * Para empleados con múltiples negocios, determina en cuál debería estar
 * trabajando según el horario actual y los horarios configurados.
 */

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getDayOfWeekInTZ, getTimeZoneParts } from '@/lib/utils'

// =====================================================
// Helpers de Zona Horaria
// =====================================================
const DEFAULT_TIME_ZONE = 'America/Bogota'
// Helpers de TZ movidos a utils
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
export function useEmployeeActiveBusiness(
  employeeId: string | null | undefined
): ActiveBusinessResult {
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
          .select(
            `
            business_id,
            location_id,
            businesses!inner (
              id,
              name,
              logo_url,
              timezone
            )
          `
          )
          .eq('employee_id', employeeId)
          .eq('status', 'approved')

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

        // 2. Validar horarios con tabla work_schedules y seleccionar negocio activo
        const now = new Date()

        let activeBiz: any = null
        let isWithin = false
        let status: ActiveBusinessResult['status'] = 'no-schedule'

        for (const empBiz of employeeBusinesses) {
          const biz = (empBiz as any).businesses

          const tz = biz?.timezone || DEFAULT_TIME_ZONE
          const dayOfWeek = getDayOfWeekInTZ(now, tz)

          try {
            let wsQuery = supabase
              .from('work_schedules')
              .select('start_time, end_time, is_working')
              .eq('employee_id', employeeId)
              .eq('day_of_week', dayOfWeek)

            if ((empBiz as any).location_id) {
              wsQuery = wsQuery.eq('location_id', (empBiz as any).location_id)
            }

            const { data: wsData, error: wsError } = await wsQuery.limit(1)

            if (wsError) {
              console.warn(
                '[useEmployeeActiveBusiness] Error consultando work_schedules:',
                wsError.message
              )
              continue
            }

            const ws = wsData && wsData.length > 0 ? wsData[0] : null

            if (!ws) {
              // Sin horario definido para este día
              activeBiz = activeBiz || biz
              status = 'no-schedule'
              continue
            }

            const parseToMinutes = (t: string): number => {
              const [hh, mm] = t.split(':')
              return parseInt(hh, 10) * 60 + parseInt(mm, 10)
            }

            const { hour, minute } = getTimeZoneParts(now, tz)
            const nowMinutes = hour * 60 + minute
            const startMinutes = parseToMinutes(String(ws.start_time))
            const endMinutes = parseToMinutes(String(ws.end_time))

            isWithin = !!ws.is_working && nowMinutes >= startMinutes && nowMinutes < endMinutes
            activeBiz = biz
            status = isWithin ? 'active' : 'off-schedule'

            if (isWithin) {
              break
            }
          } catch (e) {
            console.error('[useEmployeeActiveBusiness] Error validando horarios:', e)
            activeBiz = activeBiz || biz
            status = 'no-schedule'
          }
        }

        // Fallback: si ninguno está activo, usar el primero
        const selected = activeBiz || (employeeBusinesses[0].businesses as any)

        setResult({
          business_id: selected?.id || null,
          business_name: selected?.name || null,
          business_logo_url: selected?.logo_url || null,
          is_within_schedule: isWithin,
          status,
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
