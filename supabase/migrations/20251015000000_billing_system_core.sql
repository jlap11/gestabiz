-- ============================================================================
-- SISTEMA DE PAGOS Y SUSCRIPCIONES - MIGRACIÓN PRINCIPAL
-- Fecha: 2025-10-15
-- Descripción: Crea la infraestructura completa para billing con Stripe
-- ============================================================================

-- ============================================================================
-- 1. TABLA: payment_methods
-- Almacena métodos de pago (tarjetas) vinculados a negocios
-- Solo guarda tokens de Stripe, NUNCA datos completos de tarjetas (PCI compliance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    stripe_customer_id TEXT NOT NULL,
    stripe_payment_method_id TEXT NOT NULL UNIQUE,
    
    -- Información de la tarjeta (solo metadatos seguros)
    type TEXT NOT NULL DEFAULT 'card' CHECK (type IN ('card', 'bank_account')),
    brand TEXT, -- visa, mastercard, amex
    last4 TEXT NOT NULL, -- últimos 4 dígitos
    exp_month INTEGER CHECK (exp_month BETWEEN 1 AND 12),
    exp_year INTEGER CHECK (exp_year >= 2024),
    
    -- País y billing details
    country TEXT,
    funding TEXT, -- credit, debit, prepaid
    
    -- Estado y configuración
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    -- Índices para búsqueda
    CONSTRAINT payment_methods_business_id_idx UNIQUE NULLS NOT DISTINCT (business_id, is_default) WHERE is_default = true
);

CREATE INDEX idx_payment_methods_business_id ON payment_methods(business_id) WHERE is_active = true;
CREATE INDEX idx_payment_methods_stripe_customer ON payment_methods(stripe_customer_id);

COMMENT ON TABLE payment_methods IS 'Métodos de pago vinculados a negocios. Solo tokens de Stripe, nunca datos completos de tarjetas.';
COMMENT ON COLUMN payment_methods.stripe_payment_method_id IS 'Token de Stripe (pm_xxxxx). Nunca almacenar números de tarjeta.';
COMMENT ON CONSTRAINT payment_methods_business_id_idx ON payment_methods IS 'Asegura que solo haya un método de pago predeterminado por negocio';

-- ============================================================================
-- 2. TABLA: subscription_payments
-- Historial de pagos realizados para suscripciones
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES business_plans(id) ON DELETE SET NULL,
    
    -- IDs de Stripe
    stripe_payment_intent_id TEXT UNIQUE,
    stripe_invoice_id TEXT UNIQUE,
    stripe_charge_id TEXT,
    
    -- Información del pago
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'COP',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'processing', 'completed', 'failed', 'refunded', 'disputed', 'canceled'
    )),
    
    -- Método de pago usado
    payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
    
    -- Detalles de fallo
    failure_code TEXT,
    failure_reason TEXT,
    
    -- Reintentos (para pagos fallidos)
    retry_count INTEGER DEFAULT 0 CHECK (retry_count >= 0 AND retry_count <= 3),
    next_retry_at TIMESTAMPTZ,
    
    -- Fechas
    paid_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Metadata adicional
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Índices
    CONSTRAINT subscription_payments_amount_positive CHECK (amount > 0)
);

CREATE INDEX idx_subscription_payments_business_id ON subscription_payments(business_id);
CREATE INDEX idx_subscription_payments_status ON subscription_payments(status);
CREATE INDEX idx_subscription_payments_created_at ON subscription_payments(created_at DESC);
CREATE INDEX idx_subscription_payments_stripe_invoice ON subscription_payments(stripe_invoice_id) WHERE stripe_invoice_id IS NOT NULL;

COMMENT ON TABLE subscription_payments IS 'Historial completo de pagos de suscripciones procesados por Stripe';
COMMENT ON COLUMN subscription_payments.retry_count IS 'Contador de reintentos para pagos fallidos (máximo 3)';

