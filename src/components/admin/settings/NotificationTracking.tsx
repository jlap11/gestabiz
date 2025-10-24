import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Phone, 
  CheckCircle, 
  XCircle, 
  Clock,
  Download,
  Filter,
  TrendingUp,
  Send,
  AlertCircle
} from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface NotificationTrackingProps {
  businessId: string
}

interface NotificationLog {
  id: string
  business_id: string
  notification_type: string
  channel: 'email' | 'sms' | 'whatsapp'
  recipient_email: string | null
  recipient_phone: string | null
  status: 'sent' | 'failed' | 'pending'
  external_id: string | null
  error_message: string | null
  retry_count: number
  created_at: string
  sent_at: string | null
}

interface Stats {
  total: number
  sent: number
  failed: number
  pending: number
  byChannel: {
    email: number
    sms: number
    whatsapp: number
  }
  byType: Record<string, number>
  successRate: number
}

const NOTIFICATION_TYPES = {
  appointment_reminder: 'Recordatorio de Cita',
  appointment_confirmation: 'Confirmación de Cita',
  appointment_cancellation: 'Cancelación de Cita',
  appointment_new_client: 'Nueva Cita (Cliente)',
  appointment_new_employee: 'Nueva Cita (Empleado)',
  appointment_new_business: 'Nueva Cita (Negocio)',
  employee_invitation: 'Invitación de Empleado',
  employee_request_new: 'Nueva Solicitud de Empleo',
  employee_request_accepted: 'Solicitud Aceptada',
  employee_request_rejected: 'Solicitud Rechazada',
  business_verification: 'Verificación de Negocio',
  phone_verification_sms: 'Verificación SMS',
  phone_verification_whatsapp: 'Verificación WhatsApp',
  job_application_new: 'Nueva Aplicación',
  job_application_status: 'Estado de Aplicación',
  job_application_interview: 'Entrevista Programada',
  system_alert: 'Alerta del Sistema'
} as const

const COLORS = {
  email: '#3b82f6',
  sms: '#10b981',
  whatsapp: '#22c55e',
  sent: '#10b981',
  failed: '#ef4444',
  pending: '#f59e0b'
}

