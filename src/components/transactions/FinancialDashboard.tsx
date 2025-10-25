import React, { useEffect, useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CreditCard,
  DollarSign,
  LineChart,
  PieChart,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLanguage } from '@/contexts/LanguageContext'
import { useTransactions } from '@/hooks/useTransactions'
import type { TransactionFilters } from '@/types/types'
import { cn } from '@/lib/utils'
import { IncomeVsExpenseChart } from '@/components/accounting/IncomeVsExpenseChart'
import { CategoryPieChart } from '@/components/accounting/CategoryPieChart'
import { MonthlyTrendChart } from '@/components/accounting/MonthlyTrendChart'

interface FinancialDashboardProps {
  businessId: string
  locationId?: string
}

export function FinancialDashboard({ businessId, locationId }: FinancialDashboardProps) {
  const { t, language } = useLanguage()
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month')

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat(language === 'es' ? 'es-MX' : 'en-US', {
      style: 'currency',
      currency,
    }).format(amount)
  }

  // Calculate date range based on period
  const getDateRange = () => {
    const end = new Date()
    const start = new Date()

    switch (period) {
      case 'week':
        start.setDate(start.getDate() - 7)
        break
      case 'month':
        start.setMonth(start.getMonth() - 1)
        break
      case 'year':
        start.setFullYear(start.getFullYear() - 1)
        break
    }

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    }
  }

  const [filters, setFilters] = useState<TransactionFilters>({
    business_id: businessId,
    location_id: locationId,
    date_range: getDateRange(),
  })

  const { summary, loading, refetch } = useTransactions(filters)

  // Update filters when period changes
  useEffect(() => {
    const range = getDateRange()
    setFilters(prev => ({
      ...prev,
      date_range: range,
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  useEffect(() => {
    refetch()
  }, [filters, refetch])

  const profitMargin =
    summary.total_income > 0
      ? ((summary.net_profit / summary.total_income) * 100).toFixed(1)
      : '0.0'

  return (
    <main 
      className="space-y-6 max-w-[95vw] mx-auto"
      role="main"
      aria-labelledby="financial-dashboard-title"
    >
      <h1 id="financial-dashboard-title" className="sr-only">
        Panel de control financiero
      </h1>

      {/* Header with Period Selector */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-bold">{t('financial.dashboard')}</h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            {t('financial.dashboardDescription')}
          </p>
        </div>
        <div className="flex-shrink-0">
          <Select 
            value={period} 
            onValueChange={value => setPeriod(value as typeof period)}
            aria-label="Seleccionar período de tiempo"
          >
            <SelectTrigger 
              className="w-full sm:w-40 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-describedby="period-help"
            >
              <Calendar className="h-4 w-4 mr-2" aria-hidden="true" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent role="listbox" aria-label="Opciones de período">
              <SelectItem value="week" role="option">{t('financial.lastWeek')}</SelectItem>
              <SelectItem value="month" role="option">{t('financial.lastMonth')}</SelectItem>
              <SelectItem value="year" role="option">{t('financial.lastYear')}</SelectItem>
            </SelectContent>
          </Select>
          <p id="period-help" className="sr-only">
            Selecciona el período de tiempo para mostrar los datos financieros
          </p>
        </div>
      </header>

      {/* Main Stats */}
      <section 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        role="region"
        aria-labelledby="main-stats-title"
      >
        <h3 id="main-stats-title" className="sr-only">
          Estadísticas principales
        </h3>

        {/* Total Income */}
        <Card className="p-4 sm:p-6" role="article" aria-labelledby="income-title">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30" aria-hidden="true">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <p id="income-title" className="text-sm sm:text-base font-medium text-muted-foreground">
              {t('transactions.totalIncome')}
            </p>
            {loading ? (
              <div className="h-8 bg-muted animate-pulse rounded" role="status" aria-label="Cargando ingresos totales" />
            ) : (
              <p 
                className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400"
                aria-label={`Ingresos totales: ${formatCurrency(summary.total_income, 'MXN')}`}
              >
                {formatCurrency(summary.total_income, 'MXN')}
              </p>
            )}
          </div>
        </Card>

        {/* Total Expenses */}
        <Card className="p-4 sm:p-6" role="article" aria-labelledby="expenses-title">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30" aria-hidden="true">
              <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-400" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <p id="expenses-title" className="text-sm sm:text-base font-medium text-muted-foreground">
              {t('transactions.totalExpenses')}
            </p>
            {loading ? (
              <div className="h-8 bg-muted animate-pulse rounded" role="status" aria-label="Cargando gastos totales" />
            ) : (
              <p 
                className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400"
                aria-label={`Gastos totales: ${formatCurrency(summary.total_expenses, 'MXN')}`}
              >
                {formatCurrency(summary.total_expenses, 'MXN')}
              </p>
            )}
          </div>
        </Card>

        {/* Net Profit */}
        <Card className="p-4 sm:p-6" role="article" aria-labelledby="profit-title">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-primary/10" aria-hidden="true">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="space-y-1">
            <p id="profit-title" className="text-sm sm:text-base font-medium text-muted-foreground">
              {t('transactions.netProfit')}
            </p>
            {loading ? (
              <div className="h-8 bg-muted animate-pulse rounded" role="status" aria-label="Cargando ganancia neta" />
            ) : (
              <p
                className={cn(
                  'text-xl sm:text-2xl font-bold',
                  summary.net_profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                )}
                aria-label={`Ganancia neta: ${formatCurrency(summary.net_profit, 'MXN')}`}
              >
                {formatCurrency(summary.net_profit, 'MXN')}
              </p>
            )}
          </div>
        </Card>

        {/* Profit Margin */}
        <Card className="p-4 sm:p-6" role="article" aria-labelledby="margin-title">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30" aria-hidden="true">
              <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="space-y-1">
            <p id="margin-title" className="text-sm sm:text-base font-medium text-muted-foreground">
              {t('financial.profitMargin')}
            </p>
            {loading ? (
              <div className="h-8 bg-muted animate-pulse rounded" role="status" aria-label="Cargando margen de ganancia" />
            ) : (
              <p 
                className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400"
                aria-label={`Margen de ganancia: ${profitMargin} por ciento`}
              >
                {profitMargin}%
              </p>
            )}
          </div>
        </Card>
      </section>

      {/* Transaction Count */}
      <section role="region" aria-labelledby="transactions-count-title">
        <Card className="p-4 sm:p-6" role="article">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h3 id="transactions-count-title" className="text-lg sm:text-xl font-semibold mb-1">
                {t('financial.totalTransactions')}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                {t('financial.transactionsInPeriod')}
              </p>
            </div>
            {loading ? (
              <div className="h-12 w-24 bg-muted animate-pulse rounded" role="status" aria-label="Cargando número de transacciones" />
            ) : (
              <div 
                className="text-3xl sm:text-4xl font-bold text-primary"
                aria-label={`Total de transacciones: ${summary.transaction_count}`}
              >
                {summary.transaction_count}
              </div>
            )}
          </div>
        </Card>
      </section>

      {/* Quick Actions */}
      <section role="region" aria-labelledby="quick-actions-title">
        <Card className="p-4 sm:p-6">
          <h3 id="quick-actions-title" className="text-lg sm:text-xl font-semibold mb-4">
            {t('financial.quickActions')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Button 
              variant="outline" 
              className="justify-start min-h-[44px] text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Agregar nuevo ingreso"
              title="Agregar nuevo ingreso"
            >
              <TrendingUp className="h-4 w-4 mr-2 text-green-600" aria-hidden="true" />
              {t('financial.addIncome')}
            </Button>
            <Button 
              variant="outline" 
              className="justify-start min-h-[44px] text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Agregar nuevo gasto"
              title="Agregar nuevo gasto"
            >
              <TrendingDown className="h-4 w-4 mr-2 text-red-600" aria-hidden="true" />
              {t('financial.addExpense')}
            </Button>
            <Button 
              variant="outline" 
              className="justify-start min-h-[44px] text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Ver reportes financieros"
              title="Ver reportes financieros"
            >
              <Calendar className="h-4 w-4 mr-2" aria-hidden="true" />
              {t('financial.viewReports')}
            </Button>
          </div>
        </Card>
      </section>

      {/* Gráficos Interactivos */}
      <section role="region" aria-labelledby="charts-title">
        <h3 id="charts-title" className="sr-only">
          Gráficos financieros interactivos
        </h3>
        <Tabs defaultValue="income-expense" className="space-y-4">
          <TabsList 
            className="grid w-full grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-0 h-auto sm:h-10"
            role="tablist"
            aria-label="Tipos de gráficos financieros"
          >
            <TabsTrigger 
              value="income-expense"
              className="min-h-[44px] min-w-[44px] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              role="tab"
              aria-selected="true"
              aria-controls="income-expense-panel"
              id="income-expense-tab"
              aria-label="Gráfico de ingresos versus egresos"
              title="Gráfico de ingresos versus egresos"
            >
              <BarChart3 className="h-4 w-4 mr-2" aria-hidden="true" />
              <span className="hidden sm:inline">Ingresos vs Egresos</span>
              <span className="sm:hidden">Ingresos</span>
            </TabsTrigger>
            <TabsTrigger 
              value="categories"
              className="min-h-[44px] min-w-[44px] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              role="tab"
              aria-selected="false"
              aria-controls="categories-panel"
              id="categories-tab"
              aria-label="Gráfico por categorías"
              title="Gráfico por categorías"
            >
              <PieChart className="h-4 w-4 mr-2" aria-hidden="true" />
              <span className="hidden sm:inline">Por Categoría</span>
              <span className="sm:hidden">Categorías</span>
            </TabsTrigger>
            <TabsTrigger 
              value="trends"
              className="min-h-[44px] min-w-[44px] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              role="tab"
              aria-selected="false"
              aria-controls="trends-panel"
              id="trends-tab"
              aria-label="Gráfico de tendencias"
              title="Gráfico de tendencias"
            >
              <LineChart className="h-4 w-4 mr-2" aria-hidden="true" />
              <span className="hidden sm:inline">Tendencias</span>
              <span className="sm:hidden">Trends</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent 
            value="income-expense" 
            className="space-y-4"
            role="tabpanel"
            id="income-expense-panel"
            aria-labelledby="income-expense-tab"
          >
            <div role="img" aria-label="Gráfico comparativo de ingresos versus egresos">
              <IncomeVsExpenseChart businessId={businessId} filters={filters} />
            </div>
          </TabsContent>

          <TabsContent 
            value="categories" 
            className="space-y-4"
            role="tabpanel"
            id="categories-panel"
            aria-labelledby="categories-tab"
          >
            <div role="img" aria-label="Gráfico de distribución por categorías">
              <CategoryPieChart businessId={businessId} filters={filters} />
            </div>
          </TabsContent>

          <TabsContent 
            value="trends" 
            className="space-y-4"
            role="tabpanel"
            id="trends-panel"
            aria-labelledby="trends-tab"
          >
            <div role="img" aria-label="Gráfico de tendencias mensuales">
              <MonthlyTrendChart businessId={businessId} filters={filters} />
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </main>
  )
}