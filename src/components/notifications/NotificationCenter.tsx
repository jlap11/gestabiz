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
  MessageCircle,
  MoreHorizontal
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useInAppNotifications } from '@/hooks/useInAppNotifications'
import { useLanguage } from '@/contexts/LanguageContext'
import { NotificationItemErrorBoundary } from './NotificationErrorBoundary'
import { getNotificationNavigation } from '@/lib/notificationNavigation'
import { 
  handleNotificationWithRoleSwitch,
  type UserRole,
  type NavigationCallback,
  type RoleSwitchCallback 
} from '@/lib/notificationRoleMapping'
import { cn } from '@/lib/utils'
import type { InAppNotification } from '@/types/types'

interface NotificationCenterProps {
  userId: string
  onClose?: () => void
  onNavigateToPage?: (page: string, context?: Record<string, unknown>) => void
  /** Rol actual del usuario */
  currentRole?: UserRole
  /** Callback para cambiar de rol */
  onRoleSwitch?: RoleSwitchCallback
  /** Roles disponibles del usuario */
  availableRoles?: UserRole[]
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
    case 'absence_request':
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
  readonly notification: InAppNotification
  readonly onRead: (id: string) => void
  readonly onArchive: (id: string) => void
  readonly onDelete: (id: string) => void
  readonly onNavigate: (notification: InAppNotification) => void
}) {
  const { t } = useLanguage()
  const isUnread = notification.status === 'unread'

  const handleClick = () => {
    if (isUnread) {
      onRead(notification.id)
    }
    // Navegar usando la notificación y la utilidad
    onNavigate(notification)
  }

  return (
    <div className="relative group">
      <button
        type="button"
        className={cn(
          'relative w-full rounded-lg border border-transparent p-3 text-left transition-colors sm:p-4 hover:bg-muted/50 active:bg-muted/70 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0',
          isUnread && 'bg-muted/30'
        )}
        onClick={handleClick}
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
            <div className="flex items-center gap-1">
              <NotificationPriority priority={notification.priority} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(event) => event.stopPropagation()}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    aria-label={t('notifications.moreActions')}
                  >
                    <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-44 bg-popover text-popover-foreground border-border"
                  onCloseAutoFocus={(event) => event.preventDefault()}
                >
                  {isUnread && (
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault()
                        onRead(notification.id)
                      }}
                    >
                      <Check className="mr-2 h-4 w-4" aria-hidden="true" />
                      Marcar como leída
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault()
                      onArchive(notification.id)
                    }}
                  >
                    <Archive className="mr-2 h-4 w-4" aria-hidden="true" />
                    Archivar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault()
                      onDelete(notification.id)
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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

      </button>
    </div>
  )
}

/**
 * Centro de notificaciones con tabs y lista de notificaciones
 */
export function NotificationCenter({ 
  userId, 
  onClose, 
  onNavigateToPage,
  currentRole = 'client',
  onRoleSwitch,
  availableRoles = ['client', 'employee', 'admin']
}: Readonly<NotificationCenterProps>) {
  const { t } = useLanguage()
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

  const handleNavigate = async (notification: InAppNotification) => {
    // Cerrar el popover
    onClose?.()
    
    // Si tenemos callback de cambio de rol, usar el sistema avanzado
    if (onRoleSwitch && currentRole) {
      const navigationCallback: NavigationCallback = (page, context) => {
        if (onNavigateToPage) {
          onNavigateToPage(page, context)
        }
      }

      await handleNotificationWithRoleSwitch(
        notification,
        currentRole,
        onRoleSwitch,
        navigationCallback,
        {
          availableRoles,
          onError: (error) => {
            // eslint-disable-next-line no-console
            console.error('Error navigating with role switch:', error)
            // Fallback a navegación tradicional
            fallbackNavigate(notification)
          }
        }
      )
    } else {
      // Fallback: navegación tradicional sin cambio de rol
      fallbackNavigate(notification)
    }
  }

  const fallbackNavigate = (notification: InAppNotification) => {
    // Obtener configuración de navegación basada en tipo
    const navConfig = getNotificationNavigation(notification)
    
    // Ejecutar navegación según destino
    if (navConfig.destination === 'internal' && navConfig.path) {
      // Si hay un callback de navegación del padre, usarlo
      if (onNavigateToPage) {
        // Mapear paths a páginas del dashboard
        // /mis-empleos/vacante/{id} → recruitment con context
        if (navConfig.path.startsWith('/mis-empleos')) {
          onNavigateToPage('recruitment', { 
            vacancyId: navConfig.modalProps?.vacancyId 
          })
        } else if (navConfig.path.startsWith('/citas')) {
          onNavigateToPage('appointments', {
            appointmentId: navConfig.modalProps?.appointmentId
          })
        } else if (navConfig.path.startsWith('/chat')) {
          onNavigateToPage('chat', {
            conversationId: navConfig.modalProps?.conversationId
          })
        } else if (navConfig.path.startsWith('/admin/empleados')) {
          onNavigateToPage('employees', {
            requestId: navConfig.modalProps?.requestId
          })
        } else if (navConfig.path.includes('/resenas')) {
          onNavigateToPage('reviews', {
            businessId: navConfig.modalProps?.businessId
          })
        } else {
          // Fallback: usar location.href
          globalThis.location.href = navConfig.path
        }
      } else {
        // Fallback: usar location.href si no hay callback
        globalThis.location.href = navConfig.path
      }
    } else if (navConfig.destination === 'external' && navConfig.path) {
      globalThis.open(navConfig.path, '_blank')
    }
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
              title={t('notifications.markAllAsRead')}
              aria-label={t('notifications.markAllAsRead')}
            >
              <CheckCheck className="h-4 w-4" />
            </Button>
          )}
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
