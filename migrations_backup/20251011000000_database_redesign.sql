-- ============================================================================
-- MIGRACIÓN: MODELO DE DATOS MEJORADO
-- Fecha: 2025-10-11
-- Descripción: Implementa servicios por sede, servicios por empleado,
--              reviews, transacciones financieras y analytics
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. CREAR NUEVOS TIPOS ENUM
-- ============================================================================

CREATE TYPE transaction_type AS ENUM ('income', 'expense');

CREATE TYPE transaction_category AS ENUM (
    -- Ingresos
    'appointment_payment',
    'product_sale',
    'tip',
    'membership',
    'package',
    'other_income',
    -- Egresos
    'salary',
    'commission',
    'rent',
    'utilities',
    'supplies',
    'maintenance',
    'marketing',
    'tax',
    'insurance',
    'equipment',
    'training',
    'other_expense'
);

-- ============================================================================
-- 2. ACTUALIZAR TABLA business_employees
-- ============================================================================

-- Agregar sede asignada al empleado
ALTER TABLE business_employees 
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_business_employees_location_id 
ON business_employees(location_id);

-- Comentario explicativo
COMMENT ON COLUMN business_employees.location_id IS 
'Sede principal asignada al empleado en este negocio. NULL significa que puede trabajar en cualquier sede.';

-- ============================================================================
-- 3. CREAR TABLA location_services (Servicios por Sede)
-- ============================================================================

