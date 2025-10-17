/**
 * NotificationContext - Sistema global de notificaciones
 * 
 * Este contexto mantiene una suscripción realtime SIEMPRE ACTIVA
 * para recibir notificaciones incluso cuando el chat/componentes están cerrados.
 * 
 * @author AppointSync Pro Team
 * @date 2025-10-17
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { playNotificationFeedback } from '@/lib/notificationSound'
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

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function useNotificationContext() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotificationContext debe usarse dentro de NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: React.ReactNode
  userId: string | null
}

export function NotificationProvider({ children, userId }: NotificationProviderProps) {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [isChatOpen, setChatOpen] = useState(false)
  
  // Debug: Log cuando el provider se monta
  console.log('[NotificationProvider] Mounted with userId:', userId)
  
  // Ref para acceder al estado actual en callbacks
  const stateRef = useRef({ activeConversationId, isChatOpen })
  useEffect(() => {
    stateRef.current = { activeConversationId, isChatOpen }
  }, [activeConversationId, isChatOpen])

  // Suscripción realtime GLOBAL (siempre activa)
  useEffect(() => {
    console.log('🔥🔥🔥 [NotificationContext] useEffect EJECUTÁNDOSE. UserId:', userId, 'Type:', typeof userId)
    
    if (!userId) {
      console.log('[NotificationContext] ⚠️ No userId, skipping subscription')
      return
    }

    const channelName = `global_notifications_${userId}`
    
    console.log('🔥🔥🔥 [NotificationContext] 📡 INICIANDO suscripción realtime para:', userId)
    
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
          
          // ✅ REGLA 1: Si es chat message Y el chat de esa conversación está abierto → SUPRIMIR
          if (
            notification.type === 'chat_message' && 
            isChatOpen &&
            notification.data?.conversation_id === activeConversationId
          ) {
            console.log('[NotificationContext] ⏭️ Suppressing notification (chat already open)')
            return // No mostrar toast/sonido - el usuario ya está viendo el chat
          }
          
          // ✅ REGLA 2: Si el chat está abierto (lista de conversaciones) pero no es la activa → MOSTRAR
          // ✅ REGLA 3: Si el chat está completamente cerrado → MOSTRAR
          
          // Solo mostrar si es unread
          if (notification.status !== 'unread') {
            return
          }
          
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
      // 2. 🆕 NUEVO: Escuchar mensajes de chat directamente (para actualizar conversaciones)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=in.(SELECT conversation_id FROM chat_participants WHERE user_id=${userId})`
        },
        (payload) => {
          console.log('[NotificationContext] 💬 New chat message (global):', payload.new)
          // Este evento dispara automáticamente la creación de in_app_notification
          // via trigger en Supabase, así que no necesitamos hacer nada aquí
          // Solo lo loggeamos para debugging
        }
      )
      .subscribe((status) => {
        console.log('[NotificationContext] 📡 Global channel status:', status)
      })

    // Cleanup
    return () => {
      console.log('[NotificationContext] 🔌 Unsubscribing global channel')
      supabase.removeChannel(channel)
    }
  }, [userId])

  const setActiveConversation = useCallback((conversationId: string | null) => {
    console.log('[NotificationContext] 💬 Active conversation changed:', conversationId)
    setActiveConversationId(conversationId)
  }, [])

  const value: NotificationContextValue = {
    activeConversationId,
    setActiveConversation,
    isChatOpen,
    setChatOpen
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}
