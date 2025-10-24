/**
 * Hook: useAbsenceApprovals
 *
 * Gestiona aprobaciones de ausencias desde la perspectiva del administrador.
 *
 * Features:
 * - Ver solicitudes pendientes
 * - Aprobar/rechazar solicitudes
 * - Ver historial de todas las ausencias
 * - Ver citas afectadas antes de aprobar
 * - Estadísticas de ausencias
 *
 * @example
 * const { pendingAbsences, approveAbsence, rejectAbsence } = useAbsenceApprovals(businessId);
 * await approveAbsence(absenceId, 'Aprobado, buen descanso');
 */

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export interface AbsenceApproval {
  id: string
  employeeId: string
  employeeName: string
  employeeEmail: string
  absenceType: 'vacation' | 'emergency' | 'sick_leave' | 'personal' | 'other'
  startDate: string
  endDate: string
  daysRequested: number
  reason: string
  employeeNotes?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  affectedAppointmentsCount?: number
}

export interface AbsenceStats {
  totalAbsences: number
  pendingCount: number
  approvedCount: number
  rejectedCount: number
  vacationDaysUsed: number
  emergencyAbsences: number
}

export function useAbsenceApprovals(businessId: string) {
  const { user } = useAuth()

  const [absences, setAbsences] = useState<AbsenceApproval[]>([])
  const [stats, setStats] = useState<AbsenceStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Fetch todas las ausencias del negocio
  const fetchAbsences = useCallback(async () => {
    if (!user || !businessId) return

    try {
      setLoading(true)

      // Obtener ausencias con datos del empleado
      const { data, error } = await supabase
        .from('employee_absences')
        .select(
          `
          *,
          employee:employee_id(full_name, email)
        `
        )
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Calcular días solicitados para cada ausencia
      const absencesWithDays = await Promise.all(
        data.map(async absence => {
          const start = new Date(absence.start_date)
          const end = new Date(absence.end_date)
          const daysRequested =
            Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

          // Contar citas afectadas si está pendiente
          let affectedAppointmentsCount = 0
          if (absence.status === 'pending') {
            const { count } = await supabase
              .from('appointments')
              .select('id', { count: 'exact', head: true })
              .eq('employee_id', absence.employee_id)
              .eq('business_id', businessId)
              .gte('start_time', absence.start_date)
              .lte('start_time', absence.end_date)
              .neq('status', 'cancelled')

            affectedAppointmentsCount = count || 0
          }

          return {
            id: absence.id,
            employeeId: absence.employee_id,
            employeeName: absence.employee.full_name,
            employeeEmail: absence.employee.email,
            absenceType: absence.absence_type,
            startDate: absence.start_date,
            endDate: absence.end_date,
            daysRequested,
            reason: absence.reason,
            employeeNotes: absence.employee_notes,
            status: absence.status,
            createdAt: absence.created_at,
            affectedAppointmentsCount,
          }
        })
      )

      setAbsences(absencesWithDays)

      // Calcular estadísticas
      const statsData: AbsenceStats = {
        totalAbsences: data.length,
        pendingCount: data.filter(a => a.status === 'pending').length,
        approvedCount: data.filter(a => a.status === 'approved').length,
        rejectedCount: data.filter(a => a.status === 'rejected').length,
        vacationDaysUsed: data
          .filter(a => a.absence_type === 'vacation' && a.status === 'approved')
          .reduce((sum, a) => {
            const days =
              Math.floor(
                (new Date(a.end_date).getTime() - new Date(a.start_date).getTime()) /
                  (1000 * 60 * 60 * 24)
              ) + 1
            return sum + days
          }, 0),
        emergencyAbsences: data.filter(a => a.absence_type === 'emergency').length,
      }

      setStats(statsData)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      toast.error(`No se pudieron cargar las ausencias: ${message}`)
    } finally {
      setLoading(false)
    }
  }, [user, businessId])

  // Aprobar ausencia
  const approveAbsence = async (absenceId: string, adminNotes?: string): Promise<boolean> => {
    if (!user || !businessId) return false

    try {
      setLoading(true)

      const { data, error } = await supabase.functions.invoke('approve-reject-absence', {
        body: {
          absenceId,
          action: 'approve',
          adminNotes,
        },
      })

      if (error) throw error

      if (!data.success) {
        throw new Error(data.error)
      }

      toast.success(data.message || `${data.absence.cancelledAppointments} citas canceladas`)

      setRefreshKey(prev => prev + 1)
      return true
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      toast.error(message)
      return false
    } finally {
      setLoading(false)
    }
  }

  // Rechazar ausencia
  const rejectAbsence = async (absenceId: string, adminNotes?: string): Promise<boolean> => {
    if (!user || !businessId) return false

    try {
      setLoading(true)

      const { data, error } = await supabase.functions.invoke('approve-reject-absence', {
        body: {
          absenceId,
          action: 'reject',
          adminNotes,
        },
      })

      if (error) throw error

      if (!data.success) {
        throw new Error(data.error)
      }

      toast.success(data.message || 'La solicitud ha sido rechazada')

      setRefreshKey(prev => prev + 1)
      return true
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      toast.error(message)
      return false
    } finally {
      setLoading(false)
    }
  }

  // Ver citas afectadas (útil para mostrar antes de aprobar)
  const getAffectedAppointments = async (absenceId: string) => {
    if (!businessId) return []

    try {
      const absence = absences.find(a => a.id === absenceId)
      if (!absence) return []

      const { data, error } = await supabase
        .from('appointments')
        .select(
          `
          id,
          start_time,
          end_time,
          service:service_id(service_name),
          client:client_id(full_name, email)
        `
        )
        .eq('employee_id', absence.employeeId)
        .eq('business_id', businessId)
        .gte('start_time', absence.startDate)
        .lte('start_time', absence.endDate)
        .neq('status', 'cancelled')

      if (error) throw error
      return data || []
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      toast.error(`No se pudieron cargar las citas: ${message}`)
      return []
    }
  }

  // Cargar datos
  useEffect(() => {
    fetchAbsences()
  }, [fetchAbsences, refreshKey])

  return {
    absences,
    pendingAbsences: absences.filter(a => a.status === 'pending'),
    approvedAbsences: absences.filter(a => a.status === 'approved'),
    rejectedAbsences: absences.filter(a => a.status === 'rejected'),
    stats,
    loading,
    approveAbsence,
    rejectAbsence,
    getAffectedAppointments,
    refresh: () => setRefreshKey(prev => prev + 1),
  }
}
