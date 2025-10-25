import React from 'react'
import { Button } from '@/components/ui/button'
import { MessageCircle, Calendar, X } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface AppointmentActionsProps {
  status: string
  employeeId?: string
  businessId: string
  appointmentId: string
  appointment?: any
  onStartChat?: (professionalId: string, businessId?: string) => void
  onReschedule?: (appointment?: any) => void
  onCancel?: (appointmentId: string) => void
  onClose: () => void
  isStartingChat?: boolean
}

export function AppointmentActions({
  status,
  employeeId,
  businessId,
  appointmentId,
  appointment,
  onStartChat,
  onReschedule,
  onCancel,
  onClose,
  isStartingChat = false,
}: AppointmentActionsProps) {
  const { t } = useLanguage()

  const canModify = !['completed', 'cancelled', 'no_show'].includes(status)

  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-4">
      {/* Chat button - only show if there's a professional */}
      {employeeId && onStartChat && (
        <Button
          variant="default"
          onClick={() => onStartChat(employeeId, businessId)}
          disabled={isStartingChat}
          className="flex items-center gap-2 min-h-[44px] min-w-[44px] w-full sm:w-auto focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label={t('clientDashboard.chatWithProfessionalAria')}
          title={t('clientDashboard.chatWithProfessional')}
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          {isStartingChat ? t('clientDashboard.chatStarting') : t('clientDashboard.chatWithProfessional')}
        </Button>
      )}

      {/* Reschedule button - only if not completed, cancelled or no_show */}
      {canModify && onReschedule && (
        <Button
          variant="outline"
          onClick={() => onReschedule(appointment)}
          className="flex items-center gap-2 min-h-[44px] min-w-[44px] w-full sm:w-auto focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label={t('clientDashboard.rescheduleAria')}
          title={t('clientDashboard.reschedule')}
        >
          <Calendar className="h-4 w-4" aria-hidden="true" />
          {t('clientDashboard.reschedule')}
        </Button>
      )}

      {/* Cancel button - only if not completed, cancelled or no_show */}
      {canModify && onCancel && (
        <Button
          variant="destructive"
          onClick={() => onCancel(appointmentId)}
          className="flex items-center gap-2 min-h-[44px] min-w-[44px] w-full sm:w-auto focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label={t('clientDashboard.cancelAppointmentAria')}
          title={t('clientDashboard.cancelAppointment')}
        >
          <X className="h-4 w-4" aria-hidden="true" />
          {t('clientDashboard.cancelAppointment')}
        </Button>
      )}

      <Button
        variant="outline"
        onClick={onClose}
        className="ml-auto min-h-[44px] min-w-[44px] w-full sm:w-auto focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label={t('common.actions.close')}
        title={t('common.actions.close')}
      >
        {t('common.actions.close')}
      </Button>
    </div>
  )
}