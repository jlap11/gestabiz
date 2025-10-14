-- ============================================================================
-- DATOS DE PRUEBA - SISTEMA CONTABLE COLOMBIA
-- Fecha: 13 de octubre de 2025
-- ============================================================================
-- IMPORTANTE: Este script crea datos de prueba para validar cálculos fiscales
-- No ejecutar en producción. Solo para testing local.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. LIMPIAR DATOS DE PRUEBA EXISTENTES (Opcional)
-- ============================================================================
-- ADVERTENCIA: Esto borrará datos existentes. Comentar si no se desea limpiar.
-- DELETE FROM transactions WHERE business_id IN (SELECT id FROM businesses WHERE name LIKE 'Test%');
-- DELETE FROM tax_configurations WHERE business_id IN (SELECT id FROM businesses WHERE name LIKE 'Test%');
-- DELETE FROM locations WHERE business_id IN (SELECT id FROM businesses WHERE name LIKE 'Test%');

-- ============================================================================
-- 2. NEGOCIO DE PRUEBA: Salón de Belleza en Bogotá
-- ============================================================================

-- Insertar negocio de prueba (reemplazar owner_id con un UUID válido)
INSERT INTO businesses (id, name, owner_id, description, category, created_at)
VALUES (
  'test-business-001',
  'Test Salón Elegance Bogotá',
  'owner-test-001', -- Reemplazar con auth.uid() real en testing
  'Salón de belleza y spa de prueba para testing de sistema contable',
  'beauty',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- ============================================================================
-- 3. CONFIGURACIÓN FISCAL DEL NEGOCIO
-- ============================================================================

INSERT INTO tax_configurations (
  id,
  business_id,
  tax_regime,
  is_iva_responsible,
  is_ica_responsible,
  is_retention_agent,
  dian_code,
  activity_code,
  default_iva_rate,
  ica_rate,
  retention_rate,
  accountant_name,
  accountant_email,
  accountant_license,
  invoice_prefix,
  invoice_next_number,
  created_at
)
VALUES (
  'test-tax-config-001',
  'test-business-001',
  'common', -- Régimen común
  TRUE, -- Responsable de IVA
  TRUE, -- Responsable de ICA (Bogotá)
  FALSE, -- No agente de retención (por ahora)
  '860123456', -- NIT de prueba
  '9601', -- Código CIIU: Peluquerías y salones de belleza
  19.00, -- IVA general 19%
  0.966, -- ICA Bogotá 0.966%
  0.00, -- Sin retención (no es agente)
  'María Rodríguez',
  'maria.rodriguez@contador.co',
  'TP12345',
  'FE', -- Factura Electrónica
  1,
  NOW()
)
ON CONFLICT (business_id) DO UPDATE SET
  tax_regime = EXCLUDED.tax_regime,
  default_iva_rate = EXCLUDED.default_iva_rate,
  ica_rate = EXCLUDED.ica_rate;

-- ============================================================================
-- 4. SEDE EN BOGOTÁ
-- ============================================================================

INSERT INTO locations (
  id,
  business_id,
  name,
  address,
  city,
  state,
  country,
  postal_code,
  phone,
  email,
  dane_code,
  ica_rate,
  ica_enabled,
  created_at
)
VALUES (
  'test-location-001',
  'test-business-001',
  'Sede Norte - Chapinero',
  'Cra 13 #85-24',
  'Bogotá',
  'Cundinamarca',
  'Colombia',
  '110221',
  '+57 1 234 5678',
  'elegance.chapinero@test.co',
  '11001', -- DANE Bogotá
  0.966, -- ICA Bogotá
  TRUE,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  dane_code = EXCLUDED.dane_code,
  ica_rate = EXCLUDED.ica_rate;

-- ============================================================================
-- 5. EMPLEADOS DE PRUEBA
-- ============================================================================

-- Estilista senior
INSERT INTO profiles (id, email, full_name, role, created_at)
VALUES (
  'test-employee-001',
  'laura.gonzalez@test.co',
  'Laura González',
  'employee',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name;

-- Manicurista
INSERT INTO profiles (id, email, full_name, role, created_at)
VALUES (
  'test-employee-002',
  'carlos.ramirez@test.co',
  'Carlos Ramírez',
  'employee',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name;

-- Vincular empleados al negocio
INSERT INTO business_employees (
  business_id,
  employee_id,
  position,
  salary_base,
  salary_type,
  status,
  created_at
)
VALUES 
  (
    'test-business-001',
    'test-employee-001',
    'Estilista Senior',
    2500000, -- $2,500,000 COP mensuales
    'monthly',
    'active',
    NOW()
  ),
  (
    'test-business-001',
    'test-employee-002',
    'Manicurista',
    1800000, -- $1,800,000 COP mensuales
    'monthly',
    'active',
    NOW()
  )
ON CONFLICT (business_id, employee_id) DO UPDATE SET
  position = EXCLUDED.position,
  salary_base = EXCLUDED.salary_base;

-- ============================================================================
-- 6. SERVICIOS DE PRUEBA
-- ============================================================================

-- Corte de cabello (IVA 19%)
INSERT INTO services (
  id,
  business_id,
  name,
  description,
  duration,
  price,
  currency,
  tax_type,
  is_taxable,
  product_code,
  created_at
)
VALUES (
  'test-service-001',
  'test-business-001',
  'Corte de Cabello',
  'Corte profesional con lavado incluido',
  60,
  50000, -- $50,000 COP
  'COP',
  'iva_19',
  TRUE,
  'SV001',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price;

-- Manicure (IVA 19%)
INSERT INTO services (
  id,
  business_id,
  name,
  description,
  duration,
  price,
  currency,
  tax_type,
  is_taxable,
  product_code,
  created_at
)
VALUES (
  'test-service-002',
  'test-business-001',
  'Manicure Spa',
  'Manicure con tratamiento hidratante',
  45,
  35000, -- $35,000 COP
  'COP',
  'iva_19',
  TRUE,
  'SV002',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price;

-- Producto: Shampoo (IVA 19%)
INSERT INTO services (
  id,
  business_id,
  name,
  description,
  duration,
  price,
  currency,
  tax_type,
  is_taxable,
  product_code,
  created_at
)
VALUES (
  'test-service-003',
  'test-business-001',
  'Shampoo Premium 500ml',
  'Producto para venta al público',
  0,
  45000, -- $45,000 COP
  'COP',
  'iva_19',
  TRUE,
  'PR001',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price;

-- ============================================================================
-- 7. TRANSACCIONES DE PRUEBA - INGRESOS
-- ============================================================================

-- Mes actual: Octubre 2025

-- Transacción 1: Corte de cabello con IVA 19%
INSERT INTO transactions (
  id,
  business_id,
  location_id,
  employee_id,
  type,
  category,
  amount,
  currency,
  description,
  transaction_date,
  payment_method,
  -- Campos fiscales
  subtotal,
  tax_type,
  tax_rate,
  tax_amount,
  total_amount,
  is_tax_deductible,
  fiscal_period,
  created_at
)
VALUES (
  'test-trans-001',
  'test-business-001',
  'test-location-001',
  'test-employee-001',
  'income',
  'appointment_payment',
  50000, -- Subtotal
  'COP',
  'Corte de cabello - Cliente Juan Pérez',
  '2025-10-01',
  'credit_card',
  -- Fiscales
  50000, -- Subtotal
  'iva_19',
  19.00, -- 19%
  9500, -- $50,000 * 0.19 = $9,500
  59500, -- $50,000 + $9,500 = $59,500
  FALSE, -- No deducible (es ingreso)
  '2025-10',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Transacción 2: Manicure con IVA 19%
INSERT INTO transactions (
  id,
  business_id,
  location_id,
  employee_id,
  type,
  category,
  amount,
  currency,
  description,
  transaction_date,
  payment_method,
  subtotal,
  tax_type,
  tax_rate,
  tax_amount,
  total_amount,
  is_tax_deductible,
  fiscal_period,
  created_at
)
VALUES (
  'test-trans-002',
  'test-business-001',
  'test-location-001',
  'test-employee-002',
  'income',
  'appointment_payment',
  35000,
  'COP',
  'Manicure spa - Cliente María López',
  '2025-10-02',
  'cash',
  35000,
  'iva_19',
  19.00,
  6650, -- $35,000 * 0.19 = $6,650
  41650, -- $35,000 + $6,650 = $41,650
  FALSE,
  '2025-10',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Transacción 3: Venta de producto con IVA 19%
INSERT INTO transactions (
  id,
  business_id,
  location_id,
  type,
  category,
  amount,
  currency,
  description,
  transaction_date,
  payment_method,
  subtotal,
  tax_type,
  tax_rate,
  tax_amount,
  total_amount,
  is_tax_deductible,
  fiscal_period,
  created_at
)
VALUES (
  'test-trans-003',
  'test-business-001',
  'test-location-001',
  'income',
  'product_sale',
  45000,
  'COP',
  'Venta shampoo premium',
  '2025-10-03',
  'debit_card',
  45000,
  'iva_19',
  19.00,
  8550, -- $45,000 * 0.19 = $8,550
  53550, -- $45,000 + $8,550 = $53,550
  FALSE,
  '2025-10',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Transacción 4: Servicio exento IVA 0% (ejemplo: servicio de salud)
INSERT INTO transactions (
  id,
  business_id,
  location_id,
  type,
  category,
  amount,
  currency,
  description,
  transaction_date,
  payment_method,
  subtotal,
  tax_type,
  tax_rate,
  tax_amount,
  total_amount,
  is_tax_deductible,
  fiscal_period,
  created_at
)
VALUES (
  'test-trans-004',
  'test-business-001',
  'test-location-001',
  'income',
  'appointment_payment',
  80000,
  'COP',
  'Tratamiento capilar médico (exento IVA)',
  '2025-10-04',
  'bank_transfer',
  80000,
  'iva_0',
  0.00,
  0, -- Sin IVA
  80000, -- Total = Subtotal
  FALSE,
  '2025-10',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Transacción 5: Múltiples servicios IVA 5% (ejemplo: canasta familiar)
INSERT INTO transactions (
  id,
  business_id,
  location_id,
  type,
  category,
  amount,
  currency,
  description,
  transaction_date,
  payment_method,
  subtotal,
  tax_type,
  tax_rate,
  tax_amount,
  total_amount,
  is_tax_deductible,
  fiscal_period,
  created_at
)
VALUES (
  'test-trans-005',
  'test-business-001',
  'test-location-001',
  'income',
  'product_sale',
  100000,
  'COP',
  'Productos de higiene personal (IVA reducido)',
  '2025-10-05',
  'cash',
  100000,
  'iva_5',
  5.00,
  5000, -- $100,000 * 0.05 = $5,000
  105000, -- $100,000 + $5,000 = $105,000
  FALSE,
  '2025-10',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 8. TRANSACCIONES DE PRUEBA - EGRESOS
-- ============================================================================

-- Gasto 1: Arriendo (ICA aplicable)
INSERT INTO transactions (
  id,
  business_id,
  location_id,
  type,
  category,
  amount,
  currency,
  description,
  transaction_date,
  payment_method,
  subtotal,
  tax_type,
  tax_rate,
  tax_amount,
  total_amount,
  is_tax_deductible,
  fiscal_period,
  created_at
)
VALUES (
  'test-trans-101',
  'test-business-001',
  'test-location-001',
  'expense',
  'rent',
  2000000, -- $2,000,000 COP
  'COP',
  'Arriendo mensual local Chapinero',
  '2025-10-01',
  'bank_transfer',
  2000000,
  'none', -- Sin impuesto directo (el arrendador maneja IVA)
  0.00,
  0,
  2000000,
  TRUE, -- Deducible
  '2025-10',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Gasto 2: Servicios públicos con IVA 19%
INSERT INTO transactions (
  id,
  business_id,
  location_id,
  type,
  category,
  amount,
  currency,
  description,
  transaction_date,
  payment_method,
  subtotal,
  tax_type,
  tax_rate,
  tax_amount,
  total_amount,
  is_tax_deductible,
  fiscal_period,
  created_at
)
VALUES (
  'test-trans-102',
  'test-business-001',
  'test-location-001',
  'expense',
  'utilities',
  300000,
  'COP',
  'Energía eléctrica octubre',
  '2025-10-05',
  'bank_transfer',
  300000,
  'iva_19',
  19.00,
  57000, -- $300,000 * 0.19
  357000, -- $300,000 + $57,000
  TRUE,
  '2025-10',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Gasto 3: Compra de insumos con IVA 19%
INSERT INTO transactions (
  id,
  business_id,
  location_id,
  type,
  category,
  amount,
  currency,
  description,
  transaction_date,
  payment_method,
  subtotal,
  tax_type,
  tax_rate,
  tax_amount,
  total_amount,
  is_tax_deductible,
  fiscal_period,
  created_at
)
VALUES (
  'test-trans-103',
  'test-business-001',
  'test-location-001',
  'expense',
  'supplies',
  500000,
  'COP',
  'Compra de productos para salón (tintes, shampoos, etc)',
  '2025-10-10',
  'credit_card',
  500000,
  'iva_19',
  19.00,
  95000, -- $500,000 * 0.19
  595000, -- $500,000 + $95,000
  TRUE,
  '2025-10',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Gasto 4: Nómina (salario Laura González)
INSERT INTO transactions (
  id,
  business_id,
  location_id,
  employee_id,
  type,
  category,
  amount,
  currency,
  description,
  transaction_date,
  payment_method,
  subtotal,
  tax_type,
  tax_rate,
  tax_amount,
  total_amount,
  is_tax_deductible,
  fiscal_period,
  created_at
)
VALUES (
  'test-trans-104',
  'test-business-001',
  'test-location-001',
  'test-employee-001',
  'expense',
  'salary',
  2500000,
  'COP',
  'Salario octubre - Laura González',
  '2025-10-01',
  'bank_transfer',
  2500000,
  'none',
  0.00,
  0,
  2500000,
  TRUE,
  '2025-10',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Gasto 5: Nómina (salario Carlos Ramírez)
INSERT INTO transactions (
  id,
  business_id,
  location_id,
  employee_id,
  type,
  category,
  amount,
  currency,
  description,
  transaction_date,
  payment_method,
  subtotal,
  tax_type,
  tax_rate,
  tax_amount,
  total_amount,
  is_tax_deductible,
  fiscal_period,
  created_at
)
VALUES (
  'test-trans-105',
  'test-business-001',
  'test-location-001',
  'test-employee-002',
  'expense',
  'salary',
  1800000,
  'COP',
  'Salario octubre - Carlos Ramírez',
  '2025-10-01',
  'bank_transfer',
  1800000,
  'none',
  0.00,
  0,
  1800000,
  TRUE,
  '2025-10',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Gasto 6: Marketing con IVA 19%
INSERT INTO transactions (
  id,
  business_id,
  location_id,
  type,
  category,
  amount,
  currency,
  description,
  transaction_date,
  payment_method,
  subtotal,
  tax_type,
  tax_rate,
  tax_amount,
  total_amount,
  is_tax_deductible,
  fiscal_period,
  created_at
)
VALUES (
  'test-trans-106',
  'test-business-001',
  'test-location-001',
  'expense',
  'marketing',
  400000,
  'COP',
  'Publicidad en redes sociales',
  '2025-10-12',
  'credit_card',
  400000,
  'iva_19',
  19.00,
  76000,
  476000,
  TRUE,
  '2025-10',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 9. RESUMEN DE VALIDACIÓN ESPERADO
-- ============================================================================

-- INGRESOS:
-- Trans 1: $50,000 + IVA 19% ($9,500) = $59,500
-- Trans 2: $35,000 + IVA 19% ($6,650) = $41,650
-- Trans 3: $45,000 + IVA 19% ($8,550) = $53,550
-- Trans 4: $80,000 + IVA 0% ($0) = $80,000
-- Trans 5: $100,000 + IVA 5% ($5,000) = $105,000
-- TOTAL INGRESOS: $310,000 (subtotal) + $29,700 (IVA) = $339,700

-- EGRESOS:
-- Trans 101: $2,000,000 (arriendo, sin IVA)
-- Trans 102: $300,000 + IVA 19% ($57,000) = $357,000
-- Trans 103: $500,000 + IVA 19% ($95,000) = $595,000
-- Trans 104: $2,500,000 (nómina)
-- Trans 105: $1,800,000 (nómina)
-- Trans 106: $400,000 + IVA 19% ($76,000) = $476,000
-- TOTAL EGRESOS: $7,500,000 (subtotal) + $228,000 (IVA) = $7,728,000

-- BALANCE:
-- Utilidad bruta: $310,000 - $7,500,000 = -$7,190,000 (pérdida en este mes de prueba)
-- IVA generado: $29,700
-- IVA descontable: $228,000
-- Saldo IVA a favor: $198,300 (crédito fiscal)

-- ICA a pagar (sobre ingresos):
-- $310,000 * 0.966% = $2,994.60 aprox $3,000

COMMIT;

-- ============================================================================
-- FIN DE SCRIPT DE DATOS DE PRUEBA
-- ============================================================================

-- NOTAS:
-- 1. Reemplazar 'owner-test-001' con un auth.uid() real antes de ejecutar
-- 2. Este script crea 11 transacciones de prueba (5 ingresos + 6 egresos)
-- 3. Validar cálculos en dashboard y reportes
-- 4. IVA generado vs IVA descontable: Verificar saldo a favor
-- 5. ICA solo aplica sobre ingresos, no sobre egresos
