-- ============================================================================
-- SISTEMA FISCAL Y CONTABLE - COLOMBIA
-- Fecha: 2025-10-13
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. TIPOS ENUM FISCALES
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE tax_regime AS ENUM ('simple', 'common', 'special');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tax_type AS ENUM ('iva_0', 'iva_5', 'iva_19', 'ica', 'retention', 'none');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE invoice_status AS ENUM ('draft', 'issued', 'paid', 'overdue', 'cancelled', 'credit_note');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 2. TABLA: tax_configurations
-- ============================================================================

CREATE TABLE IF NOT EXISTS tax_configurations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL UNIQUE,
    
    -- Configuración tributaria
    tax_regime tax_regime DEFAULT 'common' NOT NULL,
    is_iva_responsible BOOLEAN DEFAULT TRUE NOT NULL,
    is_ica_responsible BOOLEAN DEFAULT FALSE NOT NULL,
    is_retention_agent BOOLEAN DEFAULT FALSE NOT NULL,
    
    -- Identificación fiscal
    dian_code VARCHAR(50),
    activity_code VARCHAR(10),
    
    -- Tasas de impuestos
    default_iva_rate DECIMAL(5,2) DEFAULT 19.00 CHECK (default_iva_rate >= 0 AND default_iva_rate <= 100),
    ica_rate DECIMAL(5,4) DEFAULT 0.00 CHECK (ica_rate >= 0 AND ica_rate <= 100),
    retention_rate DECIMAL(5,2) DEFAULT 0.00 CHECK (retention_rate >= 0 AND retention_rate <= 100),
    
    -- Configuración contable
    accountant_name VARCHAR(255),
    accountant_email VARCHAR(255),
    accountant_phone VARCHAR(20),
    accountant_license VARCHAR(50),
    
    -- Configuración de facturación
    invoice_prefix VARCHAR(10) DEFAULT 'F',
    invoice_next_number INTEGER DEFAULT 1,
    invoice_resolution_number VARCHAR(50),
    invoice_resolution_date DATE,
    invoice_resolution_valid_until DATE,
    
    -- Metadata adicional
    settings JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_tax_configurations_business ON tax_configurations(business_id);

COMMENT ON TABLE tax_configurations IS 'Configuración fiscal y tributaria por negocio para Colombia';

-- ============================================================================
-- 3. TABLA: invoices
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    
    -- Numeración fiscal
    invoice_number VARCHAR(50) NOT NULL,
    invoice_prefix VARCHAR(10),
    invoice_sequence INTEGER NOT NULL,
    
    -- Estado y fechas
    status invoice_status DEFAULT 'draft' NOT NULL,
    issue_date DATE DEFAULT CURRENT_DATE NOT NULL,
    due_date DATE,
    paid_date DATE,
    
    -- Cliente
    client_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    client_name VARCHAR(255) NOT NULL,
    client_tax_id VARCHAR(50),
    client_address TEXT,
    client_email VARCHAR(255),
    client_phone VARCHAR(20),
    
    -- Montos
    subtotal DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0),
    discount DECIMAL(12,2) DEFAULT 0 CHECK (discount >= 0),
    tax_amount DECIMAL(12,2) DEFAULT 0 CHECK (tax_amount >= 0),
    total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount >= 0),
    currency VARCHAR(3) DEFAULT 'COP' NOT NULL,
    
    -- Impuestos desglosados
    iva_amount DECIMAL(12,2) DEFAULT 0,
    ica_amount DECIMAL(12,2) DEFAULT 0,
    retention_amount DECIMAL(12,2) DEFAULT 0,
    
    -- Referencias
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    
    -- Notas
    notes TEXT,
    terms TEXT,
    
    -- Facturación electrónica (futuro)
    cufe VARCHAR(100),
    qr_code TEXT,
    xml_url TEXT,
    pdf_url TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    CONSTRAINT unique_invoice_number UNIQUE(business_id, invoice_number)
);

CREATE INDEX IF NOT EXISTS idx_invoices_business ON invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);

