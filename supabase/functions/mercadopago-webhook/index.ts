/**
 * MercadoPago Webhook Edge Function
 *
 * Procesa notificaciones IPN de MercadoPago
 * Actualiza estado de suscripción en Supabase
 *
 * Flujo:
 * 1. MercadoPago envía POST con notificación
 * 2. Extrae payment_id y type de query params o body
 * 3. Consulta Payment API para obtener detalles
 * 4. Valida external_reference (referenceCode)
 * 5. Mapea status de pago a status de suscripción
 * 6. Actualiza/crea business_plan
 * 7. Actualiza subscription_payments
 * 8. Crea evento en subscription_events
 *
 * Documentación: https://www.mercadopago.com.ar/developers/es/docs/subscriptions/integration-configuration/ipn
 *
 * Tipos de notificación:
 * - payment: Pago creado/actualizado
 * - merchant_order: Orden creada/actualizada
 *
 * Estados de pago MercadoPago:
 * - approved: Pago aprobado
 * - pending: Pendiente
 * - in_process: En proceso
 * - rejected: Rechazado
 * - refunded: Reembolsado
 * - charged_back: Contracargo
 * - cancelled: Cancelado
 *
 * @author GitHub Copilot
 * @date 2025-10-17
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { initSentry, captureEdgeFunctionError, flushSentry } from '../_shared/sentry.ts'

// Initialize Sentry
initSentry('mercadopago-webhook')

// Mapeo de estados de pago MercadoPago a estados de suscripción
const STATUS_MAPPING = {
  approved: 'active',
  pending: 'trialing',
  in_process: 'trialing',
  rejected: 'past_due',
  refunded: 'canceled',
  charged_back: 'canceled',
  cancelled: 'canceled',
}

// Plan limits
const PLAN_LIMITS = {
  gratuito: {
    max_locations: 1,
    max_employees: 1,
    max_services: 1,
    max_monthly_appointments: 3,
  },
  inicio: {
    max_locations: 1,
    max_employees: 3,
    max_services: 5,
    max_monthly_appointments: -1, // ilimitado
  },
  profesional: {
    max_locations: 3,
    max_employees: 10,
    max_services: 20,
    max_monthly_appointments: -1,
  },
  empresarial: {
    max_locations: 10,
    max_employees: 50,
    max_services: 100,
    max_monthly_appointments: -1,
  },
  corporativo: {
    max_locations: -1,
    max_employees: -1,
    max_services: -1,
    max_monthly_appointments: -1,
  },
}

Deno.serve(async req => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'content-type',
        },
      })
    }

    // Parse URL query params (MercadoPago sends data via query)
    const url = new URL(req.url)
    const topic = url.searchParams.get('topic') || url.searchParams.get('type')
    const id = url.searchParams.get('id') || url.searchParams.get('data.id')

    console.log('Webhook received:', { topic, id })

    if (!id || !topic) {
      throw new Error('Missing id or topic in webhook notification')
    }

    // Only process payment notifications
    if (topic !== 'payment') {
      console.log('Ignoring non-payment notification:', topic)
      return new Response(JSON.stringify({ status: 'ignored' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get MercadoPago Access Token
    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
    if (!accessToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN not configured')
    }

    // Fetch payment details from MercadoPago API
    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!paymentResponse.ok) {
      throw new Error(`Failed to fetch payment from MercadoPago: ${paymentResponse.statusText}`)
    }

    const payment = await paymentResponse.json()

    console.log('Payment fetched:', {
      id: payment.id,
      status: payment.status,
      external_reference: payment.external_reference,
    })

    // Extract metadata from external_reference or payment metadata
    const businessId = payment.metadata?.business_id
    const planType = payment.metadata?.plan_type
    const billingCycle = payment.metadata?.billing_cycle

    if (!businessId || !planType || !billingCycle) {
      throw new Error('Missing business_id, plan_type, or billing_cycle in payment metadata')
    }

    // Map MercadoPago status to subscription status
    const subscriptionStatus = STATUS_MAPPING[payment.status] || 'inactive'

    // Calculate period dates
    const currentPeriodStart = new Date()
    const currentPeriodEnd = new Date()
    if (billingCycle === 'monthly') {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1)
    } else {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1)
    }

    // Get plan limits
    const limits = PLAN_LIMITS[planType] || PLAN_LIMITS.gratuito

    // Upsert business_plan
    const { data: businessPlan, error: businessPlanError } = await supabase
      .from('business_plan')
      .upsert(
        {
          business_id: businessId,
          plan_type: planType,
          billing_cycle: billingCycle,
          status: subscriptionStatus,
          current_period_start: currentPeriodStart.toISOString(),
          current_period_end: currentPeriodEnd.toISOString(),
          amount: payment.transaction_amount,
          currency: payment.currency_id,
          max_locations: limits.max_locations,
          max_employees: limits.max_employees,
          max_services: limits.max_services,
          max_monthly_appointments: limits.max_monthly_appointments,
          payment_gateway: 'mercadopago',
          gateway_subscription_id: payment.id.toString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'business_id',
        }
      )
      .select()
      .single()

    if (businessPlanError) {
      console.error('Error upserting business_plan:', businessPlanError)
      throw businessPlanError
    }

    console.log('Business plan updated:', businessPlan.id)

    // Update subscription_payments
    const { error: paymentUpdateError } = await supabase
      .from('subscription_payments')
      .update({
        status:
          payment.status === 'approved'
            ? 'completed'
            : payment.status === 'rejected'
              ? 'failed'
              : 'pending',
        paid_at: payment.status === 'approved' ? new Date().toISOString() : null,
        failure_reason: payment.status_detail,
        metadata: {
          ...payment.metadata,
          payment_id: payment.id,
          payment_type_id: payment.payment_type_id,
          payment_method_id: payment.payment_method_id,
        },
      })
      .eq('transaction_id', payment.external_reference)

    if (paymentUpdateError) {
      console.error('Error updating subscription_payments:', paymentUpdateError)
      // Don't throw, continue with event creation
    }

    // Create subscription event
    const { error: eventError } = await supabase.from('subscription_events').insert({
      business_id: businessId,
      event_type:
        subscriptionStatus === 'active' ? 'subscription_activated' : 'payment_status_changed',
      event_data: {
        payment_id: payment.id,
        status: payment.status,
        amount: payment.transaction_amount,
        currency: payment.currency_id,
        gateway: 'mercadopago',
      },
    })

    if (eventError) {
      console.error('Error creating subscription event:', eventError)
      // Don't throw, webhook processed successfully
    }

    return new Response(
      JSON.stringify({
        status: 'success',
        subscription_status: subscriptionStatus,
        payment_status: payment.status,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Webhook Error:', error)

    // Capture error to Sentry
    captureEdgeFunctionError(error as Error, {
      functionName: 'mercadopago-webhook',
      operation: 'handleWebhook',
    })

    await flushSentry()

    return new Response(
      JSON.stringify({
        error: (error as Error).message,
        details: (error as Error).stack,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})
