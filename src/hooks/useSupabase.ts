import { useState, useEffect, useCallback, useRef } from 'react'
import { User, Appointment, UserSettings, DashboardStats, UpcomingAppointment, isValidLanguage, isValidUserRole } from '@/types'
import supabase from '@/lib/supabase'
import { toast } from 'sonner'
import { getRolePermissions } from '@/lib/permissions'

// Internal helpers
type AnyRecord = Record<string, unknown>

const asString = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback)
const asNumber = (v: unknown, fallback = 0): number => {
  if (typeof v === 'number') return v
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}
const asBoolean = (v: unknown, fallback = false): boolean => (typeof v === 'boolean' ? v : Boolean(v ?? fallback))
const asNumberArray = (v: unknown, fallback: number[] = []): number[] => (
  Array.isArray(v) ? v.filter((x): x is number => typeof x === 'number') : fallback
)

const isTheme = (v: unknown): v is UserSettings['theme'] => v === 'light' || v === 'dark' || v === 'system'
const isDateFormat = (v: unknown): v is UserSettings['date_format'] => v === 'DD/MM/YYYY' || v === 'MM/DD/YYYY' || v === 'YYYY-MM-DD'
const isTimeFormat = (v: unknown): v is UserSettings['time_format'] => v === '12h' || v === '24h'

const defaultNotificationPrefs = (): User['notification_preferences'] => ({
  email: true,
  push: false,
  browser: true,
  whatsapp: false,
  reminder_24h: true,
  reminder_1h: true,
  reminder_15m: false,
  daily_digest: false,
  weekly_report: false,
})

const normalizeUserSettings = (row: AnyRecord | null | undefined): UserSettings => {
  const email_notifications = (row?.email_notifications as AnyRecord) ?? {}
  const whatsapp_notifications = (row?.whatsapp_notifications as AnyRecord) ?? {}
  const business_hours = (row?.business_hours as AnyRecord) ?? {}
  const lang = asString(row?.language, '')
  const theme = isTheme(row?.theme) ? row?.theme : 'system'
  return {
    id: asString(row?.id, ''),
    user_id: asString(row?.user_id, ''),
    theme,
    language: isValidLanguage(lang) ? lang : 'es',
    timezone: asString(row?.timezone, 'America/Mexico_City'),
    default_appointment_duration: asNumber(row?.default_appointment_duration, 60),
    business_hours: {
      start: asString(business_hours?.start, '09:00'),
      end: asString(business_hours?.end, '18:00'),
      days: asNumberArray(business_hours?.days, [1,2,3,4,5]),
    },
    auto_reminders: asBoolean(row?.auto_reminders, true),
    reminder_times: asNumberArray(row?.reminder_times, [1440, 60, 15]),
    email_notifications: {
      appointment_reminders: asBoolean(email_notifications?.appointment_reminders, true),
      appointment_confirmations: asBoolean(email_notifications?.appointment_confirmations, true),
      appointment_cancellations: asBoolean(email_notifications?.appointment_cancellations, true),
      daily_digest: asBoolean(email_notifications?.daily_digest, false),
      weekly_report: asBoolean(email_notifications?.weekly_report, false),
      marketing: asBoolean(email_notifications?.marketing, false),
    },
    whatsapp_notifications: {
      appointment_reminders: asBoolean(whatsapp_notifications?.appointment_reminders, false),
      appointment_confirmations: asBoolean(whatsapp_notifications?.appointment_confirmations, false),
      follow_ups: asBoolean(whatsapp_notifications?.follow_ups, false),
    },
  date_format: isDateFormat(row?.date_format) ? row?.date_format : 'DD/MM/YYYY',
  time_format: isTimeFormat(row?.time_format) ? row?.time_format : '24h',
    created_at: asString(row?.created_at, new Date().toISOString()),
    updated_at: asString(row?.updated_at, new Date().toISOString()),
  }
}

