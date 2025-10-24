import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  CalendarX,
  CurrencyDollar,
  EnvelopeSimple,
  Phone,
  TrendDown,
  TrendUp,
  Users,
  WhatsappLogo,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useKV } from '@/lib/useKV'
import { useLanguage } from '@/contexts/LanguageContext'
import { formatCurrency, formatDate } from '@/lib/i18n'
import { Appointment, Client, User } from '@/types'

interface RecurringClientsManagementProps {
  user: User
}

interface ClientAnalytics {
  id: string
  client: Client
  totalAppointments: number
  lastAppointment: Date | null
  daysSinceLastVisit: number
  averageSpend: number
  totalSpent: number
  isRecurring: boolean
  status: 'active' | 'inactive' | 'at_risk'
}

export default function RecurringClientsManagement({ user }: RecurringClientsManagementProps) {
  const { t, language } = useLanguage()
  const [clients] = useKV<Client[]>(`clients-${user.business_id || user.id}`, [])
  const [appointments] = useKV<Appointment[]>(`appointments-${user.business_id || user.id}`, [])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('active')
  const [clientAnalytics, setClientAnalytics] = useState<ClientAnalytics[]>([])
  const [sendingMessage, setSendingMessage] = useState<string | null>(null)

  // Calculate client analytics
  useEffect(() => {
    const analytics: ClientAnalytics[] = clients
      .map(client => {
        const clientAppointments = appointments.filter(
          apt => apt.client_id === client.id && apt.status === 'completed'
        )

        const totalAppointments = clientAppointments.length
        const lastAppointment =
          clientAppointments.length > 0
            ? new Date(
                Math.max(...clientAppointments.map(apt => new Date(apt.start_time).getTime()))
              )
            : null

        const daysSinceLastVisit = lastAppointment
          ? Math.floor((Date.now() - lastAppointment.getTime()) / (1000 * 60 * 60 * 24))
          : Infinity

        const totalSpent = clientAppointments.reduce((sum, apt) => sum + (apt.price || 0), 0)
        const averageSpend = totalAppointments > 0 ? totalSpent / totalAppointments : 0

        const isRecurring = totalAppointments >= 3

        let status: 'active' | 'inactive' | 'at_risk' = 'inactive'
        if (daysSinceLastVisit <= 30) status = 'active'
        else if (daysSinceLastVisit <= 90 && isRecurring) status = 'at_risk'
        else status = 'inactive'

        return {
          id: client.id,
          client,
          totalAppointments,
          lastAppointment,
          daysSinceLastVisit,
          averageSpend,
          totalSpent,
          isRecurring,
          status,
        }
      })
      .sort((a, b) => b.totalAppointments - a.totalAppointments)

    setClientAnalytics(analytics)
  }, [clients, appointments])

  const filteredClients = clientAnalytics.filter(analytics => {
    const matchesSearch =
      analytics.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analytics.client.email?.toLowerCase().includes(searchTerm.toLowerCase())

    switch (activeTab) {
      case 'active':
        return matchesSearch && analytics.status === 'active' && analytics.isRecurring
      case 'at_risk':
        return matchesSearch && analytics.status === 'at_risk'
      case 'inactive':
        return matchesSearch && analytics.status === 'inactive' && analytics.isRecurring
      default:
        return matchesSearch && analytics.isRecurring
    }
  })

  const sendWhatsAppMessage = async (client: Client, type: 'follow_up' | 'welcome') => {
    setSendingMessage(client.id)

    try {
      // Simulate sending WhatsApp message
      await new Promise(resolve => setTimeout(resolve, 1500))
      // Here you'd call WhatsApp Business API using the proper template/message

      toast.success(t('recurring.message_sent'))
    } catch {
      toast.error(t('message.error'))
    } finally {
      setSendingMessage(null)
    }
  }

  const stats = {
    total: clientAnalytics.filter(c => c.isRecurring).length,
    active: clientAnalytics.filter(c => c.status === 'active' && c.isRecurring).length,
    atRisk: clientAnalytics.filter(c => c.status === 'at_risk').length,
    inactive: clientAnalytics.filter(c => c.status === 'inactive' && c.isRecurring).length,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{t('recurring.title')}</h2>
          <p className="text-muted-foreground">
            Gestiona la relación con tus clientes más valiosos
          </p>
        </div>

        <Input
          placeholder={t('action.search') + ' clientes...'}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="sm:w-80"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Recurrentes</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('recurring.active')}</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <TrendUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En Riesgo</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.atRisk}</p>
              </div>
              <CalendarX className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('recurring.inactive')}</p>
                <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
              </div>
              <TrendDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <TrendUp size={16} />
            {t('recurring.active')} ({stats.active})
          </TabsTrigger>
          <TabsTrigger value="at_risk" className="flex items-center gap-2">
            <CalendarX size={16} />
            En Riesgo ({stats.atRisk})
          </TabsTrigger>
          <TabsTrigger value="inactive" className="flex items-center gap-2">
            <TrendDown size={16} />
            {t('recurring.inactive')} ({stats.inactive})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="grid gap-4">
            {filteredClients.map(analytics => (
              <ClientCard
                key={analytics.id}
                analytics={analytics}
                onSendWhatsApp={sendWhatsAppMessage}
                sendingMessage={sendingMessage}
                language={language}
                t={t}
              />
            ))}
            {filteredClients.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('message.no_data')}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="at_risk" className="space-y-4">
          <div className="grid gap-4">
            {filteredClients.map(analytics => (
              <ClientCard
                key={analytics.id}
                analytics={analytics}
                onSendWhatsApp={sendWhatsAppMessage}
                sendingMessage={sendingMessage}
                language={language}
                t={t}
                showFollowUpAction
              />
            ))}
            {filteredClients.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <CalendarX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay clientes en riesgo</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          <div className="grid gap-4">
            {filteredClients.map(analytics => (
              <ClientCard
                key={analytics.id}
                analytics={analytics}
                onSendWhatsApp={sendWhatsAppMessage}
                sendingMessage={sendingMessage}
                language={language}
                t={t}
                showFollowUpAction
              />
            ))}
            {filteredClients.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <TrendDown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay clientes inactivos</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

type Lang = 'es' | 'en'

interface ClientCardProps {
  analytics: ClientAnalytics
  onSendWhatsApp: (client: Client, type: 'follow_up' | 'welcome') => Promise<void>
  sendingMessage: string | null
  language: Lang
  t: (key: string, params?: Record<string, string>) => string
  showFollowUpAction?: boolean
}

function ClientCard({
  analytics,
  onSendWhatsApp,
  sendingMessage,
  language,
  t,
  showFollowUpAction = false,
}: Readonly<ClientCardProps>) {
  const { client } = analytics

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const renderClientStatusBadge = (status: string) => {
    if (status === 'active')
      return (
        <Badge variant="default" className="bg-green-500">
          {t('recurring.active')}
        </Badge>
      )
    if (status === 'at_risk')
      return (
        <Badge variant="secondary" className="bg-yellow-500 text-black">
          En Riesgo
        </Badge>
      )
    if (status === 'inactive') return <Badge variant="destructive">{t('recurring.inactive')}</Badge>
    return null
  }

  // Reuse top-level getStatusBadge

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={client.avatar_url} alt={client.name} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(client.name)}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-2">
              <div>
                <h3 className="font-semibold text-foreground">{client.name}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {client.email && (
                    <div className="flex items-center gap-1">
                      <EnvelopeSimple size={14} />
                      {client.email}
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-1">
                      <Phone size={14} />
                      {client.phone}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">{t('recurring.total_visits')}: </span>
                  <span className="font-medium">{analytics.totalAppointments}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('recurring.average_spend')}: </span>
                  <span className="font-medium">
                    {formatCurrency(analytics.averageSpend, 'EUR', language)}
                  </span>
                </div>
                {analytics.lastAppointment && (
                  <div>
                    <span className="text-muted-foreground">{t('recurring.last_visit')}: </span>
                    <span className="font-medium">
                      {formatDate(analytics.lastAppointment, 'short', language)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {renderClientStatusBadge(analytics.status)}
                {analytics.daysSinceLastVisit > 30 && analytics.daysSinceLastVisit < Infinity && (
                  <Badge variant="outline">
                    {analytics.daysSinceLastVisit} {t('admin.recurringClients.daysSinceLastVisit')}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right text-sm">
              <div className="font-medium flex items-center gap-1">
                <CurrencyDollar size={14} />
                {formatCurrency(analytics.totalSpent, 'EUR', language)}
              </div>
              <div className="text-muted-foreground">Total gastado</div>
            </div>

            {(showFollowUpAction || analytics.status === 'at_risk') && client.whatsapp && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSendWhatsApp(client, 'follow_up')}
                disabled={sendingMessage === client.id}
                className="flex items-center gap-2"
              >
                <WhatsappLogo size={16} className="text-green-600" />
                {sendingMessage === client.id ? t('loading.saving') : t('recurring.send_whatsapp')}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
