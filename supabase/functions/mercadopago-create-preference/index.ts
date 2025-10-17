/**
 * MercadoPago Create Preference Edge Function
 * 
 * Crea una Preference de MercadoPago para Checkout Pro
 * 
 * Flujo:
 * 1. Recibe businessId, planType, billingCycle, discountCode
 * 2. Consulta datos del negocio en Supabase
 * 3. Calcula precio basado en plan y ciclo
 * 4. Aplica descuento si existe código válido
 * 5. Crea Preference en MercadoPago API
 * 6. Guarda payment pendiente en subscription_payments
 * 7. Retorna preference_id e init_point para redirección
 * 
 * Documentación: https://www.mercadopago.com.ar/developers/es/reference/preferences/_checkout_preferences/post
 * 
 * Variables requeridas (Supabase Secrets):
 * - MERCADOPAGO_ACCESS_TOKEN
 * 
 * @author GitHub Copilot
 * @date 2025-10-17
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Prices por plan (COP - Pesos Colombianos)
const PLAN_PRICES = {
  gratuito: { monthly: 0, yearly: 0 },
  inicio: { monthly: 80000, yearly: 800000 },
  profesional: { monthly: 200000, yearly: 2000000 },
  empresarial: { monthly: 500000, yearly: 5000000 },
  corporativo: { monthly: 0, yearly: 0 }, // Custom pricing
}

Deno.serve(async (req) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      })
    }

    // Parse request body
    const { businessId, planType, billingCycle, discountCode } = await req.json()

    if (!businessId || !planType || !billingCycle) {
      throw new Error('Missing required parameters: businessId, planType, billingCycle')
    }

    // Initialize Supabase client (service role)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get business data
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, email')
      .eq('id', businessId)
      .single()

    if (businessError || !business) {
      throw new Error(`Business not found: ${businessError?.message}`)
    }

    // Calculate price
    const basePrice = PLAN_PRICES[planType][billingCycle]
    let finalPrice = basePrice
    let discountAmount = 0

    // Apply discount code if provided
    if (discountCode) {
      const { data: discountData, error: discountError } = await supabase.rpc('apply_discount_code', {
        p_business_id: businessId,
        p_code: discountCode,
        p_plan_type: planType,
        p_amount: basePrice,
      })

      if (!discountError && discountData?.isValid) {
        discountAmount = discountData.discountAmount
        finalPrice = discountData.finalAmount
      }
    }

    // Generate unique reference code
    const referenceCode = `MP-${businessId.substring(0, 8)}-${Date.now()}`

    // Get MercadoPago Access Token
    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
    if (!accessToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN not configured')
    }

    // Create Preference in MercadoPago
    // Docs: https://www.mercadopago.com.ar/developers/es/reference/preferences/_checkout_preferences/post
    const preferencePayload = {
      items: [
        {
          title: `Plan ${planType.charAt(0).toUpperCase() + planType.slice(1)} - ${billingCycle === 'monthly' ? 'Mensual' : 'Anual'}`,
          description: `Suscripción ${billingCycle === 'monthly' ? 'mensual' : 'anual'} al plan ${planType}`,
          quantity: 1,
          unit_price: finalPrice,
          currency_id: 'COP', // Pesos Colombianos
        },
      ],
      payer: {
        name: business.name,
        email: business.email,
      },
      back_urls: {
        success: `${Deno.env.get('APP_URL')}/admin/billing?payment=success`,
        failure: `${Deno.env.get('APP_URL')}/admin/billing?payment=failure`,
        pending: `${Deno.env.get('APP_URL')}/admin/billing?payment=pending`,
      },
      auto_return: 'approved', // Auto-redirect on success
      external_reference: referenceCode,
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      statement_descriptor: 'APPOINTSYNC',
      metadata: {
        business_id: businessId,
        plan_type: planType,
        billing_cycle: billingCycle,
        discount_code: discountCode || null,
        discount_amount: discountAmount,
      },
    }

    const mercadoPagoResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferencePayload),
    })

    if (!mercadoPagoResponse.ok) {
      const errorData = await mercadoPagoResponse.json()
      throw new Error(`MercadoPago API error: ${JSON.stringify(errorData)}`)
    }

    const preferenceData = await mercadoPagoResponse.json()

    // Save pending payment in subscription_payments
    const { error: paymentError } = await supabase
      .from('subscription_payments')
      .insert({
        business_id: businessId,
        plan_type: planType,
        billing_cycle: billingCycle,
        amount: finalPrice,
        currency: 'COP',
        status: 'pending',
        payment_method: 'mercadopago',
        transaction_id: preferenceData.id,
        metadata: {
          preference_id: preferenceData.id,
          init_point: preferenceData.init_point,
          discount_code: discountCode,
          discount_amount: discountAmount,
        },
      })

    if (paymentError) {
      console.error('Error saving payment:', paymentError)
      // Don't throw, just log (payment still created in MercadoPago)
    }

    // Return preference data for frontend redirect
    return new Response(
      JSON.stringify({
        preference_id: preferenceData.id,
        init_point: preferenceData.init_point,
        sandbox_init_point: preferenceData.sandbox_init_point,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error) {
    console.error('Edge Function Error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack,
      }),
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
