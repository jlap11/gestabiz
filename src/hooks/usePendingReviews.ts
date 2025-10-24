import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export interface PendingReview {
  appointment_id: string
  appointment_date: string
  appointment_start_time: string
  business_id: string
  business_name: string
  service_name?: string
  employee_id?: string
  employee_name?: string
  completed_at: string
}

const REMIND_LATER_KEY = 'appointsync_remind_later_reviews'
const REMIND_LATER_TIMEOUT = 5 * 60 * 1000 // 5 minutos en milisegundos

interface RemindLaterEntry {
  appointmentId: string
  timestamp: number
}

export function usePendingReviews() {
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPendingReviews = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: session } = await supabase.auth.getSession()
      if (!session?.session?.user) {
        setLoading(false)
        return
      }

      // Get completed appointments without reviews
      const { data, error: fetchError } = await supabase
        .from('appointments')
        .select(
          `
          id,
          start_time,
          business_id,
          employee_id,
          service_id,
          updated_at,
          businesses!inner (
            id,
            name
          ),
          business_employees!inner (
            id,
            full_name
          ),
          services!inner (
            id,
            name
          )
        `
        )
        .eq('client_id', session.session.user.id)
        .eq('status', 'completed')
        .is('review_id', null)
        .order('start_time', { ascending: false })
        .limit(20)

      if (fetchError) throw fetchError

      // Filter out appointments in "remind later" list that haven't expired
      const remindLaterList = getRemindLaterList()
      const now = Date.now()
      const validRemindLater = remindLaterList.filter(
        entry => now - entry.timestamp < REMIND_LATER_TIMEOUT
      )

      const filtered = (data || [])
        .filter(apt => !validRemindLater.some(entry => entry.appointmentId === apt.id))
        .map(apt => ({
          appointment_id: apt.id,
          appointment_date: apt.start_time?.split(' ')[0],
          appointment_start_time: apt.start_time,
          business_id: apt.business_id,
          business_name: apt.businesses?.[0]?.name || 'Negocio',
          service_name: apt.services?.[0]?.name,
          employee_id: apt.employee_id || undefined,
          employee_name: apt.business_employees?.[0]?.full_name,
          completed_at: apt.updated_at,
        }))

      setPendingReviews(filtered)
    } catch (err: unknown) {
      const error = err as Error
      setError(error.message)
      toast.error('Error al cargar reseñas pendientes', {
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }, [])

  const remindLater = useCallback((appointmentId: string) => {
    try {
      const remindLaterList = getRemindLaterList()

      // Add or update entry
      const updated = remindLaterList.filter(entry => entry.appointmentId !== appointmentId)
      updated.push({
        appointmentId,
        timestamp: Date.now(),
      })

      localStorage.setItem(REMIND_LATER_KEY, JSON.stringify(updated))

      // Remove from current list
      setPendingReviews(prev => prev.filter(review => review.appointment_id !== appointmentId))

      toast.success('Recordatorio pospuesto', {
        description: 'Te recordaremos en 5 minutos',
      })
    } catch (err: unknown) {
      const error = err as Error
      toast.error('Error al posponer recordatorio', {
        description: error.message,
      })
    }
  }, [])

  const getRemindLaterList = (): RemindLaterEntry[] => {
    try {
      const stored = localStorage.getItem(REMIND_LATER_KEY)
      if (!stored) return []

      const list = JSON.parse(stored) as RemindLaterEntry[]
      const now = Date.now()

      // Clean expired entries
      const valid = list.filter(entry => now - entry.timestamp < REMIND_LATER_TIMEOUT)

      // Update localStorage with cleaned list
      if (valid.length !== list.length) {
        localStorage.setItem(REMIND_LATER_KEY, JSON.stringify(valid))
      }

      return valid
    } catch {
      return []
    }
  }

  const removeFromRemindLater = useCallback((appointmentId: string) => {
    try {
      const remindLaterList = getRemindLaterList()
      const updated = remindLaterList.filter(entry => entry.appointmentId !== appointmentId)

      localStorage.setItem(REMIND_LATER_KEY, JSON.stringify(updated))
    } catch (err: unknown) {
      const error = err as Error
      toast.error('Error al actualizar recordatorios', {
        description: error.message,
      })
    }
  }, [])

  const clearExpiredReminders = useCallback(() => {
    // This function is called automatically by getRemindLaterList
    // Just trigger a re-fetch to update the UI
    loadPendingReviews()
  }, [loadPendingReviews])

  useEffect(() => {
    loadPendingReviews()

    // Set up interval to check for expired reminders every minute
    const interval = setInterval(() => {
      clearExpiredReminders()
    }, 60 * 1000) // 1 minuto

    return () => clearInterval(interval)
  }, [loadPendingReviews, clearExpiredReminders])

  return {
    pendingReviews,
    loading,
    error,
    loadPendingReviews,
    remindLater,
    getRemindLaterList,
    removeFromRemindLater,
    clearExpiredReminders,
  }
}