-- ============================================================================
-- 3. TABLA: subscription_events
-- Audit trail de eventos de suscripciones (creación, actualización, cancelación)
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES business_plans(id) ON DELETE SET NULL,
    
    -- Tipo de evento
    event_type TEXT NOT NULL CHECK (event_type IN (
        'created', 'activated', 'upgraded', 'downgraded', 'renewed',
        'paused', 'resumed', 'canceled', 'suspended', 'expired',
        'payment_failed', 'payment_succeeded', 'trial_started', 'trial_will_end', 'trial_ended',
        'limit_warning', 'limit_exceeded', 'invoice_upcoming'
    )),
    
    -- Contexto del evento
    triggered_by TEXT CHECK (triggered_by IN ('user', 'system', 'stripe_webhook', 'admin', 'cron')),
    triggered_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Detalles
    reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscription_events_business_id ON subscription_events(business_id);
CREATE INDEX idx_subscription_events_plan_id ON subscription_events(plan_id);
CREATE INDEX idx_subscription_events_type ON subscription_events(event_type);
CREATE INDEX idx_subscription_events_created_at ON subscription_events(created_at DESC);

COMMENT ON TABLE subscription_events IS 'Audit trail completo de eventos de suscripciones para debugging y análisis';

-- ============================================================================
-- 4. TABLA: usage_metrics
-- Métricas diarias de consumo por negocio (para validar límites de plan)
-- ============================================================================

CREATE TABLE IF NOT EXISTS usage_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES business_plans(id) ON DELETE SET NULL,
    
    -- Fecha de la métrica (una entrada por día por negocio)
    metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Contadores de recursos
    locations_count INTEGER DEFAULT 0 CHECK (locations_count >= 0),
    employees_count INTEGER DEFAULT 0 CHECK (employees_count >= 0),
    appointments_count INTEGER DEFAULT 0 CHECK (appointments_count >= 0), -- del mes actual
    clients_count INTEGER DEFAULT 0 CHECK (clients_count >= 0),
    services_count INTEGER DEFAULT 0 CHECK (services_count >= 0),
    storage_mb DECIMAL(10, 2) DEFAULT 0 CHECK (storage_mb >= 0),
    
    -- Análisis de límites
    is_over_limit BOOLEAN DEFAULT false,
    limit_exceeded_resources TEXT[], -- ['locations', 'employees']
    usage_percentage JSONB DEFAULT '{}'::jsonb, -- {locations: 85, employees: 60}
    
    -- Auditoría
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint: una métrica por día por negocio
    CONSTRAINT usage_metrics_business_date_unique UNIQUE (business_id, metric_date)
);

CREATE INDEX idx_usage_metrics_business_id ON usage_metrics(business_id);
CREATE INDEX idx_usage_metrics_date ON usage_metrics(metric_date DESC);
CREATE INDEX idx_usage_metrics_over_limit ON usage_metrics(business_id) WHERE is_over_limit = true;

COMMENT ON TABLE usage_metrics IS 'Métricas diarias de consumo para validar límites de plan y alertas';
COMMENT ON COLUMN usage_metrics.usage_percentage IS 'Porcentaje de uso por recurso en formato JSON: {locations: 85, employees: 60}';

-- ============================================================================
-- 5. TABLA: discount_codes
-- Códigos de descuento para promociones y partners
-- ============================================================================

CREATE TABLE IF NOT EXISTS discount_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Información del código
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    
    -- Tipo de descuento
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0),
    
    -- Restricciones
    max_uses INTEGER CHECK (max_uses > 0), -- NULL = ilimitado
    current_uses INTEGER DEFAULT 0 CHECK (current_uses >= 0),
    min_amount DECIMAL(10, 2) CHECK (min_amount > 0), -- monto mínimo para aplicar
    
    -- Planes elegibles (NULL = todos los planes)
    eligible_plans TEXT[], -- ['profesional', 'empresarial']
    
    -- Vigencia
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    
    -- Estado
    is_active BOOLEAN DEFAULT true,
    
    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    -- Validaciones
    CONSTRAINT discount_codes_valid_dates CHECK (valid_until IS NULL OR valid_until > valid_from),
    CONSTRAINT discount_codes_percentage_limit CHECK (
        (discount_type = 'percentage' AND discount_value <= 100) OR 
        discount_type = 'fixed_amount'
    )
);

CREATE INDEX idx_discount_codes_code ON discount_codes(code) WHERE is_active = true;
CREATE INDEX idx_discount_codes_valid_dates ON discount_codes(valid_from, valid_until) WHERE is_active = true;

