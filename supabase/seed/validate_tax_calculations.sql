-- ============================================================================
-- SCRIPT DE VALIDACIÓN - CÁLCULOS FISCALES COLOMBIA
-- Fecha: 13 de octubre de 2025
-- ============================================================================
-- Este script ejecuta queries de validación para verificar que los cálculos
-- de impuestos sean correctos según la legislación colombiana.
-- ============================================================================

-- ============================================================================
-- 1. VALIDACIÓN: Cálculos de IVA 19%
-- ============================================================================

SELECT 
  'Validación IVA 19%' as test_name,
  COUNT(*) as transactions_count,
  SUM(subtotal) as total_subtotal,
  SUM(tax_amount) as total_iva,
  SUM(total_amount) as total_with_iva,
  -- Validar que tax_amount = subtotal * 0.19
  CASE 
    WHEN SUM(tax_amount) = ROUND(SUM(subtotal) * 0.19, 0) 
    THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as validation_status
FROM transactions
WHERE business_id = 'test-business-001'
  AND tax_type = 'iva_19'
  AND type = 'income';

-- Resultado esperado:
-- transactions_count: 3 (trans-001, trans-002, trans-003)
-- total_subtotal: $130,000 ($50k + $35k + $45k)
-- total_iva: $24,700 ($9,500 + $6,650 + $8,550)
-- total_with_iva: $154,700
-- validation_status: ✅ PASS

-- ============================================================================
-- 2. VALIDACIÓN: Cálculos de IVA 0% (Exento)
-- ============================================================================

SELECT 
  'Validación IVA 0%' as test_name,
  COUNT(*) as transactions_count,
  SUM(subtotal) as total_subtotal,
  SUM(tax_amount) as total_iva,
  SUM(total_amount) as total_with_iva,
  CASE 
    WHEN SUM(tax_amount) = 0 AND SUM(total_amount) = SUM(subtotal)
    THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as validation_status
FROM transactions
WHERE business_id = 'test-business-001'
  AND tax_type = 'iva_0';

-- Resultado esperado:
-- transactions_count: 1 (trans-004)
-- total_subtotal: $80,000
-- total_iva: $0
-- total_with_iva: $80,000
-- validation_status: ✅ PASS

-- ============================================================================
-- 3. VALIDACIÓN: Cálculos de IVA 5%
-- ============================================================================

SELECT 
  'Validación IVA 5%' as test_name,
  COUNT(*) as transactions_count,
  SUM(subtotal) as total_subtotal,
  SUM(tax_amount) as total_iva,
  SUM(total_amount) as total_with_iva,
  CASE 
    WHEN SUM(tax_amount) = ROUND(SUM(subtotal) * 0.05, 0)
    THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as validation_status
FROM transactions
WHERE business_id = 'test-business-001'
  AND tax_type = 'iva_5';

-- Resultado esperado:
-- transactions_count: 1 (trans-005)
-- total_subtotal: $100,000
-- total_iva: $5,000
-- total_with_iva: $105,000
-- validation_status: ✅ PASS

-- ============================================================================
-- 4. VALIDACIÓN: Total IVA Generado (Ingresos)
-- ============================================================================

SELECT 
  'Total IVA Generado' as test_name,
  fiscal_period,
  COUNT(*) as income_transactions,
  SUM(subtotal) as total_base_gravable,
  SUM(tax_amount) as total_iva_generado,
  CASE 
    WHEN SUM(tax_amount) = 29700 -- $24,700 (19%) + $5,000 (5%) = $29,700
    THEN '✅ PASS'
    ELSE '❌ FAIL - Expected $29,700, Got ' || SUM(tax_amount)::text
  END as validation_status
FROM transactions
WHERE business_id = 'test-business-001'
  AND type = 'income'
  AND tax_type IN ('iva_0', 'iva_5', 'iva_19')
  AND fiscal_period = '2025-10'
GROUP BY fiscal_period;

-- ============================================================================
-- 5. VALIDACIÓN: Total IVA Descontable (Egresos)
-- ============================================================================

SELECT 
  'Total IVA Descontable' as test_name,
  fiscal_period,
  COUNT(*) as expense_transactions,
  SUM(subtotal) as total_base_gravable,
  SUM(tax_amount) as total_iva_descontable,
  CASE 
    WHEN SUM(tax_amount) = 228000 -- $57k + $95k + $76k = $228,000
    THEN '✅ PASS'
    ELSE '❌ FAIL - Expected $228,000, Got ' || SUM(tax_amount)::text
  END as validation_status
