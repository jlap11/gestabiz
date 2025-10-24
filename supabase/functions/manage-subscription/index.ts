// Edge Function: manage-subscription
// Gestiona suscripciones existentes (actualizar, cancelar, pausar, reanudar)
// Deploy: npx supabase functions deploy manage-subscription

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.11.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Precios de Stripe (deben coincidir con create-checkout-session)
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

type ActionType = 'update' | 'cancel' | 'pause' | 'resume' | 'reactivate'

interface ManageSubscriptionRequest {
  businessId: string
  action: ActionType
  // Para update
  newPlanType?: 'inicio' | 'profesional' | 'empresarial' | 'corporativo'
  newBillingCycle?: 'monthly' | 'yearly'
  // Para cancel
  cancelAtPeriodEnd?: boolean
  cancellationReason?: string
}

serve(async req => {
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
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const body: ManageSubscriptionRequest = await req.json()
    const { businessId, action } = body

    if (!businessId || !action) {
      return new Response('Missing required fields', { status: 400 })
    }

    // Verificar que el usuario es dueño del negocio
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, owner_id')
      .eq('id', businessId)
      .single()

    if (businessError || !business) {
      return new Response('Business not found', { status: 404 })
    }

    if (business.owner_id !== user.id) {
      return new Response('Forbidden: You are not the owner of this business', { status: 403 })
    }

    // Obtener plan actual
    const { data: plan, error: planError } = await supabase
      .from('business_plans')
      .select('stripe_subscription_id, stripe_customer_id, plan_type, status')
      .eq('business_id', businessId)
      .single()

    if (planError || !plan) {
      return new Response('Business plan not found', { status: 404 })
    }

    if (!plan.stripe_subscription_id) {
      return new Response('No active subscription found', { status: 400 })
    }

    let result: any

    switch (action) {
      case 'update':
        result = await handleUpdate(stripe, supabase, plan, body, businessId, user.id)
        break
      case 'cancel':
        result = await handleCancel(stripe, supabase, plan, body, businessId, user.id)
        break
      case 'pause':
        result = await handlePause(stripe, supabase, plan, businessId, user.id)
        break
      case 'resume':
        result = await handleResume(stripe, supabase, plan, businessId, user.id)
        break
      case 'reactivate':
        result = await handleReactivate(stripe, supabase, plan, businessId, user.id)
        break
      default:
        return new Response('Invalid action', { status: 400 })
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    console.error('[ManageSubscription] Error:', err)
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'Unknown error',
        type: err instanceof Stripe.errors.StripeError ? err.type : 'unknown',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})

// Actualizar plan (upgrade/downgrade)
async function handleUpdate(
  stripe: Stripe,
  supabase: any,
  plan: any,
  body: ManageSubscriptionRequest,
  businessId: string,
  userId: string
) {
  const { newPlanType, newBillingCycle } = body

  if (!newPlanType || !newBillingCycle) {
    throw new Error('Missing newPlanType or newBillingCycle for update action')
  }

  const newPriceId = STRIPE_PRICES[newPlanType]?.[newBillingCycle]
  if (!newPriceId) {
    throw new Error(`Price not configured for ${newPlanType} ${newBillingCycle}`)
  }

  // Obtener suscripción actual
  const subscription = await stripe.subscriptions.retrieve(plan.stripe_subscription_id)

  // Actualizar item de suscripción
  const updatedSubscription = await stripe.subscriptions.update(plan.stripe_subscription_id, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: newPriceId,
      },
    ],
    proration_behavior: 'always_invoice', // Prorateo inmediato
    metadata: {
      business_id: businessId,
      plan_type: newPlanType,
      previous_plan: plan.plan_type,
    },
  })

  // Actualizar en Supabase
  await supabase
    .from('business_plans')
    .update({
      plan_type: newPlanType,
      billing_cycle: newBillingCycle,
      stripe_price_id: newPriceId,
    })
    .eq('business_id', businessId)

  // Registrar evento
  await supabase.from('subscription_events').insert({
    business_id: businessId,
    event_type: newPlanType > plan.plan_type ? 'upgraded' : 'downgraded',
    triggered_by: 'user',
    triggered_by_user_id: userId,
    metadata: {
      subscription_id: plan.stripe_subscription_id,
      old_plan: plan.plan_type,
      new_plan: newPlanType,
      old_cycle: subscription.items.data[0].price.recurring?.interval,
      new_cycle: newBillingCycle,
    },
  })

  // Audit log
  await supabase.from('billing_audit_log').insert({
    business_id: businessId,
    action: 'subscription_updated',
    entity_type: 'subscription',
    entity_id: plan.stripe_subscription_id,
    performed_by: userId,
    performed_by_source: 'user',
    old_value: { plan_type: plan.plan_type },
    new_value: { plan_type: newPlanType, billing_cycle: newBillingCycle },
  })

  return {
    success: true,
    message: 'Subscription updated successfully',
    subscription: {
      id: updatedSubscription.id,
      plan_type: newPlanType,
      billing_cycle: newBillingCycle,
      status: updatedSubscription.status,
    },
  }
}

