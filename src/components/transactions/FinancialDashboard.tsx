import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTransactions } from '@/hooks/useTransactions';
import type { TransactionFilters } from '@/types/types';
import { cn } from '@/lib/utils';

interface FinancialDashboardProps {
  businessId: string;
  locationId?: string;
}

export function FinancialDashboard({
  businessId,
  locationId,
}: FinancialDashboardProps) {
  const { t, language } = useLanguage();
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat(language === 'es' ? 'es-MX' : 'en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  // Calculate date range based on period
  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    
    switch (period) {
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(start.getFullYear() - 1);
        break;
    }
    
    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  };

  const [filters, setFilters] = useState<TransactionFilters>({
    business_id: businessId,
    location_id: locationId,
    date_range: getDateRange(),
  });

  const { summary, loading, refetch } = useTransactions(filters);

  // Update filters when period changes
  useEffect(() => {
    const range = getDateRange();
    setFilters(prev => ({
      ...prev,
      date_range: range,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  useEffect(() => {
    refetch();
  }, [filters, refetch]);

  const profitMargin = summary.total_income > 0
    ? ((summary.net_profit / summary.total_income) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Header with Period Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('financial.dashboard')}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t('financial.dashboardDescription')}
          </p>
        </div>
        <Select value={period} onValueChange={(value) => setPeriod(value as typeof period)}>
          <SelectTrigger className="w-40">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">{t('financial.lastWeek')}</SelectItem>
            <SelectItem value="month">{t('financial.lastMonth')}</SelectItem>
            <SelectItem value="year">{t('financial.lastYear')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        {/* Total Income */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-green-100">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-green-600" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              {t('transactions.totalIncome')}
            </p>
            {loading ? (
              <div className="h-8 bg-muted animate-pulse rounded" />
            ) : (
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.total_income, 'MXN')}
              </p>
            )}
          </div>
        </Card>

        {/* Total Expenses */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-red-100">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <ArrowDownRight className="h-4 w-4 text-red-600" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              {t('transactions.totalExpenses')}
            </p>
            {loading ? (
              <div className="h-8 bg-muted animate-pulse rounded" />
            ) : (
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.total_expenses, 'MXN')}
              </p>
            )}
          </div>
        </Card>

        {/* Net Profit */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              {t('transactions.netProfit')}
            </p>
            {loading ? (
              <div className="h-8 bg-muted animate-pulse rounded" />
            ) : (
              <p
                className={cn(
                  'text-2xl font-bold',
                  summary.net_profit >= 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                {formatCurrency(summary.net_profit, 'MXN')}
              </p>
            )}
          </div>
        </Card>

        {/* Profit Margin */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-blue-100">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              {t('financial.profitMargin')}
            </p>
            {loading ? (
              <div className="h-8 bg-muted animate-pulse rounded" />
            ) : (
              <p className="text-2xl font-bold text-blue-600">
                {profitMargin}%
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Transaction Count */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">{t('financial.totalTransactions')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('financial.transactionsInPeriod')}
            </p>
          </div>
          {loading ? (
            <div className="h-12 w-24 bg-muted animate-pulse rounded" />
          ) : (
            <div className="text-4xl font-bold text-primary">
              {summary.transaction_count}
            </div>
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">{t('financial.quickActions')}</h3>
        <div className="grid md:grid-cols-3 gap-3">
          <Button variant="outline" className="justify-start">
            <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
            {t('financial.addIncome')}
          </Button>
          <Button variant="outline" className="justify-start">
            <TrendingDown className="h-4 w-4 mr-2 text-red-600" />
            {t('financial.addExpense')}
          </Button>
          <Button variant="outline" className="justify-start">
            <Calendar className="h-4 w-4 mr-2" />
            {t('financial.viewReports')}
          </Button>
        </div>
      </Card>
    </div>
  );
}
