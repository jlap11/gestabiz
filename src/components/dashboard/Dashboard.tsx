import { useState } from 'react'
import { User, DashboardStats, Appointment } from '@/types'
import { useLanguage } from '@/contexts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Users, Clock, Plus, TrendUp } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { AppointmentForm } from './AppointmentForm'
import AppointmentsView from './AppointmentsView'
import ClientsView from './ClientsView'
import { DashboardOverview } from './DashboardOverview'

interface DashboardProps {
  user: User
  appointments: Appointment[]
  stats: DashboardStats | null
  loading: boolean
  refetch: () => void
  createAppointment: (appointment: Partial<Appointment>) => Promise<any>
}

function Dashboard({ 
  user, 
  appointments, 
  stats, 
  loading, 
  refetch, 
  createAppointment 
}: Readonly<DashboardProps>) {
  const { t } = useLanguage()
  const [showAppointmentForm, setShowAppointmentForm] = useState(false)

  // Calculate today's appointments
  const today = new Date().toISOString().split('T')[0]
  const todayAppointments = appointments.filter(apt => 
    apt.start_time.split('T')[0] === today
  )

  // Calculate upcoming appointments (next 7 days)
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  const upcomingAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.start_time)
    return aptDate >= new Date() && aptDate <= nextWeek
  })

  const dashboardStats = [
    {
      title: t('dashboard.todayAppointments'),
      value: todayAppointments.length.toString(),
  icon: Calendar,
      color: 'text-blue-600',
      change: '+12%'
    },
    {
      title: t('dashboard.totalClients'),
      value: stats?.total_appointments?.toString() || '0',
      icon: Users,
      color: 'text-green-600',
      change: '+8%'
    },
    {
      title: t('dashboard.monthlyRevenue'),
      value: `$${stats?.revenue_this_month?.toFixed(0) || '0'}`,
  icon: Calendar,
      color: 'text-purple-600',
      change: '+15%'
    },
    {
      title: t('dashboard.upcomingWeek'),
      value: upcomingAppointments.length.toString(),
  icon: Clock,
      color: 'text-orange-600',
      change: '+5%'
    }
  ]

  const handleCreateAppointment = async (appointmentData: Partial<Appointment>) => {
    try {
      await createAppointment(appointmentData)
      setShowAppointmentForm(false)
      refetch() // Refresh data
  } catch {
  toast.error(t('appointments.createError') || 'Error creating appointment')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t('dashboard.welcome', { name: user.name })}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('dashboard.overview')}
          </p>
        </div>
        
        {user.role !== 'client' && (
          <Button onClick={() => setShowAppointmentForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('appointments.create')}
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendUp className="h-3 w-3 mr-1" />
                {stat.change} from last month
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{t('dashboard.overview')}</TabsTrigger>
          <TabsTrigger value="appointments">{t('nav.appointments')}</TabsTrigger>
          {user.role !== 'client' && (
            <TabsTrigger value="clients">{t('nav.clients')}</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <DashboardOverview 
            user={user}
            appointments={appointments}
            stats={stats}
          />
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <AppointmentsView user={user} />
        </TabsContent>

        {user.role !== 'client' && (
          <TabsContent value="clients" className="space-y-4">
            <ClientsView user={user} />
          </TabsContent>
        )}
      </Tabs>

      {/* Appointment Form Modal */}
      {showAppointmentForm && (
        <AppointmentForm
          isOpen={showAppointmentForm}
          onClose={() => setShowAppointmentForm(false)}
          onSubmit={handleCreateAppointment}
          user={user}
        />
      )}
    </div>
  )
}

export default Dashboard

