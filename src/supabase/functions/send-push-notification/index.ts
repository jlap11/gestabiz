import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushNotificationRequest {
  user_id: string
  title: string
  body: string
  data?: Record<string, any>
  badge?: number
  sound?: string
  push_tokens?: string[]
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

    const { user_id, title, body, data, badge, sound, push_tokens }: PushNotificationRequest = await req.json()

    if (!user_id || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, title, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user's push tokens if not provided
    let tokensToUse = push_tokens
    if (!tokensToUse) {
      const { data: userData, error: userError } = await supabaseClient
        .from('users')
        .select('push_tokens')
        .eq('id', user_id)
        .single()

      if (userError || !userData?.push_tokens) {
        return new Response(
          JSON.stringify({ error: 'No push tokens found for user' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      tokensToUse = userData.push_tokens
    }

    // Prepare notification payload for Expo
    const notificationPayload = {
      to: tokensToUse,
      title,
      body,
      data: data || {},
      badge: badge || 0,
      sound: sound || 'default',
      priority: 'high',
      channelId: 'appointments'
    }

    // Send push notification via Expo Push API
    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationPayload),
    })

    if (!expoResponse.ok) {
      const error = await expoResponse.text()
      throw new Error(`Expo Push API error: ${error}`)
    }

    const result = await expoResponse.json()

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Push notification sent successfully',
        expo_response: result
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error sending push notification:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

/*
Usage example:

const { data, error } = await supabase.functions.invoke('send-push-notification', {
  body: {
    user_id: 'user-uuid',
    title: 'Appointment Reminder',
    body: 'Your appointment starts in 1 hour',
    data: {
      type: 'appointment_reminder',
      appointment_id: 'appointment-uuid'
    },
    badge: 1
  }
})

To integrate with React Native/Expo:
1. Install expo-notifications
2. Register for push notifications and get token
3. Store token in user profile
4. Handle incoming notifications in app
*/