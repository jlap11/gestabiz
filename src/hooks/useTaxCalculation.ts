// ============================================================================
// HOOK: useTaxCalculation
// Maneja cálculos fiscales y configuración tributaria
// OPTIMIZADO con caché (1 hora TTL) y memoización
// ============================================================================

import { useCallback } from 'react'
import { TaxCalculation, TaxType } from '@/types/accounting.types'
import { calculateAllTaxes } from '@/lib/accounting/colombiaTaxes'
import { useBusinessTaxConfig } from './useBusinessTaxConfig'

interface UseTaxCalculationReturn {
  config: ReturnType<typeof useBusinessTaxConfig>['config']
  loading: boolean
  error: Error | null
  calculateTaxes: (subtotal: number, taxType: TaxType) => TaxCalculation
  updateConfig: ReturnType<typeof useBusinessTaxConfig>['updateConfig']
}

export function useTaxCalculation(businessId: string): UseTaxCalculationReturn {
  // Usar hook con caché (1 hora TTL)
  const { config, loading, error, updateConfig } = useBusinessTaxConfig(businessId)

  // Calcular impuestos para una transacción (MEMOIZADO)
  const calculateTaxes = useCallback(
    (subtotal: number, taxType: TaxType): TaxCalculation => {
      const icaRate = config?.ica_rate || 0
      const retentionRate = config?.retention_rate || 0

      return calculateAllTaxes(subtotal, taxType, icaRate, retentionRate)
    },
    [config]
  )

  return {
    config,
    loading,
    error,
    calculateTaxes,
    updateConfig,
  }
}
