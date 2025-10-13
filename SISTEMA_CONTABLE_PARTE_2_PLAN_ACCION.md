# SISTEMA CONTABLE Y FINANCIERO - PARTE 2: PLAN DE ACCIÓN
**Fecha**: 13 de octubre de 2025  
**Objetivo**: Roadmap completo para implementar sistema contable profesional

---

## 🗺️ PLAN DE IMPLEMENTACIÓN EN FASES

### ESTRATEGIA GENERAL
- **Enfoque**: Iterativo e incremental
- **Prioridad**: Funcionalidad core primero, luego optimizaciones
- **Validación**: Revisión contable profesional en Fase 3
- **Testing**: Pruebas exhaustivas con datos reales de Colombia

---

## 📋 FASE 0: PREPARACIÓN Y DEPENDENCIAS (1-2 horas)

### Objetivos
- Instalar librerías necesarias
- Configurar herramientas de gráficos
- Preparar estructura de archivos

### Tareas

#### 0.1 Instalar Dependencias
```bash
# Librería de gráficos
npm install recharts

# Librería de fechas mejorada
npm install date-fns

# Librería para exportación Excel (opcional)
npm install xlsx

# Librería para generación PDF (opcional)
npm install jspdf jspdf-autotable
```

#### 0.2 Crear Estructura de Carpetas
```
src/
  components/
    accounting/          # NUEVO
      TaxConfiguration.tsx
      TaxCalculator.tsx
      FiscalReports.tsx
    financial/           # NUEVO (renombrar transactions/)
      FinancialDashboard.tsx (mejorado)
      TransactionList.tsx (mejorado)
      TransactionForm.tsx (mejorado)
      ExpenseManager.tsx
      IncomeAnalytics.tsx
      Charts/
        IncomeVsExpenseChart.tsx
        CategoryPieChart.tsx
        MonthlyTrendChart.tsx
        LocationBarChart.tsx
        EmployeeRevenueChart.tsx
  hooks/
    useAccounting.ts     # NUEVO
    useTaxCalculation.ts # NUEVO
    useFinancialReports.ts # NUEVO
    useChartData.ts      # NUEVO
  lib/
    accounting/          # NUEVO
      colombiaTaxes.ts   # Lógica de impuestos Colombia
      fiscalUtils.ts     # Utilidades fiscales
      taxCalculations.ts # Cálculos tributarios
  types/
    accounting.types.ts  # NUEVO
```

#### 0.3 Documentación de Impuestos Colombia
Crear archivo de referencia con tasas actuales:
- IVA: 0%, 5%, 19%
- ICA: Varía por ciudad (0.414% - 1.4%)
- Retención en la fuente: Tabla según actividad
- Régimen simple: Tasa única según ingresos

**Entregables Fase 0**:
- ✅ Dependencias instaladas
- ✅ Estructura de carpetas creada
- ✅ Documento de referencia fiscal

---

## 📊 FASE 1: BASE DE DATOS FISCAL (8-10 horas)

### Objetivos
- Crear tablas de configuración fiscal
- Extender tablas existentes con campos tributarios
- Implementar lógica de cálculo de impuestos

### 1.1 Migración SQL: Configuración Fiscal (2 horas)

**Archivo**: `supabase/migrations/20251013000000_fiscal_system.sql`

