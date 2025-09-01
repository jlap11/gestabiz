import { useState, useEffect, useCallback, useRef } from 'react'
import { User, Appointment, UserSettings, DashboardStats, UpcomingAppointment } from '@/types'
import supabase from '@/lib/supabase'
import { toast } from 'sonner'

// Authentication hook
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
  const { user } = await supabase.auth.getUser().then(r => ({ user: r.data.user }))
        setUser(user as User)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user as User)
          setError(null)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setError(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    setLoading(true)
    setError(null)
    try {
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
      if (error) throw new Error(error.message)
      toast.success('Account created successfully! Please check your email to verify.')
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create account'
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw new Error(error.message)
      toast.success('Signed in successfully!')
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign in'
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const signInWithGoogle = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' })
      if (error) throw new Error(error.message)
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign in with Google'
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const signOut = useCallback(async () => {
    setLoading(true)
    try {
  const { error } = await supabase.auth.signOut()
      if (error) throw new Error(error.message)
      toast.success('Signed out successfully!')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign out'
      toast.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    setLoading(true)
    setError(null)
    try {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) throw new Error(error.message)
      toast.success('Password reset email sent!')
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send reset email'
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    user,
    loading,
    error,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword
  }
}

// Appointments hook
export const useAppointments = (userId?: string) => {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const appointmentsRef = useRef<Appointment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    appointmentsRef.current = appointments
  }, [appointments])

  const fetchAppointments = useCallback(async () => {
    if (!userId) return
    
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: true })
      if (error) throw new Error(error.message)
      setAppointments((data || []) as Appointment[])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch appointments'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  const createAppointment = useCallback(async (appointmentData: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>) => {
    if (!userId) return
    
    setLoading(true)
    try {
      const insert = { ...appointmentData, user_id: userId }
      const { data, error } = await supabase
        .from('appointments')
        .insert(insert)
        .select()
        .single()
      if (error) throw new Error(error.message)
      
      setAppointments(prev => [...prev, data as Appointment])
      toast.success('Appointment created successfully!')
      return data as Appointment
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create appointment'
      toast.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [userId])

  const updateAppointment = useCallback(async (id: string, updates: Partial<Appointment>) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw new Error(error.message)
      
      setAppointments(prev => prev.map(apt => apt.id === id ? (data as Appointment) : apt))
      toast.success('Appointment updated successfully!')
      return data as Appointment
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update appointment'
      toast.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteAppointment = useCallback(async (id: string) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id)
      if (error) throw new Error(error.message)
      
      setAppointments(prev => prev.filter(apt => apt.id !== id))
      toast.success('Appointment deleted successfully!')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete appointment'
      toast.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getUpcomingAppointments = useCallback(async (limit: number = 5) => {
    if (!userId) return []
    
    try {
      const now = new Date().toISOString()
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', userId)
        .gt('start_time', now)
        .order('start_time', { ascending: true })
        .limit(limit)
      if (error) throw new Error(error.message)
      return (data || []) as Appointment[]
    } catch (err) {
  const message = err instanceof Error ? err.message : 'Failed to fetch upcoming appointments'
  setError(message)
  return []
    }
  }, [userId])

  const getAppointmentsByDateRange = useCallback(async (startDate: string, endDate: string) => {
    if (!userId) return []
    
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', userId)
        .gte('start_time', startDate)
        .lte('start_time', endDate)
        .order('start_time', { ascending: true })
      if (error) throw new Error(error.message)
      return (data || []) as Appointment[]
    } catch (err) {
  const message = err instanceof Error ? err.message : 'Failed to fetch appointments by date range'
  setError(message)
  return []
    }
  }, [userId])

  // Set up real-time subscription
  useEffect(() => {
    if (!userId) return

    fetchAppointments()

    const upsertAppointment = (row: Appointment) => {
      const current = appointmentsRef.current
      const next = current.map(apt => (apt.id === row.id ? row : apt))
      appointmentsRef.current = next
      setAppointments(next)
    }
    const addAppointment = (row: Appointment) => {
      const current = appointmentsRef.current
      const next = [...current, row]
      appointmentsRef.current = next
      setAppointments(next)
    }
    const removeAppointment = (row: Appointment) => {
      const current = appointmentsRef.current
      const next = current.filter(apt => apt.id !== row.id)
      appointmentsRef.current = next
      setAppointments(next)
    }

    const handleRealtime = (payload: any) => {
  // console.log('Appointment change:', payload)
      if (payload.eventType === 'INSERT') {
        const newRow = payload.new as Appointment
        addAppointment(newRow)
        return
      }
      if (payload.eventType === 'UPDATE') {
        const newRow = payload.new as Appointment
        upsertAppointment(newRow)
        return
      }
      if (payload.eventType === 'DELETE') {
        const oldRow = payload.old as Appointment
        removeAppointment(oldRow)
      }
    }

    const channel = supabase
      .channel('appointments-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments', filter: `user_id=eq.${userId}` },
        handleRealtime
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, fetchAppointments])

  return {
    appointments,
    loading,
    error,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    refetch: fetchAppointments,
    getUpcomingAppointments,
    getAppointmentsByDateRange
  }
}

// User settings hook
export const useUserSettings = (userId?: string) => {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    if (!userId) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single()
      if (error) throw new Error(error.message)
      setSettings(data as UserSettings)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch settings'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    if (!userId) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .upsert({ user_id: userId, ...updates })
        .select()
        .single()
      if (error) throw new Error(error.message)
      
      setSettings(data as UserSettings)
      toast.success('Settings updated successfully!')
      return data as UserSettings
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update settings'
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  return {
    settings,
    loading,
    error,
    updateSettings,
    refetch: fetchSettings
  }
}

// Dashboard statistics hook
export const useDashboardStats = (userId?: string) => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    if (!userId) return
    
    setLoading(true)
    try {
      const { data: rows, error } = await supabase
        .from('appointments')
        .select('status, price, start_time')
        .eq('user_id', userId)
      if (error) throw new Error(error.message)
      const list = (rows as Appointment[]) || []
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const revenueTotal = list.reduce((s, a) => s + (a.price || 0), 0)
      const statsCalc: DashboardStats = {
        total_appointments: list.length,
        scheduled_appointments: list.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length,
        completed_appointments: list.filter(a => a.status === 'completed').length,
        cancelled_appointments: list.filter(a => a.status === 'cancelled').length,
        no_show_appointments: list.filter(a => a.status === 'no_show').length,
        upcoming_today: list.filter(a => new Date(a.start_time).toDateString() === now.toDateString()).length,
        upcoming_week: list.filter(a => {
          const d = new Date(a.start_time)
          const diff = (d.getTime() - now.getTime()) / (1000*60*60*24)
          return diff >= 0 && diff <= 7
        }).length,
        revenue_total: revenueTotal,
        revenue_this_month: list.filter(a => new Date(a.start_time) >= startOfMonth).reduce((s, a) => s + (a.price || 0), 0),
        average_appointment_value: list.length ? revenueTotal / list.length : 0,
        client_retention_rate: 0,
        popular_services: [],
        popular_times: [],
        employee_performance: [],
        location_performance: []
      }
      setStats(statsCalc)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch dashboard stats'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  }
}

// Browser extension data hook
export const useBrowserExtensionData = () => {
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUpcomingAppointments = useCallback(async (limit: number = 3) => {
    setLoading(true)
    try {
      const now = new Date().toISOString()
      const { data, error } = await supabase
        .from('appointments')
        .select('id,title,start_time,client_name,location')
        .gt('start_time', now)
        .order('start_time', { ascending: true })
        .limit(limit)
      if (error) throw new Error(error.message)
      const mapped = (data || []).map(row => ({
        id: row.id,
        title: row.title,
        start_time: row.start_time,
        client_name: row.client_name,
        location: row.location,
        time_until: ''
      })) as UpcomingAppointment[]
      setUpcomingAppointments(mapped)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch upcoming appointments'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUpcomingAppointments()
    
    // Refresh data every 5 minutes
    const interval = setInterval(() => {
      fetchUpcomingAppointments()
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [fetchUpcomingAppointments])

  return {
    upcomingAppointments,
    loading,
    error,
    refetch: fetchUpcomingAppointments
  }
}

// Notification processing hook
export const useNotificationProcessor = (userId?: string) => {
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const processNotifications = useCallback(async () => {
    if (!userId || processing) return
    
    setProcessing(true)
    try {
      // This would typically be handled by a background job
      // For now, we'll just call the edge function
      const response = await fetch('/api/process-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      })
      
      if (!response.ok) {
        throw new Error('Failed to process notifications')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process notifications')
    } finally {
      setProcessing(false)
    }
  }, [userId, processing])

  return {
    processNotifications,
    processing,
    error
  }
}