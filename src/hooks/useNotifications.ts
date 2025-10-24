import { useCallback } from 'react'
import { useKV } from '@/lib/useKV'
import { Appointment, NotificationSettings } from '@/types'
import { toast } from 'sonner'

export function useNotifications() {
  const [settings, setSettings] = useKV<NotificationSettings>('notification-settings', {
    id: 'default',
    userId: 'current-user',
    emailReminders: true,
    reminderTiming: [1440, 60], // 24 hours and 1 hour before
    dailyDigest: true,
    weeklyReport: false,
  })

  const [, setNotificationQueue] = useKV<
    Array<{
      id: string
      appointmentId: string
      scheduledFor: string
      type: 'reminder' | 'digest'
      sent: boolean
    }>
  >('notification-queue', [])

  const scheduleReminder = (appointment: Appointment) => {
    if (!settings.emailReminders) return

    // Handle both old and new date formats
    const appointmentDate = appointment.date || appointment.start_time?.split('T')[0]
    const appointmentTime =
      appointment.startTime ||
      appointment.time ||
      appointment.start_time?.split('T')[1]?.substring(0, 5)

    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`)

    settings.reminderTiming.forEach(minutes => {
      const reminderTime = new Date(appointmentDateTime.getTime() - minutes * 60000)

      setNotificationQueue(current => [
        ...current,
        {
          id: `${appointment.id}-${minutes}`,
          appointmentId: appointment.id,
          scheduledFor: reminderTime.toISOString(),
          type: 'reminder',
          sent: false,
        },
      ])
    })
  }

  const processNotifications = useCallback(
    (appointments: Appointment[]) => {
      const now = new Date()

      setNotificationQueue(current => {
        const updatedQueue = current.map(notification => {
          if (!notification.sent && new Date(notification.scheduledFor) <= now) {
            const appointment = appointments.find(apt => apt.id === notification.appointmentId)

            if (appointment && appointment.status === 'scheduled') {
              // Handle both old and new date formats
              const appointmentDate = appointment.date || appointment.start_time?.split('T')[0]
              const appointmentTime =
                appointment.startTime ||
                appointment.time ||
                appointment.start_time?.split('T')[1]?.substring(0, 5)
              const clientName = appointment.clientName || appointment.client_name

              const timeUntil = Math.round(
                (new Date(`${appointmentDate}T${appointmentTime}`).getTime() - now.getTime()) /
                  (1000 * 60)
              )

              toast.info('Recordatorio de cita', {
                description: `${appointment.title} con ${clientName} en ${timeUntil} minutos`,
                action: {
                  label: 'Ver cita',
                  onClick: () => {
                    // Navigate to appointment details
                  },
                },
              })
            }

            return { ...notification, sent: true }
          }
          return notification
        })

        // Clean up old notifications (older than 24 hours)
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        return updatedQueue.filter(n => new Date(n.scheduledFor) > oneDayAgo)
      })
    },
    [setNotificationQueue]
  )

  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    setSettings(current => ({ ...current, ...newSettings }))
    toast.success('Configuración de notificaciones actualizada')
  }

  return {
    settings,
    updateSettings,
    scheduleReminder,
    processNotifications,
  }
}
