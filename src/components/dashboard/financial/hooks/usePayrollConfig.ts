import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import supabase from '@/lib/supabase'

export interface PayrollConfig {
  id?: string
  business_id: string
  employee_id: string
  commission_rate: number
  commission_base: 'appointments' | 'transactions' | 'both'
  calculate_prestaciones: boolean
  cesantias_enabled: boolean
  prima_enabled: boolean
  vacaciones_enabled: boolean
  intereses_cesantias_enabled: boolean
  other_deductions: Array<{ name: string; amount: number }>
  notes?: string
}

interface UsePayrollConfigProps {
  businessId: string
}

export function usePayrollConfig({ businessId }: UsePayrollConfigProps) {
  const [payrollConfigs, setPayrollConfigs] = useState<Map<string, PayrollConfig>>(new Map())
  const [loading, setLoading] = useState(false)

  const fetchPayrollConfigs = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('payroll_configuration')
        .select('*')
        .eq('business_id', businessId)

      if (error) throw error

      const configsMap = new Map<string, PayrollConfig>()
      ;(data || []).forEach(config => {
        configsMap.set(config.employee_id, config)
      })
      setPayrollConfigs(configsMap)
    } catch (error) {
      toast.error(
        `Error al cargar configuraciones: ${error instanceof Error ? error.message : 'Error desconocido'}`
      )
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async (config: Partial<PayrollConfig>) => {
    const toastId = toast.loading('Guardando configuración...')
    try {
      const configData = {
        business_id: businessId,
        ...config,
      }

      const { error } = await supabase
        .from('payroll_configuration')
        .upsert(configData, { onConflict: 'business_id,employee_id' })

      if (error) throw error

      toast.success('Configuración guardada exitosamente', { id: toastId })
      await fetchPayrollConfigs()
      return true
    } catch (error) {
      toast.error(
        `Error al guardar configuración: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        { id: toastId }
      )
      return false
    }
  }

  const getConfigForEmployee = (employeeId: string): PayrollConfig | undefined => {
    return payrollConfigs.get(employeeId)
  }

  useEffect(() => {
    if (businessId) {
      fetchPayrollConfigs()
    }
  }, [businessId])

  return {
    payrollConfigs,
    loading,
    saveConfig,
    getConfigForEmployee,
    refetchConfigs: fetchPayrollConfigs,
  }
}