const buildDomainUser = (
  authUser: { id: string; email?: string | null; user_metadata?: AnyRecord | null },
  profileRow?: AnyRecord | null,
  settings?: UserSettings | null,
): User => {
  const metadata = authUser.user_metadata ?? {}
  const roleRaw = (profileRow?.role as string) ?? (metadata?.role as string) ?? 'client'
  const role = isValidUserRole(roleRaw) ? roleRaw : 'client'

  const name = (profileRow?.full_name as string) || (metadata?.full_name as string) || (metadata?.name as string) || authUser.email || 'Usuario'
  const avatar_url = (profileRow?.avatar_url as string) || (metadata?.avatar_url as string) || (metadata?.picture as string) || undefined
  const langCandidate = asString(settings?.language ?? metadata?.locale, '')
  const language = isValidLanguage(langCandidate) ? langCandidate : 'es'
  const timezone = settings?.timezone ?? (metadata?.timezone as string) ?? 'America/Mexico_City'
  const notification_preferences: User['notification_preferences'] = settings
    ? {
        email: Boolean(settings.email_notifications.appointment_reminders || settings.email_notifications.appointment_confirmations),
        push: false,
        browser: true,
        whatsapp: Boolean(settings.whatsapp_notifications.appointment_reminders || settings.whatsapp_notifications.appointment_confirmations),
        reminder_24h: settings.reminder_times?.includes(1440) ?? true,
        reminder_1h: settings.reminder_times?.includes(60) ?? true,
        reminder_15m: settings.reminder_times?.includes(15) ?? false,
        daily_digest: Boolean(settings.email_notifications.daily_digest),
        weekly_report: Boolean(settings.email_notifications.weekly_report),
      }
    : defaultNotificationPrefs()

  return {
    id: authUser.id,
    email: authUser.email ?? '',
    name,
    avatar_url,
    timezone,
    role,
    business_id: (profileRow?.business_id as string) || undefined,
    location_id: (profileRow?.location_id as string) || undefined,
    phone: (profileRow?.phone as string) || undefined,
    language,
    notification_preferences,
    permissions: getRolePermissions(role),
  created_at: asString(profileRow?.created_at, new Date().toISOString()),
    updated_at: (profileRow?.updated_at as string) || undefined,
    is_active: (profileRow?.is_active as boolean) ?? true,
    last_login: new Date().toISOString(),
  }
}

const loadUser = async (authUser: { id: string; email?: string | null; user_metadata?: AnyRecord | null }): Promise<User> => {
  // Best-effort fetch of profile and settings; tolerate missing rows
  const [{ data: profile }, { data: rawSettings }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', authUser.id).single(),
    supabase.from('user_settings').select('*').eq('user_id', authUser.id).maybeSingle?.() ?? supabase.from('user_settings').select('*').eq('user_id', authUser.id).single(),
  ]).then(async (results) => {
    // Some Supabase clients may not have maybeSingle; normalize results
    const [p, s] = results as Array<{ data: AnyRecord | null }>
    return [p, s]
  })

  const settings = rawSettings ? normalizeUserSettings(rawSettings) : null
  return buildDomainUser(authUser, profile, settings)
}

