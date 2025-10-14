// ============================================================================
// COMPONENT: ExpenseManager
// Gestión completa de gastos recurrentes con plantillas y alertas
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertCircle,
  Calendar,
  DollarSign,
  Plus,
  Repeat,
  Trash2,
  Edit,
  Bell,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTransactions } from '@/hooks/useTransactions';
import supabase from '@/lib/supabase';
import { formatCOP } from '@/lib/accounting/colombiaTaxes';
import type { TransactionCategory } from '@/types/types';

interface RecurringExpense {
  id: string;
  business_id: string;
  category: TransactionCategory;
  description: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  next_payment_date: string;
  last_payment_date?: string;
  is_active: boolean;
  payment_method?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface ExpenseTemplate {
  id: string;
  name: string;
  category: TransactionCategory;
  default_amount?: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  description: string;
}

interface ExpenseManagerProps {
  businessId: string;
}

// Plantillas predefinidas de gastos comunes
const EXPENSE_TEMPLATES: ExpenseTemplate[] = [
  {
    id: 'rent',
    name: 'Arriendo Local',
    category: 'rent',
    default_amount: 2000000, // $2M COP mensual
    frequency: 'monthly',
    description: 'Pago mensual de arriendo del local comercial'
  },
  {
    id: 'utilities',
    name: 'Servicios Públicos',
    category: 'utilities',
    default_amount: 300000, // $300K COP mensual
    frequency: 'monthly',
    description: 'Agua, luz, gas, internet'
  },
  {
    id: 'insurance',
    name: 'Seguro del Negocio',
    category: 'insurance',
    default_amount: 500000, // $500K COP mensual
    frequency: 'monthly',
    description: 'Póliza de seguro del establecimiento'
  },
  {
    id: 'supplies',
    name: 'Compra de Insumos',
    category: 'supplies',
    frequency: 'weekly',
    description: 'Materiales y suministros de trabajo'
  },
  {
    id: 'marketing',
    name: 'Publicidad Digital',
    category: 'marketing',
    default_amount: 400000, // $400K COP mensual
    frequency: 'monthly',
    description: 'Gastos en redes sociales y marketing'
  },
  {
    id: 'maintenance',
    name: 'Mantenimiento',
    category: 'maintenance',
    frequency: 'quarterly',
    description: 'Mantenimiento de equipos e instalaciones'
  },
];

const EXPENSE_CATEGORIES: TransactionCategory[] = [
  'rent',
  'utilities',
  'supplies',
  'maintenance',
  'marketing',
  'tax',
  'insurance',
  'equipment',
  'training',
  'other_expense',
];

// Helper functions
const getFrequencyLabel = (frequency: RecurringExpense['frequency']): string => {
  const labels = {
    daily: 'Diario',
    weekly: 'Semanal',
    monthly: 'Mensual',
    quarterly: 'Trimestral',
    yearly: 'Anual',
  };
  return labels[frequency];
};

const getDaysUntilPaymentLabel = (days: number): string => {
  if (days < 0) return `Vencido hace ${Math.abs(days)} días`;
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Mañana';
  return `En ${days} días`;
};

const getPaymentStatusClass = (isOverdue: boolean, isUrgent: boolean): string => {
  if (isOverdue) return 'border-red-500';
  if (isUrgent) return 'border-yellow-500';
  return '';
};

const getPaymentTextClass = (isOverdue: boolean, isUrgent: boolean): string => {
  if (isOverdue) return 'text-red-600';
  if (isUrgent) return 'text-yellow-600';
  return 'text-foreground';
};

export function ExpenseManager({ businessId }: Readonly<ExpenseManagerProps>) {
  const { createFiscalTransaction } = useTransactions();

  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null);
  const [activeTab, setActiveTab] = useState('list');
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    category: 'rent' as TransactionCategory,
    description: '',
    amount: 0,
    frequency: 'monthly' as RecurringExpense['frequency'],
    next_payment_date: new Date().toISOString().split('T')[0],
    payment_method: '',
    notes: '',
  });

  // Fetch recurring expenses
  const fetchRecurringExpenses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('recurring_expenses')
        .select('*')
        .eq('business_id', businessId)
        .order('next_payment_date', { ascending: true });

      if (error) throw error;
      setRecurringExpenses(data || []);
    } catch (error) {
      toast.error(`Error al cargar gastos recurrentes: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRecurringExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  // Calculate next payment date based on frequency
  const calculateNextPaymentDate = (currentDate: string, frequency: RecurringExpense['frequency']): string => {
    const date = new Date(currentDate);
    switch (frequency) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
    }
    return date.toISOString().split('T')[0];
  };

  // Create recurring expense
  const handleCreateExpense = async () => {
    const toastId = toast.loading('Creando gasto recurrente...');
    try {
      const { error } = await supabase
        .from('recurring_expenses')
        .insert({
          business_id: businessId,
          category: formData.category,
          description: formData.description,
          amount: formData.amount,
          frequency: formData.frequency,
          next_payment_date: formData.next_payment_date,
          payment_method: formData.payment_method || null,
          notes: formData.notes || null,
          is_active: true,
        });

      if (error) throw error;

      toast.success('Gasto recurrente creado exitosamente', { id: toastId });
      setIsDialogOpen(false);
      resetForm();
      fetchRecurringExpenses();
    } catch (error) {
      toast.error(`Error al crear gasto: ${error instanceof Error ? error.message : 'Error desconocido'}`, { id: toastId });
    }
  };

  // Update recurring expense
  const handleUpdateExpense = async () => {
    if (!editingExpense) return;

    const toastId = toast.loading('Actualizando gasto recurrente...');
    try {
      const { error } = await supabase
        .from('recurring_expenses')
        .update({
          category: formData.category,
          description: formData.description,
          amount: formData.amount,
          frequency: formData.frequency,
          next_payment_date: formData.next_payment_date,
          payment_method: formData.payment_method || null,
          notes: formData.notes || null,
        })
        .eq('id', editingExpense.id);

      if (error) throw error;

      toast.success('Gasto recurrente actualizado exitosamente', { id: toastId });
      setIsDialogOpen(false);
      setEditingExpense(null);
      resetForm();
      fetchRecurringExpenses();
    } catch (error) {
      toast.error(`Error al actualizar gasto: ${error instanceof Error ? error.message : 'Error desconocido'}`, { id: toastId });
    }
  };

  // Delete recurring expense
  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('¿Estás seguro de eliminar este gasto recurrente?')) return;

    const toastId = toast.loading('Eliminando gasto...');
    try {
      const { error } = await supabase
        .from('recurring_expenses')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;

      toast.success('Gasto recurrente eliminado exitosamente', { id: toastId });
      fetchRecurringExpenses();
    } catch (error) {
      toast.error(`Error al eliminar gasto: ${error instanceof Error ? error.message : 'Error desconocido'}`, { id: toastId });
    }
  };

  // Process payment (create transaction and update next payment date)
  const handleProcessPayment = async (expense: RecurringExpense) => {
    const toastId = toast.loading('Procesando pago...');
    try {
      // Create transaction
      await createFiscalTransaction({
        business_id: businessId,
        type: 'expense',
        category: expense.category,
        subtotal: expense.amount,
        total_amount: expense.amount,
        description: `${expense.description} - ${expense.frequency}`,
        transaction_date: new Date().toISOString().split('T')[0],
        payment_method: expense.payment_method,
      });

      // Update recurring expense
      const nextPaymentDate = calculateNextPaymentDate(expense.next_payment_date, expense.frequency);
      const { error } = await supabase
        .from('recurring_expenses')
        .update({
          last_payment_date: new Date().toISOString().split('T')[0],
          next_payment_date: nextPaymentDate,
        })
        .eq('id', expense.id);

      if (error) throw error;

      toast.success('Pago procesado exitosamente', { id: toastId });
      fetchRecurringExpenses();
    } catch (error) {
      toast.error(`Error al procesar pago: ${error instanceof Error ? error.message : 'Error desconocido'}`, { id: toastId });
    }
  };

  // Apply template
  const applyTemplate = (template: ExpenseTemplate) => {
    setFormData({
      category: template.category,
      description: template.description,
      amount: template.default_amount || 0,
      frequency: template.frequency,
      next_payment_date: new Date().toISOString().split('T')[0],
      payment_method: '',
      notes: '',
    });
    setActiveTab('list');
    setIsDialogOpen(true);
  };

  // Edit expense
  const handleEditExpense = (expense: RecurringExpense) => {
    setEditingExpense(expense);
    setFormData({
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      frequency: expense.frequency,
      next_payment_date: expense.next_payment_date,
      payment_method: expense.payment_method || '',
      notes: expense.notes || '',
    });
    setIsDialogOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      category: 'rent',
      description: '',
      amount: 0,
      frequency: 'monthly',
      next_payment_date: new Date().toISOString().split('T')[0],
      payment_method: '',
      notes: '',
    });
    setEditingExpense(null);
  };

  // Upcoming payments (next 30 days)
  const upcomingPayments = useMemo(() => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    return recurringExpenses.filter(expense => {
      const paymentDate = new Date(expense.next_payment_date);
      return expense.is_active && paymentDate <= thirtyDaysFromNow;
    }).sort((a, b) => new Date(a.next_payment_date).getTime() - new Date(b.next_payment_date).getTime());
  }, [recurringExpenses]);

  // Overdue payments
  const overduePayments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return recurringExpenses.filter(expense => {
      const paymentDate = new Date(expense.next_payment_date);
      paymentDate.setHours(0, 0, 0, 0);
      return expense.is_active && paymentDate < today;
    });
  }, [recurringExpenses]);

  // Total monthly expenses
  const totalMonthlyExpenses = useMemo(() => {
    return recurringExpenses
      .filter(e => e.is_active)
      .reduce((sum, expense) => {
        // Convert to monthly equivalent
        let monthlyAmount = expense.amount;
        switch (expense.frequency) {
          case 'daily':
            monthlyAmount = expense.amount * 30;
            break;
          case 'weekly':
            monthlyAmount = expense.amount * 4.33; // ~4.33 weeks/month
            break;
          case 'quarterly':
            monthlyAmount = expense.amount / 3;
            break;
          case 'yearly':
            monthlyAmount = expense.amount / 12;
            break;
        }
        return sum + monthlyAmount;
      }, 0);
  }, [recurringExpenses]);

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Gasto Mensual Estimado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{formatCOP(totalMonthlyExpenses)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Pagos Próximos (30 días)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{upcomingPayments.length}</p>
          </CardContent>
        </Card>

        <Card className={overduePayments.length > 0 ? 'border-red-500' : ''}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Pagos Vencidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${overduePayments.length > 0 ? 'text-red-600' : 'text-foreground'}`}>
              {overduePayments.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestión de Gastos Recurrentes</CardTitle>
              <CardDescription>
                Administra tus gastos fijos y recurrentes del negocio
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Gasto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingExpense ? 'Editar Gasto Recurrente' : 'Nuevo Gasto Recurrente'}
                  </DialogTitle>
                  <DialogDescription>
                    Configura un gasto que se repite periódicamente
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {/* Category */}
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({...formData, category: value as TransactionCategory})}
                    >
                      <SelectTrigger id="category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat}>
                            {cat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Ej: Arriendo local comercial"
                      required
                    />
                  </div>

                  {/* Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="amount">Monto (COP)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="1000"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                      required
                    />
                  </div>

                  {/* Frequency */}
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Frecuencia</Label>
                    <Select
                      value={formData.frequency}
                      onValueChange={(value) => setFormData({...formData, frequency: value as RecurringExpense['frequency']})}
                    >
                      <SelectTrigger id="frequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diario</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensual</SelectItem>
                        <SelectItem value="quarterly">Trimestral</SelectItem>
                        <SelectItem value="yearly">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Next Payment Date */}
                  <div className="space-y-2">
                    <Label htmlFor="next_payment_date">Próximo Pago</Label>
                    <Input
                      id="next_payment_date"
                      type="date"
                      value={formData.next_payment_date}
                      onChange={(e) => setFormData({...formData, next_payment_date: e.target.value})}
                      required
                    />
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-2">
                    <Label htmlFor="payment_method">Método de Pago (opcional)</Label>
                    <Input
                      id="payment_method"
                      value={formData.payment_method}
                      onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                      placeholder="Ej: Transferencia bancaria, Efectivo"
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas (opcional)</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Información adicional sobre este gasto..."
                      rows={3}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        resetForm();
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={editingExpense ? handleUpdateExpense : handleCreateExpense}
                    >
                      {editingExpense ? 'Actualizar' : 'Crear'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="list">
                <Repeat className="h-4 w-4 mr-2" />
                Gastos Activos
              </TabsTrigger>
              <TabsTrigger value="upcoming">
                <Calendar className="h-4 w-4 mr-2" />
                Próximos Pagos
              </TabsTrigger>
              <TabsTrigger value="templates">
                <FileText className="h-4 w-4 mr-2" />
                Plantillas
              </TabsTrigger>
            </TabsList>

            {/* Active Expenses */}
            <TabsContent value="list" className="space-y-4">
              {loading && <div className="text-center py-8 text-muted-foreground">Cargando gastos...</div>}
              {!loading && recurringExpenses.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No hay gastos recurrentes registrados
                </div>
              )}
              {!loading && recurringExpenses.length > 0 && (
                <div className="space-y-2">
                  {recurringExpenses.map(expense => (
                    <Card key={expense.id} className={!expense.is_active ? 'opacity-50' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-foreground">{expense.description}</h4>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                {expense.category}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {formatCOP(expense.amount)} - {getFrequencyLabel(expense.frequency)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Próximo pago: {new Date(expense.next_payment_date).toLocaleDateString('es-CO')}
                              {expense.last_payment_date && ` | Último: ${new Date(expense.last_payment_date).toLocaleDateString('es-CO')}`}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleProcessPayment(expense)}
                            >
                              Pagar
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditExpense(expense)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteExpense(expense.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Upcoming Payments */}
            <TabsContent value="upcoming" className="space-y-4">
              {upcomingPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay pagos programados para los próximos 30 días
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingPayments.map(expense => {
                    const daysUntilPayment = Math.ceil(
                      (new Date(expense.next_payment_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                    );
                    const isOverdue = daysUntilPayment < 0;
                    const isUrgent = daysUntilPayment <= 7 && !isOverdue;

                    return (
                      <Card
                        key={expense.id}
                        className={getPaymentStatusClass(isOverdue, isUrgent)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-foreground">{expense.description}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {formatCOP(expense.amount)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`text-sm font-medium ${getPaymentTextClass(isOverdue, isUrgent)}`}>
                                {new Date(expense.next_payment_date).toLocaleDateString('es-CO')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {getDaysUntilPaymentLabel(daysUntilPayment)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Templates */}
            <TabsContent value="templates" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {EXPENSE_TEMPLATES.map(template => (
                  <Card key={template.id} className="hover:border-primary cursor-pointer transition-colors"
                        onClick={() => applyTemplate(template)}>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {template.name}
                      </CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-muted-foreground">Frecuencia</p>
                          <p className="font-medium">
                            {getFrequencyLabel(template.frequency)}
                          </p>
                        </div>
                        {template.default_amount && (
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Monto sugerido</p>
                            <p className="font-medium">{formatCOP(template.default_amount)}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
