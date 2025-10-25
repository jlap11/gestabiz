// React
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// External libraries
import { FileIcon, Paperclip, Send, Smile, X } from 'lucide-react'

// UI Components
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'

// Internal components
import { FileUpload } from './FileUpload'

// Contexts
import { useLanguage } from '@/contexts/LanguageContext'

// Types
import type { ChatAttachment } from '@/hooks/useChat' // Temporal - future phase
import type { MessageWithSender } from '@/hooks/useMessages'

// Utilities
import { announce } from '@/lib/accessibility'
import { cn } from '@/lib/utils'

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
  const effectivePlaceholder = useMemo(() => 
    placeholder ?? t('chat.inputPlaceholder'), 
    [placeholder, t]
  )

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
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
  }, [onTypingChange])

  /**
   * Manejar upload completo
   */
  const handleUploadComplete = useCallback((uploaded: ChatAttachment[]) => {
    setAttachments(prev => [...prev, ...uploaded])
    setIsUploadOpen(false)
  }, [])

  /**
   * Remover attachment
   */
  const handleRemoveAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }, [])

  /**
   * Formatear tamaño de archivo
   */
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }, [])

  /**
   * Enviar mensaje
   */
  const handleSend = useCallback(async () => {
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
        trimmedMessage || t('chat.input.attachmentFallback'),
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
  }, [message, attachments, isSending, onTypingChange, onSendMessage, replyToMessage?.id, onCancelReply])

  /**
   * Manejar teclas de acceso
   * Enter solo = enviar
   * Shift+Enter = nueva línea
   * Esc = cancelar reply
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
  }, [handleSend, replyToMessage, onCancelReply, t])

  // Memoizar el estado de envío deshabilitado
  const isSendDisabled = useMemo(() => 
    (!message.trim() && attachments.length === 0) || disabled || isSending,
    [message, attachments.length, disabled, isSending]
  )

  // Memoizar las clases del textarea
  const textareaClasses = useMemo(() => cn(
    'min-h-[48px] sm:min-h-[40px] max-h-[120px] sm:max-h-[160px] resize-none text-base sm:text-sm leading-relaxed sm:leading-tight overflow-y-auto',
    'focus-visible:ring-1 touch-manipulation',
    'px-3 py-3 sm:px-3 sm:py-2'
  ), [])

  return (
    <div className="border-t bg-background pb-[env(safe-area-inset-bottom)] max-w-[100vw] overflow-hidden">
      {/* Screen reader announcements */}
      <output className="sr-only" aria-live="polite" aria-atomic="true">
        {isSending && t('chat.input.sr.sending')}
        {attachments.length > 0 && t('chat.input.sr.attachments', { count: attachments.length })}
      </output>

      {/* Preview de mensaje al que se responde - Mobile Optimized */}
      {replyToMessage && (
        <div className="px-3 py-2 sm:px-4 bg-muted/50 border-b flex items-start justify-between gap-2 min-h-[60px] sm:min-h-[auto]">
          <div className="flex-1 min-w-0">
            <div className="text-xs sm:text-xs font-medium text-muted-foreground mb-1 leading-tight">
              {t('chat.input.replyingTo', { name: replyToMessage.sender?.full_name || t('chat.userAlt') })}
            </div>
            <p className="text-sm sm:text-sm text-foreground line-clamp-2 sm:line-clamp-1 leading-tight">
              {replyToMessage.body || t('chat.input.emptyMessage')}
            </p>
          </div>
          {onCancelReply && (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 sm:h-8 sm:w-8 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 touch-manipulation"
              onClick={onCancelReply}
              aria-label={t('chat.input.cancelReplyAria')}
              title={t('chat.input.cancelReplyTitle')}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      )}

      {/* Preview de attachments seleccionados - Mobile Optimized */}
      {attachments.length > 0 && (
        <div className="px-3 py-2 sm:px-4 bg-muted/30 border-b overflow-x-auto">
          <div className="text-xs sm:text-xs font-medium text-muted-foreground mb-2 leading-tight">
            {t('chat.input.attachments', { count: attachments.length })}
          </div>
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment, index) => (
              <div
                key={`${attachment.name}-${attachment.size}-${index}`}
                className="flex items-center gap-2 px-2 py-1.5 sm:py-1 bg-background border rounded-lg text-sm min-h-[44px] sm:min-h-[auto] touch-manipulation"
              >
                <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate max-w-[120px] sm:max-w-[150px] text-xs sm:text-sm">{attachment.name}</span>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {formatFileSize(attachment.size)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 sm:h-6 sm:w-6 p-0 hover:bg-destructive hover:text-destructive-foreground min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 touch-manipulation"
                  onClick={() => handleRemoveAttachment(index)}
                  aria-label={t('chat.input.removeAttachmentAria', { name: attachment.name })}
                >
                  <X className="h-4 w-4 sm:h-3 sm:w-3" aria-hidden="true" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input area - Mobile Optimized */}
      <div className="px-3 py-3 sm:px-4 sm:py-3 flex items-end gap-2 sm:gap-2 min-h-[72px] sm:min-h-[auto]">
        {/* Botón adjuntar con Popover - visible en tablet+ */}
        <Popover open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0 h-10 w-10 sm:h-10 sm:w-10 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 hidden md:flex focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 touch-manipulation"
              disabled={disabled}
              title={t('chat.input.attachTitle')}
              aria-label={t('chat.input.attachAria')}
              aria-haspopup="dialog"
              aria-expanded={isUploadOpen}
            >
              <Paperclip className="h-5 w-5" aria-hidden="true" />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="w-[95vw] sm:w-96 p-0 max-w-[400px]">
            <FileUpload
              conversationId={conversationId}
              messageId={`temp-${Date.now()}`}
              onUploadComplete={handleUploadComplete}
              maxFiles={5}
              maxSizeMB={10}
            />
          </PopoverContent>
        </Popover>

        {/* Textarea - Mobile Optimized */}
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={effectivePlaceholder}
          disabled={disabled || isSending}
          className={cn(
            'min-h-[48px] sm:min-h-[40px] max-h-[120px] sm:max-h-[160px] resize-none text-base sm:text-sm leading-relaxed sm:leading-tight overflow-y-auto',
            'focus-visible:ring-1 touch-manipulation',
            'px-3 py-3 sm:px-3 sm:py-2'
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
          className="flex-shrink-0 h-10 w-10 sm:h-10 sm:w-10 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 hidden lg:flex focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 touch-manipulation"
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
          className="flex-shrink-0 h-12 w-12 sm:h-10 sm:w-10 min-h-[48px] min-w-[48px] sm:min-h-0 sm:min-w-0 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 touch-manipulation"
          aria-label={isSending ? t('chat.input.sr.sending') : t('chat.send')}
          aria-busy={isSending}
          title={isSending ? t('chat.input.sr.sending') : t('chat.send')}
        >
          <Send className="h-5 w-5 sm:h-5 sm:w-5" aria-hidden="true" />
        </Button>
      </div>

      {/* Hint de shortcuts - oculto en móvil */}
      <div id="chat-input-hint" className="hidden lg:block px-4 pb-2 text-xs text-muted-foreground">
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