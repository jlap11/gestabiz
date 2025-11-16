import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, Smile, FileIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FileUpload } from './FileUpload';
import type { MessageWithSender } from '@/hooks/useMessages';
import type { ChatAttachment } from '@/hooks/useChat'; // Temporal - future phase
import { cn } from '@/lib/utils';
import { announce } from '@/lib/accessibility';

interface ChatInputProps {
  conversationId: string;
  onSendMessage: (content: string, replyTo?: string, attachments?: ChatAttachment[]) => Promise<void>;
  onTypingChange?: (isTyping: boolean) => void;
  replyToMessage?: MessageWithSender | null;
  onCancelReply?: () => void;
  disabled?: boolean;
  placeholder?: string;
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
  placeholder = 'Escribe un mensaje...'
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-focus en textarea cuando se monta o cambia conversación
  useEffect(() => {
    if (textareaRef.current && !disabled) {
      textareaRef.current.focus();
    }
  }, [conversationId, disabled]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Limpiar typing timeout al desmontar
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Manejar cambio en el textarea
   * Notifica typing indicator con debounce
   */
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setMessage(newValue);

    // Notificar typing indicator
    if (onTypingChange) {
      onTypingChange(true);

      // Reset timeout de typing
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Auto-stop typing después de 3 segundos sin escribir
      typingTimeoutRef.current = setTimeout(() => {
        onTypingChange(false);
      }, 3000);
    }
  };

  /**
   * Manejar upload completo
   */
  const handleUploadComplete = (uploaded: ChatAttachment[]) => {
    setAttachments((prev) => [...prev, ...uploaded]);
    setIsUploadOpen(false);
  };

  /**
   * Remover attachment
   */
  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * Formatear tamaño de archivo
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  /**
   * Enviar mensaje
   */
  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if ((!trimmedMessage && attachments.length === 0) || isSending) return;

    try {
      setIsSending(true);

      // Detener typing indicator
      if (onTypingChange) {
        onTypingChange(false);
      }

      // Enviar mensaje con attachments
      await onSendMessage(
        trimmedMessage || 'Archivo adjunto',
        replyToMessage?.id,
        attachments.length > 0 ? attachments : undefined
      );

      // Limpiar input y attachments
      setMessage('');
      setAttachments([]);

      // Cancelar reply
      if (onCancelReply) {
        onCancelReply();
      }
    } catch {
      // Error será manejado por el componente padre
      // El hook useChat ya muestra el error en el estado
    } finally {
      setIsSending(false);

      // Re-focus en textarea
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  /**
   * Manejar teclas de acceso
   * Enter solo = enviar
   * Shift+Enter = nueva línea
   * Esc = cancelar reply
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sin Shift: enviar
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
      return;
    }
    
    // Esc: cancelar reply
    if (e.key === 'Escape' && replyToMessage) {
      e.preventDefault();
      onCancelReply?.();
      announce('Respuesta cancelada', 'polite');
      textareaRef.current?.focus();
    }
  };

  return (
    <div className="border-t bg-background">
      {/* Screen reader announcements */}
      <output className="sr-only" aria-live="polite" aria-atomic="true">
        {isSending && 'Enviando mensaje...'}
        {attachments.length > 0 && `${attachments.length} archivo${attachments.length > 1 ? 's' : ''} adjunto${attachments.length > 1 ? 's' : ''}`}
      </output>
      
      {/* Preview de mensaje al que se responde */}
      {replyToMessage && (
        <div className="px-3 py-2 sm:px-4 bg-muted/50 border-b flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-muted-foreground mb-0.5">
              Respondiendo a {replyToMessage.sender?.full_name || 'Usuario'}
            </div>
            <p className="text-sm text-foreground line-clamp-1">
              {replyToMessage.body || '(mensaje sin contenido)'}
            </p>
          </div>
          {onCancelReply && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:h-6 sm:w-6 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex-shrink-0"
              onClick={onCancelReply}
              aria-label="Cancelar respuesta"
              title="Cancelar respuesta (Esc)"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      )}

      {/* Preview de attachments seleccionados */}
      {attachments.length > 0 && (
        <div className="px-3 py-2 sm:px-4 bg-muted/30 border-b">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            Archivos adjuntos ({attachments.length})
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
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => handleRemoveAttachment(index)}
                  aria-label={`Eliminar archivo ${attachment.name}`}
                >
                  <X className="h-3 w-3" aria-hidden="true" />
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
              className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 hidden xs:flex"
              disabled={disabled}
              title="Adjuntar archivo"
              aria-label="Adjuntar archivo"
              aria-haspopup="dialog"
              aria-expanded={isUploadOpen}
            >
              <Paperclip className="h-5 w-5" aria-hidden="true" />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="w-80 sm:w-96 p-0">
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
          placeholder={placeholder}
          disabled={disabled || isSending}
          className={cn(
            'min-h-[44px] sm:min-h-[40px] max-h-[120px] resize-none text-base',
            'focus-visible:ring-1'
          )}
          rows={1}
          aria-label="Escribe un mensaje"
          aria-describedby="chat-input-hint"
          aria-multiline="true"
        />

        {/* Botón emoji (futuro) - oculto en móvil */}
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 hidden sm:flex"
          disabled={disabled}
          title="Emojis (próximamente)"
          aria-label="Agregar emoji (próximamente)"
        >
          <Smile className="h-5 w-5" aria-hidden="true" />
        </Button>

        {/* Botón enviar - más grande en móvil */}
        <Button
          onClick={handleSend}
          disabled={(!message.trim() && attachments.length === 0) || disabled || isSending}
          size="icon"
          className="flex-shrink-0 h-10 w-10 sm:h-10 sm:w-10 min-h-[48px] min-w-[48px] sm:min-h-0 sm:min-w-0"
          aria-label={isSending ? 'Enviando mensaje...' : 'Enviar mensaje'}
          aria-busy={isSending}
        >
          <Send className="h-5 w-5" aria-hidden="true" />
        </Button>
      </div>

      {/* Hint de shortcuts - oculto en móvil */}
      <div id="chat-input-hint" className="hidden sm:block px-4 pb-2 text-xs text-muted-foreground">
        <kbd className="px-1 py-0.5 bg-muted rounded">Enter</kbd> para enviar ·{' '}
        <kbd className="px-1 py-0.5 bg-muted rounded">Shift+Enter</kbd> para nueva línea
        {replyToMessage && (
          <>
            {' '}· <kbd className="px-1 py-0.5 bg-muted rounded">Esc</kbd> para cancelar respuesta
          </>
        )}
      </div>
    </div>
  );
}
