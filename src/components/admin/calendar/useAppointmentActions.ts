import { useCallback } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export const useAppointmentActions = (fetchAppointments: () => Promise<void>) => {
  const { t } = useLanguage()

  const handleCompleteAppointment = useCallback(async (appointmentId: string, tip: number) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status: 'completed',
          tip_amount: tip > 0 ? tip : null
        })
        .eq('id', appointmentId)

      if (error) throw error

      toast.success(t('admin.appointmentCalendar.appointmentCompleted'))
      fetchAppointments()
    } catch (error) {
      console.error('Error completing appointment:', error)
      toast.error(t('admin.appointmentCalendar.errorCompletingAppointment'))
    }
  }, [t, fetchAppointments])

  const handleCancelAppointment = useCallback(async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId)

      if (error) throw error

      toast.success(t('admin.appointmentCalendar.appointmentCancelled'))
      fetchAppointments()
    } catch (error) {
      console.error('Error cancelling appointment:', error)
      toast.error(t('admin.appointmentCalendar.errorCancellingAppointment'))
    }
  }, [t, fetchAppointments])

  const handleNoShowAppointment = useCallback(async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'no_show' })
        .eq('id', appointmentId)

      if (error) throw error

      toast.success(t('admin.appointmentCalendar.appointmentMarkedNoShow'))
      fetchAppointments()
    } catch (error) {
      console.error('Error marking appointment as no show:', error)
      toast.error(t('admin.appointmentCalendar.errorMarkingNoShow'))
    }
  }, [t, fetchAppointments])

  return {
    handleCompleteAppointment,
    handleCancelAppointment,
    handleNoShowAppointment,
  }
}