CREATE TABLE IF NOT EXISTS location_services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE NOT NULL,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    notes TEXT,
    CONSTRAINT unique_location_service UNIQUE(location_id, service_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_location_services_location_id ON location_services(location_id);
CREATE INDEX IF NOT EXISTS idx_location_services_service_id ON location_services(service_id);
CREATE INDEX IF NOT EXISTS idx_location_services_active ON location_services(is_active);

-- Trigger para updated_at
CREATE TRIGGER update_location_services_updated_at 
BEFORE UPDATE ON location_services 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON TABLE location_services IS 
'Define qué servicios están disponibles en cada sede. Permite que diferentes sedes ofrezcan diferentes servicios.';

-- ============================================================================
-- 4. CREAR TABLA employee_services (Servicios por Empleado)
-- ============================================================================

CREATE TABLE IF NOT EXISTS employee_services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE NOT NULL,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE NOT NULL,
    expertise_level INTEGER CHECK (expertise_level BETWEEN 1 AND 5) DEFAULT 3,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    commission_percentage DECIMAL(5, 2) CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
    notes TEXT,
    CONSTRAINT unique_employee_service UNIQUE(employee_id, service_id, business_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_employee_services_employee_id ON employee_services(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_services_service_id ON employee_services(service_id);
CREATE INDEX IF NOT EXISTS idx_employee_services_business_id ON employee_services(business_id);
CREATE INDEX IF NOT EXISTS idx_employee_services_location_id ON employee_services(location_id);
CREATE INDEX IF NOT EXISTS idx_employee_services_active ON employee_services(is_active);

-- Trigger para updated_at
CREATE TRIGGER update_employee_services_updated_at 
BEFORE UPDATE ON employee_services 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON TABLE employee_services IS 
'Define qué servicios puede ofrecer cada empleado. Un empleado solo puede ofrecer servicios disponibles en su sede.';
COMMENT ON COLUMN employee_services.expertise_level IS 
'Nivel de experiencia del empleado en este servicio (1=Principiante, 5=Experto)';
COMMENT ON COLUMN employee_services.commission_percentage IS 
'Porcentaje de comisión que recibe el empleado por este servicio';

-- ============================================================================
-- 5. CREAR TABLA reviews (Calificaciones)
-- ============================================================================

CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    employee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
    comment TEXT,
    response TEXT,
    response_at TIMESTAMPTZ,
    response_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    is_visible BOOLEAN DEFAULT TRUE NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    helpful_count INTEGER DEFAULT 0 NOT NULL,
    CONSTRAINT unique_review_per_appointment UNIQUE(appointment_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_reviews_business_id ON reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_reviews_client_id ON reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_reviews_employee_id ON reviews(employee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_visible ON reviews(is_visible);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Trigger para updated_at
CREATE TRIGGER update_reviews_updated_at 
BEFORE UPDATE ON reviews 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON TABLE reviews IS 
'Calificaciones y comentarios de clientes sobre citas completadas';
COMMENT ON COLUMN reviews.is_verified IS 
'TRUE si el cliente asistió a la cita (status = completed)';
COMMENT ON COLUMN reviews.helpful_count IS 
'Cantidad de usuarios que marcaron esta review como útil';

-- ============================================================================
-- 6. CREAR TABLA transactions (Ingresos y Egresos)
-- ============================================================================

CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    type transaction_type NOT NULL,
    category transaction_category NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    currency TEXT DEFAULT 'MXN' NOT NULL,
    description TEXT,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    employee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    transaction_date DATE DEFAULT CURRENT_DATE NOT NULL,
    payment_method TEXT,
    reference_number TEXT,
    metadata JSONB DEFAULT '{}',
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_transactions_business_id ON transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_transactions_location_id ON transactions(location_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_appointment_id ON transactions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_transactions_employee_id ON transactions(employee_id);
CREATE INDEX IF NOT EXISTS idx_transactions_verified ON transactions(is_verified);

-- Trigger para updated_at
CREATE TRIGGER update_transactions_updated_at 
BEFORE UPDATE ON transactions 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON TABLE transactions IS 
'Registro de todos los ingresos y egresos del negocio para análisis financiero';
COMMENT ON COLUMN transactions.type IS 
'Tipo de transacción: income (ingreso) o expense (egreso)';
COMMENT ON COLUMN transactions.payment_method IS 
'Método de pago: cash, card, transfer, etc.';
COMMENT ON COLUMN transactions.metadata IS 
'Información adicional: factura, comprobante, notas internas, etc.';

-- ============================================================================
-- 7. MEJORAR TABLA appointments (Excepciones de Sede)
-- ============================================================================

ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS is_location_exception BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS original_location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- Comentarios
COMMENT ON COLUMN appointments.is_location_exception IS 
'TRUE si el empleado trabaja en una sede diferente a su asignada por defecto';
COMMENT ON COLUMN appointments.original_location_id IS 
'Sede original del empleado si is_location_exception = TRUE';

-- ============================================================================
-- 8. AGREGAR MÉTRICAS CACHE A businesses
-- ============================================================================

ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3, 2) DEFAULT 0 NOT NULL CHECK (average_rating BETWEEN 0 AND 5),
ADD COLUMN IF NOT EXISTS total_appointments INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(12, 2) DEFAULT 0 NOT NULL;

-- Índices para ordenamiento y filtrado
CREATE INDEX IF NOT EXISTS idx_businesses_average_rating ON businesses(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_businesses_total_reviews ON businesses(total_reviews DESC);

-- Comentarios
COMMENT ON COLUMN businesses.total_reviews IS 
'Cache: Total de reviews visibles (actualizado por trigger)';
COMMENT ON COLUMN businesses.average_rating IS 
'Cache: Promedio de calificaciones (actualizado por trigger)';
COMMENT ON COLUMN businesses.total_appointments IS 
'Cache: Total de citas completadas (actualizado por trigger)';
COMMENT ON COLUMN businesses.total_revenue IS 
'Cache: Ingresos totales históricos (actualizado por trigger)';

-- ============================================================================
-- 9. HABILITAR RLS EN NUEVAS TABLAS
-- ============================================================================

ALTER TABLE location_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 10. POLÍTICAS RLS: location_services
-- ============================================================================

CREATE POLICY "Owners can manage location services" ON location_services
FOR ALL USING (
    auth.uid() IN (
        SELECT b.owner_id FROM businesses b 
        JOIN locations l ON b.id = l.business_id 
        WHERE l.id = location_services.location_id
    )
);

CREATE POLICY "Public can read active location services" ON location_services
FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Employees can read business location services" ON location_services
FOR SELECT USING (
    auth.uid() IN (
        SELECT be.employee_id FROM business_employees be
        JOIN locations l ON be.business_id = l.business_id
        WHERE l.id = location_services.location_id
        AND be.status = 'approved'
    )
);

-- ============================================================================
-- 11. POLÍTICAS RLS: employee_services
-- ============================================================================

CREATE POLICY "Owners can manage employee services" ON employee_services
FOR ALL USING (
    auth.uid() IN (
        SELECT owner_id FROM businesses WHERE id = employee_services.business_id
    )
);

CREATE POLICY "Employees can read own services" ON employee_services
FOR SELECT USING (auth.uid() = employee_id);

CREATE POLICY "Managers can read employee services" ON employee_services
FOR SELECT USING (
    auth.uid() IN (
        SELECT employee_id FROM business_employees 
        WHERE business_id = employee_services.business_id 
        AND role = 'manager' 
        AND status = 'approved'
    )
);

CREATE POLICY "Public can read active employee services" ON employee_services
FOR SELECT USING (is_active = TRUE);

-- ============================================================================
-- 12. POLÍTICAS RLS: reviews
-- ============================================================================

CREATE POLICY "Clients can create review for own appointment" ON reviews
FOR INSERT WITH CHECK (
    auth.uid() = client_id AND
    auth.uid() IN (
        SELECT client_id FROM appointments 
        WHERE id = reviews.appointment_id 
        AND status = 'completed'
    )
);

CREATE POLICY "Clients can manage own reviews" ON reviews
FOR ALL USING (auth.uid() = client_id);

CREATE POLICY "Owners can manage business reviews" ON reviews
FOR ALL USING (
    auth.uid() IN (
        SELECT owner_id FROM businesses WHERE id = reviews.business_id
    )
);

CREATE POLICY "Public can read visible reviews" ON reviews
FOR SELECT USING (is_visible = TRUE);

CREATE POLICY "Employees can read reviews about them" ON reviews
FOR SELECT USING (auth.uid() = employee_id);

-- ============================================================================
-- 13. POLÍTICAS RLS: transactions
-- ============================================================================

CREATE POLICY "Owners can manage transactions" ON transactions
FOR ALL USING (
    auth.uid() IN (
        SELECT owner_id FROM businesses WHERE id = transactions.business_id
    )
);

CREATE POLICY "Managers can read location transactions" ON transactions
FOR SELECT USING (
    auth.uid() IN (
        SELECT be.employee_id FROM business_employees be
        WHERE be.business_id = transactions.business_id 
        AND be.role = 'manager' 
        AND be.status = 'approved'
    )
);

-- ============================================================================
-- 14. TRIGGER: Actualizar estadísticas de negocio (reviews)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_business_review_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE businesses
    SET 
        total_reviews = (
            SELECT COUNT(*) FROM reviews 
            WHERE business_id = COALESCE(NEW.business_id, OLD.business_id) 
            AND is_visible = TRUE
        ),
        average_rating = COALESCE((
            SELECT ROUND(AVG(rating)::numeric, 2) 
            FROM reviews 
            WHERE business_id = COALESCE(NEW.business_id, OLD.business_id) 
            AND is_visible = TRUE
        ), 0)
    WHERE id = COALESCE(NEW.business_id, OLD.business_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_business_review_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_business_review_stats();

-- ============================================================================
-- 15. TRIGGER: Validar que servicio esté en sede del empleado
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_employee_service_location()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar que el servicio esté disponible en la sede
    IF NOT EXISTS (
        SELECT 1 FROM location_services 
        WHERE location_id = NEW.location_id 
        AND service_id = NEW.service_id 
        AND is_active = TRUE
    ) THEN
        RAISE EXCEPTION 'Service is not available at this location';
    END IF;
    
    -- Verificar que el empleado esté asignado al negocio y sede
    IF NOT EXISTS (
        SELECT 1 FROM business_employees
        WHERE employee_id = NEW.employee_id
        AND business_id = NEW.business_id
        AND (location_id = NEW.location_id OR location_id IS NULL)
        AND status = 'approved'
        AND is_active = TRUE
    ) THEN
        RAISE EXCEPTION 'Employee is not assigned to this business/location';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_employee_service_location_trigger
BEFORE INSERT OR UPDATE ON employee_services
FOR EACH ROW EXECUTE FUNCTION validate_employee_service_location();

-- ============================================================================
-- 16. TRIGGER: Auto-crear transacción cuando cita se completa
-- ============================================================================

CREATE OR REPLACE FUNCTION create_appointment_transaction()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND 
       (OLD IS NULL OR OLD.status != 'completed') AND 
       NEW.price IS NOT NULL AND 
       NEW.price > 0 THEN
        
        INSERT INTO transactions (
            business_id, location_id, type, category, amount, currency, 
            description, appointment_id, employee_id, created_by, 
            transaction_date, is_verified
        ) VALUES (
            NEW.business_id, 
            NEW.location_id, 
            'income', 
            'appointment_payment', 
            NEW.price, 
            NEW.currency, 
            'Payment for appointment service', 
            NEW.id, 
            NEW.employee_id, 
            NEW.client_id, 
            CURRENT_DATE,
            TRUE  -- Auto-verificada porque viene de cita completada
        );
        
        -- Actualizar total_revenue del negocio
        UPDATE businesses
        SET total_revenue = total_revenue + NEW.price
        WHERE id = NEW.business_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_appointment_transaction_trigger
AFTER INSERT OR UPDATE ON appointments
FOR EACH ROW EXECUTE FUNCTION create_appointment_transaction();

-- ============================================================================
-- 17. TRIGGER: Actualizar contador de citas en businesses
-- ============================================================================

CREATE OR REPLACE FUNCTION update_business_appointment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
        UPDATE businesses
        SET total_appointments = total_appointments + 1
        WHERE id = NEW.business_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_business_appointment_count_trigger
AFTER INSERT OR UPDATE ON appointments
FOR EACH ROW EXECUTE FUNCTION update_business_appointment_count();

-- ============================================================================
-- 18. TRIGGER: Marcar review como verificada si cita fue completada
-- ============================================================================

CREATE OR REPLACE FUNCTION verify_review_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-verificar si la cita fue completada
    NEW.is_verified := EXISTS (
        SELECT 1 FROM appointments 
        WHERE id = NEW.appointment_id 
        AND status = 'completed'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER verify_review_on_insert_trigger
BEFORE INSERT ON reviews
FOR EACH ROW EXECUTE FUNCTION verify_review_on_insert();

-- ============================================================================
-- 19. VISTAS ANALÍTICAS
-- ============================================================================

-- Vista de rendimiento de empleados
CREATE OR REPLACE VIEW employee_performance AS
SELECT 
    e.id as employee_id,
    e.full_name as employee_name,
    e.email,
    e.avatar_url,
    be.business_id,
    b.name as business_name,
    be.location_id,
    l.name as location_name,
    be.role as position,
    COUNT(DISTINCT es.service_id) as services_offered,
    COUNT(DISTINCT a.id) FILTER (WHERE a.status IN ('confirmed', 'completed')) as total_appointments,
    COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'completed') as completed_appointments,
    COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'cancelled') as cancelled_appointments,
    ROUND(
        COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'completed')::numeric / 
        NULLIF(COUNT(DISTINCT a.id) FILTER (WHERE a.status IN ('confirmed', 'completed'))::numeric, 0) * 100, 
        2
    ) as completion_rate,
    COALESCE(ROUND(AVG(r.rating)::numeric, 2), 0) as average_rating,
    COUNT(DISTINCT r.id) as total_reviews,
    COALESCE(SUM(a.price) FILTER (WHERE a.status = 'completed'), 0) as total_revenue,
    COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'expense' AND t.category IN ('salary', 'commission')), 0) as total_paid
FROM profiles e
JOIN business_employees be ON e.id = be.employee_id AND be.status = 'approved' AND be.is_active = TRUE
JOIN businesses b ON be.business_id = b.id
LEFT JOIN locations l ON be.location_id = l.id
LEFT JOIN employee_services es ON e.id = es.employee_id AND es.business_id = be.business_id AND es.is_active = TRUE
LEFT JOIN appointments a ON e.id = a.employee_id AND a.business_id = be.business_id
LEFT JOIN reviews r ON e.id = r.employee_id
LEFT JOIN transactions t ON e.id = t.employee_id AND t.business_id = be.business_id
WHERE e.role = 'employee'
GROUP BY e.id, e.full_name, e.email, e.avatar_url, be.business_id, b.name, be.location_id, l.name, be.role;

-- Vista de reporte financiero por período
CREATE OR REPLACE VIEW financial_summary AS
SELECT 
    b.id as business_id,
    b.name as business_name,
    l.id as location_id,
    l.name as location_name,
    DATE_TRUNC('month', t.transaction_date) as period,
    COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'income'), 0) as total_income,
    COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'expense'), 0) as total_expenses,
    COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'income'), 0) - 
    COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'expense'), 0) as net_profit,
    COUNT(DISTINCT t.id) FILTER (WHERE t.type = 'income') as income_transactions,
    COUNT(DISTINCT t.id) FILTER (WHERE t.type = 'expense') as expense_transactions,
    COUNT(DISTINCT t.appointment_id) as appointment_count
