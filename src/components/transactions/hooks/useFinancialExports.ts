import { useCallback } from 'react'
import { toast } from 'sonner'
import { useLanguage } from '@/contexts/LanguageContext'
import { useFinancialReports } from '@/hooks/useFinancialReports'

interface UseFinancialExportsProps {
  businessId: string
  reportFilters: any
  chartData: any
  reportData: any
}

export function useFinancialExports({ 
  businessId, 
  reportFilters, 
  chartData, 
  reportData 
}: UseFinancialExportsProps) {
  const { t } = useLanguage()
  const { generateProfitAndLoss, exportToCSV, exportToExcel, exportToPDF } = useFinancialReports()

  const handleExportCSV = useCallback(async () => {
    const toastId = toast.loading(t('billing.csvLoading'))
    try {
      const report = await generateProfitAndLoss(reportFilters)
      // Convertir el reporte a array para exportar
      const dataArray = [
        { item: 'Ingresos Totales', monto: report.total_income },
        ...report.income_by_category.map((cat: any) => ({
          item: `  - ${cat.category}`,
          monto: cat.amount,
        })),
        { item: 'Egresos Totales', monto: report.total_expenses },
        ...report.expenses_by_category.map((cat: any) => ({
          item: `  - ${cat.category}`,
          monto: cat.amount,
        })),
        { item: 'Utilidad Bruta', monto: report.gross_profit },
        { item: 'Utilidad Neta', monto: report.net_profit },
      ]
      exportToCSV(dataArray, `reporte_financiero`, { format: 'csv', delimiter: ';' })
      toast.success(t('billing.csvSuccess'), { id: toastId })
    } catch (error) {
      toast.error(
        t('billing.csvError', {
          error: error instanceof Error ? error.message : 'Error desconocido',
        }),
        { id: toastId }
      )
    }
  }, [reportFilters, generateProfitAndLoss, exportToCSV, t])

  const handleExportExcel = useCallback(async () => {
    const toastId = toast.loading(t('billing.excelLoading'))
    try {
      const report = await generateProfitAndLoss(reportFilters)
      const dataArray = [
        { item: 'Ingresos Totales', monto: report.total_income },
        ...report.income_by_category.map((cat: any) => ({
          item: `  - ${cat.category}`,
          monto: cat.amount,
        })),
        { item: 'Egresos Totales', monto: report.total_expenses },
        ...report.expenses_by_category.map((cat: any) => ({
          item: `  - ${cat.category}`,
          monto: cat.amount,
        })),
        { item: 'Utilidad Bruta', monto: report.gross_profit },
        { item: 'Utilidad Neta', monto: report.net_profit },
      ]
      exportToExcel(dataArray, `Reporte_Financiero`, 'Reporte')
      toast.success(t('billing.excelSuccess'), { id: toastId })
    } catch (error) {
      toast.error(
        t('billing.excelError', {
          error: error instanceof Error ? error.message : 'Error desconocido',
        }),
        { id: toastId }
      )
    }
  }, [reportFilters, generateProfitAndLoss, exportToExcel, t])

  const handleExportPDF = useCallback(async () => {
    const toastId = toast.loading(t('billing.pdfLoading'))
    try {
      const report = await generateProfitAndLoss(reportFilters)
      exportToPDF(report, report.business_name, `reporte_financiero.pdf`)
      toast.success(t('billing.pdfSuccess'), { id: toastId })
    } catch (error) {
      toast.error(
        t('billing.pdfError', {
          error: error instanceof Error ? error.message : 'Error desconocido',
        }),
        { id: toastId }
      )
    }
  }, [reportFilters, generateProfitAndLoss, exportToPDF, t])

  return {
    handleExportCSV,
    handleExportExcel,
    handleExportPDF,
  }
}