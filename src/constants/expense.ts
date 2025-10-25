// Constantes y plantillas para el sistema de gestión de gastos

import type { ExpenseTemplate, RecurringExpense } from '@/types/expense';
import type { TransactionCategory } from '@/types/types';

// Plantillas predefinidas de gastos comunes
export const EXPENSE_TEMPLATES: ExpenseTemplate[] = [
  {
    id: 'rent',
    name: 'Arriendo Local',
    category: 'rent',
    default_amount: 2000000, // $2M COP mensual
    frequency: 'monthly',
    description: 'Pago mensual de arriendo del local comercial',
  },
  {
    id: 'utilities',
    name: 'Servicios Públicos',
    category: 'utilities',
    default_amount: 300000, // $300K COP mensual
    frequency: 'monthly',
    description: 'Agua, luz, gas, internet',
  },
  {
    id: 'insurance',
    name: 'Seguro del Negocio',
    category: 'insurance',
    default_amount: 500000, // $500K COP mensual
    frequency: 'monthly',
    description: 'Póliza de seguro del establecimiento',
  },
  {
    id: 'supplies',
    name: 'Compra de Insumos',
    category: 'supplies',
    frequency: 'weekly',
    description: 'Materiales y suministros de trabajo',
  },
  {
    id: 'marketing',
    name: 'Publicidad Digital',
    category: 'marketing',
    default_amount: 400000, // $400K COP mensual
    frequency: 'monthly',
    description: 'Gastos en redes sociales y marketing',
  },
  {
    id: 'maintenance',
    name: 'Mantenimiento',
    category: 'maintenance',
    frequency: 'quarterly',
    description: 'Mantenimiento de equipos e instalaciones',
  },
];

// Categorías de gastos disponibles
export const EXPENSE_CATEGORIES: TransactionCategory[] = [
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

// Opciones de frecuencia
export const FREQUENCY_OPTIONS: Array<{
  value: RecurringExpense['frequency'];
  label: string;
}> = [
  { value: 'daily', label: 'Diario' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'yearly', label: 'Anual' },
];

// Etiquetas de categorías en español
export const CATEGORY_LABELS: Record<TransactionCategory, string> = {
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
  // Categorías de ingresos (para completitud)
  service: 'Servicios',
  product: 'Productos',
  consultation: 'Consultoría',
  subscription: 'Suscripciones',
  commission: 'Comisiones',
  other_income: 'Otros Ingresos',
};