import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  AlertCircle,
  CalendarDays,
  CheckCircle as CheckCircleIcon,
  Clock,
  DollarSign,
  TrendingUp,
  XCircle as XCircleIcon,
} from 'lucide-react'
import { Appointment, DashboardStats, User } from '@/types'
import { useLanguage } from '@/contexts'
import { eachDayOfInterval, endOfWeek, format, isToday, startOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'

interface DashboardOverviewProps {
  user: User
  appointments: Appointment[]
  stats: DashboardStats | null
}

export function DashboardOverview(props: Readonly<DashboardOverviewProps>) {
  const { appointments, stats, user } = props
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
        no_show: dayAppointments.filter(apt => apt.status === 'no_show').length,
      }
    })

    // Appointments by status
    const statusCounts = {
      confirmed: appointments.filter(apt => apt.status === 'confirmed').length,
      completed: appointments.filter(apt => apt.status === 'completed').length,
      cancelled: appointments.filter(apt => apt.status === 'cancelled').length,
      no_show: appointments.filter(apt => apt.status === 'no_show').length,
    }

    const statusData = [
      { name: t('status.confirmed'), value: statusCounts.confirmed, color: '#3b82f6' },
      { name: t('status.completed'), value: statusCounts.completed, color: '#10b981' },
      { name: t('status.cancelled'), value: statusCounts.cancelled, color: '#ef4444' },
      { name: t('status.noShow'), value: statusCounts.no_show, color: '#6b7280' },
    ].filter(item => item.value > 0)

    // Revenue by week
    const revenueData = appointmentsByDay.map(day => {
      const targetDateString = dayLabelToDateString.get(day.day)
      const revenue = appointments
        .filter(apt => {
          const aptDate = new Date(apt.start_time)
          return (
            !!targetDateString &&
            aptDate.toDateString() === targetDateString &&
            apt.status === 'completed'
          )
        })
        .reduce((sum, apt) => sum + (apt.price || 0), 0)
      return { ...day, revenue }
    })

    return {
      appointmentsByDay,
      statusData,
      revenueData,
      statusCounts,
    }
  }, [appointments, t, locale])

  // Today's appointments
  const todayAppointments = useMemo(() => {
    return appointments
      .filter(apt => {
        const aptDate = new Date(apt.start_time)
        return isToday(aptDate)
      })
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
  }, [appointments])

  // Upcoming appointments (next 7 days)
  const upcomingAppointments = useMemo(() => {
    const now = new Date()
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    return appointments
      .filter(apt => {
        const aptDate = new Date(apt.start_time)
        return aptDate >= now && aptDate <= nextWeek && apt.status !== 'cancelled'
      })
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
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

  const getStatusBadgeVariant = (
    status: string
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
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
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      {/* Quick Stats Cards - Mobile First Design */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium leading-tight">
              {t('dashboard.todayAppointments')}
            </CardTitle>
            <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold">{todayAppointments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {todayAppointments.filter(apt => apt.status === 'completed').length}{' '}
              {t('status.completed')}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium leading-tight">
              {t('dashboard.upcomingWeek')}
            </CardTitle>
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold">{upcomingAppointments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{t('dashboard.nextSevenDays')}</p>
          </CardContent>
        </Card>

        {user.activeRole !== 'client' && (
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium leading-tight">
                {t('dashboard.totalRevenue')}
              </CardTitle>
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-2xl font-bold">
                ${stats?.revenue_total?.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t('dashboard.thisMonth')}</p>
            </CardContent>
          </Card>
        )}

        {user.activeRole !== 'client' && (
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium leading-tight">
                {t('dashboard.avgAppointmentValue')}
              </CardTitle>
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 flex-shrink-0" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-2xl font-bold">
                ${stats?.average_appointment_value?.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t('dashboard.perAppointment')}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts Row - Responsive Layout */}
      {user.activeRole !== 'client' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {/* Appointments by Day Chart */}
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-sm sm:text-base">{t('dashboard.weeklyAppointments')}</CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-6 pb-3 sm:pb-6">
              <div className="h-[250px] sm:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.appointmentsByDay} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis 
                      dataKey="day" 
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Bar dataKey="completed" fill="#10b981" name={t('status.completed')} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="confirmed" fill="#3b82f6" name={t('status.confirmed')} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="cancelled" fill="#ef4444" name={t('status.cancelled')} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="no_show" fill="#6b7280" name={t('status.noShow')} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Status Distribution Chart */}
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-sm sm:text-base">{t('dashboard.appointmentStatus')}</CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-6 pb-3 sm:pb-6">
              {analyticsData.statusData.length > 0 ? (
                <div className="h-[250px] sm:h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius="70%"
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analyticsData.statusData.map(entry => (
                          <Cell key={`cell-${entry.name}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[250px] sm:h-[300px] text-muted-foreground">
                  <div className="text-center">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{t('dashboard.noDataAvailable')}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Revenue Chart (admins/empleados) - Full Width */}
      {user.activeRole !== 'client' && (
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-sm sm:text-base">{t('dashboard.weeklyRevenue')}</CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6 pb-3 sm:pb-6">
            <div className="h-[250px] sm:h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.revenueData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={value => [`$${Number(value).toFixed(2)}`, t('dashboard.revenue')]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Schedule & Upcoming Appointments - Mobile Optimized */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Today's Schedule */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="flex items-center text-sm sm:text-base">
              <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
              <span className="truncate">{t('dashboard.todaySchedule')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            {todayAppointments.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-muted-foreground">
                <CalendarDays className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                <p className="text-sm">{t('dashboard.noAppointmentsToday')}</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {todayAppointments.slice(0, 5).map(appointment => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-2 sm:p-3 border rounded-lg hover:bg-muted/50 transition-colors duration-200 min-h-[60px] touch-manipulation"
                    role="button"
                    tabIndex={0}
                    aria-label={`Cita con ${appointment.client_name} a las ${format(new Date(appointment.start_time), 'HH:mm')}`}
                  >
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                      <div className="flex-shrink-0">
                        {getStatusIcon(appointment.status)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm sm:text-base truncate">{appointment.client_name}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {format(new Date(appointment.start_time), 'HH:mm')} - {appointment.title}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={getStatusBadgeVariant(appointment.status)}
                      className="text-xs flex-shrink-0 ml-2"
                    >
                      {t(`status.${appointment.status}`)}
                    </Badge>
                  </div>
                ))}
                {todayAppointments.length > 5 && (
                  <p className="text-xs sm:text-sm text-muted-foreground text-center pt-2">
                    +{todayAppointments.length - 5} {t('dashboard.moreAppointments')}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="flex items-center text-sm sm:text-base">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
              <span className="truncate">{t('dashboard.upcomingAppointments')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-muted-foreground">
                <Clock className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                <p className="text-sm">{t('dashboard.noUpcomingAppointments')}</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {upcomingAppointments.slice(0, 5).map(appointment => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-2 sm:p-3 border rounded-lg hover:bg-muted/50 transition-colors duration-200 min-h-[60px] touch-manipulation"
                    role="button"
                    tabIndex={0}
                    aria-label={`Cita con ${appointment.client_name} el ${format(new Date(appointment.start_time), 'MMM dd, HH:mm', { locale })}`}
                  >
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                      <div className="flex-shrink-0">
                        {getStatusIcon(appointment.status)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm sm:text-base truncate">{appointment.client_name}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {format(new Date(appointment.start_time), 'MMM dd, HH:mm', { locale })}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={getStatusBadgeVariant(appointment.status)}
                      className="text-xs flex-shrink-0 ml-2"
                    >
                      {t(`status.${appointment.status}`)}
                    </Badge>
                  </div>
                ))}
                {upcomingAppointments.length > 5 && (
                  <p className="text-xs sm:text-sm text-muted-foreground text-center pt-2">
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