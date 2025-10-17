# 🔧 Guía de Configuración del Sistema de Facturación

## 📋 Resumen de Cambios Aplicados (2025-10-17)

### ✅ Problemas Corregidos

1. **RPC `get_subscription_dashboard` actualizado**
   - ❌ **Antes**: Retornaba `{plan, currentUsage, recentPayments, isOverLimit, limitWarnings}`
   - ✅ **Ahora**: Retorna `{subscription, paymentMethods, recentPayments, upcomingInvoice, usageMetrics}`
   - 📄 Archivo: `supabase/migrations/20251017000001_fix_billing_dashboard_rpc.sql`

2. **PricingPage ahora recibe businessId como prop**
   - ❌ **Antes**: Usaba `user?.id` como businessId (incorrecto)
   - ✅ **Ahora**: Recibe `businessId` como prop desde AdminDashboard
   - 📄 Archivo: `src/pages/PricingPage.tsx`

3. **BillingDashboard muestra PricingPage inline**
   - ❌ **Antes**: Redireccionaba a `/pricing` (ruta no existente)
   - ✅ **Ahora**: Muestra `<PricingPage>` como componente dentro del dashboard
   - 📄 Archivo: `src/components/billing/BillingDashboard.tsx`

### ⚠️ Pendiente de Configuración

**Variable de entorno STRIPE (BLOQUEANTE)**
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
```

**Sin esta variable:**
- ❌ `loadStripe()` retorna `null`
- ❌ Stripe Elements no se inicializa
- ❌ No se pueden agregar métodos de pago
- ❌ No funciona el flujo de checkout

---

## 🚀 Pasos de Configuración Completos

### 1️⃣ Aplicar Migración en Supabase

```bash
# Opción A: Via Supabase CLI
npx supabase db push

# Opción B: Via Dashboard de Supabase
# 1. Ve a: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
# 2. Copia el contenido de: supabase/migrations/20251017000001_fix_billing_dashboard_rpc.sql
# 3. Click en "Run"
```

**Verificar que se aplicó correctamente:**
```sql
-- Ejecuta en Supabase SQL Editor:
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'get_subscription_dashboard';
```

Deberías ver el nuevo código de la función con el retorno correcto.

---

### 2️⃣ Configurar Stripe (CRÍTICO)

#### A. Obtener Clave Publicable

1. Ve a: https://dashboard.stripe.com/test/apikeys
2. Copia la clave que comienza con `pk_test_`
3. Agrégala a tu archivo `.env`:

```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxxxxxxxxxxxxxxx
```

#### B. Configurar Edge Functions

Las Edge Functions necesitan estas variables en Supabase:

```bash
# 1. Ve a: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/functions
# 2. En "Function Secrets" agrega:

STRIPE_SECRET_KEY=sk_test_51xxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxx

# 3. Crea los precios de los planes en Stripe:
STRIPE_PRICE_INICIO_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_INICIO_YEARLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_PROFESIONAL_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_PROFESIONAL_YEARLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_EMPRESARIAL_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_EMPRESARIAL_YEARLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_CORPORATIVO_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_CORPORATIVO_YEARLY=price_xxxxxxxxxxxxx
```

#### C. Crear Productos y Precios en Stripe

```bash
# 1. Ve a: https://dashboard.stripe.com/test/products
# 2. Click "Add product"
# 3. Crea 4 productos:

Producto 1: Inicio
- Precio Mensual: $80,000 COP (price_inicio_monthly)
- Precio Anual: $800,000 COP (price_inicio_yearly)

Producto 2: Profesional
- Precio Mensual: $200,000 COP (price_profesional_monthly)
- Precio Anual: $2,000,000 COP (price_profesional_yearly)

Producto 3: Empresarial
- Precio Mensual: $500,000 COP (price_empresarial_monthly)
- Precio Anual: $5,000,000 COP (price_empresarial_yearly)

Producto 4: Corporativo
- Precio Mensual: $1,500,000 COP (price_corporativo_monthly)
- Precio Anual: $15,000,000 COP (price_corporativo_yearly)
```

**⚠️ IMPORTANTE**: Copia los IDs de cada precio (comienzan con `price_`) y agrégalos a las variables de entorno de las Edge Functions.

---

### 3️⃣ Configurar Webhook de Stripe

#### A. Obtener URL del Webhook

Tu Edge Function `stripe-webhook` está desplegada en:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
```

Reemplaza `YOUR_PROJECT_REF` con tu referencia de proyecto de Supabase.

#### B. Crear Webhook en Stripe

1. Ve a: https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook`
4. Descripción: `Gestabiz - Webhook de Suscripciones`
5. Selecciona estos eventos:
   - `customer.created`
   - `customer.updated`
   - `customer.deleted`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `invoice.upcoming`
   - `payment_method.attached`
   - `payment_method.detached`
   - `setup_intent.succeeded`

6. Click "Add endpoint"
7. Copia el **Signing secret** (comienza con `whsec_`)
8. Agrégalo a las variables de entorno de Supabase:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxx
   ```

#### C. Probar Webhook

