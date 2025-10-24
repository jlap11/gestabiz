import React, { useEffect, useRef, useState } from 'react'
import { MoreVertical, Phone, Search as SearchIcon, Video, ArrowLeft } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { TypingIndicator } from './TypingIndicator'
import { ChatComponentErrorBoundary } from './ChatErrorBoundary'
// Import types from new architecture
import type { ConversationPreview } from '@/hooks/useConversations'
import type { MessageWithSender } from '@/hooks/useMessages'
// Import temporary types until TypingIndicator and ChatInput are refactored
import type { ChatAttachment, ChatTypingUser } from '@/hooks/useChat'

interface ChatWindowProps {
  conversation: ConversationPreview | null
  messages: MessageWithSender[]
  typingUsers: ChatTypingUser[]
  currentUserId: string
  onSendMessage: (
    content: string,
    replyToId?: string,
    attachments?: ChatAttachment[]
  ) => Promise<void>
  onEditMessage?: (messageId: string, newContent: string) => Promise<void>
  onDeleteMessage?: (messageId: string) => Promise<void>
  onTypingChange?: (isTyping: boolean) => void
  onToggleArchive?: (conversationId: string, isArchived: boolean) => void
  onToggleMute?: (conversationId: string, isMuted: boolean) => void
  onTogglePin?: (conversationId: string, isPinned: boolean) => void
  loading?: boolean
  onBackToList?: () => void
}

/**
 * ChatWindow Component
 *
 * Ventana principal de chat con:
 * - Header con info del otro usuario y acciones
 * - ScrollArea con historial de mensajes
 * - Auto-scroll al recibir mensaje nuevo
 * - Typing indicator
 * - ChatInput en footer
 * - Soporte de editar/eliminar mensajes
 * - Responder a mensajes
 */
