import React from 'react';
import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';
import type { MessageWithSender } from '@/hooks/useMessages';

interface MessageStatusProps {
  message: MessageWithSender;
  currentUserId: string;
}

/**
 * MessageStatus Component
 * 
 * Muestra el estado de un mensaje con checkmarks:
 * - Clock: Enviando (optimistic update)
 * - Single check (gris): Enviado al servidor
 * - Double check (gris): Entregado (guardado en DB)
 * - Double check (azul): Leído por el destinatario
 * - Alert: Error al enviar
 * 
 * Solo se muestra para mensajes del usuario actual.
 * Usa el campo delivery_status de MessageWithSender.
 */
export function MessageStatus({ message, currentUserId }: MessageStatusProps) {
  // No mostrar status si no es mensaje del usuario actual
  if (message.sender_id !== currentUserId) {
    return null;
  }

  // No mostrar status si el mensaje fue eliminado
  if (message.is_deleted) {
    return null;
  }

  // Usar delivery_status del campo calculado en Message interface
  const status = message.delivery_status;

  // Estado: enviando (optimistic update)
  if (status === 'sending') {
    return (
      <span className="text-muted-foreground/50 text-xs" title="Enviando...">
        <Clock className="h-3 w-3 animate-spin" />
      </span>
    );
  }

  // Estado: error al enviar
  if (status === 'failed') {
    return (
      <span className="text-destructive text-xs" title="Error al enviar">
        <AlertCircle className="h-3 w-3" />
      </span>
    );
  }

  // Estado: leído (double check azul)
  if (status === 'read') {
    return (
      <span className="text-blue-500 text-xs" title="Leído">
        <CheckCheck className="h-3 w-3" />
      </span>
    );
  }

  // Estado: entregado (double check gris)
  if (status === 'delivered') {
    return (
      <span className="text-muted-foreground text-xs" title="Entregado">
        <CheckCheck className="h-3 w-3" />
      </span>
    );
  }

  // Estado: enviado (single check gris) - default
  return (
    <span className="text-muted-foreground text-xs" title="Enviado">
      <Check className="h-3 w-3" />
    </span>
  );
}
