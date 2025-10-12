# ANÁLISIS PROFUNDO Y NUEVO MODELO DE BASE DE DATOS
## AppointSync Pro - Modelo de Datos Mejorado

---

## 📋 ANÁLISIS DE REQUERIMIENTOS

### ✅ Requerimientos Actuales vs. Nuevos

| Requerimiento | Estado Actual | Necesita Ajuste |
|--------------|---------------|-----------------|
| **Negocio → Múltiples Sedes** | ✅ Implementado (`locations`) | ⚠️ Falta relación sede-servicios |
| **Sede → Servicios específicos** | ❌ No implementado | 🔴 CRÍTICO - Crear tabla `location_services` |
| **Empleado → Sede asignada** | ❌ No implementado | 🔴 CRÍTICO - Agregar `location_id` a `business_employees` |
| **Empleado → Múltiples negocios** | ✅ Implementado (`business_employees`) | ✅ OK |
| **Empleado → Excepciones de sede** | ❌ No implementado | 🟡 MEDIO - Agregar `location_id` opcional a `appointments` |
| **Dueño → Múltiples negocios** | ✅ Implementado (`businesses.owner_id`) | ✅ OK |
| **Cliente → Múltiples citas** | ✅ Implementado (`appointments`) | ✅ OK |
| **Empleado → Servicios específicos** | ❌ No implementado | 🔴 CRÍTICO - Crear tabla `employee_services` |
| **Reviews de clientes** | ❌ No implementado | 🔴 CRÍTICO - Crear tabla `reviews` |
| **Ingresos/Egresos** | ❌ No implementado | 🔴 CRÍTICO - Crear tabla `transactions` |
| **Datos analíticos del negocio** | ⚠️ Vista básica | 🟡 MEDIO - Mejorar vistas y métricas |

---

## 🗄️ NUEVO MODELO DE BASE DE DATOS

### Cambios Estructurales Necesarios:

### 1. **AGREGAR RELACIÓN SEDE-EMPLEADO** (location_id a business_employees)
```sql
-- Empleado tiene una sede asignada por defecto en cada negocio
ALTER TABLE business_employees 
ADD COLUMN location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- Índice para performance
CREATE INDEX idx_business_employees_location_id ON business_employees(location_id);
```

### 2. **NUEVA TABLA: location_services** (Servicios por Sede)
```sql
-- Una sede puede ofrecer solo ciertos servicios del negocio
CREATE TABLE location_services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE NOT NULL,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    UNIQUE(location_id, service_id)
);

CREATE INDEX idx_location_services_location_id ON location_services(location_id);
CREATE INDEX idx_location_services_service_id ON location_services(service_id);
CREATE INDEX idx_location_services_active ON location_services(is_active);
```

### 3. **NUEVA TABLA: employee_services** (Servicios por Empleado)
```sql
-- Un empleado solo puede ofrecer servicios que su sede ofrezca
CREATE TABLE employee_services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE NOT NULL,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE NOT NULL,
    expertise_level INTEGER CHECK (expertise_level BETWEEN 1 AND 5) DEFAULT 3,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    UNIQUE(employee_id, service_id, business_id)
);

CREATE INDEX idx_employee_services_employee_id ON employee_services(employee_id);
CREATE INDEX idx_employee_services_service_id ON employee_services(service_id);
CREATE INDEX idx_employee_services_business_id ON employee_services(business_id);
CREATE INDEX idx_employee_services_location_id ON employee_services(location_id);
```

### 4. **NUEVA TABLA: reviews** (Calificaciones de Clientes)
```sql
CREATE TABLE reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    employee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
    comment TEXT,
    response TEXT, -- Respuesta del negocio
    response_at TIMESTAMPTZ,
    response_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    is_visible BOOLEAN DEFAULT TRUE NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE NOT NULL, -- Cliente verificado que asistió
    UNIQUE(appointment_id) -- Una review por cita
);

CREATE INDEX idx_reviews_business_id ON reviews(business_id);
CREATE INDEX idx_reviews_client_id ON reviews(client_id);
CREATE INDEX idx_reviews_employee_id ON reviews(employee_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_visible ON reviews(is_visible);
CREATE INDEX idx_reviews_created_at ON reviews(created_at);
```

