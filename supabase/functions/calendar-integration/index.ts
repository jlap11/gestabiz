import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CalendarSyncRequest {
  provider: 'google' | 'outlook' | 'apple'
  calendarId: string
  userId?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { provider, calendarId, userId }: CalendarSyncRequest = await req.json()

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user's calendar sync settings
    const { data: syncSettings, error: settingsError } = await supabase
      .from('calendar_sync_settings')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single()

    if (settingsError || !syncSettings) {
      throw new Error('Calendar sync not configured for this user')
    }

    let syncResult = { imported: 0, exported: 0, errors: [] }

    switch (provider) {
      case 'google':
        syncResult = await syncWithGoogleCalendar(supabase, syncSettings, calendarId)
        break
      case 'outlook':
        syncResult = await syncWithOutlookCalendar(supabase, syncSettings, calendarId)
        break
      case 'apple':
        syncResult = await syncWithAppleCalendar(supabase, syncSettings, calendarId)
        break
      default:
        throw new Error(`Unsupported calendar provider: ${provider}`)
    }

    // Update last sync time
    await supabase
      .from('calendar_sync_settings')
      .update({ 
        last_sync: new Date().toISOString(),
        sync_errors: syncResult.errors 
      })
      .eq('id', syncSettings.id)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Calendar sync completed',
        result: syncResult
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error syncing calendar:', error)
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

async function syncWithGoogleCalendar(supabase: any, syncSettings: any, calendarId: string) {
  const result = { imported: 0, exported: 0, errors: [] }

  try {
    // Get user's appointments from the last sync
    const lastSyncDate = syncSettings.last_sync || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', syncSettings.user_id)
      .gte('updated_at', lastSyncDate)

    if (appointmentsError) {
      throw new Error(`Failed to fetch appointments: ${appointmentsError.message}`)
    }

    // Export appointments to Google Calendar
    if (syncSettings.sync_direction === 'export_only' || syncSettings.sync_direction === 'both') {
      for (const appointment of appointments || []) {
        try {
          const googleEvent = {
            summary: appointment.title,
            description: appointment.description || appointment.notes,
            start: {
              dateTime: appointment.start_time,
              timeZone: 'UTC'
            },
            end: {
              dateTime: appointment.end_time,
              timeZone: 'UTC'
            },
            location: appointment.location,
            attendees: appointment.client_email ? [{ email: appointment.client_email }] : [],
            extendedProperties: {
              private: {
                appointmentId: appointment.id,
                source: 'Gestabiz'
              }
            }
          }

          // Create or update event in Google Calendar
          const googleResponse = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${syncSettings.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(googleEvent),
            }
          )

          if (googleResponse.ok) {
            result.exported++
          } else {
            const error = await googleResponse.text()
            result.errors.push(`Export failed for appointment ${appointment.id}: ${error}`)
          }
        } catch (exportError) {
          result.errors.push(`Export error for appointment ${appointment.id}: ${exportError.message}`)
        }
      }
    }

    // Import events from Google Calendar
    if (syncSettings.sync_direction === 'import_only' || syncSettings.sync_direction === 'both') {
      const googleResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?updatedMin=${lastSyncDate}`,
        {
          headers: {
            'Authorization': `Bearer ${syncSettings.access_token}`,
          },
        }
      )

      if (googleResponse.ok) {
        const googleData = await googleResponse.json()
        
        for (const event of googleData.items || []) {
          // Skip events that originated from our app
          if (event.extendedProperties?.private?.source === 'Gestabiz') {
            continue
          }

          try {
            // Create appointment from Google Calendar event
            const appointmentData = {
              business_id: syncSettings.business_id,
              user_id: syncSettings.user_id,
              title: event.summary || 'Imported Event',
              description: event.description,
              start_time: event.start.dateTime || event.start.date,
              end_time: event.end.dateTime || event.end.date,
              location: event.location,
              client_name: event.attendees?.[0]?.displayName || 'Imported Client',
              client_email: event.attendees?.[0]?.email,
              status: 'scheduled',
              created_by: syncSettings.user_id
            }

            const { error: insertError } = await supabase
              .from('appointments')
              .insert(appointmentData)

            if (!insertError) {
              result.imported++
            } else {
              result.errors.push(`Import failed for event ${event.id}: ${insertError.message}`)
            }
          } catch (importError) {
            result.errors.push(`Import error for event ${event.id}: ${importError.message}`)
          }
        }
      }
    }

  } catch (syncError) {
    result.errors.push(`Google Calendar sync error: ${syncError.message}`)
  }

  return result
}

async function syncWithOutlookCalendar(supabase: any, syncSettings: any, calendarId: string) {
  // Similar implementation for Outlook Calendar
  return { imported: 0, exported: 0, errors: ['Outlook Calendar sync not yet implemented'] }
}

async function syncWithAppleCalendar(supabase: any, syncSettings: any, calendarId: string) {
  // Similar implementation for Apple Calendar
  return { imported: 0, exported: 0, errors: ['Apple Calendar sync not yet implemented'] }
}