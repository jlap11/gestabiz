import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

// Types
export interface Employee {
  id: string
  user_id: string
  profile_name: string
  profile_avatar?: string
  lunch_break_start?: string | null
  lunch_break_end?: string | null
  has_lunch_break?: boolean
  services?: string[]
}

export interface Appointment {
  id: string
  start_time: string
  end_time: string
  status: string
  service_name: string
  service_price: number
  client_name: string
  employee_id: string
  employee_name: string
  location_id?: string
  notes?: string
}

export interface LocationWithHours {
  id: string
  name: string
  opens_at: string | null
  closes_at: string | null
}

export const useCalendarData = (selectedDate: Date) => {
  const { user } = useAuth()
  const { t } = useLanguage()
  
  // State
  const [employees, setEmployees] = useState<Employee[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentBusinessId, setCurrentBusinessId] = useState<string | null>(null)
  const [locations, setLocations] = useState<LocationWithHours[]>([])
  const [services, setServices] = useState<{ id: string; name: string }[]>([])
  
  const isFetchingRef = useRef(false)

  // Fetch appointments function
  const fetchAppointments = useCallback(async () => {
    if (!user || !currentBusinessId || isFetchingRef.current) return

    isFetchingRef.current = true
    try {
      const startOfDay = new Date(selectedDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(selectedDate)
      endOfDay.setHours(23, 59, 59, 999)

      const { data: appointmentsData, error } = await supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          end_time,
          status,
          notes,
          employee_id,
          location_id,
          services (
            id,
            name,
            price
          ),
          profiles!appointments_client_id_fkey (
            id,
            full_name
          )
        `)
        .eq('business_id', currentBusinessId)
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString())

      if (error) throw error

      const employeeIds = [...new Set((appointmentsData || []).map(apt => apt.employee_id))]
      const { data: employeeNames } = employeeIds.length > 0
        ? await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', employeeIds)
        : { data: [] }

      const employeeNamesMap = (employeeNames || []).reduce((acc, emp) => {
        acc[emp.id] = emp.full_name
        return acc
      }, {} as Record<string, string>)

      const formattedAppointments: Appointment[] = (appointmentsData || []).map(apt => ({
        id: apt.id,
        start_time: apt.start_time,
        end_time: apt.end_time,
        status: apt.status,
        service_name: apt.services?.name || 'Servicio no especificado',
        service_price: apt.services?.price || 0,
        client_name: apt.profiles?.full_name || 'Cliente no especificado',
        employee_id: apt.employee_id,
        employee_name: employeeNamesMap[apt.employee_id] || 'Empleado no especificado',
        location_id: apt.location_id,
        notes: apt.notes,
      }))

      setAppointments(formattedAppointments)
    } finally {
      isFetchingRef.current = false
    }
  }, [user, currentBusinessId, selectedDate])

  // Fetch business and location data
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      setIsLoading(true)
      try {
        const { data: businesses, error: businessError } = await supabase
          .from('businesses')
          .select('id')
          .eq('owner_id', user.id)

        if (businessError) throw businessError

        if (!businesses || businesses.length === 0) {
          throw new Error('No se encontraron negocios para este usuario')
        }

        const business = businesses[0]
        setCurrentBusinessId(business.id)

        const { data: locationsData, error: locationError } = await supabase
          .from('locations')
          .select('id, name, opens_at, closes_at')
          .eq('business_id', business.id)

        if (locationError) throw locationError

        const formattedLocations: LocationWithHours[] = (locationsData || []).map(loc => ({
          id: loc.id,
          name: loc.name,
          opens_at: loc.opens_at as string | null,
          closes_at: loc.closes_at as string | null,
        }))

        setLocations(formattedLocations)

        const { data: employeesData, error: employeesError } = await supabase
          .from('business_employees')
          .select('id, employee_id, lunch_break_start, lunch_break_end, has_lunch_break')
          .eq('business_id', business.id)
          .eq('status', 'approved')
          .eq('is_active', true)

        if (employeesError) throw employeesError

        const employeeIds = (employeesData || []).map(e => e.employee_id)
        const { data: profilesData } = employeeIds.length > 0
          ? await supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .in('id', employeeIds)
          : { data: [] }

        const profilesMap = (profilesData || []).reduce((acc, p) => {
          acc[p.id] = p
          return acc
        }, {} as Record<string, { full_name: string; avatar_url: string | null }>)

        const { data: employeeServicesData } = employeeIds.length > 0
          ? await supabase
              .from('employee_services')
              .select('employee_id, service_id, services(name)')
              .in('employee_id', employeeIds)
          : { data: [] }

        const servicesMap = (employeeServicesData || []).reduce((acc, es) => {
          if (!acc[es.employee_id]) {
            acc[es.employee_id] = []
          }
          if (es.services && typeof es.services === 'object' && 'name' in es.services) {
            acc[es.employee_id].push(es.services.name as string)
          }
          return acc
        }, {} as Record<string, string[]>)

        const formattedEmployees: Employee[] = (employeesData || []).map(emp => ({
          id: emp.id,
          user_id: emp.employee_id,
          profile_name: profilesMap[emp.employee_id]?.full_name || 'Sin nombre',
          profile_avatar: profilesMap[emp.employee_id]?.avatar_url || undefined,
          lunch_break_start: emp.lunch_break_start,
          lunch_break_end: emp.lunch_break_end,
          has_lunch_break: emp.has_lunch_break,
          services: servicesMap[emp.employee_id] || [],
        }))

        setEmployees(formattedEmployees)

        const { data: servicesData } = await supabase
          .from('services')
          .select('id, name')
          .eq('business_id', business.id)

        setServices(servicesData || [])

      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error(t('admin.appointmentCalendar.errorFetchingData'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, t])

  // Fetch appointments when dependencies change
  useEffect(() => {
    if (currentBusinessId) {
      fetchAppointments()
    }
  }, [fetchAppointments, currentBusinessId])

  return {
    employees,
    appointments,
    isLoading,
    currentBusinessId,
    locations,
    services,
    fetchAppointments,
  }
}