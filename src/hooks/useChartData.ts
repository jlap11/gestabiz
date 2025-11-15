// ============================================================================
// HOOK: useChartData
// Transforma datos de transacciones a formatos de gráficos
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import supabase from '@/lib/supabase';
import {
  ChartDataPoint,
  CategoryDistribution,
  LocationComparison,
  EmployeeRevenue,
  ReportFilters,
} from '@/types/accounting.types';
import { Transaction, TransactionCategory } from '@/types/types';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

interface UseChartDataReturn {
  incomeVsExpenseData: ChartDataPoint[];
  categoryDistributionData: CategoryDistribution[];
  monthlyTrendData: ChartDataPoint[];
  locationComparisonData: LocationComparison[];
  employeePerformanceData: EmployeeRevenue[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useChartData(
  businessId: string,
  filters?: ReportFilters
): UseChartDataReturn {
  const [incomeVsExpenseData, setIncomeVsExpenseData] = useState<ChartDataPoint[]>([]);
  const [categoryDistributionData, setCategoryDistributionData] = useState<CategoryDistribution[]>([]);
  const [monthlyTrendData, setMonthlyTrendData] = useState<ChartDataPoint[]>([]);
  const [locationComparisonData, setLocationComparisonData] = useState<LocationComparison[]>([]);
  const [employeePerformanceData, setEmployeePerformanceData] = useState<EmployeeRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Obtener transacciones filtradas
  const fetchTransactions = useCallback(async () => {
    let query = supabase
      .from('transactions')
      .select(`
        *,
        location:locations(id, name),
        employee:profiles!transactions_employee_id_fkey(id, full_name)
      `)
      .eq('business_id', businessId);

    // Aplicar filtros
    if (filters?.location_id) {
      if (Array.isArray(filters.location_id)) {
        query = query.in('location_id', filters.location_id);
      } else {
        query = query.eq('location_id', filters.location_id);
      }
    }

    if (filters?.employee_id) {
      if (Array.isArray(filters.employee_id)) {
        query = query.in('employee_id', filters.employee_id);
      } else {
        query = query.eq('employee_id', filters.employee_id);
      }
    }

    if (filters?.date_range) {
      query = query
        .gte('transaction_date', filters.date_range.start)
        .lte('transaction_date', filters.date_range.end);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }, [businessId, filters]);

  // Procesar datos para gráfico de ingresos vs egresos
  const processIncomeVsExpense = useCallback((transactions: Transaction[]) => {
    const periodMap = new Map<string, { income: number; expenses: number }>();

    transactions.forEach(t => {
      const period = format(new Date(t.transaction_date), 'yyyy-MM');
      const current = periodMap.get(period) || { income: 0, expenses: 0 };

      if (t.type === 'income') {
        current.income += Number(t.amount);
      } else {
        current.expenses += Number(t.amount);
      }

      periodMap.set(period, current);
    });

    return Array.from(periodMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, data]) => ({
        period: format(new Date(period + '-01'), 'MMM yyyy', { locale: es }),
        income: data.income,
        expenses: data.expenses,
        profit: data.income - data.expenses,
      }));
  }, []);

  // Procesar distribución por categoría (AGRUPADA)
  const processCategoryDistribution = useCallback((transactions: Transaction[]) => {
    const groupMap = new Map<string, { amount: number; count: number; categories: Set<TransactionCategory> }>();
    let total = 0;

    transactions.forEach(t => {
      const group = getCategoryGroup(t.category);
      const current = groupMap.get(group) || { amount: 0, count: 0, categories: new Set() };
      current.amount += Number(t.amount);
      current.count++;
      current.categories.add(t.category);
      groupMap.set(group, current);
      total += Number(t.amount);
    });

    return Array.from(groupMap.entries())
      .map(([group, data]) => ({
        category: group,
        amount: data.amount,
        percentage: (data.amount / total) * 100,
        count: data.count,
        color: getGroupColor(group),
      }))
      .sort((a, b) => b.amount - a.amount);
  }, []);

  // Procesar tendencia mensual (últimos 12 meses)
  const processMonthlyTrend = useCallback((transactions: Transaction[]) => {
    const months: ChartDataPoint[] = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = subMonths(now, i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);

      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.transaction_date);
        return tDate >= start && tDate <= end;
      });

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      months.push({
        period: format(date, 'MMM', { locale: es }),
        label: format(date, 'MMMM yyyy', { locale: es }),
        income,
        expenses,
        profit: income - expenses,
      });
    }

    return months;
  }, []);

  // Procesar comparación por sedes
  const processLocationComparison = useCallback((transactions: Transaction[]) => {
    const locationMap = new Map<string, {
      name: string;
      income: number;
      expenses: number;
      count: number;
    }>();

    transactions.forEach(t => {
      if (!t.location_id || !t.location) return;

      const current = locationMap.get(t.location_id) || {
        name: t.location.name,
        income: 0,
        expenses: 0,
        count: 0,
      };

      if (t.type === 'income') {
        current.income += Number(t.amount);
      } else {
        current.expenses += Number(t.amount);
      }
      current.count++;

      locationMap.set(t.location_id, current);
    });

    return Array.from(locationMap.entries())
      .map(([location_id, data]) => ({
        location_id,
        location_name: data.name,
        income: data.income,
        expenses: data.expenses,
        profit: data.income - data.expenses,
        transaction_count: data.count,
      }))
      .sort((a, b) => b.profit - a.profit);
  }, []);

  // Procesar rendimiento de empleados (CORREGIDO - usa transactions directamente)
  const processEmployeePerformance = useCallback((transactions: Transaction[]) => {
    const employeeMap = new Map<string, {
      name: string;
      revenue: number;
      appointments: number;
    }>();

    transactions
      .filter(t => t.type === 'income' && t.employee_id && t.employee)
      .forEach(t => {
        const empId = t.employee_id!;
        const current = employeeMap.get(empId) || {
          name: t.employee!.full_name || 'Sin nombre',
          revenue: 0,
          appointments: 0,
        };
        current.revenue += Number(t.amount);
        current.appointments++;
        employeeMap.set(empId, current);
      });

    return Array.from(employeeMap.entries())
      .map(([employee_id, data]) => ({
        employee_id,
        employee_name: data.name,
        total_revenue: data.revenue,
        completed_appointments: data.appointments,
        average_per_appointment: data.appointments > 0
          ? data.revenue / data.appointments
          : 0,
        commission_earned: 0, // Se puede calcular con reglas de comisión
      }))
      .sort((a, b) => b.total_revenue - a.total_revenue);
  }, []);

  // Obtener y procesar todos los datos
  const fetchAndProcessData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const transactions = await fetchTransactions();

      // Procesar todos los datos (ya no async para employeeData)
      setIncomeVsExpenseData(processIncomeVsExpense(transactions));
      setCategoryDistributionData(processCategoryDistribution(transactions));
      setMonthlyTrendData(processMonthlyTrend(transactions));
      setLocationComparisonData(processLocationComparison(transactions));
      setEmployeePerformanceData(processEmployeePerformance(transactions));
    } catch (err) {
      const error = err as Error;
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [
    fetchTransactions,
    processIncomeVsExpense,
    processCategoryDistribution,
    processMonthlyTrend,
    processLocationComparison,
    processEmployeePerformance,
  ]);

  // Refetch manual
  const refetch = useCallback(async () => {
    await fetchAndProcessData();
  }, [fetchAndProcessData]);

  // Cargar datos al montar y cuando cambian los filtros
  useEffect(() => {
    fetchAndProcessData();
  }, [fetchAndProcessData]);

  return {
    incomeVsExpenseData,
    categoryDistributionData,
    monthlyTrendData,
    locationComparisonData,
    employeePerformanceData,
    loading,
    error,
    refetch,
  };
}

