// PayU Create Checkout Edge Function
// Genera firma MD5 y URL de pago para WebCheckout de PayU

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHash } from 'node:crypto'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const payuApiKey = Deno.env.get('PAYU_API_KEY') ?? ''
const payuMerchantId = Deno.env.get('PAYU_MERCHANT_ID') ?? ''
const payuAccountId = Deno.env.get('PAYU_ACCOUNT_ID') ?? ''
const payuTestMode = Deno.env.get('PAYU_TEST_MODE') === 'true'

// URLs de PayU según ambiente
const PAYU_URL = payuTestMode
  ? 'https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu'
  : 'https://checkout.payulatam.com/ppp-web-gateway-payu'

interface CheckoutRequest {
  businessId: string
  planType: 'inicio' | 'profesional' | 'empresarial' | 'corporativo'
  billingCycle: 'monthly' | 'yearly'
  discountCode?: string
}

serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    const { businessId, planType, billingCycle, discountCode }: CheckoutRequest = await req.json()

    // Validar entrada
    if (!businessId || !planType || !billingCycle) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Crear cliente Supabase con service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Obtener datos del negocio
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('name, owner_id')
      .eq('id', businessId)
      .single()

    if (businessError || !business) {
      return new Response(JSON.stringify({ error: 'Business not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 2. Calcular precio base
    const prices = {
      inicio: { monthly: 80000, yearly: 800000 },
      profesional: { monthly: 200000, yearly: 2000000 },
      empresarial: { monthly: 500000, yearly: 5000000 },
      corporativo: { monthly: 1500000, yearly: 15000000 },
    }

    let amount = prices[planType][billingCycle]

    // 3. Aplicar descuento si existe
    if (discountCode) {
      const { data: discountResult } = await supabase.rpc('apply_discount_code', {
        p_code: discountCode,
        p_plan_type: planType,
        p_amount: amount,
      })

      if (discountResult?.is_valid) {
        amount = discountResult.final_amount
      }
    }

    // 4. Generar referenceCode único
    const timestamp = Date.now()
    const referenceCode = `APPSYNC-${businessId.substring(0, 8)}-${timestamp}`

    // 5. Calcular firma MD5
    // Formato: ApiKey~merchantId~referenceCode~amount~currency
    const signatureString = `${payuApiKey}~${payuMerchantId}~${referenceCode}~${amount}~COP`
    const signature = createHash('md5').update(signatureString).digest('hex')

    // 6. Construir parámetros de PayU
    const params = new URLSearchParams({
      merchantId: payuMerchantId,
      accountId: payuAccountId,
      description: `Plan ${planType} ${billingCycle} - ${business.name}`,
      referenceCode,
      amount: amount.toString(),
      tax: '0',
      taxReturnBase: '0',
      currency: 'COP',
      signature,
      test: payuTestMode ? '1' : '0',
      buyerEmail: '', // Se obtiene en formulario de PayU
      responseUrl: `${Deno.env.get('VITE_APP_URL')}/billing/payu/response`,
      confirmationUrl: `${supabaseUrl}/functions/v1/payu-webhook`,
      extra1: businessId, // Para identificar en webhook
      extra2: planType,
      extra3: billingCycle,
    })

    // 7. Construir URL completa de checkout
    const checkoutUrl = `${PAYU_URL}?${params.toString()}`

    // 8. Guardar pending payment en DB (opcional, para tracking)
    await supabase.from('subscription_payments').insert({
      business_id: businessId,
      amount,
      currency: 'COP',
      status: 'pending',
      payment_method: 'payu',
      metadata: {
        referenceCode,
        planType,
        billingCycle,
        discountCode: discountCode || null,
      },
    })

    return new Response(
      JSON.stringify({
        checkoutUrl,
        referenceCode,
        amount,
        currency: 'COP',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('PayU Checkout Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})
