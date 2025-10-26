// ============================================================================
// TIPOS PARA SISTEMA CONTABLE Y FISCAL - COLOMBIA
// ============================================================================

import { User, Service } from './types';

// Regímenes tributarios Colombia
export type TaxRegime = 'simple' | 'common' | 'special';

// Tipos de impuestos
export type TaxType = 'iva_0' | 'iva_5' | 'iva_19' | 'ica' | 'retention' | 'none';

// Estados de factura
export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled' | 'credit_note';

// Tipos de obligaciones fiscales
export type LiabilityType = 'iva_monthly' | 'ica_bimonthly' | 'income_annual' | 'retention_monthly';

// Estados de obligaciones
export type LiabilityStatus = 'pending' | 'filed' | 'paid' | 'overdue';

// Tipos de salario
export type SalaryType = 'monthly' | 'hourly' | 'commission_only';

// Tipos de contrato
export type ContractType = 'indefinido' | 'fijo' | 'prestacion_servicios';

// ============================================================================
// CONFIGURACIÓN FISCAL
// ============================================================================

export interface TaxConfiguration {
  id: string;
  created_at: string;
  updated_at: string;
  business_id: string;
  
  // Configuración tributaria
  tax_regime: TaxRegime;
  is_iva_responsible: boolean;
  is_ica_responsible: boolean;
  is_retention_agent: boolean;
  
  // Identificación fiscal
  dian_code?: string;
  activity_code?: string;
  
  // Tasas
  default_iva_rate: number;
  ica_rate: number;
  retention_rate: number;
  
  // Contador
  accountant_name?: string;
  accountant_email?: string;
  accountant_phone?: string;
  accountant_license?: string;
  
  // Facturación
  invoice_prefix: string;
  invoice_next_number: number;
  invoice_resolution_number?: string;
  invoice_resolution_date?: string;
  invoice_resolution_valid_until?: string;
  
  settings?: Record<string, unknown>;
}

// ============================================================================
// FACTURAS
// ============================================================================

export interface Invoice {
  id: string;
  created_at: string;
  updated_at: string;
  business_id: string;
  
  // Numeración
  invoice_number: string;
  invoice_prefix?: string;
  invoice_sequence: number;
  
  // Estado
  status: InvoiceStatus;
  issue_date: string;
  due_date?: string;
  paid_date?: string;
  
  // Cliente
  client_id?: string;
  client_name: string;
  client_tax_id?: string;
  client_address?: string;
  client_email?: string;
  client_phone?: string;
  
  // Montos
  subtotal: number;
  discount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  
  // Impuestos desglosados
  iva_amount: number;
  ica_amount: number;
  retention_amount: number;
  
  // Referencias
  appointment_id?: string;
  transaction_id?: string;
  
  // Notas
  notes?: string;
  terms?: string;
  
  // Facturación electrónica
  cufe?: string;
  qr_code?: string;
  xml_url?: string;
  pdf_url?: string;
  
  metadata?: Record<string, unknown>;
  
  // Populated fields
  items?: InvoiceItem[];
  client?: User;
}

// Ítem de factura
export interface InvoiceItem {
  id: string;
  created_at: string;
  invoice_id: string;
  
  description: string;
  quantity: number;
  unit_price: number;
  
  tax_type: TaxType;
  tax_rate: number;
  tax_amount: number;
  
  subtotal: number;
  total: number;
  
  service_id?: string;
  sort_order: number;
  
  // Populated
  service?: Service;
}

// ============================================================================
// OBLIGACIONES FISCALES
// ============================================================================

export interface TaxLiability {
  id: string;
  created_at: string;
  updated_at: string;
  business_id: string;
  
  liability_type: LiabilityType;
  period: string; // 'YYYY-MM' o 'YYYY'
  
  due_date: string;
  filed_date?: string;
  
  calculated_amount: number;
  filed_amount?: number;
  paid_amount: number;
  
  status: LiabilityStatus;
  
  metadata?: Record<string, unknown>;
}

// ============================================================================
// REPORTES FISCALES
// ============================================================================