```sql
-- ============================================================================
-- SISTEMA FISCAL Y CONTABLE - COLOMBIA
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. TIPOS ENUM FISCALES
-- ============================================================================

CREATE TYPE tax_regime AS ENUM (
    'simple',      -- Régimen Simple de Tributación
    'common',      -- Régimen Ordinario/Común
    'special'      -- Régimen Especial (sin ánimo de lucro)
);

CREATE TYPE tax_type AS ENUM (
    'iva_0',       -- IVA 0% (exento)
    'iva_5',       -- IVA 5%
    'iva_19',      -- IVA 19%
    'ica',         -- Impuesto de Industria y Comercio
    'retention',   -- Retención en la Fuente
    'none'         -- Sin impuesto
);

CREATE TYPE invoice_status AS ENUM (
    'draft',       -- Borrador
    'issued',      -- Emitida
    'paid',        -- Pagada
    'overdue',     -- Vencida
    'cancelled',   -- Anulada
    'credit_note'  -- Nota crédito
);

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
    activity_code VARCHAR(10), -- Código CIIU actividad económica
    
    -- Tasas de impuestos
    default_iva_rate DECIMAL(5,2) DEFAULT 19.00 CHECK (default_iva_rate >= 0 AND default_iva_rate <= 100),
    ica_rate DECIMAL(5,4) DEFAULT 0.00 CHECK (ica_rate >= 0 AND ica_rate <= 100),
    retention_rate DECIMAL(5,2) DEFAULT 0.00 CHECK (retention_rate >= 0 AND retention_rate <= 100),
    
    -- Configuración contable
    accountant_name VARCHAR(255),
    accountant_email VARCHAR(255),
    accountant_phone VARCHAR(20),
    accountant_license VARCHAR(50), -- Tarjeta profesional contador
    
    -- Configuración de facturación
    invoice_prefix VARCHAR(10) DEFAULT 'F',
    invoice_next_number INTEGER DEFAULT 1,
    invoice_resolution_number VARCHAR(50),
    invoice_resolution_date DATE,
    invoice_resolution_valid_until DATE,
    
    -- Metadata adicional
    settings JSONB DEFAULT '{}'
);

CREATE INDEX idx_tax_configurations_business ON tax_configurations(business_id);

COMMENT ON TABLE tax_configurations IS 
'Configuración fiscal y tributaria por negocio para Colombia';

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
    terms TEXT, -- Términos y condiciones
    
    -- Facturación electrónica (futuro)
    cufe VARCHAR(100), -- Código Único de Facturación Electrónica
    qr_code TEXT,
    xml_url TEXT,
    pdf_url TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    CONSTRAINT unique_invoice_number UNIQUE(business_id, invoice_number)
);

CREATE INDEX idx_invoices_business ON invoices(business_id);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_issue_date ON invoices(issue_date DESC);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);

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

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);

-- ============================================================================
-- 5. TABLA: tax_liabilities (Obligaciones Fiscales)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tax_liabilities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    
    -- Tipo de obligación
    liability_type VARCHAR(50) NOT NULL, -- 'iva_monthly', 'ica_bimonthly', 'income_annual'
    period VARCHAR(7) NOT NULL, -- 'YYYY-MM' o 'YYYY'
    
    -- Fechas
    due_date DATE NOT NULL,
    filed_date DATE,
    
    -- Montos
    calculated_amount DECIMAL(12,2) DEFAULT 0,
    filed_amount DECIMAL(12,2),
    paid_amount DECIMAL(12,2) DEFAULT 0,
    
    -- Estado
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'filed', 'paid', 'overdue'
    
    -- Referencias
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_tax_liabilities_business ON tax_liabilities(business_id);
CREATE INDEX idx_tax_liabilities_due_date ON tax_liabilities(due_date);
CREATE INDEX idx_tax_liabilities_period ON tax_liabilities(period);
CREATE INDEX idx_tax_liabilities_status ON tax_liabilities(status);

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

COMMENT ON COLUMN locations.dane_code IS 
'Código DANE del departamento-municipio para cálculo de ICA';

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

-- Índices nuevos
CREATE INDEX IF NOT EXISTS idx_transactions_fiscal_period ON transactions(fiscal_period);
CREATE INDEX IF NOT EXISTS idx_transactions_tax_type ON transactions(tax_type);
CREATE INDEX IF NOT EXISTS idx_transactions_invoice ON transactions(invoice_id);

COMMENT ON COLUMN transactions.subtotal IS 
'Valor antes de aplicar impuestos';
COMMENT ON COLUMN transactions.total_amount IS 
'Valor total incluyendo impuestos (subtotal + tax_amount)';
COMMENT ON COLUMN transactions.fiscal_period IS 
'Período fiscal en formato YYYY-MM para agrupación';

-- ============================================================================
-- 9. EXTENDER TABLA services
-- ============================================================================

ALTER TABLE services
ADD COLUMN IF NOT EXISTS tax_type tax_type DEFAULT 'iva_19',
ADD COLUMN IF NOT EXISTS product_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS is_taxable BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN services.tax_type IS 
'Tipo de impuesto aplicable a este servicio';
COMMENT ON COLUMN services.product_code IS 
'Código de producto/servicio según clasificación DIAN';

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

COMMENT ON COLUMN business_employees.salary_type IS 
'Tipo de salario: monthly, hourly, commission_only';
COMMENT ON COLUMN business_employees.contract_type IS 
'Tipo de contrato: indefinido, fijo, prestacion_servicios';

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

CREATE TRIGGER generate_invoice_number_trigger
BEFORE INSERT OR UPDATE ON invoices
FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();

-- ============================================================================
-- 13. FUNCIÓN: Calcular totales de factura
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_invoice_totals(invoice_uuid UUID)
RETURNS TABLE(
    subtotal DECIMAL,
    tax_amount DECIMAL,
    total DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(ii.subtotal), 0) as subtotal,
        COALESCE(SUM(ii.tax_amount), 0) as tax_amount,
        COALESCE(SUM(ii.total), 0) as total
    FROM invoice_items ii
    WHERE ii.invoice_id = invoice_uuid;
END;
$$ LANGUAGE plpgsql;

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
    SUM(t.subtotal) as total_subtotal,
    SUM(t.tax_amount) as total_tax_amount,
    SUM(t.total_amount) as total_amount,
    AVG(t.tax_rate) as average_tax_rate
FROM transactions t
JOIN businesses b ON t.business_id = b.id
WHERE t.tax_type != 'none'
GROUP BY t.business_id, b.name, t.fiscal_period, t.tax_type
ORDER BY t.fiscal_period DESC, t.business_id;

COMMENT ON VIEW tax_report_by_period IS 
'Reporte de impuestos agrupado por período fiscal y tipo de impuesto';

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
    CURRENT_DATE - tl.due_date as days_overdue
FROM tax_liabilities tl
JOIN businesses b ON tl.business_id = b.id
ORDER BY tl.due_date DESC;

-- ============================================================================
-- 16. RLS POLICIES
-- ============================================================================

-- tax_configurations
ALTER TABLE tax_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage tax configurations" ON tax_configurations
FOR ALL USING (
    auth.uid() IN (SELECT owner_id FROM businesses WHERE id = tax_configurations.business_id)
);

-- invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage invoices" ON invoices
FOR ALL USING (
    auth.uid() IN (SELECT owner_id FROM businesses WHERE id = invoices.business_id)
);

CREATE POLICY "Clients can read own invoices" ON invoices
FOR SELECT USING (auth.uid() = client_id);

-- invoice_items
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Owners can manage tax liabilities" ON tax_liabilities
FOR ALL USING (
    auth.uid() IN (SELECT owner_id FROM businesses WHERE id = tax_liabilities.business_id)
);

COMMIT;

-- ============================================================================
-- FIN DE MIGRACIÓN FISCAL
-- ============================================================================
```

