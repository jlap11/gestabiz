# 📖 Guía Paso a Paso: Configuración de Stripe para AppointSync Pro

**Fecha**: 13 de Octubre de 2025  
**Tiempo Estimado**: 45-60 minutos  
**Prerequisitos**: Cuenta de Stripe creada

---

## 📋 Índice

1. [Configuración Inicial de Stripe](#1-configuración-inicial-de-stripe)
2. [Crear Productos y Precios](#2-crear-productos-y-precios)
3. [Configurar Webhook](#3-configurar-webhook)
4. [Crear Códigos Promocionales](#4-crear-códigos-promocionales)
5. [Configurar Variables de Entorno en Supabase](#5-configurar-variables-de-entorno-en-supabase)
6. [Verificación y Testing](#6-verificación-y-testing)

---

## 1. Configuración Inicial de Stripe

### 1.1. Crear/Acceder a Cuenta Stripe

1. Ve a [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Crea una cuenta o inicia sesión
3. Selecciona **Colombia** como país de tu negocio
4. Completa la verificación de identidad (puede tomar 1-2 días hábiles)

### 1.2. Obtener API Keys

1. En el Dashboard de Stripe, ve a **Desarrolladores → API Keys**
2. Copia y guarda de forma segura:
   - **Publishable key** (pk_test_... o pk_live_...)
   - **Secret key** (sk_test_... o sk_live_...)

⚠️ **IMPORTANTE**: 
- Usa keys de **TEST** durante desarrollo
- Cambia a keys de **LIVE** solo en producción
- **NUNCA** compartas el Secret Key públicamente

---

## 2. Crear Productos y Precios

### 2.1. Producto 1: Plan Inicio

1. Ve a **Productos → Crear producto**
2. Completa el formulario:

```
Nombre: AppointSync Pro - Plan Inicio
Descripción: Plan básico ideal para negocios pequeños y emprendedores que inician

Precio 1 (Mensual):
├─ Modelo de precios: Precio estándar
├─ Precio: $80,000 COP
├─ Frecuencia de facturación: Mensual
├─ Período de prueba: 14 días
└─ Metadata: 
    └─ plan_type = inicio

Precio 2 (Anual):
├─ Modelo de precios: Precio estándar
├─ Precio: $800,000 COP
├─ Frecuencia de facturación: Anual
└─ Metadata:
    └─ plan_type = inicio
```

3. Clic en **Guardar producto**
4. **COPIA los Price IDs**:
   - Precio mensual: `price_xxxxxxxxxxxxx` → Guardar como `STRIPE_PRICE_INICIO_MONTHLY`
   - Precio anual: `price_xxxxxxxxxxxxx` → Guardar como `STRIPE_PRICE_INICIO_YEARLY`

### 2.2. Producto 2: Plan Profesional

Repite el proceso:

```
Nombre: AppointSync Pro - Plan Profesional
Descripción: Plan avanzado para negocios en crecimiento con múltiples empleados

Precio 1 (Mensual):
├─ Precio: $200,000 COP
├─ Frecuencia: Mensual
└─ Metadata: plan_type = profesional

Precio 2 (Anual):
├─ Precio: $2,000,000 COP
├─ Frecuencia: Anual
└─ Metadata: plan_type = profesional
```

**COPIA los Price IDs**:
- `STRIPE_PRICE_PROFESIONAL_MONTHLY`
- `STRIPE_PRICE_PROFESIONAL_YEARLY`

### 2.3. Producto 3: Plan Empresarial

```
Nombre: AppointSync Pro - Plan Empresarial
Descripción: Plan completo para empresas establecidas con alta demanda

Precio 1 (Mensual):
├─ Precio: $500,000 COP
├─ Frecuencia: Mensual
└─ Metadata: plan_type = empresarial

Precio 2 (Anual):
├─ Precio: $5,000,000 COP
├─ Frecuencia: Anual
└─ Metadata: plan_type = empresarial
```

**COPIA los Price IDs**:
- `STRIPE_PRICE_EMPRESARIAL_MONTHLY`
- `STRIPE_PRICE_EMPRESARIAL_YEARLY`

### 2.4. Producto 4: Plan Corporativo

```
Nombre: AppointSync Pro - Plan Corporativo
Descripción: Solución personalizada para grandes corporaciones - Contactar ventas

⚠️ Este plan NO tiene precios fijos
└─ Configurar como "Contactar ventas" o crear precios placeholder de $1 COP
```

**COPIA los Price IDs** (si creaste placeholders):
- `STRIPE_PRICE_CORPORATIVO_MONTHLY`
- `STRIPE_PRICE_CORPORATIVO_YEARLY`

### 📝 Resumen de Price IDs

Al finalizar, deberías tener **8 Price IDs**:

| Plan | Mensual | Anual |
|------|---------|-------|
| Inicio | price_inicio_monthly_xxx | price_inicio_yearly_xxx |
| Profesional | price_profesional_monthly_xxx | price_profesional_yearly_xxx |
| Empresarial | price_empresarial_monthly_xxx | price_empresarial_yearly_xxx |
| Corporativo | price_corporativo_monthly_xxx | price_corporativo_yearly_xxx |

---

## 3. Configurar Webhook

### 3.1. Crear Endpoint de Webhook

1. Ve a **Desarrolladores → Webhooks**
2. Clic en **Agregar endpoint**
3. Completa el formulario:

```
URL del endpoint: https://gftnvpspfjsjxhniqymr.supabase.co/functions/v1/stripe-webhook

Descripción: AppointSync Pro - Webhook de suscripciones

Versión: 2023-10-16 (o la más reciente)

Escuchar: Eventos en su cuenta
```

### 3.2. Seleccionar Eventos

Marca los siguientes **14 eventos**:

#### Customer Events (3)
- [x] `customer.created`
- [x] `customer.updated`
- [x] `customer.deleted`

#### Subscription Events (4)
- [x] `customer.subscription.created`
- [x] `customer.subscription.updated`
- [x] `customer.subscription.deleted`
- [x] `customer.subscription.trial_will_end`

#### Payment Intent Events (2)
- [x] `payment_intent.succeeded`
- [x] `payment_intent.payment_failed`

#### Invoice Events (3)
- [x] `invoice.payment_succeeded`
- [x] `invoice.payment_failed`
- [x] `invoice.upcoming`

#### Payment Method Events (2)
- [x] `payment_method.attached`
- [x] `payment_method.detached`

#### Setup Intent Events (1)
- [x] `setup_intent.succeeded`

4. Clic en **Agregar endpoint**

### 3.3. Obtener Webhook Secret

1. En la lista de webhooks, clic en el webhook recién creado
2. En la sección **Signing secret**, clic en **Reveal**
3. Copia el secret (empieza con `whsec_...`)
4. Guárdalo como `STRIPE_WEBHOOK_SECRET`

⚠️ **CRÍTICO**: Este secret es necesario para validar que los eventos vienen realmente de Stripe.

### 3.4. Probar Webhook (Opcional)

1. En la página del webhook, ve a la pestaña **Pruebas**
2. Selecciona un evento (ej: `customer.subscription.created`)
3. Clic en **Enviar evento de prueba**
4. Verifica en **Logs** que el webhook recibió el evento correctamente

---

## 4. Crear Códigos Promocionales

### 4.1. Crear Cupones Base

1. Ve a **Productos → Cupones → Crear cupón**

#### Cupón 1: LAUNCH2025 (20% descuento)
```
ID del cupón: LAUNCH2025
Tipo: Porcentaje
Descuento: 20%
Duración: Para siempre
Límite de canjes: 100
```

#### Cupón 2: PARTNER30 (30% descuento)
```
ID del cupón: PARTNER30
Tipo: Porcentaje
Descuento: 30%
Duración: Para siempre
Límite de canjes: Ilimitado
```

#### Cupón 3: TRIAL60 ($60,000 COP descuento)
```
ID del cupón: TRIAL60
Tipo: Cantidad fija
Descuento: $60,000 COP
Duración: Una vez
Límite de canjes: 50
Fecha de vencimiento: 13 de Noviembre de 2025
```

#### Cupón 4: BLACKFRIDAY2025 (50% descuento)
```
ID del cupón: BLACKFRIDAY2025
Tipo: Porcentaje
Descuento: 50%
Duración: Una vez
Límite de canjes: 500
Fecha de vencimiento: 1 de Diciembre de 2025
```

#### Cupón 5: REFERIDO15 (15% descuento)
```
ID del cupón: REFERIDO15
Tipo: Porcentaje
Descuento: 15%
Duración: Para siempre
Límite de canjes: Ilimitado
```

#### Cupón 6: DEVTEST (100% gratis - solo testing)
```
ID del cupón: DEVTEST
Tipo: Porcentaje
Descuento: 100%
Duración: Para siempre
Límite de canjes: 999
⚠️ Solo para ambiente de pruebas
```

### 4.2. Crear Promotion Codes

Para cada cupón creado, crea un **Promotion Code**:

1. Ve a **Productos → Códigos promocionales → Crear código**
2. Selecciona el cupón base
3. **Código**: Usa el mismo ID del cupón (LAUNCH2025, PARTNER30, etc.)
4. Activo: ✓
5. Clic en **Crear código**

Repite para los 6 cupones.

---

## 5. Configurar Variables de Entorno en Supabase

### 5.1. Acceder a Supabase Dashboard

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto: **dkancockzvcqorqbwtyh**
3. Ve a **Edge Functions → Manage secrets**

### 5.2. Agregar Secrets

Clic en **New secret** para cada variable:

#### Credenciales de Stripe (2 variables)
```bash
Name: STRIPE_SECRET_KEY
Value: sk_test_xxxxxxxxxxxxxxxxxxxxx
# (usa sk_live_xxx en producción)

Name: STRIPE_WEBHOOK_SECRET
Value: whsec_xxxxxxxxxxxxxxxxxxxxx
```

#### Price IDs de Stripe (8 variables)
```bash
Name: STRIPE_PRICE_INICIO_MONTHLY
Value: price_xxxxxxxxxxxxx

Name: STRIPE_PRICE_INICIO_YEARLY
Value: price_xxxxxxxxxxxxx

Name: STRIPE_PRICE_PROFESIONAL_MONTHLY
Value: price_xxxxxxxxxxxxx

Name: STRIPE_PRICE_PROFESIONAL_YEARLY
Value: price_xxxxxxxxxxxxx

Name: STRIPE_PRICE_EMPRESARIAL_MONTHLY
Value: price_xxxxxxxxxxxxx

Name: STRIPE_PRICE_EMPRESARIAL_YEARLY
Value: price_xxxxxxxxxxxxx

Name: STRIPE_PRICE_CORPORATIVO_MONTHLY
Value: price_xxxxxxxxxxxxx

Name: STRIPE_PRICE_CORPORATIVO_YEARLY
Value: price_xxxxxxxxxxxxx
```

### 5.3. Verificar Variables

Deberías tener **10 secrets** en total:
- [x] STRIPE_SECRET_KEY
- [x] STRIPE_WEBHOOK_SECRET
- [x] STRIPE_PRICE_INICIO_MONTHLY
- [x] STRIPE_PRICE_INICIO_YEARLY
- [x] STRIPE_PRICE_PROFESIONAL_MONTHLY
- [x] STRIPE_PRICE_PROFESIONAL_YEARLY
- [x] STRIPE_PRICE_EMPRESARIAL_MONTHLY
- [x] STRIPE_PRICE_EMPRESARIAL_YEARLY
- [x] STRIPE_PRICE_CORPORATIVO_MONTHLY
- [x] STRIPE_PRICE_CORPORATIVO_YEARLY

⚠️ **Nota**: Las Edge Functions necesitan reiniciarse para usar los nuevos secrets. Esto ocurre automáticamente tras guardar.

---

## 6. Verificación y Testing

### 6.1. Test del Webhook

#### Método 1: Desde Stripe Dashboard

1. Ve a **Desarrolladores → Webhooks**
2. Selecciona tu webhook
3. Pestaña **Pruebas**
4. Selecciona `customer.subscription.created`
5. Clic en **Enviar evento de prueba**
6. Verifica en **Logs** que retorna `200 OK`

#### Método 2: Desde Terminal

```bash
# Instalar Stripe CLI
# Windows (PowerShell como admin)
scoop install stripe

# Verificar instalación
stripe --version

# Login
stripe login

# Escuchar eventos localmente (para testing)
stripe listen --forward-to https://gftnvpspfjsjxhniqymr.supabase.co/functions/v1/stripe-webhook

# En otra terminal, trigger evento de prueba
stripe trigger customer.subscription.created
```

### 6.2. Test de Checkout Session

#### Desde la aplicación:

```bash
# En el proyecto React
npm run dev
```

1. Navega a `/pricing`
2. Selecciona "Plan Profesional - Mensual"
3. Ingresa código de descuento: `LAUNCH2025`
4. Clic en "Suscribirse"
5. Deberías ser redirigido a Stripe Checkout

#### Tarjetas de prueba de Stripe:

```
Pago Exitoso:
└─ Número: 4242 4242 4242 4242
└─ Fecha: Cualquier fecha futura (ej: 12/26)
└─ CVC: Cualquier 3 dígitos (ej: 123)
└─ ZIP: Cualquier 5 dígitos (ej: 12345)

Pago Fallido:
└─ Número: 4000 0000 0000 0002

Requiere Autenticación (3D Secure):
└─ Número: 4000 0025 0000 3155
```

### 6.3. Verificar Sincronización en Supabase

1. Ve a Supabase Dashboard → **Table Editor**
2. Abre tabla `business_plans`
3. Verifica que se creó un registro con:
   - ✓ `stripe_customer_id` poblado
   - ✓ `stripe_subscription_id` poblado
   - ✓ `plan_type` = 'profesional'
   - ✓ `status` = 'trialing' o 'active'

4. Abre tabla `subscription_events`
5. Verifica eventos registrados:
   - ✓ `event_type` = 'created'
   - ✓ `metadata` con detalles de la suscripción

6. Abre tabla `subscription_payments`
7. Verifica pago registrado (si completaste checkout):
   - ✓ `amount` correcto
   - ✓ `status` = 'completed'
   - ✓ `paid_at` poblado

### 6.4. Verificar Logs de Edge Function

1. Ve a Supabase Dashboard → **Edge Functions**
2. Selecciona `stripe-webhook`
3. Pestaña **Logs**
4. Busca:
   - ✓ `[Webhook] Event received: customer.subscription.created`
   - ✓ Sin errores 400 o 500

---

## 📝 Checklist Final de Configuración

### Stripe Dashboard
- [ ] Cuenta de Stripe activada y verificada
- [ ] API Keys copiadas (Publishable + Secret)
- [ ] 4 productos creados
- [ ] 8 precios creados con metadata `plan_type`
- [ ] Webhook configurado con 14 eventos
- [ ] Webhook secret copiado
- [ ] 6 cupones creados
- [ ] 6 promotion codes creados

### Supabase Dashboard
- [ ] 10 variables de entorno configuradas
- [ ] Edge Functions reiniciadas (automático)

### Testing
- [ ] Webhook responde 200 OK en pruebas
- [ ] Checkout session redirige correctamente
- [ ] Pago de prueba completa correctamente
- [ ] Datos sincronizados en `business_plans`
- [ ] Eventos registrados en `subscription_events`
- [ ] Pagos registrados en `subscription_payments`
- [ ] Logs de Edge Function sin errores

---

## 🚨 Troubleshooting Común

### Error: "No se encuentra el Price ID"
**Causa**: Variable de entorno mal configurada  
**Solución**:
1. Verifica que el Price ID en Supabase Secrets sea correcto
2. Verifica que no tenga espacios al inicio/fin
3. Reinicia las Edge Functions manualmente si es necesario

### Error: "Webhook signature verification failed"
**Causa**: Webhook secret incorrecto  
**Solución**:
1. Re-copia el webhook secret desde Stripe Dashboard
2. Actualiza `STRIPE_WEBHOOK_SECRET` en Supabase
3. Asegúrate de no incluir espacios extra

### Error: "Customer not found"
**Causa**: business_id no está en metadata de Stripe Customer  
**Solución**:
1. Verifica que create-checkout-session esté pasando business_id en metadata
2. Chequea logs de la Edge Function

### Checkout redirige pero no sincroniza
**Causa**: Webhook no está recibiendo eventos  
**Solución**:
1. Verifica que la URL del webhook sea correcta
2. Chequea que los 14 eventos estén seleccionados
3. Revisa logs del webhook en Stripe Dashboard

---

## 🎉 ¡Listo!

Si completaste todos los pasos, tu sistema de pagos debería estar **100% funcional**.

### Próximos Pasos:
1. Crear tests E2E automatizados
2. Implementar notificaciones por email
3. Configurar Customer Portal de Stripe (opcional)
4. Cambiar a modo LIVE para producción

---

**Tiempo Total**: ~45-60 minutos  
**Dificultad**: Media  
**Prerequisitos**: Cuenta Stripe verificada

**Documentación de Referencia**:
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
