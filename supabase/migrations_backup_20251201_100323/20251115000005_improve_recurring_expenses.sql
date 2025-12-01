-- ==========================================================
-- SISTEMA COMPLETO DE EGRESOS - PARTE 2: MEJORAR TABLA EXISTENTE
-- ==========================================================
-- Fecha: 15/11/2025
-- Descripción: Ampliar tabla recurring_expenses existente con campos adicionales
-- ==========================================================

-- Agregar nuevas columnas a recurring_expenses (solo si no existen)
DO $$
BEGIN
  -- location_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recurring_expenses' AND column_name = 'location_id'
  ) THEN
    ALTER TABLE public.recurring_expenses ADD COLUMN location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL;
  END IF;
  
  -- employee_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recurring_expenses' AND column_name = 'employee_id'
  ) THEN
    ALTER TABLE public.recurring_expenses ADD COLUMN employee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
  
  -- created_by
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recurring_expenses' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.recurring_expenses ADD COLUMN created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
  
  -- name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recurring_expenses' AND column_name = 'name'
  ) THEN
    ALTER TABLE public.recurring_expenses ADD COLUMN name VARCHAR(200);
  END IF;
  
  -- currency
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recurring_expenses' AND column_name = 'currency'
  ) THEN
    ALTER TABLE public.recurring_expenses ADD COLUMN currency VARCHAR(3) DEFAULT 'COP';
  END IF;
  
  -- recurrence_day
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recurring_expenses' AND column_name = 'recurrence_day'
  ) THEN
    ALTER TABLE public.recurring_expenses ADD COLUMN recurrence_day INTEGER CHECK (recurrence_day BETWEEN 1 AND 31);
  END IF;
  
  -- start_date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recurring_expenses' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE public.recurring_expenses ADD COLUMN start_date DATE DEFAULT CURRENT_DATE;
  END IF;
  
  -- end_date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recurring_expenses' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE public.recurring_expenses ADD COLUMN end_date DATE;
  END IF;
  
  -- metadata
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recurring_expenses' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.recurring_expenses ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
  
  -- is_automated
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recurring_expenses' AND column_name = 'is_automated'
  ) THEN
    ALTER TABLE public.recurring_expenses ADD COLUMN is_automated BOOLEAN DEFAULT false;
  END IF;
  
  -- total_paid
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recurring_expenses' AND column_name = 'total_paid'
  ) THEN
    ALTER TABLE public.recurring_expenses ADD COLUMN total_paid NUMERIC(12,2) DEFAULT 0;
  END IF;
  
  -- payments_count
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recurring_expenses' AND column_name = 'payments_count'
  ) THEN
    ALTER TABLE public.recurring_expenses ADD COLUMN payments_count INTEGER DEFAULT 0;
  END IF;
  
  -- Renombrar frequency a recurrence_frequency
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recurring_expenses' AND column_name = 'frequency'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recurring_expenses' AND column_name = 'recurrence_frequency'
  ) THEN
    ALTER TABLE public.recurring_expenses RENAME COLUMN frequency TO recurrence_frequency;
  END IF;
  
  -- Modificar category para que sea enum en lugar de text
  -- Dropear la columna y recrearla como enum (tabla vacía)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recurring_expenses'
      AND column_name = 'category'
      AND udt_name = 'text'
  ) THEN
    ALTER TABLE public.recurring_expenses DROP COLUMN category;
    ALTER TABLE public.recurring_expenses ADD COLUMN category transaction_category NOT NULL DEFAULT 'other_expense'::transaction_category;
  END IF;END$$;
-- Crear índices si no existen
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_recurring_expenses_location_id'
  ) THEN
    CREATE INDEX idx_recurring_expenses_location_id ON public.recurring_expenses(location_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_recurring_expenses_employee_id'
  ) THEN
    CREATE INDEX idx_recurring_expenses_employee_id ON public.recurring_expenses(employee_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_recurring_expenses_category'
  ) THEN
    CREATE INDEX idx_recurring_expenses_category ON public.recurring_expenses(category);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_recurring_expenses_next_payment_date_active'
  ) THEN
    CREATE INDEX idx_recurring_expenses_next_payment_date_active 
      ON public.recurring_expenses(next_payment_date) 
      WHERE is_active = true;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_recurring_expenses_is_active'
  ) THEN
    CREATE INDEX idx_recurring_expenses_is_active ON public.recurring_expenses(is_active);
  END IF;
END$$;
-- ========================================
-- TABLA DE CONFIGURACIÓN DE EGRESOS POR SEDE
-- ========================================

CREATE TABLE IF NOT EXISTS public.location_expense_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Relaciones
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  
  -- Configuración de arrendamiento
  rent_amount NUMERIC(12,2) DEFAULT 0,
  rent_due_day INTEGER CHECK (rent_due_day BETWEEN 1 AND 31) DEFAULT 1,
  landlord_name VARCHAR(200),
  landlord_contact VARCHAR(100),
  lease_start_date DATE,
  lease_end_date DATE,
  
  -- Configuración de servicios públicos (montos promedio)
  electricity_avg NUMERIC(10,2) DEFAULT 0,
  water_avg NUMERIC(10,2) DEFAULT 0,
  gas_avg NUMERIC(10,2) DEFAULT 0,
  internet_avg NUMERIC(10,2) DEFAULT 0,
  phone_avg NUMERIC(10,2) DEFAULT 0,
  
  -- Otros gastos fijos
  security_amount NUMERIC(10,2) DEFAULT 0,
  cleaning_amount NUMERIC(10,2) DEFAULT 0,
  waste_disposal_amount NUMERIC(10,2) DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  
  -- Estado
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  UNIQUE(location_id)
);
-- Índices para location_expense_config
CREATE INDEX IF NOT EXISTS idx_location_expense_config_location_id ON public.location_expense_config(location_id);
CREATE INDEX IF NOT EXISTS idx_location_expense_config_business_id ON public.location_expense_config(business_id);
-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_location_expense_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trigger_location_expense_config_updated_at ON public.location_expense_config;
CREATE TRIGGER trigger_location_expense_config_updated_at
  BEFORE UPDATE ON public.location_expense_config
  FOR EACH ROW
  EXECUTE FUNCTION update_location_expense_config_updated_at();
-- ========================================
-- RLS POLICIES
-- ========================================

-- RLS para location_expense_config
ALTER TABLE public.location_expense_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS location_expense_config_admin_select ON public.location_expense_config;
CREATE POLICY location_expense_config_admin_select ON public.location_expense_config
  FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS location_expense_config_admin_insert ON public.location_expense_config;
CREATE POLICY location_expense_config_admin_insert ON public.location_expense_config
  FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS location_expense_config_admin_update ON public.location_expense_config;
CREATE POLICY location_expense_config_admin_update ON public.location_expense_config
  FOR UPDATE
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS location_expense_config_admin_delete ON public.location_expense_config;
CREATE POLICY location_expense_config_admin_delete ON public.location_expense_config
  FOR DELETE
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );
-- Comentarios
COMMENT ON TABLE public.location_expense_config IS 'Configuración de egresos específicos por sede (arrendamiento, servicios públicos, etc.)';
COMMENT ON COLUMN location_expense_config.rent_amount IS 'Monto mensual de arrendamiento';
COMMENT ON COLUMN location_expense_config.electricity_avg IS 'Promedio mensual de electricidad (para proyecciones)';
