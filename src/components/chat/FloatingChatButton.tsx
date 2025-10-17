import React, { useState } from 'react'
import { MessageSquare, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SimpleChatLayout } from '@/components/chat/SimpleChatLayout'
import { useInAppNotifications } from '@/hooks/useInAppNotifications'
import { useNotificationContext } from '@/contexts/NotificationContext'
import { cn } from '@/lib/utils'

interface FloatingChatButtonProps {
  userId: string
  businessId?: string
  initialConversationId?: string | null
  onOpenChange?: (isOpen: boolean) => void
}

export function FloatingChatButton({ 
  userId, 
  businessId,
  initialConversationId = null,
  onOpenChange
}: FloatingChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Contexto de notificaciones
  const { setChatOpen } = useNotificationContext()
  
  // Obtener contador de notificaciones de chat con refetch
  const { unreadCount, refetch } = useInAppNotifications({
    userId,
    autoFetch: true,
    type: 'chat_message', // ✅ FIX: Tipo correcto del enum (sin _received)
    limit: 1
  })
  
  // Abrir chat cuando se proporciona conversación inicial
  React.useEffect(() => {
    if (initialConversationId) {
      setIsOpen(true)
    }
  }, [initialConversationId])
  
  // Notificar cambios en estado de apertura
  React.useEffect(() => {
    onOpenChange?.(isOpen)
    setChatOpen(isOpen) // ✨ Notificar al contexto global
  }, [isOpen, onOpenChange, setChatOpen])
  
  // 🔥 FIX: Refrescar contador al cerrar el chat
  const handleClose = React.useCallback(() => {
    setIsOpen(false)
    // Esperar 500ms para que las notificaciones se marquen como leídas en Supabase
    setTimeout(() => {
      refetch()
    }, 500)
  }, [refetch])
  
  // ✨ Refrescar badge cuando se marcan mensajes como leídos (en tiempo real)
  const handleMessagesRead = React.useCallback(() => {
    console.log('[FloatingChatButton] 🔄 Refetching badge after messages marked as read');
    refetch();
  }, [refetch]);

  return (
    <>
      {/* Botón Flotante */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            "fixed bottom-6 right-6 z-50",
            "w-14 h-14 rounded-full",
            "bg-primary text-primary-foreground",
            "shadow-lg hover:shadow-xl",
            "flex items-center justify-center",
            "transition-all duration-300",
            "hover:scale-110 active:scale-95",
            "group"
          )}
          aria-label={unreadCount > 0 ? `Abrir chat (${unreadCount} mensajes nuevos)` : 'Abrir chat'}
        >
          <MessageSquare className="h-6 w-6 group-hover:scale-110 transition-transform" />
          {/* Badge de notificaciones de chat */}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-[1.25rem] px-1 flex items-center justify-center text-xs animate-bounce"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </button>
      )}

      {/* Modal de Chat */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 md:p-6">
          {/* Overlay */}
          <div
            role="button"
            tabIndex={0}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={handleClose}
            onKeyDown={(e) => e.key === 'Escape' && handleClose()}
            aria-label="Cerrar chat"
          />

          {/* Ventana de Chat */}
          <div
            className={cn(
              "relative",
              "w-full h-full",
              "md:w-[500px] md:h-[700px]",
              "lg:w-[600px] lg:h-[750px]",
              "bg-card rounded-lg shadow-2xl",
              "overflow-hidden",
              "animate-in slide-in-from-bottom-4 md:slide-in-from-right-4 duration-300"
            )}
          >
            {/* Header */}
            <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between border-b">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                <h3 className="font-semibold">Chat</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-8 w-8 p-0 text-primary-foreground hover:bg-primary-foreground/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Chat Content */}
            <div className="h-[calc(100%-56px)]">
              <SimpleChatLayout 
                userId={userId} 
                businessId={businessId}
                initialConversationId={initialConversationId}
                onMessagesRead={handleMessagesRead}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