export interface TaxReport {
  business_id: string;
  business_name: string;
  fiscal_period: string;
  tax_type: TaxType;
  transaction_count: number;
  total_subtotal: number;
  total_tax_amount: number;
  total_amount: number;
  average_tax_rate: number;
}

export interface FiscalObligationStatus {
  business_id: string;
  business_name: string;
  liability_type: LiabilityType;
  period: string;
  due_date: string;
  calculated_amount: number;
  paid_amount: number;
  status: LiabilityStatus;
  is_overdue: boolean;
  days_overdue: number;
}

// ============================================================================
// CONFIGURACIÓN DE IMPUESTOS POR CIUDAD COLOMBIA
// ============================================================================

export interface ColombianCityTax {
  dane_code: string;
  department: string;
  city: string;
  ica_rate: number; // Porcentaje ICA
  has_ica: boolean;
}

// ============================================================================
// CONFIGURACIÓN DE RETENCIÓN EN LA FUENTE COLOMBIA
// ============================================================================

export interface RetentionConfig {
  activity_code: string;
  description: string;
  retention_rate: number;
  applies_to_services: boolean;
  applies_to_sales: boolean;
}

// ============================================================================
// CÁLCULOS FISCALES
// ============================================================================

export interface TaxCalculation {
  subtotal: number;
  iva_amount: number;
  ica_amount: number;
  retention_amount: number;
  total_tax: number;
  total_amount: number;
}

// ============================================================================
// DATOS DE GRÁFICOS
// ============================================================================

export interface ChartDataPoint {
  period: string;
  income: number;
  expenses: number;
  profit: number;
  label?: string;
}

export interface CategoryDistribution {
  category: string;
  amount: number;
  percentage: number;
  count: number;
  color?: string;
}

export interface LocationComparison {
  location_id: string;
  location_name: string;
  income: number;
  expenses: number;
  profit: number;
  transaction_count: number;
}

export interface EmployeeRevenue {
  employee_id: string;
  employee_name: string;
  total_revenue: number;
  completed_appointments: number;
  average_per_appointment: number;
  commission_earned: number;
}

// ============================================================================
// FILTROS DE REPORTES
// ============================================================================

export interface ReportFilters {
  business_id: string;
  location_id?: string | string[];
  employee_id?: string | string[];
  service_id?: string | string[];
  category?: string[];
  tax_type?: TaxType[];
  date_range?: {
    start: string;
    end: string;
  };
  period?: 'week' | 'month' | '3months' | '6months' | 'year' | 'custom';
  is_verified?: boolean;
  min_amount?: number;
  max_amount?: number;
}

// ============================================================================
// REPORTE DE PÉRDIDAS Y GANANCIAS (P&L)
// ============================================================================

export interface ProfitAndLossReport {
  period: string;
  business_id: string;
  business_name: string;
  
  // Ingresos
  total_income: number;
  income_by_category: CategoryDistribution[];
  
  // Egresos
  total_expenses: number;
  expenses_by_category: CategoryDistribution[];
  
  // Resultado
  gross_profit: number;
  net_profit: number;
  profit_margin: number;
  
  // Impuestos
  total_taxes: number;
  iva_paid: number;
  ica_paid: number;
  retention_paid: number;
  
  // Otros
  transaction_count: number;
  average_transaction: number;
}

// ============================================================================
// REPORTE DE NÓMINA
// ============================================================================

export interface PayrollReport {
  period: string;
  business_id: string;
  business_name: string;
  
  employees: Array<{
    employee_id: string;
    employee_name: string;
    salary_base: number;
    commissions: number;
    bonuses: number;
    deductions: number;
    social_security: number;
    health: number;
    pension: number;
    net_salary: number;
  }>;
  
  total_payroll: number;
  total_commissions: number;
  total_social_security: number;
  employee_count: number;
}

// ============================================================================
// OPCIONES DE EXPORTACIÓN
// ============================================================================

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  delimiter?: string; // Para CSV
  includeCharts?: boolean; // Para PDF
  includeSummary?: boolean;
  filename?: string;
}