**Entregables 1.1**:
- ✅ Migración SQL ejecutada
- ✅ Tablas fiscales creadas
- ✅ Triggers automáticos configurados
- ✅ RLS policies aplicadas

### 1.2 Tipos TypeScript Fiscales (1 hora)

**Archivo**: `src/types/accounting.types.ts`

```typescript
// Regímenes tributarios Colombia
export type TaxRegime = 'simple' | 'common' | 'special';

// Tipos de impuestos
export type TaxType = 'iva_0' | 'iva_5' | 'iva_19' | 'ica' | 'retention' | 'none';

// Estados de factura
export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled' | 'credit_note';

// Configuración fiscal
export interface TaxConfiguration {
  id: string;
  created_at: string;
  updated_at: string;
  business_id: string;
  
  // Configuración tributaria
  tax_regime: TaxRegime;
  is_iva_responsible: boolean;
  is_ica_responsible: boolean;
  is_retention_agent: boolean;
  
  // Identificación fiscal
  dian_code?: string;
  activity_code?: string;
  
  // Tasas
  default_iva_rate: number;
  ica_rate: number;
  retention_rate: number;
  
  // Contador
  accountant_name?: string;
  accountant_email?: string;
  accountant_phone?: string;
  accountant_license?: string;
  
  // Facturación
  invoice_prefix: string;
  invoice_next_number: number;
  invoice_resolution_number?: string;
  invoice_resolution_date?: string;
  invoice_resolution_valid_until?: string;
  
  settings?: Record<string, unknown>;
}

// Factura
export interface Invoice {
  id: string;
  created_at: string;
  updated_at: string;
  business_id: string;
  
  // Numeración
  invoice_number: string;
  invoice_prefix?: string;
  invoice_sequence: number;
  
  // Estado
  status: InvoiceStatus;
  issue_date: string;
  due_date?: string;
  paid_date?: string;
  
  // Cliente
  client_id?: string;
  client_name: string;
  client_tax_id?: string;
  client_address?: string;
  client_email?: string;
  client_phone?: string;
  
  // Montos
  subtotal: number;
  discount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  
  // Impuestos desglosados
  iva_amount: number;
  ica_amount: number;
  retention_amount: number;
  
  // Referencias
  appointment_id?: string;
  transaction_id?: string;
  
  // Notas
  notes?: string;
  terms?: string;
  
  // Facturación electrónica
  cufe?: string;
  qr_code?: string;
  xml_url?: string;
  pdf_url?: string;
  
  metadata?: Record<string, unknown>;
  
  // Populated
  items?: InvoiceItem[];
  client?: User;
}

// Ítem de factura
export interface InvoiceItem {
  id: string;
  created_at: string;
  invoice_id: string;
  
  description: string;
  quantity: number;
  unit_price: number;
  
  tax_type: TaxType;
  tax_rate: number;
  tax_amount: number;
  
  subtotal: number;
  total: number;
  
  service_id?: string;
  sort_order: number;
  
  // Populated
  service?: Service;
}

// Obligación fiscal
export interface TaxLiability {
  id: string;
  created_at: string;
  updated_at: string;
  business_id: string;
  
  liability_type: string; // 'iva_monthly', 'ica_bimonthly', 'income_annual'
  period: string; // 'YYYY-MM' o 'YYYY'
  
  due_date: string;
  filed_date?: string;
  
  calculated_amount: number;
  filed_amount?: number;
  paid_amount: number;
  
  status: 'pending' | 'filed' | 'paid' | 'overdue';
  
  metadata?: Record<string, unknown>;
}

// Reporte de impuestos
export interface TaxReport {
  business_id: string;
  business_name: string;
  fiscal_period: string;
  tax_type: TaxType;
  transaction_count: number;
  total_subtotal: number;
  total_tax_amount: number;
  total_amount: number;
  average_tax_rate: number;
}

// Transacción extendida con impuestos
export interface TransactionWithTax extends Transaction {
  subtotal?: number;
  tax_type: TaxType;
  tax_rate: number;
  tax_amount: number;
  total_amount?: number;
  is_tax_deductible: boolean;
  invoice_id?: string;
  fiscal_period?: string;
  invoice?: Invoice;
}

// Configuración de impuestos por ciudad Colombia
export interface ColombianCityTax {
  dane_code: string;
  department: string;
  city: string;
  ica_rate: number; // Porcentaje ICA
  has_ica: boolean;
}

// Configuración de retención en la fuente Colombia
export interface RetentionConfig {
  activity_code: string;
  description: string;
  retention_rate: number;
  applies_to_services: boolean;
  applies_to_sales: boolean;
}
```

