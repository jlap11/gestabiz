/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/**
 * useMessages Hook - Gestión de Mensajes FASE 2
 * 
 * Hook para manejar mensajes de una conversación específica:
 * - Fetch con paginación cursor-based
 * - Envío via Edge Function send-message
 * - Editar, eliminar, pin
 * - Realtime subscriptions
 * - Optimistic updates
 * 
 * @author Gestabiz Team
 * @version 3.0.0
 * @date 2025-10-13
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { trackChatEvent, ChatEvents } from '@/lib/analytics'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type {
  Message,
  SendMessagePayload,
  MessageFilters,
} from '@/types/types'
import { toast } from 'sonner'

// ============================================================================
// INTERFACES
// ============================================================================

export interface MessageWithSender extends Message {
  sender?: {
    id: string
    full_name: string
    email: string
    avatar_url?: string
  }
  reply_to_message?: Message
}

export interface UseMessagesReturn {
  // State
  messages: MessageWithSender[]
  loading: boolean
  error: string | null
  hasMore: boolean
  sending: boolean

  // Actions
  fetchMessages: (filters?: MessageFilters) => Promise<void>
  loadMore: () => Promise<void>
  sendMessage: (payload: Omit<SendMessagePayload, 'conversation_id'>) => Promise<void>
  editMessage: (messageId: string, newBody: string) => Promise<void>
  deleteMessage: (messageId: string) => Promise<void>
  pinMessage: (messageId: string, pin: boolean) => Promise<void>
  searchMessages: (query: string) => Promise<MessageWithSender[]>

  // Realtime
  subscribeToMessages: () => void
  unsubscribeFromMessages: () => void
}

// ============================================================================
// HOOK
// ============================================================================

export function useMessages(
  conversationId: string | null,
  userId: string | undefined
): UseMessagesReturn {
  // ============================================================================
  // STATE
  // ============================================================================

  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [sending, setSending] = useState(false)
  const [oldestMessageId, setOldestMessageId] = useState<string | null>(null)

  // Refs
  const messagesChannelRef = useRef<RealtimeChannel | null>(null)
  const isMountedRef = useRef(true)

  // ============================================================================
  // FETCH MESSAGES
  // ============================================================================

  const fetchMessages = useCallback(
    async (filters?: MessageFilters) => {
      if (!conversationId || !userId) return

      try {
        setLoading(true)
        setError(null)

        // Usar función RPC get_messages_paginated
        const { data, error: rpcError } = await supabase.rpc(
          'get_messages_paginated',
          {
            p_conversation_id: conversationId,
            p_before_id: filters?.before || null,
            p_after_id: filters?.after || null,
            p_limit: filters?.limit || 50,
          }
        )

        if (rpcError) throw rpcError

        if (!isMountedRef.current) return

        const messagesData = (data || []) as MessageWithSender[]

        // Filtrar mensajes eliminados si no se solicitan
        const filteredMessages = filters?.include_deleted
          ? messagesData
          : messagesData.filter((m) => !m.is_deleted)

        setMessages(filteredMessages)
        setHasMore(filteredMessages.length === (filters?.limit || 50))

        if (filteredMessages.length > 0) {
          setOldestMessageId(filteredMessages[filteredMessages.length - 1].id)
        }

        // Track analytics
        trackChatEvent(ChatEvents.CONVERSATION_OPENED, {
          conversation_id: conversationId,
          message_count: filteredMessages.length,
        })
      } catch (err: any) {
        console.error('Error fetching messages:', err)
        setError(err.message || 'Error al cargar mensajes')
        toast.error('Error al cargar mensajes')
      } finally {
        if (isMountedRef.current) {
          setLoading(false)
        }
      }
    },
    [conversationId, userId]
  )

  // ============================================================================
  // LOAD MORE (Paginación)
  // ============================================================================

  const loadMore = useCallback(async () => {
    if (!hasMore || loading || !oldestMessageId) return

    await fetchMessages({
      conversation_id: conversationId!,
      before: oldestMessageId,
      limit: 50,
    })
  }, [hasMore, loading, oldestMessageId, conversationId, fetchMessages])

  // ============================================================================
  // SEND MESSAGE
  // ============================================================================

  const sendMessage = useCallback(
    async (payload: Omit<SendMessagePayload, 'conversation_id'>) => {
      if (!conversationId || !userId) {
        toast.error('Usuario no autenticado')
        return
      }

      try {
        setSending(true)

        // Optimistic update
        const tempMessage: MessageWithSender = {
          id: `temp-${Date.now()}`,
          conversation_id: conversationId,
          sender_id: userId,
          type: payload.type || 'text',
          body: payload.body,
          metadata: payload.metadata || {},
          reply_to: payload.reply_to,
          is_pinned: false,
          is_deleted: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          sender: {
            id: userId,
            full_name: 'Tú',
            email: '',
            avatar_url: undefined,
          },
          delivery_status: 'sending',
          read_by: [], // Inicializar array vacío
        }

        setMessages((prev) => [...prev, tempMessage])

        // Llamar a Edge Function send-message
        const { data, error: functionError } = await supabase.functions.invoke(
          'send-message',
          {
            body: {
              conversation_id: conversationId,
              ...payload,
            },
          }
        )

        if (functionError) throw functionError

        if (!data?.success) {
          throw new Error(data?.error || 'Error al enviar mensaje')
        }

        // Remover mensaje temporal
        setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id))

        // El mensaje real llegará via Realtime
        // Actualizar rate limit info si está disponible
        if (data.rate_limit) {
          console.log('Rate limit:', data.rate_limit)
        }

        // Track analytics
        trackChatEvent(ChatEvents.MESSAGE_SENT, {
          conversation_id: conversationId,
          message_type: payload.type || 'text',
          has_reply: !!payload.reply_to,
          has_attachment: !!payload.metadata?.file_url || !!payload.metadata?.image_url,
        })
      } catch (err: any) {
        console.error('Error sending message:', err)
        toast.error(err.message || 'Error al enviar mensaje')

        // Marcar mensaje temporal como fallido
        setMessages((prev) =>
          prev.map((m) =>
            m.id.startsWith('temp-')
              ? { ...m, delivery_status: 'failed' as const }
              : m
          )
        )
      } finally {
        setSending(false)
      }
    },
    [conversationId, userId]
  )

  // ============================================================================
  // EDIT MESSAGE
  // ============================================================================

  const editMessage = useCallback(
    async (messageId: string, newBody: string) => {
      if (!userId) return

      try {
        const { error: updateError } = await supabase
          .from('messages')
          .update({
            body: newBody,
            edited_at: new Date().toISOString(),
          })
          .eq('id', messageId)
          .eq('sender_id', userId) // Solo el sender puede editar

        if (updateError) throw updateError

        // Actualizar estado local
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, body: newBody, edited_at: new Date().toISOString() }
              : m
          )
        )

        toast.success('Mensaje editado')

        // Track analytics
        trackChatEvent(ChatEvents.MESSAGE_EDITED, {
          message_id: messageId,
          conversation_id: conversationId,
        })
      } catch (err: any) {
        console.error('Error editing message:', err)
        toast.error('Error al editar mensaje')
      }
    },
    [userId, conversationId]
  )

  // ============================================================================
  // DELETE MESSAGE
  // ============================================================================

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!userId) return

      try {
        // Soft delete
        const { error: updateError } = await supabase
          .from('messages')
          .update({
            is_deleted: true,
            deleted_by: userId,
            deleted_at: new Date().toISOString(),
            body: null, // Limpiar contenido
          })
          .eq('id', messageId)
          .eq('sender_id', userId) // Solo el sender puede eliminar

        if (updateError) throw updateError

        // Actualizar estado local
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  is_deleted: true,
                  deleted_by: userId,
                  deleted_at: new Date().toISOString(),
                  body: undefined,
                }
              : m
          )
        )

        toast.success('Mensaje eliminado')

        // Track analytics
        trackChatEvent(ChatEvents.MESSAGE_DELETED, {
          message_id: messageId,
          conversation_id: conversationId,
        })
      } catch (err: any) {
        console.error('Error deleting message:', err)
        toast.error('Error al eliminar mensaje')
      }
    },
    [userId, conversationId]
  )

  // ============================================================================
  // PIN MESSAGE
  // ============================================================================

  const pinMessage = useCallback(
    async (messageId: string, pin: boolean) => {
      if (!userId) return

      try {
        const updateData: any = {
          is_pinned: pin,
        }

        if (pin) {
          updateData.pinned_by = userId
          updateData.pinned_at = new Date().toISOString()
        } else {
          updateData.pinned_by = null
          updateData.pinned_at = null
        }

        const { error: updateError } = await supabase
          .from('messages')
          .update(updateData)
          .eq('id', messageId)

        if (updateError) throw updateError

        // Actualizar estado local
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, ...updateData } : m))
        )

        toast.success(pin ? 'Mensaje fijado' : 'Mensaje desfijado')
      } catch (err: any) {
        console.error('Error pinning message:', err)
        toast.error('Error al fijar mensaje')
      }
    },
    [userId]
  )

  // ============================================================================
  // SEARCH MESSAGES
  // ============================================================================

  const searchMessages = useCallback(
    async (query: string): Promise<MessageWithSender[]> => {
      if (!conversationId || !query.trim()) return []

      try {
        const { data, error: rpcError } = await supabase.rpc('search_messages', {
          p_conversation_id: conversationId,
          p_query: query,
          p_limit: 20,
        })

        if (rpcError) throw rpcError

        // Track analytics
        trackChatEvent(ChatEvents.SEARCH_PERFORMED, {
          conversation_id: conversationId,
          query,
          results_count: data?.length || 0,
        })

        return (data || []) as MessageWithSender[]
      } catch (err: any) {
        console.error('Error searching messages:', err)
        toast.error('Error al buscar mensajes')
        return []
      }
    },
    [conversationId]
  )

  // ============================================================================
  // REALTIME SUBSCRIPTIONS
  // ============================================================================

  const subscribeToMessages = useCallback(() => {
    if (!conversationId || !userId) return

    // Limpiar suscripción anterior
    if (messagesChannelRef.current) {
      supabase.removeChannel(messagesChannelRef.current)
    }

    const channelName = `messages:${conversationId}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Fetch mensaje completo con sender info
          const { data: messageData } = await supabase
            .from('messages')
            .select(
              `
              *,
              sender:profiles!messages_sender_id_fkey(id, full_name, email, avatar_url)
            `
            )
            .eq('id', payload.new.id)
            .single()

          if (messageData && !messageData.is_deleted) {
            setMessages((prev) => {
              // Evitar duplicados
              if (prev.some((m) => m.id === messageData.id)) {
                return prev
              }
              return [...prev, messageData as MessageWithSender]
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === payload.new.id ? { ...m, ...(payload.new as Message) } : m
            )
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => prev.filter((m) => m.id !== payload.old.id))
        }
      )
      .subscribe()

    messagesChannelRef.current = channel
  }, [conversationId, userId])

  const unsubscribeFromMessages = useCallback(() => {
    if (messagesChannelRef.current) {
      supabase.removeChannel(messagesChannelRef.current)
      messagesChannelRef.current = null
    }
  }, [])

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Fetch inicial
  useEffect(() => {
    if (conversationId && userId) {
      fetchMessages({ conversation_id: conversationId, limit: 50 })
    } else {
      setMessages([])
    }

    return () => {
      isMountedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, userId]) // ✅ fetchMessages excluido - es estable (useCallback)

  // Cleanup
  useEffect(() => {
    return () => {
      unsubscribeFromMessages()
    }
  }, [unsubscribeFromMessages])

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    messages,
    loading,
    error,
    hasMore,
    sending,
    fetchMessages,
    loadMore,
    sendMessage,
    editMessage,
    deleteMessage,
    pinMessage,
    searchMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
  }
}
