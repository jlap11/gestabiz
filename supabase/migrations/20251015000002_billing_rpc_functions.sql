-- ============================================================================
-- RPC FUNCTIONS - SISTEMA DE BILLING
-- Fecha: 2025-10-15
-- Descripción: Funciones públicas para interactuar con el sistema de billing
-- ============================================================================

-- ============================================================================
-- 1. get_subscription_dashboard
-- Obtiene dashboard completo de suscripción para un negocio
-- ============================================================================

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
BEGIN
    -- Verificar que el usuario tiene acceso al negocio
    IF NOT (auth.is_business_owner(p_business_id) OR auth.is_business_admin(p_business_id)) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Obtener plan actual
    SELECT * INTO v_plan
    FROM business_plans
    WHERE business_id = p_business_id
    AND status IN ('active', 'trialing', 'past_due')
    ORDER BY created_at DESC
    LIMIT 1;

    -- Obtener métricas de uso más recientes
    SELECT * INTO v_usage
    FROM usage_metrics
    WHERE business_id = p_business_id
    ORDER BY metric_date DESC
    LIMIT 1;

    -- Obtener últimos 10 pagos
    SELECT json_agg(row_to_json(p)) INTO v_payments
    FROM (
        SELECT 
            id,
            amount,
            currency,
            status,
            paid_at,
            created_at,
            failure_reason
        FROM subscription_payments
        WHERE business_id = p_business_id
        ORDER BY created_at DESC
        LIMIT 10
    ) p;

    -- Construir resultado
    v_result := json_build_object(
        'plan', row_to_json(v_plan),
        'currentUsage', row_to_json(v_usage),
        'recentPayments', COALESCE(v_payments, '[]'::json),
        'isOverLimit', COALESCE(v_usage.is_over_limit, false),
        'limitWarnings', COALESCE(v_usage.limit_exceeded_resources, ARRAY[]::TEXT[])
    );

    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION get_subscription_dashboard IS 'Obtiene dashboard completo de suscripción para un negocio';

-- ============================================================================
-- 2. validate_plan_limits
-- Valida si un negocio puede crear un nuevo recurso según límites del plan
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_plan_limits(
    p_business_id UUID,
    p_resource TEXT -- 'location', 'employee', 'appointment', 'client', 'service'
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
    v_usage_percentage INTEGER;
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
            'upgradeRequired', true
        );
    END IF;
    
    -- Obtener uso actual
    SELECT * INTO v_usage
    FROM usage_metrics
    WHERE business_id = p_business_id
    ORDER BY metric_date DESC
    LIMIT 1;
    
    -- Si no hay métricas, calcularlas ahora
    IF NOT FOUND THEN
        PERFORM calculate_usage_metrics(p_business_id);
        SELECT * INTO v_usage
        FROM usage_metrics
        WHERE business_id = p_business_id
        ORDER BY metric_date DESC
        LIMIT 1;
    END IF;
    
    v_limits := v_plan.limits;
    
    -- Verificar según el tipo de recurso
    CASE p_resource
        WHEN 'location' THEN
            v_current_count := COALESCE(v_usage.locations_count, 0);
            v_limit := (v_limits->>'max_locations')::INTEGER;
            
        WHEN 'employee' THEN
            v_current_count := COALESCE(v_usage.employees_count, 0);
            v_limit := (v_limits->>'max_employees')::INTEGER;
            
        WHEN 'appointment' THEN
            v_current_count := COALESCE(v_usage.appointments_count, 0);
            v_limit := (v_limits->>'max_appointments_monthly')::INTEGER;
            
        WHEN 'client' THEN
            v_current_count := COALESCE(v_usage.clients_count, 0);
            v_limit := (v_limits->>'max_clients')::INTEGER;
            
        WHEN 'service' THEN
            v_current_count := COALESCE(v_usage.services_count, 0);
            v_limit := (v_limits->>'max_services')::INTEGER;
            
        ELSE
            RETURN json_build_object(
                'allowed', false,
                'reason', 'Invalid resource type'
            );
    END CASE;
    
    -- Si el límite es NULL = ilimitado
    IF v_limit IS NULL THEN
        RETURN json_build_object(
            'allowed', true,
            'unlimited', true,
            'current', v_current_count
        );
    END IF;
    
    -- Calcular porcentaje de uso
    v_usage_percentage := CASE 
        WHEN v_limit > 0 THEN ROUND((v_current_count::DECIMAL / v_limit) * 100)
        ELSE 0
    END;
    
    -- Verificar si puede crear uno más
    IF v_current_count >= v_limit THEN
        v_result := json_build_object(
            'allowed', false,
            'current', v_current_count,
            'limit', v_limit,
            'remaining', 0,
            'percentage', v_usage_percentage,
            'reason', format('Has alcanzado el límite de %s para tu plan %s', p_resource, v_plan.plan_type),
            'upgradeRequired', true,
            'suggestedPlan', CASE 
                WHEN v_plan.plan_type = 'inicio' THEN 'profesional'
                WHEN v_plan.plan_type = 'profesional' THEN 'empresarial'
                WHEN v_plan.plan_type = 'empresarial' THEN 'corporativo'
                ELSE 'corporativo'
            END
        );
    ELSE
        v_result := json_build_object(
            'allowed', true,
            'current', v_current_count,
            'limit', v_limit,
            'remaining', v_limit - v_current_count,
            'percentage', v_usage_percentage
        );
    END IF;
    
    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION validate_plan_limits IS 'Valida si un negocio puede crear un nuevo recurso según límites del plan';

