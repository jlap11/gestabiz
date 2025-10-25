import { useMemo } from 'react'
import { PayrollConfig } from './usePayrollConfig'
import { Employee } from './usePayrollEmployees'

interface PayrollCalculationData {
  employee: Employee
  config: PayrollConfig
  commissions: number
  otherEarnings: number
  periodStart: string
  periodEnd: string
}

interface PayrollCalculationResult {
  salary_base: number
  commissions: number
  cesantias: number
  prima: number
  vacaciones: number
  intereses_cesantias: number
  other_earnings: number
  total_earnings: number
  health_deduction: number
  pension_deduction: number
  other_deductions: number
  total_deductions: number
  net_payment: number
}

export function usePayrollCalculations() {
  const calculatePayroll = useMemo(() => {
    return (data: PayrollCalculationData): PayrollCalculationResult => {
      const { employee, config, commissions, otherEarnings } = data
      const salaryBase = employee.salary_base

      // Prestaciones sociales (basadas en salario base + comisiones)
      const baseForPrestaciones = salaryBase + commissions
      
      // Cesantías: 8.33% anual (1 mes de salario por año)
      const cesantias = config.cesantias_enabled && config.calculate_prestaciones 
        ? (baseForPrestaciones * 8.33) / 100 / 12 
        : 0

      // Prima: 8.33% anual (1 mes de salario por año, pagado en 2 cuotas)
      const prima = config.prima_enabled && config.calculate_prestaciones 
        ? (baseForPrestaciones * 8.33) / 100 / 12 
        : 0

      // Vacaciones: 4.17% anual (15 días hábiles por año)
      const vacaciones = config.vacaciones_enabled && config.calculate_prestaciones 
        ? (baseForPrestaciones * 4.17) / 100 / 12 
        : 0

      // Intereses sobre cesantías: 12% anual sobre cesantías acumuladas
      const interesesCesantias = config.intereses_cesantias_enabled && config.calculate_prestaciones 
        ? (cesantias * 12) / 100 / 12 
        : 0

      // Total devengado
      const totalEarnings = salaryBase + commissions + cesantias + prima + vacaciones + interesesCesantias + otherEarnings

      // Deducciones
      const healthDeduction = (salaryBase * 4) / 100 // 4% salud
      const pensionDeduction = (salaryBase * 4) / 100 // 4% pensión
      
      // Otras deducciones configuradas
      const otherDeductionsAmount = config.other_deductions?.reduce((sum, deduction) => sum + deduction.amount, 0) || 0
      
      const totalDeductions = healthDeduction + pensionDeduction + otherDeductionsAmount

      // Neto a pagar
      const netPayment = totalEarnings - totalDeductions

      return {
        salary_base: salaryBase,
        commissions,
        cesantias,
        prima,
        vacaciones,
        intereses_cesantias: interesesCesantias,
        other_earnings: otherEarnings,
        total_earnings: totalEarnings,
        health_deduction: healthDeduction,
        pension_deduction: pensionDeduction,
        other_deductions: otherDeductionsAmount,
        total_deductions: totalDeductions,
        net_payment: netPayment,
      }
    }
  }, [])

  return {
    calculatePayroll,
  }
}