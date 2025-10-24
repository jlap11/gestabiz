import React, { useState, useMemo, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import supabase from '@/lib/supabase';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTransactions } from '@/hooks/useTransactions';
import { useChartData } from '@/hooks/useChartData';
import { useFinancialReports } from '@/hooks/useFinancialReports';
import { toast } from 'sonner';
import {
  IncomeVsExpenseChart,
  CategoryPieChart,
  MonthlyTrendChart,
  LocationBarChart,
  EmployeeRevenueChart,
} from '@/components/accounting';
import { formatCOP } from '@/lib/accounting/colombiaTaxes';
import { cn } from '@/lib/utils';
import type { Location, Service } from '@/types/types';

interface EnhancedFinancialDashboardProps {
  businessId: string;
  locationId?: string;
  locations?: Location[];
  services?: Service[];
}

type Period = '1m' | '3m' | '6m' | '1y' | 'custom';

export function EnhancedFinancialDashboard({
  businessId,
  locationId,
  locations = [],
  services = [],
}: EnhancedFinancialDashboardProps) {
  const { t } = useLanguage();
  const [period, setPeriod] = useState<Period>('1m');
  const [selectedLocation, setSelectedLocation] = useState<string>(locationId || 'all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [employees, setEmployees] = useState<Array<{ id: string; name: string }>>([]);

  // Calculate date range based on period
  const dateRange = useMemo(() => {
    const end = new Date();
    const start = new Date();
    
    switch (period) {
      case '1m':
        start.setMonth(start.getMonth() - 1);
        break;
      case '3m':
        start.setMonth(start.getMonth() - 3);
        break;
      case '6m':
        start.setMonth(start.getMonth() - 6);
        break;
      case '1y':
        start.setFullYear(start.getFullYear() - 1);
        break;
      default:
        start.setMonth(start.getMonth() - 1);
    }
    
    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  }, [period]);

  // Fetch transactions with filters
  const txFilters = useMemo(() => ({
    business_id: businessId,
    location_id: selectedLocation !== 'all' ? selectedLocation : undefined,
    date_range: dateRange,
  }), [businessId, selectedLocation, dateRange]);

  const { summary, loading } = useTransactions(txFilters);

  // Cargar empleados del negocio
  useEffect(() => {
    const loadEmployees = async () => {
      const { data } = await supabase
        .from('business_employees')
        .select('employee_id, profiles!business_employees_employee_id_fkey(id, full_name)')
        .eq('business_id', businessId);
      
      if (data && Array.isArray(data)) {
        const empList = data.map((emp) => {
          const profile = Array.isArray(emp.profiles) ? emp.profiles[0] : emp.profiles;
          return {
            id: emp.employee_id,
            name: profile?.full_name || 'Sin nombre',
          };
        });
        setEmployees(empList);
      }
    };
    loadEmployees();
  }, [businessId]);

  // Process chart data - usa filtros de tipo ReportFilters
  const reportFilters = useMemo(() => ({
    business_id: businessId,
    start_date: dateRange.start,
    end_date: dateRange.end,
    location_id: selectedLocation !== 'all' ? [selectedLocation] : undefined,
    employee_id: selectedEmployee !== 'all' ? [selectedEmployee] : undefined,
    category: selectedCategory !== 'all' ? [selectedCategory] : undefined,
  }), [businessId, dateRange, selectedLocation, selectedEmployee, selectedCategory]);
  
  const {
    incomeVsExpenseData,
    categoryDistributionData,
    monthlyTrendData,
    locationComparisonData,
    employeePerformanceData,
  } = useChartData(businessId, reportFilters);
  
  // Financial reports hook
  const { generateProfitAndLoss, exportToCSV, exportToExcel, exportToPDF } = useFinancialReports();

  // Stats calculations
  const profitMargin = summary.total_income > 0
    ? ((summary.net_profit / summary.total_income) * 100).toFixed(1)
    : '0.0';

  const handleExportCSV = async () => {
    const toastId = toast.loading(t('billing.csvLoading'));
    try {
      const report = await generateProfitAndLoss(reportFilters);
      // Convertir el reporte a array para exportar
      const dataArray = [
        { item: 'Ingresos Totales', monto: report.total_income },
        ...report.income_by_category.map(cat => ({
          item: `  - ${cat.category}`,
          monto: cat.amount
        })),
        { item: 'Egresos Totales', monto: report.total_expenses },
        ...report.expenses_by_category.map(cat => ({
          item: `  - ${cat.category}`,
          monto: cat.amount
        })),
        { item: 'Utilidad Bruta', monto: report.gross_profit },
        { item: 'Utilidad Neta', monto: report.net_profit },
      ];
      exportToCSV(dataArray, `reporte_${period}`, { format: 'csv', delimiter: ';' });
      toast.success(t('billing.csvSuccess'), { id: toastId });
    } catch (error) {
      toast.error(t('billing.csvError', { error: error instanceof Error ? error.message : 'Error desconocido' }), { id: toastId });
    }
  };

  const handleExportExcel = async () => {
    const toastId = toast.loading(t('billing.excelLoading'));
    try {
      const report = await generateProfitAndLoss(reportFilters);
      const dataArray = [
        { item: 'Ingresos Totales', monto: report.total_income },
        ...report.income_by_category.map(cat => ({
          item: `  - ${cat.category}`,
          monto: cat.amount
        })),
        { item: 'Egresos Totales', monto: report.total_expenses },
        ...report.expenses_by_category.map(cat => ({
          item: `  - ${cat.category}`,
          monto: cat.amount
        })),
        { item: 'Utilidad Bruta', monto: report.gross_profit },
        { item: 'Utilidad Neta', monto: report.net_profit },
      ];
      exportToExcel(dataArray, `Reporte_Financiero_${period}`, 'Reporte');
      toast.success(t('billing.excelSuccess'), { id: toastId });
    } catch (error) {
      toast.error(t('billing.excelError', { error: error instanceof Error ? error.message : 'Error desconocido' }), { id: toastId });
    }
  };

  const handleExportPDF = async () => {
    const toastId = toast.loading(t('billing.pdfLoading'));
    try {
      const report = await generateProfitAndLoss(reportFilters);
      exportToPDF(report, report.business_name, `reporte_${period}.pdf`);
      toast.success(t('billing.pdfSuccess'), { id: toastId });
    } catch (error) {
      toast.error(t('billing.pdfError', { error: error instanceof Error ? error.message : 'Error desconocido' }), { id: toastId });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {t('financial.dashboard')}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {t('financial.dashboardDescription')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel}>
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>

        {/* Filters Row */}
        <Card className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Filtros:</span>
            </div>
            
            {/* Period Filter */}
            <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <SelectTrigger className="w-36">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">Último mes</SelectItem>
                <SelectItem value="3m">Últimos 3 meses</SelectItem>
                <SelectItem value="6m">Últimos 6 meses</SelectItem>
                <SelectItem value="1y">Último año</SelectItem>
              </SelectContent>
            </Select>

            {/* Location Filter */}
            {locations.length > 0 && (
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={t('common.placeholders.allLocations')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.placeholders.allLocations')}</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Employee Filter */}
            {employees.length > 0 && (
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={t('common.placeholders.allEmployees')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.placeholders.allEmployees')}</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t('common.placeholders.allCategories')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.placeholders.allCategories')}</SelectItem>
                <SelectItem value="appointment_payment">Pagos de citas</SelectItem>
                <SelectItem value="product_sale">Venta de productos</SelectItem>
                <SelectItem value="membership">Membresías</SelectItem>
                <SelectItem value="salary">Salarios</SelectItem>
                <SelectItem value="commission">Comisiones</SelectItem>
                <SelectItem value="rent">Alquiler</SelectItem>
                <SelectItem value="utilities">Servicios públicos</SelectItem>
                <SelectItem value="supplies">Suministros</SelectItem>
                <SelectItem value="equipment">Equipos</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="maintenance">Mantenimiento</SelectItem>
                <SelectItem value="tax">Impuestos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>
      </div>

      {/* Main Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        {/* Total Income */}
        <Card className="p-6 bg-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              {t('transactions.totalIncome')}
            </p>
            {loading ? (
              <div className="h-8 bg-muted animate-pulse rounded" />
            ) : (
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCOP(summary.total_income)}
              </p>
            )}
          </div>
        </Card>

        {/* Total Expenses */}
        <Card className="p-6 bg-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
              <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              {t('transactions.totalExpenses')}
            </p>
            {loading ? (
              <div className="h-8 bg-muted animate-pulse rounded" />
            ) : (
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCOP(summary.total_expenses)}
              </p>
            )}
          </div>
        </Card>

        {/* Net Profit */}
        <Card className="p-6 bg-card">
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
                  summary.net_profit >= 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                )}
              >
                {formatCOP(summary.net_profit)}
              </p>
            )}
          </div>
        </Card>

        {/* Profit Margin */}
        <Card className="p-6 bg-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              {t('financial.profitMargin')}
            </p>
            {loading ? (
              <div className="h-8 bg-muted animate-pulse rounded" />
            ) : (
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {profitMargin}%
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="categories">
            <PieChartIcon className="h-4 w-4 mr-2" />
            Por Categoría
          </TabsTrigger>
          <TabsTrigger value="locations">
            Por Sede
          </TabsTrigger>
          <TabsTrigger value="employees">
            Por Empleado
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card className="p-6 bg-card">
            <h3 className="text-lg font-semibold mb-4 text-foreground">
              Ingresos vs Egresos
            </h3>
            <IncomeVsExpenseChart data={incomeVsExpenseData} height={350} />
          </Card>

          <Card className="p-6 bg-card">
            <h3 className="text-lg font-semibold mb-4 text-foreground">
              Tendencia Mensual
            </h3>
            <MonthlyTrendChart data={monthlyTrendData} height={350} showArea />
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-6 bg-card">
              <h3 className="text-lg font-semibold mb-4 text-foreground">
                Distribución por Categoría
              </h3>
              <CategoryPieChart data={categoryDistributionData} height={400} />
            </Card>

            <Card className="p-6 bg-card">
              <h3 className="text-lg font-semibold mb-4 text-foreground">
                Desglose de Categorías
              </h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {categoryDistributionData.map((cat) => (
                  <div
                    key={cat.category}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: cat.color }}
                      />
                      <div>
                        <p className="font-medium text-foreground">{cat.category}</p>
                        <p className="text-xs text-muted-foreground">
                          {cat.count} transacciones
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        {formatCOP(cat.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {cat.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Locations Tab */}
        <TabsContent value="locations" className="space-y-4">
          <Card className="p-6 bg-card">
            <h3 className="text-lg font-semibold mb-4 text-foreground">
              Comparación por Sede
            </h3>
            <LocationBarChart data={locationComparisonData} height={400} />
          </Card>
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-4">
          <Card className="p-6 bg-card">
            <h3 className="text-lg font-semibold mb-4 text-foreground">
              Rendimiento por Empleado
            </h3>
            <EmployeeRevenueChart data={employeePerformanceData} height={400} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
