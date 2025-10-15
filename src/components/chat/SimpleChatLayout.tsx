import React, { useEffect, useState, useRef } from 'react';
import { useChat } from '@/hooks/useChat';
import { ChatWindow } from './ChatWindow';
import { ConversationList } from './ConversationList';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SimpleChatLayoutProps {
  userId: string;
  businessId?: string;
  initialConversationId?: string | null;
}

/**
 * SimpleChatLayout - Layout simplificado usando useChat con vista móvil
 * 
 * Este componente usa las tablas chat_* (chat_conversations, chat_participants, chat_messages)
 * Muestra lista de conversaciones O chat activo, nunca ambos simultáneamente
 */
export function SimpleChatLayout({ 
  userId, 
  businessId,
  initialConversationId 
}: SimpleChatLayoutProps) {
  const {
    conversations,
    activeMessages,
    activeConversation,
    loading,
    error,
    sendMessage,
    markMessagesAsRead,
    setActiveConversationId,
    fetchConversations,
  } = useChat(userId);

  // Estado para controlar si mostramos lista o chat
  const [showChat, setShowChat] = useState(false);
  
  // Ref para el contenedor de mensajes (para auto-scroll)
  const messagesEndRef = useRef<HTMLDivElement>(null);

  console.log('[SimpleChatLayout] userId:', userId);
  console.log('[SimpleChatLayout] initialConversationId:', initialConversationId);
  console.log('[SimpleChatLayout] conversations:', conversations);
  console.log('[SimpleChatLayout] activeConversation:', activeConversation);
  console.log('[SimpleChatLayout] showChat:', showChat);

  // Función para hacer scroll al final
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch inicial
  useEffect(() => {
    console.log('[SimpleChatLayout] Fetching conversations...');
    fetchConversations();
  }, [fetchConversations]);

  // Set conversación inicial y mostrar chat
  useEffect(() => {
    if (initialConversationId) {
      console.log('[SimpleChatLayout] Setting active conversation:', initialConversationId);
      setActiveConversationId(initialConversationId);
      setShowChat(true);
    }
  }, [initialConversationId, setActiveConversationId]);

  // Auto-scroll cuando llegan nuevos mensajes
  useEffect(() => {
    if (activeMessages.length > 0) {
      console.log('[SimpleChatLayout] 📜 New messages detected, scrolling to bottom');
      // Pequeño delay para asegurar que el DOM se haya actualizado
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [activeMessages]);

  // Auto-scroll cuando se abre una conversación
  useEffect(() => {
    if (showChat && activeConversation) {
      console.log('[SimpleChatLayout] 📜 Conversation opened, scrolling to bottom');
      // Delay más largo para la primera carga (esperar fetch de mensajes)
      setTimeout(() => {
        scrollToBottom();
      }, 300);
    }
  }, [showChat, activeConversation]);

  // Marcar como leído
  useEffect(() => {
    if (activeConversation && activeMessages.length > 0) {
      const timeout = setTimeout(() => {
        const lastMessage = activeMessages[activeMessages.length - 1];
        if (lastMessage) {
          markMessagesAsRead(activeConversation.id, lastMessage.id);
        }
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [activeConversation, activeMessages, markMessagesAsRead]);

  const handleSendMessage = async (content: string) => {
    if (!activeConversation) return;
    
    try {
      await sendMessage({
        conversation_id: activeConversation.id,
        content,
        type: 'text',
      });
    } catch (error) {
      console.error('[SimpleChatLayout] Error sending message:', error);
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    setShowChat(true); // Mostrar chat al seleccionar conversación
  };

  const handleBackToList = () => {
    setShowChat(false);
    setActiveConversationId(null); // Limpiar conversación activa
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex h-full">
      {/* Lista de conversaciones - Solo visible cuando !showChat */}
      {!showChat && (
        <div className="w-full bg-card">
          <div className="border-b border-border bg-card px-4 py-3">
            <h2 className="font-semibold text-lg">Conversaciones</h2>
          </div>

          {loading && conversations.length === 0 ? (
            <div className="flex items-center justify-center h-full py-8">
              <div className="text-muted-foreground">Cargando...</div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8">
              <div className="text-muted-foreground text-center">
                <p className="font-semibold mb-2">No hay conversaciones</p>
                <p className="text-sm">Aún no tienes conversaciones activas</p>
              </div>
            </div>
          ) : (
            <div className="overflow-y-auto">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className="w-full p-4 text-left border-b border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="font-semibold">
                    {conv.other_user?.full_name || conv.title || 'Conversación'}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {conv.last_message_preview || 'Sin mensajes'}
                  </div>
                  {conv.unread_count ? (
                    <div className="mt-1">
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-primary rounded-full">
                        {conv.unread_count}
                      </span>
                    </div>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ventana de chat - Solo visible cuando showChat */}
      {showChat && (
        <div className="w-full flex flex-col">
          {activeConversation ? (
            <>
              {/* Header con botón Back */}
              <div className="border-b border-border bg-card px-4 py-3 flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBackToList}
                  className="shrink-0"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">
                    {activeConversation.other_user?.full_name || activeConversation.title || 'Chat'}
                  </div>
                  {activeConversation.other_user?.email && (
                    <div className="text-sm text-muted-foreground truncate">
                      {activeConversation.other_user.email}
                    </div>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No hay mensajes. ¡Envía el primero!
                  </div>
                ) : (
                  <>
                    {activeMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender_id === userId ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg px-4 py-2 ${
                            message.sender_id === userId
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          {message.sender_id !== userId && message.sender && (
                            <div className="text-xs font-semibold mb-1">
                              {message.sender.full_name || message.sender.email}
                            </div>
                          )}
                          <div className="break-words">{message.content}</div>
                          <div className="text-xs opacity-70 mt-1">
                            {new Date(message.sent_at).toLocaleTimeString('es', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                    {/* Elemento invisible para auto-scroll */}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input */}
              <div className="border-t border-border bg-card p-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const input = e.currentTarget.elements.namedItem('message') as HTMLInputElement;
                    if (input.value.trim()) {
                      handleSendMessage(input.value.trim());
                      input.value = '';
                    }
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    name="message"
                    placeholder="Escribe un mensaje..."
                    className="flex-1 px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    autoComplete="off"
                  />
                  <Button
                    type="submit"
                    className="px-6"
                  >
                    Enviar
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p className="font-semibold mb-2">Cargando conversación...</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
