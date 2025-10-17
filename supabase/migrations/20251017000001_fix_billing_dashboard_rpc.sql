-- Migración: Fix get_subscription_dashboard RPC para retornar estructura correcta
-- Fecha: 2025-10-17
-- Descripción: Actualiza el RPC para que devuelva el shape esperado por el frontend:
--   {subscription, paymentMethods, recentPayments, upcomingInvoice, usageMetrics}

-- Drop la función existente
DROP FUNCTION IF EXISTS get_subscription_dashboard(UUID);

-- Recrear la función con la estructura correcta
CREATE OR REPLACE FUNCTION get_subscription_dashboard(p_business_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
    v_plan business_plans%ROWTYPE;
    v_usage usage_metrics%ROWTYPE;
    v_payments JSON;
    v_payment_methods JSON;
    v_subscription JSON;
    v_usage_metrics JSON;
BEGIN
    -- Verificar que el usuario tiene acceso al negocio
    IF NOT (
        EXISTS (SELECT 1 FROM businesses WHERE id = p_business_id AND owner_id = auth.uid())
        OR
        EXISTS (SELECT 1 FROM business_employees WHERE business_id = p_business_id AND employee_id = auth.uid() AND role IN ('admin', 'manager'))
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Obtener plan actual
    SELECT * INTO v_plan
    FROM business_plans
    WHERE business_id = p_business_id
    AND status IN ('active', 'trialing', 'past_due', 'paused')
    ORDER BY created_at DESC
    LIMIT 1;

    -- Si no hay plan, retornar null
    IF NOT FOUND THEN
        RETURN json_build_object(
            'subscription', NULL,
            'paymentMethods', '[]'::json,
            'recentPayments', '[]'::json,
            'upcomingInvoice', NULL,
            'usageMetrics', NULL
        );
    END IF;

    -- Construir objeto subscription compatible con el frontend
    v_subscription := json_build_object(
        'id', v_plan.id,
        'businessId', v_plan.business_id,
        'planType', v_plan.plan_type,
        'billingCycle', COALESCE(v_plan.billing_cycle, 'monthly'),
        'status', v_plan.status,
        'currentPeriodStart', v_plan.start_date,
        'currentPeriodEnd', v_plan.end_date,
        'trialEndsAt', v_plan.trial_ends_at,
        'canceledAt', v_plan.canceled_at,
        'cancellationReason', v_plan.cancellation_reason,
        'pausedAt', v_plan.paused_at,
        'amount', v_plan.price,
        'currency', COALESCE(v_plan.currency, 'COP')
    );

    -- Obtener métodos de pago
    SELECT COALESCE(json_agg(json_build_object(
        'id', pm.id,
        'type', pm.type,
        'brand', pm.brand,
        'last4', pm.last4,
        'expMonth', pm.exp_month,
        'expYear', pm.exp_year,
        'isActive', pm.is_default
    )), '[]'::json) INTO v_payment_methods
    FROM payment_methods pm
    WHERE pm.business_id = p_business_id
    AND pm.is_active = true;

    -- Obtener últimos 10 pagos
    SELECT COALESCE(json_agg(json_build_object(
        'id', sp.id,
        'amount', sp.amount,
        'currency', sp.currency,
        'status', sp.status,
        'paidAt', sp.paid_at,
        'failureReason', sp.failure_reason,
        'invoiceUrl', sp.metadata->>'invoice_pdf'
    )), '[]'::json) INTO v_payments
    FROM (
        SELECT * FROM subscription_payments
        WHERE business_id = p_business_id
        ORDER BY created_at DESC
        LIMIT 10
    ) sp;

    -- Obtener métricas de uso más recientes
    SELECT * INTO v_usage
    FROM usage_metrics
    WHERE business_id = p_business_id
    ORDER BY metric_date DESC
    LIMIT 1;

    -- Construir objeto usageMetrics
    IF FOUND THEN
        v_usage_metrics := json_build_object(
            'locations', json_build_object(
                'current', v_usage.locations_count,
                'limit', (v_plan.limits->>'max_locations')::INTEGER
            ),
            'employees', json_build_object(
                'current', v_usage.employees_count,
                'limit', (v_plan.limits->>'max_employees')::INTEGER
            ),
            'appointments', json_build_object(
                'current', v_usage.appointments_count,
                'limit', (v_plan.limits->>'max_appointments_monthly')::INTEGER
            ),
            'clients', json_build_object(
                'current', v_usage.clients_count,
                'limit', (v_plan.limits->>'max_clients')::INTEGER
            ),
            'services', json_build_object(
                'current', v_usage.services_count,
                'limit', (v_plan.limits->>'max_services')::INTEGER
            )
        );
    END IF;

    -- Construir resultado con estructura esperada por el frontend
    v_result := json_build_object(
        'subscription', v_subscription,
        'paymentMethods', v_payment_methods,
        'recentPayments', v_payments,
        'upcomingInvoice', NULL, -- Se calculará en el webhook de Stripe
        'usageMetrics', v_usage_metrics
    );

    RETURN v_result;
END;
$$;

-- Comentario de la función
COMMENT ON FUNCTION get_subscription_dashboard(UUID) IS 
'Retorna el dashboard completo de facturación para un negocio específico. 
Estructura de retorno: {subscription, paymentMethods, recentPayments, upcomingInvoice, usageMetrics}';
