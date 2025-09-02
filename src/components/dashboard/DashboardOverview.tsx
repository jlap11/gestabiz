import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts'
import { 
  Clock, 
  CurrencyDollar as DollarSign, 
  TrendUp as TrendingUp, 
  WarningCircle as AlertCircle,
  CheckCircle as CheckCircleIcon,
  XCircle as XCircleIcon,
  Calendar as CalendarDays
} from '@phosphor-icons/react'
import { User, Appointment, DashboardStats } from '@/types'
import { useLanguage } from '@/contexts'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday } from 'date-fns'
import { es } from 'date-fns/locale'

interface DashboardOverviewProps {
  user: User
  appointments: Appointment[]
  stats: DashboardStats | null
}

export function DashboardOverview(props: Readonly<DashboardOverviewProps>) {
  const { appointments, stats } = props
  const { t, language } = useLanguage()
  const locale = language === 'es' ? es : undefined

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })
    const dayLabelToDateString = new Map(
      weekDays.map(d => [format(d, 'EEE', { locale }), d.toDateString()])
    )

    // Appointments by day of week
  const appointmentsByDay = weekDays.map(day => {
      const dayAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.start_time)
        return aptDate.toDateString() === day.toDateString()
      })

      return {
        day: format(day, 'EEE', { locale }),
        total: dayAppointments.length,
        completed: dayAppointments.filter(apt => apt.status === 'completed').length,
        cancelled: dayAppointments.filter(apt => apt.status === 'cancelled').length,
        confirmed: dayAppointments.filter(apt => apt.status === 'confirmed').length,
        no_show: dayAppointments.filter(apt => apt.status === 'no_show').length
      }
    })

    // Appointments by status
    const statusCounts = {
      confirmed: appointments.filter(apt => apt.status === 'confirmed').length,
      completed: appointments.filter(apt => apt.status === 'completed').length,
      cancelled: appointments.filter(apt => apt.status === 'cancelled').length,
      no_show: appointments.filter(apt => apt.status === 'no_show').length
    }

    const statusData = [
      { name: t('status.confirmed'), value: statusCounts.confirmed, color: '#3b82f6' },
      { name: t('status.completed'), value: statusCounts.completed, color: '#10b981' },
      { name: t('status.cancelled'), value: statusCounts.cancelled, color: '#ef4444' },
      { name: t('status.noShow'), value: statusCounts.no_show, color: '#6b7280' }
    ].filter(item => item.value > 0)

    // Revenue by week
    const revenueData = appointmentsByDay.map(day => {
      const targetDateString = dayLabelToDateString.get(day.day)
      const revenue = appointments
        .filter(apt => {
          const aptDate = new Date(apt.start_time)
          return !!targetDateString && aptDate.toDateString() === targetDateString && apt.status === 'completed'
        })
        .reduce((sum, apt) => sum + (apt.price || 0), 0)
      return { ...day, revenue }
    })

    return {
      appointmentsByDay,
      statusData,
      revenueData,
      statusCounts
    }
  }, [appointments, t, locale])

  // Today's appointments
  const todayAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.start_time)
      return isToday(aptDate)
    }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
  }, [appointments])

  // Upcoming appointments (next 7 days)
  const upcomingAppointments = useMemo(() => {
    const now = new Date()
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    return appointments.filter(apt => {
      const aptDate = new Date(apt.start_time)
      return aptDate >= now && aptDate <= nextWeek && apt.status !== 'cancelled'
    }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
  }, [appointments])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />
      case 'cancelled':
        return <XCircleIcon className="h-4 w-4 text-red-600" />
      case 'confirmed':
        return <CheckCircleIcon className="h-4 w-4 text-blue-600" />
      case 'no_show':
        return <AlertCircle className="h-4 w-4 text-gray-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'completed':
        return 'default'
      case 'cancelled':
        return 'destructive'
      case 'confirmed':
        return 'default'
      case 'no_show':
        return 'outline'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.todayAppointments')}
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayAppointments.length}</div>
            <p className="text-xs text-muted-foreground">
              {todayAppointments.filter(apt => apt.status === 'completed').length} {t('status.completed')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.upcomingWeek')}
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.nextSevenDays')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.totalRevenue')}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats?.revenue_total?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.thisMonth')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.avgAppointmentValue')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats?.average_appointment_value?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.perAppointment')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments by Day Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.weeklyAppointments')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.appointmentsByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Bar dataKey="completed" fill="#10b981" name={t('status.completed')} />
                <Bar dataKey="confirmed" fill="#3b82f6" name={t('status.confirmed')} />
                <Bar dataKey="cancelled" fill="#ef4444" name={t('status.cancelled')} />
                <Bar dataKey="no_show" fill="#6b7280" name={t('status.noShow')} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.appointmentStatus')}</CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData.statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analyticsData.statusData.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                {t('dashboard.noDataAvailable')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.weeklyRevenue')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analyticsData.revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
                formatter={(value) => [`$${Number(value).toFixed(2)}`, t('dashboard.revenue')]}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#6366f1" 
                fill="#6366f1" 
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Today's Schedule & Upcoming Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarDays className="h-5 w-5 mr-2" />
              {t('dashboard.todaySchedule')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayAppointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('dashboard.noAppointmentsToday')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayAppointments.slice(0, 5).map(appointment => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(appointment.status)}
                      <div>
                        <p className="font-medium">{appointment.client_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(appointment.start_time), 'HH:mm')} - {appointment.title}
                        </p>
                      </div>
                    </div>
                    <Badge variant={getStatusBadgeVariant(appointment.status)}>
                      {t(`status.${appointment.status}`)}
                    </Badge>
                  </div>
                ))}
                {todayAppointments.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center">
                    +{todayAppointments.length - 5} {t('dashboard.moreAppointments')}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              {t('dashboard.upcomingAppointments')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('dashboard.noUpcomingAppointments')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.slice(0, 5).map(appointment => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(appointment.status)}
                      <div>
                        <p className="font-medium">{appointment.client_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(appointment.start_time), 'MMM dd, HH:mm', { locale })}
                        </p>
                      </div>
                    </div>
                    <Badge variant={getStatusBadgeVariant(appointment.status)}>
                      {t(`status.${appointment.status}`)}
                    </Badge>
                  </div>
                ))}
                {upcomingAppointments.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center">
                    +{upcomingAppointments.length - 5} {t('dashboard.moreAppointments')}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}