# 🔧 Integración PayU Latam - Sistema de Facturación

**Fecha**: 17 de octubre, 2025  
**Estado**: ✅ **IMPLEMENTADO** (Pendiente configuración)

---

## 📋 Resumen de la Integración

Se ha implementado **PayU Latam** como alternativa a Stripe para el sistema de facturación, manteniendo la arquitectura existente del Payment Gateway.

### ✅ **Características Implementadas**

1. **PayUGateway.ts** - Implementación completa de `IPaymentGateway`
2. **PaymentGatewayFactory.ts** - Pattern factory para switch entre Stripe/PayU
3. **Variable de entorno** `VITE_PAYMENT_GATEWAY` para seleccionar gateway
4. **useSubscription hook** actualizado para usar factory
5. **Compatibilidad total** con UI existente (sin cambios en componentes)

---

## 🎯 Ventajas de PayU Latam

| Feature | PayU | Stripe |
|---------|------|--------|
| **Cobertura LATAM** | ✅ 18 países | ❌ Limitado |
| **Métodos locales** | ✅ PSE, Efecty, Baloto | ❌ No |
| **Costos Colombia** | 2.99% + $900 COP | 3.25% + USD fees |
| **Documentación ES** | ✅ Español | ⚠️ Inglés |
| **Soporte local** | ✅ Horario Colombia | ❌ Internacional |
| **Cumplimiento PCI-DSS** | ✅ Level 1 | ✅ Level 1 |

---

## 🏗️ Arquitectura

### Factory Pattern

```typescript
// Variable de entorno determina el gateway
VITE_PAYMENT_GATEWAY=payu  // o 'stripe'

// Factory retorna la implementación correcta
const gateway = getPaymentGateway()
// gateway = PayUGateway() o StripeGateway()

// Uso transparente en toda la app
const dashboard = await gateway.getSubscriptionDashboard(businessId)
```

### Flujo de Implementación

```
useSubscription Hook
  ↓
PaymentGatewayFactory.getPaymentGateway()
  ↓
  ├─ VITE_PAYMENT_GATEWAY=stripe → StripeGateway
  └─ VITE_PAYMENT_GATEWAY=payu → PayUGateway
       ↓
       Edge Functions (Supabase)
       ├─ payu-create-checkout
       ├─ payu-manage-subscription
       └─ payu-webhook
            ↓
            PayU Latam API
```

---

## 🔧 Configuración

### 1. Variables de Entorno

```bash
# ============================================
# PAYMENT GATEWAY SELECTOR
# ============================================
VITE_PAYMENT_GATEWAY=payu

# ============================================
# PAYU LATAM CREDENTIALS
# ============================================
VITE_PAYU_MERCHANT_ID=your-merchant-id
VITE_PAYU_ACCOUNT_ID=your-account-id
VITE_PAYU_PUBLIC_KEY=your-public-key

# Para Edge Functions (Supabase Functions Secrets):
PAYU_API_KEY=your-api-key
PAYU_API_LOGIN=your-api-login
PAYU_TEST_MODE=true  # false en producción
```

### 2. Obtener Credenciales PayU

#### Paso 1: Crear Cuenta
1. Ve a: https://colombia.payu.com/
2. Click "Crear cuenta"
3. Completa formulario empresarial
4. Verifica email y documentos

#### Paso 2: Obtener Credenciales
1. Login: https://merchants.payulatam.com/
2. Menú → Configuración → Configuración técnica
3. Copia:
   - **Merchant ID**: Identificador del comercio
   - **Account ID**: ID de cuenta Colombia (551)
   - **API Key**: Para firma MD5
   - **API Login**: Para API REST

#### Paso 3: Configurar WebCheckout
1. Configuración técnica → WebCheckout
2. **URL de respuesta**: `https://tu-dominio.com/billing/payu/response`
3. **URL de confirmación**: `https://YOUR_PROJECT.supabase.co/functions/v1/payu-webhook`
4. Habilitar notificación automática

---

## 📦 Edge Functions Necesarias

### 1. `payu-create-checkout`

**Archivo**: `supabase/functions/payu-create-checkout/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHash } from 'node:crypto'

serve(async (req) => {
  const { businessId, planType, billingCycle, discountCode } = await req.json()
  
  // 1. Obtener plan y precio desde business_plans
  // 2. Aplicar descuento si existe
  // 3. Generar referenceCode único
  // 4. Calcular firma MD5
  // 5. Construir URL de PayU con parámetros
  // 6. Retornar checkoutUrl y referenceCode
})
```

**Firma MD5**: `ApiKey~merchantId~referenceCode~amount~currency`

### 2. `payu-manage-subscription`

**Archivo**: `supabase/functions/payu-manage-subscription/index.ts`

```typescript
serve(async (req) => {
  const { action, businessId, ...params } = await req.json()
  
  switch (action) {
    case 'update':
      // Cancelar plan actual + crear nuevo
      // Prorrateo manual
    case 'cancel':
      // POST /rest/v4.9/subscriptions/{id}
      // CANCEL_AT_PERIOD_END
    case 'pause':
      // SUSPEND subscription
    case 'resume':
      // ACTIVATE subscription
    case 'reactivate':
      // Reactivar dentro de período de gracia
  }
})
```

### 3. `payu-webhook`

**Archivo**: `supabase/functions/payu-webhook/index.ts`

