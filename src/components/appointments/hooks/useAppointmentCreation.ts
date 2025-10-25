import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAnalytics } from '@/hooks/useAnalytics'
import { DEFAULT_TIME_ZONE, localTimeInTZToUTC } from '@/lib/utils'
import supabase from '@/lib/supabase'
import { toast } from 'sonner'
import type { Appointment } from '@/types/types'
import type { WizardData } from './useAppointmentWizardState'

interface UseAppointmentCreationProps {
  wizardData: WizardData
  userId?: string
  appointmentToEdit?: Appointment | null
  onSuccess?: () => void
  setIsSubmitting: (loading: boolean) => void
}

export function useAppointmentCreation({
  wizardData,
  userId,
  appointmentToEdit,
  onSuccess,
  setIsSubmitting,
}: UseAppointmentCreationProps) {
  const { t } = useLanguage()
  const analytics = useAnalytics()

  const createAppointment = async (): Promise<boolean> => {
    if (
      !wizardData.businessId ||
      !wizardData.serviceId ||
      !wizardData.date ||
      !wizardData.startTime
    ) {
      toast.error(t('appointments.wizard_errors.missingRequiredData'))
      return false
    }

    if (!userId) {
      toast.error(t('appointments.wizard_errors.mustLogin'))
      return false
    }

    setIsSubmitting(true)

    try {
      // Procesar tiempo
      const timeRegex = /^(\d{1,2}):(\d{2})\s(AM|PM)$/i
      const timeMatch = wizardData.startTime.match(timeRegex)

      if (!timeMatch) {
        throw new Error(`Formato de hora inválido: ${wizardData.startTime}`)
      }

      const [, hourStr, minuteStr, meridiem] = timeMatch
      let hourNum = Number.parseInt(hourStr, 10)
      const minuteNum = Number.parseInt(minuteStr, 10)

      // Convertir formato 12h a 24h
      if (meridiem.toUpperCase() === 'PM' && hourNum !== 12) {
        hourNum += 12
      } else if (meridiem.toUpperCase() === 'AM' && hourNum === 12) {
        hourNum = 0
      }

      // Obtener la fecha seleccionada en componentes locales
      const year = wizardData.date.getFullYear()
      const month = wizardData.date.getMonth()
      const day = wizardData.date.getDate()

      // Crear timestamp respetando zona horaria configurada
      const utcTime = localTimeInTZToUTC(year, month, day, hourNum, minuteNum, DEFAULT_TIME_ZONE)

      // Calcular hora de fin
      const duration = wizardData.service?.duration || 60
      const endDateTime = new Date(utcTime)
      endDateTime.setMinutes(endDateTime.getMinutes() + duration)

      // Crear objeto de cita
      const finalBusinessId = wizardData.employeeBusinessId || wizardData.businessId

      const appointmentData = {
        client_id: userId,
        business_id: finalBusinessId,
        service_id: wizardData.serviceId,
        location_id: wizardData.locationId,
        employee_id: wizardData.employeeId || null,
        resource_id: wizardData.resourceId || null,
        start_time: utcTime.toISOString(),
        end_time: endDateTime.toISOString(),
        status: 'pending' as const,
        notes: wizardData.notes || null,
        updated_at: new Date().toISOString(),
      }

      if (appointmentToEdit) {
        // MODO EDICIÓN
        const { error } = await supabase
          .from('appointments')
          .update(appointmentData)
          .eq('id', appointmentToEdit.id)
          .select()
          .single()

        if (error) {
          toast.error(`${t('appointments.wizard_errors.errorModifying')}: ${error.message}`)
          return false
        }

        toast.success(t('appointments.wizard_success.modified'))
      } else {
        // MODO CREACIÓN
        const appointmentDataWithCreatedAt = {
          ...appointmentData,
          created_at: new Date().toISOString(),
        }

        const { error } = await supabase
          .from('appointments')
          .insert(appointmentDataWithCreatedAt)
          .select()
          .single()

        if (error) {
          toast.error(`${t('appointments.wizard_errors.errorCreating')}: ${error.message}`)
          return false
        }

        // Track booking completed
        analytics.trackBookingCompleted({
          businessId: finalBusinessId || '',
          businessName: wizardData.business?.name || wizardData.employeeBusiness?.name,
          serviceId: wizardData.serviceId || '',
          serviceName: wizardData.service?.name,
          employeeId: wizardData.employeeId || undefined,
          employeeName: wizardData.employee?.full_name || undefined,
          locationId: wizardData.locationId || undefined,
          amount: wizardData.service?.price,
          currency: 'COP',
          duration: wizardData.service?.duration || 60,
        })

        toast.success(t('appointments.wizard_success.created'))
      }

      if (onSuccess) {
        onSuccess()
      }

      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error inesperado'
      const errorKey = appointmentToEdit ? 'errorModifying' : 'errorCreating'
      const errorMessage = t('appointments.wizard_errors.' + errorKey)
      toast.error(`${errorMessage}: ${message}`)
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    createAppointment,
  }
}