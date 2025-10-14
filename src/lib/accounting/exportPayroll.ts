// ============================================================================
// UTILITY: PDF Export for Payroll
// Generación de comprobantes de nómina en PDF usando jsPDF
// ============================================================================

import { formatCOP } from './colombiaTaxes';

interface PayrollItem {
  label: string;
  value: string | number;
  isTotal?: boolean;
  highlight?: boolean;
}

/**
 * Genera y descarga un PDF de comprobante de nómina
 * @param data - Datos del comprobante
 * @param filename - Nombre del archivo a descargar
 */
export async function exportPayrollToPDF(
  data: {
    title: string;
    period: string;
    employee: string;
    items: PayrollItem[];
  },
  filename: string
): Promise<void> {
  // Simple text-based export (v1.0)
  // NOTE: Future enhancement: Implement with jsPDF and jspdf-autotable for professional PDFs
  
  let content = `${data.title.toUpperCase()}\n`;
  content += `${'='.repeat(50)}\n\n`;
  content += `Empleado: ${data.employee}\n`;
  content += `Período: ${data.period}\n`;
  content += `Fecha de generación: ${new Date().toLocaleDateString('es-CO')}\n\n`;
  content += `${'='.repeat(50)}\n\n`;

  data.items.forEach(item => {
    if (item.label === '') {
      content += '\n';
    } else if (item.isTotal) {
      content += `\n${item.label.padEnd(35)} ${item.value}\n`;
      content += `${'-'.repeat(50)}\n`;
    } else {
      content += `${item.label.padEnd(35)} ${item.value}\n`;
    }
  });

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.replace('.pdf', '.txt');
  a.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Formatea datos de pago para exportación
 */
export function formatPayrollForExport(payment: {
  employee_name?: string;
  payment_period_start: string;
  payment_period_end: string;
  salary_base: number;
  commissions: number;
  cesantias: number;
  prima: number;
  vacaciones: number;
  intereses_cesantias: number;
  other_earnings: number;
  total_earnings: number;
  health_deduction: number;
  pension_deduction: number;
  other_deductions: number;
  total_deductions: number;
  net_payment: number;
}): { title: string; period: string; employee: string; items: PayrollItem[] } {
  return {
    title: 'Comprobante de Nómina',
    period: `${new Date(payment.payment_period_start).toLocaleDateString('es-CO')} - ${new Date(payment.payment_period_end).toLocaleDateString('es-CO')}`,
    employee: payment.employee_name || 'Sin nombre',
    items: [
      { label: 'Salario Base', value: formatCOP(payment.salary_base) },
      { label: 'Comisiones', value: formatCOP(payment.commissions) },
      { label: 'Cesantías (8.33%)', value: formatCOP(payment.cesantias) },
      { label: 'Prima (8.33%)', value: formatCOP(payment.prima) },
      { label: 'Vacaciones (4.17%)', value: formatCOP(payment.vacaciones) },
      { label: 'Intereses de Cesantías (1%)', value: formatCOP(payment.intereses_cesantias) },
      { label: 'Otros Ingresos', value: formatCOP(payment.other_earnings) },
      { label: 'TOTAL DEVENGADO', value: formatCOP(payment.total_earnings), isTotal: true },
      { label: '', value: '' },
      { label: 'Salud (4%)', value: `-${formatCOP(payment.health_deduction)}` },
      { label: 'Pensión (4%)', value: `-${formatCOP(payment.pension_deduction)}` },
      { label: 'Otras Deducciones', value: `-${formatCOP(payment.other_deductions)}` },
      { label: 'TOTAL DEDUCCIONES', value: `-${formatCOP(payment.total_deductions)}`, isTotal: true },
      { label: '', value: '' },
      { label: 'NETO A PAGAR', value: formatCOP(payment.net_payment), isTotal: true, highlight: true },
    ],
  };
}
