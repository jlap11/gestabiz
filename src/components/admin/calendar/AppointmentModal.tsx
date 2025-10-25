import React, { useState } from 'react'
import { AlertCircle, Check, Clock, DollarSign, User, X } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { toast } from 'sonner'
import { DEFAULT_TIME_ZONE, extractTimeZoneParts } from '@/lib/utils'

interface Appointment {
  id: string
  start_time: string
  end_time: string
  status: string
  service_name: string
  service_price: number
  client_name: string
  employee_id: string
  employee_name: string
  location_id?: string
  notes?: string
}

interface AppointmentModalProps {
  appointment: Appointment | null
  onClose: () => void
  onComplete: (appointmentId: string, tip: number) => void
  onCancel: (appointmentId: string) => void
  onNoShow: (appointmentId: string) => void
}

// Helper para formatear hora en zona horaria de Colombia
const formatTimeInColombia = (isoString: string): string => {
  const date = new Date(isoString)
  const { hour, minute } = extractTimeZoneParts(date, DEFAULT_TIME_ZONE)

  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 === 0 ? 12 : hour % 12

  return `${String(displayHour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${ampm}`
}

export const AppointmentModal = React.memo<AppointmentModalProps>(
  ({ appointment, onClose, onComplete, onCancel, onNoShow }) => {
    const { t } = useLanguage()
    const [tip, setTip] = useState(0)
    const [isProcessing, setIsProcessing] = useState(false)

    if (!appointment) return null

    const handleComplete = async () => {
      if (isProcessing) return
      setIsProcessing(true)
      try {
        await onComplete(appointment.id, tip)
        onClose()
        toast.success(t('admin.appointmentCalendar.appointmentCompleted'))
      } catch (error) {
        toast.error(t('common.messages.updateError'))
      } finally {
        setIsProcessing(false)
      }
    }

    const handleCancel = async () => {
      if (isProcessing) return
      setIsProcessing(true)
      try {
        await onCancel(appointment.id)
        onClose()
        toast.success(t('admin.appointmentCalendar.appointmentCancelled'))
      } catch (error) {
        toast.error(t('common.messages.updateError'))
      } finally {
        setIsProcessing(false)
      }
    }

    const handleNoShow = async () => {
      if (isProcessing) return
      setIsProcessing(true)
      try {
        await onNoShow(appointment.id)
        onClose()
        toast.success(t('admin.appointmentCalendar.appointmentMarkedNoShow'))
      } catch (error) {
        toast.error(t('common.messages.updateError'))
      } finally {
        setIsProcessing(false)
      }
    }

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'confirmed':
          return 'bg-blue-100 text-blue-800 border-blue-200'
        case 'pending':
          return 'bg-yellow-100 text-yellow-800 border-yellow-200'
        case 'completed':
          return 'bg-green-100 text-green-800 border-green-200'
        case 'cancelled':
          return 'bg-red-100 text-red-800 border-red-200'
        case 'no_show':
          return 'bg-gray-100 text-gray-800 border-gray-200'
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200'
      }
    }

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-background border border-border rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">
              {t('admin.appointmentCalendar.appointmentDetails')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-md transition-colors"
              aria-label={t('common.actions.close')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                {appointment.status === 'confirmed' && t('admin.appointmentCalendar.statuses.confirmed')}
                {appointment.status === 'pending' && t('admin.appointmentCalendar.statuses.pending')}
                {appointment.status === 'completed' && t('admin.appointmentCalendar.statuses.completed')}
                {appointment.status === 'cancelled' && t('admin.appointmentCalendar.statuses.cancelled')}
                {appointment.status === 'no_show' && t('admin.appointmentCalendar.statuses.noShow')}
              </span>
            </div>

            {/* Client Info */}
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="p-2 bg-primary/10 rounded-full">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{appointment.client_name}</p>
                <p className="text-sm text-muted-foreground">{t('admin.appointmentCalendar.client')}</p>
              </div>
            </div>

            {/* Service Info */}
            <div className="space-y-2">
              <h3 className="font-medium text-foreground">{t('admin.appointmentCalendar.serviceDetails')}</h3>
              <div className="p-3 bg-muted/30 rounded-lg space-y-2">
                <p className="font-medium">{appointment.service_name}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    {formatTimeInColombia(appointment.start_time)} - {formatTimeInColombia(appointment.end_time)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>${appointment.service_price.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Employee Info */}
            <div className="space-y-2">
              <h3 className="font-medium text-foreground">{t('admin.appointmentCalendar.employee')}</h3>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="font-medium">{appointment.employee_name}</p>
              </div>
            </div>

            {/* Notes */}
            {appointment.notes && (
              <div className="space-y-2">
                <h3 className="font-medium text-foreground">{t('admin.appointmentCalendar.notes')}</h3>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">{appointment.notes}</p>
                </div>
              </div>
            )}

            {/* Tip Input for Completion */}
            {appointment.status === 'confirmed' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  {t('admin.appointmentCalendar.tipAmount')} (opcional)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="number"
                    value={tip}
                    onChange={(e) => setTip(Number(e.target.value) || 0)}
                    className="w-full pl-10 pr-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          {appointment.status === 'confirmed' && (
            <div className="p-4 border-t border-border space-y-2">
              <button
                onClick={handleComplete}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md transition-colors"
              >
                <Check className="h-4 w-4" />
                {isProcessing ? t('common.actions.processing') : t('admin.appointmentCalendar.completeButton')}
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCancel}
                  disabled={isProcessing}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md transition-colors"
                >
                  <X className="h-4 w-4" />
                  {t('admin.appointmentCalendar.cancelButton')}
                </button>
                
                <button
                  onClick={handleNoShow}
                  disabled={isProcessing}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md transition-colors"
                >
                  <AlertCircle className="h-4 w-4" />
                  {t('admin.appointmentCalendar.noShowButton')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
)

AppointmentModal.displayName = 'AppointmentModal'