import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { calculateNextPaymentDate } from '@/utils/expense';
import type { 
  RecurringExpense, 
  ExpenseFormData, 
  ExpenseTemplate, 
  UseExpenseManagerReturn 
} from '@/types/expense';

export const useExpenseManager = (): UseExpenseManagerReturn => {
  // Estados principales
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null);
  const [activeTab, setActiveTab] = useState('recurring');
  const [isLoading, setIsLoading] = useState(false);

  // Cálculos memoizados
  const upcomingPayments = useMemo(() => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return recurringExpenses
      .filter(expense => {
        const paymentDate = new Date(expense.next_payment_date);
        return paymentDate <= nextWeek;
      })
      .sort((a, b) => 
        new Date(a.next_payment_date).getTime() - new Date(b.next_payment_date).getTime()
      );
  }, [recurringExpenses]);

  const overduePayments = useMemo(() => {
    const today = new Date();
    return recurringExpenses.filter(expense => {
      const paymentDate = new Date(expense.next_payment_date);
      return paymentDate < today;
    });
  }, [recurringExpenses]);

  // Cargar gastos recurrentes
  const fetchRecurringExpenses = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('recurring_expenses')
        .select('*')
        .order('next_payment_date', { ascending: true });

      if (error) throw error;
      setRecurringExpenses(data || []);
    } catch (error) {
      console.error('Error fetching recurring expenses:', error);
      toast.error('Error al cargar los gastos recurrentes');
    } finally {
      setIsLoading(false);
    }
  };

  // Crear nuevo gasto
  const handleCreateExpense = async (formData: ExpenseFormData) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('recurring_expenses')
        .insert([{
          name: formData.name,
          amount: formData.amount,
          category: formData.category,
          frequency: formData.frequency,
          description: formData.description,
          next_payment_date: formData.next_payment_date,
        }])
        .select()
        .single();

      if (error) throw error;

      setRecurringExpenses(prev => [...prev, data]);
      setIsDialogOpen(false);
      toast.success('Gasto recurrente creado exitosamente');
    } catch (error) {
      console.error('Error creating recurring expense:', error);
      toast.error('Error al crear el gasto recurrente');
    } finally {
      setIsLoading(false);
    }
  };

  // Actualizar gasto existente
  const handleUpdateExpense = async (formData: ExpenseFormData) => {
    if (!editingExpense) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('recurring_expenses')
        .update({
          name: formData.name,
          amount: formData.amount,
          category: formData.category,
          frequency: formData.frequency,
          description: formData.description,
          next_payment_date: formData.next_payment_date,
        })
        .eq('id', editingExpense.id)
        .select()
        .single();

      if (error) throw error;

      setRecurringExpenses(prev =>
        prev.map(expense => expense.id === editingExpense.id ? data : expense)
      );
      setIsDialogOpen(false);
      setEditingExpense(null);
      toast.success('Gasto recurrente actualizado exitosamente');
    } catch (error) {
      console.error('Error updating recurring expense:', error);
      toast.error('Error al actualizar el gasto recurrente');
    } finally {
      setIsLoading(false);
    }
  };

  // Eliminar gasto
  const handleDeleteExpense = async (expenseId: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('recurring_expenses')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;

      setRecurringExpenses(prev => prev.filter(expense => expense.id !== expenseId));
      toast.success('Gasto recurrente eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting recurring expense:', error);
      toast.error('Error al eliminar el gasto recurrente');
    } finally {
      setIsLoading(false);
    }
  };

  // Usar plantilla
  const handleUseTemplate = (template: ExpenseTemplate) => {
    const nextPaymentDate = calculateNextPaymentDate(
      new Date().toISOString(),
      template.frequency
    );

    setEditingExpense({
      id: '',
      name: template.name,
      amount: template.default_amount || 0,
      category: template.category,
      frequency: template.frequency,
      description: template.description,
      next_payment_date: nextPaymentDate.toISOString().split('T')[0],
      created_at: '',
      updated_at: '',
    });
    setIsDialogOpen(true);
  };

  // Abrir formulario para editar
  const handleEditExpense = (expense: RecurringExpense) => {
    setEditingExpense(expense);
    setIsDialogOpen(true);
  };

  // Abrir formulario para crear nuevo
  const handleNewExpense = () => {
    setEditingExpense(null);
    setIsDialogOpen(true);
  };

  // Cerrar formulario
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingExpense(null);
  };

  // Manejar envío del formulario
  const handleFormSubmit = (formData: ExpenseFormData) => {
    if (editingExpense?.id) {
      handleUpdateExpense(formData);
    } else {
      handleCreateExpense(formData);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchRecurringExpenses();
  }, []);

  return {
    // Estados
    recurringExpenses,
    upcomingPayments,
    overduePayments,
    isDialogOpen,
    editingExpense,
    activeTab,
    isLoading,

    // Acciones
    handleNewExpense,
    handleEditExpense,
    handleDeleteExpense,
    handleUseTemplate,
    handleCloseDialog,
    handleFormSubmit,
    setActiveTab,
    fetchRecurringExpenses,
  };
};