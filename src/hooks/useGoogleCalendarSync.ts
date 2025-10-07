import { useState, useCallback } from 'react'
import { useKV } from '@/lib/useKV'
import { toast } from 'sonner'
import { googleCalendarService } from '@/lib/googleCalendar'
import { CalendarSyncSettings, Appointment, User } from '@/types'

export function useGoogleCalendarSync(user: User | null) {
  const [syncSettings, setSyncSettings] = useKV<CalendarSyncSettings | null>(
    user ? `calendar-sync-${user.id}` : 'calendar-sync-default',
    null
  )
  const [appointments, setAppointments] = useKV<Appointment[]>(
    user ? `appointments-${user.id}` : 'appointments-default',
    []
  )
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  const connectGoogleCalendar = useCallback(async () => {
    if (!user) {
      toast.error('User not authenticated')
      return
    }

    setIsConnecting(true)
    try {
      const accessToken = await googleCalendarService.authenticate()
      
      // Get user's calendars to let them choose which one to sync
      const calendars = await googleCalendarService.getCalendars()
      const primaryCalendar = calendars.find(cal => cal.primary) || calendars[0]

      if (!primaryCalendar) {
        throw new Error('No calendars found')
      }

      const newSyncSettings: CalendarSyncSettings = {
        id: crypto.randomUUID(),
        user_id: user.id,
        provider: 'google',
        enabled: true,
        calendar_id: primaryCalendar.id,
        access_token: accessToken,
        refresh_token: '', // Will be updated when we implement proper OAuth flow
        sync_direction: 'both',
        auto_sync: true,
        last_sync: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      setSyncSettings(newSyncSettings)
      toast.success('Google Calendar connected successfully!')
      
      // Perform initial sync
      await syncWithGoogleCalendar()
      
    } catch (error) {
      toast.error('Failed to connect Google Calendar')
      throw error
    } finally {
      setIsConnecting(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, setSyncSettings])

  const disconnectGoogleCalendar = useCallback(async () => {
    setSyncSettings(null)
    toast.success('Google Calendar disconnected')
  }, [setSyncSettings])

  const syncWithGoogleCalendar = useCallback(async () => {
    if (!(user && syncSettings?.enabled)) {
      return
    }

    setIsSyncing(true)
    try {
      googleCalendarService.setAccessToken(syncSettings.access_token)

      // Sync based on direction setting
      if (syncSettings.sync_direction === 'export_only' || syncSettings.sync_direction === 'both') {
        await exportAppointmentsToGoogle()
      }

      if (syncSettings.sync_direction === 'import_only' || syncSettings.sync_direction === 'both') {
        await importEventsFromGoogle()
      }

      // Update last sync time
      setSyncSettings({
        ...syncSettings,
        last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

      toast.success('Calendar sync completed')
    } catch (error) {
      toast.error('Calendar sync failed')
      throw error
    } finally {
      setIsSyncing(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, syncSettings, setSyncSettings])

  const exportAppointmentsToGoogle = useCallback(async () => {
    if (!syncSettings) return

    const results = await Promise.allSettled(
      appointments.map(async (appointment) => {
        const existingEvents = await googleCalendarService.getEvents(
          syncSettings.calendar_id,
          appointment.start_time,
          appointment.end_time
        )

        const existingEvent = existingEvents.find(event => 
          event.extendedProperties?.private?.appointmentId === appointment.id
        )

        const googleEvent = googleCalendarService.appointmentToGoogleEvent(
          appointment,
          user?.timezone || 'America/New_York'
        )

        if (existingEvent) {
          await googleCalendarService.updateEvent(
            syncSettings.calendar_id,
            existingEvent.id!,
            googleEvent
          )
        } else {
          await googleCalendarService.createEvent(syncSettings.calendar_id, googleEvent)
        }
      })
    )

    const failed = results.filter(r => r.status === 'rejected').length
    if (failed > 0) {
      toast.info(`Some events couldn't be synced (${failed}). They'll retry on next sync.`)
    }
  }, [appointments, syncSettings, user])

  const importEventsFromGoogle = useCallback(async () => {
    if (!syncSettings || !user) return

    // Get events from the last 30 days and next 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    const events = await googleCalendarService.getEvents(
      syncSettings.calendar_id,
      thirtyDaysAgo,
      thirtyDaysFromNow
    )

    const newAppointments: Appointment[] = []

    for (const event of events) {
      // Skip events that originated from our app
      if (event.extendedProperties?.private?.source === 'Bookio') {
        continue
      }

      // Check if we already have this event as an appointment
      const existingAppointment = appointments.find(apt => 
        apt.start_time === event.start.dateTime &&
        apt.end_time === event.end.dateTime &&
        apt.title === event.summary
      )

      if (!existingAppointment) {
        const newAppointment = googleCalendarService.googleEventToAppointment(event, user.id)
        newAppointments.push(newAppointment as Appointment)
      }
    }

    if (newAppointments.length > 0) {
      setAppointments(prev => [...prev, ...newAppointments])
      toast.success(`Imported ${newAppointments.length} events from Google Calendar`)
    }
  }, [syncSettings, user, appointments, setAppointments])

  const updateSyncSettings = useCallback((updates: Partial<CalendarSyncSettings>) => {
    if (!syncSettings) return

    setSyncSettings({
      ...syncSettings,
      ...updates,
      updated_at: new Date().toISOString()
    })
  }, [syncSettings, setSyncSettings])

  const syncSingleAppointment = useCallback(async (appointment: Appointment) => {
    if (!syncSettings?.enabled) {
      return
    }

    try {
      googleCalendarService.setAccessToken(syncSettings.access_token)
      
      const googleEvent = googleCalendarService.appointmentToGoogleEvent(
        appointment,
        user?.timezone || 'America/New_York'
      )

      // Check if event already exists in Google Calendar
      const existingEvents = await googleCalendarService.getEvents(
        syncSettings.calendar_id,
        appointment.start_time,
        appointment.end_time
      )

      const existingEvent = existingEvents.find(event => 
        event.extendedProperties?.private?.appointmentId === appointment.id
      )

      if (existingEvent) {
        await googleCalendarService.updateEvent(
          syncSettings.calendar_id,
          existingEvent.id!,
          googleEvent
        )
      } else {
        await googleCalendarService.createEvent(syncSettings.calendar_id, googleEvent)
      }

      toast.success('Appointment synced to Google Calendar')
    } catch (error) {
      toast.error('Failed to sync appointment to Google Calendar')
      // rethrow so caller may handle (e.g., show non-blocking notice)
      throw error
    }
  }, [syncSettings, user])

  const deleteSyncedAppointment = useCallback(async (appointment: Appointment) => {
    if (!syncSettings?.enabled) {
      return
    }

    try {
      googleCalendarService.setAccessToken(syncSettings.access_token)
      
      // Find the Google Calendar event
      const existingEvents = await googleCalendarService.getEvents(
        syncSettings.calendar_id,
        appointment.start_time,
        appointment.end_time
      )

      const existingEvent = existingEvents.find(event => 
        event.extendedProperties?.private?.appointmentId === appointment.id
      )

      if (existingEvent) {
        await googleCalendarService.deleteEvent(syncSettings.calendar_id, existingEvent.id!)
        toast.success('Appointment removed from Google Calendar')
      }
    } catch (error) {
      toast.error('Failed to remove appointment from Google Calendar')
      // rethrow for upstream handling/telemetry
      throw error
    }
  }, [syncSettings])

  return {
    syncSettings,
    isConnected: !!syncSettings?.enabled,
    isConnecting,
    isSyncing,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    syncWithGoogleCalendar,
    updateSyncSettings,
    syncSingleAppointment,
    deleteSyncedAppointment
  }
}