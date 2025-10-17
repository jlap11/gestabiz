/**
 * ReadReceipts Component - Indicadores de Estado de Lectura
 * 
 * Muestra checkmarks para indicar el estado de un mensaje:
 * - ✓ Enviado (gris)
 * - ✓✓ Entregado (gris)
 * - ✓✓ Leído (azul)
 * 
 * @author AppointSync Pro Team
 * @version 1.0.0
 * @date 2025-10-15
 */

import React from 'react'
import { Check, CheckCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ReadReceiptsProps {
  /** ID del remitente del mensaje */
  senderId: string
  /** ID del usuario actual */
  currentUserId: string
  /** Array de usuarios que han leído el mensaje */
  readBy: Array<{ user_id: string; read_at: string }>
  /** Timestamp de cuándo fue entregado */
  deliveredAt?: string | null
  /** Timestamp de cuándo fue enviado */
  sentAt: string
  /** Tamaño de los iconos */
  size?: 'sm' | 'md' | 'lg'
}

export function ReadReceipts({
  senderId,
  currentUserId,
  readBy,
  deliveredAt,
  sentAt,
  size = 'sm'
}: ReadReceiptsProps) {
  // Solo mostrar receipts para mensajes propios
  if (senderId !== currentUserId) {
    return null
  }

  // Verificar si el mensaje ha sido leído por al menos un usuario
  const isRead = readBy.some(r => r.user_id !== currentUserId)
  
  // Verificar si el mensaje ha sido entregado
  const isDelivered = deliveredAt !== null && deliveredAt !== undefined

  // Determinar tamaño del icono
  const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'
  
  return (
    <div className="flex items-center gap-0.5" title={getTooltipText(isRead, isDelivered, sentAt, deliveredAt)}>
      {isRead ? (
        // Leído - Doble check usando el color secundario para mayor contraste
        <CheckCheck className={cn(iconSize, 'text-[var(--color-secondary)]')} strokeWidth={2.5} />
      ) : isDelivered ? (
        // Entregado - Doble check gris oscuro (bien visible)
        <CheckCheck className={cn(iconSize, 'text-gray-600 dark:text-gray-300')} strokeWidth={2.5} />
      ) : (
        // Enviado - Single check gris medio (visible)
        <Check className={cn(iconSize, 'text-gray-500 dark:text-gray-400')} strokeWidth={2.5} />
      )}
    </div>
  )
}

/**
 * Genera texto de tooltip con información detallada
 */
function getTooltipText(
  isRead: boolean,
  isDelivered: boolean,
  sentAt: string,
  deliveredAt?: string | null
): string {
  if (isRead) {
    return 'Leído'
  }
  if (isDelivered) {
    const deliveredTime = deliveredAt ? new Date(deliveredAt).toLocaleTimeString('es', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }) : ''
    return `Entregado${deliveredTime ? ` a las ${deliveredTime}` : ''}`
  }
  const sentTime = new Date(sentAt).toLocaleTimeString('es', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
  return `Enviado a las ${sentTime}`
}