FROM businesses b
LEFT JOIN locations l ON b.id = l.business_id
LEFT JOIN transactions t ON b.id = t.business_id AND (t.location_id = l.id OR t.location_id IS NULL)
GROUP BY b.id, b.name, l.id, l.name, DATE_TRUNC('month', t.transaction_date);

-- Vista de servicios por sede con disponibilidad
CREATE OR REPLACE VIEW location_services_availability AS
SELECT 
    l.id as location_id,
    l.name as location_name,
    l.business_id,
    b.name as business_name,
    s.id as service_id,
    s.name as service_name,
    s.duration_minutes,
    s.price,
    s.category,
    ls.is_active as available_at_location,
    COUNT(DISTINCT es.employee_id) as employees_offering,
    COALESCE(AVG(r.rating), 0) as average_rating,
    COUNT(DISTINCT r.id) as total_reviews
FROM locations l
JOIN businesses b ON l.business_id = b.id
CROSS JOIN services s
LEFT JOIN location_services ls ON l.id = ls.location_id AND s.id = ls.service_id
LEFT JOIN employee_services es ON l.id = es.location_id AND s.id = es.service_id AND es.is_active = TRUE
LEFT JOIN appointments a ON s.id = a.service_id AND l.id = a.location_id AND a.status = 'completed'
LEFT JOIN reviews r ON a.id = r.appointment_id
WHERE s.business_id = l.business_id AND s.is_active = TRUE AND l.is_active = TRUE
GROUP BY l.id, l.name, l.business_id, b.name, s.id, s.name, s.duration_minutes, s.price, s.category, ls.is_active;

-- ============================================================================
-- 20. COMENTARIOS Y DOCUMENTACIÓN
-- ============================================================================

COMMENT ON VIEW employee_performance IS 
'Métricas de rendimiento de empleados: citas, calificaciones, ingresos generados';

COMMENT ON VIEW financial_summary IS 
'Resumen financiero mensual por negocio y sede: ingresos, gastos, utilidad neta';

COMMENT ON VIEW location_services_availability IS 
'Disponibilidad de servicios por sede con cantidad de empleados que los ofrecen';

COMMIT;

-- ============================================================================
-- FIN DE MIGRACIÓN
-- ============================================================================
