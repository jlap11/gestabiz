import React, { useEffect, useRef, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useChat } from '@/hooks/useChat'
import { useEmployeeActiveBusiness } from '@/hooks/useEmployeeActiveBusiness'
import { useNotificationContext } from '@/contexts/NotificationContext'
import { ReadReceipts } from './ReadReceipts'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, ArrowLeft, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface SimpleChatLayoutProps {
  userId: string
  businessId?: string
  initialConversationId?: string | null
  onMessagesRead?: () => void // Callback para notificar cuando se marcan mensajes como leídos
}

export function SimpleChatLayout({
  userId,
  businessId,
  initialConversationId,
  onMessagesRead,
}: Readonly<SimpleChatLayoutProps>) {
  const { t } = useLanguage()
  const {
    conversations,
    activeMessages,
    activeConversation,
    loading,
    error,
    sendMessage,
    markMessagesAsRead,
    setActiveConversationId,
    fetchConversations,
    togglePinConversation,
    toggleMuteConversation,
  } = useChat(userId)

  const { setActiveConversation: setGlobalActiveConversation } = useNotificationContext()
  const [showChat, setShowChat] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  useEffect(() => {
    if (initialConversationId) {
      setActiveConversationId(initialConversationId)
      setShowChat(true)
    }
  }, [initialConversationId, setActiveConversationId])

  useEffect(() => {
    if (activeConversation) {
      setGlobalActiveConversation(activeConversation.id)
    } else {
      setGlobalActiveConversation(null)
    }
    return () => setGlobalActiveConversation(null)
  }, [activeConversation, setGlobalActiveConversation])

  useEffect(() => {
    if (!activeConversation || activeMessages.length === 0) return

    const lastMessage = activeMessages[activeMessages.length - 1]
    const unreadMessages = activeMessages.filter(
      msg => msg.sender_id !== userId && (!msg.read_by || !msg.read_by.includes(userId))
    )

    if (unreadMessages.length > 0) {
      markMessagesAsRead(activeConversation.id, lastMessage.id)
      setTimeout(() => onMessagesRead?.(), 600)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation?.id, activeMessages.length, userId])

  const handleSendMessage = async (content: string) => {
    if (!activeConversation) return
    try {
      await sendMessage({ conversation_id: activeConversation.id, content, type: 'text' })
    } catch (err) {
      console.error('Error sending message', err)
    }
  }

  const handleSelectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId)
    setShowChat(true)
  }

  const handleBackToList = () => {
    setShowChat(false)
    setActiveConversationId(null)
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="flex h-full">
      {!showChat && (
        <div className="w-full bg-card">
          <div className="border-b border-border bg-card px-4 py-3">
            <h2 className="font-semibold text-lg">{t('chat.conversations')}</h2>
          </div>

            {loading && conversations.length === 0 ? (
            <div className="flex items-center justify-center h-full py-8">
              <div className="text-muted-foreground">{t('chat.loading')}</div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex col items-center justify-center h-full p-8">
              <div className="text-muted-foreground text-center">
                <p className="font-semibold mb-2">{t('chat.noConversations.title')}</p>
                <p className="text-sm">{t('chat.noConversations.subtitle')}</p>
              </div>
            </div>
          ) : (
            <div className="overflow-y-auto">
              {[...conversations]
                .sort((a, b) => {
                  const aPinned = (a as any).is_pinned === true
                  const bPinned = (b as any).is_pinned === true
                  if (aPinned && !bPinned) return -1
                  if (!aPinned && bPinned) return 1
                  const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0
                  const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0
                  return bTime - aTime
                })
                .map(conv => {
                  const metadata = conv.metadata as { last_sender_id?: unknown } | undefined
                  const metadataSenderId =
                    typeof metadata?.last_sender_id === 'string'
                      ? metadata.last_sender_id
                      : undefined
                  const lastSenderId = conv.last_message_sender_id ?? metadataSenderId ?? null
                  const preview = conv.last_message_preview || t('chat.emptyPreview')
                  const isOwnLastMessage = lastSenderId === userId
                  const displayPreview = conv.last_message_preview
                    ? `${isOwnLastMessage ? t('chat.youPrefix') : ''}${conv.last_message_preview}`
                    : preview

                  return (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv.id)}
                      className="w-full p-4 text-left border-b border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="font-semibold">
                        {conv.other_user?.full_name || conv.title || t('chat.conversationFallback')}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">{displayPreview}</div>
                      {conv.unread_count ? (
                        <div className="mt-1">
                          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-primary rounded-full">
                            {conv.unread_count}
                          </span>
                        </div>
                      ) : null}
                    </button>
                  )
                })}
            </div>
          )}
        </div>
      )}

      {showChat && (
        <div className="w-full flex flex-col">
          {activeConversation ? (
            <>
              <ChatHeader
                activeConversation={activeConversation}
                onBackToList={handleBackToList}
                onTogglePin={isPinned => togglePinConversation?.(activeConversation.id, isPinned)}
                onToggleMute={isMuted => toggleMuteConversation?.(activeConversation.id, isMuted)}
              />

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    {t('chat.noMessagesPrompt')}
                  </div>
                ) : (
                  <>
                    {activeMessages.map(message => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_id === userId ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg px-4 py-2 ${message.sender_id === userId ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                        >
                          {message.sender_id !== userId && message.sender && (
                            <div className="text-xs font-semibold mb-1">
                              {message.sender.full_name || message.sender.email}
                            </div>
                          )}
                          <div className="break-words">{message.content}</div>
                          <div className="text-xs opacity-70 mt-1 flex items-center gap-1.5">
                            {new Date(message.sent_at).toLocaleTimeString('es', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            <ReadReceipts
                              senderId={message.sender_id}
                              currentUserId={userId}
                              readBy={message.read_by || []}
                              deliveredAt={message.delivered_at}
                              sentAt={message.sent_at}
                              size="sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              <div className="border-t border-border bg-card p-4">
                <form
                  onSubmit={e => {
                    e.preventDefault()
                    const input = e.currentTarget.elements.namedItem('message') as HTMLInputElement
                    if (input.value.trim()) {
                      handleSendMessage(input.value.trim())
                      input.value = ''
                    }
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    name="message"
                    placeholder={t('chat.inputPlaceholder')}
                    className="flex-1 px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    autoComplete="off"
                  />
                  <Button type="submit" className="px-6">
                    {t('chat.send')}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p className="font-semibold mb-2">{t('chat.loadingConversation')}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface ChatHeaderProps {
  activeConversation: NonNullable<ReturnType<typeof useChat>['activeConversation']>
  onBackToList: () => void
  onTogglePin: (isPinned: boolean) => void
  onToggleMute: (isMuted: boolean) => void
}

function ChatHeader({
  activeConversation,
  onBackToList,
  onTogglePin,
  onToggleMute,
}: ChatHeaderProps) {
  const otherUserId = activeConversation.other_user?.id
  const activeBusiness = useEmployeeActiveBusiness(otherUserId)

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const isPinned = (activeConversation as any)?.is_pinned === true
  const isMuted = (activeConversation as any)?.is_muted === true

  return (
    <div className="border-b border-border bg-card px-4 py-3 flex items-center gap-3 justify-between">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBackToList} className="shrink-0 h-11 w-11 sm:h-9 sm:w-9" aria-label="Volver">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage
            src={activeConversation.other_user?.avatar_url || undefined}
            alt={activeConversation.other_user?.full_name || 'Usuario'}
          />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {getInitials(activeConversation.other_user?.full_name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="font-semibold truncate">
            {activeConversation.other_user?.full_name || activeConversation.title || 'Chat'}
          </div>
          {activeBusiness.status === 'active' && activeBusiness.business_name ? (
            <div className="text-sm text-muted-foreground truncate flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {activeBusiness.business_name}
            </div>
          ) : activeBusiness.status === 'off-schedule' && activeBusiness.business_name ? (
            <div className="text-sm text-orange-600 dark:text-orange-400 truncate flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Fuera de horario laboral
            </div>
          ) : activeBusiness.status === 'no-schedule' && activeBusiness.business_name ? (
            <div className="text-sm text-muted-foreground truncate flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> {activeBusiness.business_name} (sin horario)
            </div>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onTogglePin(!isPinned)}>
          {isPinned ? 'Desfijar' : 'Fijar'}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onToggleMute(!isMuted)}>
          {isMuted ? 'Quitar silencio' : 'Silenciar'}
        </Button>
      </div>
    </div>
  )
}