// Cancelar suscripción
async function handleCancel(
  stripe: Stripe,
  supabase: any,
  plan: any,
  body: ManageSubscriptionRequest,
  businessId: string,
  userId: string
) {
  const { cancelAtPeriodEnd = true, cancellationReason } = body

  const updatedSubscription = await stripe.subscriptions.update(plan.stripe_subscription_id, {
    cancel_at_period_end: cancelAtPeriodEnd,
    cancellation_details: cancellationReason
      ? {
          comment: cancellationReason,
        }
      : undefined,
  })

  // Si cancelación inmediata
  if (!cancelAtPeriodEnd) {
    await stripe.subscriptions.cancel(plan.stripe_subscription_id)
  }

  // Actualizar en Supabase
  const updateData: any = {
    status: cancelAtPeriodEnd ? 'active' : 'canceled',
  }

  if (!cancelAtPeriodEnd) {
    updateData.canceled_at = new Date().toISOString()
    updateData.cancellation_reason = cancellationReason || 'user_canceled'
  }

  await supabase.from('business_plans').update(updateData).eq('business_id', businessId)

  // Registrar evento
  await supabase.from('subscription_events').insert({
    business_id: businessId,
    event_type: cancelAtPeriodEnd ? 'scheduled_cancellation' : 'canceled',
    triggered_by: 'user',
    triggered_by_user_id: userId,
    metadata: {
      subscription_id: plan.stripe_subscription_id,
      cancel_at_period_end: cancelAtPeriodEnd,
      reason: cancellationReason,
      end_date: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
    },
  })

  // Audit log
  await supabase.from('billing_audit_log').insert({
    business_id: businessId,
    action: 'subscription_canceled',
    entity_type: 'subscription',
    entity_id: plan.stripe_subscription_id,
    performed_by: userId,
    performed_by_source: 'user',
    new_value: {
      canceled_at: updateData.canceled_at,
      reason: cancellationReason,
      cancel_at_period_end: cancelAtPeriodEnd,
    },
  })

  return {
    success: true,
    message: cancelAtPeriodEnd
      ? 'Subscription will be canceled at the end of the billing period'
      : 'Subscription canceled immediately',
    subscription: {
      id: updatedSubscription.id,
      status: updatedSubscription.status,
      cancel_at_period_end: updatedSubscription.cancel_at_period_end,
      current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
    },
  }
}

