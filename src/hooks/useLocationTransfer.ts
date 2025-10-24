/**
 * useLocationTransfer
 *
 * Hook para gestionar traslados programados de empleados entre sedes
 *
 * Funcionalidades:
 * - Programar traslado con período de preaviso
 * - Obtener impacto (citas a mantener/cancelar)
 * - Cancelar traslado programado
 * - Obtener estado actual de traslado
 */

import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface TransferImpact {
  appointmentsToKeep: number
  appointmentsToCancel: number
  effectiveDate: string
}

interface TransferStatus {
  status: 'pending' | 'completed' | 'cancelled' | null
  fromLocationId: string | null
  toLocationId: string | null
  effectiveDate: string | null
  noticePeriodDays: number | null
  scheduledAt: string | null
}

interface UseLocationTransferReturn {
  scheduleTransfer: (
    businessId: string,
    employeeId: string,
    toLocationId: string,
    effectiveDate: Date,
    noticePeriodDays: number
  ) => Promise<{ success: boolean; impact?: TransferImpact }>
  cancelTransfer: (businessId: string, employeeId: string) => Promise<boolean>
  getTransferImpact: (
    businessEmployeeId: string,
    effectiveDate: Date
  ) => Promise<TransferImpact | null>
  getTransferStatus: (businessId: string, employeeId: string) => Promise<TransferStatus | null>
  isLoading: boolean
}