**Entregables 1.2**:
- ✅ Tipos TypeScript creados
- ✅ Interfaces fiscales definidas

### 1.3 Librería de Cálculos Fiscales Colombia (3-4 horas)

**Archivo**: `src/lib/accounting/colombiaTaxes.ts`

```typescript
import { TaxType, ColombianCityTax, RetentionConfig } from '@/types/accounting.types';

// ============================================================================
// TASAS DE IVA COLOMBIA
// ============================================================================

export const IVA_RATES = {
  iva_0: 0,
  iva_5: 5,
  iva_19: 19,
} as const;

// ============================================================================
// TASAS DE ICA POR CIUDAD (TOP 20 CIUDADES)
// ============================================================================

export const COLOMBIAN_CITIES_ICA: ColombianCityTax[] = [
  // Bogotá
  { dane_code: '11001', department: 'Bogotá D.C.', city: 'Bogotá', ica_rate: 0.966, has_ica: true },
  // Antioquia
  { dane_code: '05001', department: 'Antioquia', city: 'Medellín', ica_rate: 1.0, has_ica: true },
  { dane_code: '05088', department: 'Antioquia', city: 'Bello', ica_rate: 0.7, has_ica: true },
  { dane_code: '05360', department: 'Antioquia', city: 'Itagüí', ica_rate: 0.8, has_ica: true },
  { dane_code: '05266', department: 'Antioquia', city: 'Envigado', ica_rate: 0.69, has_ica: true },
  // Valle del Cauca
  { dane_code: '76001', department: 'Valle del Cauca', city: 'Cali', ica_rate: 1.0, has_ica: true },
  { dane_code: '76520', department: 'Valle del Cauca', city: 'Palmira', ica_rate: 0.8, has_ica: true },
  // Atlántico
  { dane_code: '08001', department: 'Atlántico', city: 'Barranquilla', ica_rate: 1.0, has_ica: true },
  { dane_code: '08758', department: 'Atlántico', city: 'Soledad', ica_rate: 0.7, has_ica: true },
  // Santander
  { dane_code: '68001', department: 'Santander', city: 'Bucaramanga', ica_rate: 1.0, has_ica: true },
  { dane_code: '68276', department: 'Santander', city: 'Floridablanca', ica_rate: 0.8, has_ica: true },
  // Bolívar
  { dane_code: '13001', department: 'Bolívar', city: 'Cartagena', ica_rate: 1.0, has_ica: true },
  // Risaralda
  { dane_code: '66001', department: 'Risaralda', city: 'Pereira', ica_rate: 0.8, has_ica: true },
  // Caldas
  { dane_code: '17001', department: 'Caldas', city: 'Manizales', ica_rate: 0.9, has_ica: true },
  // Norte de Santander
  { dane_code: '54001', department: 'Norte de Santander', city: 'Cúcuta', ica_rate: 0.9, has_ica: true },
  // Nariño
  { dane_code: '52001', department: 'Nariño', city: 'Pasto', ica_rate: 0.8, has_ica: true },
  // Tolima
  { dane_code: '73001', department: 'Tolima', city: 'Ibagué', ica_rate: 0.8, has_ica: true },
  // Huila
  { dane_code: '41001', department: 'Huila', city: 'Neiva', ica_rate: 0.7, has_ica: true },
  // Meta
  { dane_code: '50001', department: 'Meta', city: 'Villavicencio', ica_rate: 0.7, has_ica: true },
  // Quindío
  { dane_code: '63001', department: 'Quindío', city: 'Armenia', ica_rate: 0.8, has_ica: true },
];

// ============================================================================
// RETENCIÓN EN LA FUENTE (Simplificado)
// ============================================================================

export const RETENTION_CONFIGS: RetentionConfig[] = [
  {
    activity_code: '9601',
    description: 'Peluquerías y salones de belleza',
    retention_rate: 2.0,
    applies_to_services: true,
    applies_to_sales: false,
  },
  {
    activity_code: '8690',
    description: 'Servicios de salud',
    retention_rate: 2.0,
    applies_to_services: true,
    applies_to_sales: false,
  },
  {
    activity_code: '7020',
    description: 'Consultoría de negocios y gestión',
    retention_rate: 11.0,
    applies_to_services: true,
    applies_to_sales: false,
  },
  {
    activity_code: '8010',
    description: 'Servicios de seguridad privada',
    retention_rate: 4.0,
    applies_to_services: true,
    applies_to_sales: false,
  },
  // Agregar más según actividades
];

// ============================================================================
// FUNCIONES DE CÁLCULO
// ============================================================================

/**
 * Calcula el IVA sobre un monto
 */
export function calculateIVA(amount: number, taxType: TaxType): number {
  if (taxType === 'none' || taxType === 'ica' || taxType === 'retention') {
    return 0;
  }
  
  const rate = IVA_RATES[taxType as keyof typeof IVA_RATES] || 0;
  return Math.round((amount * rate / 100) * 100) / 100;
}

/**
 * Calcula el ICA sobre un monto
 */
export function calculateICA(amount: number, icaRate: number): number {
  return Math.round((amount * icaRate / 100) * 100) / 100;
}

/**
 * Calcula la retención en la fuente
 */
export function calculateRetention(amount: number, retentionRate: number): number {
  return Math.round((amount * retentionRate / 100) * 100) / 100;
}

/**
 * Calcula todos los impuestos para una transacción
 */
export interface TaxCalculation {
  subtotal: number;
  iva_amount: number;
  ica_amount: number;
  retention_amount: number;
  total_tax: number;
  total_amount: number;
}

export function calculateAllTaxes(
  subtotal: number,
  taxType: TaxType,
  icaRate: number = 0,
  retentionRate: number = 0
): TaxCalculation {
  const iva_amount = calculateIVA(subtotal, taxType);
  const ica_amount = calculateICA(subtotal, icaRate);
  const retention_amount = calculateRetention(subtotal, retentionRate);
  
  const total_tax = iva_amount + ica_amount;
  const total_amount = subtotal + total_tax - retention_amount;
  
  return {
    subtotal,
    iva_amount,
    ica_amount,
    retention_amount,
    total_tax,
    total_amount,
  };
}

/**
 * Busca la tasa de ICA por código DANE
 */
export function getICARate(daneCode: string): number {
  const city = COLOMBIAN_CITIES_ICA.find(c => c.dane_code === daneCode);
  return city?.ica_rate || 0;
}

/**
 * Busca la configuración de retención por código de actividad
 */
export function getRetentionConfig(activityCode: string): RetentionConfig | null {
  return RETENTION_CONFIGS.find(r => r.activity_code === activityCode) || null;
}

/**
 * Formatea un monto en pesos colombianos
 */
export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
```

