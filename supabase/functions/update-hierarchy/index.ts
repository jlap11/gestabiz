import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Manejar preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Validar método
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await req.json()
    console.log('Raw request body:', JSON.stringify(body))

    const { uid, bid, lvl } = body
    const user_id = uid
    const business_id = bid
    const new_level = lvl

    console.log('Parsed parameters:', { user_id, business_id, new_level })

    // Validar inputs
    if (!user_id || !business_id || new_level === undefined) {
      console.log('Validation failed:', { user_id, business_id, new_level })
      return new Response(
        JSON.stringify({
          error: 'Missing required parameters: uid, bid, lvl',
          received: { uid, bid, lvl, user_id, business_id, new_level },
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (new_level < 0 || new_level > 4) {
      return new Response(
        JSON.stringify({ success: false, message: 'Nivel inválido: ' + new_level }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Obtener token del header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Crear cliente Supabase con service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials')
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verificar que el empleado existe
    const { data: employee, error: checkError } = await supabase
      .from('business_roles')
      .select('id')
      .eq('user_id', user_id)
      .eq('business_id', business_id)
      .single()

    if (checkError || !employee) {
      console.log('Employee not found:', { user_id, business_id, checkError })
      return new Response(
        JSON.stringify({ success: false, message: 'Empleado no encontrado en negocio' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Actualizar nivel jerárquico
    const { error: updateError } = await supabase
      .from('business_roles')
      .update({ hierarchy_level: new_level, updated_at: new Date().toISOString() })
      .eq('user_id', user_id)
      .eq('business_id', business_id)

    if (updateError) {
      console.error('Update error:', updateError)
      return new Response(
        JSON.stringify({ success: false, message: 'Error al actualizar: ' + updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Nivel actualizado exitosamente a ' + new_level,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(JSON.stringify({ success: false, message: 'Error: ' + error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
