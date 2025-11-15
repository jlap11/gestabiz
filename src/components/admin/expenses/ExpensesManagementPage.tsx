import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExpenseRegistrationForm } from './ExpenseRegistrationForm';
import { toast } from 'sonner';
import {
  ArrowDownCircle,
  Edit,
  MoreVertical,
  Plus,
  Repeat,
  Trash2,
  TrendingDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { RecurringExpense, Transaction } from '@/types/types';

interface ExpensesManagementPageProps {
  businessId: string;
}

// Utility function for currency formatting
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
};

// Utility function for date formatting
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const ExpensesManagementPage: React.FC<ExpensesManagementPageProps> = ({ businessId }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'one-time' | 'recurring' | 'summary'>('one-time');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Data
  const [oneTimeExpenses, setOneTimeExpenses] = useState<Transaction[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [locations, setLocations] = useState<Array<{ id: string; name: string }>>([]);
  
  // Stats
  const [totalThisMonth, setTotalThisMonth] = useState(0);
  const [totalLast7Days, setTotalLast7Days] = useState(0);
  const [totalToday, setTotalToday] = useState(0);

  useEffect(() => {
    if (businessId) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchOneTimeExpenses(),
        fetchRecurringExpenses(),
        fetchLocations(),
        fetchStats(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOneTimeExpenses = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        location:locations(id, name)
      `)
      .eq('business_id', businessId)
      .eq('type', 'expense')
      .order('transaction_date', { ascending: false })
      .limit(50);

    if (error) {
      toast.error('Error al cargar egresos');
    } else {
      setOneTimeExpenses(data || []);
    }
  };

  const fetchRecurringExpenses = async () => {
    const { data, error } = await supabase
      .from('recurring_expenses')
      .select(`
        *,
        location:locations(id, name),
        employee:profiles!recurring_expenses_employee_id_fkey(
          id,
          full_name
        )
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false});

    if (error) {
      toast.error('Error al cargar egresos recurrentes');
    } else {
      setRecurringExpenses(data || []);
    }
  };

  const fetchLocations = async () => {
    const { data, error } = await supabase
      .from('locations')
      .select('id, name')
      .eq('business_id', businessId)
      .eq('is_active', true);

    if (error) {
      // Error silencioso, locations es opcional
    } else {
      setLocations(data || []);
    }
  };

  const fetchStats = async () => {
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    // Today
    const { data: todayData } = await supabase
      .from('transactions')
      .select('amount')
      .eq('business_id', businessId)
      .eq('type', 'expense')
      .eq('transaction_date', today);
    
    const todayTotal = todayData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
    setTotalToday(todayTotal);

    // Last 7 days
    const { data: weekData } = await supabase
      .from('transactions')
      .select('amount')
      .eq('business_id', businessId)
      .eq('type', 'expense')
      .gte('transaction_date', sevenDaysAgo);
    
    const weekTotal = weekData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
    setTotalLast7Days(weekTotal);

    // This month
    const { data: monthData } = await supabase
      .from('transactions')
      .select('amount')
      .eq('business_id', businessId)
      .eq('type', 'expense')
      .gte('transaction_date', firstDayOfMonth);
    
    const monthTotal = monthData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
    setTotalThisMonth(monthTotal);
  };

  const handleEditExpense = (expense: RecurringExpense) => {
    // Navegación contextual según el tipo de egreso
    if (expense.location_id) {
      // Egreso de sede → Ir a LocationsManager
      navigate(`/app/admin/locations`); // Podrías agregar ?locationId=${expense.location_id} si soportas deep linking
      toast.info(`Redirigido a Sedes para editar: ${expense.name || expense.description}`);
    } else if (expense.employee_id) {
      // Egreso de empleado (nómina) → Abrir modal de empleado
      // Por ahora, mostrar mensaje (necesita integración con EmployeeProfileModal)
      toast.info(`Para editar salario de empleado, ve a Gestión de Empleados`);
    } else {
      // Egreso general del negocio → Ir a Settings
      navigate(`/app/admin/settings?tab=info`); // Asumiendo que BusinessRecurringExpenses está en tab 'info'
      toast.info(`Redirigido a Configuraciones para editar: ${expense.name || expense.description}`);
    }
  };

  const handleDeleteRecurring = async (expenseId: string) => {
    if (!confirm('¿Estás seguro de eliminar este egreso recurrente?')) return;

    const { error } = await supabase
      .from('recurring_expenses')
      .delete()
      .eq('id', expenseId);

    if (error) {
      toast.error('Error al eliminar egreso recurrente');
    } else {
      toast.success('Egreso recurrente eliminado');
      fetchRecurringExpenses();
    }
  };

  const handleToggleActive = async (expenseId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('recurring_expenses')
      .update({ is_active: !currentStatus })
      .eq('id', expenseId);

    if (error) {
      toast.error('Error al actualizar estado');
    } else {
      const newStatus = !currentStatus;
      toast.success(`Egreso ${newStatus ? 'activado' : 'desactivado'}`);
      fetchRecurringExpenses();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando egresos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ArrowDownCircle className="h-8 w-8 text-destructive" />
            Gestión de Egresos
          </h1>
          <p className="text-muted-foreground mt-1">
            Registra y administra todos los egresos de tu negocio
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Egreso
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Egresos Hoy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(totalToday)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Últimos 7 Días</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(totalLast7Days)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Este Mes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(totalThisMonth)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form (collapsible) */}
      {showForm && (
        <ExpenseRegistrationForm
          businessId={businessId}
          locations={locations}
          onSuccess={() => {
            setShowForm(false);
            fetchData();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="one-time">Egresos Únicos</TabsTrigger>
          <TabsTrigger value="recurring">Egresos Recurrentes</TabsTrigger>
          <TabsTrigger value="summary">Resumen por Categoría</TabsTrigger>
        </TabsList>

        {/* One-Time Expenses Tab */}
        <TabsContent value="one-time" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Egresos Únicos Recientes (Últimos 50)</CardTitle>
              <CardDescription>
                Transacciones de egreso que no son recurrentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {oneTimeExpenses.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No hay egresos registrados aún
                </div>
              ) : (
                <div className="space-y-2">
                  {oneTimeExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{expense.description}</span>
                          <Badge variant="outline">{expense.category}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {formatDate(expense.transaction_date)}
                          {expense.location && ` • ${expense.location.name}`}
                          {expense.payment_method && ` • ${expense.payment_method}`}
                        </div>
                      </div>
                      <div className="text-lg font-semibold text-destructive">
                        -{formatCurrency(expense.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recurring Expenses Tab */}
        <TabsContent value="recurring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Repeat className="h-5 w-5" />
                Egresos Recurrentes Configurados
              </CardTitle>
              <CardDescription>
                Egresos que se generan automáticamente según frecuencia
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recurringExpenses.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No hay egresos recurrentes configurados
                </div>
              ) : (
                <div className="space-y-2">
                  {recurringExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {expense.name || expense.description}
                          </span>
                          <Badge variant="outline">{expense.category}</Badge>
                          <Badge variant={expense.is_active ? 'default' : 'secondary'}>
                            {expense.is_active ? 'Activo' : 'Inactivo'}
                          </Badge>
                          {expense.is_automated && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Auto
                            </Badge>
                          )}
                          {/* Badge de Origen */}
                          {expense.location_id && expense.location && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              Sede: {expense.location.name}
                            </Badge>
                          )}
                          {expense.employee_id && expense.employee && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                              Empleado: {expense.employee.full_name}
                            </Badge>
                          )}
                          {!expense.location_id && !expense.employee_id && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                              General
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {expense.recurrence_frequency} • Próximo pago:{' '}
                          {formatDate(expense.next_payment_date)}
                          {expense.location && ` • ${expense.location.name}`}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Total pagado: {formatCurrency(expense.total_paid || 0)} •{' '}
                          {expense.payments_count || 0} pagos realizados
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-lg font-semibold text-destructive">
                          {formatCurrency(expense.amount)}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditExpense(expense)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleActive(expense.id, expense.is_active)}
                            >
                              {expense.is_active ? 'Desactivar' : 'Activar'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteRecurring(expense.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                Resumen por Categoría (Este Mes)
              </CardTitle>
              <CardDescription>
                Desglose de egresos por categoría
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExpenseSummaryByCategory
                businessId={businessId}
                startDate={new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]}
                endDate={new Date().toISOString().split('T')[0]}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Component for category summary
const ExpenseSummaryByCategory: React.FC<{
  businessId: string;
  startDate: string;
  endDate: string;
}> = ({ businessId, startDate, endDate }) => {
  const [summary, setSummary] = useState<Array<{
    category: string;
    total_amount: number;
    transaction_count: number;
    avg_amount: number;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, startDate, endDate]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_expense_summary_by_category', {
        p_business_id: businessId,
        p_start_date: startDate,
        p_end_date: endDate,
      });

      if (error) {
        toast.error('Error al cargar resumen');
      } else {
        setSummary(data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Cargando resumen...</div>;
  }

  if (summary.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No hay datos para mostrar</div>;
  }

  const totalAmount = summary.reduce((sum, cat) => sum + cat.total_amount, 0);

  return (
    <div className="space-y-3">
      {summary.map((cat) => {
        const percentage = (cat.total_amount / totalAmount) * 100;
        return (
          <div key={cat.category} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{cat.category}</Badge>
                <span className="text-muted-foreground">
                  {cat.transaction_count} transacciones
                </span>
              </div>
              <span className="font-semibold">{formatCurrency(cat.total_amount)}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-destructive transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Promedio: {formatCurrency(cat.avg_amount)} • {percentage.toFixed(1)}% del total
            </div>
          </div>
        );
      })}
      <div className="pt-4 border-t">
        <div className="flex items-center justify-between">
          <span className="font-semibold">Total General</span>
          <span className="text-lg font-bold text-destructive">
            {formatCurrency(totalAmount)}
          </span>
        </div>
      </div>
    </div>
  );
};
