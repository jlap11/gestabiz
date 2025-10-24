import React, { useCallback, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Client, ClientAnalytics, User } from '@/types'
import { useKV } from '@/lib/useKV'
import { toast } from 'sonner'
import {
  AlertCircle,
  Calendar,
  Clock,
  Mail,
  MessageSquare,
  MoreVertical,
  Phone,
  Search,
  Users,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { enUS, es as esLocale } from 'date-fns/locale'
import { useLanguage } from '@/contexts/LanguageContext'

interface ClientManagementProps {
  user: Readonly<User>
}

export default function ClientManagement(props: Readonly<ClientManagementProps>) {
  const { user } = props
  const { t, language } = useLanguage()
  const [clients] = useKV<Client[]>(`clients-${user.business_id}`, [])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'blocked'>('all')
  const [activeTab, setActiveTab] = useState<'all' | 'recurring' | 'at_risk' | 'lost'>('all')

  const dfLocale = language === 'es' ? esLocale : enUS

  const generateClientAnalytics = useCallback(
    (client: Client): ClientAnalytics => {
      const daysSince = client.last_appointment
        ? Math.floor((Date.now() - new Date(client.last_appointment).getTime()) / 86400000)
        : Math.floor((Date.now() - new Date(client.created_at).getTime()) / 86400000)

      let frequency: ClientAnalytics['frequency']
      if (client.total_appointments > 10) {
        frequency = 'frequent'
      } else if (client.total_appointments > 5) {
        frequency = 'regular'
      } else if (client.total_appointments > 2) {
        frequency = 'occasional'
      } else {
        frequency = 'rare'
      }

      let status: ClientAnalytics['status']
      if (client.status === 'active') status = 'active'
      else if (client.status === 'inactive') status = 'lost'
      else status = 'at_risk'
      return {
        client_id: client.id,
        client_name: client.name,
        total_appointments: client.total_appointments,
        completed_appointments: Math.floor(client.total_appointments * 0.8),
        cancelled_appointments: Math.floor(client.total_appointments * 0.15),
        no_show_appointments: Math.floor(client.total_appointments * 0.05),
        total_revenue: client.total_appointments * 50,
        average_appointment_value: 50,
        first_appointment: client.created_at,
        last_appointment: client.last_appointment || client.created_at,
        frequency,
        status,
        days_since_last_appointment: daysSince,
        preferred_services: ['Consulta General', 'Seguimiento'],
        preferred_times: ['10:00 AM', '2:00 PM'],
        preferred_employee: user.name,
        lifetime_value: client.total_appointments * 50,
      }
    },
    [user.name]
  )

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesSearch =
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.includes(searchTerm)
      const matchesStatus = statusFilter === 'all' || client.status === statusFilter
      const analytics = generateClientAnalytics(client)
      if (activeTab === 'recurring') return matchesSearch && matchesStatus && client.is_recurring
      if (activeTab === 'at_risk')
        return matchesSearch && matchesStatus && analytics.days_since_last_appointment > 60
      if (activeTab === 'lost')
        return matchesSearch && matchesStatus && analytics.days_since_last_appointment > 120
      return matchesSearch && matchesStatus
    })
  }, [clients, searchTerm, statusFilter, activeTab, generateClientAnalytics])

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

  const getStatusBadge = (status: Client['status']) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="default" className="bg-green-500">
            {t('admin.clientManagement.status.active')}
          </Badge>
        )
      case 'inactive':
        return <Badge variant="secondary">{t('admin.clientManagement.status.inactive')}</Badge>
      case 'blocked':
        return <Badge variant="destructive">{t('admin.clientManagement.status.blocked')}</Badge>
      default:
        return <Badge variant="outline">{t('admin.clientManagement.status.unknown')}</Badge>
    }
  }

  const handleSendFollowUp = (client: Client) => {
    if (!client.whatsapp) {
      toast.error(t('admin.clientManagement.whatsapp.missing'))
      return
    }
    const message = t('admin.clientManagement.whatsapp.message_template', { name: client.name })
    const phone = client.whatsapp.replace(/[^\d+]/g, '')
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  const stats = useMemo(
    () => ({
      total: clients.length,
      active: clients.filter(c => c.status === 'active').length,
      recurring: clients.filter(c => c.is_recurring).length,
      atRisk: clients.filter(
        c =>
          generateClientAnalytics(c).days_since_last_appointment > 60 &&
          generateClientAnalytics(c).days_since_last_appointment <= 120
      ).length,
      lost: clients.filter(c => generateClientAnalytics(c).days_since_last_appointment > 120)
        .length,
    }),
    [clients, generateClientAnalytics]
  )

  // Narrowing helpers for onValueChange without type assertions
  const onStatusChange = (v: string) => {
    if (v === 'all' || v === 'active' || v === 'inactive' || v === 'blocked') {
      setStatusFilter(v)
    }
  }
  const onTabChange = (v: string) => {
    if (v === 'all' || v === 'recurring' || v === 'at_risk' || v === 'lost') {
      setActiveTab(v)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('admin.clientManagement.search_placeholder')}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder={t('admin.clientManagement.filter_by_status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.clientManagement.all_statuses')}</SelectItem>
            <SelectItem value="active">
              {t('admin.clientManagement.status.active_plural')}
            </SelectItem>
            <SelectItem value="inactive">
              {t('admin.clientManagement.status.inactive_plural')}
            </SelectItem>
            <SelectItem value="blocked">
              {t('admin.clientManagement.status.blocked_plural')}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            {t('admin.clientManagement.tabs.all')} ({filteredClients.length})
          </TabsTrigger>
          <TabsTrigger value="recurring">
            {t('admin.clientManagement.tabs.recurring')} ({stats.recurring})
          </TabsTrigger>
          <TabsTrigger value="at_risk">
            {t('admin.clientManagement.tabs.at_risk')} ({stats.atRisk})
          </TabsTrigger>
          <TabsTrigger value="lost">
            {t('admin.clientManagement.tabs.lost')} ({stats.lost})
          </TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="space-y-4">
          {filteredClients.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">
                  {t('admin.clientManagement.empty.title')}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm
                    ? t('admin.clientManagement.empty.description_search')
                    : t('admin.clientManagement.empty.description_category')}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredClients.map(client => {
                const analytics = generateClientAnalytics(client)
                return (
                  <Card key={client.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={client.avatar_url} alt={client.name} />
                            <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">{client.name}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              {getStatusBadge(client.status)}
                              <Badge variant="secondary">{analytics.frequency}</Badge>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        {client.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{client.email}</span>
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                        {client.whatsapp && (
                          <div className="flex items-center gap-2 text-sm">
                            <MessageSquare className="h-4 w-4 text-green-500" />
                            <span>{client.whatsapp}</span>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">
                            {client.total_appointments}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t('admin.clientManagement.badges.total_appointments')}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            ${analytics.lifetime_value}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t('admin.clientManagement.badges.total_value')}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            {t('admin.clientManagement.last_appointment_prefix')}:{' '}
                            {client.last_appointment
                              ? formatDistanceToNow(new Date(client.last_appointment), {
                                  addSuffix: true,
                                  locale: dfLocale,
                                })
                              : t('admin.clientManagement.never')}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-3 border-t">
                        <Button size="sm" className="flex-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          {t('admin.clientManagement.actions.schedule')}
                        </Button>
                        {analytics.days_since_last_appointment > 30 && client.whatsapp && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendFollowUp(client)}
                            className="flex-1"
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            {t('admin.clientManagement.actions.contact')}
                          </Button>
                        )}
                      </div>
                      {analytics.days_since_last_appointment > 60 && (
                        <div
                          className={`text-xs p-2 rounded-md ${analytics.days_since_last_appointment > 120 ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}
                        >
                          <AlertCircle className="h-3 w-3 inline mr-1" />
                          {analytics.days_since_last_appointment > 120
                            ? t('admin.clientManagement.risk.lost', {
                                days: String(analytics.days_since_last_appointment),
                              })
                            : t('admin.clientManagement.risk.at_risk', {
                                days: String(analytics.days_since_last_appointment),
                              })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
