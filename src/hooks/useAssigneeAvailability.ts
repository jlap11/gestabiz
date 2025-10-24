import { useQuery } from '@tanstack/react-query'
import { resourcesService } from '@/lib/services/resources'
import supabase from '@/lib/supabase'

/**
 * Hook unificado para validar disponibilidad de EMPLEADOS o RECURSOS
 *
 * Fecha: 21 de Octubre de 2025
 * Parte del sistema de Modelo de Negocio Flexible
 *
 * Este hook reemplaza la lógica duplicada entre:
 * - Validación de disponibilidad de empleados (appointments con employee_id)
 * - Validación de disponibilidad de recursos (appointments con resource_id)
 */

interface UseAssigneeAvailabilityParams {
  employeeId?: string
  resourceId?: string
  startTime: Date
  endTime: Date
  excludeAppointmentId?: string
  enabled?: boolean
}

interface AvailabilityResult {
  isAvailable: boolean
  conflictingAppointments: Array<{
    id: string
    start_time: string
    end_time: string
    status: string
    client_name?: string
    service_name?: string
  }>
}

/**
 * Validar disponibilidad unificada para empleado o recurso
 */
export function useAssigneeAvailability({
  employeeId,
  resourceId,
  startTime,
  endTime,
  excludeAppointmentId,
  enabled = true,
}: UseAssigneeAvailabilityParams) {
  return useQuery<AvailabilityResult>({
    queryKey: [
      'assignee-availability',
      employeeId || resourceId,
      startTime.toISOString(),
      endTime.toISOString(),
      excludeAppointmentId,
    ],
    queryFn: async () => {
      // Validación: debe haber empleado O recurso (no ambos ni ninguno)
      if (!employeeId && !resourceId) {
        throw new Error('Debe proporcionar employeeId o resourceId')
      }
      if (employeeId && resourceId) {
        throw new Error('No puede proporcionar employeeId y resourceId simultáneamente')
      }

      // Caso 1: Validar disponibilidad de RECURSO
      if (resourceId) {
        const isAvailable = await resourcesService.isAvailable(
          resourceId,
          startTime,
          endTime,
          excludeAppointmentId
        )

        // Obtener citas conflictivas para UI (opcional)
        const conflicts = await getConflictingAppointments(
          undefined,
          resourceId,
          startTime,
          endTime,
          excludeAppointmentId
        )

        return {
          isAvailable,
          conflictingAppointments: conflicts,
        }
      }

      // Caso 2: Validar disponibilidad de EMPLEADO
      if (employeeId) {
        // Usar función SQL existente o query manual
        const { data: isAvailable, error } = await supabase.rpc('is_employee_available_on_date', {
          p_employee_id: employeeId,
          p_start_time: startTime.toISOString(),
          p_end_time: endTime.toISOString(),
          p_exclude_appointment_id: excludeAppointmentId || null,
        })

        if (error) {
          // Fallback a query manual si RPC no existe
          const conflicts = await getConflictingAppointments(
            employeeId,
            undefined,
            startTime,
            endTime,
            excludeAppointmentId
          )

          return {
            isAvailable: conflicts.length === 0,
            conflictingAppointments: conflicts,
          }
        }

        // RPC exitoso
        const conflicts = isAvailable
          ? []
          : await getConflictingAppointments(
              employeeId,
              undefined,
              startTime,
              endTime,
              excludeAppointmentId
            )

        return {
          isAvailable: isAvailable as boolean,
          conflictingAppointments: conflicts,
        }
      }

      // Esto nunca debería ejecutarse
      throw new Error('Lógica de disponibilidad no definida')
    },
    enabled: enabled && !!startTime && !!endTime && (!!employeeId || !!resourceId),
    staleTime: 30 * 1000, // 30 segundos
    retry: 1,
  })
}

/**
 * Helper: Obtener citas conflictivas (para mostrar en UI)
 */
async function getConflictingAppointments(
  employeeId?: string,
  resourceId?: string,
  startTime?: Date,
  endTime?: Date,
  excludeAppointmentId?: string
) {
  if (!startTime || !endTime) return []

  let query = supabase
    .from('appointments')
    .select(
      `
      id,
      start_time,
      end_time,
      status,
      client:profiles!appointments_client_id_fkey(full_name),
      service:services(name)
    `
    )
    .in('status', ['pending', 'confirmed'])
    .lt('start_time', endTime.toISOString())
    .gt('end_time', startTime.toISOString())

  if (employeeId) {
    query = query.eq('employee_id', employeeId)
  }
  if (resourceId) {
    query = query.eq('resource_id', resourceId)
  }
  if (excludeAppointmentId) {
    query = query.neq('id', excludeAppointmentId)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return (data || []).map((apt: any) => ({
    id: apt.id,
    start_time: apt.start_time,
    end_time: apt.end_time,
    status: apt.status,
    client_name: apt.client?.full_name,
    service_name: apt.service?.name,
  }))
}

/**
 * Variante simplificada: solo retorna boolean
 */
export function useIsAssigneeAvailable(params: UseAssigneeAvailabilityParams) {
  const { data, isLoading } = useAssigneeAvailability(params)

  return {
    isAvailable: data?.isAvailable ?? true, // Default a true mientras carga
    isLoading,
  }
}

/**
 * Variante para validación en tiempo real (AppointmentWizard)
 */
export function useValidateAssigneeSlot({
  employeeId,
  resourceId,
  startTime,
  endTime,
  excludeAppointmentId,
}: UseAssigneeAvailabilityParams) {
  const { data, isLoading, error } = useAssigneeAvailability({
    employeeId,
    resourceId,
    startTime,
    endTime,
    excludeAppointmentId,
    enabled: !!startTime && !!endTime,
  })

  return {
    isValid: data?.isAvailable ?? false,
    conflicts: data?.conflictingAppointments ?? [],
    isValidating: isLoading,
    error: error || null,
  }
}
