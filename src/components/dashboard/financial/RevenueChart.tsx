import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import supabase from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface RevenueChartProps {
  businessId: string;
  locationId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

interface DataPoint {
  date: string;
  income: number;
  expenses: number;
  profit: number;
}

export function RevenueChart({
  businessId,
  locationId,
}: Readonly<RevenueChartProps>) {
  const { t, language } = useLanguage();
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'es' ? 'es-MX' : 'en-US', {
      style: 'currency',
      currency: 'MXN',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    switch (period) {
      case 'day':
        return new Intl.DateTimeFormat(language === 'es' ? 'es-MX' : 'en-US', {
          month: 'short',
          day: 'numeric',
        }).format(date);
      case 'week':
        return `${t('financial.week')} ${Math.ceil(date.getDate() / 7)}`;
      case 'month':
        return new Intl.DateTimeFormat(language === 'es' ? 'es-MX' : 'en-US', {
          month: 'short',
        }).format(date);
      default:
        return dateStr;
    }
  };

  useEffect(() => {
    const fetchRevenueData = async () => {
      setLoading(true);
      try {
        // Calculate date range based on period
        const end = new Date();
        const start = new Date();
        
        switch (period) {
          case 'day':
            start.setDate(start.getDate() - 30); // Last 30 days
            break;
          case 'week':
            start.setDate(start.getDate() - 84); // Last 12 weeks
            break;
          case 'month':
            start.setMonth(start.getMonth() - 12); // Last 12 months
            break;
        }

        let query = supabase
          .from('transactions')
          .select('transaction_date, type, amount')
          .eq('business_id', businessId)
          .gte('transaction_date', start.toISOString().split('T')[0])
          .lte('transaction_date', end.toISOString().split('T')[0])
          .order('transaction_date');

        if (locationId) {
          query = query.eq('location_id', locationId);
        }

        const { data: transactions, error } = await query;

        if (error) throw error;

        // Group data by period
        const groupedData: Record<string, { income: number; expenses: number }> = {};

        transactions?.forEach(transaction => {
          const date = new Date(transaction.transaction_date);
          let key: string;

          switch (period) {
            case 'day':
              key = transaction.transaction_date;
              break;
            case 'week': {
              const weekStart = new Date(date);
              weekStart.setDate(date.getDate() - date.getDay());
              key = weekStart.toISOString().split('T')[0];
              break;
            }
            case 'month':
              key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
              break;
            default:
              key = transaction.transaction_date;
          }

          if (!groupedData[key]) {
            groupedData[key] = { income: 0, expenses: 0 };
          }

          if (transaction.type === 'income') {
            groupedData[key].income += transaction.amount;
          } else {
            groupedData[key].expenses += transaction.amount;
          }
        });

        // Convert to array and calculate profit
        const chartData: DataPoint[] = Object.entries(groupedData)
          .map(([date, values]) => ({
            date,
            income: values.income,
            expenses: values.expenses,
            profit: values.income - values.expenses,
          }))
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(-12); // Show last 12 periods

        setData(chartData);
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueData();
  }, [businessId, locationId, period]);

  // Calculate chart dimensions and scales
  const maxValue = Math.max(
    ...data.map(d => Math.max(d.income, d.expenses)),
    1000
  );
  const chartHeight = 300;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{t('financial.revenueAnalysis')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('financial.revenueAnalysisDescription')}
            </p>
          </div>
        </div>
        <Select value={period} onValueChange={(value) => setPeriod(value as typeof period)}>
          <SelectTrigger className="w-36">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">{t('financial.daily')}</SelectItem>
            <SelectItem value="week">{t('financial.weekly')}</SelectItem>
            <SelectItem value="month">{t('financial.monthly')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500" />
          <span className="text-sm font-medium">{t('financial.income')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500" />
          <span className="text-sm font-medium">{t('financial.expenses')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-500" />
          <span className="text-sm font-medium">{t('financial.profit')}</span>
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div className="h-[300px] flex items-center justify-center">
          <div className="text-muted-foreground">{t('common.loading')}...</div>
        </div>
      ) : null}
      
      {!loading && data.length === 0 && (
        <div className="h-[300px] flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>{t('financial.noDataAvailable')}</p>
          </div>
        </div>
      )}

      {!loading && data.length > 0 && (
        <div className="relative" style={{ height: `${chartHeight}px` }}>
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col justify-between text-xs text-muted-foreground text-right pr-2">
            <span>{formatCurrency(maxValue)}</span>
            <span>{formatCurrency(maxValue * 0.75)}</span>
            <span>{formatCurrency(maxValue * 0.5)}</span>
            <span>{formatCurrency(maxValue * 0.25)}</span>
            <span>$0</span>
          </div>

          {/* Chart area */}
          <div className="ml-16 h-full relative border-l border-b border-muted">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((percent) => (
              <div
                key={percent}
                className="absolute w-full border-t border-muted/30"
                style={{ bottom: `${percent}%` }}
              />
            ))}

            {/* Bars */}
            <div className="absolute inset-0 flex items-end justify-around gap-1 px-2">
              {data.map((point) => {
                const incomeHeight = (point.income / maxValue) * 100;
                const expensesHeight = (point.expenses / maxValue) * 100;
                const profitHeight = Math.abs(point.profit / maxValue) * 100;

                return (
                  <div key={point.date} className="flex-1 flex items-end justify-center gap-0.5">
                    {/* Income bar */}
                    <div
                      className="flex-1 bg-green-500 hover:bg-green-600 transition-colors rounded-t cursor-pointer relative group"
                      style={{
                        height: `${incomeHeight}%`,
                        minHeight: point.income > 0 ? '2px' : '0',
                      }}
                      title={`${t('financial.income')}: ${formatCurrency(point.income)}`}
                    >
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        {formatCurrency(point.income)}
                      </div>
                    </div>

                    {/* Expenses bar */}
                    <div
                      className="flex-1 bg-red-500 hover:bg-red-600 transition-colors rounded-t cursor-pointer relative group"
                      style={{
                        height: `${expensesHeight}%`,
                        minHeight: point.expenses > 0 ? '2px' : '0',
                      }}
                      title={`${t('financial.expenses')}: ${formatCurrency(point.expenses)}`}
                    >
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        {formatCurrency(point.expenses)}
                      </div>
                    </div>

                    {/* Profit bar */}
                    <div
                      className={cn(
                        'flex-1 hover:opacity-80 transition-opacity rounded-t cursor-pointer relative group',
                        point.profit >= 0 ? 'bg-blue-500' : 'bg-orange-500'
                      )}
                      style={{
                        height: `${profitHeight}%`,
                        minHeight: point.profit !== 0 ? '2px' : '0',
                      }}
                      title={`${t('financial.profit')}: ${formatCurrency(point.profit)}`}
                    >
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        {formatCurrency(point.profit)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* X-axis labels */}
          <div className="ml-16 mt-2 flex justify-around text-xs text-muted-foreground">
            {data.map((point) => (
              <div key={`label-${point.date}`} className="flex-1 text-center truncate">
                {formatDate(point.date)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {!loading && data.length > 0 && (
        <div className="mt-6 pt-6 border-t grid md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{t('financial.totalIncome')}</p>
            <p className="text-xl font-bold text-green-600">
              {formatCurrency(data.reduce((sum, d) => sum + d.income, 0))}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">{t('financial.totalExpenses')}</p>
            <p className="text-xl font-bold text-red-600">
              {formatCurrency(data.reduce((sum, d) => sum + d.expenses, 0))}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">{t('financial.netProfit')}</p>
            <p className={cn(
              'text-xl font-bold',
              data.reduce((sum, d) => sum + d.profit, 0) >= 0 ? 'text-blue-600' : 'text-orange-600'
            )}>
              {formatCurrency(data.reduce((sum, d) => sum + d.profit, 0))}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
