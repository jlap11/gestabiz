-- ============================================================================
-- SEED DATA - SISTEMA DE BILLING
-- Fecha: 2025-10-15
-- Descripción: Datos iniciales para testing y desarrollo
-- ============================================================================

-- ============================================================================
-- 1. CÓDIGOS DE DESCUENTO INICIALES
-- ============================================================================

-- Código de lanzamiento (20% descuento)
INSERT INTO discount_codes (
    code,
    description,
    discount_type,
    discount_value,
    max_uses,
    eligible_plans,
    valid_from,
    valid_until,
    is_active
) VALUES (
    'LAUNCH2025',
    'Descuento de lanzamiento - 20% en tu primer mes',
    'percentage',
    20,
    1000, -- Primeros 1000 clientes
    ARRAY['inicio', 'profesional', 'empresarial'],
    '2025-10-15 00:00:00',
    '2025-12-31 23:59:59',
    true
) ON CONFLICT (code) DO NOTHING;

-- Código para partners (30% descuento)
INSERT INTO discount_codes (
    code,
    description,
    discount_type,
    discount_value,
    max_uses,
    eligible_plans,
    valid_from,
    valid_until,
    is_active
) VALUES (
    'PARTNER30',
    'Descuento especial para partners - 30% de descuento',
    'percentage',
    30,
    50,
    ARRAY['profesional', 'empresarial', 'corporativo'],
    '2025-10-15 00:00:00',
    NULL, -- Sin fecha de expiración
    true
) ON CONFLICT (code) DO NOTHING;

-- Código de prueba gratuita extendida
INSERT INTO discount_codes (
    code,
    description,
    discount_type,
    discount_value,
    max_uses,
    min_amount,
    eligible_plans,
    valid_from,
    valid_until,
    is_active
) VALUES (
    'TRIAL60',
    'Prueba extendida - $60.000 COP de descuento',
    'fixed_amount',
    60000,
    NULL, -- Ilimitado
    79900, -- Mínimo plan profesional
    ARRAY['profesional', 'empresarial'],
    '2025-10-15 00:00:00',
    '2025-11-30 23:59:59',
    true
) ON CONFLICT (code) DO NOTHING;

-- Código para Black Friday (50% descuento)
INSERT INTO discount_codes (
    code,
    description,
    discount_type,
    discount_value,
    max_uses,
    eligible_plans,
    valid_from,
    valid_until,
    is_active
) VALUES (
    'BLACKFRIDAY2025',
    'Black Friday 2025 - 50% de descuento',
    'percentage',
    50,
    500,
    ARRAY['inicio', 'profesional', 'empresarial'],
    '2025-11-29 00:00:00',
    '2025-11-30 23:59:59',
    false -- Activar cuando llegue la fecha
) ON CONFLICT (code) DO NOTHING;

-- Código de referido (15% descuento)
INSERT INTO discount_codes (
    code,
    description,
    discount_type,
    discount_value,
    max_uses,
    eligible_plans,
    valid_from,
    valid_until,
    is_active
) VALUES (
    'REFERIDO15',
    'Descuento por referido - 15% en tu primer mes',
    'percentage',
    15,
    NULL, -- Ilimitado
    ARRAY['inicio', 'profesional', 'empresarial', 'corporativo'],
    '2025-10-15 00:00:00',
    NULL,
    true
) ON CONFLICT (code) DO NOTHING;

-- Código de prueba para desarrollo (100% descuento)
INSERT INTO discount_codes (
    code,
    description,
    discount_type,
    discount_value,
    max_uses,
    eligible_plans,
    valid_from,
    valid_until,
    is_active
) VALUES (
    'DEVTEST',
    'Código de testing - 100% descuento (SOLO DESARROLLO)',
    'percentage',
    100,
    NULL,
    ARRAY['inicio', 'profesional', 'empresarial', 'corporativo'],
    '2025-10-15 00:00:00',
    NULL,
    true
) ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 2. ACTUALIZAR PLANES EXISTENTES CON LÍMITES
-- (Asumiendo que ya existen registros en business_plans)
-- ============================================================================

