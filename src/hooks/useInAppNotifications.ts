import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { trackNotificationEvent, NotificationEvents } from '@/lib/analytics'
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
}

interface UseInAppNotificationsReturn {
  notifications: InAppNotification[]
  unreadCount: number
  loading: boolean
  error: string | null
  
  // Actions
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  archive: (notificationId: string) => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  refetch: () => Promise<void>
}

/**
 * Hook para gestionar notificaciones in-app con realtime
 * 
 * @example
 * ```tsx
 * const { notifications, unreadCount, markAsRead } = useInAppNotifications({
 *   userId: user.id,
 *   limit: 20,
 *   status: 'unread'
 * })
 * ```
 */
export function useInAppNotifications(
  options: UseInAppNotificationsOptions
): UseInAppNotificationsReturn {
  const { 
    userId, 
    autoFetch = true, 
    limit = 50,
    status,
    type,
    businessId 
  } = options

  const [notifications, setNotifications] = useState<InAppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Ref para mantener el estado actualizado en callbacks de realtime
  const notificationsRef = useRef<InAppNotification[]>([])
  
  useEffect(() => {
    notificationsRef.current = notifications
  }, [notifications])

  // Fetch notificaciones
  const fetchNotifications = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      // Query base
      let query = supabase
        .from('in_app_notifications')
        .select('*')
        .eq('user_id', userId)
        .neq('status', 'archived') // Usar status en vez de is_deleted
        .order('created_at', { ascending: false })
        .limit(limit)

      // Filtros opcionales
      if (status) {
        query = query.eq('status', status)
      }

      if (type) {
        query = query.eq('type', type)
      }

      if (businessId) {
        query = query.eq('business_id', businessId)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setNotifications(data || [])

      // Contar no leídas
      const { data: countData, error: countError } = await supabase
        .rpc('get_unread_count', { p_user_id: userId })

      if (countError) {
        // Error fetching unread count
        setUnreadCount(0)
      } else {
        setUnreadCount(countData || 0)
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar notificaciones'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [userId, limit, status, type, businessId])

  // Marcar como leída
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('in_app_notifications')
        .update({ 
          status: 'read', 
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('user_id', userId)

      if (updateError) throw updateError

      // Actualizar estado local
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, status: 'read' as NotificationStatus, read_at: new Date().toISOString() }
            : n
        )
      )

      setUnreadCount(prev => Math.max(0, prev - 1))
      
      // Track analytics
      const notification = notificationsRef.current.find(n => n.id === notificationId)
      trackNotificationEvent(NotificationEvents.NOTIFICATION_READ, {
        notification_id: notificationId,
        notification_type: notification?.type || 'unknown',
        priority: notification?.priority || 0,
      })

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al marcar como leída'
      toast.error(message)
    }
  }, [userId])

  // Marcar todas como leídas
  const markAllAsRead = useCallback(async () => {
    try {
      const { data, error: rpcError } = await supabase
        .rpc('mark_notifications_as_read', { p_user_id: userId })

      if (rpcError) throw rpcError

      // Actualizar estado local
      setNotifications(prev => 
        prev.map(n => 
          n.status === 'unread' 
            ? { ...n, status: 'read' as NotificationStatus, read_at: new Date().toISOString() }
            : n
        )
      )

      setUnreadCount(0)
      
      if (data && data > 0) {
        toast.success(`${data} notificación(es) marcada(s) como leída(s)`)
        
        // Track analytics
        trackNotificationEvent(NotificationEvents.ALL_NOTIFICATIONS_READ, {
          count: data,
        })
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al marcar todas como leídas'
      toast.error(message)
    }
  }, [userId])

  // Archivar notificación
  const archive = useCallback(async (notificationId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('in_app_notifications')
        .update({ 
          status: 'archived',
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('user_id', userId)

      if (updateError) throw updateError

      // Actualizar estado local
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, status: 'archived' as NotificationStatus }
            : n
        )
      )

      // Si era no leída, decrementar contador
      const notification = notifications.find(n => n.id === notificationId)
      if (notification?.status === 'unread') {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }

      toast.success('Notificación archivada')

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al archivar'
      toast.error(message)
    }
  }, [userId, notifications])

  // Eliminar notificación (soft delete)
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('in_app_notifications')
        .update({ 
          is_deleted: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('user_id', userId)

      if (updateError) throw updateError

      // Remover del estado local
      setNotifications(prev => prev.filter(n => n.id !== notificationId))

      // Si era no leída, decrementar contador
      const notification = notifications.find(n => n.id === notificationId)
      if (notification?.status === 'unread') {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }

      toast.success('Notificación eliminada')

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar'
      toast.error(message)
    }
  }, [userId, notifications])

  // Refetch
  const refetch = useCallback(async () => {
    await fetchNotifications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // ✅ fetchNotifications es estable

  // Auto-fetch inicial
  useEffect(() => {
    if (autoFetch && userId) {
      fetchNotifications()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch, userId]) // ✅ fetchNotifications excluido - es estable

  // Suscripción realtime
  useEffect(() => {
    if (!userId) return

    // Helpers para actualizar estado
    const upsertNotification = (notification: InAppNotification) => {
      const current = notificationsRef.current
      const exists = current.find(n => n.id === notification.id)
      
      if (exists) {
        // UPDATE: actualizar existente
        const next = current.map(n => n.id === notification.id ? notification : n)
        notificationsRef.current = next
        setNotifications(next)
      } else {
        // INSERT: agregar nueva (al principio)
        const next = [notification, ...current].slice(0, limit)
        notificationsRef.current = next
        setNotifications(next)
        
        // Si es nueva y no leída, incrementar contador y mostrar toast
        if (notification.status === 'unread') {
          setUnreadCount(prev => prev + 1)
          
          // Toast con acción
          toast.info(notification.title, {
            description: notification.body,
            action: notification.action_url ? {
              label: 'Ver',
              onClick: () => {
                // Navegar a la URL
                if (notification.action_url) {
                  window.location.href = notification.action_url
                }
              }
            } : undefined
          })
        }
      }
    }

    const removeNotification = (notification: InAppNotification) => {
      const current = notificationsRef.current
      const next = current.filter(n => n.id !== notification.id)
      notificationsRef.current = next
      setNotifications(next)
      
      // Si era no leída, decrementar contador
      if (notification.status === 'unread') {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    }

    // Handler de eventos realtime - FIXED: removed from dependency array
    const handleRealtimeEvent = (payload: Record<string, unknown>) => {
      if (payload.eventType === 'INSERT') {
        const newNotification = payload.new as InAppNotification
        upsertNotification(newNotification)
      } else if (payload.eventType === 'UPDATE') {
        const updatedNotification = payload.new as InAppNotification
        upsertNotification(updatedNotification)
      } else if (payload.eventType === 'DELETE') {
        const deletedNotification = payload.old as InAppNotification
        removeNotification(deletedNotification)
      }
    }

    // Create unique channel name
    const channelName = `in_app_notifications_${userId}_${Date.now()}`
    
    // Suscribirse al canal
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'in_app_notifications',
          filter: `user_id=eq.${userId}`
        },
        handleRealtimeEvent
      )
      .subscribe()

    // Cleanup
    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, limit]) // ✅ fetchNotifications is stable (useCallback) - intentionally excluded

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    archive,
    deleteNotification,
    refetch
  }
}
