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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id, limit = 5 } = await req.json()

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get upcoming appointments for the user
    const { data: appointments, error } = await supabaseClient
      .from('appointments')
      .select(`
        id,
        title,
        description,
        client_name,
        client_email,
        client_phone,
        start_time,
        end_time,
        status,
        location,
        notes
      `)
      .eq('user_id', user_id)
      .eq('status', 'scheduled')
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(limit)

    if (error) {
      throw new Error(`Error fetching appointments: ${error.message}`)
    }

    // Format appointments for browser extension
    const formattedAppointments = appointments?.map(apt => ({
      id: apt.id,
      title: apt.title,
      client: apt.client_name,
      datetime: apt.start_time,
      location: apt.location,
      status: apt.status,
      timeUntil: getTimeUntil(apt.start_time)
    })) || []

    // Get user stats
    const { data: stats } = await supabaseClient.rpc('get_appointment_stats', {
      user_uuid: user_id
    })

    return new Response(
      JSON.stringify({ 
        success: true,
        appointments: formattedAppointments,
        stats: stats || {},
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in browser-extension-data function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function getTimeUntil(datetime: string): string {
  const now = new Date()
  const appointmentTime = new Date(datetime)
  const diffInMs = appointmentTime.getTime() - now.getTime()
  
  if (diffInMs < 0) return 'Past due'
  
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInHours / 24)
  
  if (diffInDays > 0) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'}`
  } else if (diffInHours > 0) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'}`
  } else {
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    return `${diffInMinutes} min${diffInMinutes === 1 ? '' : 's'}`
  }
}

/*
This function is designed to be called by the browser extension
to get upcoming appointments and user stats.

Usage from browser extension:

fetch('https://your-project.supabase.co/functions/v1/browser-extension-data', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + userToken,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    user_id: 'user-uuid',
    limit: 3
  })
})
.then(response => response.json())
.then(data => {
  // Update extension popup with appointment data
  updateExtensionUI(data.appointments, data.stats)
})
*/