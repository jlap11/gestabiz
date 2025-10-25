import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import supabase from '@/lib/supabase'

export interface Employee {
  id: string
  employee_id: string
  full_name: string
  email: string
  salary_base: number
  salary_type: string
  hired_at: string
  is_active: boolean
}

interface UsePayrollEmployeesProps {
  businessId: string
}

export function usePayrollEmployees({ businessId }: UsePayrollEmployeesProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('business_employees')
        .select(
          `
          id,
          employee_id,
          salary_base,
          salary_type,
          hired_at,
          is_active,
          profiles!business_employees_employee_id_fkey (
            id,
            full_name,
            email
          )
        `
        )
        .eq('business_id', businessId)
        .eq('is_active', true)

      if (error) throw error

      const formattedEmployees = (data || []).map(emp => {
        const profile = Array.isArray(emp.profiles) ? emp.profiles[0] : emp.profiles
        return {
          id: emp.id,
          employee_id: emp.employee_id,
          full_name: profile?.full_name || 'Sin nombre',
          email: profile?.email || '',
          salary_base: emp.salary_base || 0,
          salary_type: emp.salary_type || 'monthly',
          hired_at: emp.hired_at || '',
          is_active: emp.is_active,
        }
      })

      setEmployees(formattedEmployees)
    } catch (error) {
      toast.error(
        `Error al cargar empleados: ${error instanceof Error ? error.message : 'Error desconocido'}`
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (businessId) {
      fetchEmployees()
    }
  }, [businessId])

  return {
    employees,
    loading,
    refetchEmployees: fetchEmployees,
  }
}