FROM transactions
WHERE business_id = 'test-business-001'
  AND type = 'expense'
  AND tax_type = 'iva_19'
  AND is_tax_deductible = TRUE
  AND fiscal_period = '2025-10'
GROUP BY fiscal_period;

-- ============================================================================
-- 6. VALIDACIÓN: Saldo de IVA (Generado - Descontable)
-- ============================================================================

WITH iva_summary AS (
  SELECT 
    fiscal_period,
    SUM(CASE WHEN type = 'income' THEN tax_amount ELSE 0 END) as iva_generado,
    SUM(CASE WHEN type = 'expense' AND is_tax_deductible = TRUE THEN tax_amount ELSE 0 END) as iva_descontable
  FROM transactions
  WHERE business_id = 'test-business-001'
    AND tax_type IN ('iva_0', 'iva_5', 'iva_19')
    AND fiscal_period = '2025-10'
  GROUP BY fiscal_period
)
SELECT 
  'Saldo de IVA' as test_name,
  fiscal_period,
  iva_generado,
  iva_descontable,
  (iva_generado - iva_descontable) as saldo_iva,
  CASE 
    WHEN (iva_generado - iva_descontable) < 0 THEN 'Saldo a favor (crédito fiscal)'
    WHEN (iva_generado - iva_descontable) > 0 THEN 'IVA a pagar'
    ELSE 'Sin saldo'
  END as status,
  CASE 
    WHEN (iva_generado - iva_descontable) = -198300 -- $29,700 - $228,000 = -$198,300
    THEN '✅ PASS'
    ELSE '❌ FAIL - Expected -$198,300, Got ' || (iva_generado - iva_descontable)::text
  END as validation_status
FROM iva_summary;

-- Resultado esperado:
-- iva_generado: $29,700
-- iva_descontable: $228,000
-- saldo_iva: -$198,300 (a favor del contribuyente)
-- status: Saldo a favor (crédito fiscal)

-- ============================================================================
-- 7. VALIDACIÓN: Cálculo de ICA (Bogotá 0.966%)
-- ============================================================================

SELECT 
  'Cálculo ICA Bogotá' as test_name,
  fiscal_period,
  COUNT(*) as income_transactions,
  SUM(subtotal) as total_ingresos_gravables,
  ROUND(SUM(subtotal) * 0.00966, 0) as ica_calculado,
  CASE 
    WHEN ROUND(SUM(subtotal) * 0.00966, 0) BETWEEN 2900 AND 3100 -- Aproximadamente $3,000
    THEN '✅ PASS'
    ELSE '❌ FAIL - Expected ~$3,000, Got ' || ROUND(SUM(subtotal) * 0.00966, 0)::text
  END as validation_status
FROM transactions
WHERE business_id = 'test-business-001'
  AND type = 'income'
  AND fiscal_period = '2025-10'
GROUP BY fiscal_period;

-- Resultado esperado:
-- total_ingresos_gravables: $310,000
-- ica_calculado: $2,995 (aprox $3,000)
-- validation_status: ✅ PASS

-- ============================================================================
-- 8. VALIDACIÓN: Total Ingresos vs Total Egresos
-- ============================================================================

WITH monthly_summary AS (
  SELECT 
    fiscal_period,
    SUM(CASE WHEN type = 'income' THEN total_amount ELSE 0 END) as total_ingresos,
    SUM(CASE WHEN type = 'expense' THEN total_amount ELSE 0 END) as total_egresos,
    SUM(CASE WHEN type = 'income' THEN total_amount ELSE 0 END) - 
    SUM(CASE WHEN type = 'expense' THEN total_amount ELSE 0 END) as utilidad_neta
  FROM transactions
  WHERE business_id = 'test-business-001'
    AND fiscal_period = '2025-10'
  GROUP BY fiscal_period
)
SELECT 
  'Balance Mensual' as test_name,
  fiscal_period,
  total_ingresos,
  total_egresos,
  utilidad_neta,
  CASE 
    WHEN total_ingresos = 339700 AND total_egresos = 7728000
    THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as validation_status
FROM monthly_summary;

-- Resultado esperado:
-- total_ingresos: $339,700
-- total_egresos: $7,728,000
-- utilidad_neta: -$7,388,300 (pérdida en este mes de prueba)

-- ============================================================================
-- 9. VALIDACIÓN: Transacciones sin impuestos (none)
-- ============================================================================

