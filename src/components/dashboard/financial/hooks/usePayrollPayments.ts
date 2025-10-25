import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import supabase from '@/lib/supabase'

export interface PayrollPayment {
  id?: string
  business_id: string
  employee_id: string
  employee_name?: string
  payment_period_start: string
  payment_period_end: string
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
  payment_date?: string
  payment_method?: string
  status: 'pending' | 'paid' | 'cancelled'
  notes?: string
}

interface UsePayrollPaymentsProps {
  businessId: string
}

export function usePayrollPayments({ businessId }: UsePayrollPaymentsProps) {
  const [payrollPayments, setPayrollPayments] = useState<PayrollPayment[]>([])
  const [loading, setLoading] = useState(false)

  const fetchPayrollPayments = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('payroll_payments')
        .select('*')
        .eq('business_id', businessId)
        .order('payment_period_end', { ascending: false })

      if (error) throw error

      setPayrollPayments(data || [])
    } catch (error) {
      toast.error(
        `Error al cargar pagos: ${error instanceof Error ? error.message : 'Error desconocido'}`
      )
    } finally {
      setLoading(false)
    }
  }

  const createPayment = async (payment: Partial<PayrollPayment>) => {
    const toastId = toast.loading('Registrando pago...')
    try {
      const paymentData = {
        business_id: businessId,
        ...payment,
      }

      const { error } = await supabase.from('payroll_payments').insert(paymentData)

      if (error) throw error

      toast.success('Pago registrado exitosamente', { id: toastId })
      await fetchPayrollPayments()
      return true
    } catch (error) {
      toast.error(
        `Error al registrar pago: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        { id: toastId }
      )
      return false
    }
  }

  const markAsPaid = async (paymentId: string) => {
    const toastId = toast.loading('Actualizando estado...')
    try {
      const { error } = await supabase
        .from('payroll_payments')
        .update({ 
          status: 'paid',
          payment_date: new Date().toISOString()
        })
        .eq('id', paymentId)

      if (error) throw error

      toast.success('Pago marcado como pagado', { id: toastId })
      await fetchPayrollPayments()
      return true
    } catch (error) {
      toast.error(
        `Error al actualizar estado: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        { id: toastId }
      )
      return false
    }
  }

  useEffect(() => {
    if (businessId) {
      fetchPayrollPayments()
    }
  }, [businessId])

  return {
    payrollPayments,
    loading,
    createPayment,
    markAsPaid,
    refetchPayments: fetchPayrollPayments,
  }
}