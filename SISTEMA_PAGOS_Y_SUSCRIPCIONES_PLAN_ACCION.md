# SISTEMA DE PAGOS Y SUSCRIPCIONES - PLAN DE ACCIÓN DETALLADO

**Fecha:** 13 de octubre de 2025  
**Proyecto:** AppointSync Pro  
**Referencia:** `SISTEMA_PAGOS_Y_SUSCRIPCIONES_ANALISIS.md`  
**Versión:** 2.0 - Detallado

---

## 📋 TABLA DE CONTENIDOS

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Fase 0: Setup y Configuración](#fase-0-setup-y-configuración)
4. [Fase 1: Base de Datos y Migraciones](#fase-1-base-de-datos-y-migraciones)
5. [Fase 2: Integración Stripe](#fase-2-integración-stripe)
6. [Fase 3: Suscripciones y Webhooks](#fase-3-suscripciones-y-webhooks)
7. [Fase 4: Sistema de Límites y Métricas](#fase-4-sistema-de-límites-y-métricas)
8. [Fase 5: Componentes UI de Billing](#fase-5-componentes-ui-de-billing)
9. [Fase 6: Testing y QA](#fase-6-testing-y-qa)
10. [Fase 7: Deployment y Monitoreo](#fase-7-deployment-y-monitoreo)
11. [Cronograma y Recursos](#cronograma-y-recursos)

---

## 🎯 RESUMEN EJECUTIVO

### Objetivo
Implementar un **sistema completo de pagos, suscripciones y billing** para monetizar AppointSync Pro con 4 planes de pricing ($29.900 - $149.900 COP/mes + plan corporativo a medida).

### Alcance del Proyecto
- ✅ Procesamiento de pagos con tarjeta (débito/crédito) vía Stripe
- ✅ Gestión completa de suscripciones (crear, renovar, upgrade, downgrade, cancelar)
- ✅ Sistema de límites por plan con tracking de consumo en tiempo real
- ✅ Dashboard de facturación para usuarios (historial, métodos de pago, uso)
- ✅ Webhooks para sincronización automática Stripe ↔ Supabase
- ✅ Sistema de cupones y descuentos
- ✅ Manejo de fallos de pago con reintentos automáticos

### Estimación Total: **218 horas** (6-8 semanas para 1 dev senior)

| Fase | Objetivo | Duración | Complejidad |
|------|----------|----------|-------------|
| **Fase 0** | Setup y Configuración Stripe | 8h | 🟢 Baja |
| **Fase 1** | Base de Datos y Migraciones SQL | 36h | 🟡 Media |
| **Fase 2** | Integración Stripe (Gateway + Edge Functions) | 42h | 🔴 Alta |
| **Fase 3** | Suscripciones Recurrentes y Límites | 48h | 🔴 Alta |
| **Fase 4** | Interfaz de Usuario Completa | 46h | 🟡 Media |
| **Fase 5** | QA, Operaciones y Lanzamiento | 36h | 🟡 Media |

**NOTA:** Fases 4 y 5 ajustadas por mayor detalle. Total actualizado: **218 → 216 horas**

---

## 🛠️ STACK TECNOLÓGICO

### Frontend
- **React 19** con TypeScript
- **@stripe/stripe-js** + **@stripe/react-stripe-js** (v2.x)
- **TanStack Query v5** para estado de servidor
- **Tailwind CSS** para UI
- **Zod** para validación de formularios

### Backend
- **Supabase PostgreSQL** como base de datos
- **Supabase Edge Functions** (Deno) para lógica serverless
- **Stripe API v12+** para procesamiento de pagos
- **Row Level Security (RLS)** para seguridad de datos

### DevOps
- **Supabase CLI** para migraciones
- **Vitest** para testing unitario
- **Playwright** para testing e2e
- **GitHub Actions** para CI/CD

---

## 🚀 FASE 0 — Setup y Configuración (8 horas)

### Objetivo
Preparar el entorno de desarrollo, configurar credenciales de Stripe y establecer lineamientos de seguridad PCI DSS.

---

### 📝 Tareas

#### 0.1 Registro y Configuración de Stripe (3 horas)

**Pasos:**
1. **Crear cuenta Stripe** en https://dashboard.stripe.com/register
   - Usar email corporativo de AppointSync Pro
   - Configurar como cuenta de prueba inicialmente
   
2. **Generar API Keys de Test:**
   - Publishable key: `pk_test_...`
   - Secret key: `sk_test_...`
   - Webhook signing secret: `whsec_...` (se obtiene después de configurar webhook)

3. **Configurar productos en Stripe Dashboard:**
   ```javascript
   // Crear 4 productos en Stripe:
   // 1. Plan Inicio - $29.900 COP/mes
   // 2. Plan Profesional - $79.900 COP/mes  
   // 3. Plan Empresarial - $149.900 COP/mes
   // 4. Plan Corporativo - Precio personalizado
   ```

4. **Configurar webhook endpoint:**
   - URL temporal: `https://[project-ref].supabase.co/functions/v1/stripe-webhook`
   - Eventos a escuchar:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `payment_method.attached`
     - `payment_method.detached`

**Entregables:**
- ✅ Cuenta Stripe activa en modo test
- ✅ 4 productos configurados con precios en COP
- ✅ Webhook endpoint registrado
- ✅ API keys documentadas

---

#### 0.2 Configuración de Secrets en Supabase (2 horas)

**Archivo:** `supabase/.env.local` (NO commitear)

```bash
# Stripe Test Keys
STRIPE_SECRET_KEY=sk_test_51xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Stripe Product IDs
STRIPE_PRODUCT_INICIO_MONTHLY=price_xxxxx
STRIPE_PRODUCT_PROFESIONAL_MONTHLY=price_xxxxx
STRIPE_PRODUCT_EMPRESARIAL_MONTHLY=price_xxxxx
STRIPE_PRODUCT_INICIO_YEARLY=price_xxxxx
STRIPE_PRODUCT_PROFESIONAL_YEARLY=price_xxxxx
STRIPE_PRODUCT_EMPRESARIAL_YEARLY=price_xxxxx
```

**Comandos para configurar en Supabase:**
```powershell
# Configurar secrets en Supabase Edge Functions
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx
supabase secrets set STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

**Archivo:** `src/.env.local` (para Vite)
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

**Entregables:**
- ✅ Secrets configurados en Supabase CLI
- ✅ Variables de entorno para desarrollo local
- ✅ Documentación de secrets en 1Password/Bitwarden

---

#### 0.3 Lineamientos de Seguridad PCI DSS (3 horas)

**Archivo:** `docs/security/pci-compliance-guide.md`

```markdown
# Guía de Cumplimiento PCI DSS para AppointSync Pro

## Reglas Fundamentales

### ❌ NUNCA Almacenar:
- Número completo de tarjeta
- CVV/CVC
- Datos de banda magnética
- PIN

### ✅ SÍ Podemos Almacenar:
- Últimos 4 dígitos
- Fecha de expiración
- Nombre del titular
- Token de Stripe (payment_method_id)

## Implementación Segura

### 1. Uso de Stripe Elements
- Los datos de tarjeta NUNCA pasan por nuestro servidor
- Stripe maneja la tokenización
- Somos SAQ A compliant por diseño

### 2. Validación de Webhooks
- SIEMPRE validar firma con `stripe.webhooks.constructEvent()`
- Rechazar requests sin firma válida
- Logs de intentos fallidos

### 3. Row Level Security (RLS)
- Usuarios solo ven sus propios datos de pago
- Bloquear modificaciones directas desde cliente
- Auditoría de todos los cambios

## Checklist de Code Review
- [ ] No hay PAN (Primary Account Number) en logs
- [ ] Stripe Elements usado correctamente
- [ ] Webhooks validan firma
- [ ] RLS habilitado en tablas de pago
- [ ] Secrets no hardcodeados
```

**Entregables:**
- ✅ Documento `docs/security/pci-compliance-guide.md`
- ✅ Checklist de seguridad para PRs
- ✅ Plan de respuesta a incidentes

---

### 🎯 Checkpoint Fase 0

**Criterios de Éxito:**
- ✅ Cuenta Stripe configurada con productos
- ✅ Secrets seguros en Supabase y .env
- ✅ Documentación de seguridad completa
- ✅ Equipo capacitado en PCI DSS básico

**Tiempo Estimado:** 8 horas  
**Bloqueantes:** Ninguno  
**Siguiente Fase:** Fase 1 - Base de Datos

---

## 🗄️ FASE 1 — Base de Datos y Migraciones (36 horas)

### Objetivo
Crear el esquema completo de base de datos para pagos, suscripciones y métricas de uso.

---

### 📝 Tareas

#### 1.1 Migración Principal: Tablas de Billing (14 horas)

**Archivo:** `supabase/migrations/20251015000000_billing_system_core.sql`

```sql
-- ============================================================================
-- SISTEMA DE PAGOS Y SUSCRIPCIONES
-- Fecha: 2025-10-15
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ACTUALIZAR ENUMS EXISTENTES
-- ============================================================================

-- Verificar si necesitamos actualizar plan_type
DO $$ BEGIN
    -- Agregar 'corporativo' si no existe
    ALTER TYPE plan_type ADD VALUE IF NOT EXISTS 'corporativo';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 2. TABLA: payment_methods
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    
    -- Información de la tarjeta (solo metadatos, NO datos sensibles)
    type VARCHAR(20) NOT NULL CHECK (type IN ('credit_card', 'debit_card')),
    provider VARCHAR(50) NOT NULL, -- 'visa', 'mastercard', 'amex', 'diners'
    last_four VARCHAR(4) NOT NULL,
    expiry_month INTEGER NOT NULL CHECK (expiry_month BETWEEN 1 AND 12),
    expiry_year INTEGER NOT NULL CHECK (expiry_year >= EXTRACT(YEAR FROM CURRENT_DATE)),
    cardholder_name VARCHAR(255) NOT NULL,
    
    -- Dirección de facturación
    billing_address_line1 VARCHAR(255),
    billing_address_line2 VARCHAR(255),
    billing_city VARCHAR(100),
    billing_state VARCHAR(100),
    billing_country VARCHAR(3) DEFAULT 'COL',
    billing_postal_code VARCHAR(20),
    
    -- Integración con Stripe
    stripe_customer_id VARCHAR(255), -- Stripe Customer ID
    stripe_payment_method_id VARCHAR(255) NOT NULL UNIQUE, -- Stripe PaymentMethod ID
    stripe_fingerprint VARCHAR(255), -- Para detectar tarjetas duplicadas
    
    -- Estado
    is_default BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Solo puede haber un método de pago por defecto por negocio
    CONSTRAINT unique_default_per_business 
        EXCLUDE (business_id WITH =) 
        WHERE (is_default = true)
);

-- Índices para payment_methods
CREATE INDEX idx_payment_methods_business_id ON payment_methods(business_id);
CREATE INDEX idx_payment_methods_stripe_customer ON payment_methods(stripe_customer_id);
CREATE INDEX idx_payment_methods_active ON payment_methods(is_active) WHERE is_active = true;

COMMENT ON TABLE payment_methods IS 'Métodos de pago almacenados (solo tokens de Stripe, NO datos sensibles)';
COMMENT ON COLUMN payment_methods.stripe_payment_method_id IS 'Token seguro de Stripe, nunca almacenamos el número completo';

-- ============================================================================
-- 3. TABLA: subscription_payments
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES business_plans(id) ON DELETE CASCADE,
    
    -- Detalles del pago
    amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'COP',
    status VARCHAR(20) NOT NULL CHECK (status IN (
        'pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'
    )) DEFAULT 'pending',
    
    -- Método de pago usado
    payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
    
    -- Integración con Stripe
    stripe_invoice_id VARCHAR(255) UNIQUE,
    stripe_charge_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    stripe_response JSONB DEFAULT '{}',
    
    -- Periodo de facturación
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    
    -- Timestamps
    attempted_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    
    -- Manejo de errores y reintentos
    failure_reason TEXT,
    retry_count INTEGER DEFAULT 0 CHECK (retry_count >= 0),
    next_retry_at TIMESTAMPTZ,
    max_retries INTEGER DEFAULT 3,
    
    -- Documentos
    invoice_url TEXT,
    receipt_url TEXT,
    invoice_pdf BYTEA, -- Opcional: PDF almacenado localmente
    
    -- Metadata
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint: periodo válido
    CONSTRAINT valid_billing_period CHECK (billing_period_end > billing_period_start)
);

-- Índices para subscription_payments
CREATE INDEX idx_subscription_payments_business_id ON subscription_payments(business_id);
CREATE INDEX idx_subscription_payments_plan_id ON subscription_payments(plan_id);
CREATE INDEX idx_subscription_payments_status ON subscription_payments(status);
CREATE INDEX idx_subscription_payments_billing_period ON subscription_payments(billing_period_start, billing_period_end);
CREATE INDEX idx_subscription_payments_stripe_invoice ON subscription_payments(stripe_invoice_id);
CREATE INDEX idx_subscription_payments_next_retry ON subscription_payments(next_retry_at) WHERE next_retry_at IS NOT NULL;

COMMENT ON TABLE subscription_payments IS 'Historial de pagos de suscripciones';
COMMENT ON COLUMN subscription_payments.retry_count IS 'Número de reintentos realizados (máximo 3)';

-- ============================================================================
-- 4. TABLA: subscription_events
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES business_plans(id) ON DELETE CASCADE,
    
    -- Tipo de evento
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'created', 'activated', 'upgraded', 'downgraded', 
        'renewed', 'cancelled', 'expired', 'suspended', 'reactivated',
        'payment_failed', 'payment_succeeded', 'trial_started', 'trial_ended',
        'payment_method_added', 'payment_method_removed'
    )),
    
    -- Detalles del cambio (para upgrades/downgrades)
    old_plan_type plan_type,
    new_plan_type plan_type,
    old_price DECIMAL(12,2),
    new_price DECIMAL(12,2),
    old_billing_cycle VARCHAR(10),
    new_billing_cycle VARCHAR(10),
    
    -- Contexto
    reason TEXT,
    notes TEXT,
    triggered_by VARCHAR(20) CHECK (triggered_by IN ('user', 'system', 'admin', 'webhook')) DEFAULT 'system',
    
    -- Relaciones
    payment_id UUID REFERENCES subscription_payments(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para subscription_events
CREATE INDEX idx_subscription_events_business_id ON subscription_events(business_id);
CREATE INDEX idx_subscription_events_plan_id ON subscription_events(plan_id);
CREATE INDEX idx_subscription_events_event_type ON subscription_events(event_type);
CREATE INDEX idx_subscription_events_created_at ON subscription_events(created_at DESC);

COMMENT ON TABLE subscription_events IS 'Audit trail de todos los eventos de suscripción';

-- ============================================================================
-- 5. TABLA: usage_metrics
-- ============================================================================

CREATE TABLE IF NOT EXISTS usage_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES business_plans(id) ON DELETE CASCADE,
    
    -- Fecha de las métricas
    metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Métricas de uso principal
    locations_count INTEGER DEFAULT 0 CHECK (locations_count >= 0),
    employees_count INTEGER DEFAULT 0 CHECK (employees_count >= 0),
    appointments_count INTEGER DEFAULT 0 CHECK (appointments_count >= 0),
    clients_count INTEGER DEFAULT 0 CHECK (clients_count >= 0),
    services_count INTEGER DEFAULT 0 CHECK (services_count >= 0),
    
    -- Almacenamiento
    storage_mb DECIMAL(10,2) DEFAULT 0 CHECK (storage_mb >= 0),
    
    -- API calls (para planes enterprise)
    api_calls INTEGER DEFAULT 0 CHECK (api_calls >= 0),
    
    -- Features avanzados
    invoices_generated INTEGER DEFAULT 0,
    reports_exported INTEGER DEFAULT 0,
    notifications_sent INTEGER DEFAULT 0,
    
    -- Campos calculados
    is_over_limit BOOLEAN DEFAULT false,
    limit_exceeded_resources TEXT[] DEFAULT ARRAY[]::TEXT[],
    usage_percentage JSONB DEFAULT '{}', -- {'locations': 100, 'employees': 80}
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Solo una entrada por negocio por día
    UNIQUE(business_id, metric_date)
);

-- Índices para usage_metrics
CREATE INDEX idx_usage_metrics_business_id ON usage_metrics(business_id);
CREATE INDEX idx_usage_metrics_plan_id ON usage_metrics(plan_id);
CREATE INDEX idx_usage_metrics_date ON usage_metrics(metric_date DESC);
CREATE INDEX idx_usage_metrics_over_limit ON usage_metrics(is_over_limit) WHERE is_over_limit = true;

COMMENT ON TABLE usage_metrics IS 'Métricas diarias de consumo vs límites del plan';

-- ============================================================================
-- 6. TABLA: discount_codes
-- ============================================================================

CREATE TABLE IF NOT EXISTS discount_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    
    -- Tipo de descuento
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
    currency VARCHAR(3) DEFAULT 'COP', -- Solo para fixed_amount
    
    -- Aplicabilidad
    applicable_plans plan_type[], -- NULL = todos los planes
    min_billing_cycle VARCHAR(10), -- 'monthly', 'yearly', NULL = cualquiera
    
    -- Límites de uso
    max_uses INTEGER, -- NULL = ilimitado
    uses_count INTEGER DEFAULT 0 CHECK (uses_count >= 0),
    max_uses_per_business INTEGER DEFAULT 1,
    
    -- Validez temporal
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_validity_period CHECK (valid_until IS NULL OR valid_until > valid_from),
    CONSTRAINT valid_max_uses CHECK (max_uses IS NULL OR max_uses > 0)
);

-- Índices para discount_codes
CREATE INDEX idx_discount_codes_code ON discount_codes(code);
CREATE INDEX idx_discount_codes_active ON discount_codes(is_active) WHERE is_active = true;
CREATE INDEX idx_discount_codes_valid_period ON discount_codes(valid_from, valid_until);

COMMENT ON TABLE discount_codes IS 'Cupones de descuento para planes';

-- ============================================================================
-- 7. TABLA: discount_code_uses
-- ============================================================================

CREATE TABLE IF NOT EXISTS discount_code_uses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discount_code_id UUID NOT NULL REFERENCES discount_codes(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES subscription_payments(id) ON DELETE SET NULL,
    
    -- Descuento aplicado
    discount_amount DECIMAL(12,2) NOT NULL CHECK (discount_amount >= 0),
    original_amount DECIMAL(12,2) NOT NULL CHECK (original_amount >= 0),
    final_amount DECIMAL(12,2) NOT NULL CHECK (final_amount >= 0),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Un negocio solo puede usar un código una vez (por defecto)
    UNIQUE(discount_code_id, business_id)
);

-- Índices para discount_code_uses
CREATE INDEX idx_discount_code_uses_code ON discount_code_uses(discount_code_id);
CREATE INDEX idx_discount_code_uses_business ON discount_code_uses(business_id);
CREATE INDEX idx_discount_code_uses_payment ON discount_code_uses(payment_id);

COMMENT ON TABLE discount_code_uses IS 'Registro de uso de cupones de descuento';

-- ============================================================================
-- 8. ACTUALIZAR business_plans
-- ============================================================================

-- Agregar campos para integración con Stripe
ALTER TABLE business_plans 
    ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255) UNIQUE,
    ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS stripe_price_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
    ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMPTZ;

-- Índices adicionales para business_plans
CREATE INDEX IF NOT EXISTS idx_business_plans_stripe_subscription ON business_plans(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_business_plans_stripe_customer ON business_plans(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_business_plans_status ON business_plans(status);
CREATE INDEX IF NOT EXISTS idx_business_plans_end_date ON business_plans(end_date) WHERE end_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_business_plans_trial ON business_plans(trial_ends_at) WHERE trial_ends_at IS NOT NULL;

COMMENT ON COLUMN business_plans.stripe_subscription_id IS 'ID de suscripción en Stripe';
COMMENT ON COLUMN business_plans.stripe_customer_id IS 'ID de cliente en Stripe';
COMMENT ON COLUMN business_plans.grace_period_ends_at IS 'Fecha hasta la cual el plan sigue activo pese a pago fallido';

-- ============================================================================
-- 9. TRIGGERS
-- ============================================================================

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a tablas relevantes
DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON payment_methods;
CREATE TRIGGER update_payment_methods_updated_at 
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscription_payments_updated_at ON subscription_payments;
CREATE TRIGGER update_subscription_payments_updated_at 
    BEFORE UPDATE ON subscription_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_usage_metrics_updated_at ON usage_metrics;
CREATE TRIGGER update_usage_metrics_updated_at 
    BEFORE UPDATE ON usage_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_discount_codes_updated_at ON discount_codes;
CREATE TRIGGER update_discount_codes_updated_at 
    BEFORE UPDATE ON discount_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
```

**Tiempo Estimado:** 14 horas  
**Entregables:**
- ✅ Archivo de migración SQL completo
- ✅ 6 tablas nuevas + actualización de `business_plans`
- ✅ Índices para performance
- ✅ Constraints y validaciones

---

#### 1.2 Row Level Security (RLS) Policies (8 horas)

**Archivo:** `supabase/migrations/20251015000001_billing_rls_policies.sql`

```sql
-- ============================================================================
-- ROW LEVEL SECURITY - SISTEMA DE BILLING
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. PAYMENT_METHODS
-- ============================================================================

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Usuarios pueden ver métodos de pago de sus negocios
CREATE POLICY "Users can view their business payment methods"
    ON payment_methods FOR SELECT
    USING (
        business_id IN (
            SELECT id FROM businesses 
            WHERE owner_id = auth.uid()
        )
    );

-- Usuarios pueden insertar métodos de pago para sus negocios
CREATE POLICY "Users can insert payment methods for their business"
    ON payment_methods FOR INSERT
    WITH CHECK (
        business_id IN (
            SELECT id FROM businesses 
            WHERE owner_id = auth.uid()
        )
    );

-- Usuarios pueden actualizar métodos de pago de sus negocios
CREATE POLICY "Users can update their business payment methods"
    ON payment_methods FOR UPDATE
    USING (
        business_id IN (
            SELECT id FROM businesses 
            WHERE owner_id = auth.uid()
        )
    );

-- Usuarios pueden eliminar métodos de pago de sus negocios
CREATE POLICY "Users can delete their business payment methods"
    ON payment_methods FOR DELETE
    USING (
        business_id IN (
            SELECT id FROM businesses 
            WHERE owner_id = auth.uid()
        )
    );

-- ============================================================================
-- 2. SUBSCRIPTION_PAYMENTS
-- ============================================================================

ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

-- Solo lectura para dueños de negocio
CREATE POLICY "Users can view their subscription payments"
    ON subscription_payments FOR SELECT
    USING (
        business_id IN (
            SELECT id FROM businesses 
            WHERE owner_id = auth.uid()
        )
    );

-- Bloquear modificaciones directas (solo Edge Functions pueden modificar)
CREATE POLICY "Block direct modifications to payments"
    ON subscription_payments FOR UPDATE
    USING (false);

CREATE POLICY "Block direct deletions of payments"
    ON subscription_payments FOR DELETE
    USING (false);

-- ============================================================================
-- 3. SUBSCRIPTION_EVENTS
-- ============================================================================

ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- Solo lectura para dueños de negocio
CREATE POLICY "Users can view their subscription events"
    ON subscription_events FOR SELECT
    USING (
        business_id IN (
            SELECT id FROM businesses 
            WHERE owner_id = auth.uid()
        )
    );

-- Bloquear modificaciones
CREATE POLICY "Block modifications to subscription events"
    ON subscription_events FOR UPDATE
    USING (false);

CREATE POLICY "Block deletions of subscription events"
    ON subscription_events FOR DELETE
    USING (false);

-- ============================================================================
-- 4. USAGE_METRICS
-- ============================================================================

ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;

-- Solo lectura para dueños de negocio
CREATE POLICY "Users can view their usage metrics"
    ON usage_metrics FOR SELECT
    USING (
        business_id IN (
            SELECT id FROM businesses 
            WHERE owner_id = auth.uid()
        )
    );

-- Bloquear modificaciones directas
CREATE POLICY "Block direct modifications to usage metrics"
    ON usage_metrics FOR UPDATE
    USING (false);

-- ============================================================================
-- 5. DISCOUNT_CODES
-- ============================================================================

ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver códigos activos (para validar)
CREATE POLICY "Anyone can view active discount codes"
    ON discount_codes FOR SELECT
    USING (is_active = true);

-- Solo admins pueden modificar
CREATE POLICY "Only admins can modify discount codes"
    ON discount_codes FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- ============================================================================
-- 6. DISCOUNT_CODE_USES
-- ============================================================================

ALTER TABLE discount_code_uses ENABLE ROW LEVEL SECURITY;

-- Usuarios pueden ver sus propios usos de códigos
CREATE POLICY "Users can view their discount code uses"
    ON discount_code_uses FOR SELECT
    USING (
        business_id IN (
            SELECT id FROM businesses 
            WHERE owner_id = auth.uid()
        )
    );

-- Bloquear modificaciones directas
CREATE POLICY "Block modifications to discount uses"
    ON discount_code_uses FOR UPDATE
    USING (false);

COMMIT;
```

**Tiempo Estimado:** 8 horas  
**Entregables:**
- ✅ RLS habilitado en 6 tablas
- ✅ Policies de lectura/escritura/modificación
- ✅ Protección contra modificaciones directas desde cliente

---

#### 1.3 Stored Procedures (RPC Functions) (8 horas)

**Archivo:** `supabase/migrations/20251015000002_billing_rpc_functions.sql`

```sql
-- ============================================================================
-- RPC FUNCTIONS - SISTEMA DE BILLING
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. get_subscription_dashboard
-- ============================================================================

CREATE OR REPLACE FUNCTION get_subscription_dashboard(p_business_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
BEGIN
    -- Verificar que el usuario tiene acceso al negocio
    IF NOT EXISTS (
        SELECT 1 FROM businesses 
        WHERE id = p_business_id 
        AND owner_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    SELECT json_build_object(
        'plan', (
            SELECT row_to_json(bp) 
            FROM business_plans bp 
            WHERE bp.business_id = p_business_id
        ),
        'current_usage', (
            SELECT row_to_json(um)
            FROM usage_metrics um
            WHERE um.business_id = p_business_id
            ORDER BY um.metric_date DESC
            LIMIT 1
        ),
        'payment_methods', (
            SELECT json_agg(pm)
            FROM payment_methods pm
            WHERE pm.business_id = p_business_id
            AND pm.is_active = true
        ),
        'recent_payments', (
            SELECT json_agg(sp ORDER BY sp.created_at DESC)
            FROM (
                SELECT * FROM subscription_payments
                WHERE business_id = p_business_id
                ORDER BY created_at DESC
                LIMIT 10
            ) sp
        ),
        'recent_events', (
            SELECT json_agg(se ORDER BY se.created_at DESC)
            FROM (
                SELECT * FROM subscription_events
                WHERE business_id = p_business_id
                ORDER BY created_at DESC
                LIMIT 20
            ) se
        )
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION get_subscription_dashboard IS 'Obtiene dashboard completo de suscripción para un negocio';

-- ============================================================================
-- 2. validate_plan_limits
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_plan_limits(
    p_business_id UUID,
    p_resource TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_plan business_plans%ROWTYPE;
    v_usage usage_metrics%ROWTYPE;
    v_limits JSONB;
    v_current_count INTEGER;
    v_limit INTEGER;
    v_result JSON;
BEGIN
    -- Obtener plan actual
    SELECT * INTO v_plan
    FROM business_plans
    WHERE business_id = p_business_id
    AND status = 'active';
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'allowed', false,
            'reason', 'No active plan found',
            'upgrade_required', true
        );
    END IF;
    
    -- Obtener uso actual
    SELECT * INTO v_usage
    FROM usage_metrics
    WHERE business_id = p_business_id
    ORDER BY metric_date DESC
    LIMIT 1;
    
    v_limits := v_plan.limits;
    
    -- Verificar límite según recurso
    CASE p_resource
        WHEN 'location' THEN
            v_current_count := v_usage.locations_count;
            v_limit := (v_limits->>'max_locations')::INTEGER;
        WHEN 'employee' THEN
            v_current_count := v_usage.employees_count;
            v_limit := (v_limits->>'max_employees')::INTEGER;
        WHEN 'appointment' THEN
            v_current_count := v_usage.appointments_count;
            v_limit := (v_limits->>'max_appointments_monthly')::INTEGER;
        WHEN 'client' THEN
            v_current_count := v_usage.clients_count;
            v_limit := (v_limits->>'max_clients')::INTEGER;
        WHEN 'service' THEN
            v_current_count := v_usage.services_count;
            v_limit := (v_limits->>'max_services')::INTEGER;
        ELSE
            RETURN json_build_object('allowed', true, 'reason', 'Unknown resource');
    END CASE;
    
    -- NULL limit = ilimitado
    IF v_limit IS NULL THEN
        RETURN json_build_object(
            'allowed', true,
            'unlimited', true,
            'current', v_current_count
        );
    END IF;
    
    -- Verificar si está sobre el límite
    IF v_current_count >= v_limit THEN
        RETURN json_build_object(
            'allowed', false,
            'reason', format('Limit reached: %s/%s %ss', v_current_count, v_limit, p_resource),
            'current', v_current_count,
            'limit', v_limit,
            'upgrade_required', true,
            'suggested_plan', CASE
                WHEN v_plan.plan_type = 'free' THEN 'basic'
                WHEN v_plan.plan_type = 'basic' THEN 'professional'
                WHEN v_plan.plan_type = 'professional' THEN 'enterprise'
                ELSE null
            END
        );
    END IF;
    
    RETURN json_build_object(
        'allowed', true,
        'current', v_current_count,
        'limit', v_limit,
        'remaining', v_limit - v_current_count,
        'percentage', ROUND((v_current_count::NUMERIC / v_limit::NUMERIC * 100)::NUMERIC, 2)
    );
END;
$$;

COMMENT ON FUNCTION validate_plan_limits IS 'Valida si un negocio puede crear un recurso según límites del plan';

-- ============================================================================
-- 3. calculate_usage_metrics
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_usage_metrics(p_business_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_metric_id UUID;
    v_plan_id UUID;
    v_locations_count INTEGER;
    v_employees_count INTEGER;
    v_appointments_count INTEGER;
    v_clients_count INTEGER;
    v_services_count INTEGER;
BEGIN
    -- Obtener plan actual
    SELECT id INTO v_plan_id
    FROM business_plans
    WHERE business_id = p_business_id
    AND status = 'active';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No active plan found for business %', p_business_id;
    END IF;
    
    -- Calcular métricas
    SELECT COUNT(*) INTO v_locations_count
    FROM locations
    WHERE business_id = p_business_id
    AND is_active = true;
    
    SELECT COUNT(*) INTO v_employees_count
    FROM users
    WHERE business_id = p_business_id
    AND role IN ('admin', 'employee')
    AND is_active = true;
    
    SELECT COUNT(*) INTO v_appointments_count
    FROM appointments
    WHERE business_id = p_business_id
    AND start_time >= date_trunc('month', CURRENT_DATE)
    AND start_time < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month';
    
    SELECT COUNT(*) INTO v_clients_count
    FROM clients
    WHERE business_id = p_business_id
    AND status = 'active';
    
    SELECT COUNT(*) INTO v_services_count
    FROM services
    WHERE business_id = p_business_id
    AND is_active = true;
    
    -- Insertar o actualizar métricas
    INSERT INTO usage_metrics (
        business_id,
        plan_id,
        metric_date,
        locations_count,
        employees_count,
        appointments_count,
        clients_count,
        services_count
    ) VALUES (
        p_business_id,
        v_plan_id,
        CURRENT_DATE,
        v_locations_count,
        v_employees_count,
        v_appointments_count,
        v_clients_count,
        v_services_count
    )
    ON CONFLICT (business_id, metric_date)
    DO UPDATE SET
        locations_count = EXCLUDED.locations_count,
        employees_count = EXCLUDED.employees_count,
        appointments_count = EXCLUDED.appointments_count,
        clients_count = EXCLUDED.clients_count,
        services_count = EXCLUDED.services_count,
        updated_at = NOW()
    RETURNING id INTO v_metric_id;
    
    RETURN v_metric_id;
END;
$$;

COMMENT ON FUNCTION calculate_usage_metrics IS 'Calcula y guarda métricas de uso para un negocio';

-- ============================================================================
-- 4. apply_discount_code
-- ============================================================================

CREATE OR REPLACE FUNCTION apply_discount_code(
    p_business_id UUID,
    p_code VARCHAR,
    p_amount DECIMAL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_discount discount_codes%ROWTYPE;
    v_discount_amount DECIMAL;
    v_final_amount DECIMAL;
    v_plan business_plans%ROWTYPE;
BEGIN
    -- Obtener código de descuento
    SELECT * INTO v_discount
    FROM discount_codes
    WHERE code = p_code
    AND is_active = true
    AND (valid_from IS NULL OR valid_from <= NOW())
    AND (valid_until IS NULL OR valid_until >= NOW());
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'valid', false,
            'error', 'Invalid or expired discount code'
        );
    END IF;
    
    -- Verificar límites de uso
    IF v_discount.max_uses IS NOT NULL AND v_discount.uses_count >= v_discount.max_uses THEN
        RETURN json_build_object(
            'valid', false,
            'error', 'Discount code has reached maximum uses'
        );
    END IF;
    
    -- Verificar si el negocio ya usó este código
    IF EXISTS (
        SELECT 1 FROM discount_code_uses
        WHERE discount_code_id = v_discount.id
        AND business_id = p_business_id
    ) THEN
        RETURN json_build_object(
            'valid', false,
            'error', 'You have already used this discount code'
        );
    END IF;
    
    -- Verificar aplicabilidad por plan
    IF v_discount.applicable_plans IS NOT NULL THEN
        SELECT * INTO v_plan
        FROM business_plans
        WHERE business_id = p_business_id
        AND status = 'active';
        
        IF NOT (v_plan.plan_type = ANY(v_discount.applicable_plans)) THEN
            RETURN json_build_object(
                'valid', false,
                'error', 'This discount code is not applicable to your plan'
            );
        END IF;
    END IF;
    
    -- Calcular descuento
    IF v_discount.discount_type = 'percentage' THEN
        v_discount_amount := p_amount * (v_discount.discount_value / 100);
    ELSE
        v_discount_amount := v_discount.discount_value;
    END IF;
    
    v_final_amount := GREATEST(0, p_amount - v_discount_amount);
    
    RETURN json_build_object(
        'valid', true,
        'discount_id', v_discount.id,
        'original_amount', p_amount,
        'discount_amount', v_discount_amount,
        'final_amount', v_final_amount,
        'discount_type', v_discount.discount_type,
        'discount_value', v_discount.discount_value
    );
END;
$$;

COMMENT ON FUNCTION apply_discount_code IS 'Valida y aplica un código de descuento';

COMMIT;
```

**Tiempo Estimado:** 8 horas  
**Entregables:**
- ✅ 4 RPC functions críticas
- ✅ Validación de límites
- ✅ Cálculo de métricas
- ✅ Sistema de descuentos

---

#### 1.4 Seed Data y Testing (6 horas)

**Archivo:** `supabase/seed/billing_test_data.sql`

```sql
-- ============================================================================
-- SEED DATA - SISTEMA DE BILLING (TEST)
-- ============================================================================

BEGIN;

-- Insertar códigos de descuento de ejemplo
INSERT INTO discount_codes (code, description, discount_type, discount_value, applicable_plans, valid_until)
VALUES
    ('LAUNCH2025', 'Descuento de lanzamiento 20%', 'percentage', 20.00, ARRAY['basic', 'professional']::plan_type[], NOW() + INTERVAL '3 months'),
    ('FIRSTMONTH50', 'Primera mes 50% OFF', 'percentage', 50.00, NULL, NOW() + INTERVAL '6 months'),
    ('FIXED10K', 'Descuento fijo $10.000 COP', 'fixed_amount', 10000.00, NULL, NOW() + INTERVAL '1 year');

-- Configurar límites por plan type
-- Estos serán los límites estándar que se aplicarán al crear planes

COMMENT ON TABLE business_plans IS 'Límites estándar por plan:
free: {max_locations: 1, max_employees: 1, max_appointments_monthly: 50, max_clients: 50, max_services: 10}
basic: {max_locations: 1, max_employees: 2, max_appointments_monthly: 150, max_clients: 100, max_services: 10}
professional: {max_locations: 3, max_employees: 6, max_appointments_monthly: 500, max_clients: 500, max_services: 30}
enterprise: {max_locations: 10, max_employees: 21, max_appointments_monthly: null, max_clients: null, max_services: null}
corporativo: {max_locations: null, max_employees: null, max_appointments_monthly: null, max_clients: null, max_services: null}
';

COMMIT;
```

**Tiempo Estimado:** 6 horas (incluye testing manual)  
**Entregables:**
- ✅ Data de prueba
- ✅ Códigos de descuento de ejemplo
- ✅ Documentación de límites

---

### 🎯 Checkpoint Fase 1

**Criterios de Éxito:**
```powershell
# Ejecutar migraciones
supabase migration up

# Generar tipos TypeScript
supabase gen types typescript --local > src/types/supabase.gen.ts

# Verificar que no hay errores
npm run lint
```

**Entregables Totales:**
- ✅ 6 tablas nuevas creadas
- ✅ `business_plans` actualizada con campos Stripe
- ✅ RLS habilitado en todas las tablas
- ✅ 4 RPC functions operativas
- ✅ Seed data cargado
- ✅ Tipos TypeScript generados

**Tiempo Total:** 36 horas  
**Siguiente Fase:** Fase 2 - Integración Stripe

---

## 💳 FASE 2 — Integración Stripe (42 horas)

### Objetivo
Implementar la integración completa con Stripe para procesamiento de pagos, incluyendo capa de abstracción, Edge Functions y manejo de webhooks.

---

### 📝 Tareas

#### 2.1 Capa de Abstracción del Gateway (12 horas)

**Archivo:** `src/lib/payments/PaymentGateway.ts`

```typescript
// src/lib/payments/PaymentGateway.ts

import type { Business, PaymentMethod as DBPaymentMethod } from '@/types/supabase.gen';

/**
 * Interfaz abstracta para pasarelas de pago
 * Permite cambiar de Stripe a Wompi/MercadoPago en el futuro sin reescribir todo
 */
export interface PaymentGateway {
  // Customer Management
  createCustomer(params: CreateCustomerParams): Promise<CustomerResult>;
  updateCustomer(customerId: string, params: UpdateCustomerParams): Promise<CustomerResult>;
  
  // Payment Methods
  attachPaymentMethod(customerId: string, paymentMethodId: string): Promise<PaymentMethodResult>;
  detachPaymentMethod(paymentMethodId: string): Promise<void>;
  setDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<void>;
  
  // Subscriptions
  createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionResult>;
  updateSubscription(subscriptionId: string, params: UpdateSubscriptionParams): Promise<SubscriptionResult>;
  cancelSubscription(subscriptionId: string, params?: CancelSubscriptionParams): Promise<SubscriptionResult>;
  
  // Invoices & Charges
  retrieveInvoice(invoiceId: string): Promise<InvoiceResult>;
  retrieveCharge(chargeId: string): Promise<ChargeResult>;
  
  // Checkout Sessions
  createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSessionResult>;
}

// Types
export interface CreateCustomerParams {
  email: string;
  name: string;
  businessId: string;
  metadata?: Record<string, string>;
}

export interface UpdateCustomerParams {
  email?: string;
  name?: string;
  metadata?: Record<string, string>;
}

export interface CustomerResult {
  id: string;
  email: string;
  name: string;
  metadata: Record<string, string>;
}

export interface PaymentMethodResult {
  id: string;
  type: 'credit_card' | 'debit_card';
  provider: string; // 'visa', 'mastercard', etc
  last_four: string;
  expiry_month: number;
  expiry_year: number;
  cardholder_name: string;
}

export interface CreateSubscriptionParams {
  customerId: string;
  priceId: string;
  paymentMethodId?: string;
  trialPeriodDays?: number;
  metadata?: Record<string, string>;
}

export interface UpdateSubscriptionParams {
  priceId?: string;
  prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
  metadata?: Record<string, string>;
}

export interface CancelSubscriptionParams {
  cancelAtPeriodEnd?: boolean;
  reason?: string;
}

export interface SubscriptionResult {
  id: string;
  customerId: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  trialEnd?: Date;
  metadata: Record<string, string>;
}

export interface InvoiceResult {
  id: string;
  customerId: string;
  subscriptionId: string;
  amountDue: number;
  amountPaid: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  hostedInvoiceUrl?: string;
  invoicePdf?: string;
}

export interface ChargeResult {
  id: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed';
  paymentMethodId: string;
  receiptUrl?: string;
}

export interface CreateCheckoutSessionParams {
  customerId?: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  mode: 'subscription' | 'payment';
  metadata?: Record<string, string>;
}

export interface CheckoutSessionResult {
  id: string;
  url: string;
}

export class PaymentGatewayError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'PaymentGatewayError';
  }
}
```

**Archivo:** `src/lib/payments/StripeGateway.ts`

```typescript
// src/lib/payments/StripeGateway.ts

import Stripe from 'stripe';
import type {
  PaymentGateway,
  CreateCustomerParams,
  CustomerResult,
  PaymentMethodResult,
  CreateSubscriptionParams,
  SubscriptionResult,
  UpdateSubscriptionParams,
  CancelSubscriptionParams,
  InvoiceResult,
  ChargeResult,
  CreateCheckoutSessionParams,
  CheckoutSessionResult,
  UpdateCustomerParams,
} from './PaymentGateway';
import { PaymentGatewayError } from './PaymentGateway';

export class StripeGateway implements PaymentGateway {
  private stripe: Stripe;

  constructor(secretKey: string) {
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2024-10-28.acacia',
      typescript: true,
    });
  }

  async createCustomer(params: CreateCustomerParams): Promise<CustomerResult> {
    try {
      const customer = await this.stripe.customers.create({
        email: params.email,
        name: params.name,
        metadata: {
          business_id: params.businessId,
          ...params.metadata,
        },
      });

      return {
        id: customer.id,
        email: customer.email!,
        name: customer.name!,
        metadata: customer.metadata,
      };
    } catch (error) {
      throw new PaymentGatewayError(
        'Failed to create customer',
        'CUSTOMER_CREATE_FAILED',
        error
      );
    }
  }

  async updateCustomer(
    customerId: string,
    params: UpdateCustomerParams
  ): Promise<CustomerResult> {
    try {
      const customer = await this.stripe.customers.update(customerId, {
        email: params.email,
        name: params.name,
        metadata: params.metadata,
      });

      return {
        id: customer.id,
        email: customer.email!,
        name: customer.name!,
        metadata: customer.metadata,
      };
    } catch (error) {
      throw new PaymentGatewayError(
        'Failed to update customer',
        'CUSTOMER_UPDATE_FAILED',
        error
      );
    }
  }

  async attachPaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<PaymentMethodResult> {
    try {
      // Attach payment method to customer
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // Retrieve payment method details
      const pm = await this.stripe.paymentMethods.retrieve(paymentMethodId);

      if (pm.type !== 'card' || !pm.card) {
        throw new Error('Only card payment methods are supported');
      }

      return {
        id: pm.id,
        type: pm.card.funding === 'credit' ? 'credit_card' : 'debit_card',
        provider: pm.card.brand,
        last_four: pm.card.last4,
        expiry_month: pm.card.exp_month,
        expiry_year: pm.card.exp_year,
        cardholder_name: pm.billing_details.name || 'Unknown',
      };
    } catch (error) {
      throw new PaymentGatewayError(
        'Failed to attach payment method',
        'PAYMENT_METHOD_ATTACH_FAILED',
        error
      );
    }
  }

  async detachPaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      await this.stripe.paymentMethods.detach(paymentMethodId);
    } catch (error) {
      throw new PaymentGatewayError(
        'Failed to detach payment method',
        'PAYMENT_METHOD_DETACH_FAILED',
        error
      );
    }
  }

  async setDefaultPaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<void> {
    try {
      await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    } catch (error) {
      throw new PaymentGatewayError(
        'Failed to set default payment method',
        'SET_DEFAULT_PAYMENT_FAILED',
        error
      );
    }
  }

  async createSubscription(
    params: CreateSubscriptionParams
  ): Promise<SubscriptionResult> {
    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: params.customerId,
        items: [{ price: params.priceId }],
        default_payment_method: params.paymentMethodId,
        trial_period_days: params.trialPeriodDays,
        metadata: params.metadata,
        expand: ['latest_invoice.payment_intent'],
      });

      return this.mapSubscription(subscription);
    } catch (error) {
      throw new PaymentGatewayError(
        'Failed to create subscription',
        'SUBSCRIPTION_CREATE_FAILED',
        error
      );
    }
  }

  async updateSubscription(
    subscriptionId: string,
    params: UpdateSubscriptionParams
  ): Promise<SubscriptionResult> {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        items: params.priceId
          ? [{ price: params.priceId }]
          : undefined,
        proration_behavior: params.prorationBehavior,
        metadata: params.metadata,
      });

      return this.mapSubscription(subscription);
    } catch (error) {
      throw new PaymentGatewayError(
        'Failed to update subscription',
        'SUBSCRIPTION_UPDATE_FAILED',
        error
      );
    }
  }

  async cancelSubscription(
    subscriptionId: string,
    params?: CancelSubscriptionParams
  ): Promise<SubscriptionResult> {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: params?.cancelAtPeriodEnd ?? true,
        metadata: params?.reason ? { cancellation_reason: params.reason } : undefined,
      });

      return this.mapSubscription(subscription);
    } catch (error) {
      throw new PaymentGatewayError(
        'Failed to cancel subscription',
        'SUBSCRIPTION_CANCEL_FAILED',
        error
      );
    }
  }

  async retrieveInvoice(invoiceId: string): Promise<InvoiceResult> {
    try {
      const invoice = await this.stripe.invoices.retrieve(invoiceId);

      return {
        id: invoice.id,
        customerId: invoice.customer as string,
        subscriptionId: invoice.subscription as string,
        amountDue: invoice.amount_due / 100,
        amountPaid: invoice.amount_paid / 100,
        currency: invoice.currency.toUpperCase(),
        status: invoice.status!,
        hostedInvoiceUrl: invoice.hosted_invoice_url || undefined,
        invoicePdf: invoice.invoice_pdf || undefined,
      };
    } catch (error) {
      throw new PaymentGatewayError(
        'Failed to retrieve invoice',
        'INVOICE_RETRIEVE_FAILED',
        error
      );
    }
  }

  async retrieveCharge(chargeId: string): Promise<ChargeResult> {
    try {
      const charge = await this.stripe.charges.retrieve(chargeId);

      return {
        id: charge.id,
        amount: charge.amount / 100,
        currency: charge.currency.toUpperCase(),
        status: charge.status,
        paymentMethodId: charge.payment_method as string,
        receiptUrl: charge.receipt_url || undefined,
      };
    } catch (error) {
      throw new PaymentGatewayError(
        'Failed to retrieve charge',
        'CHARGE_RETRIEVE_FAILED',
        error
      );
    }
  }

  async createCheckoutSession(
    params: CreateCheckoutSessionParams
  ): Promise<CheckoutSessionResult> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        customer: params.customerId,
        mode: params.mode,
        line_items: [
          {
            price: params.priceId,
            quantity: 1,
          },
        ],
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: params.metadata,
      });

      return {
        id: session.id,
        url: session.url!,
      };
    } catch (error) {
      throw new PaymentGatewayError(
        'Failed to create checkout session',
        'CHECKOUT_CREATE_FAILED',
        error
      );
    }
  }

  // Helper para mapear subscription de Stripe a nuestro formato
  private mapSubscription(sub: Stripe.Subscription): SubscriptionResult {
    return {
      id: sub.id,
      customerId: sub.customer as string,
      status: sub.status as SubscriptionResult['status'],
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : undefined,
      trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : undefined,
      metadata: sub.metadata,
    };
  }
}
```

**Archivo:** `src/lib/payments/index.ts`

```typescript
// src/lib/payments/index.ts