export function NotificationTracking({ businessId }: Readonly<NotificationTrackingProps>) {
  const { t } = useLanguage()
  const [logs, setLogs] = useState<NotificationLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<NotificationLog[]>([])
  const [stats, setStats] = useState<Stats>({
    total: 0,
    sent: 0,
    failed: 0,
    pending: 0,
    byChannel: { email: 0, sms: 0, whatsapp: 0 },
    byType: {},
    successRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  // Filtros
  const [channelFilter, setChannelFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const calculateStats = useCallback((data: NotificationLog[]) => {
    const total = data.length
    const sent = data.filter(log => log.status === 'sent').length
    const failed = data.filter(log => log.status === 'failed').length
    const pending = data.filter(log => log.status === 'pending').length

    const byChannel = {
      email: data.filter(log => log.channel === 'email').length,
      sms: data.filter(log => log.channel === 'sms').length,
      whatsapp: data.filter(log => log.channel === 'whatsapp').length
    }

    const byType: Record<string, number> = {}
    data.forEach(log => {
      byType[log.notification_type] = (byType[log.notification_type] || 0) + 1
    })

    const successRate = total > 0 ? Math.round((sent / total) * 100) : 0

    setStats({
      total,
      sent,
      failed,
      pending,
      byChannel,
      byType,
      successRate
    })
  }, [])

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('notification_log')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(500)

      if (error) throw error

      setLogs(data || [])
      calculateStats(data || [])
    } catch {
      toast.error('No se pudieron cargar las notificaciones')
    } finally {
      setLoading(false)
    }
  }, [businessId, calculateStats])

  const applyFilters = useCallback(() => {
    let filtered = [...logs]

    // Filtro por canal
    if (channelFilter !== 'all') {
      filtered = filtered.filter(log => log.channel === channelFilter)
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(log => log.status === statusFilter)
    }

    // Filtro por tipo
    if (typeFilter !== 'all') {
      filtered = filtered.filter(log => log.notification_type === typeFilter)
    }

    // Filtro por fecha desde
    if (dateFrom) {
      filtered = filtered.filter(log => new Date(log.created_at) >= new Date(dateFrom))
    }

    // Filtro por fecha hasta
    if (dateTo) {
      const toDate = new Date(dateTo)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter(log => new Date(log.created_at) <= toDate)
    }

    // Búsqueda por email o teléfono
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(log => 
        log.recipient_email?.toLowerCase().includes(query) ||
        log.recipient_phone?.includes(query)
      )
    }

    setFilteredLogs(filtered)
    calculateStats(filtered)
  }, [logs, channelFilter, statusFilter, typeFilter, dateFrom, dateTo, searchQuery, calculateStats])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  const clearFilters = () => {
    setChannelFilter('all')
    setStatusFilter('all')
    setTypeFilter('all')
    setDateFrom('')
    setDateTo('')
    setSearchQuery('')
  }

  const exportToCSV = async () => {
    try {
      setExporting(true)

      const headers = [
        'Fecha',
        'Tipo',
        'Canal',
        'Destinatario',
        'Estado',
        'Error',
        'Reintentos',
        'ID Externo'
      ]

      const rows = filteredLogs.map(log => [
        new Date(log.created_at).toLocaleString('es-MX'),
        NOTIFICATION_TYPES[log.notification_type as keyof typeof NOTIFICATION_TYPES] || log.notification_type,
        log.channel.toUpperCase(),
        log.recipient_email || log.recipient_phone || 'N/A',
        log.status.toUpperCase(),
        log.error_message || '',
        log.retry_count.toString(),
        log.external_id || ''
      ])

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `notificaciones_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success(`${filteredLogs.length} notificaciones exportadas`)
    } catch {
      toast.error('Error al exportar')
    } finally {
      setExporting(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-4 w-4 text-blue-500" />
      case 'sms':
        return <Phone className="h-4 w-4 text-green-500" />
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4 text-emerald-500" />
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />
    }
  }

  // Datos para gráficos
  const channelChartData = [
    { name: 'Email', value: stats.byChannel.email, color: COLORS.email },
    { name: 'SMS', value: stats.byChannel.sms, color: COLORS.sms },
    { name: 'WhatsApp', value: stats.byChannel.whatsapp, color: COLORS.whatsapp }
  ]

  const statusChartData = [
    { name: 'Enviados', value: stats.sent, color: COLORS.sent },
    { name: 'Fallidos', value: stats.failed, color: COLORS.failed },
    { name: 'Pendientes', value: stats.pending, color: COLORS.pending }
  ]

  const typeChartData = Object.entries(stats.byType)
    .map(([type, count]) => ({
      name: NOTIFICATION_TYPES[type as keyof typeof NOTIFICATION_TYPES] || type,
      count
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando notificaciones...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Send className="h-4 w-4" />
              Total Enviadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.total.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Exitosas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{stats.sent.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Fallidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">{stats.failed.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Tasa de Éxito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.successRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Por Canal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={channelChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {channelChartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusChartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Top 5 Tipos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={typeChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Filtra las notificaciones por criterios específicos
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
            >
              Limpiar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <Label className="text-foreground">Canal</Label>
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">{t('common.filters.all')}</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-foreground">Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">{t('common.filters.all')}</SelectItem>
                  <SelectItem value="sent">Enviado</SelectItem>
                  <SelectItem value="failed">Fallido</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-foreground">Tipo</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">{t('common.filters.all')}</SelectItem>
                  {Object.entries(NOTIFICATION_TYPES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-foreground">Desde</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-background border-border text-foreground"
              />
            </div>

            <div>
              <Label className="text-foreground">Hasta</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-background border-border text-foreground"
              />
            </div>

            <div>
              <Label className="text-foreground">{t('common.actions.search')}</Label>
              <Input
                placeholder="Email o teléfono"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-background border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Notificaciones */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground">Historial de Notificaciones</CardTitle>
              <CardDescription className="text-muted-foreground">
                {filteredLogs.length} de {logs.length} notificaciones
              </CardDescription>
            </div>
            <Button
              onClick={exportToCSV}
              disabled={exporting || filteredLogs.length === 0}
              className="bg-primary hover:bg-primary/90"
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting ? t('common.actions.exporting') : t('admin.actions.exportCSV')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Fecha</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tipo</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Canal</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Destinatario</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Estado</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Error</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      No se encontraron notificaciones
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4 text-sm text-foreground">
                        {new Date(log.created_at).toLocaleString('es-MX', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground">
                        {NOTIFICATION_TYPES[log.notification_type as keyof typeof NOTIFICATION_TYPES] || log.notification_type}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getChannelIcon(log.channel)}
                          <span className="text-sm text-foreground capitalize">{log.channel}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground">
                        {log.recipient_email || log.recipient_phone || 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge 
                          variant="outline" 
                          className={`
                            flex items-center gap-1 w-fit
                            ${log.status === 'sent' ? 'border-green-500/50 text-green-500' : ''}
                            ${log.status === 'failed' ? 'border-red-500/50 text-red-500' : ''}
                            ${log.status === 'pending' ? 'border-yellow-500/50 text-yellow-500' : ''}
                          `}
                        >
                          {getStatusIcon(log.status)}
                          <span className="capitalize">{log.status}</span>
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-red-400 max-w-xs truncate">
                        {log.error_message || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
