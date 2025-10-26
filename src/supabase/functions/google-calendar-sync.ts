// Supabase Edge Function: Google Calendar Sync
// Deploy with: supabase functions deploy google-calendar-sync

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GOOGLE_CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3'

interface GoogleCalendarEvent {
  id?: string
  summary: string
  description?: string
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  location?: string
  attendees?: Array<{
    email: string
    displayName?: string
  }>
  extendedProperties?: {
    private?: {
      appointmentId?: string
      source?: string
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId, direction = 'both' } = await req.json()

    if (!userId) {
      throw new Error('User ID is required')
    }

    // Get user's calendar sync settings
    const { data: syncSettings, error: syncError } = await supabaseClient
      .from('calendar_sync_settings')
      .select('*')
      .eq('user_id', userId)
      .eq('enabled', true)
      .single()

    if (syncError || !syncSettings) {
      throw new Error('Calendar sync not enabled or configured for this user')
    }

    // Check if token needs refresh
    let accessToken = syncSettings.access_token
    if (syncSettings.token_expires_at && new Date(syncSettings.token_expires_at) <= new Date()) {
      accessToken = await refreshGoogleToken(syncSettings.refresh_token)
      
      // Update the access token in database
      await supabaseClient
        .from('calendar_sync_settings')
        .update({
          access_token: accessToken,
          token_expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
        })
        .eq('id', syncSettings.id)
    }

    const results = {
      exported: 0,
      imported: 0,
      conflicts: 0,
      errors: []
    }

    // Export appointments to Google Calendar
    if (direction === 'both' || direction === 'export_only') {
      try {
        const exportResult = await exportAppointmentsToGoogle(
          supabaseClient,
          userId,
          syncSettings.calendar_id,
          accessToken
        )
        results.exported = exportResult.count
        results.errors = [...results.errors, ...exportResult.errors]
      } catch (error) {
        results.errors.push(`Export failed: ${error.message}`)
      }
    }

    // Import events from Google Calendar
    if (direction === 'both' || direction === 'import_only') {
      try {
        const importResult = await importEventsFromGoogle(
          supabaseClient,
          userId,
          syncSettings.calendar_id,
          accessToken
        )
        results.imported = importResult.count
        results.conflicts = importResult.conflicts
        results.errors = [...results.errors, ...importResult.errors]
      } catch (error) {
        results.errors.push(`Import failed: ${error.message}`)
      }
    }

    // Update sync settings
    const updateData: any = {
      last_sync: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (results.errors.length > 0) {
      updateData.sync_errors = results.errors.slice(-5) // Keep last 5 errors
    } else {
      updateData.sync_errors = []
    }

    await supabaseClient
      .from('calendar_sync_settings')
      .update(updateData)
      .eq('id', syncSettings.id)

    return new Response(
      JSON.stringify({
        success: true,
        results,
        message: `Sync completed: ${results.exported} exported, ${results.imported} imported, ${results.conflicts} conflicts`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Google Calendar sync error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

async function refreshGoogleToken(refreshToken: string): Promise<string> {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  })

  if (!response.ok) {
    throw new Error('Failed to refresh Google access token')
  }

  const data = await response.json()
  return data.access_token
}

async function exportAppointmentsToGoogle(
  supabaseClient: any,
  userId: string,
  calendarId: string,
  accessToken: string
) {
  // Get appointments that need to be synced
  const { data: appointments, error } = await supabaseClient
    .from('appointments')
    .select('*')
    .eq('user_id', userId)
    .gte('start_time', new Date().toISOString()) // Only future appointments
    .eq('status', 'scheduled')

  if (error) {
    throw new Error(`Failed to fetch appointments: ${error.message}`)
  }

  let count = 0
  const errors = []

  for (const appointment of appointments) {
    try {
      const googleEvent: GoogleCalendarEvent = {
        summary: appointment.title,
        description: [
          appointment.description,
          appointment.notes ? `\nNotes: ${appointment.notes}` : '',
          `\nClient: ${appointment.client_name}`,
          appointment.client_email ? `Email: ${appointment.client_email}` : '',
          appointment.client_phone ? `Phone: ${appointment.client_phone}` : ''
        ].filter(Boolean).join('\n'),
        start: {
          dateTime: appointment.start_time,
          timeZone: 'America/New_York' // Should come from user settings
        },
        end: {
          dateTime: appointment.end_time,
          timeZone: 'America/New_York'
        },
        location: appointment.location,
        attendees: appointment.client_email ? [{
          email: appointment.client_email,
          displayName: appointment.client_name
        }] : undefined,
        extendedProperties: {
          private: {
            appointmentId: appointment.id,
            source: 'Gestabiz'
          }
        }
      }

      let googleEventId = appointment.google_calendar_event_id

      if (googleEventId) {
        // Update existing event
        const response = await fetch(
          `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(googleEvent)
          }
        )

        if (!response.ok && response.status !== 404) {
          const error = await response.json()
          throw new Error(`Failed to update event: ${error.error?.message}`)
        }

        if (response.status === 404) {
          // Event was deleted from Google Calendar, create new one
          googleEventId = null
        }
      }

      if (!googleEventId) {
        // Create new event
        const response = await fetch(
          `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(googleEvent)
          }
        )

        if (!response.ok) {
          const error = await response.json()
          throw new Error(`Failed to create event: ${error.error?.message}`)
        }

        const createdEvent = await response.json()
        googleEventId = createdEvent.id

        // Update appointment with Google Calendar event ID
        await supabaseClient
          .from('appointments')
          .update({ google_calendar_event_id: googleEventId })
          .eq('id', appointment.id)
      }

      count++
    } catch (error) {
      errors.push(`Appointment ${appointment.id}: ${error.message}`)
    }
  }

  return { count, errors }
}

async function importEventsFromGoogle(
  supabaseClient: any,
  userId: string,
  calendarId: string,
  accessToken: string
) {
  // Get events from Google Calendar
  const timeMin = new Date().toISOString()
  const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime'
  })

  const response = await fetch(
    `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to fetch Google Calendar events: ${error.error?.message}`)
  }

