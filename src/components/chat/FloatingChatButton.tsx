import React, { useState } from 'react'
import { MessageSquare, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SimpleChatLayout } from '@/components/chat/SimpleChatLayout'
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
  
  // Abrir chat cuando se proporciona conversación inicial
  React.useEffect(() => {
    console.log('[FloatingChatButton] initialConversationId changed:', initialConversationId)
    if (initialConversationId) {
      console.log('[FloatingChatButton] Opening chat for conversation:', initialConversationId)
      setIsOpen(true)
    }
  }, [initialConversationId])
  
  // Notificar cambios en estado de apertura
  React.useEffect(() => {
    onOpenChange?.(isOpen)
  }, [isOpen, onOpenChange])

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
          aria-label="Abrir chat"
        >
          <MessageSquare className="h-6 w-6 group-hover:scale-110 transition-transform" />
          {/* Badge de notificaciones (opcional - implementar después) */}
          {/* <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            3
          </span> */}
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
            onClick={() => setIsOpen(false)}
            onKeyDown={(e) => e.key === 'Escape' && setIsOpen(false)}
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
                onClick={() => setIsOpen(false)}
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
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
