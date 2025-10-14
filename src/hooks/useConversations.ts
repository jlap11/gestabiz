/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/**
 * useConversations Hook - Sistema de Chat FASE 2
 * 
 * Hook refactorizado para usar nueva arquitectura:
 * - Tablas: conversations, conversation_members, messages
 * - Edge Function: send-message
 * - Funciones RPC avanzadas (get_conversation_preview, search_messages, etc.)
 * - Realtime subscriptions
 * 
 * @author AppointSync Pro Team
 * @version 3.0.0
 * @date 2025-10-13
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { trackChatEvent, ChatEvents } from '@/lib/analytics'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type {
  Conversation,
  ConversationMember,
  Message,
  SendMessagePayload,
  CreateDirectConversationPayload,
  CreateGroupConversationPayload,
  ConversationFilters,
  ChatStats,
} from '@/types/types'
import { toast } from 'sonner'

// ============================================================================
// INTERFACES
// ============================================================================

export interface ConversationPreview extends Conversation {
  members?: ConversationMember[]
  other_user?: {
    id: string
    full_name: string
    email: string
    avatar_url?: string
  }
  member_count?: number
}

export interface UseConversationsReturn {
  // State
  conversations: ConversationPreview[]
  loading: boolean
  error: string | null
  stats: ChatStats | null

  // Actions
  fetchConversations: (filters?: ConversationFilters) => Promise<void>
  createDirectConversation: (otherUserId: string, businessId: string) => Promise<string | null>
  createGroupConversation: (payload: CreateGroupConversationPayload) => Promise<string | null>
  markConversationRead: (conversationId: string) => Promise<void>
  archiveConversation: (conversationId: string, archive: boolean) => Promise<void>
  muteConversation: (conversationId: string, mute: boolean) => Promise<void>
  updateCustomName: (conversationId: string, customName: string) => Promise<void>
  fetchStats: (businessId?: string) => Promise<void>

  // Realtime
  subscribeToConversations: (businessId?: string) => void
  unsubscribeFromConversations: () => void
}

// ============================================================================
// HOOK
// ============================================================================

export function useConversations(
  userId: string | undefined,
  businessId?: string
): UseConversationsReturn {
  // ============================================================================
  // STATE
  // ============================================================================

  const [conversations, setConversations] = useState<ConversationPreview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<ChatStats | null>(null)

  // Refs
  const conversationsChannelRef = useRef<RealtimeChannel | null>(null)
  const isMountedRef = useRef(true)

  // ============================================================================
  // FETCH CONVERSATIONS
  // ============================================================================

  const fetchConversations = useCallback(
    async (filters?: ConversationFilters) => {
      if (!userId) {
        setConversations([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Usar función RPC get_conversation_preview
        const { data, error: rpcError } = await supabase.rpc(
          'get_conversation_preview',
          {
            p_user_id: userId,
            p_business_id: filters?.business_id || businessId || null,
            p_limit: filters?.limit || 50,
            p_offset: filters?.offset || 0,
          }
        )

        if (rpcError) throw rpcError

        if (!isMountedRef.current) return

        // Mapear datos
        const conversationsData = (data || []) as ConversationPreview[]

        // Aplicar filtros adicionales en cliente
        let filtered = conversationsData

        if (filters?.type) {
          filtered = filtered.filter((c) => c.type === filters.type)
        }

        if (filters?.is_archived !== undefined) {
          filtered = filtered.filter((c) => c.is_archived === filters.is_archived)
        }

        if (filters?.has_unread) {
          filtered = filtered.filter((c) => (c.unread_count || 0) > 0)
        }

        if (filters?.search) {
          const search = filters.search.toLowerCase()
          filtered = filtered.filter(
            (c) =>
              c.name?.toLowerCase().includes(search) ||
              c.display_name?.toLowerCase().includes(search) ||
              c.last_message_preview?.toLowerCase().includes(search)
          )
        }

        setConversations(filtered)

        // Track analytics
        trackChatEvent(ChatEvents.CONVERSATIONS_LOADED, {
          count: filtered.length,
          business_id: businessId,
        })
      } catch (err: any) {
        console.error('Error fetching conversations:', err)
        setError(err.message || 'Error al cargar conversaciones')
        toast.error('Error al cargar conversaciones')
      } finally {
        if (isMountedRef.current) {
          setLoading(false)
        }
      }
    },
    [userId, businessId]
  )

  // ============================================================================
  // CREATE DIRECT CONVERSATION
  // ============================================================================

  const createDirectConversation = useCallback(
    async (otherUserId: string, businessIdParam: string): Promise<string | null> => {
      if (!userId) {
        toast.error('Usuario no autenticado')
        return null
      }

      try {
        // Usar función RPC create_direct_conversation
        const { data, error: rpcError } = await supabase.rpc(
          'create_direct_conversation',
          {
            p_business_id: businessIdParam,
            p_user_a: userId,
            p_user_b: otherUserId,
          }
        )

        if (rpcError) throw rpcError

        const conversationId = data as string

        // Refrescar lista
        await fetchConversations({ business_id: businessIdParam })

        // Track analytics
        trackChatEvent(ChatEvents.CONVERSATION_CREATED, {
          conversation_id: conversationId,
          type: 'direct',
          business_id: businessIdParam,
        })

        toast.success('Conversación creada')
        return conversationId
      } catch (err: any) {
        console.error('Error creating direct conversation:', err)
        toast.error('Error al crear conversación')
        return null
      }
    },
    [userId, fetchConversations]
  )

  // ============================================================================
  // CREATE GROUP CONVERSATION
  // ============================================================================

  const createGroupConversation = useCallback(
    async (payload: CreateGroupConversationPayload): Promise<string | null> => {
      if (!userId) {
        toast.error('Usuario no autenticado')
        return null
      }

      try {
        // 1. Crear conversación
        const { data: conversation, error: convError } = await supabase
          .from('conversations')
          .insert({
            business_id: payload.business_id,
            type: 'group',
            name: payload.name,
            description: payload.description,
            avatar_url: payload.avatar_url,
            created_by: userId,
            scope: payload.scope || {},
          })
          .select()
          .single()

        if (convError) throw convError

        // 2. Agregar creador como admin
        const memberInserts = [
          {
            conversation_id: conversation.id,
            user_id: userId,
            role: 'admin' as const,
            notifications_enabled: true,
            muted: false,
          },
          // 3. Agregar otros miembros
          ...payload.member_ids
            .filter((id) => id !== userId)
            .map((id) => ({
              conversation_id: conversation.id,
              user_id: id,
              role: 'member' as const,
              notifications_enabled: true,
              muted: false,
            })),
        ]

        const { error: membersError } = await supabase
          .from('conversation_members')
          .insert(memberInserts)

        if (membersError) throw membersError

        // 4. Crear mensaje del sistema
        await supabase.from('messages').insert({
          conversation_id: conversation.id,
          sender_id: userId,
          type: 'system',
          body: `Conversación "${payload.name}" creada`,
          metadata: {
            system_type: 'conversation_created',
            system_data: { created_by: userId },
          },
        })

        // Refrescar lista
        await fetchConversations({ business_id: payload.business_id })

        // Track analytics
        trackChatEvent(ChatEvents.CONVERSATION_CREATED, {
          conversation_id: conversation.id,
          type: 'group',
          member_count: payload.member_ids.length + 1,
          business_id: payload.business_id,
        })

        toast.success('Grupo creado exitosamente')
        return conversation.id
      } catch (err: any) {
        console.error('Error creating group conversation:', err)
        toast.error('Error al crear grupo')
        return null
      }
    },
    [userId, fetchConversations]
  )

  // ============================================================================
  // MARK CONVERSATION READ
  // ============================================================================

  const markConversationRead = useCallback(
    async (conversationId: string) => {
      if (!userId) return

      try {
        // Usar función RPC mark_conversation_read
        const { error: rpcError } = await supabase.rpc('mark_conversation_read', {
          p_conversation_id: conversationId,
          p_user_id: userId,
        })

        if (rpcError) throw rpcError

        // Actualizar estado local
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId
              ? { ...c, unread_count: 0 }
              : c
          )
        )

        // Track analytics
        trackChatEvent(ChatEvents.CONVERSATION_READ, {
          conversation_id: conversationId,
        })
      } catch (err: any) {
        console.error('Error marking conversation read:', err)
      }
    },
    [userId]
  )

  // ============================================================================
  // ARCHIVE CONVERSATION
  // ============================================================================

  const archiveConversation = useCallback(
    async (conversationId: string, archive: boolean) => {
      if (!userId) return

      try {
        const { error: updateError } = await supabase
          .from('conversations')
          .update({ is_archived: archive })
          .eq('id', conversationId)

        if (updateError) throw updateError

        // Actualizar estado local
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId ? { ...c, is_archived: archive } : c
          )
        )

        toast.success(archive ? 'Conversación archivada' : 'Conversación restaurada')

        // Track analytics
        trackChatEvent(
          archive ? ChatEvents.CONVERSATION_ARCHIVED : ChatEvents.CONVERSATION_UNARCHIVED,
          { conversation_id: conversationId }
        )
      } catch (err: any) {
        console.error('Error archiving conversation:', err)
        toast.error('Error al archivar conversación')
      }
    },
    [userId]
  )

  // ============================================================================
  // MUTE CONVERSATION
  // ============================================================================

  const muteConversation = useCallback(
    async (conversationId: string, mute: boolean) => {
      if (!userId) return

      try {
        const { error: updateError } = await supabase
          .from('conversation_members')
          .update({ muted: mute })
          .eq('conversation_id', conversationId)
          .eq('user_id', userId)

        if (updateError) throw updateError

        // Actualizar estado local
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === conversationId && c.members) {
              return {
                ...c,
                members: c.members.map((m) =>
                  m.user_id === userId ? { ...m, muted: mute } : m
                ),
              }
            }
            return c
          })
        )

        toast.success(mute ? 'Conversación silenciada' : 'Silencio desactivado')

        // Track analytics
        trackChatEvent(
          mute ? ChatEvents.CONVERSATION_MUTED : ChatEvents.CONVERSATION_UNMUTED,
          { conversation_id: conversationId }
        )
      } catch (err: any) {
        console.error('Error muting conversation:', err)
        toast.error('Error al silenciar conversación')
      }
    },
    [userId]
  )

  // ============================================================================
  // UPDATE CUSTOM NAME
  // ============================================================================

  const updateCustomName = useCallback(
    async (conversationId: string, customName: string) => {
      if (!userId) return

      try {
        const { error: updateError } = await supabase
          .from('conversation_members')
          .update({ custom_name: customName || null })
          .eq('conversation_id', conversationId)
          .eq('user_id', userId)

        if (updateError) throw updateError

        // Actualizar estado local
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId ? { ...c, display_name: customName } : c
          )
        )

        toast.success('Nombre personalizado actualizado')
      } catch (err: any) {
        console.error('Error updating custom name:', err)
        toast.error('Error al actualizar nombre')
      }
    },
    [userId]
  )

  // ============================================================================
  // FETCH STATS
  // ============================================================================

  const fetchStats = useCallback(
    async (businessIdParam?: string) => {
      if (!userId) return

      try {
        const { data, error: rpcError } = await supabase.rpc('get_chat_stats', {
          p_user_id: userId,
          p_business_id: businessIdParam || businessId || null,
        })

        if (rpcError) throw rpcError

        setStats(data as ChatStats)
      } catch (err: any) {
        console.error('Error fetching chat stats:', err)
      }
    },
    [userId, businessId]
  )

  // ============================================================================
  // REALTIME SUBSCRIPTIONS
  // ============================================================================

  const subscribeToConversations = useCallback(
    (businessIdParam?: string) => {
      if (!userId) return

      // Limpiar suscripción anterior
      if (conversationsChannelRef.current) {
        supabase.removeChannel(conversationsChannelRef.current)
      }

      const channelName = `conversations:${userId}:${businessIdParam || businessId || 'all'}`

      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conversations',
            filter: `business_id=eq.${businessIdParam || businessId}`,
          },
          () => {
            // Refrescar conversaciones cuando hay cambios
            fetchConversations({ business_id: businessIdParam || businessId })
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conversation_members',
            filter: `user_id=eq.${userId}`,
          },
          () => {
            // Refrescar conversaciones cuando cambian membresías
            fetchConversations({ business_id: businessIdParam || businessId })
          }
        )
        .subscribe()

      conversationsChannelRef.current = channel
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, businessId]
  )

  const unsubscribeFromConversations = useCallback(() => {
    if (conversationsChannelRef.current) {
      supabase.removeChannel(conversationsChannelRef.current)
      conversationsChannelRef.current = null
    }
  }, [])

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Fetch inicial
  useEffect(() => {
    if (userId) {
      fetchConversations({ business_id: businessId })
      fetchStats(businessId)
    }

    return () => {
      isMountedRef.current = false
    }
  }, [userId, businessId, fetchConversations, fetchStats])

  // Cleanup
  useEffect(() => {
    return () => {
      unsubscribeFromConversations()
    }
  }, [unsubscribeFromConversations])

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    conversations,
    loading,
    error,
    stats,
    fetchConversations,
    createDirectConversation,
    createGroupConversation,
    markConversationRead,
    archiveConversation,
    muteConversation,
    updateCustomName,
    fetchStats,
    subscribeToConversations,
    unsubscribeFromConversations,
  }
}
