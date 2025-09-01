import { GoogleCalendarEvent, CalendarSyncSettings, Appointment } from '@/types'

const GOOGLE_OAUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
const GOOGLE_CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3'

export class GoogleCalendarService {
  private static instance: GoogleCalendarService
  private accessToken: string | null = null
  private refreshToken: string | null = null

  static getInstance(): GoogleCalendarService {
    if (!GoogleCalendarService.instance) {
      GoogleCalendarService.instance = new GoogleCalendarService()
    }
    return GoogleCalendarService.instance
  }

  // Allow external hooks to set the access token retrieved elsewhere
  setAccessToken(token: string | null) {
    this.accessToken = token
  }

  async authenticate(): Promise<string> {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) {
      throw new Error('Google Client ID not configured')
    }

    const redirectUri = `${window.location.origin}/auth/google/callback`
    const scopes = 'https://www.googleapis.com/auth/calendar'
    
    const authUrl = `${GOOGLE_OAUTH_ENDPOINT}?` + new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes,
      access_type: 'offline',
      prompt: 'consent'
    }).toString()

    window.location.href = authUrl
    return authUrl
  }

  async exchangeCodeForToken(code: string): Promise<void> {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    const clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured')
    }

    const redirectUri = `${window.location.origin}/auth/google/callback`

    const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to exchange code for token: ${error}`)
    }

    const data = await response.json()
    this.accessToken = data.access_token
    this.refreshToken = data.refresh_token
  }

  async refreshAccessToken(): Promise<string> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available')
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    const clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured')
    }

    const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: this.refreshToken,
        grant_type: 'refresh_token'
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to refresh token: ${error}`)
    }

    const data = await response.json()
    this.accessToken = data.access_token
    return data.access_token
  }

  async getCalendars(): Promise<Array<{ id: string; summary?: string; primary?: boolean }>> {
    if (!this.accessToken) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(`${GOOGLE_CALENDAR_API_BASE}/users/me/calendarList`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch calendars')
    }

  const data = await response.json()
  return (data.items || []) as Array<{ id: string; summary?: string; primary?: boolean }>
  }

  async getEvents(calendarId: string, timeMin?: string, timeMax?: string): Promise<GoogleCalendarEvent[]> {
    if (!this.accessToken) {
      throw new Error('Not authenticated')
    }

    const params = new URLSearchParams({
      singleEvents: 'true',
      orderBy: 'startTime'
    })

    if (timeMin) params.append('timeMin', timeMin)
    if (timeMax) params.append('timeMax', timeMax)

    const response = await fetch(
      `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch events')
    }

    const data = await response.json()
    return data.items || []
  }

  async createEvent(calendarId: string, event: GoogleCalendarEvent): Promise<GoogleCalendarEvent> {
    if (!this.accessToken) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(`${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    })

    if (!response.ok) {
      throw new Error('Failed to create event')
    }

  return response.json()
  }

  async updateEvent(calendarId: string, eventId: string, event: GoogleCalendarEvent): Promise<GoogleCalendarEvent> {
    if (!this.accessToken) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(`${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    })

    if (!response.ok) {
      throw new Error('Failed to update event')
    }

  return response.json()
  }

  async deleteEvent(calendarId: string, eventId: string): Promise<void> {
    if (!this.accessToken) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(`${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to delete event')
    }
  }

  // Sync appointments to Google Calendar
  async syncAppointments(appointments: Appointment[], settings: CalendarSyncSettings): Promise<void> {
    if (!this.accessToken) {
      throw new Error('Not authenticated')
    }

  const { calendar_id, enabled } = settings

  if (!enabled || !calendar_id) {
  // Calendar sync disabled or no calendar selected
      return
    }

    for (const appointment of appointments) {
      try {
        const event = this.convertAppointmentToEvent(appointment)
        
        if (appointment.google_calendar_event_id) {
          // Update existing event
          await this.updateEvent(calendar_id, appointment.google_calendar_event_id, event)
        } else {
          // Create new event
          await this.createEvent(calendar_id, event)
        }
      } catch {
        // Best-effort sync; ignore single item failure
        // Optionally collect errors for reporting in calling layer
        // noop
      }
    }
  }

  private convertAppointmentToEvent(appointment: Appointment): GoogleCalendarEvent {
    return {
      summary: appointment.title,
      description: appointment.description || '',
      start: {
        dateTime: appointment.start_time,
        timeZone: 'America/New_York'
      },
      end: {
        dateTime: appointment.end_time,
        timeZone: 'America/New_York'
      },
      attendees: appointment.client_email ? [
        {
          email: appointment.client_email,
          displayName: appointment.client_name
        }
      ] : []
    }
  }

  isAuthenticated(): boolean {
    return !!this.accessToken
  }

  signOut(): void {
    this.accessToken = null
    this.refreshToken = null
  }

  appointmentToGoogleEvent(appointment: Appointment, timezone: string = 'America/New_York'): GoogleCalendarEvent {
    return {
      summary: appointment.title,
      description: appointment.description || '',
      start: {
        dateTime: appointment.start_time,
        timeZone: timezone
      },
      end: {
        dateTime: appointment.end_time,
        timeZone: timezone
      },
      attendees: appointment.client_email ? [
        {
          email: appointment.client_email,
          displayName: appointment.client_name
        }
      ] : [],
      extendedProperties: {
        private: {
          source: 'AppointmentPro',
          appointmentId: appointment.id
        }
      }
    }
  }

  googleEventToAppointment(event: GoogleCalendarEvent, userId: string): Partial<Appointment> {
    return {
      id: crypto.randomUUID(),
      user_id: userId,
  business_id: userId,
      title: event.summary || 'Imported Event',
      description: event.description || '',
      start_time: event.start.dateTime || event.start.date + 'T00:00:00',
      end_time: event.end.dateTime || event.end.date + 'T23:59:59',
      status: 'confirmed',
      client_name: event.attendees?.[0]?.displayName || 'Unknown Client',
      client_email: event.attendees?.[0]?.email || '',
      client_phone: '',
      location: event.location || '',
  service_id: undefined,
      notes: event.description || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }
}

// Export both the class and a singleton instance
export const googleCalendarService = GoogleCalendarService.getInstance()