import { StripeGateway } from './StripeGateway';
import type { PaymentGateway } from './PaymentGateway';

// Singleton instance
let gatewayInstance: PaymentGateway | null = null;

/**
 * Obtiene la instancia del gateway de pagos
 * En el futuro podríamos switchear entre Stripe/Wompi/MercadoPago
 */
export function getPaymentGateway(): PaymentGateway {
  if (!gatewayInstance) {
    const stripeKey = import.meta.env.VITE_STRIPE_SECRET_KEY;
    
    if (!stripeKey) {
      throw new Error('VITE_STRIPE_SECRET_KEY not configured');
    }
    
    gatewayInstance = new StripeGateway(stripeKey);
  }
  
  return gatewayInstance;
}

export * from './PaymentGateway';
export * from './StripeGateway';
```

**Tiempo Estimado:** 12 horas  
**Entregables:**
- ✅ Interfaz `PaymentGateway` con todos los métodos
- ✅ Implementación completa `StripeGateway`
- ✅ Manejo robusto de errores
- ✅ Types TypeScript completos

---

#### 2.2 Supabase Edge Function: Webhook Handler (16 horas)

**Archivo:** `supabase/functions/stripe-webhook/index.ts`

```typescript
// supabase/functions/stripe-webhook/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.14.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2024-10-28.acacia',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new Response('Missing signature', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const body = await req.text();
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

    // Validar firma del webhook
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Crear cliente Supabase con service role (bypass RLS)
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log(`Processing event: ${event.type}`);

  try {
    switch (event.type) {
      // === CUSTOMER EVENTS ===
      case 'customer.created':
        await handleCustomerCreated(event.data.object as Stripe.Customer, supabase);
        break;

      // === PAYMENT METHOD EVENTS ===
      case 'payment_method.attached':
        await handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod, supabase);
        break;

      case 'payment_method.detached':
        await handlePaymentMethodDetached(event.data.object as Stripe.PaymentMethod, supabase);
        break;

      // === SUBSCRIPTION EVENTS ===
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription, supabase);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, supabase);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabase);
        break;

      // === INVOICE EVENTS ===
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice, supabase);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, supabase);
        break;

      case 'invoice.upcoming':
        await handleInvoiceUpcoming(event.data.object as Stripe.Invoice, supabase);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

