// PayU Webhook Edge Function
// Procesa confirmaciones de pago desde PayU

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHash } from 'node:crypto'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const payuApiKey = Deno.env.get('PAYU_API_KEY') ?? ''
const payuMerchantId = Deno.env.get('PAYU_MERCHANT_ID') ?? ''

// Estados de transacción PayU
const TRANSACTION_STATES = {
  APPROVED: 4,
  DECLINED: 6,
  EXPIRED: 5,
  PENDING: 7,
  ERROR: 104,
}

serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    // PayU envía datos como form-urlencoded
    const formData = await req.formData()
    
    // Extraer parámetros
    const merchantId = formData.get('merchant_id')
    const referenceCode = formData.get('reference_sale')
    const value = formData.get('value')
    const currency = formData.get('currency')
    const transactionState = parseInt(formData.get('state_pol') || '0')
    const receivedSign = formData.get('sign')
    const businessId = formData.get('extra1')
    const planType = formData.get('extra2')
    const billingCycle = formData.get('extra3')

    console.log('PayU Webhook received:', {
      merchantId,
      referenceCode,
      transactionState,
      businessId,
      planType,
      billingCycle,
    })

    // Validar firma MD5
    // Formato: ApiKey~merchantId~referenceCode~value~currency~transactionState
    const signatureString = `${payuApiKey}~${merchantId}~${referenceCode}~${value}~${currency}~${transactionState}`
    const expectedSign = createHash('md5').update(signatureString).digest('hex')

    if (receivedSign !== expectedSign) {
      console.error('Invalid signature:', { receivedSign, expectedSign })
      return new Response('Invalid signature', { status: 400 })
    }

    // Crear cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Determinar nuevo status según estado de PayU
    let newStatus: 'active' | 'past_due' | 'trialing' | 'canceled' = 'trialing'
    let paymentStatus: 'succeeded' | 'failed' | 'pending' | 'refunded' = 'pending'

    switch (transactionState) {
      case TRANSACTION_STATES.APPROVED:
        newStatus = 'active'
        paymentStatus = 'succeeded'
        break
      case TRANSACTION_STATES.DECLINED:
      case TRANSACTION_STATES.ERROR:
        newStatus = 'past_due'
        paymentStatus = 'failed'
        break
      case TRANSACTION_STATES.EXPIRED:
        newStatus = 'past_due'
        paymentStatus = 'failed'
        break
      case TRANSACTION_STATES.PENDING:
        newStatus = 'trialing'
        paymentStatus = 'pending'
        break
    }

    // Actualizar o crear business_plan
    if (paymentStatus === 'succeeded' && businessId) {
      const startDate = new Date()
      const endDate = new Date(startDate)
      
      // Calcular fecha de fin según ciclo
      if (billingCycle === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1)
      } else {
        endDate.setMonth(endDate.getMonth() + 1)
      }

      // Verificar si ya existe un plan activo
      const { data: existingPlan } = await supabase
        .from('business_plans')
        .select('id')
        .eq('business_id', businessId)
        .in('status', ['active', 'trialing'])
        .single()

      if (existingPlan) {
        // Actualizar plan existente
        await supabase
          .from('business_plans')
          .update({
            plan_type: planType,
            status: newStatus,
            billing_cycle: billingCycle,
            price: parseFloat(value),
            currency: 'COP',
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            payu_reference_code: referenceCode,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingPlan.id)
      } else {
        // Crear nuevo plan
        await supabase.from('business_plans').insert({
          business_id: businessId,
          plan_type: planType,
          status: newStatus,
          billing_cycle: billingCycle,
          price: parseFloat(value),
          currency: 'COP',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          payu_reference_code: referenceCode,
        })
      }
    }

    // Actualizar registro de pago
    await supabase
      .from('subscription_payments')
      .update({
        status: paymentStatus,
        paid_at: paymentStatus === 'succeeded' ? new Date().toISOString() : null,
        failure_reason: paymentStatus === 'failed' ? formData.get('response_message_pol') : null,
        metadata: {
          referenceCode,
          transactionState,
          payuTransactionId: formData.get('transaction_id'),
          paymentMethod: formData.get('payment_method_name'),
        },
      })
      .eq('business_id', businessId)
      .eq('metadata->>referenceCode', referenceCode)

    // Crear evento de suscripción
    await supabase.from('subscription_events').insert({
      business_id: businessId,
      event_type: paymentStatus === 'succeeded' ? 'subscription.activated' : 'payment.failed',
      previous_plan_type: null,
      new_plan_type: planType,
      metadata: {
        referenceCode,
        transactionState,
        amount: parseFloat(value),
        currency,
      },
    })

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('PayU Webhook Error:', error)
    return new Response('Internal server error', { status: 500 })
  }
})
