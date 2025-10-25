// React
import React, { useState } from 'react'

// External libraries
import { DollarSign, FileText, TrendingUp } from 'lucide-react'

// UI components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Internal components
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { TransactionList } from '@/components/transactions/TransactionList'
import { CategoryBreakdown } from './CategoryBreakdown'
import { FinancialOverview } from './FinancialOverview'
import { RevenueChart } from './RevenueChart'
import { TopPerformers } from './TopPerformers'
import { FinancialPageHeader } from './components/FinancialPageHeader'
import { FinancialFiltersPanel } from './components/FinancialFiltersPanel'

// Contexts
import { useLanguage } from '@/contexts/LanguageContext'

// Hooks
import { useAuth } from '@/hooks/useAuth'

interface DateRange {
  start: string
  end: string
}

export function FinancialManagementPage() {
  const { t } = useLanguage()
  const { user } = useAuth()

  // Filters
  const [selectedBusiness, setSelectedBusiness] = useState<string>('')
  const [selectedLocation, setSelectedLocation] = useState<string>('')
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date()
    const start = new Date()
    start.setMonth(end.getMonth() - 1)
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    }
  })

  // Mock businesses and locations (replace with actual data fetching)
  const businesses = [
    { id: '1', name: 'Business 1' },
    { id: '2', name: 'Business 2' },
  ]

  const locations = [
    { id: '1', name: 'Location 1' },
    { id: '2', name: 'Location 2' },
  ]

  const handleExportData = () => {
    // Export all financial data to CSV/Excel
    const exportData = {
      overview: 'Overview metrics',
      revenue: 'Revenue chart data',
      categories: 'Category breakdown',
      performers: 'Top performers stats',
      transactions: 'Transaction list',
    }

    // Convert to CSV format and trigger download
    const csvContent = Object.entries(exportData)
      .map(([key, value]) => `${key},${value}`)
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `financial-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handlePrintReport = () => {
    window.print()
  }

  const handleQuickDateRange = (range: 'week' | 'month' | 'quarter' | 'year') => {
    const end = new Date()
    const start = new Date()

    switch (range) {
      case 'week':
        start.setDate(end.getDate() - 7)
        break
      case 'month':
        start.setMonth(end.getMonth() - 1)
        break
      case 'quarter':
        start.setMonth(end.getMonth() - 3)
        break
      case 'year':
        start.setFullYear(end.getFullYear() - 1)
        break
    }

    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <FinancialPageHeader
        onPrintReport={handlePrintReport}
        onExportData={handleExportData}
      />

      {/* Global Filters */}
      <FinancialFiltersPanel
        selectedBusiness={selectedBusiness}
        selectedLocation={selectedLocation}
        dateRange={dateRange}
        businesses={businesses}
        locations={locations}
        onBusinessChange={setSelectedBusiness}
        onLocationChange={setSelectedLocation}
        onDateRangeChange={setDateRange}
        onQuickDateRange={handleQuickDateRange}
      />

      {/* Main Content with Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            {t('financial.overview')}
          </TabsTrigger>
          <TabsTrigger value="analysis" className="gap-2">
            <DollarSign className="h-4 w-4" />
            {t('financial.analysis')}
          </TabsTrigger>
          <TabsTrigger value="transactions" className="gap-2">
            <FileText className="h-4 w-4" />
            {t('financial.transactions')}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <FinancialOverview
            businessId={selectedBusiness || user?.business_id || ''}
            locationId={selectedLocation !== 'all' ? selectedLocation : undefined}
            dateRange={dateRange}
          />
          <RevenueChart
            businessId={selectedBusiness || user?.business_id || ''}
            locationId={selectedLocation !== 'all' ? selectedLocation : undefined}
            dateRange={dateRange}
          />
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CategoryBreakdown
              businessId={selectedBusiness || user?.business_id || ''}
              locationId={selectedLocation !== 'all' ? selectedLocation : undefined}
              dateRange={dateRange}
            />
            <TopPerformers
              businessId={selectedBusiness || user?.business_id || ''}
              locationId={selectedLocation !== 'all' ? selectedLocation : undefined}
            />
          </div>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TransactionList
                businessId={selectedBusiness || user?.business_id || ''}
                locationId={selectedLocation !== 'all' ? selectedLocation : undefined}
              />
            </div>
            <div>
              <TransactionForm
                businessId={selectedBusiness || user?.business_id || ''}
                locationId={selectedLocation !== 'all' ? selectedLocation : undefined}
                onSubmit={async data => {
                  // Handle transaction creation
                  // Will trigger TransactionList refresh via realtime subscription
                  return Promise.resolve()
                }}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
