-- ==========================================================
-- SISTEMA COMPLETO DE EGRESOS - PARTE 1: CATEGORÍAS
-- ==========================================================
-- Fecha: 15/11/2025
-- Descripción: Ampliar categorías de egresos del enum transaction_category
-- ==========================================================

-- Agregar nuevas categorías de egresos al enum existente
DO $$
BEGIN
  -- Income categories (ya existen, pero verificamos)
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'service_sale' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_category')) THEN
    ALTER TYPE transaction_category ADD VALUE 'service_sale';
  END IF;
  
  -- Payroll & bonuses
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'payroll' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_category')) THEN
    ALTER TYPE transaction_category ADD VALUE 'payroll';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'bonuses' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_category')) THEN
    ALTER TYPE transaction_category ADD VALUE 'bonuses';
  END IF;
  
  -- Utilities (servicios públicos)
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'internet' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_category')) THEN
    ALTER TYPE transaction_category ADD VALUE 'internet';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'water' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_category')) THEN
    ALTER TYPE transaction_category ADD VALUE 'water';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'electricity' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_category')) THEN
    ALTER TYPE transaction_category ADD VALUE 'electricity';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'gas' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_category')) THEN
    ALTER TYPE transaction_category ADD VALUE 'gas';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'phone' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_category')) THEN
    ALTER TYPE transaction_category ADD VALUE 'phone';
  END IF;
  
  -- Maintenance detailed
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'cleaning' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_category')) THEN
    ALTER TYPE transaction_category ADD VALUE 'cleaning';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'repairs' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_category')) THEN
    ALTER TYPE transaction_category ADD VALUE 'repairs';
  END IF;
  
  -- Equipment detailed
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'furniture' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_category')) THEN
    ALTER TYPE transaction_category ADD VALUE 'furniture';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'tools' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_category')) THEN
    ALTER TYPE transaction_category ADD VALUE 'tools';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'software' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_category')) THEN
    ALTER TYPE transaction_category ADD VALUE 'software';
  END IF;
  
  -- Marketing detailed
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'advertising' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_category')) THEN
    ALTER TYPE transaction_category ADD VALUE 'advertising';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'social_media' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_category')) THEN
    ALTER TYPE transaction_category ADD VALUE 'social_media';
  END IF;
  
  -- Taxes detailed
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'property_tax' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_category')) THEN
    ALTER TYPE transaction_category ADD VALUE 'property_tax';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'income_tax' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_category')) THEN
    ALTER TYPE transaction_category ADD VALUE 'income_tax';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'vat' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_category')) THEN
    ALTER TYPE transaction_category ADD VALUE 'vat';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'withholding' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_category')) THEN
    ALTER TYPE transaction_category ADD VALUE 'withholding';
  END IF;
  
  -- Insurance detailed
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'liability_insurance' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_category')) THEN
    ALTER TYPE transaction_category ADD VALUE 'liability_insurance';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'fire_insurance' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_category')) THEN
    ALTER TYPE transaction_category ADD VALUE 'fire_insurance';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'theft_insurance' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_category')) THEN
    ALTER TYPE transaction_category ADD VALUE 'theft_insurance';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'health_insurance' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_category')) THEN
    ALTER TYPE transaction_category ADD VALUE 'health_insurance';
  END IF;
  
  -- Training detailed
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'certifications' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_category')) THEN
    ALTER TYPE transaction_category ADD VALUE 'certifications';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'courses' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_category')) THEN
    ALTER TYPE transaction_category ADD VALUE 'courses';
  END IF;
  
  -- Transportation
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'fuel' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_category')) THEN
    ALTER TYPE transaction_category ADD VALUE 'fuel';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'parking' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_category')) THEN
    ALTER TYPE transaction_category ADD VALUE 'parking';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'public_transport' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_category')) THEN
    ALTER TYPE transaction_category ADD VALUE 'public_transport';
  END IF;
  
  -- Professional fees
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'accounting_fees' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_category')) THEN
    ALTER TYPE transaction_category ADD VALUE 'accounting_fees';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'legal_fees' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_category')) THEN
    ALTER TYPE transaction_category ADD VALUE 'legal_fees';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'consulting_fees' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_category')) THEN
    ALTER TYPE transaction_category ADD VALUE 'consulting_fees';
  END IF;
  
  -- Financial
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'depreciation' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_category')) THEN
    ALTER TYPE transaction_category ADD VALUE 'depreciation';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'bank_fees' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_category')) THEN
    ALTER TYPE transaction_category ADD VALUE 'bank_fees';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'interest' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_category')) THEN
    ALTER TYPE transaction_category ADD VALUE 'interest';
  END IF;
  
  -- Miscellaneous
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'donations' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_category')) THEN
    ALTER TYPE transaction_category ADD VALUE 'donations';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'uniforms' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_category')) THEN
    ALTER TYPE transaction_category ADD VALUE 'uniforms';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'security' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_category')) THEN
    ALTER TYPE transaction_category ADD VALUE 'security';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'waste_disposal' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_category')) THEN
    ALTER TYPE transaction_category ADD VALUE 'waste_disposal';
  END IF;
END$$;
-- Verificación
SELECT enumlabel 
FROM pg_enum 
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
WHERE pg_type.typname = 'transaction_category'
ORDER BY enumlabel;
