-- ============================================================================
-- ROW LEVEL SECURITY POLICIES - SISTEMA DE BILLING
-- Fecha: 2025-10-15
-- Descripción: Políticas de seguridad para proteger datos de billing
-- ============================================================================

-- ============================================================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- ============================================================================

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_code_uses ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 1. POLICIES PARA: payment_methods
-- Solo el owner/admin del negocio puede ver/gestionar sus métodos de pago
-- ============================================================================

-- SELECT: Ver métodos de pago propios
CREATE POLICY "Users can view their business payment methods"
    ON payment_methods FOR SELECT
    USING (
        business_id IN (
            SELECT id FROM businesses
            WHERE owner_id = auth.uid()
            OR id IN (
                SELECT business_id FROM users
                WHERE id = auth.uid() AND role IN ('owner', 'admin')
            )
        )
    );

-- INSERT: Agregar métodos de pago (solo owners/admins)
CREATE POLICY "Owners can add payment methods"
    ON payment_methods FOR INSERT
    WITH CHECK (
        business_id IN (
            SELECT id FROM businesses
            WHERE owner_id = auth.uid()
            OR id IN (
                SELECT business_id FROM users
                WHERE id = auth.uid() AND role = 'owner'
            )
        )
    );

-- UPDATE: Actualizar métodos de pago (solo owners/admins)
CREATE POLICY "Owners can update payment methods"
    ON payment_methods FOR UPDATE
    USING (
        business_id IN (
            SELECT id FROM businesses
            WHERE owner_id = auth.uid()
            OR id IN (
                SELECT business_id FROM users
                WHERE id = auth.uid() AND role = 'owner'
            )
        )
    )
    WITH CHECK (
        business_id IN (
            SELECT id FROM businesses
            WHERE owner_id = auth.uid()
            OR id IN (
                SELECT business_id FROM users
                WHERE id = auth.uid() AND role = 'owner'
            )
        )
    );

-- DELETE: Solo marcamos como inactivos (soft delete)
CREATE POLICY "Owners can deactivate payment methods"
    ON payment_methods FOR UPDATE
    USING (
        business_id IN (
            SELECT id FROM businesses
            WHERE owner_id = auth.uid()
        )
        AND is_active = true
    )
    WITH CHECK (
        is_active = false -- Solo permitir marcar como inactivo
    );

-- ============================================================================
-- 2. POLICIES PARA: subscription_payments
-- Solo lectura para owners/admins del negocio
-- Las inserciones/actualizaciones son por Edge Functions (service_role)
-- ============================================================================

-- SELECT: Ver historial de pagos propio
CREATE POLICY "Users can view their business payments"
    ON subscription_payments FOR SELECT
    USING (
        business_id IN (
            SELECT id FROM businesses
            WHERE owner_id = auth.uid()
            OR id IN (
                SELECT business_id FROM users
                WHERE id = auth.uid() AND role IN ('owner', 'admin')
            )
        )
    );

-- INSERT/UPDATE/DELETE: Solo por service_role (Edge Functions)
-- No crear policies para estas operaciones = solo service_role puede ejecutarlas

COMMENT ON TABLE subscription_payments IS 'RLS: Solo lectura para usuarios. Escritura solo por service_role (webhooks/Edge Functions)';

-- ============================================================================
-- 3. POLICIES PARA: subscription_events
-- Solo lectura para owners/admins (audit trail)
-- ============================================================================

-- SELECT: Ver eventos del negocio
CREATE POLICY "Users can view their business subscription events"
    ON subscription_events FOR SELECT
    USING (
        business_id IN (
            SELECT id FROM businesses
            WHERE owner_id = auth.uid()
            OR id IN (
                SELECT business_id FROM users
                WHERE id = auth.uid() AND role IN ('owner', 'admin')
            )
        )
    );

-- INSERT/UPDATE/DELETE: Solo por service_role
COMMENT ON TABLE subscription_events IS 'RLS: Solo lectura para usuarios. Escritura solo por service_role para audit trail';

-- ============================================================================
-- 4. POLICIES PARA: usage_metrics
-- Solo lectura para el negocio
-- ============================================================================

-- SELECT: Ver métricas de uso propias
CREATE POLICY "Users can view their business usage metrics"
    ON usage_metrics FOR SELECT
    USING (
        business_id IN (
            SELECT id FROM businesses
            WHERE owner_id = auth.uid()
            OR id IN (
                SELECT business_id FROM users
                WHERE id = auth.uid() AND role IN ('owner', 'admin', 'employee')
            )
        )
    );

-- INSERT/UPDATE/DELETE: Solo por service_role (cron jobs)
COMMENT ON TABLE usage_metrics IS 'RLS: Solo lectura para usuarios. Cálculo automático por cron jobs (service_role)';

-- ============================================================================
-- 5. POLICIES PARA: discount_codes
-- Lectura pública de códigos activos (para validación en frontend)
-- Gestión solo por admins del sistema
-- ============================================================================

