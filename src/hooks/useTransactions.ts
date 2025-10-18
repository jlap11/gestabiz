import { useState, useEffect } from 'react';
import supabase from '@/lib/supabase';
import { Transaction, TransactionFilters, TransactionType, TransactionCategory } from '@/types/types';
import { toast } from 'sonner';

/**
 * Hook para gestionar transacciones financieras (ingresos y egresos)
 */
export function useTransactions(filters?: TransactionFilters) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [summary, setSummary] = useState({
    total_income: 0,
    total_expenses: 0,
    net_profit: 0,
    transaction_count: 0,
  });

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('transactions')
        .select(`
          *,
          location:locations(id, name),
          employee:profiles!transactions_employee_id_fkey(id, full_name, email)
        `);

      // Apply filters
      if (filters?.business_id) query = query.eq('business_id', filters.business_id);
      if (filters?.location_id) query = query.eq('location_id', filters.location_id);
      if (filters?.type && filters.type.length > 0) query = query.in('type', filters.type);
      if (filters?.category && filters.category.length > 0) query = query.in('category', filters.category);
      if (filters?.is_verified !== undefined) query = query.eq('is_verified', filters.is_verified);
      if (filters?.min_amount) query = query.gte('amount', filters.min_amount);
      if (filters?.max_amount) query = query.lte('amount', filters.max_amount);
      if (filters?.date_range) {
        query = query
          .gte('transaction_date', filters.date_range.start)
          .lte('transaction_date', filters.date_range.end);
      }

      query = query.order('transaction_date', { ascending: false });

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setTransactions(data || []);

      // Calculate summary
      if (data && data.length > 0) {
        const income = data
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0);
        const expenses = data
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        setSummary({
          total_income: income,
          total_expenses: expenses,
          net_profit: income - expenses,
          transaction_count: data.length,
        });
      } else {
        setSummary({
          total_income: 0,
          total_expenses: 0,
          net_profit: 0,
          transaction_count: 0,
        });
      }
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast.error(`Error al cargar transacciones: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Create transaction
  const createTransaction = async (
    businessId: string,
    type: TransactionType,
    category: TransactionCategory,
    amount: number,
    description?: string,
    options?: {
      location_id?: string;
      appointment_id?: string;
      employee_id?: string;
      transaction_date?: string;
      payment_method?: string;
      reference_number?: string;
      metadata?: Record<string, unknown>;
    }
  ) => {
    try {
      const { data, error: insertError } = await supabase
        .from('transactions')
        .insert({
          business_id: businessId,
          type,
          category,
          amount,
          currency: 'MXN',
          description,
          location_id: options?.location_id,
          appointment_id: options?.appointment_id,
          employee_id: options?.employee_id,
          transaction_date: options?.transaction_date || new Date().toISOString().split('T')[0],
          payment_method: options?.payment_method,
          reference_number: options?.reference_number,
          metadata: options?.metadata || {},
          is_verified: false,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success('Transacción creada exitosamente');
      fetchTransactions();
      return data;
    } catch (err) {
      const error = err as Error;
      toast.error(`Error al crear transacción: ${error.message}`);
      throw error;
    }
  };

  // Update transaction
  const updateTransaction = async (
    transactionId: string,
    updates: {
      type?: TransactionType;
      category?: TransactionCategory;
      amount?: number;
      description?: string;
      payment_method?: string;
      reference_number?: string;
    }
  ) => {
    try {
      const { error: updateError } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', transactionId);

      if (updateError) throw updateError;

      toast.success('Transacción actualizada exitosamente');
      fetchTransactions();
    } catch (err) {
      const error = err as Error;
      toast.error(`Error al actualizar transacción: ${error.message}`);
      throw error;
    }
  };

  // Verify transaction
  const verifyTransaction = async (transactionId: string, verifiedBy: string) => {
    try {
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          is_verified: true,
          verified_by: verifiedBy,
          verified_at: new Date().toISOString(),
        })
        .eq('id', transactionId);

      if (updateError) throw updateError;

      toast.success('Transacción verificada');
      fetchTransactions();
    } catch (err) {
      const error = err as Error;
      toast.error(`Error al verificar transacción: ${error.message}`);
      throw error;
    }
  };

  // Delete transaction
  const deleteTransaction = async (transactionId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId);

      if (deleteError) throw deleteError;

      toast.success('Transacción eliminada');
      fetchTransactions();
    } catch (err) {
      const error = err as Error;
      toast.error(`Error al eliminar transacción: ${error.message}`);
      throw error;
    }
  };

  // Get transactions by date range
  const getTransactionsByDateRange = async (startDate: string, endDate: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .order('transaction_date', { ascending: false });

      if (fetchError) throw fetchError;

      return data || [];
    } catch (err) {
      const error = err as Error;
      toast.error(`Error al obtener transacciones: ${error.message}`);
      throw error;
    }
  };

  /**
   * Crea una transacción con información fiscal completa (subtotal, impuestos, etc.)
   */
  const createFiscalTransaction = async (transaction: {
    business_id: string;
    location_id?: string;
    type: TransactionType;
    category: TransactionCategory;
    subtotal: number;
    tax_type?: string;
    tax_rate?: number;
    tax_amount?: number;
    total_amount: number;
    description?: string;
    appointment_id?: string;
    employee_id?: string;
    transaction_date?: string;
    payment_method?: string;
    reference_number?: string;
    is_tax_deductible?: boolean;
    metadata?: Record<string, unknown>;
  }) => {
    try {
      const { data, error: insertError } = await supabase
        .from('transactions')
        .insert({
          business_id: transaction.business_id,
          location_id: transaction.location_id,
          type: transaction.type,
          category: transaction.category,
          amount: transaction.total_amount, // amount es el total para compatibilidad
          subtotal: transaction.subtotal,
          tax_type: transaction.tax_type || 'none',
          tax_rate: transaction.tax_rate || 0,
          tax_amount: transaction.tax_amount || 0,
          total_amount: transaction.total_amount,
          currency: 'COP', // Moneda colombiana
          description: transaction.description,
          appointment_id: transaction.appointment_id,
          employee_id: transaction.employee_id,
          transaction_date: transaction.transaction_date || new Date().toISOString().split('T')[0],
          payment_method: transaction.payment_method,
          reference_number: transaction.reference_number,
          is_tax_deductible: transaction.is_tax_deductible ?? true,
          metadata: transaction.metadata || {},
          is_verified: false,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success('Transacción fiscal creada exitosamente');
      fetchTransactions();
      return data;
    } catch (err) {
      const error = err as Error;
      toast.error(`Error al crear transacción fiscal: ${error.message}`);
      throw error;
    }
  };

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters?.business_id,
    filters?.location_id,
    filters?.type,
    filters?.category,
    filters?.is_verified,
    filters?.min_amount,
    filters?.max_amount,
    filters?.date_range,
  ]);

  return {
    transactions,
    loading,
    error,
    summary,
    createTransaction,
    createFiscalTransaction,
    updateTransaction,
    verifyTransaction,
    deleteTransaction,
    getTransactionsByDateRange,
    refetch: fetchTransactions,
  };
}
