// Edge Function: create-checkout-session
// Crea sesiones de Stripe Checkout para suscripciones
// Deploy: npx supabase functions deploy create-checkout-session

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.11.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Precios de Stripe (deben configurarse en Stripe Dashboard)
const STRIPE_PRICES = {
  inicio: {
    monthly: Deno.env.get('STRIPE_PRICE_INICIO_MONTHLY'),
    yearly: Deno.env.get('STRIPE_PRICE_INICIO_YEARLY'),
  },
  profesional: {
    monthly: Deno.env.get('STRIPE_PRICE_PROFESIONAL_MONTHLY'),
    yearly: Deno.env.get('STRIPE_PRICE_PROFESIONAL_YEARLY'),
  },
  empresarial: {
    monthly: Deno.env.get('STRIPE_PRICE_EMPRESARIAL_MONTHLY'),
    yearly: Deno.env.get('STRIPE_PRICE_EMPRESARIAL_YEARLY'),
  },
  corporativo: {
    monthly: Deno.env.get('STRIPE_PRICE_CORPORATIVO_MONTHLY'),
    yearly: Deno.env.get('STRIPE_PRICE_CORPORATIVO_YEARLY'),
  },
}

interface CheckoutSessionRequest {
  businessId: string
  planType: 'inicio' | 'profesional' | 'empresarial' | 'corporativo'
  billingCycle: 'monthly' | 'yearly'
  discountCode?: string
  successUrl: string
  cancelUrl: string
}

serve(async (req) => {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Missing authorization header', { status: 401 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    })

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const body: CheckoutSessionRequest = await req.json()
    const { businessId, planType, billingCycle, discountCode, successUrl, cancelUrl } = body

    // Validar parámetros
    if (!businessId || !planType || !billingCycle) {
      return new Response('Missing required fields', { status: 400 })
    }

    // Verificar que el usuario es dueño del negocio
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, owner_id, name, email')
      .eq('id', businessId)
      .single()

    if (businessError || !business) {
      return new Response('Business not found', { status: 404 })
    }

    if (business.owner_id !== user.id) {
      return new Response('Forbidden: You are not the owner of this business', { status: 403 })
    }

    // Obtener Price ID de Stripe
    const priceId = STRIPE_PRICES[planType]?.[billingCycle]
    if (!priceId) {
      return new Response(`Price not configured for ${planType} ${billingCycle}`, { status: 400 })
    }

    // Buscar o crear Stripe Customer
    let customerId: string

    const { data: existingPlan } = await supabase
      .from('business_plans')
      .select('stripe_customer_id')
      .eq('business_id', businessId)
      .single()

    if (existingPlan?.stripe_customer_id) {
      customerId = existingPlan.stripe_customer_id
    } else {
      // Crear nuevo customer
      const customer = await stripe.customers.create({
        email: business.email || user.email,
        name: business.name,
        metadata: {
          business_id: businessId,
          owner_id: user.id,
        },
      })
      customerId = customer.id

      // Guardar customer_id en business_plans
      await supabase
        .from('business_plans')
        .upsert({
          business_id: businessId,
          plan_type: planType,
          stripe_customer_id: customerId,
          status: 'inactive',
        }, { onConflict: 'business_id' })
    }

    // Configuración de la sesión de checkout
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
      subscription_data: {
        metadata: {
          business_id: businessId,
          plan_type: planType,
        },
        trial_period_days: planType === 'inicio' ? 14 : 0, // 14 días gratis solo en plan Inicio
      },
      metadata: {
        business_id: businessId,
        plan_type: planType,
        billing_cycle: billingCycle,
      },
      locale: 'es', // Español para Colombia
      payment_method_types: ['card'],
    }

    // Aplicar código de descuento si existe
    if (discountCode) {
      const { data: discountData, error: discountError } = await supabase.rpc(
        'apply_discount_code',
        {
          p_business_id: businessId,
          p_code: discountCode,
          p_plan_type: planType,
          p_amount: 0, // Se calculará en Stripe
        }
      )

      if (discountError) {
        console.warn('[Checkout] Invalid discount code:', discountCode)
      } else if (discountData?.is_valid) {
        // Buscar promocode de Stripe
        try {
          const promoCodes = await stripe.promotionCodes.list({
            code: discountCode,
            active: true,
            limit: 1,
          })

          if (promoCodes.data.length > 0) {
            sessionConfig.discounts = [{
              promotion_code: promoCodes.data[0].id,
            }]
          } else {
            console.warn('[Checkout] Stripe promo code not found:', discountCode)
          }
        } catch (err) {
          console.error('[Checkout] Error fetching promo code:', err)
        }
      }
    }

    // Crear sesión de checkout
    const session = await stripe.checkout.sessions.create(sessionConfig)

    // Registrar evento
    await supabase.from('subscription_events').insert({
      business_id: businessId,
      event_type: 'created',
      triggered_by: 'user',
      triggered_by_user_id: user.id,
      metadata: {
        session_id: session.id,
        plan_type: planType,
        billing_cycle: billingCycle,
        discount_code: discountCode,
      },
    })

    // Registrar en audit log
    await supabase.from('billing_audit_log').insert({
      business_id: businessId,
      action: 'subscription_created',
      entity_type: 'checkout_session',
      entity_id: session.id,
      performed_by: user.id,
      performed_by_source: 'user',
      new_value: {
        plan_type: planType,
        billing_cycle: billingCycle,
      },
    })

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        sessionUrl: session.url,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (err) {
    console.error('[Checkout] Error:', err)
    return new Response(
      JSON.stringify({ 
        error: err instanceof Error ? err.message : 'Unknown error',
        type: err instanceof Stripe.errors.StripeError ? err.type : 'unknown',
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  }
})
