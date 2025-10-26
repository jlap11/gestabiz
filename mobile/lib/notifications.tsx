import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import * as Notifications from 'expo-notifications'
import { useRouter } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { addNotificationReceivedListener, addNotificationResponseReceivedListener, setBadgeCount } from './push-notifications'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Subscription } from 'expo-notifications'

interface NotificationContextType {
  activeConversationId: string | null
  isChatOpen: boolean
  setActiveConversationId: (id: string | null) => void
  setIsChatOpen: (open: boolean) => void
}

const NotificationContext = createContext<NotificationContextType | null>(null)

// Configurar handler de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const router = useRouter()
  
  const notificationListener = useRef<Subscription>()
  const responseListener = useRef<Subscription>()

  useEffect(() => {
    // Listener cuando llega una notificación (app en foreground)
    notificationListener.current = addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification)
      
      // Actualizar badge count
      setBadgeCount(1)
      
      // Si el chat está abierto y es un mensaje del chat activo, suprimir
      const data = notification.request.content.data
      if (isChatOpen && data?.conversationId === activeConversationId) {
        console.log('Suprimiendo notificación: chat activo')
        return
      }
    })

    // Listener cuando usuario toca la notificación
    responseListener.current = addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response)
      
      const data = response.notification.request.content.data
      
      // Navegar según el tipo de notificación
      if (data?.route) {
        router.push(data.route as any)
      } else if (data?.type) {
        handleNotificationNavigation(data.type, data)
      }
      
      // Resetear badge
      setBadgeCount(0)
    })

    // Cleanup
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current)
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current)
      }
    }
  }, [isChatOpen, activeConversationId])

  // Función helper para navegación por tipo de notificación
  const handleNotificationNavigation = (type: string, data: any) => {
    switch (type) {
      case 'appointment_confirmed':
      case 'appointment_cancelled':
      case 'appointment_reminder':
        router.push('/(tabs)/appointments')
        break
      
      case 'chat_message':
        if (data.conversationId) {
          router.push(`/chat/${data.conversationId}` as any)
        } else {
          router.push('/(tabs)/chat')
        }
        break
      
      case 'employee_request':
      case 'vacancy_posted':
        router.push('/(tabs)/admin')
        break
      
      case 'absence_approved':
      case 'absence_rejected':
        router.push('/(tabs)/employee')
        break
      
      default:
        router.push('/(tabs)/notifications')
    }
  }

  const value = {
    activeConversationId,
    isChatOpen,
    setActiveConversationId,
    setIsChatOpen,
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotificationContext() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider')
  }
  return context
}

