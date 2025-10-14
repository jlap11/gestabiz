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
 * @author AppointSync Pro Team
 * @version 2.0.0
 * @date 2025-10-13
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { trackChatEvent, ChatEvents } from '@/lib/analytics';

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
      
      // Fetch conversations with participant info
      const { data: participantsData, error: participantsError } = await supabase
        .from('chat_participants')
        .select(`
          *,
          conversation:chat_conversations(*)
        `)
        .eq('user_id', userId)
        .is('left_at', null)
        .order('conversation.last_message_at', { ascending: false });
      
      if (participantsError) throw participantsError;
      
      if (!participantsData) {
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
      
      setConversations(conversationsWithUsers as ChatConversation[]);
    } catch (err) {
      const error = err as Error;
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
          *,
          sender:profiles!sender_id(id, full_name, email, avatar_url),
          reply_to:chat_messages!reply_to_id(id, content, sender_id)
        `)
        .eq('conversation_id', conversationId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (messagesError) throw messagesError;
      
      if (data) {
        // Reverse to show oldest first
        const sortedMessages = data.reverse();
        
        setMessages(prev => ({
          ...prev,
          [conversationId]: sortedMessages,
        }));
      }
    } catch (err) {
      const error = err as Error;
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
          user:profiles!user_id(id, full_name, email, avatar_url)
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
          sender:profiles!sender_id(id, full_name, email, avatar_url)
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
   * Mark messages as read
   */
  const markMessagesAsRead = useCallback(async (conversationId: string, lastMessageId?: string) => {
    if (!userId) return;
    
    try {
      const { data: count, error: rpcError } = await supabase
        .rpc('mark_messages_as_read', {
          p_conversation_id: conversationId,
          p_user_id: userId,
          p_last_message_id: lastMessageId || null,
        });
      
      if (rpcError) throw rpcError;
      
      // Update local unread count
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, unread_count: 0 }
            : conv
        )
      );
      
      return count;
    } catch (err: any) {
      console.error('Error marking messages as read:', err);
    }
  }, [userId]);
  
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
   * Subscribe to conversations changes - FIXED: removed fetchConversations from dependencies
   */
  useEffect(() => {
    if (!userId) return;
    
    // Create unique channel name
    const channelName = `chat_participants_${userId}_${Date.now()}`;
    
    // Subscribe to participant changes (for unread count, etc.)
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_participants',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[Realtime] Chat participant change:', payload.eventType);
          fetchConversations(); // Safe: fetchConversations is stable (useCallback)
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Chat participants subscription status:', status);
      });
    
    return () => {
      console.log('[Realtime] Cleaning up chat participants channel');
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // ✅ fetchConversations is stable (useCallback) - intentionally excluded
  
  /**
   * Subscribe to messages for active conversation - FIXED: removed callbacks from dependencies
   */
  useEffect(() => {
    if (!userId || !activeConversationId) return;
    
    // Create unique channel name
    const channelName = `chat_messages_${activeConversationId}_${Date.now()}`;
    
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
          console.log('[Realtime] New chat message:', payload.new.id);
          
          // Fetch full message with sender info
          const { data: newMessage } = await supabase
            .from('chat_messages')
            .select(`
              *,
              sender:profiles!sender_id(id, full_name, email, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();
          
          if (newMessage && newMessage.sender_id !== userId) {
            setMessages(prev => ({
              ...prev,
              [activeConversationId]: [
                ...(prev[activeConversationId] || []),
                newMessage,
              ],
            }));
            
            // Mark as read if conversation is active
            markMessagesAsRead(activeConversationId, newMessage.id);
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
          console.log('[Realtime] Message updated:', payload.new.id);
          setMessages(prev => ({
            ...prev,
            [activeConversationId]: prev[activeConversationId]?.map(msg =>
              msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
            ) || [],
          }));
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Chat messages subscription status:', status);
      });
    
    // Subscribe to typing indicators
    const typingChannelName = `chat_typing_${activeConversationId}_${Date.now()}`;
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
        (payload) => {
          console.log('[Realtime] Typing indicator change:', payload.eventType);
          fetchTypingIndicators(activeConversationId); // Safe: fetchTypingIndicators is stable
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Typing indicators subscription status:', status);
      });
    
    return () => {
      console.log('[Realtime] Cleaning up chat messages and typing channels');
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(typingChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, activeConversationId]); // ✅ Callbacks are stable (useCallback) - intentionally excluded
  
  // ============================================================================
  // INITIAL LOAD
  // ============================================================================
  
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);
  
  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId);
      fetchTypingIndicators(activeConversationId);
    }
  }, [activeConversationId, fetchMessages, fetchTypingIndicators]);
  
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