**Entregables 1.3**:
- ✅ Librería de cálculos fiscales
- ✅ Tasas de IVA e ICA definidas
- ✅ Funciones de cálculo automático

---

## 🎨 FASE 2: COMPONENTES UI MEJORADOS (8-10 horas)

### Objetivos
- Mejorar componentes existentes
- Crear componentes de configuración fiscal
- Implementar gráficos interactivos

### 2.1 Dashboard Financiero con Gráficos (3-4 horas)

**Archivo**: `src/components/financial/Charts/IncomeVsExpenseChart.tsx`

```typescript
import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

interface ChartDataPoint {
  period: string;
  income: number;
  expenses: number;
  profit: number;
}

interface IncomeVsExpenseChartProps {
  data: ChartDataPoint[];
  currency?: string;
}

export function IncomeVsExpenseChart({ data, currency = 'COP' }: IncomeVsExpenseChartProps) {
  const { language } = useLanguage();
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(language === 'es' ? 'es-CO' : 'en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(value);
  };
  
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Ingresos vs Egresos</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" />
          <YAxis tickFormatter={formatCurrency} />
          <Tooltip formatter={(value: number) => formatCurrency(value)} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="income" 
            stroke="#10b981" 
            strokeWidth={2}
            name="Ingresos"
          />
          <Line 
            type="monotone" 
            dataKey="expenses" 
            stroke="#ef4444" 
            strokeWidth={2}
            name="Egresos"
          />
          <Line 
            type="monotone" 
            dataKey="profit" 
            stroke="#3b82f6" 
            strokeWidth={2}
            name="Utilidad"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
```