-- Si la tabla business_plans tiene una columna 'limits' de tipo JSONB,
-- actualizar los límites para cada tipo de plan

-- Plan Inicio
DO $$
BEGIN
    -- Solo actualizar si la columna limits existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'business_plans' 
        AND column_name = 'limits'
    ) THEN
        UPDATE business_plans
        SET limits = jsonb_build_object(
            'max_locations', 1,
            'max_employees', 3,
            'max_services', 10,
            'max_clients', 100,
            'max_appointments_monthly', 200,
            'max_storage_mb', 1024,
            'features', jsonb_build_array(
                'Calendario básico',
                'Gestión de citas',
                'Base de datos de clientes',
                'Notificaciones por email',
                'Soporte por email'
            )
        )
        WHERE plan_type = 'inicio'
        AND limits IS NULL;
    END IF;
END $$;

-- Plan Profesional
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'business_plans' 
        AND column_name = 'limits'
    ) THEN
        UPDATE business_plans
        SET limits = jsonb_build_object(
            'max_locations', 3,
            'max_employees', 10,
            'max_services', 50,
            'max_clients', 1000,
            'max_appointments_monthly', 1000,
            'max_storage_mb', 5120,
            'features', jsonb_build_array(
                'Todo del plan Inicio',
                'Múltiples ubicaciones (hasta 3)',
                'Recordatorios SMS',
                'Reportes avanzados',
                'Integración con Google Calendar',
                'API access',
                'Soporte prioritario'
            )
        )
        WHERE plan_type = 'profesional'
        AND limits IS NULL;
    END IF;
END $$;

-- Plan Empresarial
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'business_plans' 
        AND column_name = 'limits'
    ) THEN
        UPDATE business_plans
        SET limits = jsonb_build_object(
            'max_locations', 10,
            'max_employees', 50,
            'max_services', NULL, -- Ilimitado
            'max_clients', NULL, -- Ilimitado
            'max_appointments_monthly', 5000,
            'max_storage_mb', 20480,
            'features', jsonb_build_array(
                'Todo del plan Profesional',
                'Múltiples ubicaciones (hasta 10)',
                'Empleados ilimitados',
                'Servicios ilimitados',
                'Clientes ilimitados',
                'Marca blanca',
                'Reportes personalizados',
                'Integraciones avanzadas',
                'Manager de cuenta dedicado'
            )
        )
        WHERE plan_type = 'empresarial'
        AND limits IS NULL;
    END IF;
END $$;

-- Plan Corporativo
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'business_plans' 
        AND column_name = 'limits'
    ) THEN
        UPDATE business_plans
        SET limits = jsonb_build_object(
            'max_locations', NULL, -- Ilimitado
            'max_employees', NULL, -- Ilimitado
            'max_services', NULL, -- Ilimitado
            'max_clients', NULL, -- Ilimitado
            'max_appointments_monthly', NULL, -- Ilimitado
            'max_storage_mb', NULL, -- Ilimitado
            'features', jsonb_build_array(
                'Todo del plan Empresarial',
                'Todo ilimitado',
                'Infraestructura dedicada',
                'SLA 99.9%',
                'Onboarding personalizado',
                'Soporte 24/7',
                'Desarrollo de features custom',
                'Consultoría estratégica'
            )
        )
        WHERE plan_type = 'corporativo'
        AND limits IS NULL;
    END IF;
END $$;

-- ============================================================================
-- 3. DATOS DE EJEMPLO PARA DESARROLLO
-- (Solo ejecutar en ambiente de desarrollo)
-- ============================================================================

-- Verificar si estamos en desarrollo
DO $$
DECLARE
    v_is_dev BOOLEAN;