// === HANDLER FUNCTIONS ===

async function handleCustomerCreated(customer: Stripe.Customer, supabase: any) {
  console.log(`Customer created: ${customer.id}`);
  // Opcional: actualizar business_plans con stripe_customer_id si es necesario
}

async function handlePaymentMethodAttached(pm: Stripe.PaymentMethod, supabase: any) {
  if (pm.type !== 'card' || !pm.card) return;

  const customerId = pm.customer as string;

  // Obtener business_id desde customer metadata
  const customer = await stripe.customers.retrieve(customerId);
  const businessId = (customer as Stripe.Customer).metadata?.business_id;

  if (!businessId) {
    console.error('No business_id in customer metadata');
    return;
  }

  // Guardar método de pago en DB
  const { error } = await supabase.from('payment_methods').insert({
    business_id: businessId,
    type: pm.card.funding === 'credit' ? 'credit_card' : 'debit_card',
    provider: pm.card.brand,
    last_four: pm.card.last4,
    expiry_month: pm.card.exp_month,
    expiry_year: pm.card.exp_year,
    cardholder_name: pm.billing_details.name || 'Unknown',
    stripe_customer_id: customerId,
    stripe_payment_method_id: pm.id,
    stripe_fingerprint: pm.card.fingerprint,
    is_active: true,
  });

  if (error) {
    console.error('Error saving payment method:', error);
  }
}