-- SELECT: Todos pueden ver códigos activos y vigentes (para validación)
CREATE POLICY "Anyone can view active discount codes"
    ON discount_codes FOR SELECT
    USING (
        is_active = true
        AND (valid_from IS NULL OR valid_from <= NOW())
        AND (valid_until IS NULL OR valid_until >= NOW())
    );

-- INSERT/UPDATE/DELETE: Solo admins del sistema (service_role o usuarios con rol super_admin)
-- En producción, crear super_admins solo vía SQL directo
COMMENT ON TABLE discount_codes IS 'RLS: Lectura pública de códigos activos. Gestión solo por super_admin (service_role)';

-- ============================================================================
-- 6. POLICIES PARA: discount_code_uses
-- Ver histórico de uso propio
-- ============================================================================

-- SELECT: Ver uso de códigos propios
CREATE POLICY "Users can view their discount code uses"
    ON discount_code_uses FOR SELECT
    USING (
        business_id IN (
            SELECT id FROM businesses
            WHERE owner_id = auth.uid()
            OR id IN (
                SELECT business_id FROM users
                WHERE id = auth.uid() AND role IN ('owner', 'admin')
            )
        )
    );

-- INSERT/UPDATE/DELETE: Solo por service_role (Edge Functions durante checkout)
COMMENT ON TABLE discount_code_uses IS 'RLS: Solo lectura para usuarios. Registro automático durante checkout (service_role)';

-- ============================================================================
-- 7. POLICIES ESPECIALES PARA EDGE FUNCTIONS
-- Service role bypass (no necesita policies)
-- ============================================================================

-- Las Edge Functions usan service_role_key que bypasea RLS automáticamente
-- Pero es importante documentar qué operaciones requieren service_role:

-- OPERACIONES CON SERVICE_ROLE:
-- - Crear/actualizar subscription_payments (webhooks de Stripe)
-- - Crear subscription_events (audit trail)
-- - Calcular usage_metrics (cron jobs)
-- - Registrar discount_code_uses (checkout)
-- - Actualizar business_plans desde webhooks

-- ============================================================================
-- 8. FUNCIONES AUXILIARES PARA RLS
-- ============================================================================

-- Función para verificar si el usuario es owner del negocio
CREATE OR REPLACE FUNCTION auth.is_business_owner(p_business_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM businesses
        WHERE id = p_business_id
        AND owner_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si el usuario es admin del negocio
CREATE OR REPLACE FUNCTION auth.is_business_admin(p_business_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND business_id = p_business_id
        AND role IN ('owner', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION auth.is_business_owner IS 'Verifica si el usuario autenticado es owner del negocio';
COMMENT ON FUNCTION auth.is_business_admin IS 'Verifica si el usuario autenticado es owner o admin del negocio';

-- ============================================================================
-- 9. GRANTS (Permisos de acceso)
-- ============================================================================

-- Usuarios autenticados pueden leer según policies
GRANT SELECT ON payment_methods TO authenticated;
GRANT SELECT ON subscription_payments TO authenticated;
GRANT SELECT ON subscription_events TO authenticated;
GRANT SELECT ON usage_metrics TO authenticated;
GRANT SELECT ON discount_codes TO authenticated;
GRANT SELECT ON discount_code_uses TO authenticated;

-- Usuarios autenticados pueden insertar/actualizar métodos de pago (según policies)
GRANT INSERT, UPDATE ON payment_methods TO authenticated;

-- Service role tiene acceso completo (para Edge Functions)
GRANT ALL ON payment_methods TO service_role;
GRANT ALL ON subscription_payments TO service_role;
GRANT ALL ON subscription_events TO service_role;
GRANT ALL ON usage_metrics TO service_role;
GRANT ALL ON discount_codes TO service_role;
GRANT ALL ON discount_code_uses TO service_role;

-- ============================================================================
-- 10. AUDITORÍA DE SEGURIDAD
-- ============================================================================

-- Crear tabla de auditoría para acciones sensibles
CREATE TABLE IF NOT EXISTS billing_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    business_id UUID REFERENCES businesses(id),
    action TEXT NOT NULL, -- 'add_payment_method', 'cancel_subscription', etc.
    table_name TEXT NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_billing_audit_log_user_id ON billing_audit_log(user_id);
CREATE INDEX idx_billing_audit_log_business_id ON billing_audit_log(business_id);
CREATE INDEX idx_billing_audit_log_created_at ON billing_audit_log(created_at DESC);

-- Habilitar RLS en audit log
ALTER TABLE billing_audit_log ENABLE ROW LEVEL SECURITY;

-- Solo admins del sistema pueden ver el audit log completo
CREATE POLICY "Only service_role can access billing audit log"
    ON billing_audit_log FOR SELECT
    USING (false); -- Nadie excepto service_role

GRANT SELECT ON billing_audit_log TO service_role;
GRANT INSERT ON billing_audit_log TO service_role;

COMMENT ON TABLE billing_audit_log IS 'Audit trail de acciones sensibles en el sistema de billing. Solo accesible por service_role.';

-- ============================================================================
-- FIN DE RLS POLICIES
-- ============================================================================
