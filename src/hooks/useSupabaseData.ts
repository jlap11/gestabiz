import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Appointment, 
  Service, 
  Location, 
  Business, 
  Client, 
  DashboardStats,
  User,
} from '@/types'
// removed isValidAppointmentStatus in favor of normalizeAppointmentStatus
import { normalizeAppointmentStatus } from '@/lib/normalizers'
import { appointmentsService, servicesService, locationsService, businessesService, statsService } from '@/lib/services'
import { toast } from 'sonner'

interface UseSupabaseDataOptions {
  user: User | null
  autoFetch?: boolean
}

export function useSupabaseData({ user, autoFetch = true }: UseSupabaseDataOptions) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Data states
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [clients] = useState<Client[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)

  // Error handler
  const handleError = useCallback((error: unknown, operation: string) => {
    const message = (error as { message?: string })?.message || `Error in ${operation}`
    setError(message)
    toast.error(message)
  }, [])

  // Fetch appointments
  const fetchAppointments = useCallback(async (businessId?: string) => {
    if (!user) return []

    try {
      setLoading(true)
      setError(null)

      // Usar el servicio con filtros por rol/negocio
      const raw = await appointmentsService.list({
        businessId,
        employeeId: user.role === 'employee' ? user.id : undefined,
        clientId: user.role === 'client' ? user.id : undefined,
        // date range opcional se deja fuera aquí
      })

      type RawAppointment = Partial<Appointment> & {
        employee_id?: string
        user_id?: string
        service?: { name?: string }
        client?: { full_name?: string; email?: string; phone?: string }
        location?: string | { name?: string; address?: string }
      }

      const formattedAppointments: Appointment[] = (raw || []).map(_apt => {
        const apt = _apt as RawAppointment
        const rawLocation = (apt as unknown as { location?: string | { name?: string } }).location
        const locationName = typeof rawLocation === 'string' ? rawLocation : rawLocation?.name
        return {
          id: apt.id!,
          business_id: apt.business_id!,
          location_id: apt.location_id,
          service_id: apt.service_id,
          user_id: apt.user_id || apt.employee_id || '',
          client_id: apt.client_id!,
          title: apt.title || `${apt.service?.name || 'Cita'} - ${apt.client?.full_name || 'Cliente'}`,
          description: apt.description || apt.notes || '',
          client_name: apt.client_name || apt.client?.full_name || 'Cliente',
          client_email: apt.client_email || apt.client?.email || '',
          client_phone: apt.client_phone || apt.client?.phone || '',
          start_time: apt.start_time!,
          end_time: apt.end_time!,
          status: normalizeAppointmentStatus(String(apt.status || 'scheduled')),
          location: locationName || '',
          notes: apt.notes || apt.description || '',
          price: apt.price,
          currency: apt.currency || 'MXN',
          reminder_sent: apt.reminder_sent ?? false,
          created_at: apt.created_at || apt.start_time!,
          updated_at: apt.updated_at || apt.start_time!,
          created_by: apt.created_by || apt.client_id!
        }
      })

      setAppointments(formattedAppointments)
      return formattedAppointments
    } catch (error) {
      handleError(error, 'fetch appointments')
      return []
    } finally {
      setLoading(false)
    }
  }, [user, handleError])

  // Fetch services
  const fetchServices = useCallback(async (businessId?: string) => {
    if (!user) return []

    try {
      setLoading(true)
      setError(null)

      let svcBusinessIds = businessId ? [businessId] : undefined
      if (user.role === 'admin' && !businessId) {
        const { data: userBusinesses } = await supabase.from('businesses').select('id').eq('owner_id', user.id)
        svcBusinessIds = (userBusinesses || []).map(b => b.id)
      }
      const formattedServices = await servicesService.list({ businessIds: svcBusinessIds, activeOnly: true })

      setServices(formattedServices)
      return formattedServices
    } catch (error) {
      handleError(error, 'fetch services')
      return []
    } finally {
      setLoading(false)
    }
  }, [user, handleError])

  // Fetch locations
  const fetchLocations = useCallback(async (businessId?: string) => {
    if (!user) return []

    try {
      setLoading(true)
      setError(null)

      let locBusinessIds = businessId ? [businessId] : undefined
      if (user.role === 'admin' && !businessId) {
        const { data: userBusinesses } = await supabase.from('businesses').select('id').eq('owner_id', user.id)
        locBusinessIds = (userBusinesses || []).map(b => b.id)
      }
      const formattedLocations = await locationsService.list({ businessIds: locBusinessIds, activeOnly: true })

      setLocations(formattedLocations)
      return formattedLocations
    } catch (error) {
      handleError(error, 'fetch locations')
      return []
    } finally {
      setLoading(false)
    }
  }, [user, handleError])

  // Fetch businesses
  const fetchBusinesses = useCallback(async () => {
    if (!user) return []

    try {
      setLoading(true)
      setError(null)

      let formattedBusinesses: Business[] = []
      if (user.role === 'admin') {
        formattedBusinesses = await businessesService.list({ ownerId: user.id })
      } else if (user.role === 'employee') {
        formattedBusinesses = await businessesService.listByEmployee(user.id)
      } else {
        formattedBusinesses = await businessesService.list()
      }

      setBusinesses(formattedBusinesses)
      return formattedBusinesses
    } catch (error) {
      handleError(error, 'fetch businesses')
      return []
    } finally {
      setLoading(false)
    }
  }, [user, handleError])

  // Fetch dashboard stats
  const fetchDashboardStats = useCallback(async (businessId?: string, dateRange?: { start: string; end: string }) => {
    if (!user) return null

    try {
      setLoading(true)
      setError(null)

      const stats = await statsService.getDashboardStats({
        businessId,
        ownerId: user.role === 'admin' ? user.id : undefined,
        employeeId: user.role === 'employee' ? user.id : undefined,
        dateRange
      })

      setStats(stats)
      return stats
    } catch (error) {
      handleError(error, 'fetch dashboard stats')
      return null
    } finally {
      setLoading(false)
    }
  }, [user, handleError])

  // Create appointment
  const createAppointment = useCallback(async (appointment: Partial<Appointment>) => {
    if (!user) {
      toast.error('Debes estar autenticado para crear citas')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const created = await appointmentsService.create({
        business_id: appointment.business_id!,
        location_id: appointment.location_id,
        service_id: appointment.service_id!,
        client_id: appointment.client_id!,
        user_id: appointment.user_id!, // employee assigned
        title: appointment.title || 'Cita',
        description: appointment.description || '',
        client_name: appointment.client_name || '',
        client_email: appointment.client_email,
        client_phone: appointment.client_phone,
        start_time: appointment.start_time!,
        end_time: appointment.end_time!,
        status: appointment.status || 'scheduled',
        location: appointment.location,
        notes: appointment.notes || '',
        price: appointment.price,
        currency: appointment.currency || 'MXN',
        reminder_sent: false,
        created_by: user.id
      })

      toast.success('Cita creada correctamente')
      await fetchAppointments()
      return created
    } catch (error) {
      handleError(error, 'create appointment')
  return
    } finally {
      setLoading(false)
    }
  }, [user, handleError, fetchAppointments])

  // Update appointment
  const updateAppointment = useCallback(async (id: string, updates: Partial<Appointment>) => {
    if (!user) return null

    try {
      setLoading(true)
      setError(null)

      const updated = await appointmentsService.update(id, {
        start_time: updates.start_time,
        end_time: updates.end_time,
        status: updates.status,
        notes: updates.notes,
        price: updates.price,
        updated_at: new Date().toISOString()
      })

      toast.success('Cita actualizada correctamente')
      await fetchAppointments()
      return updated
    } catch (error) {
      handleError(error, 'update appointment')
      return null
    } finally {
      setLoading(false)
    }
  }, [user, handleError, fetchAppointments])

  // Delete appointment
  const deleteAppointment = useCallback(async (id: string) => {
    if (!user) return false

    try {
      setLoading(true)
      setError(null)

      await appointmentsService.remove(id)
      toast.success('Cita eliminada correctamente')
      await fetchAppointments()
      return true
    } catch (error) {
      handleError(error, 'delete appointment')
      return false
    } finally {
      setLoading(false)
    }
  }, [user, handleError, fetchAppointments])

  // TEMPORARILY DISABLED FOR DEBUGGING: Auto-fetch causes exponential query cascade
  // Auto-fetch data when user changes
  useEffect(() => {
    if (autoFetch && user) {
      console.log('[useSupabaseData] Auto-fetch triggered')
      // COMMENTED OUT: These 5 parallel queries + callbacks in deps cause cascade
      // fetchAppointments()
      // fetchServices()
      // fetchLocations()
      // fetchBusinesses()
      // fetchDashboardStats()
    }
  }, [user, autoFetch, fetchAppointments, fetchServices, fetchLocations, fetchBusinesses, fetchDashboardStats])

  return {
    // Data
    appointments,
    services,
    locations,
    businesses,
    clients,
    stats,
    
    // States
    loading,
    error,
    
    // Methods
    fetchAppointments,
    fetchServices,
    fetchLocations,
    fetchBusinesses,
    fetchDashboardStats,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    
    // Utils
    refetch: () => {
      if (user) {
        fetchAppointments()
        fetchServices()
        fetchLocations()
        fetchBusinesses()
        fetchDashboardStats()
      }
    }
  }
}