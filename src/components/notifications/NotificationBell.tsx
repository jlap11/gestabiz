import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { NotificationCenter } from './NotificationCenter'
import { NotificationErrorBoundary } from './NotificationErrorBoundary'
import { useInAppNotifications } from '@/hooks/useInAppNotifications'
import { NotificationEvents, trackNotificationEvent } from '@/lib/analytics'
import { cn } from '@/lib/utils'
import { animations } from '@/lib/animations'
import type { RoleSwitchCallback, UserRole } from '@/lib/notificationRoleMapping'

interface NotificationBellProps {
  userId: string
  className?: string
  onNavigateToPage?: (page: string, context?: Record<string, unknown>) => void
  /** Rol actual del usuario */
  currentRole?: UserRole
  /** Callback para cambiar de rol */
  onRoleSwitch?: RoleSwitchCallback
  /** Roles disponibles del usuario */
  availableRoles?: UserRole[]
}

/**
 * Campana de notificaciones con badge de contador
 * Abre un popover con el centro de notificaciones
 * EXCLUYE notificaciones de chat (esas van en FloatingChatButton)
 */
export function NotificationBell({
  userId,
  className,
  onNavigateToPage,
  currentRole,
  onRoleSwitch,
  availableRoles,
}: Readonly<NotificationBellProps>) {
  const [open, setOpen] = useState(false)

  // Hook personalizado que excluye notificaciones de chat
  // Usamos limit alto y autoFetch true para sincronizar en tiempo real
  const { unreadCount, refetch } = useInAppNotifications({
    userId,
    autoFetch: true,
    limit: 50, // Aumentado para capturar todas las notificaciones no leídas
    excludeChatMessages: true, // Nueva opción para excluir mensajes de chat
    suppressToasts: true,
  })

  // Refrescar cuando se abre o cierra el popover para asegurar sincronización
  useEffect(() => {
    if (open) {
      refetch()
    }
  }, [open, refetch])

  // Escuchar evento de notificación marcada como leída desde NotificationCenter
  useEffect(() => {
    const handleNotificationRead = () => {
      refetch()
    }

    globalThis.addEventListener('notification-marked-read', handleNotificationRead)
    return () => {
      globalThis.removeEventListener('notification-marked-read', handleNotificationRead)
    }
  }, [refetch])

  // Track analytics cuando se abre/cierra
  useEffect(() => {
    if (open) {
      trackNotificationEvent(NotificationEvents.NOTIFICATION_CENTER_OPENED, {
        unread_count: unreadCount,
      })
    } else if (!open && unreadCount > 0) {
      trackNotificationEvent(NotificationEvents.NOTIFICATION_CENTER_CLOSED, {
        unread_count: unreadCount,
      })
    }
  }, [open, unreadCount])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('relative', className, animations.hoverScale)} // ✨ Hover scale
          aria-label={unreadCount > 0 ? `Notificaciones (${unreadCount} nuevas)` : 'Notificaciones'}
        >
          <Bell className={cn('h-5 w-5', unreadCount > 0 && 'animate-shake')} />{' '}
          {/* ✨ Shake con nuevas notif */}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className={cn(
                'absolute -top-1 -right-1 h-5 min-w-[1.25rem] px-1 flex items-center justify-center text-xs',
                animations.badgeBounce // ✨ Bounce animation
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0 bg-card border-border" align="end" sideOffset={8}>
        <NotificationErrorBoundary>
          <NotificationCenter
            userId={userId}
            onClose={() => setOpen(false)}
            onNavigateToPage={onNavigateToPage}
            currentRole={currentRole}
            onRoleSwitch={onRoleSwitch}
            availableRoles={availableRoles}
          />
        </NotificationErrorBoundary>
      </PopoverContent>
    </Popover>
  )
}
