// Edge Function: create-setup-intent
// Propósito: Crear Setup Intent de Stripe para guardar métodos de pago
// Uso: Llamada desde AddPaymentMethodModal para inicializar PaymentElement

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import Stripe from 'https://esm.sh/stripe@14.11.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateSetupIntentRequest {
  businessId: string
}

interface CreateSetupIntentResponse {
  clientSecret: string
  setupIntentId: string
}

serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Inicializar clientes
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // 2. Validar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      console.error('[create-setup-intent] Error de autenticación:', authError)
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Parsear request body
    const { businessId } = (await req.json()) as CreateSetupIntentRequest

    if (!businessId) {
      return new Response(JSON.stringify({ error: 'businessId es requerido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(
      `[create-setup-intent] Creando Setup Intent para business ${businessId}, usuario ${user.id}`
    )

    // 4. Verificar que el usuario es owner del negocio
    const { data: business, error: businessError } = await supabaseClient
      .from('businesses')
      .select('id, owner_id, stripe_customer_id')
      .eq('id', businessId)
      .single()

    if (businessError || !business) {
      console.error('[create-setup-intent] Error al obtener negocio:', businessError)
      return new Response(JSON.stringify({ error: 'Negocio no encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (business.owner_id !== user.id) {
      console.error(
        `[create-setup-intent] Usuario ${user.id} no es owner del negocio ${businessId}`
      )
      return new Response(JSON.stringify({ error: 'No autorizado para este negocio' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 5. Obtener o crear Stripe Customer
    let stripeCustomerId = business.stripe_customer_id

    if (!stripeCustomerId) {
      console.log(`[create-setup-intent] Creando nuevo Stripe Customer para business ${businessId}`)

      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', user.id)
        .single()

      const customer = await stripe.customers.create({
        email: user.email || profile?.email || undefined,
        name: profile?.full_name || undefined,
        metadata: {
          business_id: businessId,
          user_id: user.id,
        },
      })

      stripeCustomerId = customer.id

      // Guardar el Stripe Customer ID en el negocio
      const { error: updateError } = await supabaseClient
        .from('businesses')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', businessId)

      if (updateError) {
        console.error('[create-setup-intent] Error al guardar stripe_customer_id:', updateError)
      }

      console.log(`[create-setup-intent] Stripe Customer creado: ${stripeCustomerId}`)
    }

    // 6. Crear Setup Intent
    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      usage: 'off_session', // Permite cobros futuros sin intervención del usuario
      metadata: {
        business_id: businessId,
        user_id: user.id,
      },
    })

    console.log(`[create-setup-intent] Setup Intent creado: ${setupIntent.id}`)

    // 7. Retornar client_secret
    const response: CreateSetupIntentResponse = {
      clientSecret: setupIntent.client_secret || '',
      setupIntentId: setupIntent.id,
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[create-setup-intent] Error:', error)
    return new Response(
      JSON.stringify({
        error: 'Error al crear Setup Intent',
        details: error instanceof Error ? error.message : 'Error desconocido',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