### 5. **NUEVA TABLA: transactions** (Ingresos y Egresos)
```sql
CREATE TYPE transaction_type AS ENUM ('income', 'expense');
CREATE TYPE transaction_category AS ENUM (
    'appointment_payment', 'product_sale', 'tip',  -- Ingresos
    'salary', 'rent', 'utilities', 'supplies', 'maintenance', 'marketing', 'tax', 'other' -- Egresos
);

CREATE TABLE transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    type transaction_type NOT NULL,
    category transaction_category NOT NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    currency TEXT DEFAULT 'MXN' NOT NULL,
    description TEXT,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    employee_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Para salarios o comisiones
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    transaction_date DATE DEFAULT CURRENT_DATE NOT NULL,
    metadata JSONB DEFAULT '{}', -- Info adicional (método de pago, factura, etc.)
    is_verified BOOLEAN DEFAULT FALSE NOT NULL
);

CREATE INDEX idx_transactions_business_id ON transactions(business_id);
CREATE INDEX idx_transactions_location_id ON transactions(location_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_appointment_id ON transactions(appointment_id);
CREATE INDEX idx_transactions_employee_id ON transactions(employee_id);
```

### 6. **MEJORAR TABLA appointments** (Agregar excepción de sede)
```sql
-- Ya existe location_id, pero agregar columnas para tracking
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS is_location_exception BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS original_location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

COMMENT ON COLUMN appointments.is_location_exception IS 'True si el empleado trabaja en una sede diferente a su asignada';
COMMENT ON COLUMN appointments.original_location_id IS 'Sede original del empleado si is_location_exception = true';
```

### 7. **AGREGAR MÉTRICAS A businesses** (Cache de estadísticas)
```sql
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3, 2) DEFAULT 0 NOT NULL CHECK (average_rating BETWEEN 0 AND 5),
ADD COLUMN IF NOT EXISTS total_appointments INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(12, 2) DEFAULT 0 NOT NULL;

-- Índices para ordenamiento
CREATE INDEX idx_businesses_average_rating ON businesses(average_rating DESC);
CREATE INDEX idx_businesses_total_reviews ON businesses(total_reviews DESC);
```

---

## 🔒 NUEVAS POLÍTICAS RLS

### location_services
```sql
-- Owners pueden gestionar servicios por sede
CREATE POLICY "Owners can manage location services" ON location_services
FOR ALL USING (
    auth.uid() IN (
        SELECT owner_id FROM businesses b 
        JOIN locations l ON b.id = l.business_id 
        WHERE l.id = location_services.location_id
    )
);

-- Lectura pública de servicios activos
CREATE POLICY "Public can read active location services" ON location_services
FOR SELECT USING (is_active = true);
```

### employee_services
```sql
-- Owners pueden gestionar servicios de empleados
CREATE POLICY "Owners can manage employee services" ON employee_services
FOR ALL USING (
    auth.uid() IN (
        SELECT owner_id FROM businesses WHERE id = employee_services.business_id
    )
);

-- Empleados pueden ver sus propios servicios
CREATE POLICY "Employees can read own services" ON employee_services
FOR SELECT USING (auth.uid() = employee_id);
```

### reviews
```sql
-- Clientes pueden crear review de su propia cita
CREATE POLICY "Clients can create own review" ON reviews
FOR INSERT WITH CHECK (
    auth.uid() = client_id AND
    auth.uid() IN (SELECT client_id FROM appointments WHERE id = reviews.appointment_id)
);

-- Clientes pueden ver y editar sus reviews
CREATE POLICY "Clients can manage own reviews" ON reviews
FOR ALL USING (auth.uid() = client_id);

-- Owners pueden ver y responder reviews de su negocio
CREATE POLICY "Owners can manage business reviews" ON reviews
FOR ALL USING (
    auth.uid() IN (
        SELECT owner_id FROM businesses WHERE id = reviews.business_id
    )
);

-- Lectura pública de reviews visibles
CREATE POLICY "Public can read visible reviews" ON reviews
FOR SELECT USING (is_visible = true);
```

### transactions
```sql
-- Solo owners y managers pueden ver transacciones
CREATE POLICY "Owners can manage transactions" ON transactions
FOR ALL USING (
    auth.uid() IN (
        SELECT owner_id FROM businesses WHERE id = transactions.business_id
    )
);

-- Managers pueden ver transacciones de su sede
CREATE POLICY "Managers can read location transactions" ON transactions
FOR SELECT USING (
    auth.uid() IN (
        SELECT employee_id FROM business_employees 
        WHERE business_id = transactions.business_id 
        AND role = 'manager' 
        AND status = 'approved'
    )
);
```

---

## 🔧 TRIGGERS Y FUNCIONES NECESARIAS

### 1. Actualizar estadísticas de negocio cuando se crea review
```sql
CREATE OR REPLACE FUNCTION update_business_review_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE businesses
    SET 
        total_reviews = (SELECT COUNT(*) FROM reviews WHERE business_id = NEW.business_id AND is_visible = true),
        average_rating = (SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews WHERE business_id = NEW.business_id AND is_visible = true)
    WHERE id = NEW.business_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_business_review_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_business_review_stats();
```