COMMENT ON TABLE discount_codes IS 'Códigos de descuento para promociones, partners y campañas especiales';
COMMENT ON COLUMN discount_codes.max_uses IS 'NULL = ilimitado, número = máximo de usos permitidos';

-- ============================================================================
-- 6. TABLA: discount_code_uses
-- Registro de uso de códigos de descuento
-- ============================================================================

CREATE TABLE IF NOT EXISTS discount_code_uses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discount_code_id UUID NOT NULL REFERENCES discount_codes(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES business_plans(id) ON DELETE SET NULL,
    
    -- Detalles del descuento aplicado
    discount_amount DECIMAL(10, 2) NOT NULL CHECK (discount_amount >= 0),
    original_amount DECIMAL(10, 2) NOT NULL CHECK (original_amount > 0),
    final_amount DECIMAL(10, 2) NOT NULL CHECK (final_amount >= 0),
    
    -- Auditoría
    used_at TIMESTAMPTZ DEFAULT NOW(),
    used_by UUID REFERENCES users(id),
    
    -- Constraint: un código por negocio (previene abuso)
    CONSTRAINT discount_code_uses_business_code_unique UNIQUE (discount_code_id, business_id)
);

CREATE INDEX idx_discount_code_uses_code_id ON discount_code_uses(discount_code_id);
CREATE INDEX idx_discount_code_uses_business_id ON discount_code_uses(business_id);
CREATE INDEX idx_discount_code_uses_used_at ON discount_code_uses(used_at DESC);

COMMENT ON TABLE discount_code_uses IS 'Registro de uso de códigos de descuento para auditoría y prevención de fraude';

-- ============================================================================
-- 7. ACTUALIZAR TABLA: business_plans
-- Agregar columnas relacionadas con Stripe y billing
-- ============================================================================

-- Verificar si las columnas ya existen antes de agregarlas
DO $$ 
BEGIN
    -- Columnas de Stripe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'business_plans' AND column_name = 'stripe_customer_id') THEN
        ALTER TABLE business_plans ADD COLUMN stripe_customer_id TEXT;
        CREATE INDEX idx_business_plans_stripe_customer ON business_plans(stripe_customer_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'business_plans' AND column_name = 'stripe_subscription_id') THEN
        ALTER TABLE business_plans ADD COLUMN stripe_subscription_id TEXT UNIQUE;
        CREATE INDEX idx_business_plans_stripe_subscription ON business_plans(stripe_subscription_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'business_plans' AND column_name = 'stripe_price_id') THEN
        ALTER TABLE business_plans ADD COLUMN stripe_price_id TEXT;
    END IF;

    -- Billing cycle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'business_plans' AND column_name = 'billing_cycle') THEN
        ALTER TABLE business_plans ADD COLUMN billing_cycle TEXT DEFAULT 'monthly' 
            CHECK (billing_cycle IN ('monthly', 'yearly'));
    END IF;

    -- Auto-renovación
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'business_plans' AND column_name = 'auto_renew') THEN
        ALTER TABLE business_plans ADD COLUMN auto_renew BOOLEAN DEFAULT true;
    END IF;

    -- Código de descuento aplicado
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'business_plans' AND column_name = 'discount_code') THEN
        ALTER TABLE business_plans ADD COLUMN discount_code TEXT;
    END IF;

    -- Trial period
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'business_plans' AND column_name = 'trial_ends_at') THEN
        ALTER TABLE business_plans ADD COLUMN trial_ends_at TIMESTAMPTZ;
    END IF;

    -- Grace period (para pagos fallidos)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'business_plans' AND column_name = 'grace_period_ends_at') THEN
        ALTER TABLE business_plans ADD COLUMN grace_period_ends_at TIMESTAMPTZ;
    END IF;

    -- Fecha de pausa
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'business_plans' AND column_name = 'paused_at') THEN
        ALTER TABLE business_plans ADD COLUMN paused_at TIMESTAMPTZ;
    END IF;

    -- Fecha de cancelación
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'business_plans' AND column_name = 'canceled_at') THEN
        ALTER TABLE business_plans ADD COLUMN canceled_at TIMESTAMPTZ;
    END IF;

    -- Razón de cancelación
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'business_plans' AND column_name = 'cancellation_reason') THEN
        ALTER TABLE business_plans ADD COLUMN cancellation_reason TEXT;
    END IF;

    -- Actualizar constraint de status si no incluye los nuevos estados
    ALTER TABLE business_plans DROP CONSTRAINT IF EXISTS business_plans_status_check;
    ALTER TABLE business_plans ADD CONSTRAINT business_plans_status_check 
        CHECK (status IN ('active', 'inactive', 'expired', 'canceled', 'suspended', 'trialing', 'past_due', 'paused'));

