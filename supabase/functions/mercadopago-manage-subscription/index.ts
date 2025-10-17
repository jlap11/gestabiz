/**
 * MercadoPago Manage Subscription Edge Function
 * 
 * Maneja operaciones de suscripción: update, cancel, pause, resume, reactivate
 * 
 * @author GitHub Copilot
 * @date 2025-10-17
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      })
    }

    const { action, businessId, ...params } = await req.json()

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let result

    switch (action) {
      case 'update':
      case 'cancel':
      case 'pause':
      case 'resume':
      case 'reactivate':
        const { data, error } = await supabase
          .from('business_plan')
          .update({
            status: action === 'cancel' ? 'canceled' : action === 'pause' ? 'paused' : 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('business_id', businessId)
          .select()
          .single()

        if (error) throw error
        result = { subscription: data }
        break

      default:
        throw new Error(`Unknown action: ${action}`)
    }

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})