  const data = await response.json()
  const events = data.items || []

  let count = 0
  let conflicts = 0
  const errors = []

  for (const event of events) {
    try {
      // Skip events that originated from our app
      if (event.extendedProperties?.private?.source === 'Gestabiz') {
        continue
      }

      // Check if we already have this event as an appointment
      const { data: existingAppointment } = await supabaseClient
        .from('appointments')
        .select('id')
        .eq('user_id', userId)
        .eq('google_calendar_event_id', event.id)
        .single()

      if (existingAppointment) {
        continue // Already imported
      }

      // Check for time conflicts
      const { data: conflictingAppointments } = await supabaseClient
        .from('appointments')
        .select('id')
        .eq('user_id', userId)
        .gte('start_time', event.start.dateTime)
        .lte('end_time', event.end.dateTime)
        .eq('status', 'scheduled')

      if (conflictingAppointments && conflictingAppointments.length > 0) {
        // Create conflict record
        await supabaseClient
          .from('sync_conflicts')
          .insert({
            user_id: userId,
            calendar_event_id: event.id,
            conflict_type: 'time_conflict',
            remote_data: event,
            created_at: new Date().toISOString()
          })

        conflicts++
        continue
      }

      // Extract client info from event
      const attendee = event.attendees?.[0]
      const description = event.description || ''
      
      const clientMatch = description.match(/Client:\s*(.+?)(?:\n|$)/)
      const emailMatch = description.match(/Email:\s*(.+?)(?:\n|$)/)
      const phoneMatch = description.match(/Phone:\s*(.+?)(?:\n|$)/)
      const notesMatch = description.match(/Notes:\s*(.+?)(?:\n|$)/)

      // Create new appointment
      const newAppointment = {
        id: crypto.randomUUID(),
        user_id: userId,
        title: event.summary || 'Imported from Google Calendar',
        description: event.description,
        client_name: clientMatch?.[1] || attendee?.displayName || 'Google Calendar Client',
        client_email: emailMatch?.[1] || attendee?.email,
        client_phone: phoneMatch?.[1],
        start_time: event.start.dateTime,
        end_time: event.end.dateTime,
        status: 'scheduled',
        location: event.location,
        notes: notesMatch?.[1],
        google_calendar_event_id: event.id,
        reminder_sent: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { error: insertError } = await supabaseClient
        .from('appointments')
        .insert(newAppointment)

      if (insertError) {
        throw new Error(`Failed to create appointment: ${insertError.message}`)
      }

      count++
    } catch (error) {
      errors.push(`Event ${event.id}: ${error.message}`)
    }
  }

  return { count, conflicts, errors }
}