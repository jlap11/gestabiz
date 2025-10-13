// ============================================================================
// TESTS: useTaxCalculation Hook
// Tests unitarios para cálculo de impuestos colombianos
// ============================================================================

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTaxCalculation } from '../useTaxCalculation';
import supabase from '@/lib/supabase';

// Mock de Supabase
vi.mock('@/lib/supabase', () => ({
  default: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}));

describe('useTaxCalculation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateTaxes', () => {
    it('calcula IVA 0% correctamente', async () => {
      // Mock configuración
      const mockConfig = {
        iva_enabled: true,
        iva_rate: 0,
        ica_enabled: false,
        retention_enabled: false,
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockConfig, error: null }),
          })),
        })),
      } as any);

      const { result } = renderHook(() => useTaxCalculation('test-business-id'));

      await waitFor(() => {
        expect(result.current.config).toBeDefined();
      });

      const taxes = result.current.calculateTaxes(100000, 'iva_0');

      expect(taxes.subtotal).toBe(100000);
      expect(taxes.iva_amount).toBe(0);
      expect(taxes.total_tax).toBe(0);
      expect(taxes.total_amount).toBe(100000);
    });

    it('calcula IVA 5% correctamente', async () => {
      const mockConfig = {
        iva_enabled: true,
        iva_rate: 5,
        ica_enabled: false,
        retention_enabled: false,
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockConfig, error: null }),
          })),
        })),
      } as any);

      const { result } = renderHook(() => useTaxCalculation('test-business-id'));

      await waitFor(() => {
        expect(result.current.config).toBeDefined();
      });

      const taxes = result.current.calculateTaxes(100000, 'iva_5');

      expect(taxes.subtotal).toBe(100000);
      expect(taxes.iva_amount).toBe(5000);
      expect(taxes.total_tax).toBe(5000);
      expect(taxes.total_amount).toBe(105000);
    });

    it('calcula IVA 19% correctamente', async () => {
      const mockConfig = {
        iva_enabled: true,
        iva_rate: 19,
        ica_enabled: false,
        retention_enabled: false,
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockConfig, error: null }),
          })),
        })),
      } as any);

      const { result } = renderHook(() => useTaxCalculation('test-business-id'));

      await waitFor(() => {
        expect(result.current.config).toBeDefined();
      });

      const taxes = result.current.calculateTaxes(100000, 'iva_19');

      expect(taxes.subtotal).toBe(100000);
      expect(taxes.iva_amount).toBe(19000);
      expect(taxes.total_tax).toBe(19000);
      expect(taxes.total_amount).toBe(119000);
    });

    it('calcula ICA correctamente (Bogotá 0.966%)', async () => {
      const mockConfig = {
        iva_enabled: false,
        ica_enabled: true,
        ica_rate: 0.966,
        retention_enabled: false,
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockConfig, error: null }),
          })),
        })),
      } as any);

      const { result } = renderHook(() => useTaxCalculation('test-business-id'));

      await waitFor(() => {
        expect(result.current.config).toBeDefined();
      });

      const taxes = result.current.calculateTaxes(100000, 'ica');

      expect(taxes.subtotal).toBe(100000);
      expect(taxes.ica_amount).toBe(966); // 100000 * 0.00966
      expect(taxes.total_tax).toBe(966);
      expect(taxes.total_amount).toBe(100966);
    });

    it('calcula Retención correctamente (Profesional 11%)', async () => {
      const mockConfig = {
        iva_enabled: false,
        ica_enabled: false,
        retention_enabled: true,
        retention_rate: 11,
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockConfig, error: null }),
          })),
        })),
      } as any);

      const { result } = renderHook(() => useTaxCalculation('test-business-id'));

      await waitFor(() => {
        expect(result.current.config).toBeDefined();
      });

      const taxes = result.current.calculateTaxes(100000, 'retention');

      expect(taxes.subtotal).toBe(100000);
      expect(taxes.retention_amount).toBe(11000);
      expect(taxes.total_tax).toBe(11000);
      expect(taxes.total_amount).toBe(111000);
    });

    it('retorna 0 para tipo exento', async () => {
      const mockConfig = {
        iva_enabled: true,
        iva_rate: 19,
        ica_enabled: true,
        ica_rate: 0.966,
        retention_enabled: true,
        retention_rate: 11,
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockConfig, error: null }),
          })),
        })),
      } as any);

      const { result } = renderHook(() => useTaxCalculation('test-business-id'));

      await waitFor(() => {
        expect(result.current.config).toBeDefined();
      });

      const taxes = result.current.calculateTaxes(100000, 'exempt');

      expect(taxes.subtotal).toBe(100000);
      expect(taxes.iva_amount).toBe(0);
      expect(taxes.ica_amount).toBe(0);
      expect(taxes.retention_amount).toBe(0);
      expect(taxes.total_tax).toBe(0);
      expect(taxes.total_amount).toBe(100000);
    });

    it('calcula múltiples impuestos combinados', async () => {
      const mockConfig = {
        iva_enabled: true,
        iva_rate: 19,
        ica_enabled: true,
        ica_rate: 1.0,
        retention_enabled: true,
        retention_rate: 10,
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockConfig, error: null }),
          })),
        })),
      } as any);

      const { result } = renderHook(() => useTaxCalculation('test-business-id'));

      await waitFor(() => {
        expect(result.current.config).toBeDefined();
      });

      // IVA 19% sobre 100,000
      const taxesIVA = result.current.calculateTaxes(100000, 'iva_19');
      expect(taxesIVA.iva_amount).toBe(19000);

      // ICA 1% sobre 100,000
      const taxesICA = result.current.calculateTaxes(100000, 'ica');
      expect(taxesICA.ica_amount).toBe(1000);

      // Retención 10% sobre 100,000
      const taxesRet = result.current.calculateTaxes(100000, 'retention');
      expect(taxesRet.retention_amount).toBe(10000);
    });

    it('maneja subtotal 0', async () => {
      const mockConfig = {
        iva_enabled: true,
        iva_rate: 19,
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockConfig, error: null }),
          })),
        })),
      } as any);

      const { result } = renderHook(() => useTaxCalculation('test-business-id'));

      await waitFor(() => {
        expect(result.current.config).toBeDefined();
      });

      const taxes = result.current.calculateTaxes(0, 'iva_19');

      expect(taxes.subtotal).toBe(0);
      expect(taxes.iva_amount).toBe(0);
      expect(taxes.total_tax).toBe(0);
      expect(taxes.total_amount).toBe(0);
    });

    it('redondea correctamente a 2 decimales', async () => {
      const mockConfig = {
        iva_enabled: true,
        iva_rate: 19,
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockConfig, error: null }),
          })),
        })),
      } as any);

      const { result } = renderHook(() => useTaxCalculation('test-business-id'));

      await waitFor(() => {
        expect(result.current.config).toBeDefined();
      });

      // Subtotal con decimales
      const taxes = result.current.calculateTaxes(100000.33, 'iva_19');

      expect(taxes.iva_amount).toBe(19000.06); // 19% de 100000.33
      expect(taxes.total_amount).toBe(119000.39);
    });
  });

  describe('loading y error states', () => {
    it('retorna loading=true mientras carga configuración', () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockReturnValue(new Promise(() => {})), // Never resolves
          })),
        })),
      } as any);

      const { result } = renderHook(() => useTaxCalculation('test-business-id'));

      expect(result.current.loading).toBe(true);
    });

    it('retorna error si falla la carga de configuración', async () => {
      const mockError = new Error('Database error');

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
          })),
        })),
      } as any);

      const { result } = renderHook(() => useTaxCalculation('test-business-id'));

      await waitFor(() => {
        expect(result.current.error).toBe(mockError);
      });
    });
  });
});
