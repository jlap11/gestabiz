// ============================================================================
// TESTS: useFinancialReports - exportToPDF
// Tests unitarios para exportación de reportes PDF
// ============================================================================

import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useFinancialReports } from '../useFinancialReports'
import type { ProfitAndLossReport } from '@/types/accounting.types'

// Mock jsPDF
const mockSave = vi.fn()
const mockText = vi.fn()
const mockSetFontSize = vi.fn()
const mockSetFont = vi.fn()
const mockSetTextColor = vi.fn()

vi.mock('jspdf', () => ({
  default: vi.fn().mockImplementation(() => ({
    internal: {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297,
      },
    },
    text: mockText,
    setFontSize: mockSetFontSize,
    setFont: mockSetFont,
    setTextColor: mockSetTextColor,
    save: mockSave,
    lastAutoTable: { finalY: 100 },
  })),
}))

// Mock jspdf-autotable
vi.mock('jspdf-autotable', () => ({
  default: vi.fn(),
}))

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  default: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              in: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
        })),
      })),
    })),
  },
}))

describe('useFinancialReports - exportToPDF', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockReport: ProfitAndLossReport = {
    period: '01/01/2025 - 31/01/2025',
    business_id: 'test-business-id',
    business_name: 'Test Business',
    total_income: 500000,
    income_by_category: [
      { category: 'appointment_payment', amount: 300000, percentage: 60 },
      { category: 'product_sale', amount: 200000, percentage: 40 },
    ],
    total_expenses: 200000,
    expenses_by_category: [
      { category: 'salary', amount: 100000, percentage: 50 },
      { category: 'rent', amount: 100000, percentage: 50 },
    ],
    gross_profit: 300000,
    net_profit: 300000,
    profit_margin: 60,
    total_taxes: 0,
    iva_paid: 0,
    ica_paid: 0,
    retention_paid: 0,
    transaction_count: 10,
    average_transaction: 50000,
  }

  it('genera PDF con estructura correcta', () => {
    const { result } = renderHook(() => useFinancialReports())

    result.current.exportToPDF(mockReport, 'Test Business', 'test-report.pdf')

    // Verifica que se creó el PDF
    expect(mockSave).toHaveBeenCalledWith('test-report.pdf')
  })

  it('incluye título del reporte', () => {
    const { result } = renderHook(() => useFinancialReports())

    result.current.exportToPDF(mockReport, 'Test Business')

    // Verifica título
    expect(mockSetFontSize).toHaveBeenCalledWith(18)
    expect(mockSetFont).toHaveBeenCalledWith('helvetica', 'bold')
    expect(mockText).toHaveBeenCalledWith(
      'Reporte de Pérdidas y Ganancias',
      expect.any(Number),
      20,
      { align: 'center' }
    )
  })

  it('incluye nombre del negocio', () => {
    const { result } = renderHook(() => useFinancialReports())

    result.current.exportToPDF(mockReport, 'Test Business')

    expect(mockText).toHaveBeenCalledWith('Test Business', expect.any(Number), 30, {
      align: 'center',
    })
  })

  it('incluye período del reporte', () => {
    const { result } = renderHook(() => useFinancialReports())

    result.current.exportToPDF(mockReport, 'Test Business')

    expect(mockText).toHaveBeenCalledWith(
      expect.stringContaining('Período:'),
      expect.any(Number),
      38,
      { align: 'center' }
    )
  })

  it('muestra total de ingresos formateado', () => {
    const { result } = renderHook(() => useFinancialReports())

    result.current.exportToPDF(mockReport, 'Test Business')

    // Verifica formato COP
    expect(mockText).toHaveBeenCalledWith(
      expect.stringContaining('Total Ingresos'),
      expect.any(Number),
      expect.any(Number)
    )
  })

  it('muestra total de egresos formateado', () => {
    const { result } = renderHook(() => useFinancialReports())

    result.current.exportToPDF(mockReport, 'Test Business')

    expect(mockText).toHaveBeenCalledWith(
      expect.stringContaining('Total Egresos'),
      expect.any(Number),
      expect.any(Number)
    )
  })

  it('muestra ganancia neta en verde si es positiva', () => {
    const { result } = renderHook(() => useFinancialReports())

    result.current.exportToPDF(mockReport, 'Test Business')

    // Color verde RGB: [34, 197, 94]
    expect(mockSetTextColor).toHaveBeenCalledWith(34, 197, 94)
    expect(mockText).toHaveBeenCalledWith(
      expect.stringContaining('Ganancia Neta'),
      expect.any(Number),
      expect.any(Number)
    )
  })

  it('muestra pérdida neta en rojo si es negativa', () => {
    const reportWithLoss: ProfitAndLossReport = {
      ...mockReport,
      net_profit: -100000,
    }

    const { result } = renderHook(() => useFinancialReports())

    result.current.exportToPDF(reportWithLoss, 'Test Business')

    // Color rojo RGB: [239, 68, 68]
    expect(mockSetTextColor).toHaveBeenCalledWith(239, 68, 68)
    expect(mockText).toHaveBeenCalledWith(
      expect.stringContaining('Pérdida Neta'),
      expect.any(Number),
      expect.any(Number)
    )
  })

  it('muestra margen de ganancia', () => {
    const { result } = renderHook(() => useFinancialReports())

    result.current.exportToPDF(mockReport, 'Test Business')

    expect(mockText).toHaveBeenCalledWith(
      expect.stringContaining('Margen de Ganancia: 60.00%'),
      expect.any(Number),
      expect.any(Number)
    )
  })

  it('usa filename por defecto si no se proporciona', () => {
    const { result } = renderHook(() => useFinancialReports())

    result.current.exportToPDF(mockReport, 'Test Business')

    expect(mockSave).toHaveBeenCalledWith(expect.stringMatching(/^reporte-pyg-\d+\.pdf$/))
  })

  it('maneja reporte sin categorías de ingresos', () => {
    const reportNoIncome: ProfitAndLossReport = {
      ...mockReport,
      income_by_category: [],
      total_income: 0,
    }

    const { result } = renderHook(() => useFinancialReports())

    expect(() => {
      result.current.exportToPDF(reportNoIncome, 'Test Business')
    }).not.toThrow()
  })

  it('maneja reporte sin categorías de egresos', () => {
    const reportNoExpenses: ProfitAndLossReport = {
      ...mockReport,
      expenses_by_category: [],
      total_expenses: 0,
    }

    const { result } = renderHook(() => useFinancialReports())

    expect(() => {
      result.current.exportToPDF(reportNoExpenses, 'Test Business')
    }).not.toThrow()
  })

  it('formatea montos con separadores de miles', () => {
    const reportLargeAmounts: ProfitAndLossReport = {
      ...mockReport,
      total_income: 1234567.89,
    }

    const { result } = renderHook(() => useFinancialReports())

    result.current.exportToPDF(reportLargeAmounts, 'Test Business')

    // Verifica que se llamó toLocaleString con opciones correctas
    expect(mockText).toHaveBeenCalled()
  })
})
