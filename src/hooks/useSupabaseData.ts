import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Appointment, 
  Service, 
  Location, 
  Business, 
  Client, 
  DashboardStats,
  User 
} from '@/types'
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

      let query = supabase
        .from('appointments')
        .select(`
          *,
          service:services(name, duration_minutes, price),
          location:locations(name, address),
          client:profiles!appointments_client_id_fkey(full_name, email, phone),
          employee:profiles!appointments_employee_id_fkey(full_name)
        `)

      // Filter by business if provided
      if (businessId) {
        query = query.eq('business_id', businessId)
      } else if (user.role === 'employee') {
        // Employees only see their appointments
        query = query.eq('employee_id', user.id)
      } else if (user.role === 'client') {
        // Clients only see their appointments
        query = query.eq('client_id', user.id)
      } else if (user.role === 'admin') {
        // Admins see all appointments for their businesses
        const { data: userBusinesses } = await supabase
          .from('businesses')
          .select('id')
          .eq('owner_id', user.id)

        if (userBusinesses && userBusinesses.length > 0) {
          query = query.in('business_id', userBusinesses.map(b => b.id))
        }
      }

      const { data, error } = await query.order('start_time', { ascending: true })

      if (error) throw error

      const formattedAppointments: Appointment[] = (data || []).map(apt => ({
        id: apt.id,
        business_id: apt.business_id,
        location_id: apt.location_id,
        service_id: apt.service_id,
        user_id: apt.employee_id || '',
        client_id: apt.client_id,
        title: `${apt.service?.name || 'Cita'} - ${apt.client?.full_name || 'Cliente'}`,
        description: apt.notes || '',
        client_name: apt.client?.full_name || 'Cliente',
        client_email: apt.client?.email || '',
        client_phone: apt.client?.phone || '',
        start_time: apt.start_time,
        end_time: apt.end_time,
        status: apt.status,
        location: apt.location?.name || '',
        notes: apt.notes || '',
        price: apt.price,
        currency: apt.currency || 'MXN',
        reminder_sent: apt.reminder_sent,
        created_at: apt.created_at,
        updated_at: apt.updated_at,
        created_by: apt.client_id
      }))

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

      let query = supabase
        .from('services')
        .select('*')
        .eq('is_active', true)

      if (businessId) {
        query = query.eq('business_id', businessId)
      } else if (user.role === 'admin') {
        // Get services for user's businesses
        const { data: userBusinesses } = await supabase
          .from('businesses')
          .select('id')
          .eq('owner_id', user.id)

        if (userBusinesses && userBusinesses.length > 0) {
          query = query.in('business_id', userBusinesses.map(b => b.id))
        }
      }

      const { data, error } = await query.order('name')

      if (error) throw error

      const formattedServices: Service[] = (data || []).map(service => ({
        id: service.id,
        business_id: service.business_id,
        name: service.name,
        description: service.description,
        duration: service.duration_minutes,
        price: service.price,
        currency: service.currency || 'MXN',
        category: service.category || 'General',
        is_active: service.is_active,
        created_at: service.created_at,
        updated_at: service.updated_at
      }))

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

      let query = supabase
        .from('locations')
        .select('*')
        .eq('is_active', true)

      if (businessId) {
        query = query.eq('business_id', businessId)
      } else if (user.role === 'admin') {
        // Get locations for user's businesses
        const { data: userBusinesses } = await supabase
          .from('businesses')
          .select('id')
          .eq('owner_id', user.id)

        if (userBusinesses && userBusinesses.length > 0) {
          query = query.in('business_id', userBusinesses.map(b => b.id))
        }
      }

      const { data, error } = await query.order('name')

      if (error) throw error

      const formattedLocations: Location[] = (data || []).map(location => ({
        id: location.id,
        business_id: location.business_id,
        name: location.name,
        address: location.address,
        city: location.city,
        state: location.state || '',
        country: location.country,
        postal_code: location.postal_code || '',
        phone: location.phone,
        latitude: location.latitude,
        longitude: location.longitude,
        business_hours: {
          monday: { open: '09:00', close: '17:00', is_open: true },
          tuesday: { open: '09:00', close: '17:00', is_open: true },
          wednesday: { open: '09:00', close: '17:00', is_open: true },
          thursday: { open: '09:00', close: '17:00', is_open: true },
          friday: { open: '09:00', close: '17:00', is_open: true },
          saturday: { open: '09:00', close: '17:00', is_open: true },
          sunday: { open: '09:00', close: '17:00', is_open: false }
        },
        is_active: location.is_active,
        created_at: location.created_at,
        updated_at: location.updated_at
      }))

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

      let query = supabase.from('businesses').select('*')

      if (user.role === 'admin') {
        query = query.eq('owner_id', user.id)
      } else if (user.role === 'employee') {
        // Get businesses where user is an employee
        const { data: employeeBusinesses } = await supabase
          .from('business_employees')
          .select('business_id')
          .eq('employee_id', user.id)
          .eq('status', 'approved')

        if (employeeBusinesses && employeeBusinesses.length > 0) {
          query = query.in('id', employeeBusinesses.map(eb => eb.business_id))
        } else {
          return []
        }
      }

      const { data, error } = await query.order('name')

      if (error) throw error

      const formattedBusinesses: Business[] = (data || []).map(business => ({
        id: business.id,
        name: business.name,
        description: business.description || '',
        category: 'Services', // Default category
        logo_url: business.logo_url,
        website: business.website,
        phone: business.phone,
        email: business.email,
        address: business.address,
        city: business.city,
        state: business.state,
        country: business.country,
        postal_code: business.postal_code,
        latitude: business.latitude,
        longitude: business.longitude,
        business_hours: business.business_hours || {
          monday: { open: '09:00', close: '17:00', closed: false },
          tuesday: { open: '09:00', close: '17:00', closed: false },
          wednesday: { open: '09:00', close: '17:00', closed: false },
          thursday: { open: '09:00', close: '17:00', closed: false },
          friday: { open: '09:00', close: '17:00', closed: false },
          saturday: { open: '09:00', close: '17:00', closed: false },
          sunday: { open: '09:00', close: '17:00', closed: true }
        },
        timezone: 'America/Mexico_City',
        owner_id: business.owner_id,
        settings: business.settings || {
          appointment_buffer: 15,
          advance_booking_days: 30,
          cancellation_policy: 24,
          auto_confirm: false,
          require_deposit: false,
          deposit_percentage: 0,
          currency: 'MXN'
        },
        created_at: business.created_at,
        updated_at: business.updated_at,
        is_active: business.is_active
      }))

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

      // Default to current month if no date range provided
      const startDate = dateRange?.start || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      const endDate = dateRange?.end || new Date().toISOString()

      // Base query for appointments
      let appointmentsQuery = supabase
        .from('appointments')
        .select('*')
        .gte('start_time', startDate)
        .lte('start_time', endDate)

      if (businessId) {
        appointmentsQuery = appointmentsQuery.eq('business_id', businessId)
      } else if (user.role === 'admin') {
        const { data: userBusinesses } = await supabase
          .from('businesses')
          .select('id')
          .eq('owner_id', user.id)

        if (userBusinesses && userBusinesses.length > 0) {
          appointmentsQuery = appointmentsQuery.in('business_id', userBusinesses.map(b => b.id))
        }
      }

      const { data: appointmentsData, error: appointmentsError } = await appointmentsQuery

      if (appointmentsError) throw appointmentsError

      const appointments = appointmentsData || []

      // Calculate stats
      const stats: DashboardStats = {
        total_appointments: appointments.length,
        scheduled_appointments: appointments.filter(a => a.status === 'pending' || a.status === 'confirmed').length,
        completed_appointments: appointments.filter(a => a.status === 'completed').length,
        cancelled_appointments: appointments.filter(a => a.status === 'cancelled').length,
        no_show_appointments: appointments.filter(a => a.status === 'no_show').length,
        upcoming_today: 0, // Will be calculated separately
        upcoming_week: 0, // Will be calculated separately
        revenue_total: appointments.filter(a => a.status === 'completed').reduce((sum, a) => sum + (a.price || 0), 0),
        revenue_this_month: appointments.filter(a => a.status === 'completed').reduce((sum, a) => sum + (a.price || 0), 0),
        average_appointment_value: 0,
        client_retention_rate: 0,
        popular_services: [],
        popular_times: [],
        employee_performance: [],
        location_performance: []
      }

      // Calculate average appointment value
      const completedWithPrice = appointments.filter(a => a.status === 'completed' && a.price > 0)
      stats.average_appointment_value = completedWithPrice.length > 0 
        ? stats.revenue_total / completedWithPrice.length 
        : 0

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

      const { data, error } = await supabase
        .from('appointments')
        .insert({
          business_id: appointment.business_id!,
          location_id: appointment.location_id,
          service_id: appointment.service_id!,
          client_id: appointment.client_id!,
          employee_id: appointment.user_id,
          start_time: appointment.start_time!,
          end_time: appointment.end_time!,
          status: appointment.status || 'scheduled',
          notes: appointment.notes || '',
          price: appointment.price,
          currency: appointment.currency || 'MXN',
          reminder_sent: false
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Cita creada correctamente')
      await fetchAppointments() // Refresh appointments
  return data
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

      const { data, error } = await supabase
        .from('appointments')
        .update({
          start_time: updates.start_time,
          end_time: updates.end_time,
          status: updates.status,
          notes: updates.notes,
          price: updates.price,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      toast.success('Cita actualizada correctamente')
      await fetchAppointments() // Refresh appointments
      return data
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

      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Cita eliminada correctamente')
      await fetchAppointments() // Refresh appointments
      return true
    } catch (error) {
      handleError(error, 'delete appointment')
      return false
    } finally {
      setLoading(false)
    }
  }, [user, handleError, fetchAppointments])

  // Auto-fetch data when user changes
  useEffect(() => {
    if (autoFetch && user) {
      fetchAppointments()
      fetchServices()
      fetchLocations()
      fetchBusinesses()
      fetchDashboardStats()
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