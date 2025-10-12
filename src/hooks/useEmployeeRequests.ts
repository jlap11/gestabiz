import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { EmployeeRequest, EmployeeRequestStatus, User } from '@/types/types'
import { toast } from 'sonner'

interface UseEmployeeRequestsOptions {
  businessId?: string // Para admin: filtrar por su negocio
  userId?: string // Para usuario: ver sus propias solicitudes
  autoFetch?: boolean
}

export function useEmployeeRequests(options: UseEmployeeRequestsOptions = {}) {
  const { businessId, userId, autoFetch = true } = options

  const [requests, setRequests] = useState<EmployeeRequest[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch requests based on filters
  const fetchRequests = useCallback(async () => {
    // Early return if conditions not met - no error shown
    if (!autoFetch || (!businessId && !userId)) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('employee_requests')
        .select(`
          *,
          business:businesses(
            id,
            name,
            logo_url,
            category,
            invitation_code
          ),
          user:profiles!employee_requests_user_id_fkey(
            id,
            name,
            email,
            avatar_url,
            phone
          ),
          responder:profiles!employee_requests_responded_by_fkey(
            id,
            name,
            email
          )
        `)
        .order('created_at', { ascending: false })

      // Filter by business (for admins)
      if (businessId) {
        query = query.eq('business_id', businessId)
      }

      // Filter by user (for users viewing their own requests)
      if (userId) {
        query = query.eq('user_id', userId)
      }

      // Ensure at least one filter is applied (safety check)
      if (!businessId && !userId) {
        console.warn('[useEmployeeRequests] No filters applied, skipping query')
        setRequests([])
        return
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setRequests((data as unknown as EmployeeRequest[]) || [])
    } catch (err) {
      console.error('Error fetching employee requests:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      toast.error('Error al cargar solicitudes')
    } finally {
      setIsLoading(false)
    }
  }, [businessId, userId, autoFetch])

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchRequests()
    }
  }, [fetchRequests, autoFetch])

  // Subscribe to realtime changes
  useEffect(() => {
    if (!autoFetch || (!businessId && !userId)) return

    const channel = supabase
      .channel('employee_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employee_requests',
          filter: businessId ? `business_id=eq.${businessId}` : userId ? `user_id=eq.${userId}` : undefined,
        },
        (payload) => {
          console.log('Employee request change:', payload)
          fetchRequests() // Refetch on any change
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [businessId, userId, autoFetch, fetchRequests])

  // Create a new employee request
  const createRequest = useCallback(
    async (invitationCode: string, message?: string): Promise<boolean> => {
      if (!userId) {
        toast.error('Debes iniciar sesión')
        return false
      }

      setIsLoading(true)
      setError(null)

      try {
        // 1. Validate invitation code and get business
        const { data: business, error: businessError } = await supabase
          .from('businesses')
          .select('id, name')
          .eq('invitation_code', invitationCode.toUpperCase())
          .single()

        if (businessError || !business) {
          toast.error('Código de invitación inválido')
          return false
        }

        // 2. Check if user is already an employee
        const { data: existingEmployee } = await supabase
          .from('business_employees')
          .select('id')
          .eq('business_id', business.id)
          .eq('employee_id', userId)
          .single()

        if (existingEmployee) {
          toast.error('Ya eres empleado de este negocio')
          return false
        }

        // 3. Check if request already exists
        const { data: existingRequest } = await supabase
          .from('employee_requests')
          .select('id, status')
          .eq('business_id', business.id)
          .eq('user_id', userId)
          .eq('status', 'pending')
          .single()

        if (existingRequest) {
          toast.info('Ya tienes una solicitud pendiente para este negocio')
          return false
        }

        // 4. Create the request
        const { error: insertError } = await supabase
          .from('employee_requests')
          .insert({
            business_id: business.id,
            user_id: userId,
            invitation_code: invitationCode.toUpperCase(),
            message: message || null,
          })

        if (insertError) throw insertError

        toast.success(`Solicitud enviada a ${business.name}`)
        await fetchRequests()
        return true
      } catch (err) {
        console.error('Error creating employee request:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
        toast.error('Error al enviar solicitud')
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [userId, fetchRequests]
  )

  // Approve an employee request (admin only)
  const approveRequest = useCallback(
    async (requestId: string, adminId: string): Promise<boolean> => {
      setIsLoading(true)
      setError(null)

      try {
        const { data, error: rpcError } = await supabase.rpc('approve_employee_request', {
          request_id: requestId,
          admin_id: adminId,
        })

        if (rpcError) throw rpcError

        const result = data as { success: boolean; error?: string; message?: string }

        if (!result.success) {
          toast.error(result.error || 'Error al aprobar solicitud')
          return false
        }

        toast.success('Solicitud aprobada exitosamente')
        await fetchRequests()
        return true
      } catch (err) {
        console.error('Error approving request:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
        toast.error('Error al aprobar solicitud')
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [fetchRequests]
  )

  // Reject an employee request (admin only)
  const rejectRequest = useCallback(
    async (requestId: string, adminId: string): Promise<boolean> => {
      setIsLoading(true)
      setError(null)

      try {
        const { data, error: rpcError } = await supabase.rpc('reject_employee_request', {
          request_id: requestId,
          admin_id: adminId,
        })

        if (rpcError) throw rpcError

        const result = data as { success: boolean; error?: string; message?: string }

        if (!result.success) {
          toast.error(result.error || 'Error al rechazar solicitud')
          return false
        }

        toast.success('Solicitud rechazada')
        await fetchRequests()
        return true
      } catch (err) {
        console.error('Error rejecting request:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
        toast.error('Error al rechazar solicitud')
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [fetchRequests]
  )

  // Get pending requests count
  const pendingCount = requests.filter((r) => r.status === 'pending').length

  return {
    requests,
    isLoading,
    error,
    fetchRequests,
    createRequest,
    approveRequest,
    rejectRequest,
    pendingCount,
  }
}
