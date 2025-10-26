import { describe, it, expect } from 'vitest';
import {
  calculateIVA,
  calculateICA,
  calculateRetention,
  calculateAllTaxes,
  IVA_RATES,
  getICARate,
  formatCOP,
} from '@/lib/accounting/colombiaTaxes';

describe('Sistema Contable Colombia - Validación de Cálculos Fiscales', () => {
  // ============================================================================
  // 1. VALIDACIÓN IVA 19% (General)
  // ============================================================================
  describe('IVA 19% (General)', () => {
    it('debe calcular IVA 19% correctamente para $50,000', () => {
      const subtotal = 50000;
      const iva = calculateIVA(subtotal, 'iva_19');
      
      expect(iva).toBe(9500); // $50,000 * 0.19 = $9,500
    });

    it('debe calcular IVA 19% correctamente para $35,000', () => {
      const subtotal = 35000;
      const iva = calculateIVA(subtotal, 'iva_19');
      
      expect(iva).toBe(6650); // $35,000 * 0.19 = $6,650
    });

    it('debe calcular IVA 19% correctamente para $45,000', () => {
      const subtotal = 45000;
      const iva = calculateIVA(subtotal, 'iva_19');
      
      expect(iva).toBe(8550); // $45,000 * 0.19 = $8,550
    });

    it('debe sumar total con IVA correctamente', () => {
      const subtotal = 100000;
      const iva = calculateIVA(subtotal, 'iva_19');
      const total = subtotal + iva;
      
      expect(total).toBe(119000); // $100,000 + $19,000 = $119,000
    });
  });

  // ============================================================================
  // 2. VALIDACIÓN IVA 0% (Exento)
  // ============================================================================
  describe('IVA 0% (Exento)', () => {
    it('debe calcular IVA 0% sin impuesto', () => {
      const subtotal = 80000;
      const iva = calculateIVA(subtotal, 'iva_0');
      
      expect(iva).toBe(0);
    });

    it('total debe ser igual al subtotal con IVA 0%', () => {
      const subtotal = 80000;
      const iva = calculateIVA(subtotal, 'iva_0');
      const total = subtotal + iva;
      
      expect(total).toBe(subtotal);
    });
  });

  // ============================================================================
  // 3. VALIDACIÓN IVA 5% (Reducido)
  // ============================================================================
  describe('IVA 5% (Reducido)', () => {
    it('debe calcular IVA 5% correctamente para $100,000', () => {
      const subtotal = 100000;
      const iva = calculateIVA(subtotal, 'iva_5');
      
      expect(iva).toBe(5000); // $100,000 * 0.05 = $5,000
    });

    it('debe sumar total con IVA 5% correctamente', () => {
      const subtotal = 100000;
      const iva = calculateIVA(subtotal, 'iva_5');
      const total = subtotal + iva;
      
      expect(total).toBe(105000);
    });
  });

  // ============================================================================
  // 4. VALIDACIÓN ICA (Bogotá 0.966%)
  // ============================================================================
  describe('ICA Bogotá', () => {
    it('debe calcular ICA de Bogotá correctamente', () => {
      const subtotal = 310000; // Total ingresos del mes de prueba
      const icaRate = 0.966;
      const ica = calculateICA(subtotal, icaRate);
      
      // $310,000 * 0.00966 = $2,994.60 ≈ $2,995
      expect(ica).toBeCloseTo(2995, 0);
    });

    it('debe obtener tasa de ICA por código DANE de Bogotá', () => {
      const icaRate = getICARate('11001'); // Bogotá
      
      expect(icaRate).toBe(0.966);
    });

    it('debe obtener tasa de ICA por código DANE de Medellín', () => {
      const icaRate = getICARate('05001'); // Medellín
      
      expect(icaRate).toBe(1.0);
    });

    it('debe retornar 0 para código DANE no encontrado', () => {
      const icaRate = getICARate('99999'); // No existe
      
      expect(icaRate).toBe(0);
    });
  });

  // ============================================================================
  // 5. VALIDACIÓN RETENCIÓN EN LA FUENTE
  // ============================================================================
  describe('Retención en la Fuente', () => {
    it('debe calcular retención 2% correctamente', () => {
      const subtotal = 100000;
      const retentionRate = 2.0;
      const retention = calculateRetention(subtotal, retentionRate);
      
      expect(retention).toBe(2000); // $100,000 * 0.02 = $2,000
    });

    it('debe calcular retención 11% para consultoría', () => {
      const subtotal = 1000000;
      const retentionRate = 11.0;
      const retention = calculateRetention(subtotal, retentionRate);
      
      expect(retention).toBe(110000); // $1,000,000 * 0.11 = $110,000
    });
  });

  // ============================================================================
  // 6. VALIDACIÓN calculateAllTaxes (Función completa)
  // ============================================================================
  describe('calculateAllTaxes - Cálculos Completos', () => {
    it('debe calcular todos los impuestos con IVA 19%', () => {
      const subtotal = 50000;
      const result = calculateAllTaxes(subtotal, 'iva_19', 0, 0);
      
      expect(result.subtotal).toBe(50000);
      expect(result.iva_amount).toBe(9500);
      expect(result.ica_amount).toBe(0);
      expect(result.retention_amount).toBe(0);
      expect(result.total_tax).toBe(9500);
      expect(result.total_amount).toBe(59500);
    });

    it('debe calcular IVA + ICA juntos', () => {
      const subtotal = 100000;
      const icaRate = 0.966;
      const result = calculateAllTaxes(subtotal, 'iva_19', icaRate, 0);
      
      expect(result.subtotal).toBe(100000);
      expect(result.iva_amount).toBe(19000);
      expect(result.ica_amount).toBeCloseTo(966, 0);
      expect(result.total_tax).toBeCloseTo(19966, 0);
      expect(result.total_amount).toBeCloseTo(119966, 0);
    });

    it('debe calcular IVA + retención (resta del total)', () => {
      const subtotal = 100000;
      const retentionRate = 2.0;
      const result = calculateAllTaxes(subtotal, 'iva_19', 0, retentionRate);
      
      expect(result.subtotal).toBe(100000);
      expect(result.iva_amount).toBe(19000);
      expect(result.retention_amount).toBe(2000);
      expect(result.total_tax).toBe(19000); // Retención no se suma al tax
      expect(result.total_amount).toBe(117000); // 100k + 19k - 2k
    });

    it('debe calcular con IVA 0% sin impuestos', () => {
      const subtotal = 80000;
      const result = calculateAllTaxes(subtotal, 'iva_0', 0, 0);
      
      expect(result.subtotal).toBe(80000);
      expect(result.iva_amount).toBe(0);
      expect(result.total_tax).toBe(0);
      expect(result.total_amount).toBe(80000);
    });

    it('debe calcular con IVA 5%', () => {
      const subtotal = 100000;
      const result = calculateAllTaxes(subtotal, 'iva_5', 0, 0);
      
      expect(result.subtotal).toBe(100000);
      expect(result.iva_amount).toBe(5000);
      expect(result.total_tax).toBe(5000);
      expect(result.total_amount).toBe(105000);
    });
  });

  // ============================================================================
  // 7. VALIDACIÓN ESCENARIOS DATOS DE PRUEBA
  // ============================================================================
  describe('Escenarios de Datos de Prueba', () => {
    it('Trans 1: Corte de cabello $50,000 + IVA 19%', () => {
      const result = calculateAllTaxes(50000, 'iva_19', 0, 0);
      
      expect(result.total_amount).toBe(59500);
    });

    it('Trans 2: Manicure $35,000 + IVA 19%', () => {
      const result = calculateAllTaxes(35000, 'iva_19', 0, 0);
      
      expect(result.total_amount).toBe(41650);
    });

    it('Trans 3: Shampoo $45,000 + IVA 19%', () => {
      const result = calculateAllTaxes(45000, 'iva_19', 0, 0);
      
      expect(result.total_amount).toBe(53550);
    });

    it('Trans 4: Tratamiento $80,000 + IVA 0%', () => {
      const result = calculateAllTaxes(80000, 'iva_0', 0, 0);
      
      expect(result.total_amount).toBe(80000);
    });

    it('Trans 5: Productos $100,000 + IVA 5%', () => {
      const result = calculateAllTaxes(100000, 'iva_5', 0, 0);
      
      expect(result.total_amount).toBe(105000);
    });

    it('Trans 102: Servicios públicos $300,000 + IVA 19%', () => {
      const result = calculateAllTaxes(300000, 'iva_19', 0, 0);
      
      expect(result.total_amount).toBe(357000);
    });

    it('Trans 103: Insumos $500,000 + IVA 19%', () => {
      const result = calculateAllTaxes(500000, 'iva_19', 0, 0);
      
      expect(result.total_amount).toBe(595000);
    });

    it('Trans 106: Marketing $400,000 + IVA 19%', () => {
      const result = calculateAllTaxes(400000, 'iva_19', 0, 0);
      
      expect(result.total_amount).toBe(476000);
    });
  });

  // ============================================================================
  // 8. VALIDACIÓN TOTALES AGREGADOS
  // ============================================================================
  describe('Validación Totales Agregados', () => {
    it('debe sumar IVA generado total (ingresos)', () => {
      const trans1 = calculateAllTaxes(50000, 'iva_19', 0, 0);
      const trans2 = calculateAllTaxes(35000, 'iva_19', 0, 0);
      const trans3 = calculateAllTaxes(45000, 'iva_19', 0, 0);
      const trans4 = calculateAllTaxes(80000, 'iva_0', 0, 0);
      const trans5 = calculateAllTaxes(100000, 'iva_5', 0, 0);
      
      const totalIVA = trans1.iva_amount + trans2.iva_amount + 
                       trans3.iva_amount + trans4.iva_amount + trans5.iva_amount;
      
      expect(totalIVA).toBe(29700); // $9,500 + $6,650 + $8,550 + $0 + $5,000
    });

    it('debe sumar IVA descontable total (egresos)', () => {
      const trans102 = calculateAllTaxes(300000, 'iva_19', 0, 0);
      const trans103 = calculateAllTaxes(500000, 'iva_19', 0, 0);
      const trans106 = calculateAllTaxes(400000, 'iva_19', 0, 0);
      
      const totalIVA = trans102.iva_amount + trans103.iva_amount + trans106.iva_amount;
      
      expect(totalIVA).toBe(228000); // $57,000 + $95,000 + $76,000
    });

    it('debe calcular saldo de IVA (generado - descontable)', () => {
      const ivaGenerado = 29700;
      const ivaDescontable = 228000;
      const saldoIVA = ivaGenerado - ivaDescontable;
      
      expect(saldoIVA).toBe(-198300); // Saldo a favor del contribuyente
    });

    it('debe calcular ICA sobre ingresos totales', () => {
      const totalIngresos = 310000; // Suma de todos los subtotales de ingresos
      const ica = calculateICA(totalIngresos, 0.966);
      
      expect(ica).toBeCloseTo(2995, 0); // ~$3,000
    });
  });

  // ============================================================================
  // 9. VALIDACIÓN FORMATO DE MONEDA
  // ============================================================================
  describe('Formato de Moneda Colombiano', () => {
    it('debe formatear $59,500 correctamente', () => {
      const formatted = formatCOP(59500);
      
      // En es-CO, el formato usa punto como separador de miles: $ 59.500
      expect(formatted).toContain('59');
      expect(formatted).toContain('500');
      expect(formatted).toContain('$'); // Símbolo de peso
    });

    it('debe formatear $119,000 sin decimales', () => {
      const formatted = formatCOP(119000);
      
      expect(formatted).toContain('119');
      expect(formatted).toContain('000');
      expect(formatted).not.toContain(',00'); // Sin decimales en COP
    });

    it('debe formatear números negativos', () => {
      const formatted = formatCOP(-198300);
      
      expect(formatted).toContain('198');
      expect(formatted).toContain('300');
      expect(formatted).toContain('-'); // Signo negativo
    });
  });

  // ============================================================================
  // 10. VALIDACIÓN TASAS CONSTANTES
  // ============================================================================
  describe('Validación de Tasas Constantes', () => {
    it('debe tener tasas de IVA correctas', () => {
      expect(IVA_RATES.iva_0).toBe(0);
      expect(IVA_RATES.iva_5).toBe(5);
      expect(IVA_RATES.iva_19).toBe(19);
    });

    it('debe retornar 0 para tipo de impuesto "none"', () => {
      const iva = calculateIVA(100000, 'none');
      expect(iva).toBe(0);
    });

    it('debe retornar 0 para tipo de impuesto "ica"', () => {
      const iva = calculateIVA(100000, 'ica');
      expect(iva).toBe(0);
    });

    it('debe retornar 0 para tipo de impuesto "retention"', () => {
      const iva = calculateIVA(100000, 'retention');
      expect(iva).toBe(0);
    });
  });

  // ============================================================================
  // 11. VALIDACIÓN CASOS EDGE
  // ============================================================================
  describe('Casos Edge', () => {
    it('debe manejar monto 0', () => {
      const result = calculateAllTaxes(0, 'iva_19', 0, 0);
      
      expect(result.total_amount).toBe(0);
    });

    it('debe manejar montos decimales', () => {
      const result = calculateAllTaxes(50000.50, 'iva_19', 0, 0);
      
      // $50,000.50 * 0.19 = $9,500.095 ≈ $9,500.09 (redondeo a 2 decimales)
      expect(result.iva_amount).toBeCloseTo(9500.09, 2);
    });

    it('debe redondear correctamente a 2 decimales', () => {
      const subtotal = 33333.33;
      const result = calculateAllTaxes(subtotal, 'iva_19', 0, 0);
      
      // Debe redondear a 2 decimales
      expect(result.iva_amount).toBeCloseTo(6333.33, 2);
    });
  });
});

// ============================================================================
// RESUMEN ESPERADO DE TESTS
// ============================================================================
// Total de tests: ~50
// Cobertura:
// - IVA 0%, 5%, 19%
// - ICA por ciudades
// - Retención en la fuente
// - calculateAllTaxes (función completa)
// - Escenarios de datos de prueba
// - Totales agregados
// - Formato de moneda
// - Tasas constantes
// - Casos edge
