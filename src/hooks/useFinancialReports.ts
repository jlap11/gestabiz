// ============================================================================
// HOOK: useFinancialReports
// Genera reportes contables y financieros con exportación
// ============================================================================

import { useState, useCallback } from 'react';
import supabase from '@/lib/supabase';
import {
  ReportFilters,
  ProfitAndLossReport,
  PayrollReport,
  ExportOptions,
} from '@/types/accounting.types';
import { Transaction, TransactionCategory } from '@/types/types';
import { format } from 'date-fns';
import { logger } from '@/lib/logger';
import { es } from 'date-fns/locale';
import { getCategoryColor } from './useChartData';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Extend jsPDF type for autoTable
interface JPdfWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

interface UseFinancialReportsReturn {
  loading: boolean;
  error: Error | null;
  generateProfitAndLoss: (filters: ReportFilters) => Promise<ProfitAndLossReport>;
  generatePayrollReport: (filters: ReportFilters) => Promise<PayrollReport>;
  exportToCSV: (data: unknown[], filename: string, options?: ExportOptions) => void;
  exportToExcel: (data: unknown[], filename: string, sheetName?: string) => void;
  exportToPDF: (report: ProfitAndLossReport, businessName: string, filename?: string) => void;
}

export function useFinancialReports(): UseFinancialReportsReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Generar reporte de Pérdidas y Ganancias (P&L)
  const generateProfitAndLoss = useCallback(
    async (filters: ReportFilters): Promise<ProfitAndLossReport> => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('transactions')
          .select('*')
          .eq('business_id', filters.business_id);

        // Aplicar filtros
        if (filters.location_id) {
          if (Array.isArray(filters.location_id)) {
            query = query.in('location_id', filters.location_id);
          } else {
            query = query.eq('location_id', filters.location_id);
          }
        }

        if (filters.date_range) {
          query = query
            .gte('transaction_date', filters.date_range.start)
            .lte('transaction_date', filters.date_range.end);
        }

        const { data: transactions, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        const business = await supabase
          .from('businesses')
          .select('name')
          .eq('id', filters.business_id)
          .single();

        // Calcular ingresos
        const incomeTransactions = transactions?.filter(t => t.type === 'income') || [];
        const total_income = incomeTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

        const income_by_category = groupByCategory(incomeTransactions);

        // Calcular egresos
        const expenseTransactions = transactions?.filter(t => t.type === 'expense') || [];
        const total_expenses = expenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

        const expenses_by_category = groupByCategory(expenseTransactions);

        // Calcular impuestos
        const total_taxes = expenseTransactions
          .filter(t => t.category === 'tax')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const iva_paid = transactions
          ?.filter(t => t.tax_amount && t.tax_type?.startsWith('iva'))
          .reduce((sum, t) => sum + Number(t.tax_amount || 0), 0) || 0;

        const ica_paid = transactions
          ?.filter(t => t.tax_amount && t.tax_type === 'ica')
          .reduce((sum, t) => sum + Number(t.tax_amount || 0), 0) || 0;

        const retention_paid = transactions
          ?.filter(t => t.tax_amount && t.tax_type === 'retention')
          .reduce((sum, t) => sum + Number(t.tax_amount || 0), 0) || 0;

        // Resultados
        const gross_profit = total_income - total_expenses;
        const net_profit = gross_profit - total_taxes;
        const profit_margin = total_income > 0 ? (net_profit / total_income) * 100 : 0;

        const transaction_count = transactions?.length || 0;
        const average_transaction = transaction_count > 0
          ? (total_income + total_expenses) / transaction_count
          : 0;

        const period = filters.date_range
          ? `${format(new Date(filters.date_range.start), 'dd MMM yyyy', { locale: es })} - ${format(new Date(filters.date_range.end), 'dd MMM yyyy', { locale: es })}`
          : 'Todos los períodos';

        return {
          period,
          business_id: filters.business_id,
          business_name: business.data?.name || '',
          total_income,
          income_by_category,
          total_expenses,
          expenses_by_category,
          gross_profit,
          net_profit,
          profit_margin,
          total_taxes,
          iva_paid,
          ica_paid,
          retention_paid,
          transaction_count,
          average_transaction,
        };
      } catch (err) {
        const error = err as Error;
        logger.error('Failed to generate P&L report', error, {
          component: 'useFinancialReports',
          operation: 'generateProfitAndLossReport',
          businessId: filters.businessId,
        });
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Generar reporte de nómina
  const generatePayrollReport = useCallback(
    async (filters: ReportFilters): Promise<PayrollReport> => {
      try {
        setLoading(true);
        setError(null);

        const { data: employeePerf, error: perfError } = await supabase
          .from('employee_performance')
          .select('*')
          .eq('business_id', filters.business_id);

        if (perfError) throw perfError;

        const { data: business } = await supabase
          .from('businesses')
          .select('name')
          .eq('id', filters.business_id)
          .single();

        const employees = (employeePerf || []).map(emp => ({
          employee_id: emp.employee_id,
          employee_name: emp.employee_name,
          salary_base: 0, // Obtener de business_employees cuando esté disponible
          commissions: emp.total_paid || 0,
          bonuses: 0,
          deductions: 0,
          social_security: 0,
          health: 0,
          pension: 0,
          net_salary: emp.total_paid || 0,
        }));

        const total_payroll = employees.reduce((sum, e) => sum + e.net_salary, 0);
        const total_commissions = employees.reduce((sum, e) => sum + e.commissions, 0);
        const total_social_security = employees.reduce((sum, e) => sum + e.social_security, 0);

        const period = filters.date_range
          ? `${format(new Date(filters.date_range.start), 'MMMM yyyy', { locale: es })}`
          : format(new Date(), 'MMMM yyyy', { locale: es });

        return {
          period,
          business_id: filters.business_id,
          business_name: business?.name || '',
          employees,
          total_payroll,
          total_commissions,
          total_social_security,
          employee_count: employees.length,
        };
      } catch (err) {
        const error = err as Error;
        logger.error('Failed to generate payroll report', error, {
          component: 'useFinancialReports',
          operation: 'generatePayrollReport',
          business_id: filters.business_id,
        });
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Exportar a CSV
  const exportToCSV = useCallback(
    (data: unknown[], filename: string, options?: ExportOptions) => {
      const delimiter = options?.delimiter || ';';
      
      if (!data || data.length === 0) {
        throw new Error('No hay datos para exportar');
      }

      // Convertir a CSV
      const headers = Object.keys(data[0] as Record<string, unknown>);
      const csvRows = [
        headers.join(delimiter),
        ...data.map(row => 
          headers.map(header => {
            const value = (row as Record<string, unknown>)[header];
            // Convertir valores a string de forma segura
            let stringValue: string;
            if (value === null || value === undefined) {
              stringValue = '';
            } else if (typeof value === 'object') {
              stringValue = JSON.stringify(value);
            } else if (typeof value === 'number' || typeof value === 'boolean') {
              stringValue = value.toString();
            } else {
              stringValue = value as string;
            }
            // Escapar valores que contengan el delimitador
            return stringValue.includes(delimiter) ? `"${stringValue}"` : stringValue;
          }).join(delimiter)
        ),
      ];

      const csvString = csvRows.join('\n');
      const blob = new Blob(['\ufeff' + csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}-${Date.now()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    []
  );

  // Exportar a Excel
  const exportToExcel = useCallback(
    (data: unknown[], filename: string, sheetName: string = 'Reporte') => {
      if (!data || data.length === 0) {
        throw new Error('No hay datos para exportar');
      }

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      
      XLSX.writeFile(workbook, `${filename}-${Date.now()}.xlsx`);
    },
    []
  );

  // Exportar reporte P&L a PDF
  const exportToPDF = useCallback(
    (report: ProfitAndLossReport, businessName: string, filename?: string) => {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Reporte de Pérdidas y Ganancias', pageWidth / 2, 20, { align: 'center' });
      
      // Business info
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(businessName, pageWidth / 2, 30, { align: 'center' });
      
      // Period
      doc.setFontSize(10);
      doc.text(`Período: ${report.period}`, pageWidth / 2, 38, { align: 'center' });
      
      let yPos = 50;
      
      // Income section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Ingresos', 14, yPos);
      yPos += 8;
      
      const incomeData = report.income_by_category.map((cat) => [
        cat.category,
        `$${cat.amount.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`,
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Categoría', 'Monto']],
        body: incomeData,
        theme: 'grid',
        headStyles: { fillColor: [34, 197, 94] },
        margin: { left: 14 },
      });
      
      yPos = (doc as JPdfWithAutoTable).lastAutoTable.finalY + 10;
      
      // Total income
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total Ingresos: $${report.total_income.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, 14, yPos);
      yPos += 15;
      
      // Expense section
      doc.setFontSize(14);
      doc.text('Egresos', 14, yPos);
      yPos += 8;
      
      const expenseData = report.expenses_by_category.map((cat) => [
        cat.category,
        `$${cat.amount.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`,
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Categoría', 'Monto']],
        body: expenseData,
        theme: 'grid',
        headStyles: { fillColor: [239, 68, 68] },
        margin: { left: 14 },
      });
      
      yPos = (doc as JPdfWithAutoTable).lastAutoTable.finalY + 10;
      
      // Total expenses
      doc.setFontSize(12);
      doc.text(`Total Egresos: $${report.total_expenses.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, 14, yPos);
      yPos += 10;
      
      // Net profit/loss
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      const netAmount = report.net_profit;
      const netLabel = netAmount >= 0 ? 'Ganancia Neta' : 'Pérdida Neta';
      const netColor: [number, number, number] = netAmount >= 0 ? [34, 197, 94] : [239, 68, 68];
      doc.setTextColor(...netColor);
      doc.text(`${netLabel}: $${Math.abs(netAmount).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, 14, yPos);
      
      // Profit margin
      yPos += 10;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Margen de Ganancia: ${report.profit_margin.toFixed(2)}%`, 14, yPos);
      
      // Footer
      const timestamp = format(new Date(), "dd/MM/yyyy HH:mm", { locale: es });
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Generado el ${timestamp}`, 14, doc.internal.pageSize.getHeight() - 10);
      
      // Save PDF
      const pdfFilename = filename || `reporte-pyg-${Date.now()}.pdf`;
      doc.save(pdfFilename);
    },
    []
  );

  return {
    loading,
    error,
    generateProfitAndLoss,
    generatePayrollReport,
    exportToCSV,
    exportToExcel,
    exportToPDF,
  };
}

// ============================================================================
// UTILIDADES
// ============================================================================

function groupByCategory(transactions: Transaction[]) {
  const categoryMap = new Map<string, number>();
  let total = 0;

  transactions.forEach(t => {
    const current = categoryMap.get(t.category) || 0;
    categoryMap.set(t.category, current + Number(t.amount));
    total += Number(t.amount);
  });

  return Array.from(categoryMap.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: (amount / total) * 100,
      count: transactions.filter(t => t.category === category).length,
      color: getCategoryColor(category as TransactionCategory),
    }))
    .sort((a, b) => b.amount - a.amount);
}