```typescript
serve(async (req) => {
  const formData = await req.formData()
  const signature = formData.get('sign')
  
  // 1. Validar firma MD5
  // 2. Extraer referenceCode, transactionState, etc.
  // 3. Actualizar business_plans según estado:
  //    - APPROVED: status = 'active'
  //    - DECLINED/ERROR: status = 'past_due'
  //    - PENDING: mantener 'trialing'
  // 4. Crear registro en subscription_payments
  // 5. Retornar 200 OK
})
```

**Estados PayU**:
- `4` = APPROVED
- `6` = DECLINED
- `5` = EXPIRED
- `7` = PENDING
- `104` = ERROR

---

## 🧪 Testing

### Tarjetas de Prueba PayU

```
VISA (Aprobada)
Número: 4097440000000004
CVV: 123
Fecha: 12/29

MasterCard (Rechazada)
Número: 5451951574925480
CVV: 123
Fecha: 12/29

AMEX (Pendiente)
Número: 377813000000001
CVV: 1234
Fecha: 12/29
```

### Flujo de Testing

1. **Configurar variables** con credenciales de sandbox
2. **Ver planes** desde BillingDashboard
3. **Seleccionar plan** → Redirige a PayU WebCheckout
4. **Usar tarjeta de prueba** → Completar pago
5. **Webhook recibe confirmación** → Actualiza business_plans
6. **Usuario retorna** → Ve suscripción activa

---

## 📊 Comparación de Métodos de Pago

### Stripe
- Tarjetas de crédito/débito internacionales
- Apple Pay / Google Pay
- Link (pago express)
- ACH (USA)

### PayU
- **Tarjetas**: Visa, MasterCard, AMEX, Diners
- **PSE**: Transferencia bancaria instantánea (Colombia)
- **Efectivo**: Efecty, Baloto, PuntoRed, Pagos Oxxo (México)
- **Wallet**: Nequi, Daviplata (próximamente)

---

## 🔒 Seguridad

### Firma MD5 (Checkout)

```typescript
const signature = md5(`${apiKey}~${merchantId}~${referenceCode}~${amount}~${currency}`)
```

### Firma MD5 (Webhook Confirmation)

```typescript
const expectedSign = md5(`${apiKey}~${merchantId}~${referenceCode}~${value}~${currency}~${transactionState}`)
if (receivedSign !== expectedSign) {
  throw new Error('Invalid signature')
}
```

### Best Practices
1. ✅ Nunca exponer `API_KEY` en frontend
2. ✅ Validar siempre firma MD5 en webhooks
3. ✅ Usar HTTPS para URLs de confirmación
4. ✅ Implementar idempotencia en webhooks (evitar duplicados)
5. ✅ Logs completos de transacciones

---

## 🚀 Deploy

### 1. Aplicar Variables de Entorno

```bash
# Frontend (.env)
VITE_PAYMENT_GATEWAY=payu
VITE_PAYU_MERCHANT_ID=508029
VITE_PAYU_ACCOUNT_ID=512321
VITE_PAYU_PUBLIC_KEY=PKxxxxxxxxxxxxx

# Supabase Functions
npx supabase secrets set PAYU_API_KEY=yourkey
npx supabase secrets set PAYU_API_LOGIN=yourlogin
npx supabase secrets set PAYU_TEST_MODE=true
```

### 2. Desplegar Edge Functions

```bash
# Crear las 3 Edge Functions
npx supabase functions new payu-create-checkout
npx supabase functions new payu-manage-subscription
npx supabase functions new payu-webhook

# Implementar código (ver sección Edge Functions)

# Desplegar
npx supabase functions deploy payu-create-checkout
npx supabase functions deploy payu-manage-subscription
npx supabase functions deploy payu-webhook
```

### 3. Configurar Webhook en PayU

1. https://merchants.payulatam.com/ → Configuración técnica
2. URL de confirmación: `https://YOUR_PROJECT.supabase.co/functions/v1/payu-webhook`
3. Habilitar notificación automática
4. Probar con transacción de prueba

---

## 📚 Documentación PayU

- **API Reference**: https://developers.payulatam.com/latam/es/docs/integrations/webcheckout-integration.html
- **SDK Node.js**: https://developers.payulatam.com/latam/es/docs/tools/sdk.html
- **Tarjetas de Prueba**: https://developers.payulatam.com/latam/es/docs/tools/test-cards.html
- **Webhooks**: https://developers.payulatam.com/latam/es/docs/integrations/webhooks.html

---

## 🐛 Troubleshooting

### Error: "Invalid signature"
**Causa**: Firma MD5 incorrecta  
**Solución**: Verificar orden de parámetros y API Key correcto

### Error: "Transaction rejected"
**Causa**: Tarjeta rechazada por banco  
**Solución**: Usar tarjeta de prueba aprobada o verificar fondos

### Webhook no llega
**Causa**: URL incorrecta o firewall bloqueando  
**Solución**: Verificar URL pública, revisar logs de Edge Function

### Estado "Pending" permanece
**Causa**: Webhook no procesó correctamente  
**Solución**: Re-enviar confirmación manual desde PayU Admin Panel

---

## 🎯 Próximos Pasos

1. ⏳ **Crear las 3 Edge Functions** (payu-create-checkout, payu-manage-subscription, payu-webhook)
2. ⏳ **Testing end-to-end** con tarjetas de prueba
3. ⏳ **Documentar UI changes** (si necesarios para mostrar métodos locales)
4. ⏳ **Implementar recurrencia** automática vía PayU Subscriptions API
5. ⏳ **Agregar soporte PSE** para transferencias bancarias

---

**Autor**: Sistema de IA - AppointSync Pro  
**Versión**: 1.0.0  
**Fecha**: 17 de octubre, 2025
