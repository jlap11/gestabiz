import React, { useEffect, useRef, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { FileIcon, Paperclip, Send, Smile, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { FileUpload } from './FileUpload'
import type { MessageWithSender } from '@/hooks/useMessages'
import type { ChatAttachment } from '@/hooks/useChat' // Temporal - future phase
import { cn } from '@/lib/utils'
import { announce } from '@/lib/accessibility'

interface ChatInputProps {
  conversationId: string
  onSendMessage: (
    content: string,
    replyTo?: string,
    attachments?: ChatAttachment[]
  ) => Promise<void>
  onTypingChange?: (isTyping: boolean) => void
  replyToMessage?: MessageWithSender | null
  onCancelReply?: () => void
  disabled?: boolean
  placeholder?: string
}

/**
 * ChatInput Component
 *
 * Input de chat con:
 * - Textarea con auto-resize
 * - Botón enviar
 * - Botón adjuntar archivos (futuro)
 * - Preview de mensaje al que se responde
 * - Detección de Enter para enviar (Shift+Enter = nueva línea)
 * - Notificación de typing indicator
 */
export function ChatInput({
  conversationId,
  onSendMessage,
  onTypingChange,
  replyToMessage,
  onCancelReply,
  disabled = false,
  placeholder,
}: Readonly<ChatInputProps>) {
  const { t } = useLanguage()
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [attachments, setAttachments] = useState<ChatAttachment[]>([])
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-focus en textarea cuando se monta o cambia conversación
  useEffect(() => {
    if (textareaRef.current && !disabled) {
      textareaRef.current.focus()
    }
  }, [conversationId, disabled])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
    }
  }, [message])

  // Effective placeholder (use translated fallback when not provided)
  const effectivePlaceholder = placeholder ?? t('chat.inputPlaceholder')

  // Limpiar typing timeout al desmontar
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  /**
   * Manejar cambio en el textarea
   * Notifica typing indicator con debounce
   */
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setMessage(newValue)

    // Notificar typing indicator
    if (onTypingChange) {
      onTypingChange(true)

      // Reset timeout de typing
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      // Auto-stop typing después de 3 segundos sin escribir
      typingTimeoutRef.current = setTimeout(() => {
        onTypingChange(false)
      }, 3000)
    }
  }

  /**
   * Manejar upload completo
   */
  const handleUploadComplete = (uploaded: ChatAttachment[]) => {
    setAttachments(prev => [...prev, ...uploaded])
    setIsUploadOpen(false)
  }

  /**
   * Remover attachment
   */
  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  /**
   * Formatear tamaño de archivo
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  /**
   * Enviar mensaje
   */
  const handleSend = async () => {
    const trimmedMessage = message.trim()
    if ((!trimmedMessage && attachments.length === 0) || isSending) return

    try {
      setIsSending(true)

      // Detener typing indicator
      if (onTypingChange) {
        onTypingChange(false)
      }

      // Enviar mensaje con attachments
      await onSendMessage(
        trimmedMessage || '📎 Archivo adjunto',
        replyToMessage?.id,
        attachments.length > 0 ? attachments : undefined
      )

      // Limpiar input y attachments
      setMessage('')
      setAttachments([])

      // Cancelar reply
      if (onCancelReply) {
        onCancelReply()
      }
    } catch {
      // Error será manejado por el componente padre
      // El hook useChat ya muestra el error en el estado
    } finally {
      setIsSending(false)

      // Re-focus en textarea
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    }
  }

  /**
   * Manejar teclas de acceso
   * Enter solo = enviar
   * Shift+Enter = nueva línea
   * Esc = cancelar reply
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sin Shift: enviar
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
      return
    }

    // Esc: cancelar reply
    if (e.key === 'Escape' && replyToMessage) {
      e.preventDefault()
  onCancelReply?.()
  announce(t('chat.input.replyCancelled'), 'polite')
      textareaRef.current?.focus()
    }
  }

  return (
    <div className="border-t bg-background pb-[env(safe-area-inset-bottom)]">
      {/* Screen reader announcements */}
      <output className="sr-only" aria-live="polite" aria-atomic="true">
        {isSending && t('chat.input.sr.sending')}
        {attachments.length > 0 && t('chat.input.sr.attachments', { count: attachments.length })}
      </output>

      {/* Preview de mensaje al que se responde */}
      {replyToMessage && (
        <div className="px-3 py-2 sm:px-4 bg-muted/50 border-b flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-muted-foreground mb-0.5">
              {t('chat.input.replyingTo', { name: replyToMessage.sender?.full_name || t('chat.userAlt') })}
            </div>
            <p className="text-sm text-foreground line-clamp-1">
              {replyToMessage.body || t('chat.input.emptyMessage')}
            </p>
          </div>
          {onCancelReply && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:h-6 sm:w-6 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex-shrink-0"
              onClick={onCancelReply}
              aria-label={t('chat.input.cancelReplyAria')}
              title={t('chat.input.cancelReplyTitle')}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      )}

      {/* Preview de attachments seleccionados */}
      {attachments.length > 0 && (
        <div className="px-3 py-2 sm:px-4 bg-muted/30 border-b overflow-x-auto">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            {t('chat.input.attachments', { count: attachments.length })}
          </div>
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment, index) => (
              <div
                key={`${attachment.name}-${attachment.size}-${index}`}
                className="flex items-center gap-2 px-2 py-1 bg-background border rounded-md text-sm"
              >
                <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate max-w-[150px]">{attachment.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(attachment.size)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 sm:h-9 sm:w-9 p-0 hover:bg-destructive hover:text-destructive-foreground min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
                  onClick={() => handleRemoveAttachment(index)}
                  aria-label={t('chat.input.removeAttachmentAria', { name: attachment.name })}
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="px-3 py-2 sm:px-4 sm:py-3 flex items-end gap-1 sm:gap-2">
        {/* Botón adjuntar con Popover - oculto en móvil muy pequeño */}
        <Popover open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 hidden sm:flex"
              disabled={disabled}
              title={t('chat.input.attachTitle')}
              aria-label={t('chat.input.attachAria')}
              aria-haspopup="dialog"
              aria-expanded={isUploadOpen}
            >
              <Paperclip className="h-5 w-5" aria-hidden="true" />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="w-[95vw] sm:w-96 p-0">
            <FileUpload
              conversationId={conversationId}
              messageId={`temp-${Date.now()}`}
              onUploadComplete={handleUploadComplete}
              maxFiles={5}
              maxSizeMB={10}
            />
          </PopoverContent>
        </Popover>

        {/* Textarea */}
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={effectivePlaceholder}
          disabled={disabled || isSending}
          className={cn(
            'min-h-[44px] sm:min-h-[40px] max-h-[120px] sm:max-h-[160px] resize-none text-base sm:text-sm leading-tight overflow-y-auto',
            'focus-visible:ring-1'
          )}
          rows={1}
          aria-label={t('chat.input.ariaLabel')}
          aria-describedby="chat-input-hint"
          aria-multiline="true"
        />

        {/* Botón emoji (futuro) - oculto en móvil */}
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 hidden sm:flex"
          disabled={disabled}
          title={t('chat.input.emojisComingSoon')}
          aria-label={t('chat.input.emojisAria')}
        >
          <Smile className="h-5 w-5" aria-hidden="true" />
        </Button>

        {/* Botón enviar - más grande en móvil */}
        <Button
          onClick={handleSend}
          disabled={(!message.trim() && attachments.length === 0) || disabled || isSending}
          size="icon"
          className="flex-shrink-0 h-11 w-11 sm:h-10 sm:w-10 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
          aria-label={isSending ? t('chat.input.sr.sending') : t('chat.send')}
          aria-busy={isSending}
        >
          <Send className="h-5 w-5" aria-hidden="true" />
        </Button>
      </div>

      {/* Hint de shortcuts - oculto en móvil */}
      <div id="chat-input-hint" className="hidden sm:block px-4 pb-2 text-xs text-muted-foreground">
        {t('chat.input.hint')}
        {replyToMessage && (
          <>
            {' '}
            · {t('chat.input.hintEsc')}
          </>
        )}
      </div>
    </div>
  )
}