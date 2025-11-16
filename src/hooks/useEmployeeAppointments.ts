import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface AppointmentWithRelations {
  id: string
  business_id: string
  location_id?: string
  service_id?: string
  client_id: string
  employee_id?: string
  start_time: string
  end_time: string
  status: 'pending' | 'pending_confirmation' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  notes?: string
  price?: number
  currency?: string
  client_name?: string
  client_phone?: string
  client_email?: string
  service_name?: string
  location_name?: string
  location_address?: string
}

interface UseEmployeeAppointmentsReturn {
  appointments: AppointmentWithRelations[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useEmployeeAppointments(
  employeeId: string,
  businessId: string
): UseEmployeeAppointmentsReturn {
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchAppointments = useCallback(async () => {
    if (!employeeId || !businessId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch appointments assigned to this employee
      const { data, error: fetchError } = await supabase
        .from('appointments')
        .select(`
          id,
          business_id,
          location_id,
          service_id,
          client_id,
          employee_id,
          start_time,
          end_time,
          status,
          notes,
          price,
          currency
        `)
        .eq('employee_id', employeeId)
        .eq('business_id', businessId)
        .order('start_time', { ascending: true })

      if (fetchError) throw fetchError

      // Fetch related data separately for better control
      
      // Get client info
      const { data: clientData } = await supabase
        .from('profiles')
        .select('id, full_name, phone, email')
        .in('id', (data || []).map(apt => apt.client_id))

      // Get service info
      const { data: serviceData } = await supabase
        .from('services')
        .select('id, name')
        .in('id', (data || []).map(apt => apt.service_id).filter(Boolean) as string[])

      // Get location info
      const { data: locationData } = await supabase
        .from('locations')
        .select('id, name, address')
        .in('id', (data || []).map(apt => apt.location_id).filter(Boolean) as string[])

      // Create lookup maps
      const clientMap = new Map(clientData?.map(c => [c.id, c]) || [])
      const serviceMap = new Map(serviceData?.map(s => [s.id, s]) || [])
      const locationMap = new Map(locationData?.map(l => [l.id, l]) || [])

      // Transform data to match interface
      const transformedAppointments: AppointmentWithRelations[] = (data || []).map(apt => {
        const client = clientMap.get(apt.client_id)
        const service = apt.service_id ? serviceMap.get(apt.service_id) : null
        const location = apt.location_id ? locationMap.get(apt.location_id) : null

        return {
          id: apt.id,
          business_id: apt.business_id,
          location_id: apt.location_id,
          service_id: apt.service_id,
          client_id: apt.client_id,
          employee_id: apt.employee_id,
          start_time: apt.start_time,
          end_time: apt.end_time,
          status: apt.status as AppointmentWithRelations['status'],
          notes: apt.notes,
          price: apt.price,
          currency: apt.currency,
          client_name: client?.full_name || 'Cliente sin nombre',
          client_phone: client?.phone,
          client_email: client?.email,
          service_name: service?.name,
          location_name: location?.name,
          location_address: location?.address
        }
      })

      setAppointments(transformedAppointments)
    } catch (err) {
      // Error handling
      setError(err instanceof Error ? err : new Error('Error desconocido'))
    } finally {
      setLoading(false)
    }
  }, [employeeId, businessId])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  // Subscribe to realtime changes
  useEffect(() => {
    if (!employeeId || !businessId) return

    const channel = supabase
      .channel('employee-appointments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `employee_id=eq.${employeeId}`
        },
        () => {
          // Refetch when appointments change
          fetchAppointments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [employeeId, businessId, fetchAppointments])

  return {
    appointments,
    loading,
    error,
    refetch: fetchAppointments
  }
}
