// Tipos centralizados para el sistema de gestión de gastos

import type { TransactionCategory } from '@/types/types';

export interface RecurringExpense {
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

export interface ExpenseTemplate {
  id: string;
  name: string;
  category: TransactionCategory;
  default_amount?: number;
  frequency: RecurringExpense['frequency'];
  description: string;
}

export interface ExpenseFormData {
  category: TransactionCategory;
  description: string;
  amount: number;
  frequency: RecurringExpense['frequency'];
  next_payment_date: string;
  payment_method: string;
  notes: string;
}

export interface ExpenseManagerProps {
  businessId: string;
}

export interface ExpenseCardProps {
  expense: RecurringExpense;
  onEdit: (expense: RecurringExpense) => void;
  onDelete: (id: string) => void;
  onProcessPayment: (expense: RecurringExpense) => void;
}

export interface ExpenseFormProps {
  formData: ExpenseFormData;
  onFormDataChange: (data: Partial<ExpenseFormData>) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isEditing?: boolean;
  loading?: boolean;
}

export interface ExpenseTemplateCardProps {
  template: ExpenseTemplate;
  onApply: (template: ExpenseTemplate) => void;
}

export interface UseExpenseManagerReturn {
  recurringExpenses: RecurringExpense[];
  upcomingPayments: RecurringExpense[];
  loading: boolean;
  formData: ExpenseFormData;
  isDialogOpen: boolean;
  editingExpense: RecurringExpense | null;
  activeTab: string;
  
  // Actions
  setFormData: (data: Partial<ExpenseFormData>) => void;
  setIsDialogOpen: (open: boolean) => void;
  setActiveTab: (tab: string) => void;
  handleCreateExpense: () => Promise<void>;
  handleUpdateExpense: () => Promise<void>;
  handleEditExpense: (expense: RecurringExpense) => void;
  handleDeleteExpense: (id: string) => Promise<void>;
  handleProcessPayment: (expense: RecurringExpense) => Promise<void>;
  applyTemplate: (template: ExpenseTemplate) => void;
  resetForm: () => void;
  fetchRecurringExpenses: () => Promise<void>;
}