export function useLocationTransfer(): UseLocationTransferReturn {
  const [isLoading, setIsLoading] = useState(false)

  /**
   * Obtener impacto de traslado (cuántas citas se mantienen/cancelan)
   */
  const getTransferImpact = useCallback(
    async (businessEmployeeId: string, effectiveDate: Date): Promise<TransferImpact | null> => {
      try {
        setIsLoading(true)

        // Llamar a función RPC en Supabase
        const { data, error } = await supabase.rpc('get_transfer_impact', {
          p_business_employee_id: businessEmployeeId,
          p_effective_date: effectiveDate.toISOString(),
        })

        if (error) {
          console.error('Error al obtener impacto de traslado:', error)
          return null
        }

        return {
          appointmentsToKeep: data.appointments_to_keep,
          appointmentsToCancel: data.appointments_to_cancel,
          effectiveDate: data.effective_date,
        }
      } catch (error) {
        console.error('Error en getTransferImpact:', error)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  /**
   * Programar traslado de empleado a nueva sede
   */
  const scheduleTransfer = useCallback(
    async (
      businessId: string,
      employeeId: string,
      toLocationId: string,
      effectiveDate: Date,
      noticePeriodDays: number
    ): Promise<{ success: boolean; impact?: TransferImpact }> => {
      try {
        setIsLoading(true)

        // 1. Obtener business_employee_id y location_id actual
        const { data: employeeData, error: employeeError } = await supabase
          .from('business_employees')
          .select('id, location_id, transfer_status')
          .eq('employee_id', employeeId)
          .eq('business_id', businessId)
          .single()

        if (employeeError || !employeeData) {
          toast.error('No se pudo encontrar el empleado')
          return { success: false }
        }

        // Validar que no tenga traslado pendiente
        if (employeeData.transfer_status === 'pending') {
          toast.error('Ya tienes un traslado programado. Cancélalo primero.')
          return { success: false }
        }

        // Validar que la sede destino sea diferente a la actual
        if (employeeData.location_id === toLocationId) {
          toast.error('La sede de destino es la misma que la actual')
          return { success: false }
        }

        // 2. Obtener impacto del traslado
        const impact = await getTransferImpact(employeeData.id, effectiveDate)

        if (!impact) {
          toast.error('Error al calcular el impacto del traslado')
          return { success: false }
        }

        // 3. Actualizar registro con datos de traslado
        const { error: updateError } = await supabase
          .from('business_employees')
          .update({
            transfer_from_location_id: employeeData.location_id,
            transfer_to_location_id: toLocationId,
            transfer_effective_date: effectiveDate.toISOString(),
            transfer_notice_period_days: noticePeriodDays,
            transfer_scheduled_at: new Date().toISOString(),
            transfer_scheduled_by: employeeId,
            transfer_status: 'pending',
          })
          .eq('id', employeeData.id)

        if (updateError) {
          console.error('Error al programar traslado:', updateError)
          toast.error('Error al programar el traslado')
          return { success: false }
        }

        // 4. Llamar Edge Function para cancelar citas futuras
        const { data: functionData } = await supabase.functions.invoke(
          'cancel-future-appointments-on-transfer',
          {
            body: {
              businessEmployeeId: employeeData.id,
              effectiveDate: effectiveDate.toISOString(),
              employeeId,
            },
          }
        )

        console.log('🔄 Resultado cancelación de citas:', functionData)

        toast.success(
          `Traslado programado exitosamente. ${impact.appointmentsToCancel} citas canceladas.`
        )

        return { success: true, impact }
      } catch (error) {
        console.error('Error en scheduleTransfer:', error)
        toast.error('Error al programar el traslado')
        return { success: false }
      } finally {
        setIsLoading(false)
      }
    },
    [getTransferImpact]
  )

  /**
   * Cancelar traslado programado
   */
  const cancelTransfer = useCallback(
    async (businessId: string, employeeId: string): Promise<boolean> => {
      try {
        setIsLoading(true)

        // 1. Obtener business_employee_id
        const { data: employeeData, error: employeeError } = await supabase
          .from('business_employees')
          .select('id, transfer_status')
          .eq('employee_id', employeeId)
          .eq('business_id', businessId)
          .single()

        if (employeeError || !employeeData) {
          toast.error('No se pudo encontrar el empleado')
          return false
        }

        // Validar que tenga traslado pendiente
        if (employeeData.transfer_status !== 'pending') {
          toast.error('No tienes un traslado programado para cancelar')
          return false
        }

        // 2. Actualizar registro limpiando campos de traslado
        const { error: updateError } = await supabase
          .from('business_employees')
          .update({
            transfer_from_location_id: null,
            transfer_to_location_id: null,
            transfer_effective_date: null,
            transfer_notice_period_days: null,
            transfer_scheduled_at: null,
            transfer_scheduled_by: null,
            transfer_status: 'cancelled',
          })
          .eq('id', employeeData.id)

        if (updateError) {
          console.error('Error al cancelar traslado:', updateError)
          toast.error('Error al cancelar el traslado')
          return false
        }

        toast.success('Traslado cancelado exitosamente')
        return true
      } catch (error) {
        console.error('Error en cancelTransfer:', error)
        toast.error('Error al cancelar el traslado')
        return false
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  /**
   * Obtener estado actual del traslado
   */
  const getTransferStatus = useCallback(
    async (businessId: string, employeeId: string): Promise<TransferStatus | null> => {
      try {
        const { data, error } = await supabase
          .from('business_employees')
          .select(
            'transfer_status, transfer_from_location_id, transfer_to_location_id, transfer_effective_date, transfer_notice_period_days, transfer_scheduled_at'
          )
          .eq('employee_id', employeeId)
          .eq('business_id', businessId)
          .single()

        if (error || !data) {
          console.error('Error al obtener estado de traslado:', error)
          return null
        }

        return {
          status: data.transfer_status,
          fromLocationId: data.transfer_from_location_id,
          toLocationId: data.transfer_to_location_id,
          effectiveDate: data.transfer_effective_date,
          noticePeriodDays: data.transfer_notice_period_days,
          scheduledAt: data.transfer_scheduled_at,
        }
      } catch (error) {
        console.error('Error en getTransferStatus:', error)
        return null
      }
    },
    []
  )

  return {
    scheduleTransfer,
    cancelTransfer,
    getTransferImpact,
    getTransferStatus,
    isLoading,
  }
}
