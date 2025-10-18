/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/* eslint-disable max-nested-callbacks */
/**
 * useChat Hook - Sistema de Chat en Tiempo Real
 * 
 * Funcionalidades:
 * - Gestión de conversaciones y mensajes
 * - Realtime subscriptions (mensajes + typing indicators)
 * - CRUD completo con optimistic updates
 * - Integración con sistema de notificaciones in-app
 * 
 * @author Gestabiz Team
 * @version 2.0.0
 * @date 2025-10-13
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { trackChatEvent, ChatEvents } from '@/lib/analytics';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface ChatConversation {
  id: string;
  type: 'direct' | 'group';
  title: string | null;
  created_by: string | null;
  business_id: string | null;
  last_message_at: string;
  last_message_preview: string | null;
  last_message_sender_id?: string | null;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  metadata: Record<string, unknown>;
  
  // Computed fields (from participants)
  unread_count?: number;
  is_pinned?: boolean;
  is_muted?: boolean;
  other_user?: ChatParticipantUser; // Para conversaciones directas
}

export interface ChatParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  left_at: string | null;
  last_read_at: string | null;
  last_read_message_id: string | null;
  unread_count: number;
  is_muted: boolean;
  is_pinned: boolean;
  user?: ChatParticipantUser;
}

export interface ChatParticipantUser {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  attachments: ChatAttachment[] | null;
  sent_at: string;
  delivered_at: string | null;
  read_by: ChatReadReceipt[];
  reply_to_id: string | null;
  edited_at: string | null;
  deleted_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  
  // Computed fields
  sender?: ChatParticipantUser;
  reply_to?: ChatMessage;
  is_sent?: boolean;
  is_delivered?: boolean;
  is_read?: boolean;
}

export interface ChatAttachment {
  url: string;
  name: string;
  size: number;
  type: string;
}

export interface ChatReadReceipt {
  user_id: string;
  read_at: string;
}

export interface ChatTypingUser {
  user_id: string;
  user?: ChatParticipantUser;
  started_at: string;
  expires_at: string;
}

export interface SendMessageParams {
  conversation_id: string;
  content: string;
  type?: 'text' | 'image' | 'file';
  attachments?: ChatAttachment[];
  reply_to_id?: string;
}

export interface CreateConversationParams {
  other_user_id: string;
  business_id?: string;
  initial_message?: string;
}

// ============================================================================
// HOOK
// ============================================================================

export function useChat(userId: string | null) {
  // State
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, ChatTypingUser[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Ref for typing timeout (realtime refs removed - now using polling)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Ref for debounced mark as read (prevent excessive RPC calls)
  const markAsReadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingMarkAsReadRef = useRef<{ conversationId: string; messageId: string } | null>(null);
  
  // ============================================================================
  // FETCH FUNCTIONS
  // ============================================================================
  
  /**
   * Fetch all conversations for current user
   */
  const fetchConversations = useCallback(async () => {
    if (!userId) {
      setConversations([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('[useChat] fetchConversations for userId:', userId);
      
      // Fetch conversations with participant info
      const { data: participantsData, error: participantsError } = await supabase
        .from('chat_participants')
        .select(`
          *,
          conversation:chat_conversations(*)
        `)
        .eq('user_id', userId)
        .is('left_at', null);
      
      console.log('[useChat] participantsData:', participantsData);
      console.log('[useChat] participantsError:', participantsError);
      
      if (participantsError) throw participantsError;
      
      if (!participantsData || participantsData.length === 0) {
        console.log('[useChat] No participants found, setting empty conversations');
        setConversations([]);
        return;
      }
      
      // For each direct conversation, fetch the other user
      const conversationsWithUsers = await Promise.all(
        participantsData.map(async (participant: { conversation: ChatConversation; unread_count: number; is_pinned: boolean; is_muted: boolean }) => {
          const conv = participant.conversation;
          
          if (conv.type === 'direct') {
            // Fetch other participant
            const { data: otherParticipants } = await supabase
              .from('chat_participants')
              .select(`
                user_id,
                user:profiles(id, full_name, email, avatar_url)
              `)
              .eq('conversation_id', conv.id)
              .neq('user_id', userId)
              .is('left_at', null)
              .single();
            
            return {
              ...conv,
              unread_count: participant.unread_count,
              is_pinned: participant.is_pinned,
              is_muted: participant.is_muted,
              other_user: otherParticipants?.user || undefined,
            };
          }
          
          return {
            ...conv,
            unread_count: participant.unread_count,
            is_pinned: participant.is_pinned,
            is_muted: participant.is_muted,
          };
        })
      );
      const conversationIds = conversationsWithUsers.map(conv => conv.id);

      const lastSenderMap = new Map<string, string>();
      if (conversationIds.length > 0) {
        const { data: lastMessagesData, error: lastMessagesError } = await supabase
          .from('chat_messages')
          .select('conversation_id, sender_id')
          .in('conversation_id', conversationIds)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (lastMessagesError) {
          console.error('[useChat] Error fetching last message senders:', lastMessagesError);
        } else if (lastMessagesData) {
          (lastMessagesData as Array<{ conversation_id: string; sender_id: string }>).forEach((message) => {
            if (!lastSenderMap.has(message.conversation_id)) {
              lastSenderMap.set(message.conversation_id, message.sender_id);
            }
          });
        }
      }

      const conversationsWithLastSender = conversationsWithUsers.map(conv => ({
        ...conv,
        last_message_sender_id: lastSenderMap.get(conv.id) ?? conv.last_message_sender_id ?? null,
      }));
      
      // Sort by last_message_at (most recent first)
      conversationsWithLastSender.sort((a, b) => {
        const dateA = new Date(a.last_message_at).getTime();
        const dateB = new Date(b.last_message_at).getTime();
        return dateB - dateA;
      });
      
      console.log('[useChat] Final conversationsWithUsers:', conversationsWithLastSender);
      console.log('[useChat] Setting', conversationsWithLastSender.length, 'conversations');
      
      setConversations(conversationsWithLastSender as ChatConversation[]);
    } catch (err) {
      const error = err as Error;
      console.error('[useChat] Error in fetchConversations:', err);
      logger.error('Failed to fetch chat conversations', error, {
        component: 'useChat',
        operation: 'fetchConversations',
        userId,
      });
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);
  
  /**
   * Fetch messages for a specific conversation
   */
  const fetchMessages = useCallback(async (conversationId: string, limit = 50) => {
    if (!userId) return;
    
    try {
      const { data, error: messagesError } = await supabase
        .from('chat_messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          type,
          attachments,
          sent_at,
          delivered_at,
          read_by,
          reply_to_id,
          edited_at,
          deleted_at,
          metadata,
          created_at,
          updated_at,
          sender:profiles(id, full_name, email, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (messagesError) throw messagesError;
      
      if (data) {
        // Mapear content → body para compatibilidad con componentes UI
        const mappedMessages = data.map((msg: any) => ({
          ...msg,
          body: msg.content, // ✅ Mapear content → body
          reply_to: msg.reply_to_id, // ✅ Mapear reply_to_id → reply_to
        }));
        
        // Reverse to show oldest first
        const sortedMessages = mappedMessages.reverse();
        
        setMessages(prev => ({
          ...prev,
          [conversationId]: sortedMessages,
        }));
      }
    } catch (err) {
      const error = err as Error;
      console.error('[useChat] Error fetching messages:', err);
      setError(error.message);
    }
  }, [userId]);
  
  /**
   * Fetch typing indicators for a conversation
   */
  const fetchTypingIndicators = useCallback(async (conversationId: string) => {
    if (!userId) return;
    
    try {
      const { data, error: typingError } = await supabase
        .from('chat_typing_indicators')
        .select(`
          *,
          user:profiles(id, full_name, email, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .neq('user_id', userId)
        .gt('expires_at', new Date().toISOString());
      
      if (typingError) throw typingError;
      
      if (data) {
        setTypingUsers(prev => ({
          ...prev,
          [conversationId]: data,
        }));
      }
    } catch (err) {
      // Silently handle typing indicator errors
      console.error('Error fetching typing indicators:', err);
    }
  }, [userId]);
  
  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================
  
  /**
   * Create or get existing direct conversation
   */
  const createOrGetConversation = useCallback(async (params: CreateConversationParams) => {
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }
    
    try {
      const { data: conversationId, error: rpcError } = await supabase
        .rpc('get_or_create_direct_conversation', {
          p_user1_id: userId,
          p_user2_id: params.other_user_id,
          p_business_id: params.business_id || null,
        });
      
      if (rpcError) throw rpcError;
      
      // Refresh conversations
      await fetchConversations();
      
      // Send initial message if provided
      if (params.initial_message && conversationId) {
        await sendMessage({
          conversation_id: conversationId,
          content: params.initial_message,
        });
      }
      
      return conversationId;
    } catch (err: any) {
      console.error('Error creating conversation:', err);
      throw err;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, fetchConversations]);
  
  /**
   * Send a message
   */
  const sendMessage = useCallback(async (params: SendMessageParams) => {
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }
    
    try {
      // Optimistic update
      const tempId = `temp-${Date.now()}`;
      const optimisticMessage: ChatMessage = {
        id: tempId,
        conversation_id: params.conversation_id,
        sender_id: userId,
        content: params.content,
        type: params.type || 'text',
        attachments: params.attachments || null,
        sent_at: new Date().toISOString(),
        delivered_at: null,
        read_by: [],
        reply_to_id: params.reply_to_id || null,
        edited_at: null,
        deleted_at: null,
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_sent: false,
      };
      
      setMessages(prev => ({
        ...prev,
        [params.conversation_id]: [
          ...(prev[params.conversation_id] || []),
          optimisticMessage,
        ],
      }));
      
      // Send via RPC
      const { data: messageId, error: rpcError } = await supabase
        .rpc('send_message', {
          p_conversation_id: params.conversation_id,
          p_sender_id: userId,
          p_content: params.content,
          p_type: params.type || 'text',
          p_attachments: params.attachments ? JSON.stringify(params.attachments) : null,
          p_reply_to_id: params.reply_to_id || null,
        });
      
      if (rpcError) {
        // Remove optimistic message on error
        setMessages(prev => ({
          ...prev,
          [params.conversation_id]: prev[params.conversation_id].filter(m => m.id !== tempId),
        }));
        throw rpcError;
      }
      
      // Replace optimistic message with real one
      const { data: realMessage, error: fetchError } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:profiles(id, full_name, email, avatar_url)
        `)
        .eq('id', messageId)
        .single();
      
      if (!fetchError && realMessage) {
        setMessages(prev => ({
          ...prev,
          [params.conversation_id]: prev[params.conversation_id].map(m =>
            m.id === tempId ? { ...realMessage, is_sent: true } : m
          ),
        }));
      }
      
      // Update conversation's last_message_at locally
      setConversations(prev =>
        prev.map(conv =>
          conv.id === params.conversation_id
            ? {
                ...conv,
                last_message_at: new Date().toISOString(),
                last_message_preview: params.content.substring(0, 100),
                last_message_sender_id: userId,
              }
            : conv
        )
      );
      
      // Stop typing indicator
      await updateTypingIndicator(params.conversation_id, false);
      
      // Track analytics
      trackChatEvent(ChatEvents.MESSAGE_SENT, {
        conversation_id: params.conversation_id,
        message_type: params.type || 'text',
        has_attachments: !!params.attachments && params.attachments.length > 0,
        has_reply: !!params.reply_to_id,
        content_length: params.content.length,
      });
      
      return messageId;
    } catch (err: any) {
      console.error('Error sending message:', err);
      throw err;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
  
  /**
   * Mark messages as read (with debounce to prevent excessive calls)
   */
  const markMessagesAsRead = useCallback(async (conversationId: string, lastMessageId?: string) => {
    if (!userId) {
      console.warn('[useChat] ⚠️ markMessagesAsRead called without userId');
      return;
    }
    
    console.log('[useChat] 🔔 Calling mark_messages_as_read RPC:', {
      conversationId,
      userId,
      lastMessageId
    });
    
    try {
      const { data: count, error: rpcError } = await supabase
        .rpc('mark_messages_as_read', {
          p_conversation_id: conversationId,
          p_user_id: userId,
          p_message_id: lastMessageId || null,
        });
      
      if (rpcError) {
        console.error('[useChat] ❌ RPC mark_messages_as_read error:', rpcError);
        throw rpcError;
      }
      
      console.log('[useChat] ✅ RPC mark_messages_as_read success, count:', count);
      
      // Update local unread count
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, unread_count: 0 }
            : conv
        )
      );
      
      // 🔥 FIX: También limpiar notificaciones de chat de esta conversación
      // Esto sincroniza el badge del botón flotante
      try {
        // Usar operador JSONB contains (@>) para filtrar por conversation_id en data column
        const { data: clearedNotifs, error: notifError } = await supabase
          .from('in_app_notifications')
          .update({ 
            status: 'read',
            read_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('type', 'chat_message')  // ✅ FIX: Tipo correcto del enum
          .eq('status', 'unread')
          .contains('data', { conversation_id: conversationId })
          .select('id');
        
        if (notifError) {
          console.error('[useChat] ❌ Error clearing chat notifications:', notifError);
        } else {
          console.log(`[useChat] ✅ Cleared ${clearedNotifs?.length || 0} chat notifications for conversation ${conversationId}`);
        }
      } catch (notifErr) {
        // No bloquear si falla - logging solo
        console.error('[useChat] ❌ Failed to clear chat notifications:', notifErr);
      }
      
      return count;
    } catch (err: any) {
      console.error('[useChat] ❌ Error marking messages as read:', err);
      console.error('[useChat] ❌ Error details:', {
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint
      });
    }
  }, [userId]);
  
  /**
   * Debounced mark as read - previene llamadas excesivas cuando llegan múltiples mensajes
   */
  const debouncedMarkAsRead = useCallback((conversationId: string, messageId: string) => {
    // Guardar pending request
    pendingMarkAsReadRef.current = { conversationId, messageId };
    
    // Cancelar timeout anterior
    if (markAsReadTimeoutRef.current) {
      clearTimeout(markAsReadTimeoutRef.current);
    }
    
    // Programar ejecución después de 500ms de inactividad
    markAsReadTimeoutRef.current = setTimeout(() => {
      const pending = pendingMarkAsReadRef.current;
      if (pending) {
        console.log('[useChat] ⏱️ Executing debounced mark as read');
        markMessagesAsRead(pending.conversationId, pending.messageId);
        pendingMarkAsReadRef.current = null;
      }
    }, 500);
  }, [markMessagesAsRead]);
  
  /**
   * Update typing indicator
   */
  const updateTypingIndicator = useCallback(async (conversationId: string, isTyping: boolean) => {
    if (!userId) return;
    
    try {
      await supabase.rpc('update_typing_indicator', {
        p_conversation_id: conversationId,
        p_user_id: userId,
        p_is_typing: isTyping,
      });
      
      // Auto-stop typing after 10 seconds
      if (isTyping) {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        typingTimeoutRef.current = setTimeout(() => {
          updateTypingIndicator(conversationId, false);
        }, 10000);
      }
    } catch (err: any) {
      console.error('Error updating typing indicator:', err);
    }
  }, [userId]);
  
  /**
   * Edit a message
   */
  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    if (!userId) return;
    
    try {
      const { error: updateError } = await supabase
        .from('chat_messages')
        .update({
          content: newContent,
          edited_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .eq('sender_id', userId);
      
      if (updateError) throw updateError;
      
      // Update local state
      setMessages(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(convId => {
          updated[convId] = updated[convId].map(msg =>
            msg.id === messageId
              ? { ...msg, content: newContent, edited_at: new Date().toISOString() }
              : msg
          );
        });
        return updated;
      });
      
      // Track analytics
      trackChatEvent(ChatEvents.MESSAGE_EDITED, {
        message_id: messageId,
        content_length: newContent.length,
      });
    } catch (err: any) {
      console.error('Error editing message:', err);
      throw err;
    }
  }, [userId]);
  
  /**
   * Delete a message (soft delete)
   */
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!userId) return;
    
    try {
      const { error: updateError } = await supabase
        .from('chat_messages')
        .update({
          deleted_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .eq('sender_id', userId);
      
      if (updateError) throw updateError;
      
      // Remove from local state
      setMessages(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(convId => {
          updated[convId] = updated[convId].filter(msg => msg.id !== messageId);
        });
        return updated;
      });
      
      // Track analytics
      trackChatEvent(ChatEvents.MESSAGE_DELETED, {
        message_id: messageId,
      });
    } catch (err: any) {
      console.error('Error deleting message:', err);
      throw err;
    }
  }, [userId]);
  
  /**
   * Archive/unarchive conversation
   */
  const toggleArchiveConversation = useCallback(async (conversationId: string, isArchived: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('chat_conversations')
        .update({ is_archived: isArchived })
        .eq('id', conversationId);
      
      if (updateError) throw updateError;
      
      // Update local state
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, is_archived: isArchived }
            : conv
        )
      );
    } catch (err: any) {
      console.error('Error toggling archive:', err);
      throw err;
    }
  }, []);
  
  /**
   * Mute/unmute conversation
   */
  const toggleMuteConversation = useCallback(async (conversationId: string, isMuted: boolean) => {
    if (!userId) return;
    
    try {
      const { error: updateError } = await supabase
        .from('chat_participants')
        .update({ is_muted: isMuted })
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);
      
      if (updateError) throw updateError;
      
      // Update local state
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, is_muted: isMuted }
            : conv
        )
      );
    } catch (err: any) {
      console.error('Error toggling mute:', err);
      throw err;
    }
  }, [userId]);
  
  /**
   * Pin/unpin conversation
   */
  const togglePinConversation = useCallback(async (conversationId: string, isPinned: boolean) => {
    if (!userId) return;
    
    try {
      const { error: updateError } = await supabase
        .from('chat_participants')
        .update({ is_pinned: isPinned })
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);
      
      if (updateError) throw updateError;
      
      // Update local state
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, is_pinned: isPinned }
            : conv
        )
      );
    } catch (err: any) {
      console.error('Error toggling pin:', err);
      throw err;
    }
  }, [userId]);
  
  // ============================================================================
  // REALTIME SUBSCRIPTIONS
  // ============================================================================
  
  /**
   * Subscribe to conversations changes - FIXED: removed Date.now() from channel name
   * OPTIMIZED: Only update local state, don't refetch everything
   */
  useEffect(() => {
    if (!userId) return;
    
    // ✅ FIX CRÍTICO: NO usar Date.now() - causa canales duplicados infinitos
    const channelName = `chat_participants_${userId}`;
    
    // Subscribe to participant changes (for unread count, etc.)
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE', // Solo escuchar UPDATE (no INSERT/DELETE para evitar loops)
          schema: 'public',
          table: 'chat_participants',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[useChat] 📡 Participant updated:', payload);
          
          // 🔥 FIX: NO hacer fetchConversations - causa 1000+ queries
          // Solo actualizar el estado local con los nuevos datos
          const updated = payload.new as ChatParticipant;
          
          setConversations(prev => prev.map(conv => {
            if (conv.id === updated.conversation_id) {
              return {
                ...conv,
                unread_count: updated.unread_count,
                is_pinned: updated.is_pinned,
                is_muted: updated.is_muted
              };
            }
            return conv;
          }));
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
  
  /**
   * Subscribe to messages for active conversation - FIXED: removed Date.now() from channel names
   */
  useEffect(() => {
    if (!userId || !activeConversationId) return;
    
    console.log('[useChat] 🔔 Setting up realtime subscription for conversation:', activeConversationId);
    
    // ✅ FIX CRÍTICO: NO usar Date.now() - causa canales duplicados infinitos
    // Usar solo IDs estáticos para evitar re-crear el canal en cada render
    const channelName = `chat_messages_${activeConversationId}`;
    
    // Subscribe to new messages
    const messagesChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        async (payload) => {
          console.log('[useChat] 📨 New message received:', payload.new);
          
          // Fetch full message with sender info
          const { data: newMessage } = await supabase
            .from('chat_messages')
            .select(`
              id,
              conversation_id,
              sender_id,
              content,
              type,
              attachments,
              sent_at,
              delivered_at,
              read_by,
              reply_to_id,
              edited_at,
              deleted_at,
              metadata,
              created_at,
              updated_at,
              sender:profiles(id, full_name, email, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();
          
          console.log('[useChat] 📨 Full message data:', newMessage);
          
          if (newMessage) {
            // ✅ Mapear content → body para compatibilidad UI
            const mappedMessage = {
              ...newMessage,
              body: newMessage.content,
              reply_to: newMessage.reply_to_id,
            };
            
            // 🔥 FIX: Solo agregar mensajes de OTROS usuarios
            // Los mensajes propios ya se agregaron con optimistic update
            if (mappedMessage.sender_id === userId) {
              console.log('[useChat] ⏭️ Skipping own message (already added optimistically)');
              return;
            }
            
            // Agregar mensaje de otro usuario
            // Evitar duplicados: verificar si el mensaje ya existe
            setMessages(prev => {
              const existingMessages = prev[activeConversationId] || [];
              const messageExists = existingMessages.some(m => m.id === mappedMessage.id);
              
              if (messageExists) {
                console.log('[useChat] ⚠️ Message already exists, skipping duplicate');
                return prev;
              }
              
              console.log('[useChat] ✅ Adding new message from other user to state');
              return {
                ...prev,
                [activeConversationId]: [
                  ...existingMessages,
                  mappedMessage,
                ],
              };
            });
            
            // Mark as read SOLO si el mensaje es de otro usuario (con debounce)
            if (mappedMessage.sender_id !== userId) {
              console.log('[useChat] 👀 Scheduling debounced mark as read');
              debouncedMarkAsRead(activeConversationId, mappedMessage.id);
            }
            
            // 🔥 OPTIMIZACIÓN: NO hacer fetchConversations completo
            // Solo actualizar last_message_at y preview en el estado local
            setConversations(prev => prev.map(conv => {
              if (conv.id === activeConversationId) {
                return {
                  ...conv,
                  last_message_at: mappedMessage.sent_at,
                  last_message_preview: mappedMessage.content.substring(0, 100),
                  last_message_sender_id: mappedMessage.sender_id,
                };
              }
              return conv;
            }).sort((a, b) => {
              // Re-ordenar por fecha (más reciente primero)
              const dateA = new Date(a.last_message_at).getTime();
              const dateB = new Date(b.last_message_at).getTime();
              return dateB - dateA;
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        (payload) => {
          console.log('[useChat] ✏️ Message updated:', payload.new);
          
          setMessages(prev => ({
            ...prev,
            [activeConversationId]: prev[activeConversationId]?.map(msg =>
              msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
            ) || [],
          }));
        }
      )
      .subscribe((status) => {
        console.log('[useChat] 📡 Messages channel status:', status);
      });
    
    // ✅ FIX CRÍTICO: NO usar Date.now() - causa canales duplicados infinitos
    const typingChannelName = `chat_typing_${activeConversationId}`;
    const typingChannel = supabase
      .channel(typingChannelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_typing_indicators',
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        () => {
          fetchTypingIndicators(activeConversationId); // Safe: fetchTypingIndicators is stable
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(typingChannel);
      
      // Limpiar debounce timeout
      if (markAsReadTimeoutRef.current) {
        clearTimeout(markAsReadTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, activeConversationId]); // ✅ Callbacks are stable (useCallback) - intentionally excluded
  
  // ============================================================================
  // INITIAL LOAD
  // ============================================================================
  
  useEffect(() => {
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ Solo ejecutar al montar - fetchConversations es estable
  
  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId);
      fetchTypingIndicators(activeConversationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId]); // ✅ Callbacks excluidos - son estables
  
  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  
  const activeConversation = conversations.find(c => c.id === activeConversationId) || null;
  const activeMessages = activeConversationId ? messages[activeConversationId] || [] : [];
  const activeTypingUsers = activeConversationId ? typingUsers[activeConversationId] || [] : [];
  const totalUnreadCount = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
  
  // ============================================================================
  // RETURN
  // ============================================================================
  
  return {
    // State
    conversations,
    activeConversation,
    activeMessages,
    activeTypingUsers,
    totalUnreadCount,
    loading,
    error,
    
    // Actions
    setActiveConversationId,
    createOrGetConversation,
    sendMessage,
    markMessagesAsRead,
    updateTypingIndicator,
    editMessage,
    deleteMessage,
    toggleArchiveConversation,
    toggleMuteConversation,
    togglePinConversation,
    fetchConversations,
    fetchMessages,
  };
}
