import React from 'react'
import { supabase } from '@/lib/supabase'
import type { Appointment } from '@/types/appointment'

export const useClientAppointments = (currentUserId?: string) => {
  const [appointments, setAppointments] = React.useState<Appointment[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  const fetchClientAppointments = React.useCallback(async () => {
    if (!currentUserId) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(
          `
          *,
          businesses!inner(id, name, logo_url, phone, email),
          locations!inner(id, name, address, city, state, country),
          profiles!inner(id, name, email, avatar_url, phone),
          services(id, name, description, duration, price, currency)
        `
        )
        .eq('client_id', currentUserId)
        .order('start_time', { ascending: true })

      if (error) throw error

      // Mapear datos para compatibilidad (los JOINs retornan arrays, tomar el primero)
      const mappedData = (data || []).map((apt: any) => ({
        ...apt,
        business: apt.businesses?.[0],
        location: apt.locations?.[0],
        employee: apt.profiles?.[0],
        service: apt.services?.[0]
          ? { ...apt.services[0], duration: apt.services[0].duration }
          : undefined,
      }))

      setAppointments(mappedData)
    } catch (err) {
      console.error('Error fetching client appointments:', err)
    } finally {
      setIsLoading(false)
    }
  }, [currentUserId])

  // Fetch on mount and when user changes
  React.useEffect(() => {
    fetchClientAppointments()
  }, [fetchClientAppointments])

  // Filter upcoming appointments
  const upcomingAppointments = React.useMemo(() => {
    if (!appointments) return []
    const now = new Date()
    return appointments
      .filter(apt => {
        const aptDate = new Date(apt.start_time)
        return aptDate >= now && ['pending', 'confirmed', 'scheduled'].includes(apt.status)
      })
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
  }, [appointments])

  return {
    appointments,
    upcomingAppointments,
    isLoading,
    fetchClientAppointments,
    setAppointments
  }
}