// Pausar suscripción
async function handlePause(
  stripe: Stripe,
  supabase: any,
  plan: any,
  businessId: string,
  userId: string
) {
  const updatedSubscription = await stripe.subscriptions.update(plan.stripe_subscription_id, {
    pause_collection: {
      behavior: 'void', // No cobrar mientras está pausada
    },
  })

  // Actualizar en Supabase
  await supabase
    .from('business_plans')
    .update({
      status: 'paused',
      paused_at: new Date().toISOString(),
    })
    .eq('business_id', businessId)

  // Registrar evento
  await supabase.from('subscription_events').insert({
    business_id: businessId,
    event_type: 'paused',
    triggered_by: 'user',
    triggered_by_user_id: userId,
    metadata: {
      subscription_id: plan.stripe_subscription_id,
    },
  })

  // Audit log
  await supabase.from('billing_audit_log').insert({
    business_id: businessId,
    action: 'subscription_paused',
    entity_type: 'subscription',
    entity_id: plan.stripe_subscription_id,
    performed_by: userId,
    performed_by_source: 'user',
  })

  return {
    success: true,
    message: 'Subscription paused successfully',
    subscription: {
      id: updatedSubscription.id,
      status: updatedSubscription.status,
      pause_collection: updatedSubscription.pause_collection,
    },
  }
}

// Reanudar suscripción pausada
async function handleResume(
  stripe: Stripe,
  supabase: any,
  plan: any,
  businessId: string,
  userId: string
) {
  const updatedSubscription = await stripe.subscriptions.update(plan.stripe_subscription_id, {
    pause_collection: null as any, // Remover pausa
  })

  // Actualizar en Supabase
  await supabase
    .from('business_plans')
    .update({
      status: 'active',
      paused_at: null,
    })
    .eq('business_id', businessId)

  // Registrar evento
  await supabase.from('subscription_events').insert({
    business_id: businessId,
    event_type: 'resumed',
    triggered_by: 'user',
    triggered_by_user_id: userId,
    metadata: {
      subscription_id: plan.stripe_subscription_id,
    },
  })

  // Audit log
  await supabase.from('billing_audit_log').insert({
    business_id: businessId,
    action: 'subscription_resumed',
    entity_type: 'subscription',
    entity_id: plan.stripe_subscription_id,
    performed_by: userId,
    performed_by_source: 'user',
  })

  return {
    success: true,
    message: 'Subscription resumed successfully',
    subscription: {
      id: updatedSubscription.id,
      status: updatedSubscription.status,
    },
  }
}

// Reactivar suscripción cancelada (dentro del período de gracia)
async function handleReactivate(
  stripe: Stripe,
  supabase: any,
  plan: any,
  businessId: string,
  userId: string
) {
  // Verificar que está en estado cancelado pero dentro del período activo
  if (plan.status !== 'canceled') {
    throw new Error('Subscription is not canceled')
  }

  // Obtener suscripción de Stripe
  const subscription = await stripe.subscriptions.retrieve(plan.stripe_subscription_id)

  if (subscription.status === 'canceled') {
    throw new Error('Subscription already expired, cannot reactivate')
  }

  // Remover cancelación programada
  const updatedSubscription = await stripe.subscriptions.update(plan.stripe_subscription_id, {
    cancel_at_period_end: false,
  })

  // Actualizar en Supabase
  await supabase
    .from('business_plans')
    .update({
      status: 'active',
      canceled_at: null,
      cancellation_reason: null,
    })
    .eq('business_id', businessId)

  // Registrar evento
  await supabase.from('subscription_events').insert({
    business_id: businessId,
    event_type: 'reactivated',
    triggered_by: 'user',
    triggered_by_user_id: userId,
    metadata: {
      subscription_id: plan.stripe_subscription_id,
    },
  })

  // Audit log
  await supabase.from('billing_audit_log').insert({
    business_id: businessId,
    action: 'subscription_reactivated',
    entity_type: 'subscription',
    entity_id: plan.stripe_subscription_id,
    performed_by: userId,
    performed_by_source: 'user',
  })

  return {
    success: true,
    message: 'Subscription reactivated successfully',
    subscription: {
      id: updatedSubscription.id,
      status: updatedSubscription.status,
      cancel_at_period_end: updatedSubscription.cancel_at_period_end,
    },
  }
}