// Authentication hook
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { user: authUser } = await supabase.auth.getUser().then(r => ({ user: r.data.user }))
        if (authUser) {
          const mapped = await loadUser({ id: authUser.id, email: authUser.email, user_metadata: authUser.user_metadata as AnyRecord })
          setUser(mapped)
        } else {
          setUser(null)
        }
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
          const mapped = await loadUser({ id: session.user.id, email: session.user.email, user_metadata: session.user.user_metadata as AnyRecord })
          setUser(mapped)
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
  .eq('employee_id', userId)
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
      const insert = { ...appointmentData, employee_id: userId }
      const { data, error } = await supabase
        .from('appointments')
        .insert(insert)
        .select()
        .single()
      if (error) throw new Error(error.message)
      
      const newAppointment = data as Appointment
      setAppointments(prev => [...prev, newAppointment])
      
      // ✅ Enviar notificaciones in-app (no bloqueantes)
      try {
        // Notificación al CLIENTE
        await supabase.functions.invoke('send-notification', {
          body: {
            type: 'appointment_new_client',
            recipient_user_id: appointmentData.client_id,
            business_id: appointmentData.business_id,
            appointment_id: newAppointment.id,
            priority: 1, // Alta prioridad
            action_url: `/appointments/${newAppointment.id}`,
            force_channels: ['in_app', 'email'], // In-app + Email
            data: {
              appointment_date: appointmentData.start_time,
              service_id: appointmentData.service_id,
              location_id: appointmentData.location_id
            }
          }
        })
        
        // Notificación al EMPLEADO (si es diferente del creador)
        const targetEmployeeId = insert.employee_id
        if (targetEmployeeId && targetEmployeeId !== userId) {
          await supabase.functions.invoke('send-notification', {
            body: {
              type: 'appointment_new_employee',
              recipient_user_id: targetEmployeeId,
              business_id: appointmentData.business_id,
              appointment_id: newAppointment.id,
              priority: 1,
              action_url: `/appointments/${newAppointment.id}`,
              force_channels: ['in_app', 'email'],
              data: {
                client_id: appointmentData.client_id,
                appointment_date: appointmentData.start_time,
                service_id: appointmentData.service_id
              }
            }
          })
        }
        
        // Notificaciones enviadas exitosamente
      } catch {
        // No fallar la creación de cita si fallan las notificaciones
        // Error enviando notificaciones in-app
      }
      
      toast.success('Appointment created successfully!')
      return newAppointment
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
      // Obtener cita actual para comparar cambios
      const currentAppointment = appointments.find(apt => apt.id === id)
      
      const { data, error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw new Error(error.message)
      
      const updatedAppointment = data as Appointment
      setAppointments(prev => prev.map(apt => apt.id === id ? updatedAppointment : apt))
      
      // ✅ Enviar notificaciones según el tipo de cambio (no bloqueantes)
      try {
        // Detectar cambio de status
        if (updates.status && currentAppointment && updates.status !== currentAppointment.status) {
          let notificationType: string | null = null
          
          if (updates.status === 'confirmed') {
            notificationType = 'appointment_confirmation'
          } else if (updates.status === 'cancelled') {
            notificationType = 'appointment_cancellation'
          }
          
          if (notificationType) {
            // Notificar al cliente
            await supabase.functions.invoke('send-notification', {
              body: {
                type: notificationType,
                recipient_user_id: updatedAppointment.client_id,
                business_id: updatedAppointment.business_id,
                appointment_id: updatedAppointment.id,
                priority: 1,
                action_url: `/appointments/${updatedAppointment.id}`,
                force_channels: ['in_app', 'email'],
                data: {
                  appointment_date: updatedAppointment.start_time,
                  status: updates.status
                }
              }
            })
          }
        }
        
        // Detectar cambio de fecha/hora (reprogramación)
        if ((updates.start_time || updates.end_time) && currentAppointment) {
          const timeChanged = updates.start_time !== currentAppointment.start_time || 
                             updates.end_time !== currentAppointment.end_time
          
          if (timeChanged) {
            // Notificar reprogramación al cliente
            await supabase.functions.invoke('send-notification', {
              body: {
                type: 'appointment_rescheduled',
                recipient_user_id: updatedAppointment.client_id,
                business_id: updatedAppointment.business_id,
                appointment_id: updatedAppointment.id,
                priority: 1,
                action_url: `/appointments/${updatedAppointment.id}`,
                force_channels: ['in_app', 'email'],
                data: {
                  old_start_time: currentAppointment.start_time,
                  new_start_time: updatedAppointment.start_time,
                  old_end_time: currentAppointment.end_time,
                  new_end_time: updatedAppointment.end_time
                }
              }
            })
            
            // También notificar al empleado si es diferente del modificador
            if (updatedAppointment.user_id !== userId) {
              await supabase.functions.invoke('send-notification', {
                body: {
                  type: 'appointment_rescheduled',
                  recipient_user_id: updatedAppointment.user_id,
                  business_id: updatedAppointment.business_id,
                  appointment_id: updatedAppointment.id,
                  priority: 1,
                  action_url: `/appointments/${updatedAppointment.id}`,
                  force_channels: ['in_app'],
                  data: {
                    old_start_time: currentAppointment.start_time,
                    new_start_time: updatedAppointment.start_time
                  }
                }
              })
            }
          }
        }
      } catch {
        // No fallar la actualización si fallan las notificaciones
      }
      
      toast.success('Appointment updated successfully!')
      return updatedAppointment
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update appointment'
      toast.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [appointments, userId])

  const deleteAppointment = useCallback(async (id: string) => {
    setLoading(true)
    try {
      // Obtener cita antes de eliminarla para enviar notificaciones
      const appointmentToDelete = appointments.find(apt => apt.id === id)
      
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id)
      if (error) throw new Error(error.message)
      
      setAppointments(prev => prev.filter(apt => apt.id !== id))
      
      // ✅ Enviar notificación de cancelación (no bloqueante)
      if (appointmentToDelete) {
        try {
          // Notificar al cliente
          await supabase.functions.invoke('send-notification', {
            body: {
              type: 'appointment_cancellation',
              recipient_user_id: appointmentToDelete.client_id,
              business_id: appointmentToDelete.business_id,
              appointment_id: appointmentToDelete.id,
              priority: 2, // Urgente
              action_url: '/appointments',
              force_channels: ['in_app', 'email'],
              data: {
                appointment_date: appointmentToDelete.start_time,
                service_id: appointmentToDelete.service_id,
                cancelled_by: userId
              }
            }
          })
          
          // Notificar al empleado si es diferente del que cancela
          if (appointmentToDelete.user_id !== userId) {
            await supabase.functions.invoke('send-notification', {
              body: {
                type: 'appointment_cancellation',
                recipient_user_id: appointmentToDelete.user_id,
                business_id: appointmentToDelete.business_id,
                appointment_id: appointmentToDelete.id,
                priority: 2,
                action_url: '/appointments',
                force_channels: ['in_app'],
                data: {
                  appointment_date: appointmentToDelete.start_time,
                  client_id: appointmentToDelete.client_id,
                  cancelled_by: userId
                }
              }
            })
          }
        } catch {
          // No fallar la eliminación si fallan las notificaciones
        }
      }
      
      toast.success('Appointment deleted successfully!')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete appointment'
      toast.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [appointments, userId])

  const getUpcomingAppointments = useCallback(async (limit: number = 5) => {
    if (!userId) return []
    
    try {
      const now = new Date().toISOString()
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
  .eq('employee_id', userId)
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
  .eq('employee_id', userId)
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

  const handleRealtime = (payload) => {
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
        { event: '*', schema: 'public', table: 'appointments', filter: `employee_id=eq.${userId}` },
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
  setSettings(normalizeUserSettings(data as AnyRecord))
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
      
  setSettings(normalizeUserSettings(data as AnyRecord))
      toast.success('Settings updated successfully!')
  return normalizeUserSettings(data as AnyRecord)
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