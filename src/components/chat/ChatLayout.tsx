import React, { useEffect, useState } from 'react'
import { ConversationList } from './ConversationList'
import { ChatWindow } from './ChatWindow'
import { ChatErrorBoundary } from './ChatErrorBoundary'
import { useChat } from '@/hooks/useChat'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { logger } from '@/lib/logger'

interface ChatLayoutProps {
  userId: string
  businessId?: string
  initialConversationId?: string | null
  onNavigate?: (conversationId: string | null) => void
}

/**
 * ChatLayout Component (Refactorizado FASE 2)
 *
 * Layout principal del sistema de chat que integra:
 * - ConversationList (sidebar)
 * - ChatWindow (contenido principal)
 * - Hooks useConversations + useMessages (nueva arquitectura)
 *
 * Props:
 * - userId: ID del usuario actual (requerido)
 * - businessId: ID del negocio (opcional, filtra conversaciones)
 * - initialConversationId: Conversación inicial a mostrar (opcional)
 * - onNavigate: Callback cuando se selecciona una conversación (opcional)
 */
export function ChatLayout({
  userId,
  businessId,
  initialConversationId = null,
  onNavigate,
}: ChatLayoutProps) {
  // State para conversación activa
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    initialConversationId
  )

  // Hook de chat unificado
  const {
    conversations,
    activeMessages,
    activeConversation: hookActiveConversation,
    activeTypingUsers,
    loading,
    error,
    sendMessage,
    markMessagesAsRead,
    setActiveConversationId: hookSetActiveConversation,
    fetchConversations,
    fetchMessages,
    editMessage,
    deleteMessage,
    toggleArchiveConversation,
    toggleMuteConversation,
    togglePinConversation,
  } = useChat(userId)

  // Conversación activa (del array de conversaciones o del hook)
  const activeConversation =
    hookActiveConversation || conversations.find(c => c.id === activeConversationId) || null
  const messages = activeMessages || []

  // Debug: Log conversations array changes
  useEffect(() => {
    logger.info('[ChatLayout] conversations state changed', {
      count: conversations.length,
      activeConversationId,
      activeConversation,
    })
  }, [conversations, activeConversationId, activeConversation])

  // Sincronizar conversationId inicial
  useEffect(() => {
    logger.info('[ChatLayout] initialConversationId changed', { initialConversationId })
    if (initialConversationId) {
      logger.info('[ChatLayout] Setting active conversation', { conversationId: initialConversationId })
      setActiveConversationId(initialConversationId)
      // ✅ También setear en el hook para cargar los mensajes
      hookSetActiveConversation(initialConversationId)
    }
  }, [initialConversationId, hookSetActiveConversation])

  // Fetch conversaciones inicial y suscribir a cambios
  useEffect(() => {
    if (userId) {
      fetchConversations()
    }

    return () => {
      // No-op: useChat maneja suscripciones internas
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, businessId]) // ✅ Callbacks excluidos para evitar re-subscripciones

  // Suscribir a mensajes cuando cambia conversación activa
  useEffect(() => {
    if (activeConversationId) {
      // ✅ Cargar mensajes existentes (suscripciones las maneja useChat internamente)
      fetchMessages(activeConversationId)
    }
  }, [activeConversationId, fetchMessages])

  // Marcar conversación como leída cuando se abre
  useEffect(() => {
    if (activeConversationId && messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage && lastMessage.sender_id !== userId) {
        // ✅ Usar markMessagesAsRead con debounce del hook
        markMessagesAsRead(activeConversationId, lastMessage.id)
      }
    }
  }, [activeConversationId, messages, userId, markMessagesAsRead])

  /**
   * Manejar selección de conversación
   */
  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id)
    if (onNavigate) {
      onNavigate(id)
    }
  }

  /**
   * Wrapper de sendMessage (adaptado a nueva interfaz)
   */
  const handleSendMessage = async (
    content: string,
    replyToId?: string,

    _attachments?: unknown
  ) => {
    if (!activeConversation) return

    await sendMessage({
      type: 'text',
      body: content,
      reply_to: replyToId,
    })
  }

  /**
   * Typing indicator (TODO: implementar en FASE futura)
   */

  const handleTypingChange = (_isTyping: boolean) => {
    // Por ahora no-op
  }

  /**
   * Wrapper de editMessage
   */
  const handleEditMessage = async (messageId: string, newContent: string) => {
    await editMessage(messageId, newContent)
  }

  /**
   * Wrapper de deleteMessage
   */
  const handleDeleteMessage = async (messageId: string) => {
    await deleteMessage(messageId)
  }

  /**
   * Wrapper de toggleArchive
   */
  const handleToggleArchive = async (convId: string, isArchived: boolean) => {
    await toggleArchiveConversation(convId, isArchived)

    // Si se archiva la conversación activa, limpiar selección
    if (isArchived && convId === activeConversation?.id) {
      setActiveConversationId(null)
      if (onNavigate) {
        onNavigate(null)
      }
    }
  }

  /**
   * Wrapper de toggleMute
   */
  const handleToggleMute = async (convId: string, isMuted: boolean) => {
    await toggleMuteConversation(convId, isMuted)
  }

  /**
   * Wrapper de togglePin (implementado)
   */
  const handleTogglePin = async (convId: string, isPinned: boolean) => {
    await togglePinConversation(convId, isPinned)
  }

  // Calcular total de mensajes sin leer
  const totalUnreadCount = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0)

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar: Lista de conversaciones */}
      <div className={`${activeConversation ? 'hidden md:block' : 'block'} md:w-80 md:flex-shrink-0 w-full`}>
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversation?.id || null}
          onSelectConversation={handleSelectConversation}
          totalUnreadCount={totalUnreadCount}
          loading={loading}
        />
      </div>

      {/* Contenido principal: Ventana de chat */}
      <div className={`${activeConversation ? 'block' : 'hidden'} md:block flex-1 flex flex-col`}>
        {/* Error alert (si existe) */}
        {error && (
          <Alert variant="destructive" className="rounded-none border-x-0 border-t-0">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => {
                  /* Error se limpia automáticamente */
                }}
                className="text-sm underline hover:no-underline"
              >
                Cerrar
              </button>
            </AlertDescription>
          </Alert>
        )}

        {/* Chat window */}
        <ChatErrorBoundary>
          <ChatWindow
            conversation={activeConversation as any}
            messages={messages as any}
            typingUsers={activeTypingUsers}
            currentUserId={userId}
            onSendMessage={handleSendMessage}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
            onTypingChange={handleTypingChange}
            onToggleArchive={handleToggleArchive}
            onToggleMute={handleToggleMute}
            onTogglePin={handleTogglePin}
            loading={loading}
            onBackToList={() => setActiveConversationId(null)}
          />
        </ChatErrorBoundary>
      </div>
    </div>
  )
}