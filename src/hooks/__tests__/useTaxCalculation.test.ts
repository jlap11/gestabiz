// ============================================================================
// TESTS: useTaxCalculation Hook
// Tests unitarios para cálculo de impuestos colombianos
// ============================================================================

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTaxCalculation } from '../useTaxCalculation';
import supabase from '@/lib/supabase';
import { createElement } from 'react';
import type { ReactNode } from 'react';

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

/**
 * Wrapper con QueryClientProvider para renderHook
 */
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
    },
  });

  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

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
      } as never);

      const { result } = renderHook(() => useTaxCalculation('test-business-id'), {
        wrapper: createWrapper(),
      });

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
      } as never);

      const { result } = renderHook(() => useTaxCalculation('test-business-id'), { wrapper: createWrapper() });

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
      } as never);

      const { result } = renderHook(() => useTaxCalculation('test-business-id'), { wrapper: createWrapper() });

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
      } as never);

      const { result } = renderHook(() => useTaxCalculation('test-business-id'), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.config).toBeDefined();
        expect(result.current.loading).toBe(false);
      });

      const taxes = result.current.calculateTaxes(100000, 'ica');

      expect(taxes.subtotal).toBe(100000);
      expect(taxes.ica_amount).toBe(96.6); // 100000 * 0.966 / 1000 = 96.6 (ICA se expresa por mil)
      expect(taxes.total_tax).toBe(96.6);
      expect(taxes.total_amount).toBe(100096.6);
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
      } as never);

      const { result } = renderHook(() => useTaxCalculation('test-business-id'), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.config).toBeDefined();
        expect(result.current.loading).toBe(false);
      });

      const taxes = result.current.calculateTaxes(100000, 'retention');

      expect(taxes.subtotal).toBe(100000);
      expect(taxes.retention_amount).toBe(11000); // 100000 * 11 / 100 = 11000
      expect(taxes.total_tax).toBe(0); // Retención no se suma al total_tax (solo IVA + ICA)
      expect(taxes.total_amount).toBe(89000); // 100000 + 0 - 11000 = 89000
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
      } as never);

      const { result } = renderHook(() => useTaxCalculation('test-business-id'), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.config).toBeDefined();
        expect(result.current.loading).toBe(false);
      });

      // 'none' indica que no se aplican impuestos (exento)
      const taxes = result.current.calculateTaxes(100000, 'none');

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
        ica_rate: 10.0, // 10‰ (por mil) = 1%
        retention_enabled: true,
        retention_rate: 10,
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockConfig, error: null }),
          })),
        })),
      } as never);

      const { result } = renderHook(() => useTaxCalculation('test-business-id'), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.config).toBeDefined();
        expect(result.current.loading).toBe(false);
      });

      // IVA 19% sobre 100,000
      const taxesIVA = result.current.calculateTaxes(100000, 'iva_19');
      expect(taxesIVA.iva_amount).toBe(19000);

      // ICA 10‰ (1%) sobre 100,000 = 100000 * 10 / 1000 = 1000
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
      } as never);

      const { result } = renderHook(() => useTaxCalculation('test-business-id'), { wrapper: createWrapper() });

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
      } as never);

      const { result } = renderHook(() => useTaxCalculation('test-business-id'), { wrapper: createWrapper() });

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
      } as never);

      const { result } = renderHook(() => useTaxCalculation('test-business-id'), { wrapper: createWrapper() });

      expect(result.current.loading).toBe(true);
    });

    it('retorna error si falla la carga de configuración', async () => {
      const mockError = { message: 'Database connection error', code: '42P01' }; // Código PostgreSQL de error real

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
          })),
        })),
      } as never);

      const { result } = renderHook(() => useTaxCalculation('test-business-id'), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.error?.message).toBeDefined();
      }, { timeout: 5000 });
    });
  });
});

