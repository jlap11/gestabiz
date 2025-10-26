import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { User, BusinessAnalytics, ReportFilters, Appointment, Client } from '@/types'
import { useKV } from '@/lib/useKV'
import { 
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Clock,
  Star,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react'
import { format, subWeeks, subMonths, subYears, parseISO } from 'date-fns'
import { toast } from 'sonner'
import { es as esLocale, enUS } from 'date-fns/locale'
import { useLanguage } from '@/contexts/LanguageContext'
import { formatCurrency } from '@/lib/i18n'

interface ComprehensiveReportsProps {
  user: User
}

interface RecurringClient {
  id: string
  name: string
  email: string
  last_appointment: string
  days_since_last: number
  total_appointments: number
  status: RecurringStatus
  whatsapp?: string
}

type RecurringStatus = 'active' | 'at_risk' | 'lost'

interface PeakHour {
  hour: number
  day_of_week: number
  appointment_count: number
}

interface EmployeePerformance {
  employee_id: string
  employee_name: string
  total_appointments: number
  completed_appointments: number
  revenue: number
  efficiency_rate: number
}

export default function ComprehensiveReports(props: Readonly<ComprehensiveReportsProps>) {
  const { user } = props
  const { t, language } = useLanguage()
  const dfLocale = language === 'es' ? esLocale : enUS
  const [appointments] = useKV<Appointment[]>(`appointments-${user.business_id}`, [])
  const [clients] = useKV<Client[]>(`clients-${user.business_id}`, [])
  const [analytics, setAnalytics] = useState<BusinessAnalytics | null>(null)
  const [recurringClients, setRecurringClients] = useState<RecurringClient[]>([])
  const [filters, setFilters] = useState<ReportFilters>({
    date_range: {
      start: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
      end: format(new Date(), 'yyyy-MM-dd'),
      preset: 'month'
    }
  })
  const [selectedTab, setSelectedTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(false)

  // Generate comprehensive analytics
  const generateAnalytics = useCallback(() => {
    setIsLoading(true)
    
    try {
      const startDate = new Date(filters.date_range.start)
      const endDate = new Date(filters.date_range.end)
      
      // Filter appointments by date range
      const filteredAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.start_time)
        return aptDate >= startDate && aptDate <= endDate
      })

      // Basic metrics
      const totalAppointments = filteredAppointments.length
      const completedAppointments = filteredAppointments.filter(apt => apt.status === 'completed').length
      const cancelledAppointments = filteredAppointments.filter(apt => apt.status === 'cancelled').length
      const noShowAppointments = filteredAppointments.filter(apt => apt.status === 'no_show').length
      
      // Revenue calculations
      const totalRevenue = filteredAppointments
        .filter(apt => apt.status === 'completed')
        .reduce((sum, apt) => sum + (apt.price || 0), 0)

      // Client metrics
      const uniqueClients = new Set(filteredAppointments.map(apt => apt.client_id)).size
      const newClients = clients.filter(client => {
        const createdDate = new Date(client.created_at)
        return createdDate >= startDate && createdDate <= endDate
      }).length

      // Employee performance
      const employeeStats = new Map<string, EmployeePerformance>()
      filteredAppointments.forEach(apt => {
        const employeeId = apt.user_id
        if (!employeeStats.has(employeeId)) {
          employeeStats.set(employeeId, {
            employee_id: employeeId,
            employee_name: `Empleado ${employeeId.slice(0, 8)}`,
            total_appointments: 0,
            completed_appointments: 0,
            revenue: 0,
            efficiency_rate: 0
          })
        }
        
        const stats = employeeStats.get(employeeId)!
        stats.total_appointments++
        if (apt.status === 'completed') {
          stats.completed_appointments++
          stats.revenue += apt.price || 0
        }
        stats.efficiency_rate = stats.total_appointments > 0 
          ? (stats.completed_appointments / stats.total_appointments) * 100 
          : 0
      })

      // Peak hours analysis
      const hourStats = new Map<string, number>()
      filteredAppointments.forEach(apt => {
        const date = new Date(apt.start_time)
        const hour = date.getHours()
        const dayOfWeek = date.getDay()
        const key = `${dayOfWeek}-${hour}`
        hourStats.set(key, (hourStats.get(key) || 0) + 1)
      })

      const peakHours: PeakHour[] = Array.from(hourStats.entries())
        .map(([key, count]) => {
          const [day, hour] = key.split('-').map(Number)
          return { hour, day_of_week: day, appointment_count: count }
        })
        .sort((a, b) => b.appointment_count - a.appointment_count)
        .slice(0, 10)

      // Popular services
      const serviceStats = new Map<string, { count: number, revenue: number }>()
      filteredAppointments.forEach(apt => {
        const serviceName = apt.title
        if (!serviceStats.has(serviceName)) {
          serviceStats.set(serviceName, { count: 0, revenue: 0 })
        }
        const stats = serviceStats.get(serviceName)!
        stats.count++
        if (apt.status === 'completed') {
          stats.revenue += apt.price || 0
        }
      })

      const popularServices = Array.from(serviceStats.entries())
        .map(([service, stats]) => ({ service, ...stats }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Generate recurring clients analysis
      const recurringClientsAnalysis = clients
        .filter(client => client.is_recurring)
        .map(client => {
          const lastAppointment = client.last_appointment ? new Date(client.last_appointment) : null
          const daysSince = lastAppointment 
            ? Math.floor((new Date().getTime() - lastAppointment.getTime()) / (1000 * 60 * 60 * 24))
            : 999
          
          let status: 'active' | 'at_risk' | 'lost' = 'active'
          if (daysSince > 90) status = 'lost'
          else if (daysSince > 30) status = 'at_risk'

          return {
            id: client.id,
            name: client.name,
            email: client.email || '',
            last_appointment: client.last_appointment || '',
            days_since_last: daysSince,
            total_appointments: client.total_appointments,
            status,
            whatsapp: client.whatsapp
          }
        })
        .sort((a, b) => {
          if (a.status !== b.status) {
            const statusOrder = { lost: 0, at_risk: 1, active: 2 }
            return statusOrder[a.status] - statusOrder[b.status]
          }
          return b.days_since_last - a.days_since_last
        })

      setRecurringClients(recurringClientsAnalysis)

      const analyticsData: BusinessAnalytics = {
        period: (filters.date_range.preset ?? 'month') as 'week' | 'month' | 'quarter' | 'year',
        start_date: filters.date_range.start,
        end_date: filters.date_range.end,
        appointments: {
          total: totalAppointments,
          completed: completedAppointments,
          cancelled: cancelledAppointments,
          no_show: noShowAppointments,
          revenue: totalRevenue
        },
        clients: {
          total: clients.length,
          new: newClients,
          returning: uniqueClients - newClients,
          lost: recurringClientsAnalysis.filter(c => c.status === 'lost').length
        },
        employees: Array.from(employeeStats.values()).map(e => ({
          id: e.employee_id,
          name: e.employee_name,
          appointments_total: e.total_appointments,
          appointments_completed: e.completed_appointments,
          revenue: e.revenue,
          efficiency_rate: e.efficiency_rate
        })),
        services: popularServices.map(s => ({
          id: s.service.toLowerCase().replace(/\s+/g, '-'),
          name: s.service,
          bookings: s.count,
          revenue: s.revenue,
          average_price: s.count > 0 ? s.revenue / s.count : 0
        })),
        locations: [],
        peak_hours: peakHours,
        recurring_clients: recurringClientsAnalysis.map(rc => ({
          client_id: rc.id,
          client_name: rc.name,
          last_appointment: rc.last_appointment,
          days_since_last: rc.days_since_last,
          total_appointments: rc.total_appointments,
          status: rc.status
        }))
      }

      setAnalytics(analyticsData)
    } catch (error) {
    toast.error(t('admin.comprehensiveReports.errors.generate_failed'))
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [appointments, clients, filters, t])

  useEffect(() => {
    generateAnalytics()
  }, [generateAnalytics])

  const handlePresetChange = (preset: 'week' | 'month' | 'quarter' | 'year') => {
    const now = new Date()
    let start: Date

    switch (preset) {
      case 'week':
        start = subWeeks(now, 1)
        break
      case 'month':
        start = subMonths(now, 1)
        break
      case 'quarter':
        start = subMonths(now, 3)
        break
      case 'year':
        start = subYears(now, 1)
        break
      default:
        return
    }

  setFilters({
      ...filters,
      date_range: {
        start: format(start, 'yyyy-MM-dd'),
        end: format(now, 'yyyy-MM-dd'),
    preset
      }
    })
  }

  const sendWhatsAppMessage = async (client: RecurringClient) => {
    if (!client.whatsapp) {
      alert(t('admin.comprehensiveReports.whatsapp.missing'))
      return
    }

    const message = t('admin.comprehensiveReports.whatsapp.message_template', { name: client.name })
    
    // In a real implementation, this would call your WhatsApp API
    const whatsappUrl = `https://wa.me/${client.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const getDayName = (dayIndex: number) => {
    // Build a date for the current week starting Sunday (0) and add dayIndex
    const base = new Date(2020, 7, 2) // Sunday, Aug 2, 2020
    const d = new Date(base)
    d.setDate(base.getDate() + dayIndex)
    return format(d, 'EEE', { locale: dfLocale })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'at_risk': return 'bg-yellow-100 text-yellow-800'
      case 'lost': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: RecurringStatus) => {
    switch (status) {
      case 'active': return <Star className="h-4 w-4" />
      case 'at_risk': return <AlertTriangle className="h-4 w-4" />
      case 'lost': return <Users className="h-4 w-4" />
      default: return null
    }
  }

  const getStatusLabel = (status: RecurringStatus) => {
  if (status === 'active') return t('admin.comprehensiveReports.status.active')
  if (status === 'at_risk') return t('admin.comprehensiveReports.status.at_risk')
  return t('admin.comprehensiveReports.status.lost')
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Generando reportes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.comprehensiveReports.title')}</h1>
          <p className="text-muted-foreground">{t('admin.comprehensiveReports.subtitle')}</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={filters.date_range.preset} onValueChange={handlePresetChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t('reports.period_selection')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">{t('reports.this_week')}</SelectItem>
              <SelectItem value="month">{t('reports.this_month')}</SelectItem>
              <SelectItem value="quarter">{t('reports.this_quarter')}</SelectItem>
              <SelectItem value="year">{t('reports.last_year')}</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={generateAnalytics} disabled={isLoading}>
            <BarChart3 className="h-4 w-4 mr-2" />
            {isLoading ? t('admin.comprehensiveReports.actions.updating') : t('admin.comprehensiveReports.actions.update')}
          </Button>
        </div>
      </div>

      {/* Key metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.comprehensiveReports.metrics.total_appointments')}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.appointments.total}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.appointments.completed} {t('appointments.completed')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.comprehensiveReports.metrics.revenue')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.appointments.revenue, 'EUR', language)}</div>
            <p className="text-xs text-muted-foreground">
              {t('admin.comprehensiveReports.metrics.average')}: {formatCurrency((analytics.appointments.revenue / Math.max(analytics.appointments.completed, 1)), 'EUR', language)} {t('appointments.appointment_details').toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('nav.clients')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.clients.total}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.clients.new} {t('admin.comprehensiveReports.metrics.new_in_period')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.comprehensiveReports.metrics.completion_rate')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.appointments.total > 0 
                ? ((analytics.appointments.completed / analytics.appointments.total) * 100).toFixed(1)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.appointments.cancelled} {t('appointments.cancelled')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed reports tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">{t('admin.comprehensiveReports.tabs.summary')}</TabsTrigger>
          <TabsTrigger value="peak-hours">{t('reports.peak_hours')}</TabsTrigger>
          <TabsTrigger value="employees">{t('nav.employees')}</TabsTrigger>
          <TabsTrigger value="services">{t('nav.services')}</TabsTrigger>
          <TabsTrigger value="clients">{t('nav.clients')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('reports.appointments_by_status')}</CardTitle>
                <CardDescription>{t('admin.comprehensiveReports.descriptions.by_status')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('appointments.completed')}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-muted rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ 
                          width: `${(analytics.appointments.completed / Math.max(analytics.appointments.total, 1)) * 100}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium">{analytics.appointments.completed}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('appointments.cancelled')}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-muted rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full"
                        style={{ 
                          width: `${(analytics.appointments.cancelled / Math.max(analytics.appointments.total, 1)) * 100}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium">{analytics.appointments.cancelled}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('appointments.no_show')}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-muted rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full"
                        style={{ 
                          width: `${(analytics.appointments.no_show / Math.max(analytics.appointments.total, 1)) * 100}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium">{analytics.appointments.no_show}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('admin.comprehensiveReports.cards.client_analysis')}</CardTitle>
                <CardDescription>{t('admin.comprehensiveReports.descriptions.client_metrics')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('admin.comprehensiveReports.labels.active_clients')}</span>
                  <span className="text-lg font-bold text-green-600">
                    {recurringClients.filter(c => c.status === 'active').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('admin.comprehensiveReports.status.at_risk')}</span>
                  <span className="text-lg font-bold text-yellow-600">
                    {recurringClients.filter(c => c.status === 'at_risk').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('admin.comprehensiveReports.status.lost')}</span>
                  <span className="text-lg font-bold text-red-600">
                    {recurringClients.filter(c => c.status === 'lost').length}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t('admin.comprehensiveReports.labels.retention_rate')}</span>
                  <span className="text-lg font-bold text-primary">
                    {analytics.clients.total > 0 
                      ? (((analytics.clients.total - analytics.clients.lost) / analytics.clients.total) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="peak-hours" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.comprehensiveReports.cards.peak_hours')}</CardTitle>
              <CardDescription>{t('admin.comprehensiveReports.descriptions.peak_hours')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.peak_hours.slice(0, 10).map((peak, index) => (
                  <div key={`${peak.day_of_week}-${peak.hour}`} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                        <span className="text-sm font-bold text-primary">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">
                          {getDayName(peak.day_of_week)} {t('admin.comprehensiveReports.labels.at')} {peak.hour.toString().padStart(2, '0')}:00
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {peak.appointment_count} {t('appointments.title').toLowerCase()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-bold">{peak.appointment_count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.employee_performance')}</CardTitle>
              <CardDescription>{t('admin.comprehensiveReports.descriptions.employee_performance')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.employees.map((employee, index) => (
                  <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
                        <span className="text-sm font-bold text-primary">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{employee.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {employee.appointments_completed} {t('common.of') ?? 'de'} {employee.appointments_total} {t('appointments.completed')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(employee.revenue, 'EUR', language)}</p>
                      <p className="text-sm text-muted-foreground">
                        {employee.efficiency_rate.toFixed(1)}% {t('admin.comprehensiveReports.labels.efficiency')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.top_services')}</CardTitle>
              <CardDescription>{t('admin.comprehensiveReports.descriptions.top_services')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.services.map((service, index) => (
                  <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-accent/10 rounded-full">
                        <span className="text-sm font-bold text-accent">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {service.bookings} {t('appointments.title').toLowerCase()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(service.revenue, 'EUR', language)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(service.average_price, 'EUR', language)} {t('admin.comprehensiveReports.labels.average_short')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.comprehensiveReports.cards.recurring_clients')}</CardTitle>
              <CardDescription>{t('admin.comprehensiveReports.descriptions.recurring_clients')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recurringClients.slice(0, 20).map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(client.status)}
                        <Badge className={getStatusColor(client.status)}>
                          {getStatusLabel(client.status)}
                        </Badge>
                      </div>
                      <div>
                        <p className="font-medium">{client.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {client.total_appointments} {t('appointments.title').toLowerCase()} • {t('admin.comprehensiveReports.labels.last_visit')}: {client.last_appointment ? format(parseISO(client.last_appointment), 'dd/MM/yyyy', { locale: dfLocale }) : t('admin.clientManagement.never')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {client.days_since_last} {t('admin.comprehensiveReports.labels.days')}
                      </span>
                      {(client.status === 'at_risk' || client.status === 'lost') && client.whatsapp && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendWhatsAppMessage(client)}
                          className="ml-2"
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          {t('clients.send_whatsapp')}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}