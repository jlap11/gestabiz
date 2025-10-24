import React, { useEffect, useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  DollarSign,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Users,
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
import { useLanguage } from '@/contexts/LanguageContext'
import { useTransactions } from '@/hooks/useTransactions'
import supabase from '@/lib/supabase'
import type { TransactionFilters } from '@/types/types'
import { cn } from '@/lib/utils'

interface FinancialOverviewProps {
  businessId: string
  locationId?: string
  dateRange?: {
    start: string
    end: string
  }
}

interface AppointmentStats {
  total_appointments: number
  completed_appointments: number
  average_ticket: number
  revenue_from_appointments: number
}

export function FinancialOverview({ businessId, locationId }: Readonly<FinancialOverviewProps>) {
  const { t, language } = useLanguage()
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [appointmentStats, setAppointmentStats] = useState<AppointmentStats>({
    total_appointments: 0,
    completed_appointments: 0,
    average_ticket: 0,
    revenue_from_appointments: 0,
  })
  const [loadingStats, setLoadingStats] = useState(true)

  const formatCurrency = (amount: number, currency = 'MXN') => {
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
      case 'quarter':
        start.setMonth(start.getMonth() - 3)
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

  const { summary, loading: loadingTransactions, refetch } = useTransactions(filters)

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

  // Fetch appointment statistics
  useEffect(() => {
    const fetchAppointmentStats = async () => {
      setLoadingStats(true)
      try {
        const range = getDateRange()

        let query = supabase
          .from('appointments')
          .select('id, status, service:services(price)')
          .eq('business_id', businessId)
          .gte('start_time', range.start)
          .lte('start_time', range.end)

        if (locationId) {
          query = query.eq('location_id', locationId)
        }

        const { data: appointments, error } = await query

        if (error) throw error

        const total = appointments?.length || 0
        const completed = appointments?.filter(a => a.status === 'completed').length || 0

        // Calculate revenue from completed appointments
        const revenue =
          appointments
            ?.filter(a => a.status === 'completed')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .reduce((sum, a) => sum + ((a.service as any)?.price || 0), 0) || 0

        const averageTicket = completed > 0 ? revenue / completed : 0

        setAppointmentStats({
          total_appointments: total,
          completed_appointments: completed,
          average_ticket: averageTicket,
          revenue_from_appointments: revenue,
        })
      } catch {
        // If fetch fails, reset to zero values
        setAppointmentStats({
          total_appointments: 0,
          completed_appointments: 0,
          average_ticket: 0,
          revenue_from_appointments: 0,
        })
      } finally {
        setLoadingStats(false)
      }
    }

    fetchAppointmentStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, locationId, period])

  const loading = loadingTransactions || loadingStats

  // Calculate percentage changes (mock for now - would need historical data)
  const getPercentageChange = (value: number) => {
    // This would compare with previous period in real implementation
    return Math.random() > 0.5 ? Math.floor(Math.random() * 30) : -Math.floor(Math.random() * 20)
  }

  const profitMargin =
    summary.total_income > 0
      ? ((summary.net_profit / summary.total_income) * 100).toFixed(1)
      : '0.0'

  const renderMetricCard = (
    title: string,
    value: string | number,
    icon: React.ReactNode,
    trend?: number,
    colorClass = 'text-primary',
    bgClass = 'bg-primary/10'
  ) => (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={cn('p-3 rounded-xl', bgClass)}>{icon}</div>
        {trend !== undefined && (
          <div
            className={cn(
              'flex items-center gap-1 text-sm font-medium',
              trend >= 0 ? 'text-green-600' : 'text-red-600'
            )}
          >
            {trend >= 0 ? (
              <ArrowUpRight className="h-4 w-4" />
            ) : (
              <ArrowDownRight className="h-4 w-4" />
            )}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {loading ? (
          <div className="h-8 bg-muted animate-pulse rounded" />
        ) : (
          <p className={cn('text-2xl font-bold', colorClass)}>{value}</p>
        )}
      </div>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header with Period Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">{t('financial.overview')}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t('financial.overviewDescription')}</p>
        </div>
        <Select value={period} onValueChange={value => setPeriod(value as typeof period)}>
          <SelectTrigger className="w-48">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">{t('financial.lastWeek')}</SelectItem>
            <SelectItem value="month">{t('financial.lastMonth')}</SelectItem>
            <SelectItem value="quarter">{t('financial.lastQuarter')}</SelectItem>
            <SelectItem value="year">{t('financial.lastYear')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Primary Metrics - Row 1 */}
      <div className="grid md:grid-cols-4 gap-4">
        {renderMetricCard(
          t('financial.totalRevenue'),
          formatCurrency(summary.total_income),
          <DollarSign className="h-6 w-6 text-green-600" />,
          getPercentageChange(summary.total_income),
          'text-green-600',
          'bg-green-100'
        )}

        {renderMetricCard(
          t('financial.totalExpenses'),
          formatCurrency(summary.total_expenses),
          <TrendingDown className="h-6 w-6 text-red-600" />,
          getPercentageChange(summary.total_expenses),
          'text-red-600',
          'bg-red-100'
        )}

        {renderMetricCard(
          t('financial.netProfit'),
          formatCurrency(summary.net_profit),
          <TrendingUp className="h-6 w-6 text-primary" />,
          getPercentageChange(summary.net_profit),
          summary.net_profit >= 0 ? 'text-green-600' : 'text-red-600',
          'bg-primary/10'
        )}

        {renderMetricCard(
          t('financial.profitMargin'),
          `${profitMargin}%`,
          <DollarSign className="h-6 w-6 text-blue-600" />,
          undefined,
          'text-blue-600',
          'bg-blue-100'
        )}
      </div>

      {/* Secondary Metrics - Row 2 */}
      <div className="grid md:grid-cols-4 gap-4">
        {renderMetricCard(
          t('financial.totalAppointments'),
          appointmentStats.total_appointments.toString(),
          <Calendar className="h-6 w-6 text-purple-600" />,
          getPercentageChange(appointmentStats.total_appointments),
          'text-purple-600',
          'bg-purple-100'
        )}

        {renderMetricCard(
          t('financial.completedAppointments'),
          appointmentStats.completed_appointments.toString(),
          <ShoppingBag className="h-6 w-6 text-indigo-600" />,
          getPercentageChange(appointmentStats.completed_appointments),
          'text-indigo-600',
          'bg-indigo-100'
        )}

        {renderMetricCard(
          t('financial.averageTicket'),
          formatCurrency(appointmentStats.average_ticket),
          <DollarSign className="h-6 w-6 text-orange-600" />,
          getPercentageChange(appointmentStats.average_ticket),
          'text-orange-600',
          'bg-orange-100'
        )}

        {renderMetricCard(
          t('financial.appointmentRevenue'),
          formatCurrency(appointmentStats.revenue_from_appointments),
          <TrendingUp className="h-6 w-6 text-teal-600" />,
          getPercentageChange(appointmentStats.revenue_from_appointments),
          'text-teal-600',
          'bg-teal-100'
        )}
      </div>

      {/* Summary Card */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold mb-1">{t('financial.periodSummary')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('financial.periodSummaryDescription')}
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Users className="h-4 w-4 mr-2" />
            {t('financial.viewDetails')}
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Completion Rate */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">
              {t('financial.completionRate')}
            </p>
            {loading ? (
              <div className="h-6 bg-muted animate-pulse rounded" />
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {appointmentStats.total_appointments > 0
                      ? Math.round(
                          (appointmentStats.completed_appointments /
                            appointmentStats.total_appointments) *
                            100
                        )
                      : 0}
                    %
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {appointmentStats.completed_appointments}/{appointmentStats.total_appointments}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{
                      width: `${
                        appointmentStats.total_appointments > 0
                          ? (appointmentStats.completed_appointments /
                              appointmentStats.total_appointments) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Revenue per Transaction */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">
              {t('financial.revenuePerTransaction')}
            </p>
            {loading ? (
              <div className="h-6 bg-muted animate-pulse rounded" />
            ) : (
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(
                  summary.transaction_count > 0
                    ? summary.total_income / summary.transaction_count
                    : 0
                )}
              </p>
            )}
          </div>

          {/* Transactions Count */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">
              {t('financial.totalTransactions')}
            </p>
            {loading ? (
              <div className="h-6 bg-muted animate-pulse rounded" />
            ) : (
              <p className="text-2xl font-bold text-primary">{summary.transaction_count}</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
