import React from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useChartData } from '@/hooks/useChartData'
import { useFinancialReports } from '@/hooks/useFinancialReports'
import { useTransactions } from '@/hooks/useTransactions'

// Custom hooks
import { useFinancialFilters } from './hooks/useFinancialFilters'
import { useFinancialExports } from './hooks/useFinancialExports'

// Components
import { FinancialHeader } from './components/FinancialHeader'
import { FinancialFilters } from './components/FinancialFilters'
import { FinancialStatsCards } from './components/FinancialStatsCards'
import { FinancialChartTabs } from './components/FinancialChartTabs'

// Types
import type { Location, Service } from '@/types/types'

interface EnhancedFinancialDashboardProps {
  businessId: string
  locationId?: string
  locations?: Location[]
  services?: Service[]
}

export function EnhancedFinancialDashboard({
  businessId,
  locationId,
  locations = [],
  services = [],
}: EnhancedFinancialDashboardProps) {
  const { t } = useLanguage()
  
  // Custom hooks for filters and state management
  const {
    period,
    selectedLocation,
    selectedEmployee,
    selectedCategory,
    employees,
    txFilters,
    reportFilters,
    setPeriod,
    setSelectedLocation,
    setSelectedEmployee,
    setSelectedCategory,
  } = useFinancialFilters({ businessId, locationId })

  // Data hooks
  const { summary, loading: transactionsLoading } = useTransactions(txFilters)
  const {
    incomeVsExpenseData,
    categoryDistributionData,
    monthlyTrendData,
    locationComparisonData,
    employeePerformanceData,
  } = useChartData(businessId, reportFilters)

  // Export hooks
  const { handleExportCSV, handleExportExcel, handleExportPDF } = useFinancialExports({
    businessId,
    reportFilters,
    chartData: {
      incomeVsExpenseData,
      categoryDistributionData,
      monthlyTrendData,
      locationComparisonData,
      employeePerformanceData,
    },
    reportData: summary,
  })

  // Calculate totals and metrics
  const totalIncome = summary?.total_income || 0
  const totalExpenses = summary?.total_expenses || 0
  const netProfit = summary?.net_profit || 0
  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0

  const isLoading = transactionsLoading

  // Prepare chart data for the new component structure
  const chartData = {
    incomeVsExpenseData,
    categoryDistributionData,
    monthlyTrendData,
    locationComparisonData,
    employeePerformanceData,
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header with export buttons */}
      <FinancialHeader
        onExportCSV={handleExportCSV}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
      />

      {/* Filters section */}
      <FinancialFilters
        period={period}
        selectedLocation={selectedLocation}
        selectedEmployee={selectedEmployee}
        selectedCategory={selectedCategory}
        employees={employees}
        locations={locations}
        onPeriodChange={setPeriod}
        onLocationChange={setSelectedLocation}
        onEmployeeChange={setSelectedEmployee}
        onCategoryChange={setSelectedCategory}
      />

      {/* Statistics cards */}
      <FinancialStatsCards
        totalIncome={totalIncome}
        totalExpenses={totalExpenses}
        netProfit={netProfit}
        profitMargin={profitMargin}
        isLoading={isLoading}
      />

      {/* Charts section */}
      <FinancialChartTabs
        chartData={chartData}
        reportData={summary}
        isLoading={isLoading}
      />
    </div>
  )
}