SELECT 
  'Transacciones sin impuestos' as test_name,
  COUNT(*) as transactions_count,
  SUM(subtotal) as total_subtotal,
  SUM(tax_amount) as total_tax,
  CASE 
    WHEN SUM(tax_amount) = 0 
    THEN '✅ PASS'
    ELSE '❌ FAIL - Tax amount should be 0'
  END as validation_status
FROM transactions
WHERE business_id = 'test-business-001'
  AND tax_type = 'none';

-- Resultado esperado:
-- transactions_count: 3 (trans-101, trans-104, trans-105)
-- total_subtotal: $6,300,000 ($2M arriendo + $2.5M + $1.8M nóminas)
-- total_tax: $0

-- ============================================================================
-- 10. VALIDACIÓN: Desglose por categoría
-- ============================================================================

SELECT 
  'Desglose por categoría' as test_name,
  category,
  type,
  COUNT(*) as count,
  SUM(subtotal) as subtotal_sum,
  SUM(tax_amount) as tax_sum,
  SUM(total_amount) as total_sum
FROM transactions
WHERE business_id = 'test-business-001'
  AND fiscal_period = '2025-10'
GROUP BY category, type
ORDER BY type, category;

-- ============================================================================
-- 11. RESUMEN EJECUTIVO
-- ============================================================================

WITH summary AS (
  SELECT 
    'OCTUBRE 2025' as periodo,
    
    -- Ingresos
    (SELECT SUM(subtotal) FROM transactions 
     WHERE business_id = 'test-business-001' AND type = 'income' AND fiscal_period = '2025-10') 
    as ingresos_subtotal,
    
    (SELECT SUM(tax_amount) FROM transactions 
     WHERE business_id = 'test-business-001' AND type = 'income' AND fiscal_period = '2025-10') 
    as iva_generado,
    
    (SELECT SUM(total_amount) FROM transactions 
     WHERE business_id = 'test-business-001' AND type = 'income' AND fiscal_period = '2025-10') 
    as ingresos_total,
    
    -- Egresos
    (SELECT SUM(subtotal) FROM transactions 
     WHERE business_id = 'test-business-001' AND type = 'expense' AND fiscal_period = '2025-10') 
    as egresos_subtotal,
    
    (SELECT SUM(tax_amount) FROM transactions 
     WHERE business_id = 'test-business-001' AND type = 'expense' AND is_tax_deductible = TRUE AND fiscal_period = '2025-10') 
    as iva_descontable,
    
    (SELECT SUM(total_amount) FROM transactions 
     WHERE business_id = 'test-business-001' AND type = 'expense' AND fiscal_period = '2025-10') 
    as egresos_total
)
SELECT 
  '📊 RESUMEN EJECUTIVO' as report,
  periodo,
  '--- INGRESOS ---' as separator1,
  ingresos_subtotal,
  iva_generado,
  ingresos_total,
  '--- EGRESOS ---' as separator2,
  egresos_subtotal,
  iva_descontable,
  egresos_total,
  '--- BALANCE ---' as separator3,
  (ingresos_total - egresos_total) as utilidad_neta,
  (iva_generado - iva_descontable) as saldo_iva,
  ROUND(ingresos_subtotal * 0.00966, 0) as ica_estimado,
  '--- VALIDACIÓN ---' as separator4,
  CASE 
    WHEN ingresos_total = 339700 
     AND egresos_total = 7728000 
     AND (iva_generado - iva_descontable) = -198300
    THEN '✅ TODOS LOS CÁLCULOS SON CORRECTOS'
    ELSE '❌ HAY ERRORES EN LOS CÁLCULOS'
  END as validation_final
FROM summary;

-- ============================================================================
-- FIN DE SCRIPT DE VALIDACIÓN
-- ============================================================================

-- INSTRUCCIONES:
-- 1. Ejecutar este script después de ejecutar colombia_test_data.sql
-- 2. Verificar que todas las validaciones muestren "✅ PASS"
-- 3. Revisar el resumen ejecutivo al final
-- 4. Si hay errores, revisar los cálculos en colombiaTaxes.ts

-- VALORES ESPERADOS FINALES:
-- ✅ IVA Generado: $29,700
-- ✅ IVA Descontable: $228,000
-- ✅ Saldo IVA: -$198,300 (a favor)
-- ✅ ICA: ~$3,000
-- ✅ Ingresos Totales: $339,700
-- ✅ Egresos Totales: $7,728,000
-- ✅ Utilidad Neta: -$7,388,300
