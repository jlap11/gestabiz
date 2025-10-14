import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { NotificationCenter } from './NotificationCenter'
import { NotificationErrorBoundary } from './NotificationErrorBoundary'
import { useInAppNotifications } from '@/hooks/useInAppNotifications'
import { trackNotificationEvent, NotificationEvents } from '@/lib/analytics'
import { cn } from '@/lib/utils'
import { animations } from '@/lib/animations'

interface NotificationBellProps {
  userId: string
  className?: string
}

/**
 * Campana de notificaciones con badge de contador
 * Abre un popover con el centro de notificaciones
 */
export function NotificationBell({ userId, className }: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  
  const { unreadCount } = useInAppNotifications({
    userId,
    autoFetch: true,
    limit: 1 // Solo necesitamos el contador
  })
  
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
          <Bell className={cn("h-5 w-5", unreadCount > 0 && "animate-shake")} /> {/* ✨ Shake con nuevas notif */}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className={cn(
                "absolute -top-1 -right-1 h-5 min-w-[1.25rem] px-1 flex items-center justify-center text-xs",
                animations.badgeBounce // ✨ Bounce animation
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[400px] p-0 bg-card border-border"
        align="end"
        sideOffset={8}
      >
        <NotificationErrorBoundary>
          <NotificationCenter userId={userId} onClose={() => setOpen(false)} />
        </NotificationErrorBoundary>
      </PopoverContent>
    </Popover>
  )
}