END $$;

COMMENT ON COLUMN business_plans.stripe_customer_id IS 'Customer ID de Stripe (cus_xxxxx)';
COMMENT ON COLUMN business_plans.stripe_subscription_id IS 'Subscription ID de Stripe (sub_xxxxx)';
COMMENT ON COLUMN business_plans.stripe_price_id IS 'Price ID de Stripe (price_xxxxx)';
COMMENT ON COLUMN business_plans.billing_cycle IS 'Ciclo de facturación: monthly o yearly';
COMMENT ON COLUMN business_plans.grace_period_ends_at IS 'Fecha límite del periodo de gracia tras pago fallido';

-- ============================================================================
-- 8. TRIGGERS
-- Actualizar timestamps automáticamente
-- ============================================================================

-- Trigger para payment_methods
CREATE OR REPLACE FUNCTION update_payment_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payment_methods_updated_at
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_methods_updated_at();

-- Trigger para subscription_payments
CREATE OR REPLACE FUNCTION update_subscription_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_subscription_payments_updated_at
    BEFORE UPDATE ON subscription_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_subscription_payments_updated_at();

-- Trigger para discount_codes
CREATE OR REPLACE FUNCTION update_discount_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_discount_codes_updated_at
    BEFORE UPDATE ON discount_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_discount_codes_updated_at();

-- Trigger para asegurar solo un método de pago predeterminado
CREATE OR REPLACE FUNCTION ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = true THEN
        -- Desmarcar otros métodos como predeterminados
        UPDATE payment_methods
        SET is_default = false
        WHERE business_id = NEW.business_id
        AND id != NEW.id
        AND is_default = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_default_payment_method
    BEFORE INSERT OR UPDATE ON payment_methods
    FOR EACH ROW
    WHEN (NEW.is_default = true)
    EXECUTE FUNCTION ensure_single_default_payment_method();

-- Trigger para incrementar contador de usos de códigos de descuento
CREATE OR REPLACE FUNCTION increment_discount_code_uses()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE discount_codes
    SET current_uses = current_uses + 1
    WHERE id = NEW.discount_code_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_discount_code_uses
    AFTER INSERT ON discount_code_uses
    FOR EACH ROW
    EXECUTE FUNCTION increment_discount_code_uses();

-- ============================================================================
-- 9. FUNCIONES AUXILIARES
-- ============================================================================

-- Función para verificar si un código de descuento es válido
CREATE OR REPLACE FUNCTION is_discount_code_valid(
    p_code TEXT,
    p_plan_type TEXT DEFAULT NULL,
    p_amount DECIMAL DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_discount discount_codes%ROWTYPE;
BEGIN
    SELECT * INTO v_discount
    FROM discount_codes
    WHERE code = p_code
    AND is_active = true
    AND (valid_from IS NULL OR valid_from <= NOW())
    AND (valid_until IS NULL OR valid_until >= NOW())
    AND (max_uses IS NULL OR current_uses < max_uses);

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Verificar monto mínimo
    IF v_discount.min_amount IS NOT NULL AND (p_amount IS NULL OR p_amount < v_discount.min_amount) THEN
        RETURN false;
    END IF;

    -- Verificar planes elegibles
    IF v_discount.eligible_plans IS NOT NULL AND p_plan_type IS NOT NULL THEN
        IF NOT (p_plan_type = ANY(v_discount.eligible_plans)) THEN
            RETURN false;
        END IF;
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_discount_code_valid IS 'Valida si un código de descuento es válido y aplicable';

-- ============================================================================
-- FIN DE MIGRACIÓN
-- ============================================================================
