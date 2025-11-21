/* eslint-disable no-console */
/**
 * NotificationContext - Sistema global de notificaciones
 * 
 * Este contexto mantiene una suscripción realtime SIEMPRE ACTIVA
 * para recibir notificaciones incluso cuando el chat/componentes están cerrados.
 * 
 * @author Gestabiz Team
 * @date 2025-10-17
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { playNotificationFeedback, playActiveChatMessageSound } from '@/lib/notificationSound'
import type { InAppNotification } from '@/types/types'

interface NotificationContextValue {
  /** Conversación actual abierta (para suprimir notificaciones redundantes) */
  activeConversationId: string | null
  /** Marcar conversación como activa (chat abierto) */
  setActiveConversation: (conversationId: string | null) => void
  /** Chat completamente abierto (no solo el botón flotante) */
  isChatOpen: boolean
  /** Marcar chat como abierto/cerrado */
  setChatOpen: (isOpen: boolean) => void
}

const noop = () => {}
const defaultContextValue: NotificationContextValue = {
  activeConversationId: null,
  setActiveConversation: noop,
  isChatOpen: false,
  setChatOpen: noop
}

const NotificationContext = createContext<NotificationContextValue>(defaultContextValue)

export function useNotificationContext() {
  return useContext(NotificationContext)
}

interface NotificationProviderProps {
  children: React.ReactNode
  userId: string | null
}

export const NotificationProvider = React.memo<NotificationProviderProps>(function NotificationProvider({ children, userId }) {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [isChatOpen, setChatOpen] = useState(false)
  
  // Debug: Log cuando el provider se monta (solo en dev)
  const mountedRef = useRef(false)
  useEffect(() => {
    if (!mountedRef.current && import.meta.env.DEV) {
      console.log('[NotificationProvider] Mounted with userId:', userId)
      mountedRef.current = true
    }
  }, [userId]) // Incluir userId para actualizar en cambio de usuario
  
  // Ref para acceder al estado actual en callbacks
  const stateRef = useRef({ activeConversationId, isChatOpen })
  useEffect(() => {
    stateRef.current = { activeConversationId, isChatOpen }
  }, [activeConversationId, isChatOpen])

  // ⭐ FIX BUG-020: Guard para prevenir suscripciones duplicadas
  const hasSubscribedRef = useRef(false)
  const lastUserIdRef = useRef<string | null>(null)

  // Suscripción realtime GLOBAL (siempre activa)
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🔥🔥🔥 [NotificationContext] useEffect EJECUTÁNDOSE. UserId:', userId, 'Type:', typeof userId)
    }
    
    if (!userId) {
      if (import.meta.env.DEV) console.log('[NotificationContext] ⚠️ No userId, skipping subscription')
      hasSubscribedRef.current = false
      lastUserIdRef.current = null
      return
    }

    // ⭐ Guard: Solo suscribir una vez por usuario
    if (hasSubscribedRef.current && lastUserIdRef.current === userId) {
      if (import.meta.env.DEV) console.log('[NotificationContext] ⏭️ Already subscribed for this user, skipping')
      return
    }

    // ⭐ Marcar como suscrito
    hasSubscribedRef.current = true
    lastUserIdRef.current = userId

    const channelName = `global_notifications_${userId}`
    
    if (import.meta.env.DEV) {
      console.log('🔥🔥🔥 [NotificationContext] 📡 INICIANDO suscripción realtime para:', userId)
    }
    
    const channel = supabase
      .channel(channelName)
      // 1. Escuchar notificaciones in-app
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'in_app_notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const notification = payload.new as InAppNotification
          const { activeConversationId, isChatOpen } = stateRef.current
          
          console.log('[NotificationContext] 📨 New notification:', {
            type: notification.type,
            title: notification.title,
            activeConversationId,
            isChatOpen,
            conversationId: notification.data?.conversation_id
          })
          
          // 🔍 DEBUG: Verificar cada condición
          console.log('🔍 [DEBUG] Checking suppression conditions:', {
            isChat: notification.type === 'chat_message',
            isChatOpen: isChatOpen,
            hasActiveConv: activeConversationId !== null,
            activeConvId: activeConversationId,
            messageConvId: notification.data?.conversation_id,
            matches: notification.data?.conversation_id === activeConversationId,
            WILL_SUPPRESS: (
              notification.type === 'chat_message' && 
              isChatOpen &&
              notification.data?.conversation_id === activeConversationId
            )
          })
          
          // ✅ REGLA 1: Si es chat message Y el chat de esa conversación está abierto → SUPRIMIR 
          if (
            notification.type === 'chat_message' && 
            isChatOpen &&
            notification.data?.conversation_id === activeConversationId
          ) {
            console.log('❌ [SUPPRESSED] Toast will NOT show - chat is open for this conversation')
            playActiveChatMessageSound()
            return // No mostrar toast, solo sonido
          }
          
          // ✅ REGLA 2: Si el chat está abierto (lista de conversaciones) pero no es la activa → MOSTRAR
          // ✅ REGLA 3: Si el chat está completamente cerrado → MOSTRAR
          
          console.log('✅ [PASSED] Suppression check passed, checking if unread...')
          
          // Solo mostrar si es unread
          if (notification.status !== 'unread') {
            console.log('⏭️ [SKIP] Notification is not unread, skipping toast')
            return
          }
          
          console.log('🎯 [SHOWING] About to show toast...')
          
          // Reproducir sonido
          const soundType = notification.priority === 2 ? 'alert' : 'message'
          playNotificationFeedback(soundType)
          
          // Mostrar toast
          toast.info(notification.title, {
            description: notification.message,
            duration: 5000,
            action: notification.action_url ? {
              label: 'Ver',
              onClick: () => {
                if (notification.action_url) {
                  window.location.href = notification.action_url
                }
              }
            } : undefined
          })
          
          console.log('[NotificationContext] ✅ Notification displayed:', notification.title)
        }
      )
      // NOTE: Do NOT subscribe to `chat_messages` here using a subselect filter.
      // Supabase realtime filters don't support SQL subqueries and attempting
      // to do so can cause channel errors (CHANNEL_ERROR / CLOSED). The in-app
      // notifications table already receives a trigger on message INSERT and
      // is sufficient to surface notifications to the user. If you need to
      // react to chat_messages globally, subscribe to `chat_participants` or
      // create explicit filters with conversation ids.
      .subscribe((status) => {
        console.log('[NotificationContext] 📡 Global channel status:', status)
      })

    // Cleanup
    return () => {
      console.log('[NotificationContext] 🔌 Unsubscribing global channel')
      supabase.removeChannel(channel)
      // ⭐ Reset guard al desmontar
      hasSubscribedRef.current = false
      lastUserIdRef.current = null
    }
  }, [userId])

  const setActiveConversation = useCallback((conversationId: string | null) => {
    if (import.meta.env.DEV) {
      console.log('[NotificationContext] 💬 Active conversation changed:', conversationId)
    }
    setActiveConversationId(conversationId)
  }, [])

  // ⭐ FIX BUG-020: Memoizar value para evitar re-renders
  const value: NotificationContextValue = useMemo(() => ({
    activeConversationId,
    setActiveConversation,
    isChatOpen,
    setChatOpen
  }), [activeConversationId, isChatOpen])

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
});
