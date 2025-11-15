import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import QUERY_CONFIG from '@/lib/queryConfig'
import { useEffect, useRef, useCallback, useState } from 'react'
import type { 
  InAppNotification, 
  NotificationStatus,
  InAppNotificationType 
} from '@/types/types'

interface UseInAppNotificationsOptions {
  userId: string
  autoFetch?: boolean
  limit?: number
  status?: NotificationStatus
  type?: InAppNotificationType
  businessId?: string
  excludeChatMessages?: boolean
  suppressToasts?: boolean
}

interface UseInAppNotificationsReturn {
  notifications: InAppNotification[]
  unreadCount: number
  loading: boolean
  error: string | null
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  archive: (notificationId: string) => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  refetch: () => Promise<void>
}

export function useInAppNotifications(
  options: UseInAppNotificationsOptions
): UseInAppNotificationsReturn {
  const { 
    userId, 
    autoFetch = true, 
    limit = 50,
    status,
    type,
    businessId,
    excludeChatMessages = false,
  } = options

  const queryClient = useQueryClient()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  // ✅ Una única query cacheada para todas las notificaciones del usuario
  const { 
    data: baseNotifications = [], 
    isLoading: loading, 
    error,
    refetch: refetchQuery 
  } = useQuery({
    queryKey: QUERY_CONFIG.KEYS.IN_APP_NOTIFICATIONS(userId),
    queryFn: async () => {
      if (!userId) return []

      const query = supabase
        .from('in_app_notifications')
        .select('*')
        .eq('user_id', userId)
        .neq('status', 'archived')
        .order('created_at', { ascending: false })
        .limit(limit)

      const { data, error: fetchError } = await query
      if (fetchError) throw fetchError
      return (data || []) as InAppNotification[]
    },
    ...QUERY_CONFIG.FREQUENT,
    enabled: !!userId && autoFetch,
  })

  // ✅ Aplicar filtros localmente (evita múltiples queries)
  const notifications = useCallback(() => {
    let filtered = [...baseNotifications]

    if (status) {
      filtered = filtered.filter(n => n.status === status)
    }

    if (type) {
      filtered = filtered.filter(n => n.type === type)
    }

    if (excludeChatMessages) {
      filtered = filtered.filter(n => n.type !== 'chat_message')
    }

    if (businessId) {
      filtered = filtered.filter(n => n.business_id === businessId)
    }

    return filtered
  }, [baseNotifications, status, type, excludeChatMessages, businessId])()

  // ✅ Calcular unread localmente
  useEffect(() => {
    const unread = notifications.filter(n => n.status === 'unread').length
    setUnreadCount(unread)
  }, [notifications])

  // ✅ Realtime subscription
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'in_app_notifications',
          filter: `user_id=eq.${userId}`
        },
        () => {
          // Invalidar Y refetch para que el badge se actualice inmediatamente
          queryClient.invalidateQueries({
            queryKey: QUERY_CONFIG.KEYS.IN_APP_NOTIFICATIONS(userId)
          })
          refetchQuery() // ⭐ Forzar refetch para actualizar unreadCount
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [userId, queryClient, refetchQuery])

  // ✅ Acciones
  const markAsRead = useCallback(async (notificationId: string) => {
    const { error } = await supabase
      .from('in_app_notifications')
      .update({ status: 'read', read_at: new Date().toISOString() })
      .eq('id', notificationId)

    if (error) {
      toast.error('Error al marcar como leído')
      throw error
    }

    queryClient.invalidateQueries({
      queryKey: QUERY_CONFIG.KEYS.IN_APP_NOTIFICATIONS(userId)
    })
  }, [userId, queryClient])

  const markAllAsRead = useCallback(async () => {
    const { error } = await supabase
      .from('in_app_notifications')
      .update({ status: 'read', read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .neq('status', 'read')

    if (error) {
      toast.error('Error al marcar todas como leídas')
      throw error
    }

    queryClient.invalidateQueries({
      queryKey: QUERY_CONFIG.KEYS.IN_APP_NOTIFICATIONS(userId)
    })
  }, [userId, queryClient])

  const archive = useCallback(async (notificationId: string) => {
    const { error } = await supabase
      .from('in_app_notifications')
      .update({ status: 'archived' })
      .eq('id', notificationId)

    if (error) {
      toast.error('Error al archivar')
      throw error
    }

    queryClient.invalidateQueries({
      queryKey: QUERY_CONFIG.KEYS.IN_APP_NOTIFICATIONS(userId)
    })
  }, [userId, queryClient])

  const deleteNotification = useCallback(async (notificationId: string) => {
    const { error } = await supabase
      .from('in_app_notifications')
      .delete()
      .eq('id', notificationId)

    if (error) {
      toast.error('Error al eliminar')
      throw error
    }

    queryClient.invalidateQueries({
      queryKey: QUERY_CONFIG.KEYS.IN_APP_NOTIFICATIONS(userId)
    })
  }, [userId, queryClient])

  const refetch = useCallback(async () => {
    await refetchQuery()
  }, [refetchQuery])

  return {
    notifications,
    unreadCount,
    loading,
    error: error?.message || null,
    markAsRead,
    markAllAsRead,
    archive,
    deleteNotification,
    refetch
  }
}