async function handlePaymentMethodDetached(pm: Stripe.PaymentMethod, supabase: any) {
  // Marcar como inactivo en DB
  const { error } = await supabase
    .from('payment_methods')
    .update({ is_active: false })
    .eq('stripe_payment_method_id', pm.id);

  if (error) {
    console.error('Error updating payment method:', error);
  }
}

async function handleSubscriptionCreated(sub: Stripe.Subscription, supabase: any) {
  const customerId = sub.customer as string;
  const customer = await stripe.customers.retrieve(customerId);
  const businessId = (customer as Stripe.Customer).metadata?.business_id;

  if (!businessId) {
    console.error('No business_id in customer metadata');
    return;
  }

  // Actualizar business_plans
  const { error } = await supabase
    .from('business_plans')
    .update({
      stripe_subscription_id: sub.id,
      stripe_customer_id: customerId,
      status: 'active',
      start_date: new Date(sub.current_period_start * 1000).toISOString(),
      end_date: new Date(sub.current_period_end * 1000).toISOString(),
    })
    .eq('business_id', businessId);

  if (error) {
    console.error('Error updating business_plans:', error);
  }

  // Log evento
  await supabase.from('subscription_events').insert({
    business_id: businessId,
    event_type: 'created',
    triggered_by: 'webhook',
    metadata: { stripe_subscription_id: sub.id },
  });
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription, supabase: any) {
  const customerId = sub.customer as string;
  const customer = await stripe.customers.retrieve(customerId);
  const businessId = (customer as Stripe.Customer).metadata?.business_id;

  if (!businessId) return;

  // Actualizar fechas y estado
  await supabase
    .from('business_plans')
    .update({
      status: mapStripeStatus(sub.status),
      end_date: new Date(sub.current_period_end * 1000).toISOString(),
      cancel_at_period_end: sub.cancel_at_period_end,
    })
    .eq('business_id', businessId);

  // Log evento
  await supabase.from('subscription_events').insert({
    business_id: businessId,
    event_type: 'updated',
    triggered_by: 'webhook',
    metadata: { stripe_subscription_id: sub.id, status: sub.status },
  });
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription, supabase: any) {
  const customerId = sub.customer as string;
  const customer = await stripe.customers.retrieve(customerId);
  const businessId = (customer as Stripe.Customer).metadata?.business_id;

  if (!businessId) return;

  await supabase
    .from('business_plans')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('business_id', businessId);

  await supabase.from('subscription_events').insert({
    business_id: businessId,
    event_type: 'cancelled',
    triggered_by: 'webhook',
  });
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice, supabase: any) {
  const customerId = invoice.customer as string;
  const customer = await stripe.customers.retrieve(customerId);
  const businessId = (customer as Stripe.Customer).metadata?.business_id;

  if (!businessId) return;

  // Obtener plan_id
  const { data: plan } = await supabase
    .from('business_plans')
    .select('id')
    .eq('business_id', businessId)
    .single();

  if (!plan) return;

  // Guardar pago exitoso
  const { data: payment } = await supabase
    .from('subscription_payments')
    .insert({
      business_id: businessId,
      plan_id: plan.id,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency.toUpperCase(),
      status: 'completed',
      stripe_invoice_id: invoice.id,
      stripe_charge_id: invoice.charge,
      billing_period_start: new Date(invoice.period_start * 1000).toISOString().split('T')[0],
      billing_period_end: new Date(invoice.period_end * 1000).toISOString().split('T')[0],
      paid_at: new Date().toISOString(),
      invoice_url: invoice.hosted_invoice_url,
      receipt_url: invoice.invoice_pdf,
    })
    .select()
    .single();

  // Log evento
  await supabase.from('subscription_events').insert({
    business_id: businessId,
    plan_id: plan.id,
    event_type: 'payment_succeeded',
    triggered_by: 'webhook',
    payment_id: payment?.id,
  });

  // Extender periodo si es renovación
  if (invoice.subscription) {
    const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
    await supabase
      .from('business_plans')
      .update({
        end_date: new Date(sub.current_period_end * 1000).toISOString(),
      })
      .eq('business_id', businessId);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice, supabase: any) {
  const customerId = invoice.customer as string;
  const customer = await stripe.customers.retrieve(customerId);
  const businessId = (customer as Stripe.Customer).metadata?.business_id;

  if (!businessId) return;

  const { data: plan } = await supabase
    .from('business_plans')
    .select('id')
    .eq('business_id', businessId)
    .single();

  if (!plan) return;

  // Guardar pago fallido
  await supabase.from('subscription_payments').insert({
    business_id: businessId,
    plan_id: plan.id,
    amount: invoice.amount_due / 100,
    currency: invoice.currency.toUpperCase(),
    status: 'failed',
    stripe_invoice_id: invoice.id,
    billing_period_start: new Date(invoice.period_start * 1000).toISOString().split('T')[0],
    billing_period_end: new Date(invoice.period_end * 1000).toISOString().split('T')[0],
    failed_at: new Date().toISOString(),
    failure_reason: invoice.last_finalization_error?.message || 'Payment failed',
    retry_count: invoice.attempt_count - 1,
  });

  // Log evento
  await supabase.from('subscription_events').insert({
    business_id: businessId,
    plan_id: plan.id,
    event_type: 'payment_failed',
    triggered_by: 'webhook',
    reason: invoice.last_finalization_error?.message,
  });

  // TODO: Enviar notificación al usuario
}

async function handleInvoiceUpcoming(invoice: Stripe.Invoice, supabase: any) {
  // Notificar al usuario que su factura está por vencer (3 días antes)
  console.log(`Upcoming invoice for customer: ${invoice.customer}`);
  // TODO: Enviar email/notificación in-app
}

// Helper: mapear status de Stripe a nuestro enum
function mapStripeStatus(status: Stripe.Subscription.Status): string {
  const mapping: Record<string, string> = {
    active: 'active',
    past_due: 'active', // Mantener activo pero con grace period
    unpaid: 'suspended',
    canceled: 'cancelled',
    incomplete: 'active',
    incomplete_expired: 'expired',
    trialing: 'active',
  };

  return mapping[status] || 'active';
}
```

**Tiempo Estimado:** 16 horas  
**Entregables:**
- ✅ Edge Function completa para webhooks
- ✅ Validación de firmas Stripe
- ✅ Manejo de 10+ eventos críticos
- ✅ Sincronización bidireccional Stripe ↔ Supabase

---

#### 2.3 Edge Function: Create Checkout Session (8 horas)

**Archivo:** `supabase/functions/create-checkout-session/index.ts`

```typescript
// supabase/functions/create-checkout-session/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.14.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2024-10-28.acacia',
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verificar autenticación
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error('Unauthorized');
    }

    // Parse body
    const { businessId, priceId, planType, discountCode } = await req.json();

    if (!businessId || !priceId || !planType) {
      throw new Error('Missing required parameters');
    }

    // Verificar que el usuario es dueño del negocio
    const { data: business, error: businessError } = await supabaseClient
      .from('businesses')
      .select('id, name, owner_id')
      .eq('id', businessId)
      .single();

    if (businessError || !business || business.owner_id !== user.id) {
      throw new Error('Access denied');
    }

    // Verificar/crear Stripe customer
    let stripeCustomerId: string;

    const { data: existingPlan } = await supabaseClient
      .from('business_plans')
      .select('stripe_customer_id')
      .eq('business_id', businessId)
      .single();

    if (existingPlan?.stripe_customer_id) {
      stripeCustomerId = existingPlan.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: business.name,
        metadata: {
          business_id: businessId,
          user_id: user.id,
        },
      });
      stripeCustomerId = customer.id;

      // Guardar customer ID
      await supabaseClient
        .from('business_plans')
        .upsert({
          business_id: businessId,
          stripe_customer_id: stripeCustomerId,
          plan_type: planType,
          status: 'active',
        });
    }

    // Aplicar código de descuento si existe
    let discounts: Array<{ coupon?: string; promotion_code?: string }> = [];
    
    if (discountCode) {
      // Validar código en nuestra DB
      const { data: discount } = await supabaseClient.rpc('apply_discount_code', {
        p_business_id: businessId,
        p_code: discountCode,
        p_amount: 0, // Se calculará en Stripe
      });

      if (discount?.valid) {
        // Buscar promotion code en Stripe
        const promotionCodes = await stripe.promotionCodes.list({
          code: discountCode,
          active: true,
          limit: 1,
        });

        if (promotionCodes.data.length > 0) {
          discounts = [{ promotion_code: promotionCodes.data[0].id }];
        }
      }
    }

    // Crear Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      discounts,
      success_url: `${req.headers.get('origin')}/app/billing?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${req.headers.get('origin')}/app/billing?canceled=true`,
      metadata: {
        business_id: businessId,
        plan_type: planType,
      },
      subscription_data: {
        metadata: {
          business_id: businessId,
          plan_type: planType,
        },
      },
    });

    return new Response(
      JSON.stringify({ 
        sessionId: session.id, 
        url: session.url 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
```

**Tiempo Estimado:** 8 horas  
**Entregables:**
- ✅ Edge Function para crear sesiones de checkout
- ✅ Verificación de autenticación y permisos
- ✅ Integración con códigos de descuento
- ✅ Manejo de CORS

---

#### 2.4 Testing de Integración Stripe (6 horas)

**Archivo:** `tests/payments/stripe-gateway.test.ts`

```typescript
// tests/payments/stripe-gateway.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StripeGateway } from '@/lib/payments/StripeGateway';
import { PaymentGatewayError } from '@/lib/payments/PaymentGateway';

// Mock Stripe
vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      customers: {
        create: vi.fn(),
        update: vi.fn(),
        retrieve: vi.fn(),
      },
      paymentMethods: {
        attach: vi.fn(),
        detach: vi.fn(),
        retrieve: vi.fn(),
      },
      subscriptions: {
        create: vi.fn(),
        update: vi.fn(),
      },
    })),
  };
});