**Crear también**:
- `CategoryPieChart.tsx` - Distribución por categorías
- `MonthlyTrendChart.tsx` - Tendencia mensual
- `LocationBarChart.tsx` - Comparativa por sedes
- `EmployeeRevenueChart.tsx` - Ingresos por empleado

### 2.2 Formulario de Transacción Mejorado (2 horas)

Extender `TransactionForm.tsx` con:
- Cálculo automático de impuestos
- Selector de tipo de impuesto
- Preview de totales con desglose
- Validación de montos

### 2.3 Configuración Fiscal (2-3 horas)

**Archivo**: `src/components/accounting/TaxConfiguration.tsx`

Formulario para configurar:
- Régimen tributario
- Responsabilidades fiscales (IVA, ICA, retención)
- Tasas de impuestos
- Datos del contador
- Configuración de facturación

---

## 🔧 FASE 3: HOOKS Y LÓGICA DE NEGOCIO (6-8 horas)

### 3.1 Hook de Cálculos Fiscales (2 horas)

**Archivo**: `src/hooks/useTaxCalculation.ts`

```typescript
export function useTaxCalculation(businessId: string) {
  // Cargar configuración fiscal del negocio
  // Funciones para calcular IVA, ICA, retención
  // Validaciones
  return {
    calculateTaxes,
    getTaxConfig,
    updateTaxConfig,
  };
}
```

### 3.2 Hook de Reportes Financieros (2-3 horas)

**Archivo**: `src/hooks/useFinancialReports.ts`

```typescript
export function useFinancialReports(filters: ReportFilters) {
  // Generar reportes de P&L
  // Reportes de impuestos
  // Reportes de nómina
  // Comparativas de períodos
  return {
    profitAndLoss,
    taxReport,
    payrollReport,
    exportToCSV,
    exportToExcel,
    exportToPDF,
  };
}
```

### 3.3 Hook de Datos de Gráficos (1-2 horas)

**Archivo**: `src/hooks/useChartData.ts`

```typescript
export function useChartData(businessId: string, period: string) {
  // Transformar datos de transactions a formato de gráficos
  // Agregaciones por período
  // Cálculos de tendencias
  return {
    incomeVsExpenseData,
    categoryDistributionData,
    monthlyTrendData,
    locationComparisonData,
    employeePerformanceData,
  };
}
```

---

## 📊 FASE 4: FILTROS AVANZADOS Y REPORTES (4-6 horas)

### 4.1 Componente de Filtros Avanzados (2 horas)

**Archivo**: `src/components/financial/AdvancedFilters.tsx`

Filtros para:
- ✅ Período personalizado (date range picker)
- ✅ Múltiples sedes (multi-select)
- ✅ Múltiples empleados (multi-select)
- ✅ Categorías y subcategorías
- ✅ Servicios específicos
- ✅ Tipo de transacción
- ✅ Estado de verificación
- ✅ Rango de montos

### 4.2 Generador de Reportes Contables (2-3 horas)

**Archivo**: `src/components/accounting/FiscalReports.tsx`

Reportes incluyen:
- Estado de resultados (P&L)
- Balance general simplificado
- Reporte de impuestos por período
- Reporte de retenciones
- Reporte de nómina
- Declaraciones pre-diligenciadas

### 4.3 Exportación Mejorada (1 hora)

Formatos de exportación:
- CSV con delimitador `;` y formato colombiano
- Excel con múltiples hojas
- PDF con logo y formato profesional

---

## 💼 FASE 5: GESTIÓN DE GASTOS Y NÓMINA (6-8 horas)

### 5.1 Módulo de Gestión de Gastos (3-4 horas)

**Archivo**: `src/components/financial/ExpenseManager.tsx`

Funcionalidades:
- CRUD de gastos recurrentes (renta, servicios, etc.)
- Plantillas de gastos frecuentes
- Alertas de pagos pendientes
- Calendario de pagos
- Conciliación bancaria básica

### 5.2 Módulo de Nómina (3-4 horas)

**Archivo**: `src/components/financial/PayrollManager.tsx`

