// Utilidades para el sistema de gestión de gastos

import type { RecurringExpense } from '@/types/expense';
import { FREQUENCY_OPTIONS, CATEGORY_LABELS } from '@/constants/expense';

/**
 * Calcula la próxima fecha de pago basada en la frecuencia
 */
export const calculateNextPaymentDate = (
  lastPaymentDate: string,
  frequency: RecurringExpense['frequency']
): Date => {
  const date = new Date(lastPaymentDate);
  
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
  
  return date;
};

/**
 * Obtiene la etiqueta de frecuencia en español
 */
export const getFrequencyLabel = (frequency: RecurringExpense['frequency']): string => {
  const option = FREQUENCY_OPTIONS.find(opt => opt.value === frequency);
  return option?.label || frequency;
};

/**
 * Calcula los días hasta el próximo pago y devuelve una etiqueta descriptiva
 */
export const getDaysUntilPaymentLabel = (nextPaymentDate: string): string => {
  const today = new Date();
  const paymentDate = new Date(nextPaymentDate);
  const diffTime = paymentDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `Vencido hace ${Math.abs(diffDays)} días`;
  } else if (diffDays === 0) {
    return 'Vence hoy';
  } else if (diffDays === 1) {
    return 'Vence mañana';
  } else if (diffDays <= 7) {
    return `Vence en ${diffDays} días`;
  } else if (diffDays <= 30) {
    const weeks = Math.floor(diffDays / 7);
    return `Vence en ${weeks} semana${weeks > 1 ? 's' : ''}`;
  } else {
    const months = Math.floor(diffDays / 30);
    return `Vence en ${months} mes${months > 1 ? 'es' : ''}`;
  }
};

/**
 * Obtiene la clase CSS para el estado del pago
 */
export const getPaymentStatusClass = (nextPaymentDate: string): string => {
  const today = new Date();
  const paymentDate = new Date(nextPaymentDate);
  const diffTime = paymentDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  } else if (diffDays <= 3) {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  } else {
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  }
};

/**
 * Obtiene la clase CSS para el texto del estado del pago
 */
export const getPaymentTextClass = (nextPaymentDate: string): string => {
  const today = new Date();
  const paymentDate = new Date(nextPaymentDate);
  const diffTime = paymentDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return 'text-red-600 dark:text-red-400';
  } else if (diffDays <= 3) {
    return 'text-yellow-600 dark:text-yellow-400';
  } else {
    return 'text-green-600 dark:text-green-400';
  }
};

/**
 * Obtiene la etiqueta de categoría en español
 */
export const getCategoryLabel = (category: string): string => {
  return CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category;
};

/**
 * Filtra gastos por estado de pago
 */
export const filterExpensesByPaymentStatus = (
  expenses: RecurringExpense[],
  status: 'overdue' | 'upcoming' | 'all' = 'all'
): RecurringExpense[] => {
  if (status === 'all') return expenses;

  const today = new Date();
  
  return expenses.filter(expense => {
    const paymentDate = new Date(expense.next_payment_date);
    const diffTime = paymentDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (status === 'overdue') {
      return diffDays < 0;
    } else if (status === 'upcoming') {
      return diffDays >= 0 && diffDays <= 7;
    }
    
    return true;
  });
};

/**
 * Ordena gastos por fecha de próximo pago
 */
export const sortExpensesByPaymentDate = (
  expenses: RecurringExpense[],
  order: 'asc' | 'desc' = 'asc'
): RecurringExpense[] => {
  return [...expenses].sort((a, b) => {
    const dateA = new Date(a.next_payment_date).getTime();
    const dateB = new Date(b.next_payment_date).getTime();
    
    return order === 'asc' ? dateA - dateB : dateB - dateA;
  });
};

/**
 * Calcula el total de gastos para un período
 */
export const calculateTotalExpenses = (expenses: RecurringExpense[]): number => {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
};

/**
 * Valida los datos del formulario de gastos
 */
export const validateExpenseForm = (data: {
  name: string;
  amount: number;
  category: string;
  frequency: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.name.trim()) {
    errors.push('El nombre del gasto es requerido');
  }

  if (data.amount <= 0) {
    errors.push('El monto debe ser mayor a 0');
  }

  if (!data.category) {
    errors.push('La categoría es requerida');
  }

  if (!data.frequency) {
    errors.push('La frecuencia es requerida');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};