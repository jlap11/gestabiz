// Supabase Edge Function: calendar-integration
// File: supabase/functions/calendar-integration/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { method } = req
    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    switch (action) {
      case 'generate-ics':
        return await generateICSFile(req, supabase)
      
      case 'google-calendar':
        return await syncWithGoogleCalendar(req, supabase)
      
      case 'outlook-calendar':
        return await syncWithOutlookCalendar(req, supabase)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action parameter' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('Error in calendar-integration function:', error)
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function generateICSFile(req: Request, supabase: any) {
  const url = new URL(req.url)
  const userId = url.searchParams.get('user_id')
  const appointmentId = url.searchParams.get('appointment_id')

  if (!userId) {
    return new Response(
      JSON.stringify({ error: 'user_id parameter is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  let query = supabase
    .from('appointments')
    .select('*')
    .eq('user_id', userId)

  if (appointmentId) {
    query = query.eq('id', appointmentId)
  }

  const { data: appointments, error } = await query

  if (error) throw error

  const icsContent = generateICS(appointments)

  return new Response(icsContent, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/calendar',
      'Content-Disposition': 'attachment; filename="appointments.ics"'
    }
  })
}

async function syncWithGoogleCalendar(req: Request, supabase: any) {
  // This would require Google Calendar API integration
  // For now, return a placeholder response
  return new Response(
    JSON.stringify({ 
      success: false, 
      message: 'Google Calendar integration requires OAuth setup and Google Calendar API credentials',
      instructions: 'To implement: 1. Set up Google OAuth, 2. Get Calendar API access, 3. Implement sync logic'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function syncWithOutlookCalendar(req: Request, supabase: any) {
  // This would require Microsoft Graph API integration
  // For now, return a placeholder response
  return new Response(
    JSON.stringify({ 
      success: false, 
      message: 'Outlook Calendar integration requires Microsoft Graph API setup',
      instructions: 'To implement: 1. Set up Microsoft OAuth, 2. Get Graph API access, 3. Implement sync logic'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

function generateICS(appointments: any[]): string {
  const now = new Date()
  const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Gestabiz//Gestabiz//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ]

  for (const appointment of appointments) {
    const startDate = new Date(appointment.start_time)
    const endDate = new Date(appointment.end_time)
    
    const startTimestamp = startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const endTimestamp = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

    ics.push(
      'BEGIN:VEVENT',
      `UID:${appointment.id}@Gestabiz.com`,
      `DTSTAMP:${timestamp}`,
      `DTSTART:${startTimestamp}`,
      `DTEND:${endTimestamp}`,
      `SUMMARY:${escapeICSText(appointment.title)}`,
      `DESCRIPTION:${escapeICSText(appointment.description || '')}`,
      appointment.location ? `LOCATION:${escapeICSText(appointment.location)}` : '',
      `STATUS:${appointment.status.toUpperCase()}`,
      'END:VEVENT'
    )
  }

  ics.push('END:VCALENDAR')

  return ics.filter(line => line !== '').join('\r\n')
}

function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
}