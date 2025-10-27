import React, { useState, useEffect } from 'react';
import { PieChart, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import supabase from '@/lib/supabase';
import type { TransactionCategory } from '@/types/types';
import { cn } from '@/lib/utils';

interface CategoryBreakdownProps {
  businessId: string;
  locationId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

interface CategoryData {
  category: TransactionCategory;
  amount: number;
  percentage: number;
  count: number;
}

export function CategoryBreakdown({
  businessId,
  locationId,
  dateRange,
}: Readonly<CategoryBreakdownProps>) {
  const { t, language } = useLanguage();
  const [incomeData, setIncomeData] = useState<CategoryData[]>([]);
  const [expenseData, setExpenseData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'es' ? 'es-MX' : 'en-US', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  useEffect(() => {
    const fetchCategoryData = async () => {
      setLoading(true);
      try {
        const range = dateRange || {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        };

        let query = supabase
          .from('transactions')
          .select('type, category, amount')
          .eq('business_id', businessId)
          .gte('transaction_date', range.start.split('T')[0])
          .lte('transaction_date', range.end.split('T')[0]);

        if (locationId) {
          query = query.eq('location_id', locationId);
        }

        const { data: transactions, error } = await query;

        if (error) throw error;

        // Group by category and type
        const incomeGroups: Record<string, { amount: number; count: number }> = {};
        const expenseGroups: Record<string, { amount: number; count: number }> = {};

        transactions?.forEach(transaction => {
          const groups = transaction.type === 'income' ? incomeGroups : expenseGroups;
          
          if (!groups[transaction.category]) {
            groups[transaction.category] = { amount: 0, count: 0 };
          }
          
          groups[transaction.category].amount += transaction.amount;
          groups[transaction.category].count += 1;
        });

        // Calculate totals
        const totalIncome = Object.values(incomeGroups).reduce((sum, g) => sum + g.amount, 0);
        const totalExpense = Object.values(expenseGroups).reduce((sum, g) => sum + g.amount, 0);

        // Convert to arrays with percentages
        const incomeArray: CategoryData[] = Object.entries(incomeGroups)
          .map(([category, data]) => ({
            category: category as TransactionCategory,
            amount: data.amount,
            percentage: totalIncome > 0 ? (data.amount / totalIncome) * 100 : 0,
            count: data.count,
          }))
          .sort((a, b) => b.amount - a.amount);

        const expenseArray: CategoryData[] = Object.entries(expenseGroups)
          .map(([category, data]) => ({
            category: category as TransactionCategory,
            amount: data.amount,
            percentage: totalExpense > 0 ? (data.amount / totalExpense) * 100 : 0,
            count: data.count,
          }))
          .sort((a, b) => b.amount - a.amount);

        setIncomeData(incomeArray);
        setExpenseData(expenseArray);
      } catch {
        setIncomeData([]);
        setExpenseData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [businessId, locationId, dateRange]);

  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-orange-500',
    'bg-teal-500',
    'bg-cyan-500',
  ];

  const renderPieChart = (data: CategoryData[], type: 'income' | 'expense') => {
    if (data.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>{t('financial.noDataAvailable')}</p>
          </div>
        </div>
      );
    }

    const total = data.reduce((sum, d) => sum + d.amount, 0);

    // Simple pie chart visualization with stacked bars
    return (
      <div className="space-y-4">
        {/* Visual representation */}
        <div className="h-6 rounded-full overflow-hidden flex">
          {data.map((item, index) => (
            <div
              key={item.category}
              className={cn(colors[index % colors.length], 'transition-all hover:opacity-80')}
              style={{ width: `${item.percentage}%` }}
              title={t(`transactions.categories.${item.category}`) + ': ' + formatCurrency(item.amount) + ' (' + item.percentage.toFixed(1) + '%)'}
            />
          ))}
        </div>

        {/* Legend and details */}
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={item.category} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3 flex-1">
                <div className={cn('w-4 h-4 rounded', colors[index % colors.length])} />
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {t(`transactions.categories.${item.category}`)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.count} {item.count === 1 ? t('financial.transaction') : t('financial.transactions')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  'font-semibold',
                  type === 'income' ? 'text-green-600' : 'text-red-600'
                )}>
                  {formatCurrency(item.amount)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.percentage.toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              {t('financial.total')}
            </span>
            <span className={cn(
              'text-xl font-bold',
              type === 'income' ? 'text-green-600' : 'text-red-600'
            )}>
              {formatCurrency(total)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <PieChart className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">{t('financial.categoryBreakdown')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('financial.categoryBreakdownDescription')}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="text-muted-foreground">{t('common.loading')}...</div>
        </div>
      ) : (
        <Tabs defaultValue="income" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="income" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              {t('financial.income')}
            </TabsTrigger>
            <TabsTrigger value="expenses" className="gap-2">
              <TrendingDown className="h-4 w-4" />
              {t('financial.expenses')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="income">
            {renderPieChart(incomeData, 'income')}
          </TabsContent>

          <TabsContent value="expenses">
            {renderPieChart(expenseData, 'expense')}
          </TabsContent>
        </Tabs>
      )}
    </Card>
  );
}