Funcionalidades:
- Configuración de salarios por empleado
- Cálculo de comisiones automático
- Prestaciones sociales (Colombia)
- Nómina mensual con desglose
- Comprobantes de pago

---

## 🎯 FASE 6: INTEGRACIÓN Y PRUEBAS (4-6 horas)

### 6.1 Integración de Componentes (2 horas)
- Integrar gráficos en FinancialDashboard
- Conectar filtros con reportes
- Flujo completo de transacciones con impuestos

### 6.2 Testing con Datos Reales Colombia (2-3 horas)
- Crear datos de prueba con transacciones colombianas
- Validar cálculos de IVA 0%, 5%, 19%
- Validar ICA por ciudades
- Validar retención en la fuente
- Validar reportes fiscales

### 6.3 Documentación Usuario Final (1 hora)
- Guía de configuración fiscal
- Guía de uso de reportes
- FAQ de impuestos Colombia

---

## 🚀 FASE 7: DEPLOY Y VALIDACIÓN (2-3 horas)

### 7.1 Deploy de Migración SQL
```bash
npx supabase db push
npx supabase db reset --local # Testing
```

### 7.2 Validación con Contador
- Revisión de cálculos fiscales
- Validación de reportes
- Ajustes según normativa

### 7.3 Capacitación Usuarios
- Video tutorial
- Documentación completa
- Soporte inicial

---

## 📅 CRONOGRAMA SUGERIDO

| Fase | Duración | Días Hábiles | Dependencias |
|------|----------|--------------|--------------|
| **Fase 0: Preparación** | 1-2h | 0.5 días | Ninguna |
| **Fase 1: Base de Datos** | 8-10h | 1.5 días | Fase 0 |
| **Fase 2: UI Mejorado** | 8-10h | 1.5 días | Fase 1 |
| **Fase 3: Hooks** | 6-8h | 1 día | Fase 1, 2 |
| **Fase 4: Filtros y Reportes** | 4-6h | 1 día | Fase 3 |
| **Fase 5: Gastos y Nómina** | 6-8h | 1 día | Fase 3 |
| **Fase 6: Testing** | 4-6h | 1 día | Todas anteriores |
| **Fase 7: Deploy** | 2-3h | 0.5 días | Todas anteriores |
| **TOTAL** | **39-53 horas** | **7-8 días** | - |

**Modo de trabajo**: 6-8 horas/día = **1-1.5 semanas de desarrollo**

---

## 🎯 PRIORIDADES Y QUICK WINS

### PRIORIDAD CRÍTICA (Hacer primero)
1. ✅ Fase 1.1: Migración SQL (base fiscal)
2. ✅ Fase 1.3: Librería cálculos Colombia
3. ✅ Fase 2.2: TransactionForm con impuestos
4. ✅ Fase 3.1: Hook useTaxCalculation

### PRIORIDAD ALTA (Hacer segundo)
5. ✅ Fase 2.1: Dashboard con gráficos
6. ✅ Fase 4.1: Filtros avanzados
7. ✅ Fase 4.2: Reportes contables

### PRIORIDAD MEDIA (Hacer tercero)
8. ✅ Fase 2.3: Configuración fiscal
9. ✅ Fase 5.1: Gestión de gastos
10. ✅ Fase 4.3: Exportación mejorada

### PRIORIDAD BAJA (Futuro)
11. ⏳ Fase 5.2: Nómina completa
12. ⏳ Facturación electrónica DIAN
13. ⏳ Integración bancaria

---

## 📦 ENTREGABLES FINALES

### Documentación
- ✅ SISTEMA_CONTABLE_PARTE_1_ANALISIS.md (Este documento)
- ✅ SISTEMA_CONTABLE_PARTE_2_PLAN_ACCION.md (Plan detallado)
- ⏳ GUIA_CONFIGURACION_FISCAL_COLOMBIA.md (Usuario final)
- ⏳ GUIA_USO_REPORTES_CONTABLES.md (Usuario final)
- ⏳ API_CONTABILIDAD.md (Desarrolladores)

### Código
- ⏳ Migración SQL fiscal
- ⏳ Tipos TypeScript accounting.types.ts
- ⏳ Librería colombiaTaxes.ts
- ⏳ 5 componentes de gráficos
- ⏳ 3 hooks de contabilidad
- ⏳ 4 componentes de gestión fiscal
- ⏳ Tests unitarios
- ⏳ Tests de integración

### Features Completadas
- ⏳ Configuración fiscal por negocio
- ⏳ Cálculo automático de IVA (0%, 5%, 19%)
- ⏳ Cálculo de ICA por ciudad
- ⏳ Retención en la fuente
- ⏳ Dashboard con 5 tipos de gráficos
- ⏳ Filtros avanzados (período, sede, empleado, categoría, servicio)
- ⏳ Reportes contables (P&L, impuestos, nómina)
- ⏳ Exportación CSV/Excel/PDF
- ⏳ Gestión de gastos recurrentes
- ⏳ Sistema de alertas fiscales

