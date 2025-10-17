import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { trackNotificationEvent, NotificationEvents } from '@/lib/analytics'
import { playNotificationFeedback } from '@/lib/notificationSound'
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
  excludeChatMessages?: boolean // Excluir notificaciones de chat (para campana)
  suppressToasts?: boolean // Evitar toast global cuando otra capa ya lo maneja
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
    businessId,
    excludeChatMessages = false,
    suppressToasts = false 
  } = options

  const [notifications, setNotifications] = useState<InAppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Ref para mantener el estado actualizado en callbacks de realtime
  const notificationsRef = useRef<InAppNotification[]>([])
  const instanceIdRef = useRef<string>(`inst_${Math.random().toString(36).slice(2, 10)}`)
  
  useEffect(() => {
    notificationsRef.current = notifications
  }, [notifications])

  // Fetch notificaciones
  const fetchNotifications = useCallback(async () => {
    if (!userId) return

    console.log('[useInAppNotifications] 🔍 Fetching notifications for user:', userId)
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

      // Excluir mensajes de chat si se especifica (para campana de notificaciones)
      if (excludeChatMessages) {
        query = query.neq('type', 'chat_message')  // ✅ FIX: Tipo correcto del enum
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      console.log('[useInAppNotifications] ✅ Fetched', data?.length || 0, 'notifications')
      setNotifications(data || [])

      // Contar no leídas
      if (excludeChatMessages) {
        // Usar función RPC que excluye chat_message
        const { data: countData, error: countError } = await supabase
          .rpc('get_unread_count_no_chat', { p_user_id: userId })

        if (countError) {
          console.warn('[useInAppNotifications] ⚠️ Error fetching unread count (no chat):', countError)
          setUnreadCount(0)
        } else {
          console.log('[useInAppNotifications] 📊 Unread count (no chat):', countData)
          setUnreadCount(countData || 0)
        }
      } else if (type) {
        // Si se especifica un tipo, contar solo notificaciones de ese tipo
        const { count, error: countError } = await supabase
          .from('in_app_notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('type', type)
          .eq('status', 'unread')
          .neq('status', 'archived')

        if (countError) {
          console.warn('[useInAppNotifications] ⚠️ Error fetching unread count by type:', countError)
          setUnreadCount(0)
        } else {
          console.log(`[useInAppNotifications] 📊 Unread count (type: ${type}):`, count)
          setUnreadCount(count || 0)
        }
      } else {
        // Función estándar que incluye todo
        const { data: countData, error: countError } = await supabase
          .rpc('get_unread_count', { p_user_id: userId })

        if (countError) {
          console.warn('[useInAppNotifications] ⚠️ Error fetching unread count:', countError)
          setUnreadCount(0)
        } else {
          console.log('[useInAppNotifications] 📊 Unread count:', countData)
          setUnreadCount(countData || 0)
        }
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar notificaciones'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [userId, limit, status, type, businessId, excludeChatMessages])

  // Marcar como leída
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { data, error: updateError } = await supabase
        .from('in_app_notifications')
        .update({ 
          status: 'read', 
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .select()

      if (updateError) {
        console.error('[markAsRead] Error details:', {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code
        })
        throw updateError
      }

      if (!data || data.length === 0) {
        console.warn('[markAsRead] No rows updated for notification:', notificationId)
      }

      // Actualizar estado local
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, status: 'read' as NotificationStatus, read_at: new Date().toISOString() }
            : n
        )
      )

      setUnreadCount(prev => Math.max(0, prev - 1))
      
      // Disparar evento global para sincronizar otros componentes (ej: NotificationBell)
      globalThis.dispatchEvent(new CustomEvent('notification-marked-read'))
      
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
  }, []) // Removido userId de dependencias

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
      
      // Disparar evento global para sincronizar otros componentes
      globalThis.dispatchEvent(new CustomEvent('notification-marked-read'))
      
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
        // Removido .eq('user_id', userId) - solo ID es suficiente

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
  }, [notifications]) // Removido userId de dependencias

  // Eliminar notificación (hard delete - ya que no existe is_deleted)
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('in_app_notifications')
        .delete()
        .eq('id', notificationId)
        // Removido .eq('user_id', userId) - solo ID es suficiente

      if (deleteError) throw deleteError

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
  }, [notifications]) // Removido userId de dependencias

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
      // 🔥 FIX: Aplicar filtros antes de procesar
      // Si hay filtro de tipo y no coincide, ignorar
      if (type && notification.type !== type) {
        console.log('[useInAppNotifications] ⏭️ Skipping notification (type mismatch):', notification.type, 'vs', type)
        return
      }
      
      // Si debe excluir chat y es chat, ignorar
      if (excludeChatMessages && notification.type === 'chat_message') {
        console.log('[useInAppNotifications] ⏭️ Skipping chat notification (excludeChatMessages=true)')
        return
      }
      
      // Si hay filtro de businessId y no coincide, ignorar
      if (businessId && notification.business_id !== businessId) {
        console.log('[useInAppNotifications] ⏭️ Skipping notification (businessId mismatch)')
        return
      }
      
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

          if (!suppressToasts) {
            // Reproducir sonido y vibración
            // ✨ Mensajes de chat y notificaciones normales usan tono 'message'
            // Notificaciones de alta prioridad usan tono 'alert'
            const soundType = notification.priority === 2 ? 'alert' : 'message'
            playNotificationFeedback(soundType)

            // Toast con acción
            toast.info(notification.title, {
              description: notification.message,
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
      console.log('[useInAppNotifications] 📡 Realtime event:', payload.eventType)
      
      if (payload.eventType === 'INSERT') {
        const newNotification = payload.new as InAppNotification
        console.log('[useInAppNotifications] ➕ New notification:', newNotification.title)
        upsertNotification(newNotification)
      } else if (payload.eventType === 'UPDATE') {
        const updatedNotification = payload.new as InAppNotification
        console.log('[useInAppNotifications] 🔄 Updated notification:', updatedNotification.title)
        upsertNotification(updatedNotification)
      } else if (payload.eventType === 'DELETE') {
        const deletedNotification = payload.old as InAppNotification
        console.log('[useInAppNotifications] ❌ Deleted notification')
        removeNotification(deletedNotification)
      }
    }

    // ✅ Fix: crear identificador estable por instancia para evitar colisiones entre consumidores
    const variantParts = [
      excludeChatMessages ? 'nochat' : 'all',
      type || 'all',
      businessId || 'none',
      limit,
      instanceIdRef.current
    ]
    const channelName = `in_app_notifications_${userId}:${variantParts.join(':')}`

    console.log('[useInAppNotifications] 📡 Subscribing to channel (with reconnection):', channelName)

    const channelRef = { current: null as any }
    let attempts = 0

    const subscribe = () => {
      if (channelRef.current) {
        try {
          // If there's an existing channel, remove it first
          supabase.removeChannel(channelRef.current)
        } catch (e) {
          console.warn('[useInAppNotifications] ⚠️ Error removing existing channel before subscribe', e)
        }
      }

      attempts += 1

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
        .subscribe((status) => {
          console.log('[useInAppNotifications] 📡 Channel status:', status)

          // If channel reports error or closed, retry with backoff up to 3 times
          if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
            console.warn('[useInAppNotifications] ⚠️ Channel status', status, 'attempts', attempts)
            if (attempts < 4) {
              const backoff = 500 * attempts // 500ms, 1000ms, 1500ms
              setTimeout(() => subscribe(), backoff)
            } else {
              console.error('[useInAppNotifications] ❌ Channel failed after retries')
            }
          }
        })

      channelRef.current = channel
    }

    // Inicial subscribe
    subscribe()

    // Cleanup
    return () => {
      try {
        if (channelRef.current) supabase.removeChannel(channelRef.current)
      } catch (e) {
        console.warn('[useInAppNotifications] ⚠️ Error during cleanup removeChannel', e)
      }
    }
  }, [userId, limit, type, businessId, excludeChatMessages, suppressToasts]) // ✅ Incluir filtros para recrear suscripción cuando cambien

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