-- ============================================================================
-- 4. TABLA: invoice_items
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
    
    -- Descripción del ítem
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1 NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(12,2) NOT NULL CHECK (unit_price >= 0),
    
    -- Impuestos por ítem
    tax_type tax_type DEFAULT 'iva_19',
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    
    -- Totales
    subtotal DECIMAL(12,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    
    -- Referencias
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    
    -- Orden
    sort_order INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

-- ============================================================================
-- 5. TABLA: tax_liabilities (Obligaciones Fiscales)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tax_liabilities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    
    -- Tipo de obligación
    liability_type VARCHAR(50) NOT NULL,
    period VARCHAR(7) NOT NULL,
    
    -- Fechas
    due_date DATE NOT NULL,
    filed_date DATE,
    
    -- Montos
    calculated_amount DECIMAL(12,2) DEFAULT 0,
    filed_amount DECIMAL(12,2),
    paid_amount DECIMAL(12,2) DEFAULT 0,
    
    -- Estado
    status VARCHAR(20) DEFAULT 'pending',
    
    -- Referencias
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_tax_liabilities_business ON tax_liabilities(business_id);
CREATE INDEX IF NOT EXISTS idx_tax_liabilities_due_date ON tax_liabilities(due_date);
CREATE INDEX IF NOT EXISTS idx_tax_liabilities_period ON tax_liabilities(period);
CREATE INDEX IF NOT EXISTS idx_tax_liabilities_status ON tax_liabilities(status);

-- ============================================================================
-- 6. EXTENDER TABLA businesses
-- ============================================================================

ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS tax_regime tax_regime DEFAULT 'common',
ADD COLUMN IF NOT EXISTS fiscal_responsibilities JSONB DEFAULT '{"iva": true, "ica": false, "retention": false}';

-- ============================================================================
-- 7. EXTENDER TABLA locations
-- ============================================================================

ALTER TABLE locations
ADD COLUMN IF NOT EXISTS dane_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS ica_rate DECIMAL(5,4) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS ica_enabled BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN locations.dane_code IS 'Código DANE del departamento-municipio para cálculo de ICA';

-- ============================================================================
-- 8. EXTENDER TABLA transactions
-- ============================================================================

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS tax_type tax_type DEFAULT 'none',
ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS is_tax_deductible BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS fiscal_period VARCHAR(7);

CREATE INDEX IF NOT EXISTS idx_transactions_fiscal_period ON transactions(fiscal_period);
CREATE INDEX IF NOT EXISTS idx_transactions_tax_type ON transactions(tax_type);
CREATE INDEX IF NOT EXISTS idx_transactions_invoice ON transactions(invoice_id);

COMMENT ON COLUMN transactions.subtotal IS 'Valor antes de aplicar impuestos';
COMMENT ON COLUMN transactions.total_amount IS 'Valor total incluyendo impuestos (subtotal + tax_amount)';
COMMENT ON COLUMN transactions.fiscal_period IS 'Período fiscal en formato YYYY-MM para agrupación';

-- ============================================================================
-- 9. EXTENDER TABLA services
-- ============================================================================

ALTER TABLE services
ADD COLUMN IF NOT EXISTS tax_type tax_type DEFAULT 'iva_19',
ADD COLUMN IF NOT EXISTS product_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS is_taxable BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN services.tax_type IS 'Tipo de impuesto aplicable a este servicio';
COMMENT ON COLUMN services.product_code IS 'Código de producto/servicio según clasificación DIAN';

-- ============================================================================
-- 10. EXTENDER TABLA business_employees
-- ============================================================================

ALTER TABLE business_employees
ADD COLUMN IF NOT EXISTS salary_base DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS salary_type VARCHAR(20) DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS social_security_contribution DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS health_contribution DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS pension_contribution DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS contract_type VARCHAR(50) DEFAULT 'indefinido';

COMMENT ON COLUMN business_employees.salary_type IS 'Tipo de salario: monthly, hourly, commission_only';
COMMENT ON COLUMN business_employees.contract_type IS 'Tipo de contrato: indefinido, fijo, prestacion_servicios';

-- ============================================================================
-- 11. TRIGGER: Auto-calcular período fiscal
-- ============================================================================

CREATE OR REPLACE FUNCTION set_fiscal_period()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fiscal_period := TO_CHAR(NEW.transaction_date, 'YYYY-MM');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_fiscal_period_trigger ON transactions;
CREATE TRIGGER set_fiscal_period_trigger
BEFORE INSERT OR UPDATE ON transactions
FOR EACH ROW EXECUTE FUNCTION set_fiscal_period();

-- ============================================================================
-- 12. TRIGGER: Auto-generar número de factura
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
    config RECORD;
BEGIN
    IF NEW.status = 'issued' AND NEW.invoice_number IS NULL THEN
        SELECT * INTO config FROM tax_configurations WHERE business_id = NEW.business_id;
        
        IF config IS NOT NULL THEN
            NEW.invoice_prefix := config.invoice_prefix;
            NEW.invoice_sequence := config.invoice_next_number;
            NEW.invoice_number := config.invoice_prefix || LPAD(config.invoice_next_number::TEXT, 6, '0');
            
            -- Incrementar contador
            UPDATE tax_configurations 
            SET invoice_next_number = invoice_next_number + 1 
            WHERE business_id = NEW.business_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS generate_invoice_number_trigger ON invoices;
CREATE TRIGGER generate_invoice_number_trigger
BEFORE INSERT OR UPDATE ON invoices
FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();

-- ============================================================================
-- 13. TRIGGER: Actualizar updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tax_configurations_updated_at ON tax_configurations;
CREATE TRIGGER update_tax_configurations_updated_at
BEFORE UPDATE ON tax_configurations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON invoices
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tax_liabilities_updated_at ON tax_liabilities;
CREATE TRIGGER update_tax_liabilities_updated_at
BEFORE UPDATE ON tax_liabilities
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 14. VISTA: Reporte de impuestos por período
-- ============================================================================

CREATE OR REPLACE VIEW tax_report_by_period AS
SELECT 
    t.business_id,
    b.name as business_name,
    t.fiscal_period,
    t.tax_type,
    COUNT(*) as transaction_count,
    SUM(COALESCE(t.subtotal, t.amount)) as total_subtotal,
    SUM(t.tax_amount) as total_tax_amount,
    SUM(COALESCE(t.total_amount, t.amount)) as total_amount,
    AVG(t.tax_rate) as average_tax_rate
FROM transactions t
JOIN businesses b ON t.business_id = b.id
WHERE t.tax_type IS NOT NULL AND t.tax_type != 'none'
GROUP BY t.business_id, b.name, t.fiscal_period, t.tax_type
ORDER BY t.fiscal_period DESC, t.business_id;

COMMENT ON VIEW tax_report_by_period IS 'Reporte de impuestos agrupado por período fiscal y tipo de impuesto';

-- ============================================================================
-- 15. VISTA: Estado de obligaciones fiscales
-- ============================================================================

CREATE OR REPLACE VIEW fiscal_obligations_status AS
SELECT 
    tl.business_id,
    b.name as business_name,
    tl.liability_type,
    tl.period,
    tl.due_date,
    tl.calculated_amount,
    tl.paid_amount,
    tl.status,
    CASE 
        WHEN tl.due_date < CURRENT_DATE AND tl.status != 'paid' THEN TRUE
        ELSE FALSE
    END as is_overdue,
    CASE 
        WHEN tl.due_date < CURRENT_DATE AND tl.status != 'paid' 
        THEN CURRENT_DATE - tl.due_date
        ELSE 0
    END as days_overdue
FROM tax_liabilities tl
JOIN businesses b ON tl.business_id = b.id
ORDER BY tl.due_date DESC;

-- ============================================================================
-- 16. RLS POLICIES
-- ============================================================================

-- tax_configurations
ALTER TABLE tax_configurations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can manage tax configurations" ON tax_configurations;
CREATE POLICY "Owners can manage tax configurations" ON tax_configurations
FOR ALL USING (
    auth.uid() IN (SELECT owner_id FROM businesses WHERE id = tax_configurations.business_id)
);

-- invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can manage invoices" ON invoices;
CREATE POLICY "Owners can manage invoices" ON invoices
FOR ALL USING (
    auth.uid() IN (SELECT owner_id FROM businesses WHERE id = invoices.business_id)
);

DROP POLICY IF EXISTS "Clients can read own invoices" ON invoices;
CREATE POLICY "Clients can read own invoices" ON invoices
FOR SELECT USING (auth.uid() = client_id);

-- invoice_items
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Items inherit invoice policy" ON invoice_items;
CREATE POLICY "Items inherit invoice policy" ON invoice_items
FOR ALL USING (
    auth.uid() IN (
        SELECT b.owner_id FROM invoices i
        JOIN businesses b ON i.business_id = b.id
        WHERE i.id = invoice_items.invoice_id
    )
);

-- tax_liabilities
ALTER TABLE tax_liabilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can manage tax liabilities" ON tax_liabilities;
CREATE POLICY "Owners can manage tax liabilities" ON tax_liabilities
FOR ALL USING (
    auth.uid() IN (SELECT owner_id FROM businesses WHERE id = tax_liabilities.business_id)
);

COMMIT;

-- ============================================================================
-- FIN DE MIGRACIÓN FISCAL
-- ============================================================================