BEGIN
    -- Determinar si es ambiente de desarrollo
    -- (puedes ajustar esta lógica según tu configuración)
    v_is_dev := current_database() LIKE '%local%' OR current_database() LIKE '%dev%';
    
    IF v_is_dev THEN
        RAISE NOTICE 'Ejecutando seed data de desarrollo...';
        
        -- Crear un negocio de prueba si no existe
        INSERT INTO businesses (
            id,
            name,
            slug,
            owner_id,
            email,
            phone,
            category,
            created_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000001',
            'Negocio de Prueba - Billing',
            'negocio-prueba-billing',
            auth.uid(), -- Usar el usuario actual
            'test@appointsync.com',
            '+573001234567',
            'salon',
            NOW()
        ) ON CONFLICT (id) DO NOTHING;
        
        -- Crear un plan de prueba activo
        INSERT INTO business_plans (
            id,
            business_id,
            plan_type,
            price,
            currency,
            billing_cycle,
            status,
            start_date,
            end_date,
            limits
        ) VALUES (
            '00000000-0000-0000-0000-000000000002',
            '00000000-0000-0000-0000-000000000001',
            'profesional',
            79900,
            'COP',
            'monthly',
            'active',
            CURRENT_DATE,
            CURRENT_DATE + INTERVAL '30 days',
            jsonb_build_object(
                'max_locations', 3,
                'max_employees', 10,
                'max_services', 50,
                'max_clients', 1000,
                'max_appointments_monthly', 1000
            )
        ) ON CONFLICT (id) DO NOTHING;
        
        -- Crear métricas de uso de ejemplo
        INSERT INTO usage_metrics (
            business_id,
            plan_id,
            metric_date,
            locations_count,
            employees_count,
            appointments_count,
            clients_count,
            services_count,
            is_over_limit,
            usage_percentage
        ) VALUES (
            '00000000-0000-0000-0000-000000000001',
            '00000000-0000-0000-0000-000000000002',
            CURRENT_DATE,
            2, -- 2 de 3 ubicaciones
            8, -- 8 de 10 empleados
            750, -- 750 de 1000 citas
            450, -- 450 de 1000 clientes
            35, -- 35 de 50 servicios
            false,
            jsonb_build_object(
                'locations', 67,
                'employees', 80,
                'appointments', 75,
                'clients', 45,
                'services', 70
            )
        ) ON CONFLICT (business_id, metric_date) DO NOTHING;
        
        RAISE NOTICE 'Seed data de desarrollo creado exitosamente';
    ELSE
        RAISE NOTICE 'Ambiente de producción detectado, omitiendo datos de ejemplo';
    END IF;
END $$;

-- ============================================================================
-- 4. FUNCIONES AUXILIARES PARA SEED DATA
-- ============================================================================

-- Función para resetear datos de prueba (solo desarrollo)
CREATE OR REPLACE FUNCTION reset_billing_test_data()
RETURNS void AS $$
BEGIN
    -- Verificar que estamos en desarrollo
    IF current_database() NOT LIKE '%local%' AND current_database() NOT LIKE '%dev%' THEN
        RAISE EXCEPTION 'Esta función solo puede ejecutarse en ambiente de desarrollo';
    END IF;
    
    -- Eliminar datos de prueba
    DELETE FROM discount_code_uses WHERE business_id = '00000000-0000-0000-0000-000000000001';
    DELETE FROM subscription_events WHERE business_id = '00000000-0000-0000-0000-000000000001';
    DELETE FROM subscription_payments WHERE business_id = '00000000-0000-0000-0000-000000000001';
    DELETE FROM usage_metrics WHERE business_id = '00000000-0000-0000-0000-000000000001';
    DELETE FROM payment_methods WHERE business_id = '00000000-0000-0000-0000-000000000001';
    DELETE FROM business_plans WHERE id = '00000000-0000-0000-0000-000000000002';
    
    RAISE NOTICE 'Datos de prueba eliminados exitosamente';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION reset_billing_test_data IS 'Elimina todos los datos de prueba de billing (solo desarrollo)';

-- ============================================================================
-- 5. VERIFICACIÓN DE SEED DATA
-- ============================================================================

-- Verificar que los códigos de descuento se crearon correctamente
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM discount_codes WHERE is_active = true;
    RAISE NOTICE 'Códigos de descuento activos: %', v_count;
END $$;

-- ============================================================================
-- FIN DE SEED DATA
-- ============================================================================