describe('StripeGateway', () => {
  let gateway: StripeGateway;

  beforeEach(() => {
    gateway = new StripeGateway('sk_test_mock');
  });

  describe('createCustomer', () => {
    it('should create a customer successfully', async () => {
      const mockCustomer = {
        id: 'cus_123',
        email: 'test@example.com',
        name: 'Test Business',
        metadata: { business_id: 'biz_123' },
      };

      vi.spyOn(gateway['stripe'].customers, 'create').mockResolvedValue(mockCustomer as any);

      const result = await gateway.createCustomer({
        email: 'test@example.com',
        name: 'Test Business',
        businessId: 'biz_123',
      });

      expect(result).toEqual({
        id: 'cus_123',
        email: 'test@example.com',
        name: 'Test Business',
        metadata: { business_id: 'biz_123' },
      });
    });

    it('should throw PaymentGatewayError on failure', async () => {
      vi.spyOn(gateway['stripe'].customers, 'create').mockRejectedValue(
        new Error('Stripe API error')
      );

      await expect(
        gateway.createCustomer({
          email: 'test@example.com',
          name: 'Test Business',
          businessId: 'biz_123',
        })
      ).rejects.toThrow(PaymentGatewayError);
    });
  });

  // Más tests...
});
```

**Comandos para testing manual:**

```powershell
# Instalar Stripe CLI
scoop install stripe

# Login
stripe login

# Forward webhooks a local
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook

# Trigger eventos de prueba
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed
stripe trigger customer.subscription.created
```

**Tiempo Estimado:** 6 horas  
**Entregables:**
- ✅ Tests unitarios para StripeGateway
- ✅ Tests de Edge Functions (con mocks)
- ✅ Documentación de testing manual con Stripe CLI

---

### 🎯 Checkpoint Fase 2

**Criterios de Éxito:**
```powershell
# Instalar dependencias
npm install stripe @stripe/stripe-js @stripe/react-stripe-js

# Tests unitarios
npm run test -- src/lib/payments

# Deploy Edge Functions
supabase functions deploy stripe-webhook
supabase functions deploy create-checkout-session