---

## 🎓 RECOMENDACIONES TÉCNICAS

### Buenas Prácticas
1. **Separación de responsabilidades**: Lógica fiscal en `/lib/accounting`, UI en `/components`
2. **Validación en múltiples capas**: Frontend (UI), Backend (Supabase RLS), Lógica (Hooks)
3. **Auditoría**: Registrar cambios en configuración fiscal y transacciones importantes
4. **Testing exhaustivo**: Especialmente cálculos fiscales (pueden tener consecuencias legales)
5. **Documentación clara**: Explicar cada cálculo con referencias a normativa DIAN

### Consideraciones Legales
⚠️ **IMPORTANTE**: Esta implementación es una herramienta de apoyo contable, NO sustituye un contador profesional. Recomendaciones:
- Validar todos los cálculos con contador certificado
- Mantener respaldos de todas las transacciones
- Actualizar tasas de impuestos según cambios normativos
- No usar para declaraciones oficiales sin revisión profesional
- Incluir disclaimer legal en la aplicación

### Seguridad
- RLS policies estrictas en tablas fiscales
- Auditoría de cambios en configuración fiscal
- Backup automático de transacciones
- Encriptación de datos sensibles (NIT, datos contables)

---

## 🔮 FUTURO (POST-MVP)

### Fase 8: Facturación Electrónica DIAN (Futuro)
- Integración con proveedores autorizados DIAN
- Generación de XML válido
- Firma digital
- Envío a DIAN
- Recepción de CUFE
- Generación de PDF con QR

### Fase 9: Integración Bancaria (Futuro)
- Conciliación bancaria automática
- Importación de extractos bancarios
- Matching automático de transacciones
- Alertas de discrepancias

### Fase 10: IA y Predicciones (Futuro)
- Proyecciones financieras con ML
- Detección de anomalías
- Sugerencias de optimización fiscal
- Alertas inteligentes

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Fase 0: Preparación
- [ ] Instalar recharts
- [ ] Instalar date-fns
- [ ] Instalar xlsx (opcional)
- [ ] Instalar jspdf (opcional)
- [ ] Crear estructura de carpetas
- [ ] Documento de referencia fiscal Colombia

### Fase 1: Base de Datos
- [ ] Crear migración `20251013000000_fiscal_system.sql`
- [ ] Ejecutar migración en local
- [ ] Verificar tablas creadas
- [ ] Verificar triggers funcionan
- [ ] Verificar RLS policies
- [ ] Crear tipos TypeScript `accounting.types.ts`
- [ ] Crear librería `colombiaTaxes.ts`
- [ ] Tests unitarios de cálculos

### Fase 2: UI
- [ ] Crear 5 componentes de gráficos
- [ ] Mejorar FinancialDashboard con gráficos
- [ ] Extender TransactionForm con impuestos
- [ ] Crear TaxConfiguration.tsx
- [ ] Crear ExpenseManager.tsx

### Fase 3: Hooks
- [ ] Crear useTaxCalculation.ts
- [ ] Crear useFinancialReports.ts
- [ ] Crear useChartData.ts
- [ ] Extender useTransactions.ts

### Fase 4: Reportes
- [ ] Crear AdvancedFilters.tsx
- [ ] Crear FiscalReports.tsx
- [ ] Implementar exportación CSV mejorada
- [ ] Implementar exportación Excel
- [ ] Implementar exportación PDF

### Fase 5: Gestión
- [ ] Completar ExpenseManager
- [ ] Crear PayrollManager.tsx
- [ ] Integrar con employee_services

### Fase 6: Testing
- [ ] Tests de integración completos
- [ ] Validación con datos Colombia
- [ ] Revisión contador profesional
- [ ] Documentación usuario final

### Fase 7: Deploy
- [ ] Deploy migración SQL a producción
- [ ] Deploy código frontend
- [ ] Capacitación usuarios
- [ ] Monitoreo post-deploy

---

## 🎉 CONCLUSIÓN

Este plan de acción proporciona una ruta clara y estructurada para implementar un **sistema contable completo** con enfoque en **Colombia**. La implementación es **iterativa**, permitiendo entregar valor en cada fase.

**Tiempo total estimado**: 40-50 horas (7-8 días hábiles)  
**Complejidad**: Media-Alta  
**ROI**: Alto (gestión fiscal profesional = ahorro significativo)

¿Listo para comenzar? Podemos iniciar con la **Fase 0 y Fase 1** para sentar las bases del sistema fiscal.

---

**FIN DE PARTE 2**
