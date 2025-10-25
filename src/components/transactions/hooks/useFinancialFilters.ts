import { useEffect, useMemo, useState } from 'react'
import supabase from '@/lib/supabase'

export type Period = '1m' | '3m' | '6m' | '1y' | 'custom'

interface UseFinancialFiltersProps {
  businessId: string
  locationId?: string
}

export function useFinancialFilters({ businessId, locationId }: UseFinancialFiltersProps) {
  const [period, setPeriod] = useState<Period>('1m')
  const [selectedLocation, setSelectedLocation] = useState<string>(locationId || 'all')
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [employees, setEmployees] = useState<Array<{ id: string; name: string }>>([])

  // Calculate date range based on period
  const dateRange = useMemo(() => {
    const end = new Date()
    const start = new Date()

    switch (period) {
      case '1m':
        start.setMonth(start.getMonth() - 1)
        break
      case '3m':
        start.setMonth(start.getMonth() - 3)
        break
      case '6m':
        start.setMonth(start.getMonth() - 6)
        break
      case '1y':
        start.setFullYear(start.getFullYear() - 1)
        break
      default:
        start.setMonth(start.getMonth() - 1)
    }

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    }
  }, [period])

  // Transaction filters
  const txFilters = useMemo(
    () => ({
      business_id: businessId,
      location_id: selectedLocation !== 'all' ? selectedLocation : undefined,
      date_range: dateRange,
    }),
    [businessId, selectedLocation, dateRange]
  )

  // Report filters
  const reportFilters = useMemo(
    () => ({
      business_id: businessId,
      start_date: dateRange.start,
      end_date: dateRange.end,
      location_id: selectedLocation !== 'all' ? [selectedLocation] : undefined,
      employee_id: selectedEmployee !== 'all' ? [selectedEmployee] : undefined,
      category: selectedCategory !== 'all' ? [selectedCategory] : undefined,
    }),
    [businessId, dateRange, selectedLocation, selectedEmployee, selectedCategory]
  )

  // Load employees
  useEffect(() => {
    const loadEmployees = async () => {
      const { data } = await supabase
        .from('business_employees')
        .select('employee_id, profiles!business_employees_employee_id_fkey(id, full_name)')
        .eq('business_id', businessId)

      if (data && Array.isArray(data)) {
        const empList = data.map(emp => {
          const profile = Array.isArray(emp.profiles) ? emp.profiles[0] : emp.profiles
          return {
            id: emp.employee_id,
            name: profile?.full_name || 'Sin nombre',
          }
        })
        setEmployees(empList)
      }
    }
    loadEmployees()
  }, [businessId])

  return {
    // State
    period,
    selectedLocation,
    selectedEmployee,
    selectedCategory,
    employees,
    dateRange,
    
    // Computed
    txFilters,
    reportFilters,
    
    // Setters
    setPeriod,
    setSelectedLocation,
    setSelectedEmployee,
    setSelectedCategory,
  }
}