### 2. Validar que empleado solo ofrezca servicios de su sede
```sql
CREATE OR REPLACE FUNCTION validate_employee_service_location()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar que el servicio esté disponible en la sede del empleado
    IF NOT EXISTS (
        SELECT 1 FROM location_services 
        WHERE location_id = NEW.location_id 
        AND service_id = NEW.service_id 
        AND is_active = true
    ) THEN
        RAISE EXCEPTION 'Service % is not available at location %', NEW.service_id, NEW.location_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_employee_service_location_trigger
BEFORE INSERT OR UPDATE ON employee_services
FOR EACH ROW EXECUTE FUNCTION validate_employee_service_location();
```

### 3. Auto-crear transacción cuando cita se marca como "completed"
```sql
CREATE OR REPLACE FUNCTION create_appointment_transaction()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') AND NEW.price IS NOT NULL THEN
        INSERT INTO transactions (
            business_id, location_id, type, category, amount, currency, 
            description, appointment_id, employee_id, created_by, transaction_date
        ) VALUES (
            NEW.business_id, NEW.location_id, 'income', 'appointment_payment', 
            NEW.price, NEW.currency, 
            'Payment for appointment service', 
            NEW.id, NEW.employee_id, NEW.client_id, CURRENT_DATE
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_appointment_transaction_trigger
AFTER INSERT OR UPDATE ON appointments
FOR EACH ROW EXECUTE FUNCTION create_appointment_transaction();
```

---

## 📊 NUEVAS VISTAS ANALÍTICAS

### Vista de empleados con sus servicios y calificaciones
```sql
CREATE VIEW employee_performance AS
SELECT 
    e.id as employee_id,
    e.full_name as employee_name,
    e.email,
    be.business_id,
    b.name as business_name,
    be.location_id,
    l.name as location_name,
    COUNT(DISTINCT es.service_id) as services_offered,
    COUNT(DISTINCT a.id) as total_appointments,
    COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END) as completed_appointments,
    COALESCE(AVG(r.rating), 0) as average_rating,
    COUNT(DISTINCT r.id) as total_reviews,
    COALESCE(SUM(CASE WHEN a.status = 'completed' THEN a.price END), 0) as total_revenue
FROM profiles e
JOIN business_employees be ON e.id = be.employee_id
JOIN businesses b ON be.business_id = b.id
LEFT JOIN locations l ON be.location_id = l.id
LEFT JOIN employee_services es ON e.id = es.employee_id AND es.business_id = be.business_id
LEFT JOIN appointments a ON e.id = a.employee_id
LEFT JOIN reviews r ON e.id = r.employee_id
WHERE be.status = 'approved' AND be.is_active = true
GROUP BY e.id, e.full_name, e.email, be.business_id, b.name, be.location_id, l.name;
```

### Vista de reporte financiero
```sql
CREATE VIEW financial_report AS
SELECT 
    b.id as business_id,
    b.name as business_name,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount END), 0) as total_income,
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount END), 0) as total_expenses,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount END), 0) - 
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount END), 0) as net_profit,
    COUNT(DISTINCT CASE WHEN t.type = 'income' THEN t.id END) as income_transactions,
    COUNT(DISTINCT CASE WHEN t.type = 'expense' THEN t.id END) as expense_transactions,
    DATE_TRUNC('month', t.transaction_date) as period
FROM businesses b
LEFT JOIN transactions t ON b.id = t.business_id
GROUP BY b.id, b.name, DATE_TRUNC('month', t.transaction_date);
```

---

## 🚀 PLAN DE MIGRACIÓN

1. ✅ Crear nuevos tipos ENUM (transaction_type, transaction_category)
2. ✅ Crear nuevas tablas (location_services, employee_services, reviews, transactions)
3. ✅ Agregar columnas nuevas a tablas existentes
4. ✅ Crear índices para performance
5. ✅ Aplicar políticas RLS
6. ✅ Crear triggers y funciones
7. ✅ Crear vistas analíticas
8. ⚠️ Migrar datos existentes (si es necesario)
9. ⚠️ Actualizar código TypeScript (tipos e interfaces)
10. ⚠️ Actualizar componentes UI

---

## 📝 NOTAS IMPORTANTES

- **Integridad referencial**: Todas las FK tienen `ON DELETE CASCADE` o `SET NULL` según el caso
- **Performance**: Índices en todas las columnas de búsqueda frecuente
- **Seguridad**: RLS en todas las tablas nuevas
- **Auditoría**: `created_at` y `updated_at` en todas las tablas
- **Flexibilidad**: JSONB en `metadata` para datos variables
- **Escalabilidad**: Estructura preparada para múltiples negocios, sedes y empleados
