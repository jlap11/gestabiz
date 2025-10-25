/**
 * ChatWithAdminModal Component (v3.0.0)
 *
 * Modal para ver empleados disponibles e iniciar chat.
 *
 * FLUJO PRINCIPAL:
 * 1. Si el usuario es el OWNER: Muestra un botón directo "Chatear"
 * 2. Si el usuario es CLIENT: Muestra lista de empleados disponibles (con allow_client_messages=true)
 *    - Cada empleado muestra: [Avatar] [Nombre] - [Sede] + botón "Chatear"
 *    - IMPORTANTE: Se muestra empleados, NO sedes
 *
 * @author Gestabiz Team
 * @version 3.0.0
 * @date 2025-10-19
 */

import { useState } from 'react'
import { Loader2, MessageCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useBusinessAdmins } from '@/hooks/useBusinessAdmins'
import { useBusinessEmployeesForChat } from '@/hooks/useBusinessEmployeesForChat'
import { useChat } from '@/hooks/useChat'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/contexts/LanguageContext'
import { toast } from 'sonner'

interface ChatWithAdminModalProps {
  readonly businessId: string
  readonly businessName: string
  readonly userLocation?: {
    latitude: number
    longitude: number
  } | null
  readonly onClose: () => void
  readonly onChatStarted: (conversationId: string) => void
  readonly onCloseParent?: () => void
}

export default function ChatWithAdminModal({
  businessId,
  businessName,
  userLocation,
  onClose,
  onChatStarted,
  onCloseParent,
}: ChatWithAdminModalProps) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const {
    admins,
    loading: adminLoading,
    error: adminError,
  } = useBusinessAdmins({ businessId, userLocation })
  const {
    employees,
    loading: employeesLoading,
    error: employeesError,
  } = useBusinessEmployeesForChat({ businessId })
  const { createOrGetConversation } = useChat(user?.id || null)
  const [creatingChat, setCreatingChat] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)

  const admin = admins[0]
  const isUserTheOwner = admin && user?.id === admin.user_id

  const loading = adminLoading || employeesLoading
  const error = adminError || employeesError

  const handleStartChat = async (employeeId: string, employeeName: string) => {
    try {
      setCreatingChat(true)
      setSelectedEmployeeId(employeeId)

      const conversationId = await createOrGetConversation({
        other_user_id: employeeId,
        business_id: businessId,
        initial_message: `Hola ${employeeName}, me interesa conocer más sobre ${businessName}`,
      })

      if (conversationId) {
        toast.success(`Chat iniciado con ${employeeName}`)
        // Cerrar el modal de chat
        onClose()
        // Cerrar el modal padre (BusinessProfile) si se proporcionó
        if (onCloseParent) {
          onCloseParent()
        }
        // Llamar al callback de chat iniciado con la conversationId
        onChatStarted(conversationId)
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error starting chat:', err)
      toast.error('No se pudo iniciar el chat. Intenta nuevamente.')
    } finally {
      setCreatingChat(false)
      setSelectedEmployeeId(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-labelledby="chat-modal-title">
      <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 id="chat-modal-title" className="text-xl font-bold">{t('chat.startChat')}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isUserTheOwner
                ? `${t('chat.administratorOf')} ${businessName}`
                : `${t('chat.employeesOf')} ${businessName}`}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 min-h-[44px] min-w-[44px]" aria-label="Cerrar modal" title="Cerrar modal">
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
              <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
              <span className="sr-only">{t('chat.loading')}</span>
            </div>
          )}

          {error && (
            <div className="text-center py-12" role="alert">
              <p className="text-destructive text-sm">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => globalThis.location.reload()}
                className="mt-4 min-h-[44px] min-w-[44px]"
                aria-label={t('common.actions.retry')}
                title={t('common.actions.retry')}
              >
                {t('common.actions.retry')}
              </Button>
            </div>
          )}

          {!loading && !error && !admin && (
            <div className="text-center py-12" role="status" aria-live="polite">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
              <p className="text-muted-foreground">{t('chat.noAvailability')}</p>
            </div>
          )}

          {!loading && !error && admin && (
            <div className="space-y-4">
              {/* OWNER FLOW */}
              {isUserTheOwner ? (
                <div className="space-y-4">
                  <Card className="p-4 bg-muted/50 border-2 border-border">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={admin.avatar_url || undefined} />
                        <AvatarFallback>
                          {admin.full_name
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base truncate">{admin.full_name}</h3>
                        <p className="text-xs text-muted-foreground truncate">{admin.email}</p>
                      </div>
                    </div>
                  </Card>

                  <div className="text-center py-8 space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Como administrador de{' '}
                      <span className="font-medium text-foreground">{businessName}</span>, puedes
                      iniciar una conversación directamente.
                    </p>
                    <Button
                      onClick={() => handleStartChat(admin.user_id, admin.full_name)}
                      disabled={creatingChat}
                      size="lg"
                      className="w-full min-h-[44px] min-w-[44px]"
                      aria-label={`${t('chat.chatWith')} ${admin.full_name}`}
                      title={`${t('chat.chatWith')} ${admin.full_name}`}
                    >
                      {creatingChat ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                          {t('chat.loading')}
                        </>
                      ) : (
                        <>
                          <MessageCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                          {t('chat.chatWith')}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                // CLIENT FLOW - Mostrar lista de empleados disponibles
                <div className="space-y-3">
                  {employees && employees.length > 0 ? (
                    <>
                      <p className="text-sm font-medium text-foreground">
                        {t('chat.availableEmployees')} ({employees.length})
                      </p>

                      <div role="list" aria-label={t('chat.availableEmployees')}>
                        {employees.map(employee => {
                          const isLoading =
                            creatingChat && selectedEmployeeId === employee.employee_id

                          return (
                            <Card
                              key={employee.employee_id}
                              className="p-4 hover:shadow-md transition-shadow border-2"
                              role="listitem"
                            >
                              <div className="flex items-center gap-4">
                                {/* Employee Avatar */}
                                <Avatar className="h-12 w-12 flex-shrink-0">
                                  <AvatarImage src={employee.avatar_url || undefined} />
                                  <AvatarFallback>
                                    {employee.full_name
                                      .split(' ')
                                      .map(n => n[0])
                                      .join('')
                                      .toUpperCase()
                                      .slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>

                                {/* Employee Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-semibold text-base">{employee.full_name}</h4>
                                    {employee.location_name && (
                                      <span className="text-sm text-muted-foreground">
                                        - {employee.location_name}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">{employee.email}</p>
                                </div>

                                {/* Action Button */}
                                <Button
                                  onClick={() =>
                                    handleStartChat(employee.employee_id, employee.full_name)
                                  }
                                  disabled={creatingChat}
                                  size="sm"
                                  className="flex-shrink-0 min-h-[44px] min-w-[44px]"
                                  aria-label={`${t('chat.chatWith')} ${employee.full_name}`}
                                  title={`${t('chat.chatWith')} ${employee.full_name}`}
                                >
                                  {isLoading ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                                      {t('chat.loading')}
                                    </>
                                  ) : (
                                    <>
                                      <MessageCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                                      {t('chat.chatWith')}
                                    </>
                                  )}
                                </Button>
                              </div>
                            </Card>
                          )
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12" role="status" aria-live="polite">
                      <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
                      <p className="text-muted-foreground">{t('chat.noAvailability')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}