// ============================================================================
// UTILIDADES
// ============================================================================

function getCategoryLabel(category: TransactionCategory): string {
  const labels: Record<TransactionCategory, string> = {
    // Ingresos
    appointment_payment: 'Pago de Citas',
    product_sale: 'Venta de Productos',
    tip: 'Propinas',
    membership: 'Membresías',
    package: 'Paquetes',
    other_income: 'Otros Ingresos',
    
    // Egresos
    salary: 'Salarios',
    commission: 'Comisiones',
    rent: 'Arriendo',
    utilities: 'Servicios Públicos',
    supplies: 'Insumos',
    maintenance: 'Mantenimiento',
    marketing: 'Marketing',
    tax: 'Impuestos',
    insurance: 'Seguros',
    equipment: 'Equipos',
    training: 'Capacitación',
    other_expense: 'Otros Gastos',
  };

  return labels[category] || category;
}

// Agrupar categorías en grupos lógicos
function getCategoryGroup(category: TransactionCategory): string {
  const groups: Record<TransactionCategory, string> = {
    // INGRESOS
    appointment_payment: 'Servicios',
    product_sale: 'Ventas',
    tip: 'Propinas',
    membership: 'Membresías',
    package: 'Paquetes',
    other_income: 'Otros Ingresos',
    
    // EGRESOS RECURRENTES
    salary: 'Nómina',
    commission: 'Nómina',
    rent: 'Arriendos',
    utilities: 'Servicios Públicos',
    supplies: 'Insumos',
    maintenance: 'Mantenimiento',
    marketing: 'Marketing',
    tax: 'Impuestos',
    insurance: 'Seguros',
    equipment: 'Equipamiento',
    training: 'Capacitación',
    other_expense: 'Otros Gastos',
  };

  return groups[category] || 'Otros';
}

// Colores para grupos de categorías
function getGroupColor(group: string): string {
  const colors: Record<string, string> = {
    // Ingresos
    'Servicios': '#10b981',
    'Ventas': '#3b82f6',
    'Propinas': '#06b6d4',
    'Membresías': '#8b5cf6',
    'Paquetes': '#14b8a6',
    'Otros Ingresos': '#6366f1',
    
    // Egresos
    'Nómina': '#ef4444',
    'Arriendos': '#f97316',
    'Servicios Públicos': '#fb923c',
    'Insumos': '#fbbf24',
    'Mantenimiento': '#facc15',
    'Marketing': '#a855f7',
    'Impuestos': '#dc2626',
    'Seguros': '#ea580c',
    'Equipamiento': '#d97706',
    'Capacitación': '#c026d3',
    'Otros Gastos': '#9ca3af',
  };

  return colors[group] || '#6b7280';
}

// Colores para gráficos de categorías individuales (LEGACY - mantener para compatibilidad)
export function getCategoryColor(category: TransactionCategory): string {
  const colors: Record<TransactionCategory, string> = {
    // Ingresos (verdes/azules)
    appointment_payment: '#10b981',
    product_sale: '#3b82f6',
    tip: '#06b6d4',
    membership: '#8b5cf6',
    package: '#14b8a6',
    other_income: '#6366f1',
    
    // Egresos (rojos/naranjas)
    salary: '#ef4444',
    commission: '#f59e0b',
    rent: '#f97316',
    utilities: '#fb923c',
    supplies: '#fbbf24',
    maintenance: '#facc15',
    marketing: '#a855f7',
    tax: '#dc2626',
    insurance: '#ea580c',
    equipment: '#d97706',
    training: '#c026d3',
    other_expense: '#9ca3af',
  };

  return colors[category] || '#6b7280';
}