-- ============================================================================
-- 3. calculate_usage_metrics
-- Calcula las métricas de uso para un negocio específico
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_usage_metrics(p_business_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_plan business_plans%ROWTYPE;
    v_limits JSONB;
    v_locations_count INTEGER;
    v_employees_count INTEGER;
    v_appointments_count INTEGER;
    v_clients_count INTEGER;
    v_services_count INTEGER;
    v_storage_mb DECIMAL;
    v_is_over_limit BOOLEAN := false;
    v_exceeded_resources TEXT[] := ARRAY[]::TEXT[];
    v_usage_percentage JSONB := '{}'::jsonb;
    v_metric_id UUID;
BEGIN
    -- Obtener plan actual
    SELECT * INTO v_plan
    FROM business_plans
    WHERE business_id = p_business_id
    AND status = 'active';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No active plan found for business %', p_business_id;
    END IF;
    
    v_limits := v_plan.limits;
    
    -- Contar ubicaciones activas
    SELECT COUNT(*) INTO v_locations_count
    FROM locations
    WHERE business_id = p_business_id
    AND is_active = true;
    
    -- Contar empleados activos
    SELECT COUNT(*) INTO v_employees_count
    FROM users
    WHERE business_id = p_business_id
    AND role IN ('owner', 'admin', 'employee')
    AND is_active = true;
    
    -- Contar citas del mes actual
    SELECT COUNT(*) INTO v_appointments_count
    FROM appointments
    WHERE business_id = p_business_id
    AND start_time >= date_trunc('month', CURRENT_DATE)
    AND start_time < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month';
    
    -- Contar clientes activos
    SELECT COUNT(*) INTO v_clients_count
    FROM clients
    WHERE business_id = p_business_id
    AND status = 'active';
    
    -- Contar servicios activos
    SELECT COUNT(*) INTO v_services_count
    FROM services
    WHERE business_id = p_business_id
    AND is_active = true;
    
    -- TODO: Calcular storage real (simplificado por ahora)
    v_storage_mb := 0;
    
    -- Calcular porcentajes y verificar límites
    DECLARE
        v_location_limit INTEGER := (v_limits->>'max_locations')::INTEGER;
        v_employee_limit INTEGER := (v_limits->>'max_employees')::INTEGER;
        v_appointment_limit INTEGER := (v_limits->>'max_appointments_monthly')::INTEGER;
        v_client_limit INTEGER := (v_limits->>'max_clients')::INTEGER;
        v_service_limit INTEGER := (v_limits->>'max_services')::INTEGER;
    BEGIN
        -- Locations
        IF v_location_limit IS NOT NULL THEN
            v_usage_percentage := v_usage_percentage || 
                jsonb_build_object('locations', ROUND((v_locations_count::DECIMAL / v_location_limit) * 100));
            IF v_locations_count > v_location_limit THEN
                v_is_over_limit := true;
                v_exceeded_resources := array_append(v_exceeded_resources, 'locations');
            END IF;
        END IF;
        
        -- Employees
        IF v_employee_limit IS NOT NULL THEN
            v_usage_percentage := v_usage_percentage || 
                jsonb_build_object('employees', ROUND((v_employees_count::DECIMAL / v_employee_limit) * 100));
            IF v_employees_count > v_employee_limit THEN
                v_is_over_limit := true;
                v_exceeded_resources := array_append(v_exceeded_resources, 'employees');
            END IF;
        END IF;
        
        -- Appointments
        IF v_appointment_limit IS NOT NULL THEN
            v_usage_percentage := v_usage_percentage || 
                jsonb_build_object('appointments', ROUND((v_appointments_count::DECIMAL / v_appointment_limit) * 100));
            IF v_appointments_count > v_appointment_limit THEN
                v_is_over_limit := true;
                v_exceeded_resources := array_append(v_exceeded_resources, 'appointments');
            END IF;
        END IF;
        
        -- Clients
        IF v_client_limit IS NOT NULL THEN
            v_usage_percentage := v_usage_percentage || 
                jsonb_build_object('clients', ROUND((v_clients_count::DECIMAL / v_client_limit) * 100));
            IF v_clients_count > v_client_limit THEN
                v_is_over_limit := true;
                v_exceeded_resources := array_append(v_exceeded_resources, 'clients');
            END IF;
        END IF;
        
        -- Services
        IF v_service_limit IS NOT NULL THEN
            v_usage_percentage := v_usage_percentage || 
                jsonb_build_object('services', ROUND((v_services_count::DECIMAL / v_service_limit) * 100));
            IF v_services_count > v_service_limit THEN
                v_is_over_limit := true;
                v_exceeded_resources := array_append(v_exceeded_resources, 'services');
            END IF;
        END IF;
    END;
    
    -- Insertar o actualizar métricas
    INSERT INTO usage_metrics (
        business_id,
        plan_id,
        metric_date,
        locations_count,
        employees_count,
        appointments_count,
        clients_count,
        services_count,
        storage_mb,
        is_over_limit,
        limit_exceeded_resources,
        usage_percentage,
        calculated_at
    ) VALUES (
        p_business_id,
        v_plan.id,
        CURRENT_DATE,
        v_locations_count,
        v_employees_count,
        v_appointments_count,
        v_clients_count,
        v_services_count,
        v_storage_mb,
        v_is_over_limit,
        v_exceeded_resources,
        v_usage_percentage,
        NOW()
    )
    ON CONFLICT (business_id, metric_date)
    DO UPDATE SET
        locations_count = EXCLUDED.locations_count,
        employees_count = EXCLUDED.employees_count,
        appointments_count = EXCLUDED.appointments_count,
        clients_count = EXCLUDED.clients_count,
        services_count = EXCLUDED.services_count,
        storage_mb = EXCLUDED.storage_mb,
        is_over_limit = EXCLUDED.is_over_limit,
        limit_exceeded_resources = EXCLUDED.limit_exceeded_resources,
        usage_percentage = EXCLUDED.usage_percentage,
        calculated_at = NOW()
    RETURNING id INTO v_metric_id;
    
    -- Retornar resultado
    RETURN json_build_object(
        'success', true,
        'metricId', v_metric_id,
        'isOverLimit', v_is_over_limit,
        'exceededResources', v_exceeded_resources,
        'usage', json_build_object(
            'locations', v_locations_count,
            'employees', v_employees_count,
            'appointments', v_appointments_count,
            'clients', v_clients_count,
            'services', v_services_count
        )
    );
END;
$$;

COMMENT ON FUNCTION calculate_usage_metrics IS 'Calcula y guarda métricas de uso para un negocio';

-- ============================================================================
-- 4. apply_discount_code
-- Aplica un código de descuento y retorna el monto descontado
-- ============================================================================

CREATE OR REPLACE FUNCTION apply_discount_code(
    p_business_id UUID,
    p_code TEXT,
    p_plan_type TEXT,
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
    v_already_used BOOLEAN;
BEGIN
    -- Verificar que el usuario tiene acceso al negocio
    IF NOT (auth.is_business_owner(p_business_id) OR auth.is_business_admin(p_business_id)) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Verificar si el código ya fue usado por este negocio
    SELECT EXISTS (
        SELECT 1 FROM discount_code_uses
        WHERE business_id = p_business_id
        AND discount_code_id IN (
            SELECT id FROM discount_codes WHERE code = p_code
        )
    ) INTO v_already_used;
    
    IF v_already_used THEN
        RETURN json_build_object(
            'valid', false,
            'reason', 'Este código ya fue utilizado por tu negocio'
        );
    END IF;

    -- Obtener y validar código de descuento
    SELECT * INTO v_discount
    FROM discount_codes
    WHERE code = p_code
    AND is_active = true
    AND (valid_from IS NULL OR valid_from <= NOW())
    AND (valid_until IS NULL OR valid_until >= NOW())
    AND (max_uses IS NULL OR current_uses < max_uses);
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'valid', false,
            'reason', 'Código inválido, expirado o agotado'
        );
    END IF;
    
    -- Verificar monto mínimo
    IF v_discount.min_amount IS NOT NULL AND p_amount < v_discount.min_amount THEN
        RETURN json_build_object(
            'valid', false,
            'reason', format('Este código requiere un monto mínimo de $%s', v_discount.min_amount)
        );
    END IF;
    
    -- Verificar planes elegibles
    IF v_discount.eligible_plans IS NOT NULL THEN
        IF NOT (p_plan_type = ANY(v_discount.eligible_plans)) THEN
            RETURN json_build_object(
                'valid', false,
                'reason', 'Este código no es válido para el plan seleccionado'
            );
        END IF;
    END IF;
    
    -- Calcular descuento
    IF v_discount.discount_type = 'percentage' THEN
        v_discount_amount := ROUND(p_amount * (v_discount.discount_value / 100), 2);
    ELSE -- fixed_amount
        v_discount_amount := v_discount.discount_value;
    END IF;
    
    -- Asegurar que el descuento no exceda el monto original
    IF v_discount_amount > p_amount THEN
        v_discount_amount := p_amount;
    END IF;
    
    v_final_amount := p_amount - v_discount_amount;
    
    -- Retornar información del descuento (sin registrar el uso aún)
    RETURN json_build_object(
        'valid', true,
        'discountId', v_discount.id,
        'code', v_discount.code,
        'description', v_discount.description,
        'type', v_discount.discount_type,
        'value', v_discount.discount_value,
        'discountAmount', v_discount_amount,
        'originalAmount', p_amount,
        'finalAmount', v_final_amount,
        'savings', ROUND(((v_discount_amount / p_amount) * 100), 1)
    );
END;
$$;

COMMENT ON FUNCTION apply_discount_code IS 'Valida y calcula descuento de un código promocional';

-- ============================================================================
-- 5. GRANTS (Permisos de ejecución)
-- ============================================================================

-- Permitir que usuarios autenticados ejecuten las funciones
GRANT EXECUTE ON FUNCTION get_subscription_dashboard TO authenticated;
GRANT EXECUTE ON FUNCTION validate_plan_limits TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_usage_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION apply_discount_code TO authenticated;

-- Service role también puede ejecutarlas
GRANT EXECUTE ON FUNCTION get_subscription_dashboard TO service_role;
GRANT EXECUTE ON FUNCTION validate_plan_limits TO service_role;
GRANT EXECUTE ON FUNCTION calculate_usage_metrics TO service_role;
GRANT EXECUTE ON FUNCTION apply_discount_code TO service_role;

-- ============================================================================
-- FIN DE RPC FUNCTIONS
-- ============================================================================