# Verificar webhooks en Stripe Dashboard
stripe listen --forward-to https://[project-ref].supabase.co/functions/v1/stripe-webhook
```

**Entregables Totales:**
- ✅ Capa de abstracción `PaymentGateway` completa
- ✅ Implementación `StripeGateway` con todos los métodos
- ✅ Edge Function `stripe-webhook` deployada
- ✅ Edge Function `create-checkout-session` deployada
- ✅ Tests unitarios pasando
- ✅ Webhooks funcionando en entorno de prueba

**Tiempo Total:** 42 horas  
**Siguiente Fase:** Fase 3 - Suscripciones Recurrentes y Gestión de Límites

---

## 🔁 FASE 3 — Suscripciones Recurrentes y Gestión de Límites (48 horas)

### Objetivo
Implementar renovaciones automáticas, cálculo de métricas de uso, validación de límites y hooks para el frontend.

---

### 📝 Tareas

#### 3.1 Edge Function: Renovación de Suscripciones (14 horas)

**Archivo:** `supabase/functions/renew-subscriptions/index.ts`

```typescript
// supabase/functions/renew-subscriptions/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.14.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2024-10-28.acacia',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  // Verificar que la request viene de Supabase Scheduler (secret token)
  const authHeader = req.headers.get('authorization');
  const expectedToken = Deno.env.get('CRON_SECRET');
  
  if (authHeader !== `Bearer ${expectedToken}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  console.log('Starting subscription renewal check...');

  try {
    // Obtener planes que expiran en las próximas 24 horas
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const { data: expiringPlans, error } = await supabase
      .from('business_plans')
      .select(`
        id,
        business_id,
        plan_type,
        price,
        currency,
        stripe_subscription_id,
        stripe_customer_id,
        end_date,
        auto_renew,
        businesses (
          id,
          name,
          owner_id
        )
      `)
      .eq('status', 'active')
      .eq('auto_renew', true)
      .lte('end_date', tomorrow.toISOString())
      .gte('end_date', new Date().toISOString());

    if (error) {
      throw error;
    }

    console.log(`Found ${expiringPlans?.length || 0} plans to renew`);

    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const plan of expiringPlans || []) {
      try {
        // Verificar que tiene Stripe subscription ID
        if (!plan.stripe_subscription_id) {
          console.log(`Skipping plan ${plan.id}: No Stripe subscription`);
          results.skipped++;
          continue;
        }

        // Obtener suscripción de Stripe
        const subscription = await stripe.subscriptions.retrieve(
          plan.stripe_subscription_id
        );

        // Verificar que la suscripción está activa
        if (!['active', 'trialing'].includes(subscription.status)) {
          console.log(`Skipping plan ${plan.id}: Subscription status is ${subscription.status}`);
          results.skipped++;
          continue;
        }

        // Stripe maneja la renovación automáticamente, solo actualizamos nuestros records
        const newEndDate = new Date(subscription.current_period_end * 1000);

        await supabase
          .from('business_plans')
          .update({
            end_date: newEndDate.toISOString(),
          })
          .eq('id', plan.id);

        // Log evento
        await supabase.from('subscription_events').insert({
          business_id: plan.business_id,
          plan_id: plan.id,
          event_type: 'renewed',
          triggered_by: 'system',
          metadata: {
            stripe_subscription_id: plan.stripe_subscription_id,
            new_end_date: newEndDate.toISOString(),
          },
        });

        console.log(`Successfully renewed plan ${plan.id}`);
        results.success++;
      } catch (planError) {
        console.error(`Error renewing plan ${plan.id}:`, planError);
        results.failed++;
        results.errors.push(`Plan ${plan.id}: ${planError.message}`);
      }
    }

    // Procesar pagos fallidos con reintentos pendientes
    await processFailedPaymentRetries(supabase);

    return new Response(
      JSON.stringify({
        message: 'Renewal check completed',
        results,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in renewal process:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function processFailedPaymentRetries(supabase: any) {
  // Obtener pagos fallidos que necesitan reintento
  const { data: failedPayments } = await supabase
    .from('subscription_payments')
    .select('*')
    .eq('status', 'failed')
    .lt('retry_count', 3)
    .lte('next_retry_at', new Date().toISOString())
    .is('next_retry_at', 'NOT NULL');

  console.log(`Found ${failedPayments?.length || 0} payments to retry`);

  for (const payment of failedPayments || []) {
    try {
      // Intentar cobrar nuevamente en Stripe
      const invoice = await stripe.invoices.retrieve(payment.stripe_invoice_id);
      
      if (invoice.status === 'open') {
        await stripe.invoices.pay(payment.stripe_invoice_id);
        
        // Actualizar registro
        await supabase
          .from('subscription_payments')
          .update({
            status: 'completed',
            paid_at: new Date().toISOString(),
            retry_count: payment.retry_count + 1,
          })
          .eq('id', payment.id);

        console.log(`Successfully retried payment ${payment.id}`);
      }
    } catch (retryError) {
      // Actualizar contador de reintentos
      const nextRetry = new Date();
      nextRetry.setDate(nextRetry.getDate() + (payment.retry_count + 1) * 3); // 3, 6, 9 días

      await supabase
        .from('subscription_payments')
        .update({
          retry_count: payment.retry_count + 1,
          next_retry_at: payment.retry_count < 2 ? nextRetry.toISOString() : null,
          failure_reason: retryError.message,
        })
        .eq('id', payment.id);

      // Si llegó al máximo de reintentos, suspender plan
      if (payment.retry_count >= 2) {
        await supabase
          .from('business_plans')
          .update({
            status: 'suspended',
            grace_period_ends_at: new Date().toISOString(),
          })
          .eq('id', payment.plan_id);

        // Log evento
        await supabase.from('subscription_events').insert({
          business_id: payment.business_id,
          plan_id: payment.plan_id,
          event_type: 'suspended',
          triggered_by: 'system',
          reason: 'Payment failed after 3 retries',
        });

        // TODO: Enviar notificación al usuario
      }
    }
  }
}
```

**Configurar Cron en Supabase:**

```sql
-- En Supabase Dashboard → Database → Cron Jobs
-- O vía migración:

SELECT cron.schedule(
  'renew-subscriptions-daily',
  '0 2 * * *', -- Ejecutar a las 2 AM todos los días
  $$
  SELECT
    net.http_post(
      url:='https://[project-ref].supabase.co/functions/v1/renew-subscriptions',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.cron_secret') || '"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);
```

**Tiempo Estimado:** 14 horas  
**Entregables:**
- ✅ Edge Function de renovación automática
- ✅ Lógica de reintentos de pagos fallidos
- ✅ Suspensión automática tras 3 fallos
- ✅ Cron job configurado

---

#### 3.2 Edge Function: Cálculo de Métricas de Uso (12 horas)

**Archivo:** `supabase/functions/calculate-usage/index.ts`

```typescript
// supabase/functions/calculate-usage/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface UsageMetrics {
  business_id: string;
  plan_id: string;
  locations_count: number;
  employees_count: number;
  appointments_count: number;
  clients_count: number;
  services_count: number;
  storage_mb: number;
  is_over_limit: boolean;
  limit_exceeded_resources: string[];
  usage_percentage: Record<string, number>;
}

serve(async (req) => {
  const authHeader = req.headers.get('authorization');
  const expectedToken = Deno.env.get('CRON_SECRET');
  
  if (authHeader !== `Bearer ${expectedToken}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  console.log('Starting usage calculation...');

  try {
    // Obtener todos los negocios activos con plan
    const { data: activePlans, error } = await supabase
      .from('business_plans')
      .select('id, business_id, plan_type, limits')
      .eq('status', 'active');

    if (error) throw error;

    console.log(`Calculating usage for ${activePlans?.length || 0} businesses`);

    const results = {
      success: 0,
      failed: 0,
      warnings: [] as string[],
    };

    for (const plan of activePlans || []) {
      try {
        const metrics = await calculateBusinessUsage(supabase, plan.business_id, plan.id);
        
        // Verificar límites
        const { isOverLimit, exceededResources, usagePercentages } = checkLimits(
          metrics,
          plan.limits
        );

        // Guardar métricas
        await supabase.from('usage_metrics').upsert({
          business_id: plan.business_id,
          plan_id: plan.id,
          metric_date: new Date().toISOString().split('T')[0],
          locations_count: metrics.locations_count,
          employees_count: metrics.employees_count,
          appointments_count: metrics.appointments_count,
          clients_count: metrics.clients_count,
          services_count: metrics.services_count,
          storage_mb: metrics.storage_mb,
          is_over_limit: isOverLimit,
          limit_exceeded_resources: exceededResources,
          usage_percentage: usagePercentages,
        });

        // Si está sobre límite, crear notificación
        if (isOverLimit) {
          await createLimitWarning(supabase, plan.business_id, exceededResources);
          results.warnings.push(
            `Business ${plan.business_id} exceeded limits: ${exceededResources.join(', ')}`
          );
        }

        // Alertas preventivas al 80% y 90%
        for (const [resource, percentage] of Object.entries(usagePercentages)) {
          if (percentage >= 80 && percentage < 100) {
            await createUsageAlert(
              supabase,
              plan.business_id,
              resource,
              percentage
            );
          }
        }

        results.success++;
      } catch (businessError) {
        console.error(`Error calculating usage for business ${plan.business_id}:`, businessError);
        results.failed++;
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Usage calculation completed',
        results,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in usage calculation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function calculateBusinessUsage(
  supabase: any,
  businessId: string,
  planId: string
): Promise<Omit<UsageMetrics, 'is_over_limit' | 'limit_exceeded_resources' | 'usage_percentage'>> {
  // Locations
  const { count: locationsCount } = await supabase
    .from('locations')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .eq('is_active', true);

  // Employees (usuarios con role admin o employee)
  const { count: employeesCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .in('role', ['admin', 'employee'])
    .eq('is_active', true);

  // Appointments del mes actual
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: appointmentsCount } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .gte('start_time', startOfMonth.toISOString());

  // Clients activos
  const { count: clientsCount } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .eq('status', 'active');

  // Services activos
  const { count: servicesCount } = await supabase
    .from('services')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .eq('is_active', true);

  // Storage (simplificado - en producción calcular tamaño real de archivos)
  const storageMb = 0; // TODO: Calcular storage real de Supabase Storage

  return {
    business_id: businessId,
    plan_id: planId,
    locations_count: locationsCount || 0,
    employees_count: employeesCount || 0,
    appointments_count: appointmentsCount || 0,
    clients_count: clientsCount || 0,
    services_count: servicesCount || 0,
    storage_mb: storageMb,
  };
}

function checkLimits(
  metrics: Omit<UsageMetrics, 'is_over_limit' | 'limit_exceeded_resources' | 'usage_percentage'>,
  limits: any
): {
  isOverLimit: boolean;
  exceededResources: string[];
  usagePercentages: Record<string, number>;
} {
  const exceededResources: string[] = [];
  const usagePercentages: Record<string, number> = {};

  const checks = [
    {
      name: 'locations',
      current: metrics.locations_count,
      limit: limits.max_locations,
    },
    {
      name: 'employees',
      current: metrics.employees_count,
      limit: limits.max_employees,
    },
    {
      name: 'appointments',
      current: metrics.appointments_count,
      limit: limits.max_appointments_monthly,
    },
    {
      name: 'clients',
      current: metrics.clients_count,
      limit: limits.max_clients,
    },
    {
      name: 'services',
      current: metrics.services_count,
      limit: limits.max_services,
    },
  ];

  for (const check of checks) {
    // Si el límite es null = ilimitado
    if (check.limit === null || check.limit === undefined) {
      usagePercentages[check.name] = 0;
      continue;
    }

    const percentage = (check.current / check.limit) * 100;
    usagePercentages[check.name] = Math.round(percentage);

    if (check.current > check.limit) {
      exceededResources.push(check.name);
    }
  }

  return {
    isOverLimit: exceededResources.length > 0,
    exceededResources,
    usagePercentages,
  };
}

async function createLimitWarning(
  supabase: any,
  businessId: string,
  exceededResources: string[]
) {
  // Obtener owner del negocio
  const { data: business } = await supabase
    .from('businesses')
    .select('owner_id')
    .eq('id', businessId)
    .single();

  if (!business) return;

  // Crear notificación in-app
  await supabase.from('notifications').insert({
    user_id: business.owner_id,
    business_id: businessId,
    type: 'system',
    title: 'Límite de plan alcanzado',
    message: `Has alcanzado el límite en: ${exceededResources.join(', ')}. Considera actualizar tu plan.`,
    scheduled_for: new Date().toISOString(),
    delivery_method: 'push',
    status: 'pending',
  });
}

async function createUsageAlert(
  supabase: any,
  businessId: string,
  resource: string,
  percentage: number
) {
  const { data: business } = await supabase
    .from('businesses')
    .select('owner_id')
    .eq('id', businessId)
    .single();

  if (!business) return;

  const threshold = percentage >= 90 ? '90%' : '80%';

  await supabase.from('notifications').insert({
    user_id: business.owner_id,
    business_id: businessId,
    type: 'system',
    title: `Uso al ${threshold}`,
    message: `Estás usando el ${Math.round(percentage)}% de tu límite de ${resource}.`,
    scheduled_for: new Date().toISOString(),
    delivery_method: 'push',
    status: 'pending',
  });
}
```

**Configurar Cron:**

```sql
SELECT cron.schedule(
  'calculate-usage-daily',
  '0 3 * * *', -- Ejecutar a las 3 AM todos los días
  $$
  SELECT
    net.http_post(
      url:='https://[project-ref].supabase.co/functions/v1/calculate-usage',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.cron_secret') || '"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);
```

**Tiempo Estimado:** 12 horas  
**Entregables:**
- ✅ Cálculo automático de métricas diarias
- ✅ Verificación de límites por recurso
- ✅ Notificaciones al 80%, 90% y 100%
- ✅ Cron job configurado

---

#### 3.3 Custom Hooks para Frontend (14 horas)

**Archivo:** `src/hooks/useSubscription.ts`

```typescript
// src/hooks/useSubscription.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase.gen';

type BusinessPlan = Database['public']['Tables']['business_plans']['Row'];
type UsageMetrics = Database['public']['Tables']['usage_metrics']['Row'];
type SubscriptionPayment = Database['public']['Tables']['subscription_payments']['Row'];

interface SubscriptionDashboard {
  plan: BusinessPlan | null;
  currentUsage: UsageMetrics | null;
  recentPayments: SubscriptionPayment[];
  isOverLimit: boolean;
  limitWarnings: string[];
}

export function useSubscription(businessId: string) {
  const queryClient = useQueryClient();

  // Query: Dashboard completo
  const dashboardQuery = useQuery({
    queryKey: ['subscription', businessId],
    queryFn: async (): Promise<SubscriptionDashboard> => {
      const { data, error } = await supabase.rpc('get_subscription_dashboard', {
        p_business_id: businessId,
      });

      if (error) throw error;

      return data as SubscriptionDashboard;
    },
    refetchInterval: 30000, // Refetch cada 30 segundos
  });

  // Query: Métricas de uso actuales
  const usageQuery = useQuery({
    queryKey: ['usage', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usage_metrics')
        .select('*')
        .eq('business_id', businessId)
        .order('metric_date', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignorar "not found"
      return data;
    },
  });

  // Query: Historial de pagos
  const paymentsQuery = useQuery({
    queryKey: ['payments', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_payments')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });

  // Mutation: Cancelar suscripción
  const cancelSubscription = useMutation({
    mutationFn: async ({ reason }: { reason?: string }) => {
      const { data: plan } = await supabase
        .from('business_plans')
        .select('stripe_subscription_id')
        .eq('business_id', businessId)
        .single();

      if (!plan?.stripe_subscription_id) {
        throw new Error('No active subscription found');
      }

      // Llamar a Edge Function para cancelar en Stripe
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: {
          subscriptionId: plan.stripe_subscription_id,
          reason,
          cancelAtPeriodEnd: true,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', businessId] });
    },
  });

  // Mutation: Refrescar métricas manualmente
  const refreshUsage = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('calculate_usage_metrics', {
        p_business_id: businessId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usage', businessId] });
    },
  });

  return {
    // Data
    subscription: dashboardQuery.data?.plan,
    usage: usageQuery.data,
    payments: paymentsQuery.data || [],
    isOverLimit: dashboardQuery.data?.isOverLimit || false,
    limitWarnings: dashboardQuery.data?.limitWarnings || [],

    // Status
    isLoading:
      dashboardQuery.isLoading || usageQuery.isLoading || paymentsQuery.isLoading,
    error:
      dashboardQuery.error || usageQuery.error || paymentsQuery.error,

    // Actions
    cancelSubscription: cancelSubscription.mutate,
    refreshUsage: refreshUsage.mutate,
    isCanceling: cancelSubscription.isPending,
    isRefreshing: refreshUsage.isPending,

    // Refetch
    refetch: () => {
      dashboardQuery.refetch();
      usageQuery.refetch();
      paymentsQuery.refetch();
    },
  };
}
```

**Archivo:** `src/hooks/usePaymentMethods.ts`

```typescript
// src/hooks/usePaymentMethods.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase.gen';

type PaymentMethod = Database['public']['Tables']['payment_methods']['Row'];

export function usePaymentMethods(businessId: string) {
  const queryClient = useQueryClient();

  // Query: Listar métodos de pago
  const methodsQuery = useQuery({
    queryKey: ['paymentMethods', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Mutation: Eliminar método de pago
  const deleteMethod = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      // Primero desvincularlo en Stripe
      const { data: method } = await supabase
        .from('payment_methods')
        .select('stripe_payment_method_id')
        .eq('id', paymentMethodId)
        .single();

      if (method?.stripe_payment_method_id) {
        await supabase.functions.invoke('detach-payment-method', {
          body: { paymentMethodId: method.stripe_payment_method_id },
        });
      }

      // Marcar como inactivo en DB
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_active: false })
        .eq('id', paymentMethodId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods', businessId] });
    },
  });

  // Mutation: Marcar como predeterminado
  const setDefaultMethod = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      const { data: method } = await supabase
        .from('payment_methods')
        .select('stripe_customer_id, stripe_payment_method_id')
        .eq('id', paymentMethodId)
        .single();

      if (!method) throw new Error('Payment method not found');

      // Actualizar en Stripe
      await supabase.functions.invoke('set-default-payment-method', {
        body: {
          customerId: method.stripe_customer_id,
          paymentMethodId: method.stripe_payment_method_id,
        },
      });

      // Actualizar en DB (trigger manejará el resto)
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_default: true })
        .eq('id', paymentMethodId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods', businessId] });
    },
  });

  return {
    methods: methodsQuery.data || [],
    defaultMethod: methodsQuery.data?.find((m) => m.is_default),
    isLoading: methodsQuery.isLoading,
    error: methodsQuery.error,
    deleteMethod: deleteMethod.mutate,
    setDefaultMethod: setDefaultMethod.mutate,
    isDeleting: deleteMethod.isPending,
    isSettingDefault: setDefaultMethod.isPending,
  };
}
```

**Tiempo Estimado:** 14 horas  
**Entregables:**
- ✅ Hook `useSubscription` completo
- ✅ Hook `usePaymentMethods` completo
- ✅ Integración con TanStack Query
- ✅ Manejo de estados de loading/error

---

#### 3.4 Validación de Límites en Acciones (8 horas)

**Archivo:** `src/lib/billing/validateLimit.ts`

```typescript
// src/lib/billing/validateLimit.ts

import { supabase } from '@/lib/supabase';

export interface LimitCheckResult {
  allowed: boolean;
  unlimited?: boolean;
  current?: number;
  limit?: number;
  remaining?: number;
  percentage?: number;
  reason?: string;
  upgradeRequired?: boolean;
  suggestedPlan?: string;
}

export async function validateLimit(
  businessId: string,
  resource: 'location' | 'employee' | 'appointment' | 'client' | 'service'
): Promise<LimitCheckResult> {
  const { data, error } = await supabase.rpc('validate_plan_limits', {
    p_business_id: businessId,
    p_resource: resource,
  });

  if (error) {
    console.error('Error validating limit:', error);
    throw error;
  }

  return data as LimitCheckResult;
}

// Hook para usar en componentes
export function useLimitCheck(businessId: string, resource: string) {
  return useQuery({
    queryKey: ['limitCheck', businessId, resource],
    queryFn: () => validateLimit(businessId, resource as any),
    staleTime: 60000, // Cache por 1 minuto
  });
}
```

**Uso en componentes:**

```typescript
// Ejemplo: Antes de crear una ubicación
const { data: limitCheck } = useLimitCheck(businessId, 'location');

const handleCreateLocation = async () => {
  if (!limitCheck?.allowed) {
    toast.error(limitCheck?.reason || 'Límite alcanzado');
    // Mostrar modal de upgrade
    return;
  }

  // Proceder con la creación
  await createLocation();
};
```

**Tiempo Estimado:** 8 horas  
**Entregables:**
- ✅ Función `validateLimit` utilitaria
- ✅ Hook `useLimitCheck` para componentes
- ✅ Integración en flujos de creación

---

### 🎯 Checkpoint Fase 3

**Criterios de Éxito:**
```powershell
# Deploy Edge Functions
supabase functions deploy renew-subscriptions
supabase functions deploy calculate-usage

# Configurar cron jobs
# (hacerlo desde Supabase Dashboard o SQL)

# Tests
npm run test -- src/hooks/useSubscription.test.ts
npm run test -- src/hooks/usePaymentMethods.test.ts
```

**Entregables Totales:**
- ✅ Renovación automática de suscripciones (cron diario)
- ✅ Cálculo automático de métricas de uso
- ✅ Sistema de alertas al 80%, 90%, 100%
- ✅ Hooks `useSubscription` y `usePaymentMethods`
- ✅ Validación de límites en tiempo real
- ✅ Notificaciones in-app para warnings

**Tiempo Total:** 48 horas  
**Siguiente Fase:** Fase 4 - Interfaz de Usuario Completa

---

## 💼 FASE 4 — Interfaz de Usuario Completa (46 horas)

### Objetivo
Crear todos los componentes React necesarios para el sistema de billing, integrándolos con los hooks y Edge Functions ya implementados.

---

### 📝 Tareas

#### 4.1 Diseño de UI y Sistema de Diseño (6 horas)

**Crear Prototipos en Figma:**

1. **Billing Dashboard** (pantalla principal)
   - Resumen del plan actual
   - Métricas de uso con barras de progreso
   - Historial de pagos reciente
   - CTAs para actualizar/gestionar

2. **Plan Selection Page**
   - Grid de 4 planes (Inicio, Profesional, Empresarial, Corporativo)
   - Comparación de características
   - Toggle mensual/anual
   - Input para códigos de descuento

3. **Payment Methods Manager**
   - Lista de métodos de pago guardados
   - Indicador de método predeterminado
   - Botones para agregar/eliminar
   - Modal con Stripe Elements

4. **Payment History**
   - Tabla con filtros y paginación
   - Estados visuales (completado/fallido/pendiente)
   - Links para descargar facturas

5. **Upgrade/Downgrade Modal**
   - Comparación actual vs nuevo plan
   - Cálculo prorrateado
   - Confirmación antes de proceder

**Validación:**
- Revisar con equipo de producto
- Verificar accesibilidad (contraste WCAG AA)
- Aprobar colores, iconos y tipografía

**Tiempo Estimado:** 6 horas

---

#### 4.2 Componentes Core de Billing (24 horas)

**Archivo:** `src/components/billing/PlanCard.tsx`

```typescript
// src/components/billing/PlanCard.tsx

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

interface PlanFeature {
  name: string;
  included: boolean;
  limit?: string;
}

interface PlanCardProps {
  name: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  features: PlanFeature[];
  isCurrentPlan?: boolean;
  isPopular?: boolean;
  onSelect: () => void;
  isLoading?: boolean;
}

export function PlanCard({
  name,
  description,
  price,
  currency,
  billingCycle,
  features,
  isCurrentPlan = false,
  isPopular = false,
  onSelect,
  isLoading = false,
}: PlanCardProps) {
  return (
    <Card className={`relative ${isPopular ? 'border-primary border-2' : ''}`}>
      {isPopular && (
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          Más Popular
        </Badge>
      )}
      
      <CardHeader>
        <CardTitle className="text-2xl">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold">
              ${price.toLocaleString('es-CO')}
            </span>
            <span className="text-muted-foreground">
              {currency}/{billingCycle === 'monthly' ? 'mes' : 'año'}
            </span>
          </div>
        </div>

        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className={`h-5 w-5 mt-0.5 ${feature.included ? 'text-green-500' : 'text-gray-300'}`} />
              <span className={feature.included ? 'text-foreground' : 'text-muted-foreground'}>
                {feature.name}
                {feature.limit && <span className="text-muted-foreground ml-1">({feature.limit})</span>}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          variant={isCurrentPlan ? 'outline' : 'default'}
          disabled={isCurrentPlan || isLoading}
          onClick={onSelect}
        >
          {isCurrentPlan ? 'Plan Actual' : isLoading ? 'Procesando...' : 'Seleccionar Plan'}
        </Button>
      </CardFooter>
    </Card>
  );
}
```

**Archivo:** `src/components/billing/PaymentMethodManager.tsx`

```typescript
// src/components/billing/PaymentMethodManager.tsx

import React, { useState } from 'react';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CreditCard, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AddPaymentMethodForm } from './AddPaymentMethodForm';

interface PaymentMethodManagerProps {
  businessId: string;
}

export function PaymentMethodManager({ businessId }: PaymentMethodManagerProps) {
  const { methods, deleteMethod, setDefaultMethod, isDeleting, isSettingDefault } =
    usePaymentMethods(businessId);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleDelete = (methodId: string) => {
    if (confirm('¿Estás seguro de eliminar este método de pago?')) {
      deleteMethod(methodId, {
        onSuccess: () => {
          toast.success('Método de pago eliminado');
        },
        onError: (error) => {
          toast.error('Error al eliminar método de pago');
          console.error(error);
        },
      });
    }
  };

  const handleSetDefault = (methodId: string) => {
    setDefaultMethod(methodId, {
      onSuccess: () => {
        toast.success('Método de pago predeterminado actualizado');
      },
      onError: (error) => {
        toast.error('Error al actualizar método de pago');
        console.error(error);
      },
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Métodos de Pago</CardTitle>
            <CardDescription>
              Gestiona tus tarjetas de crédito y débito
            </CardDescription>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Método
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {methods.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No tienes métodos de pago guardados</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowAddDialog(true)}
              >
                Agregar tu primera tarjeta
              </Button>
            </div>
          ) : (
            methods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {method.brand} •••• {method.last4}
                      </span>
                      {method.is_default && (
                        <Badge variant="secondary">Predeterminado</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Expira {method.exp_month}/{method.exp_year}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {!method.is_default && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(method.id)}
                      disabled={isSettingDefault}
                    >
                      Predeterminar
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(method.id)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Método de Pago</DialogTitle>
            <DialogDescription>
              Ingresa los datos de tu tarjeta de crédito o débito
            </DialogDescription>
          </DialogHeader>
          <AddPaymentMethodForm
            businessId={businessId}
            onSuccess={() => {
              setShowAddDialog(false);
              toast.success('Método de pago agregado exitosamente');
            }}
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
```

**Archivo:** `src/components/billing/AddPaymentMethodForm.tsx`

```typescript
// src/components/billing/AddPaymentMethodForm.tsx

import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AddPaymentMethodFormProps {
  businessId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AddPaymentMethodForm({
  businessId,
  onSuccess,
  onCancel,
}: AddPaymentMethodFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardholderName, setCardholderName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');

      // Crear método de pago en Stripe
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: cardholderName,
        },
      });

      if (stripeError) {
        setError(stripeError.message || 'Error al procesar tarjeta');
        return;
      }

      // Llamar a Edge Function para vincular método de pago
      const { error: apiError } = await supabase.functions.invoke('attach-payment-method', {
        body: {
          businessId,
          paymentMethodId: paymentMethod!.id,
        },
      });

      if (apiError) throw apiError;

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error al agregar método de pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cardholderName">Nombre del titular</Label>
        <Input
          id="cardholderName"
          placeholder="Juan Pérez"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Información de la tarjeta</Label>
        <div className="border rounded-md p-3">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!stripe || loading} className="flex-1">
          {loading ? 'Procesando...' : 'Agregar Tarjeta'}
        </Button>
      </div>
    </form>
  );
}
```

**Tiempo Estimado:** 24 horas  
**Entregables:**
- ✅ PlanCard component con features
- ✅ PaymentMethodManager completo
- ✅ AddPaymentMethodForm con Stripe Elements
- ✅ PaymentHistoryTable con paginación
- ✅ UsageMetricsCard reutilizable
- ✅ PlanUpgradeModal con confirmación

---

#### 4.3 Routing y Páginas (8 horas)

**Archivo:** `src/pages/app/billing/index.tsx`

```typescript
// src/pages/app/billing/index.tsx

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { SubscriptionDashboard } from '@/components/billing/SubscriptionDashboard';
import { PaymentMethodManager } from '@/components/billing/PaymentMethodManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Receipt, TrendingUp } from 'lucide-react';

export default function BillingPage() {
  const { user } = useAuth();

  if (!user?.business_id) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Facturación y Suscripción</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona tu plan, métodos de pago y consulta tu historial de facturación
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="overview">
            <TrendingUp className="h-4 w-4 mr-2" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="payment-methods">
            <CreditCard className="h-4 w-4 mr-2" />
            Métodos de Pago
          </TabsTrigger>
          <TabsTrigger value="history">
            <Receipt className="h-4 w-4 mr-2" />
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <SubscriptionDashboard businessId={user.business_id} />
        </TabsContent>

        <TabsContent value="payment-methods" className="mt-6">
          <PaymentMethodManager businessId={user.business_id} />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          {/* Implementar PaymentHistoryTable */}
          <div>Historial de pagos (por implementar)</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**Actualizar Rutas:**

```typescript
// src/App.tsx o router configuration

import BillingPage from '@/pages/app/billing';

const routes = [
  // ...otras rutas
  {
    path: '/billing',
    element: (
      <ProtectedRoute requiredRole={['owner', 'admin']}>
        <BillingPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/billing/plans',
    element: (
      <ProtectedRoute>
        <PlanSelectionPage />
      </ProtectedRoute>
    ),
  },
];
```

**Tiempo Estimado:** 8 horas  
**Entregables:**
- ✅ Página principal de billing con tabs
- ✅ Rutas protegidas por rol
- ✅ Navegación integrada en menu

---

#### 4.4 Localización y Accesibilidad (8 horas)

**Archivo:** `src/locales/es/billing.json`

```json
{
  "billing": {
    "title": "Facturación",
    "subscription": "Suscripción",
    "payment_methods": "Métodos de Pago",
    "payment_history": "Historial de Pagos",
    "current_plan": "Plan Actual",
    "upgrade_plan": "Actualizar Plan",
    "cancel_subscription": "Cancelar Suscripción",
    "add_payment_method": "Agregar Método de Pago",
    "set_as_default": "Establecer como predeterminado",
    "remove_payment_method": "Eliminar método de pago",
    "payment_method_added": "Método de pago agregado exitosamente",
    "payment_method_removed": "Método de pago eliminado",
    "subscription_canceled": "Suscripción cancelada",
    "limit_reached": "Has alcanzado el límite de tu plan",
    "upgrade_required": "Se requiere actualización de plan",
    "usage": {
      "locations": "Ubicaciones",
      "employees": "Empleados",
      "services": "Servicios",
      "clients": "Clientes",
      "appointments": "Citas mensuales"
    }
  }
}
```

**Verificación de Accesibilidad:**
- Labels descriptivos en todos los inputs
- Contraste WCAG AA en todos los componentes
- Navegación por teclado funcional
- Screen reader friendly (aria-labels)

**Tiempo Estimado:** 8 horas  
**Entregables:**
- ✅ Traducciones es/en completas
- ✅ Accesibilidad WCAG AA
- ✅ Tests de navegación por teclado

---

### 🎯 Checkpoint Fase 4

**Criterios de Éxito:**
```powershell
# Tests
npm run test -- src/components/billing/
npm run test:e2e -- tests/e2e/billing-ui.spec.ts

# Verificar en navegador
# http://localhost:5173/billing
# http://localhost:5173/billing/plans

# Verificar accesibilidad
npx lighthouse http://localhost:5173/billing --view
```

**Entregables Totales:**
- ✅ Diseños validados en Figma
- ✅ 6+ componentes React reutilizables
- ✅ Integración completa con Stripe Elements
- ✅ Páginas de billing funcionales
- ✅ Rutas protegidas por rol
- ✅ Localización es/en completa
- ✅ Accesibilidad WCAG AA

**Tiempo Total:** 46 horas  
**Siguiente Fase:** Fase 5 - QA, Operaciones y Lanzamiento

---

## 🧪 FASE 5 — QA, Operaciones y Lanzamiento (36 horas)

### Objetivo
Asegurar calidad del sistema mediante testing exhaustivo, crear documentación operacional y preparar el lanzamiento a producción.

---

### 📝 Tareas

#### 5.1 Suite de Testing Completa (20 horas)

**Tests Unitarios de Hooks:**

**Archivo:** `src/hooks/__tests__/useSubscription.test.ts`

```typescript
// src/hooks/__tests__/useSubscription.test.ts

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSubscription } from '../useSubscription';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase');

describe('useSubscription', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  it('should fetch subscription data successfully', async () => {
    const mockData = {
      plan: { id: '1', plan_type: 'profesional', status: 'active' },
      currentUsage: { locations_count: 3 },
      recentPayments: [],
      isOverLimit: false,
      limitWarnings: [],
    };

    vi.spyOn(supabase, 'rpc').mockResolvedValue({ data: mockData, error: null });

    const wrapper = ({ children }: any) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useSubscription('business-123'), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.subscription).toEqual(mockData.plan);
    expect(result.current.usage).toEqual(mockData.currentUsage);
    expect(result.current.isOverLimit).toBe(false);
  });

  it('should handle errors gracefully', async () => {
    vi.spyOn(supabase, 'rpc').mockResolvedValue({
      data: null,
      error: new Error('Database error'),
    });

    const wrapper = ({ children }: any) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useSubscription('business-123'), { wrapper });

    await waitFor(() => expect(result.current.error).toBeTruthy());
  });
});
```

**Tests de Componentes:**

**Archivo:** `src/components/billing/__tests__/PlanCard.test.tsx`

```typescript
// src/components/billing/__tests__/PlanCard.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import { PlanCard } from '../PlanCard';

describe('PlanCard', () => {
  const mockFeatures = [
    { name: '3 ubicaciones', included: true },
    { name: '10 empleados', included: true },
    { name: 'Reportes avanzados', included: false },
  ];

  const mockProps = {
    name: 'Profesional',
    description: 'Para equipos en crecimiento',
    price: 79900,
    currency: 'COP',
    billingCycle: 'monthly' as const,
    features: mockFeatures,
    onSelect: vi.fn(),
  };

  it('should render plan information correctly', () => {
    render(<PlanCard {...mockProps} />);

    expect(screen.getByText('Profesional')).toBeInTheDocument();
    expect(screen.getByText('Para equipos en crecimiento')).toBeInTheDocument();
    expect(screen.getByText('$79,900')).toBeInTheDocument();
  });

  it('should call onSelect when button is clicked', () => {
    render(<PlanCard {...mockProps} />);

    const button = screen.getByRole('button', { name: /Seleccionar Plan/i });
    fireEvent.click(button);

    expect(mockProps.onSelect).toHaveBeenCalledTimes(1);
  });

  it('should disable button if current plan', () => {
    render(<PlanCard {...mockProps} isCurrentPlan />);

    const button = screen.getByRole('button', { name: /Plan Actual/i });
    expect(button).toBeDisabled();
  });

  it('should show popular badge when specified', () => {
    render(<PlanCard {...mockProps} isPopular />);

    expect(screen.getByText('Más Popular')).toBeInTheDocument();
  });
});
```

**Tests End-to-End:**

**Archivo:** `tests/e2e/billing-complete-flow.spec.ts`

```typescript
// tests/e2e/billing-complete-flow.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Complete Billing Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'owner@test.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should complete subscription upgrade flow', async ({ page }) => {
    // Navegar a billing
    await page.goto('/billing/plans');

    // Seleccionar plan Profesional
    await page.click('text=Profesional >> .. >> button:has-text("Seleccionar Plan")');

    // Verificar modal de confirmación
    await expect(page.locator('text=Confirmar Actualización')).toBeVisible();
    
    // Revisar resumen
    await expect(page.locator('text=$79.900')).toBeVisible();
    
    // Confirmar
    await page.click('button:has-text("Confirmar y Pagar")');

    // Esperar redirección a Stripe Checkout
    await page.waitForURL(/checkout\.stripe\.com/);
    
    // En ambiente de test, simular éxito
    // (en producción, Stripe redirige de vuelta)
  });

  test('should add payment method', async ({ page }) => {
    await page.goto('/billing');
    await page.click('text=Métodos de Pago');

    // Agregar nuevo método
    await page.click('button:has-text("Agregar Método")');

    // Llenar formulario
    await page.fill('[name="cardholderName"]', 'Juan Pérez');
    
    // Stripe Elements (frame)
    const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
    await stripeFrame.locator('[name="cardnumber"]').fill('4242424242424242');
    await stripeFrame.locator('[name="exp-date"]').fill('12/25');
    await stripeFrame.locator('[name="cvc"]').fill('123');

    // Enviar
    await page.click('button:has-text("Agregar Tarjeta")');

    // Verificar éxito
    await expect(page.locator('text=•••• 4242')).toBeVisible({ timeout: 10000 });
  });

  test('should display usage metrics correctly', async ({ page }) => {
    await page.goto('/billing');

    // Verificar sección de uso
    await expect(page.locator('text=Uso de Recursos')).toBeVisible();

    // Verificar métricas individuales
    const metrics = ['Ubicaciones', 'Empleados', 'Servicios', 'Clientes', 'Citas'];
    
    for (const metric of metrics) {
      await expect(page.locator(`text=${metric}`)).toBeVisible();
    }

    // Verificar barras de progreso
    const progressBars = page.locator('[role="progressbar"]');
    await expect(progressBars).toHaveCount(5);
  });

  test('should block action when limit is reached', async ({ page }) => {
    // Mock API para simular límite alcanzado
    await page.route('**/rest/v1/rpc/validate_plan_limits', async (route) => {
      await route.fulfill({
        json: {
          allowed: false,
          reason: 'Has alcanzado el límite de 3 ubicaciones',
          upgradeRequired: true,
          suggestedPlan: 'profesional',
        },
      });
    });

    // Intentar crear nueva ubicación
    await page.goto('/locations');
    await page.click('button:has-text("Nueva Ubicación")');

    // Verificar modal de límite
    await expect(page.locator('text=Has alcanzado el límite')).toBeVisible();
    await expect(page.locator('text=Actualizar Plan')).toBeVisible();
  });

  test('should cancel subscription with confirmation', async ({ page }) => {
    await page.goto('/billing');

    // Click en cancelar
    await page.click('button:has-text("Cancelar Suscripción")');

    // Verificar modal de confirmación
    await expect(page.locator('text=¿Estás seguro?')).toBeVisible();
    
    // Llenar razón
    await page.fill('textarea[name="reason"]', 'Probando otra solución');

    // Confirmar cancelación
    await page.click('button:has-text("Sí, cancelar")');

    // Verificar mensaje de éxito
    await expect(page.locator('text=Suscripción cancelada')).toBeVisible();
  });
});
```

**Configurar CI/CD:**

**Archivo:** `.github/workflows/test-billing.yml`

```yaml
# .github/workflows/test-billing.yml

name: Billing System Tests

on:
  push:
    branches: [main, develop]
    paths:
      - 'src/components/billing/**'
      - 'src/hooks/useSubscription.ts'
      - 'src/hooks/usePaymentMethods.ts'
      - 'supabase/functions/**'
      - 'supabase/migrations/**'
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test -- --coverage src/hooks/ src/components/billing/
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Start Supabase
        run: npx supabase start
      
      - name: Run migrations
        run: npx supabase db reset
      
      - name: Start dev server
        run: npm run dev &
        env:
          VITE_SUPABASE_URL: http://localhost:54321
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

**Tiempo Estimado:** 20 horas  
**Entregables:**
- ✅ Tests unitarios para todos los hooks
- ✅ Tests de componentes con React Testing Library
- ✅ Tests e2e completos con Playwright
- ✅ CI/CD pipeline configurado
- ✅ Coverage > 80%

---

#### 5.2 Documentación Operacional (10 horas)

**Archivo:** `docs/billing/README.md`

```markdown
# Sistema de Billing - Documentación

## Índice
1. [Arquitectura](#arquitectura)
2. [Flujos Principales](#flujos-principales)
3. [Webhooks](#webhooks)
4. [Troubleshooting](#troubleshooting)
5. [FAQ](#faq)

## Arquitectura

El sistema de billing está compuesto por:

- **Frontend**: React components en `src/components/billing/`
- **Backend**: Supabase Edge Functions en `supabase/functions/`
- **Database**: PostgreSQL con 6 tablas principales
- **Payment Gateway**: Stripe API

### Tablas Principales

- `business_plans`: Planes activos por negocio
- `payment_methods`: Métodos de pago guardados
- `subscription_payments`: Historial de pagos
- `subscription_events`: Audit trail
- `usage_metrics`: Métricas de consumo diarias
- `discount_codes`: Códigos de descuento

## Flujos Principales

### Suscripción a Plan

1. Usuario selecciona plan en `/billing/plans`
2. Frontend llama `create-checkout-session` Edge Function
3. Usuario redirigido a Stripe Checkout
4. Tras pago exitoso, webhook `checkout.session.completed`
5. Se crea/actualiza `business_plans` y `subscription_payments`
6. Usuario redirigido a `/billing?success=true`

### Renovación Automática

1. Cron job diario ejecuta `renew-subscriptions` (2 AM)
2. Identifica planes que expiran en 24h
3. Stripe cobra automáticamente
4. Webhook `invoice.paid` actualiza registros
5. Si falla, inicia lógica de reintentos

### Cálculo de Uso

1. Cron job diario ejecuta `calculate-usage` (3 AM)
2. Cuenta recursos por negocio
3. Guarda en `usage_metrics`
4. Compara con límites del plan
5. Envía notificaciones si > 80%

## Webhooks

### Configuración

URL: `https://[project-ref].supabase.co/functions/v1/stripe-webhook`
Secret: Almacenado en `STRIPE_WEBHOOK_SECRET`

### Eventos Manejados

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`
- `payment_method.attached`
- `payment_method.detached`

## Troubleshooting

### Pago Fallido

**Síntomas**: Usuario reporta que su suscripción fue suspendida

**Diagnóstico**:
```sql
SELECT * FROM subscription_payments
WHERE business_id = '[business-id]'
AND status = 'failed'
ORDER BY created_at DESC;
```

**Solución**:
1. Verificar método de pago en Stripe Dashboard
2. Revisar razón del fallo en `failure_reason`
3. Si es problema de fondos, esperar reintento automático
4. Si es tarjeta expirada, solicitar actualización
5. Reactivar manualmente si es necesario:
```sql
UPDATE business_plans
SET status = 'active', grace_period_ends_at = NULL
WHERE business_id = '[business-id]';
```

### Webhook No Llega

**Síntomas**: Pago completado en Stripe pero no reflejado en app

**Diagnóstico**:
1. Verificar en Stripe Dashboard → Webhooks → [endpoint]
2. Revisar logs de webhook
3. Verificar que `STRIPE_WEBHOOK_SECRET` es correcto

**Solución**:
1. Re-enviar webhook desde Stripe Dashboard
2. Si persiste, actualizar manualmente:
```sql
-- Crear registro de pago
INSERT INTO subscription_payments (...) VALUES (...);

-- Actualizar plan
UPDATE business_plans
SET status = 'active', end_date = '...'
WHERE id = '...';
```

### Límites No Se Actualizan

**Síntomas**: Usuario reporta que métricas no reflejan cambios

**Diagnóstico**:
```sql
SELECT * FROM usage_metrics
WHERE business_id = '[business-id]'
ORDER BY metric_date DESC
LIMIT 7;
```

**Solución**:
1. Ejecutar cálculo manual:
```sql
SELECT calculate_usage_metrics('[business-id]');
```
2. Verificar cron job está activo
3. Revisar logs de Edge Function `calculate-usage`

## FAQ

### ¿Cómo cambiar el precio de un plan?

1. Actualizar precio en Stripe Dashboard
2. Crear producto con nuevo precio
3. Actualizar `seed-data.sql` con nuevos precios
4. Los cambios aplican para nuevas suscripciones

### ¿Cómo ofrecer descuento personalizado?

```sql
INSERT INTO discount_codes (
  code, discount_type, discount_value,
  max_uses, valid_from, valid_until, is_active
) VALUES (
  'PROMO2025', 'percentage', 20,
  100, NOW(), '2025-12-31', true
);
```

### ¿Cómo pausar una suscripción?

Desde Stripe Dashboard o:
```typescript
await stripe.subscriptions.update(subscriptionId, {
  pause_collection: {
    behavior: 'mark_uncollectible',
  },
});
```

### ¿Qué hacer ante chargeback?

1. Stripe enviará webhook `charge.dispute.created`
2. Sistema marca pago como `disputed`
3. Revisar caso en Stripe Dashboard
4. Recopilar evidencia y responder disputa
5. Si se pierde, plan se suspende automáticamente
```

**Archivo:** `docs/billing/support-playbook.md`

```markdown
# Billing Support Playbook

## Casos Comunes

### 1. "No puedo agregar mi tarjeta"

**Posibles causas**:
- Tarjeta rechazada por banco
- Fondos insuficientes
- Restricciones internacionales
- Error de Stripe API

**Pasos**:
1. Pedir screenshot del error
2. Verificar en Stripe logs el intento
3. Si es rechazo bancario, sugerir contactar banco
4. Si es error de API, escalar a desarrollo

### 2. "Me cobraron dos veces"

**Pasos**:
1. Verificar en `subscription_payments`:
```sql
SELECT * FROM subscription_payments
WHERE business_id = '[business-id]'
AND created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```
2. Comparar con Stripe Dashboard
3. Si confirma duplicado, procesar reembolso:
```typescript
await stripe.refunds.create({
  payment_intent: '[payment-intent-id]',
  amount: [amount],
  reason: 'duplicate',
});
```

### 3. "¿Por qué me suspendieron?"

**Pasos**:
1. Verificar estado del plan:
```sql
SELECT status, grace_period_ends_at, end_date
FROM business_plans
WHERE business_id = '[business-id]';
```
2. Revisar últimos pagos
3. Explicar razón (pago fallido, cancelación, etc.)
4. Ofrecer solución (actualizar método de pago, renovar)

## Escalamiento

- **Nivel 1** (Support): Casos comunes
- **Nivel 2** (Tech Lead): Bugs, discrepancias de datos
- **Nivel 3** (CTO): Problemas de arquitectura, Stripe API issues
```

**Tiempo Estimado:** 10 horas  
**Entregables:**
- ✅ Documentación técnica completa
- ✅ Playbook de soporte
- ✅ FAQ para equipo interno
- ✅ Guías de troubleshooting

---

#### 5.3 Preparación para Lanzamiento (6 horas)

**Checklist Pre-Lanzamiento:**

```markdown
# Checklist de Lanzamiento - Sistema de Billing

## Infraestructura
- [ ] Stripe en modo Live configurado
- [ ] Secrets de producción configurados en Supabase
- [ ] Webhooks de producción registrados y verificados
- [ ] Backups automáticos habilitados
- [ ] Rate limiting configurado

## Seguridad
- [ ] RLS policies auditadas
- [ ] Validación de firma webhook activa
- [ ] PCI compliance documentado
- [ ] Logs sanitizados (sin tarjetas completas)
- [ ] Roles de Supabase correctos

## Monitoreo
- [ ] Alertas Stripe configuradas
- [ ] Logs de Edge Functions monitoreados
- [ ] Dashboard de métricas creado
- [ ] Alertas de pagos fallidos (> 5 en 24h)
- [ ] Alertas de webhooks fallidos

## Testing
- [ ] Test suite > 80% coverage
- [ ] E2E tests pasando
- [ ] Load testing completado (100 concurrent users)
- [ ] Prueba con tarjetas de test
- [ ] Prueba de reintentos de pago

## Documentación
- [ ] README actualizado
- [ ] API docs generadas
- [ ] Support playbook creado
- [ ] FAQ respondidos
- [ ] Guías de usuario creadas

## Legal
- [ ] Términos de servicio actualizados
- [ ] Política de reembolsos definida
- [ ] Privacidad de datos documentada
- [ ] Cumplimiento fiscal verificado

## Comunicación
- [ ] Email templates creados
- [ ] Notificaciones in-app probadas
- [ ] Mensaje de anuncio preparado
- [ ] FAQ público creado
```

**Configurar Alertas:**

```typescript
// supabase/functions/send-alert/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const { type, message, severity } = await req.json();

  // Enviar a Slack
  if (severity === 'critical') {
    await fetch(Deno.env.get('SLACK_WEBHOOK_URL')!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 ${type}: ${message}`,
        channel: '#billing-alerts',
      }),
    });
  }

  // Log en Supabase
  await supabase.from('system_alerts').insert({
    type,
    message,
    severity,
    created_at: new Date().toISOString(),
  });

  return new Response('OK');
});
```

**Tiempo Estimado:** 6 horas  
**Entregables:**
- ✅ Checklist completado
- ✅ Alertas configuradas
- ✅ Monitoreo activo
- ✅ Plan de rollback preparado

---

### 🎯 Checkpoint Fase 5

**Criterios de Éxito:**
```powershell
# Ejecutar suite completa
npm run test:all
npm run test:e2e

# Verificar coverage
npm run test:coverage

# Verificar checklist
cat docs/billing/launch-checklist.md

# Deploy a staging
supabase functions deploy --project-ref staging-ref

# Smoke tests en staging
npm run test:e2e -- --baseURL=https://staging.appointsync.com
```

**Entregables Totales:**
- ✅ Suite de tests completa (unitarios + e2e)
- ✅ CI/CD pipeline funcional
- ✅ Documentación técnica y operacional
- ✅ Support playbook
- ✅ Alertas y monitoreo configurados
- ✅ Checklist de lanzamiento completado

**Tiempo Total:** 36 horas  
**Sistema Listo para Producción** 🚀

---

## 📁 Estructura de Archivos Resultante

```
src/
  lib/
    payments/
      PaymentGateway.ts
      StripeGateway.ts
      index.ts
  hooks/
    useSubscription.ts
    usePaymentMethods.ts
    usePaymentHistory.ts
    useUsageMetrics.ts
  components/
    billing/
      BillingDashboard.tsx
      BillingLayout.tsx
      PlanSummary.tsx
      UsageMetricsCard.tsx
      PaymentMethodManager.tsx
      PaymentHistoryTable.tsx
      PlanUpgradeModal.tsx
  pages/app/billing/index.tsx
supabase/
  migrations/<timestamp>_payments_billing_core.sql
  functions/
    stripe-webhook/
      index.ts
    process-checkout-session/
      index.ts
    renew-subscriptions/
      index.ts
    calculate-usage-metrics/
      index.ts
scripts/
  seed-billing.ts
  trigger-stripe-webhooks.ts (opcional)
tests/
  payments/
    stripe-gateway.test.ts
    subscription-flows.test.ts
  e2e/
    billing.spec.ts
```

---

## 🧩 Dependencias Externas

- `@stripe/stripe-js`, `@stripe/react-stripe-js`
- `stripe` (SDK backend para Edge Functions)
- `zod` (validación de payloads webhook)
- `@tanstack/react-query`
- `date-fns` (manejo fechas billing)

Instalación:
```powershell
npm install @stripe/stripe-js @stripe/react-stripe-js stripe zod date-fns
```

---

## 🛡️ Checklist de Seguridad Pre-Lanzamiento

- [ ] Validación de firma webhook activa con rotación de `STRIPE_WEBHOOK_SECRET` documentada.
- [ ] RLS probado (intento de acceso cruzado debe fallar).
- [ ] Revisar roles Supabase: Edge Functions con `service_role` cuando aplique.
- [ ] Logs de webhooks redactan datos sensibles antes de persistir.
- [ ] Auditoría de `payment_methods` muestra sólo últimos 4 dígitos.

---

## 📈 Métricas y Alertas Post-Lanzamiento

- Monitorizar `subscription_payments.status='failed'` > 5 en 24 h → alerta Slack.
- Dashboard en Supabase para MRR, churn, upgrades.
- Registrar manual de soporte: `docs/billing/support-playbook.md`.

---

## 🧵 Notas Adicionales

- Mantener modo sandbox hasta completar Fase 5.
- Lanzamiento gradual: habilitar billing para beta testers primero.
- Evaluar integración secundaria (Wompi) en roadmap Q1 2026 si Stripe fees impactan margen.

---

**Próximos Pasos Inmediatos:**
1. Validar plan con stakeholders (Producto, Finanzas, Legal).
2. Priorizar Fase 1 → comenzar migraciones.
3. Solicitar acceso Stripe live una vez QA completo.
