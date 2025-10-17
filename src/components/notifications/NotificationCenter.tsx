import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Archive, 
  Trash2, 
  X,
  Calendar,
  Users,
  AlertCircle,
  MessageCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useInAppNotifications } from '@/hooks/useInAppNotifications'
import { NotificationItemErrorBoundary } from './NotificationErrorBoundary'
import { cn } from '@/lib/utils'
import type { InAppNotification } from '@/types/types'

interface NotificationCenterProps {
  userId: string
  onClose?: () => void
}

const NotificationIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'appointment_created':
    case 'appointment_confirmed':
    case 'appointment_cancelled':
    case 'appointment_rescheduled':
    case 'appointment_reminder':
    case 'reminder_24h':
    case 'reminder_1h':
    case 'reminder_15m':
      return <Calendar className="h-4 w-4" />
    case 'employee_request_approved':
    case 'employee_request_rejected':
    case 'employee_request_pending':
      return <Users className="h-4 w-4" />
    case 'chat_message':
    case 'chat_message_received':
      return <MessageCircle className="h-4 w-4" />
    case 'system_announcement':
    case 'system_update':
    case 'system_maintenance':
      return <AlertCircle className="h-4 w-4" />
    default:
      return <Bell className="h-4 w-4" />
  }
}

const NotificationPriority = ({ priority }: { priority: number }) => {
  if (priority === 2) {
    return <Badge variant="destructive" className="text-xs">Urgente</Badge>
  }
  if (priority === 1) {
    return <Badge variant="default" className="text-xs">Alta</Badge>
  }
  return null
}

function NotificationItem({ 
  notification, 
  onRead, 
  onArchive, 
  onDelete,
  onNavigate 
}: { 
  notification: InAppNotification
  onRead: (id: string) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  onNavigate: (url: string) => void
}) {
  const isUnread = notification.status === 'unread'

  const handleClick = () => {
    if (isUnread) {
      onRead(notification.id)
    }
    if (notification.action_url) {
      onNavigate(notification.action_url)
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'group relative p-3 sm:p-4 hover:bg-muted/50 active:bg-muted/70 transition-colors cursor-pointer min-h-[60px]',
        isUnread && 'bg-muted/30'
      )}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
      aria-label={`${notification.title}. ${isUnread ? 'No leída' : 'Leída'}. ${formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: es })}`}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        {/* Icono */}
        <div className={cn(
          'flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center',
          isUnread ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        )}>
          <NotificationIcon type={notification.type} />
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <p className={cn(
              'text-sm sm:text-base font-medium',
              isUnread ? 'text-foreground' : 'text-muted-foreground'
            )}>
              {notification.title}
            </p>
            <NotificationPriority priority={notification.priority} />
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2">
            {notification.body}
          </p>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {formatDistanceToNow(new Date(notification.created_at), {
                addSuffix: true,
                locale: es
              })}
            </span>
            {isUnread && (
              <Badge variant="secondary" className="h-5 text-xs">
                Nuevo
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Acciones (visible en hover desktop, semi-transparente en móvil) */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        {isUnread && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-7 sm:w-7 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
            onClick={(e) => {
              e.stopPropagation()
              onRead(notification.id)
            }}
            title="Marcar como leída"
            aria-label="Marcar notificación como leída"
          >
            <Check className="h-4 w-4 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 sm:h-7 sm:w-7 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 hidden sm:flex"
          onClick={(e) => {
            e.stopPropagation()
            onArchive(notification.id)
          }}
          title="Archivar"
          aria-label="Archivar notificación"
        >
          <Archive className="h-4 w-4 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 sm:h-7 sm:w-7 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 text-destructive hover:text-destructive hidden sm:flex"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(notification.id)
          }}
          title="Eliminar"
          aria-label="Eliminar notificación"
        >
          <Trash2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}

/**
 * Centro de notificaciones con tabs y lista de notificaciones
 */
export function NotificationCenter({ userId, onClose }: NotificationCenterProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'system'>('unread')

  const { 
    notifications: allNotifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    archive,
    deleteNotification
  } = useInAppNotifications({
    userId,
    autoFetch: true,
    limit: 50,
    excludeChatMessages: true, // Excluir mensajes de chat del centro de notificaciones
    suppressToasts: true
  })

  console.log('[NotificationCenter] Rendering with', allNotifications.length, 'notifications (no chat), unread:', unreadCount)

  // Filtrar por tab
  const filteredNotifications = allNotifications.filter(n => {
    if (activeTab === 'unread') {
      return n.status === 'unread'
    }
    if (activeTab === 'system') {
      return n.type.startsWith('system_')
    }
    return true // 'all'
  })

  const handleNavigate = (url: string) => {
    // Cerrar el popover
    onClose?.()
    // Navegar
    window.location.href = url
  }

  return (
    <div className="flex flex-col h-[500px] sm:h-[550px] max-h-[90vh]">
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Bell className="h-5 w-5 text-foreground flex-shrink-0" />
          <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">Notificaciones</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs flex-shrink-0">
              {unreadCount}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-1 flex-shrink-0">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs hidden sm:flex"
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Marcar todas
            </Button>
          )}
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={markAllAsRead}
              className="h-9 w-9 sm:hidden min-h-[44px] min-w-[44px]"
              title="Marcar todas como leídas"
              aria-label="Marcar todas como leídas"
            >
              <CheckCheck className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 min-h-[44px] min-w-[44px] sm:h-8 sm:w-8 sm:min-h-0 sm:min-w-0"
            onClick={onClose}
            aria-label="Cerrar notificaciones"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b border-border px-4">
          <TabsTrigger value="unread" className="relative">
            No leídas
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
        </TabsList>

        {/* Content */}
        <TabsContent value={activeTab} className="flex-1 m-0">
          <ScrollArea className="h-full">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                  <p className="text-sm text-muted-foreground">Cargando...</p>
                </div>
              </div>
            )}
            
            {!loading && filteredNotifications.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm font-medium text-foreground mb-1">
                  No hay notificaciones
                </p>
                <p className="text-xs text-muted-foreground text-center">
                  {activeTab === 'unread' 
                    ? 'Todas tus notificaciones están al día'
                    : 'No tienes notificaciones en esta categoría'
                  }
                </p>
              </div>
            )}
            
            {!loading && filteredNotifications.length > 0 && (
              <div className="divide-y divide-border">
                {filteredNotifications.map((notification, index) => (
                  <div key={notification.id}>
                    <NotificationItemErrorBoundary>
                      <NotificationItem
                        notification={notification}
                        onRead={markAsRead}
                        onArchive={archive}
                        onDelete={deleteNotification}
                        onNavigate={handleNavigate}
                      />
                    </NotificationItemErrorBoundary>
                    {index < filteredNotifications.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