```bash
# Instala Stripe CLI si no lo tienes:
# https://stripe.com/docs/stripe-cli

# Autentícate:
stripe login

# Reenviar eventos a tu Edge Function local (para testing):
stripe listen --forward-to https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook

# Disparar evento de prueba:
stripe trigger customer.subscription.created
```

---

### 4️⃣ Verificar Integración

#### Test 1: Ver Planes
1. Inicia sesión como Admin
2. Ve a "Facturación" en el sidebar
3. Deberías ver "Sin Suscripción Activa"
4. Click "Ver Planes"
5. Deberías ver la página de pricing con 4 planes

✅ **Esperado**: Grid de 4 planes (Inicio, Profesional, Empresarial, Corporativo)

#### Test 2: Crear Checkout
1. En PricingPage, selecciona el plan "Inicio"
2. Click "Comenzar Gratis"
3. Deberías ser redirigido a Stripe Checkout
4. Completa el pago con tarjeta de prueba: `4242 4242 4242 4242`
5. Después del pago, deberías volver al dashboard

✅ **Esperado**: Suscripción activa visible en BillingDashboard

#### Test 3: Agregar Método de Pago
1. En BillingDashboard, tab "Métodos de Pago"
2. Click "Agregar Método de Pago"
3. Deberías ver modal con Stripe Elements
4. Ingresa tarjeta: `4242 4242 4242 4242`, fecha futura, cualquier CVC
5. Click "Guardar"

✅ **Esperado**: Tarjeta guardada y visible en la lista

#### Test 4: Ver Uso del Plan
1. En BillingDashboard, tab "Uso"
2. Deberías ver barras de progreso para:
   - Sedes (current/limit)
   - Empleados (current/limit)
   - Citas (current/limit)
   - Clientes (current/limit)
   - Servicios (current/limit)

✅ **Esperado**: Métricas actualizadas desde `usage_metrics` table

---

## 🐛 Troubleshooting

### Error: "loadStripe is not a function"
**Causa**: `VITE_STRIPE_PUBLISHABLE_KEY` no configurada
**Solución**: Agrega la variable a `.env` y reinicia el servidor dev

### Error: "Business not found"
**Causa**: PricingPage estaba usando `user.id` en lugar de `business.id`
**Solución**: ✅ Ya corregido en esta actualización

### Error: "Cannot read properties of undefined (reading 'subscription')"
**Causa**: RPC retornaba estructura incorrecta
**Solución**: ✅ Ya corregido con la migración `20251017000001_fix_billing_dashboard_rpc.sql`

### Error: "Invalid price ID"
**Causa**: Variables de entorno de Edge Functions no configuradas
**Solución**: Agrega los `STRIPE_PRICE_*` en Supabase Dashboard → Settings → Functions

### Webhook no recibe eventos
**Causa**: URL incorrecta o signing secret incorrecto
**Solución**: 
1. Verifica que la URL sea `https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook`
2. Verifica que `STRIPE_WEBHOOK_SECRET` esté configurado correctamente
3. Usa Stripe CLI para probar: `stripe listen --forward-to URL`

---

## 📊 Estado del Sistema

### ✅ Completado (Código)
- [x] Database schema (8 tablas)
- [x] 4 RPC functions actualizadas
- [x] 4 Edge Functions desplegadas
- [x] 7 componentes de facturación
- [x] Payment Gateway abstraction
- [x] Stripe Elements integration
- [x] Webhook handlers (15 eventos)
- [x] PricingPage con 4 planes
- [x] BillingDashboard con tabs
- [x] useSubscription hook
- [x] Corrección de data contracts
- [x] Corrección de routing interno

### ⏳ Pendiente (Configuración)
- [ ] Agregar `VITE_STRIPE_PUBLISHABLE_KEY` a `.env`
- [ ] Crear productos y precios en Stripe
- [ ] Configurar variables de entorno en Supabase
- [ ] Configurar webhook en Stripe Dashboard
- [ ] Testing end-to-end con cuenta Stripe real
- [ ] Aplicar migración en base de datos productiva

---

## 📞 Soporte

Si encuentras problemas durante la configuración:

1. **Revisa logs de Edge Functions**:
   ```
   https://supabase.com/dashboard/project/YOUR_PROJECT/functions/stripe-webhook/logs
   ```

2. **Revisa eventos de webhook en Stripe**:
   ```
   https://dashboard.stripe.com/test/webhooks
   ```

3. **Verifica estructura de RPC en SQL Editor**:
   ```sql
   SELECT get_subscription_dashboard('YOUR_BUSINESS_ID'::UUID);
   ```

4. **Consulta docs oficiales**:
   - Stripe: https://stripe.com/docs/api
   - Supabase Edge Functions: https://supabase.com/docs/guides/functions

---

## 🎯 Próximos Pasos Recomendados

1. **Testing**: Probar todos los flujos con tarjetas de prueba de Stripe
2. **Monitoring**: Configurar alertas para webhooks fallidos
3. **Email Notifications**: Implementar emails transaccionales para eventos de billing
4. **Limpieza de código**: Arreglar los lint warnings en BillingDashboard
5. **Documentación**: Crear guía para usuarios finales sobre cómo gestionar suscripciones

---

**Fecha de creación**: 17 de octubre, 2025
**Autor**: Sistema de IA - Gestabiz
**Versión**: 1.0.0
