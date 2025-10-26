import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Pencil, Reply, Trash2, Download } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageStatus } from './MessageStatus';
import { ImagePreview } from './ImagePreview';
import type { MessageWithSender } from '@/hooks/useMessages';
import { cn } from '@/lib/utils';
import { animations } from '@/lib/animations';

interface MessageBubbleProps {
  message: MessageWithSender;
  currentUserId: string;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onReply?: (message: MessageWithSender) => void;
  searchQuery?: string;
}

/**
 * Format file size helper
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Highlight text matches in search query
 */
function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, i) => {
    const isMatch = part.toLowerCase() === query.toLowerCase();
    return isMatch ? (
      <mark key={`${part}-${i}`} className="bg-yellow-300 dark:bg-yellow-600 rounded px-0.5">
        {part}
      </mark>
    ) : (
      <React.Fragment key={`${part}-${i}`}>{part}</React.Fragment>
    );
  });
}

/**
 * MessageBubble Component
 * 
 * Muestra un mensaje individual con:
 * - Avatar del sender (solo si es del otro usuario)
 * - Contenido del mensaje
 * - Timestamp
 * - Status (checkmarks para mensajes propios)
 * - Indicador de editado
 * - Preview de mensaje al que responde
 * - Acciones (editar, eliminar, responder) en hover
 */
export function MessageBubble({
  message,
  currentUserId,
  onEdit,
  onDelete,
  onReply,
  searchQuery = ''
}: MessageBubbleProps) {
  const isOwnMessage = message.sender_id === currentUserId;
  const isDeleted = message.is_deleted; // Nuevo campo: soft delete
  const isEdited = message.edited_at !== null; // Nuevo campo: edited_at

  // Obtener iniciales para avatar
  const senderName = message.sender?.full_name || message.sender?.email || 'U';
  const initials = senderName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Formatear timestamp (usa created_at en vez de sent_at)
  const timestamp = format(new Date(message.created_at), 'HH:mm', { locale: es });

  return (
    <article
      className={cn(
        'flex gap-2 group',
        isOwnMessage ? 'flex-row-reverse' : 'flex-row',
        animations.messageSlideIn // ✨ Animación de entrada
      )}
      aria-label={`Mensaje de ${senderName} enviado a las ${timestamp}`}
    >
      {/* Avatar (solo para mensajes de otros) */}
      {!isOwnMessage && (
        <Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0">
          <AvatarImage src={message.sender?.avatar_url || undefined} alt={senderName} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      )}

      {/* Contenedor del mensaje */}
      <div
        className={cn(
          'flex flex-col max-w-[85%] sm:max-w-[70%]',
          isOwnMessage ? 'items-end' : 'items-start'
        )}
      >
        {/* Preview de mensaje al que responde */}
        {message.reply_to_message && !isDeleted && (
          <div
            className={cn(
              'text-xs px-2 py-1 mb-1 rounded-lg border-l-2 max-w-full',
              isOwnMessage
                ? 'bg-primary/10 border-primary/50'
                : 'bg-muted border-muted-foreground/50'
            )}
          >
            <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
              <Reply className="h-3 w-3 flex-shrink-0" />
              <span className="font-medium truncate">
                {message.reply_to_message.sender_id === currentUserId
                  ? 'Tú'
                  : message.reply_to_message.sender?.full_name || 'Usuario'}
              </span>
            </div>
            <p className="line-clamp-2 text-foreground/80 break-words">
              {message.reply_to_message.body || '(mensaje sin contenido)'}
            </p>
          </div>
        )}

        {/* Burbuja del mensaje */}
        <div
          className={cn(
            'px-3 py-2 sm:px-4 rounded-2xl max-w-full',
            isOwnMessage
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-muted text-foreground rounded-bl-sm',
            isDeleted && 'opacity-50 italic'
          )}
        >
          {/* Indicador de mensaje fijado */}
          {message.is_pinned && !isDeleted && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <span className="font-medium">📌 Mensaje fijado</span>
            </div>
          )}

          {/* Contenido del mensaje con highlight (usa 'body' en vez de 'content') */}
          <p className="text-sm sm:text-base whitespace-pre-wrap break-words">
            {isDeleted 
              ? '🚫 Mensaje eliminado' 
              : highlightText(message.body || '', searchQuery)
            }
          </p>

          {/* Attachments desde metadata (JSONB) */}
          {message.metadata && !isDeleted && (
            <div className="mt-2 space-y-2">
              {/* Preview de imagen si existe */}
              {message.metadata.image_url && (
                <ImagePreview
                  key={message.metadata.image_url}
                  src={message.metadata.image_url}
                  alt="Imagen adjunta"
                  className="max-w-xs h-auto"
                />
              )}
              
              {/* Link de descarga para archivos */}
              {message.metadata.file_url && (
                <a
                  href={message.metadata.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs hover:underline group"
                  aria-label={`Descargar ${message.metadata.file_name || 'archivo'}`}
                >
                  <Download className="h-3 w-3" aria-hidden="true" />
                  <span className="truncate">{message.metadata.file_name || 'Archivo adjunto'}</span>
                  {message.metadata.file_size && (
                    <span className="text-muted-foreground">
                      ({formatFileSize(message.metadata.file_size)})
                    </span>
                  )}
                </a>
              )}
            </div>
          )}

          {/* Footer: timestamp, status, indicador de editado */}
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={cn(
                'text-xs',
                isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
              )}
            >
              {timestamp}
            </span>

            {isEdited && !isDeleted && (
              <span
                className={cn(
                  'text-xs',
                  isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                )}
              >
                · editado
              </span>
            )}

            {isOwnMessage && <MessageStatus message={message} currentUserId={currentUserId} />}
          </div>
        </div>

        {/* Acciones - visible en hover (desktop) o siempre (mobile touch) */}
        {!isDeleted && (
          <div
            className={cn(
              'flex items-center gap-1 mt-1 transition-opacity',
              // En móvil (touch), mostrar siempre con opacidad reducida
              // En desktop (hover), mostrar al hacer hover
              'opacity-70 sm:opacity-0 sm:group-hover:opacity-100',
              isOwnMessage ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            {/* Responder (todos los mensajes) */}
            {onReply && (
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8 sm:h-6 sm:w-6 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0", animations.hoverScale)} // ✨ Touch target móvil 44x44px
                onClick={() => onReply(message)}
                title="Responder"
                aria-label={`Responder al mensaje de ${senderName}`}
              >
                <Reply className="h-4 w-4 sm:h-3 sm:w-3" aria-hidden="true" />
              </Button>
            )}

            {/* Editar (solo mensajes propios) */}
            {isOwnMessage && onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8 sm:h-6 sm:w-6 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0", animations.hoverScale)} // ✨ Touch target móvil
                onClick={() => onEdit(message.id)}
                title="Editar"
                aria-label="Editar mensaje"
              >
                <Pencil className="h-4 w-4 sm:h-3 sm:w-3" aria-hidden="true" />
              </Button>
            )}

            {/* Eliminar (solo mensajes propios) */}
            {isOwnMessage && onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8 sm:h-6 sm:w-6 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 text-destructive hover:text-destructive", animations.hoverScale)} // ✨ Touch target móvil
                onClick={() => onDelete(message.id)}
                title="Eliminar"
                aria-label="Eliminar mensaje"
              >
                <Trash2 className="h-4 w-4 sm:h-3 sm:w-3" aria-hidden="true" />
              </Button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
