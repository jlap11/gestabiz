// Edge Function: stripe-webhook
// Maneja eventos de Stripe webhook para sincronizar estado de suscripciones y pagos
// Deploy: npx supabase functions deploy stripe-webhook
// Webhook URL: https://gftnvpspfjsjxhniqymr.supabase.co/functions/v1/stripe-webhook

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.11.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  try {
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    
    console.log(`[Stripe Webhook] Received event: ${event.type}`)

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Procesar eventos según tipo
    switch (event.type) {
      // ========== EVENTOS DE CUSTOMER ==========
      case 'customer.created':
        await handleCustomerCreated(supabase, event.data.object as Stripe.Customer)
        break

      case 'customer.updated':
        await handleCustomerUpdated(supabase, event.data.object as Stripe.Customer)
        break

      case 'customer.deleted':
        await handleCustomerDeleted(supabase, event.data.object as Stripe.Customer)
        break

      // ========== EVENTOS DE SUBSCRIPTION ==========
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionCreatedOrUpdated(supabase, event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(supabase, event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(supabase, event.data.object as Stripe.Subscription)
        break

      // ========== EVENTOS DE PAYMENT INTENT ==========
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(supabase, event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(supabase, event.data.object as Stripe.PaymentIntent)
        break

      // ========== EVENTOS DE INVOICE ==========
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(supabase, event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(supabase, event.data.object as Stripe.Invoice)
        break

      case 'invoice.upcoming':
        await handleInvoiceUpcoming(supabase, event.data.object as Stripe.Invoice)
        break

      // ========== EVENTOS DE PAYMENT METHOD ==========
      case 'payment_method.attached':
        await handlePaymentMethodAttached(supabase, event.data.object as Stripe.PaymentMethod)
        break

      case 'payment_method.detached':
        await handlePaymentMethodDetached(supabase, event.data.object as Stripe.PaymentMethod)
        break

      // ========== EVENTOS DE SETUP INTENT ==========
      case 'setup_intent.succeeded':
        await handleSetupIntentSucceeded(supabase, event.data.object as Stripe.SetupIntent)
        break

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    console.error('[Stripe Webhook] Error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

// ========== HANDLERS DE CUSTOMER ==========

async function handleCustomerCreated(supabase: any, customer: Stripe.Customer) {
  console.log(`[Customer] Created: ${customer.id}`)
  
  // Buscar business_id en metadata
  const businessId = customer.metadata?.business_id
  if (!businessId) {
    console.warn('[Customer] No business_id in metadata')
    return
  }

  // Actualizar business_plans con stripe_customer_id
  const { error } = await supabase
    .from('business_plans')
    .update({ stripe_customer_id: customer.id })
    .eq('business_id', businessId)

  if (error) {
    console.error('[Customer] Error updating business_plans:', error)
  }
}

async function handleCustomerUpdated(supabase: any, customer: Stripe.Customer) {
  console.log(`[Customer] Updated: ${customer.id}`)
  // Sincronizar cambios de customer (email, nombre, etc.)
}

async function handleCustomerDeleted(supabase: any, customer: Stripe.Customer) {
  console.log(`[Customer] Deleted: ${customer.id}`)
  
  // Marcar suscripción como cancelada
  const { error } = await supabase
    .from('business_plans')
    .update({ 
      status: 'canceled',
      stripe_customer_id: null,
      canceled_at: new Date().toISOString()
    })
    .eq('stripe_customer_id', customer.id)

  if (error) {
    console.error('[Customer] Error updating business_plans:', error)
  }
}

// ========== HANDLERS DE SUBSCRIPTION ==========

async function handleSubscriptionCreatedOrUpdated(supabase: any, subscription: Stripe.Subscription) {
  console.log(`[Subscription] Created/Updated: ${subscription.id}`)

  const businessId = subscription.metadata?.business_id
  if (!businessId) {
    console.warn('[Subscription] No business_id in metadata')
    return
  }

  // Mapear status de Stripe a nuestro status
  const statusMap: Record<string, string> = {
    'active': 'active',
    'trialing': 'trialing',
    'past_due': 'past_due',
    'canceled': 'canceled',
    'unpaid': 'suspended',
    'incomplete': 'inactive',
    'incomplete_expired': 'expired',
    'paused': 'paused',
  }

  const planType = subscription.items.data[0]?.price?.metadata?.plan_type || 'inicio'

  // Actualizar business_plans
  const { error: planError } = await supabase
    .from('business_plans')
    .upsert({
      business_id: businessId,
      plan_type: planType,
      status: statusMap[subscription.status] || 'inactive',
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      stripe_price_id: subscription.items.data[0]?.price?.id,
      billing_cycle: subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'yearly' : 'monthly',
      start_date: new Date(subscription.start_date * 1000).toISOString(),
      end_date: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
      trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      auto_renew: !subscription.cancel_at_period_end,
    }, { onConflict: 'business_id' })

  if (planError) {
    console.error('[Subscription] Error updating business_plans:', planError)
    return
  }

  // Registrar evento
  await supabase.from('subscription_events').insert({
    business_id: businessId,
    plan_id: (await supabase.from('business_plans').select('id').eq('business_id', businessId).single()).data?.id,
    event_type: subscription.status === 'active' ? 'activated' : subscription.status === 'canceled' ? 'canceled' : 'renewed',
    triggered_by: 'stripe_webhook',
    metadata: {
      subscription_id: subscription.id,
      status: subscription.status,
      current_period_end: subscription.current_period_end,
    }
  })
}

async function handleSubscriptionDeleted(supabase: any, subscription: Stripe.Subscription) {
  console.log(`[Subscription] Deleted: ${subscription.id}`)

  // Actualizar business_plans
  const { error } = await supabase
    .from('business_plans')
    .update({ 
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      end_date: new Date(subscription.ended_at! * 1000).toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('[Subscription] Error updating business_plans:', error)
    return
  }

  // Registrar evento
  const businessId = subscription.metadata?.business_id
  if (businessId) {
    await supabase.from('subscription_events').insert({
      business_id: businessId,
      event_type: 'canceled',
      triggered_by: 'stripe_webhook',
      reason: subscription.cancellation_details?.reason || 'unknown',
      metadata: { subscription_id: subscription.id }
    })
  }
}

async function handleTrialWillEnd(supabase: any, subscription: Stripe.Subscription) {
  console.log(`[Subscription] Trial will end: ${subscription.id}`)

  const businessId = subscription.metadata?.business_id
  if (!businessId) return

  // Registrar evento
  await supabase.from('subscription_events').insert({
    business_id: businessId,
    event_type: 'trial_will_end',
    triggered_by: 'stripe_webhook',
    metadata: {
      subscription_id: subscription.id,
      trial_end: subscription.trial_end,
      days_left: Math.ceil((subscription.trial_end! * 1000 - Date.now()) / (1000 * 60 * 60 * 24))
    }
  })

  // TODO: Enviar notificación al negocio
}

// ========== HANDLERS DE PAYMENT INTENT ==========

async function handlePaymentIntentSucceeded(supabase: any, paymentIntent: Stripe.PaymentIntent) {
  console.log(`[PaymentIntent] Succeeded: ${paymentIntent.id}`)

  const businessId = paymentIntent.metadata?.business_id
  if (!businessId) return

  // Registrar pago exitoso
  await supabase.from('subscription_payments').insert({
    business_id: businessId,
    stripe_payment_intent_id: paymentIntent.id,
    amount: paymentIntent.amount / 100, // Convertir de centavos
    currency: paymentIntent.currency.toUpperCase(),
    status: 'completed',
    paid_at: new Date().toISOString(),
    metadata: {
      payment_method: paymentIntent.payment_method,
      receipt_email: paymentIntent.receipt_email,
    }
  })
}

async function handlePaymentIntentFailed(supabase: any, paymentIntent: Stripe.PaymentIntent) {
  console.log(`[PaymentIntent] Failed: ${paymentIntent.id}`)

  const businessId = paymentIntent.metadata?.business_id
  if (!businessId) return

  // Registrar pago fallido
  await supabase.from('subscription_payments').insert({
    business_id: businessId,
    stripe_payment_intent_id: paymentIntent.id,
    amount: paymentIntent.amount / 100,
    currency: paymentIntent.currency.toUpperCase(),
    status: 'failed',
    failure_code: paymentIntent.last_payment_error?.code,
    failure_reason: paymentIntent.last_payment_error?.message,
    metadata: {
      payment_method: paymentIntent.payment_method,
    }
  })

  // Registrar evento
  await supabase.from('subscription_events').insert({
    business_id: businessId,
    event_type: 'payment_failed',
    triggered_by: 'stripe_webhook',
    metadata: {
      payment_intent_id: paymentIntent.id,
      error_code: paymentIntent.last_payment_error?.code,
      error_message: paymentIntent.last_payment_error?.message,
    }
  })
}

// ========== HANDLERS DE INVOICE ==========

async function handleInvoicePaymentSucceeded(supabase: any, invoice: Stripe.Invoice) {
  console.log(`[Invoice] Payment succeeded: ${invoice.id}`)

  const businessId = invoice.metadata?.business_id || invoice.subscription_details?.metadata?.business_id
  if (!businessId) return

  // Actualizar o crear registro de pago
  await supabase.from('subscription_payments').upsert({
    business_id: businessId,
    stripe_invoice_id: invoice.id,
    stripe_payment_intent_id: invoice.payment_intent as string,
    amount: invoice.amount_paid / 100,
    currency: invoice.currency.toUpperCase(),
    status: 'completed',
    paid_at: new Date(invoice.status_transitions.paid_at! * 1000).toISOString(),
    metadata: {
      invoice_pdf: invoice.invoice_pdf,
      hosted_invoice_url: invoice.hosted_invoice_url,
    }
  }, { onConflict: 'stripe_invoice_id' })

  // Registrar evento
  await supabase.from('subscription_events').insert({
    business_id: businessId,
    event_type: 'payment_succeeded',
    triggered_by: 'stripe_webhook',
    metadata: {
      invoice_id: invoice.id,
      amount: invoice.amount_paid / 100,
    }
  })
}

async function handleInvoicePaymentFailed(supabase: any, invoice: Stripe.Invoice) {
  console.log(`[Invoice] Payment failed: ${invoice.id}`)

  const businessId = invoice.metadata?.business_id
  if (!businessId) return

  // Actualizar pago
  await supabase.from('subscription_payments').upsert({
    business_id: businessId,
    stripe_invoice_id: invoice.id,
    amount: invoice.amount_due / 100,
    currency: invoice.currency.toUpperCase(),
    status: 'failed',
    failure_reason: 'Invoice payment failed',
    metadata: {
      attempt_count: invoice.attempt_count,
      next_payment_attempt: invoice.next_payment_attempt,
    }
  }, { onConflict: 'stripe_invoice_id' })

  // Registrar evento
  await supabase.from('subscription_events').insert({
    business_id: businessId,
    event_type: 'payment_failed',
    triggered_by: 'stripe_webhook',
    metadata: {
      invoice_id: invoice.id,
      attempt_count: invoice.attempt_count,
    }
  })
}

async function handleInvoiceUpcoming(supabase: any, invoice: Stripe.Invoice) {
  console.log(`[Invoice] Upcoming: ${invoice.id}`)

  const businessId = invoice.metadata?.business_id
  if (!businessId) return

  // Registrar evento de factura próxima
  await supabase.from('subscription_events').insert({
    business_id: businessId,
    event_type: 'invoice_upcoming',
    triggered_by: 'stripe_webhook',
    metadata: {
      invoice_id: invoice.id,
      amount: invoice.amount_due / 100,
      due_date: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
    }
  })

  // TODO: Enviar notificación al negocio sobre próximo cobro
}

// ========== HANDLERS DE PAYMENT METHOD ==========

async function handlePaymentMethodAttached(supabase: any, paymentMethod: Stripe.PaymentMethod) {
  console.log(`[PaymentMethod] Attached: ${paymentMethod.id}`)

  if (paymentMethod.type !== 'card') {
    console.log('[PaymentMethod] Not a card, skipping')
    return
  }

  // Buscar customer en Stripe para obtener business_id
  const customer = await stripe.customers.retrieve(paymentMethod.customer as string)
  const businessId = (customer as Stripe.Customer).metadata?.business_id
  
  if (!businessId) return

  // Guardar método de pago
  await supabase.from('payment_methods').insert({
    business_id: businessId,
    stripe_customer_id: paymentMethod.customer as string,
    stripe_payment_method_id: paymentMethod.id,
    type: 'card',
    brand: paymentMethod.card?.brand,
    last4: paymentMethod.card?.last4,
    exp_month: paymentMethod.card?.exp_month,
    exp_year: paymentMethod.card?.exp_year,
    country: paymentMethod.card?.country,
    funding: paymentMethod.card?.funding,
    is_active: true,
  })

  // Registrar en audit log
  await supabase.from('billing_audit_log').insert({
    business_id: businessId,
    action: 'payment_method_added',
    entity_type: 'payment_method',
    entity_id: paymentMethod.id,
    performed_by_source: 'stripe_webhook',
    new_value: {
      brand: paymentMethod.card?.brand,
      last4: paymentMethod.card?.last4,
    }
  })
}

async function handlePaymentMethodDetached(supabase: any, paymentMethod: Stripe.PaymentMethod) {
  console.log(`[PaymentMethod] Detached: ${paymentMethod.id}`)

  // Marcar método de pago como inactivo
  const { error } = await supabase
    .from('payment_methods')
    .update({ is_active: false })
    .eq('stripe_payment_method_id', paymentMethod.id)

  if (error) {
    console.error('[PaymentMethod] Error updating payment_methods:', error)
  }

  // Buscar business_id para audit log
  const { data } = await supabase
    .from('payment_methods')
    .select('business_id')
    .eq('stripe_payment_method_id', paymentMethod.id)
    .single()

  if (data?.business_id) {
    await supabase.from('billing_audit_log').insert({
      business_id: data.business_id,
      action: 'payment_method_removed',
      entity_type: 'payment_method',
      entity_id: paymentMethod.id,
      performed_by_source: 'stripe_webhook',
    })
  }
}

// ========== HANDLERS DE SETUP INTENT ==========

async function handleSetupIntentSucceeded(supabase: any, setupIntent: Stripe.SetupIntent) {
  console.log(`[SetupIntent] Succeeded: ${setupIntent.id}`)

  // El Setup Intent adjunta el Payment Method automáticamente al Customer
  // El evento payment_method.attached se encargará de guardar el método de pago
  // Aquí solo registramos el evento para auditoría

  const businessId = setupIntent.metadata?.business_id

  if (businessId) {
    await supabase.from('billing_audit_log').insert({
      business_id: businessId,
      action: 'setup_intent_succeeded',
      entity_type: 'setup_intent',
      entity_id: setupIntent.id,
      performed_by_source: 'stripe_webhook',
      new_value: {
        payment_method: setupIntent.payment_method,
        customer: setupIntent.customer,
      }
    })

    // Registrar evento de suscripción
    await supabase.from('subscription_events').insert({
      business_id: businessId,
      event_type: 'payment_method_setup',
      triggered_by: 'stripe_webhook',
      metadata: {
        setup_intent_id: setupIntent.id,
        payment_method_id: setupIntent.payment_method,
      }
    })
  }

  console.log(`[SetupIntent] Successfully processed for business ${businessId}`)
}
