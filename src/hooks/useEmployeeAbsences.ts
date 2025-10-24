import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import QUERY_CONFIG from '@/lib/queryConfig'
import { useCallback } from 'react'

export interface AbsenceRequest {
  absenceType: 'vacation' | 'emergency' | 'sick_leave' | 'personal' | 'other'
  startDate: string
  endDate: string
  reason: string
  employeeNotes?: string
}

export interface EmployeeAbsence {
  id: string
  businessId: string
  absenceType: 'vacation' | 'emergency' | 'sick_leave' | 'personal' | 'other'
  startDate: string
  endDate: string
  reason: string
  employeeNotes?: string
  adminNotes?: string
  status: 'pending' | 'approved' | 'rejected'
  approvedBy?: string
  approvedAt?: string
  createdAt: string
}

export interface VacationBalance {
  year: number
  totalDaysAvailable: number
  daysUsed: number
  daysPending: number
  daysRemaining: number
}

export function useEmployeeAbsences(businessId: string) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const {
    data: absences = [],
    isLoading: loading,
    error: absencesError,
    refetch: refetchAbsences,
  } = useQuery({
    queryKey: QUERY_CONFIG.KEYS.EMPLOYEE_ABSENCES(user?.id || '', businessId),
    queryFn: async () => {
      if (!user || !businessId) return []

      const { data, error } = await supabase
        .from('employee_absences')
        .select('*')
        .eq('business_id', businessId)
        .eq('employee_id', user.id)
        .order('start_date', { ascending: false })

      if (error) throw error

      return (data || []).map(absence => ({
        id: absence.id,
        businessId: absence.business_id,
        absenceType: absence.absence_type,
        startDate: absence.start_date,
        endDate: absence.end_date,
        reason: absence.reason,
        employeeNotes: absence.employee_notes,
        adminNotes: absence.admin_notes,
        status: absence.status,
        approvedBy: absence.approved_by,
        approvedAt: absence.approved_at,
        createdAt: absence.created_at,
      })) as EmployeeAbsence[]
    },
    ...QUERY_CONFIG.FREQUENT,
    enabled: !!user?.id && !!businessId,
  })

  const { data: vacationBalance = null, isLoading: loadingBalance } = useQuery({
    queryKey: QUERY_CONFIG.KEYS.VACATION_BALANCE(
      user?.id || '',
      businessId,
      new Date().getFullYear()
    ),
    queryFn: async () => {
      if (!user || !businessId) return null

      const { data, error } = await supabase
        .from('vacation_balance')
        .select('*')
        .eq('business_id', businessId)
        .eq('employee_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (!data) return null

      return {
        year: data.year,
        totalDaysAvailable: data.total_vacation_days,
        daysUsed: data.days_used,
        daysPending: data.days_pending,
        daysRemaining: data.days_remaining,
      } as VacationBalance
    },
    ...QUERY_CONFIG.FREQUENT,
    enabled: !!user?.id && !!businessId,
  })

  const requestAbsenceMutation = useMutation({
    mutationFn: async (params: AbsenceRequest) => {
      if (!user || !businessId) {
        throw new Error('No se pudo identificar al usuario o negocio')
      }

      const start = new Date(params.startDate)
      const end = new Date(params.endDate)

      if (end < start) {
        throw new Error('La fecha de fin debe ser posterior a la fecha de inicio')
      }

      const { error } = await supabase.from('employee_absences').insert({
        employee_id: user.id,
        business_id: businessId,
        absence_type: params.absenceType,
        start_date: params.startDate,
        end_date: params.endDate,
        reason: params.reason,
        employee_notes: params.employeeNotes,
        status: 'pending',
      })

      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Solicitud de ausencia enviada exitosamente')
      queryClient.invalidateQueries({
        queryKey: QUERY_CONFIG.KEYS.EMPLOYEE_ABSENCES(user?.id || '', businessId),
      })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'No se pudo crear la solicitud')
    },
  })

  const cancelAbsenceMutation = useMutation({
    mutationFn: async (absenceId: string) => {
      if (!user) {
        throw new Error('Usuario no autenticado')
      }

      const { error } = await supabase
        .from('employee_absences')
        .update({ status: 'cancelled' })
        .eq('id', absenceId)
        .eq('employee_id', user.id)
        .eq('status', 'pending')

      if (error) throw error
    },
    onSuccess: () => {
      toast.success('La solicitud ha sido cancelada exitosamente')
      queryClient.invalidateQueries({
        queryKey: QUERY_CONFIG.KEYS.EMPLOYEE_ABSENCES(user?.id || '', businessId),
      })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'No se pudo cancelar la solicitud')
    },
  })

  const validateWorkDays = useCallback(
    async (
      startDate: string,
      endDate: string
    ): Promise<{ isValid: boolean; invalidDays: string[] }> => {
      if (!user || !businessId) return { isValid: true, invalidDays: [] }

      try {
        const invalidDays: string[] = []
        const start = new Date(startDate)
        const end = new Date(endDate)
        const current = new Date(start)

        while (current <= end) {
          const dayOfWeek = current.getDay()
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            invalidDays.push(format(current, 'yyyy-MM-dd'))
          }
          current.setDate(current.getDate() + 1)
        }

        return {
          isValid: invalidDays.length === 0,
          invalidDays,
        }
      } catch {
        return { isValid: true, invalidDays: [] }
      }
    },
    [user, businessId]
  )

  return {
    absences,
    vacationBalance,
    loading:
      loading ||
      loadingBalance ||
      requestAbsenceMutation.isPending ||
      cancelAbsenceMutation.isPending,
    error: absencesError?.message || null,
    requestAbsence: async (params: AbsenceRequest) => {
      await requestAbsenceMutation.mutateAsync(params)
    },
    cancelAbsence: async (absenceId: string) => {
      await cancelAbsenceMutation.mutateAsync(absenceId)
    },
    validateWorkDays,
    refresh: async () => {
      await refetchAbsences()
    },
  }
}