export function ChatWindow({
  conversation,
  messages,
  typingUsers,
  currentUserId,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onTypingChange,
  onToggleArchive,
  onToggleMute,
  onTogglePin,
  loading = false,
  onBackToList,
}: Readonly<ChatWindowProps>) {
  const { t } = useLanguage()
  const [replyToMessage, setReplyToMessage] = useState<MessageWithSender | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  /**
   * Filtrar mensajes según query de búsqueda (usa 'body' en vez de 'content')
   */
  const filteredMessages = searchQuery.trim()
    ? messages.filter(msg => msg.body?.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages

  // Auto-scroll al recibir mensaje nuevo
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length])

  // Reset reply/edit al cambiar conversación
  useEffect(() => {
    setReplyToMessage(null)
    setEditingMessageId(null)
  }, [conversation?.id])

  /**
   * Manejar responder a mensaje
   */
  const handleReply = (message: MessageWithSender) => {
    setReplyToMessage(message)
    setEditingMessageId(null)
  }

  /**
   * Manejar editar mensaje
   */
  const handleEdit = (messageId: string) => {
    setEditingMessageId(messageId)
    setReplyToMessage(null)
  }

  /**
   * Manejar eliminar mensaje
   */
  const handleDelete = async (messageId: string) => {
    if (!onDeleteMessage) return

    const confirmed = window.confirm('¿Estás seguro de que quieres eliminar este mensaje?')
    if (confirmed) {
      await onDeleteMessage(messageId)
    }
  }

  /**
   * Manejar envío de mensaje
   */
  const handleSend = async (
    content: string,
    replyToId?: string,
    attachments?: ChatAttachment[]
  ) => {
    if (editingMessageId && onEditMessage) {
      // Modo edición
      await onEditMessage(editingMessageId, content)
      setEditingMessageId(null)
    } else {
      // Modo envío normal
      await onSendMessage(content, replyToId, attachments)
      setReplyToMessage(null)
    }
  }

  // Estado vacío
  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-lg font-semibold mb-2">Selecciona una conversación</h3>
          <p className="text-muted-foreground">
            Elige una conversación de la lista para empezar a chatear
          </p>
        </div>
      </div>
    )
  }

  // Obtener título y datos del otro usuario
  // Para directos usa display_name (nombre personalizado) o fallback a other_user
  // Para grupos usa name
  const title =
    conversation.type === 'direct'
      ? conversation.display_name ||
        conversation.other_user?.full_name ||
        conversation.other_user?.email ||
        'Usuario'
      : conversation.name || 'Grupo'

  const otherUser = conversation.other_user
  const initials = title
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background p-3 sm:p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          {onBackToList && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9 mr-1"
              onClick={onBackToList}
              aria-label="Volver a lista"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <Avatar className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0">
            <AvatarImage src={otherUser?.avatar_url || undefined} alt={title} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sm sm:text-base truncate">{title}</h2>
            {otherUser?.email && (
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{otherUser.email}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Acciones futuras: llamada, videollamada - ocultas en móvil */}
          <Button
            variant="ghost"
            size="icon"
            disabled
            title="Llamada (próximamente)"
            className="hidden sm:flex h-9 w-9"
          >
            <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            disabled
            title="Videollamada (próximamente)"
            className="hidden sm:flex h-9 w-9"
          >
            <Video className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          {/* Botón búsqueda - toggle input */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => {
              setIsSearchOpen(!isSearchOpen)
              if (isSearchOpen) {
                setSearchQuery('')
              }
            }}
            title="Buscar en conversación"
            aria-label={isSearchOpen ? 'Cerrar búsqueda' : 'Buscar en mensajes'}
            aria-expanded={isSearchOpen}
          >
            <SearchIcon className="h-5 w-5" aria-hidden="true" />
          </Button>

          {/* Menú de opciones */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Opciones de conversación">
                <MoreVertical className="h-5 w-5" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onTogglePin && (
                <DropdownMenuItem
                  onClick={() => onTogglePin(conversation.id, !(conversation as any).is_pinned)}
                >
                  {(conversation as any).is_pinned ? 'Desfijar' : 'Fijar'} conversación
                </DropdownMenuItem>
              )}
              {onToggleMute && (
                <DropdownMenuItem
                  onClick={() => onToggleMute(conversation.id, !(conversation as any).is_muted)}
                >
                  {(conversation as any).is_muted ? 'Quitar silencio' : 'Silenciar'} conversación
                </DropdownMenuItem>
              )}
              {onToggleArchive && (
                <DropdownMenuItem
                  onClick={() => onToggleArchive(conversation.id, !conversation.is_archived)}
                  className="text-destructive"
                >
                  {conversation.is_archived ? 'Desarchivar' : 'Archivar'} conversación
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Barra de búsqueda (condicional) */}
      {isSearchOpen && (
        <div className="border-b bg-muted/30 px-3 py-2 sm:px-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar mensajes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm sm:text-base bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px]"
              autoFocus
              aria-label="Buscar mensajes en la conversación"
              aria-describedby={searchQuery ? 'search-results-count' : undefined}
            />
            {searchQuery && (
              <output
                id="search-results-count"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground"
                aria-live="polite"
              >
                {filteredMessages.length} resultado{filteredMessages.length !== 1 ? 's' : ''}
              </output>
            )}
          </div>
        </div>
      )}

      {/* Mensajes */}
      <ScrollArea
        ref={scrollAreaRef}
        className="flex-1 p-3 sm:p-4"
        role="log"
        aria-label="Historial de mensajes"
        aria-live="polite"
      >
        {loading && messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Cargando mensajes...</p>
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-4xl mb-2">👋</div>
              <p className="text-muted-foreground">No hay mensajes. ¡Envía el primero!</p>
            </div>
          </div>
        )}

        {/* Mostrar mensaje si hay búsqueda pero sin resultados */}
        {searchQuery && filteredMessages.length === 0 && messages.length > 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-4xl mb-2">🔍</div>
              <p className="text-muted-foreground">
                No se encontraron mensajes con "{searchQuery}"
              </p>
            </div>
          </div>
        )}

        {filteredMessages.length > 0 && (
          <div className="space-y-3 sm:space-y-4">
            {filteredMessages.map(message => (
              <ChatComponentErrorBoundary key={message.id} componentName="MessageBubble">
                <MessageBubble
                  message={message}
                  currentUserId={currentUserId}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onReply={handleReply}
                  searchQuery={searchQuery}
                />
              </ChatComponentErrorBoundary>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="mt-3 sm:mt-4">
            <ChatComponentErrorBoundary componentName="TypingIndicator">
              <TypingIndicator typingUsers={typingUsers} />
            </ChatComponentErrorBoundary>
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <ChatComponentErrorBoundary componentName="ChatInput">
        <ChatInput
          conversationId={conversation.id}
          onSendMessage={handleSend}
          onTypingChange={onTypingChange}
          replyToMessage={replyToMessage}
          onCancelReply={() => setReplyToMessage(null)}
          placeholder={getInputPlaceholder(editingMessageId, replyToMessage)}
        />
      </ChatComponentErrorBoundary>
    </div>
  )
}

/**
 * Helper para obtener placeholder del input
 */
function getInputPlaceholder(
  editingMessageId: string | null,
  replyToMessage: MessageWithSender | null
): string {
  if (editingMessageId) {
    return 'Editando mensaje...'
  }
  if (replyToMessage) {
    return 'Escribe tu respuesta...'
  }
  return 'Escribe un mensaje...'
}
