import { useState } from 'react'
import { Appointment, DashboardStats, User } from '@/types'
import { useLanguage } from '@/contexts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Clock, Plus, TrendingUp, Users } from 'lucide-react'
import { AppointmentWizard } from '@/components/appointments/AppointmentWizard'
import AppointmentsView from './AppointmentsView'
import ClientsView from './ClientsView'
import { DashboardOverview } from './DashboardOverview'
import BusinessRegistration from '@/components/business/BusinessRegistration'
import ClientDashboard from './ClientDashboard'

interface DashboardProps {
  user: User
  appointments: Appointment[]
  stats: DashboardStats | null
  loading: boolean
  refetch: () => void
  createAppointment: (appointment: Partial<Appointment>) => Promise<Appointment | void | null>
  roleSelector?: React.ReactNode // Para pasar al ClientDashboard
}

function Dashboard({
  user,
  appointments,
  stats,
  loading,
  refetch,
  createAppointment,
  roleSelector,
}: Readonly<DashboardProps>) {
  const { t } = useLanguage()
  const [showAppointmentForm, setShowAppointmentForm] = useState(false)
  const [showBusinessRegistration, setShowBusinessRegistration] = useState(false)

  // Calculate today's appointments
  const today = new Date().toISOString().split('T')[0]
  const todayAppointments = appointments.filter(apt => apt.start_time.split('T')[0] === today)

  // Calculate upcoming appointments (next 7 days)
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  const upcomingAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.start_time)
    return aptDate >= new Date() && aptDate <= nextWeek
  })

  const allStats = [
    {
      title: t('dashboard.todayAppointments'),
      value: todayAppointments.length.toString(),
      icon: Calendar,
      color: 'text-blue-600',
      change: '+12%',
    },
    // Métricas de negocio (ocultas para cliente)
    {
      title: t('dashboard.totalClients'),
      value: stats?.total_appointments?.toString() || '0',
      icon: Users,
      color: 'text-green-600',
      change: '+8%',
    },
    {
      title: t('dashboard.monthlyRevenue'),
      value: `$${stats?.revenue_this_month?.toFixed(0) || '0'}`,
      icon: Calendar,
      color: 'text-purple-600',
      change: '+15%',
    },
    {
      title: t('dashboard.upcomingWeek'),
      value: upcomingAppointments.length.toString(),
      icon: Clock,
      color: 'text-orange-600',
      change: '+5%',
    },
  ]

  const dashboardStats = user.activeRole === 'client' ? [allStats[0], allStats[3]] : allStats

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

  // Si es cliente, usar el nuevo ClientDashboard
  // El RoleSelector ahora está en el Layout, no lo pasamos aquí
  if (user.activeRole === 'client') {
    return (
      <ClientDashboard
        user={user}
        appointments={appointments}
        createAppointment={createAppointment}
        refetch={refetch}
      />
    )
  }

  // From this point on, user.activeRole is either 'admin' or 'employee'
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t('dashboard.welcome', { name: user.name })}
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-muted-foreground">{t('dashboard.overview')}</p>
          </div>
        </div>
        <Button onClick={() => setShowAppointmentForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('appointments.create')}
        </Button>
      </div>

      {/* CTA crear negocio si no tiene uno */}
      {!user.business_id && (
        <Card className="bg-muted/30 border-dashed border-2">
          <CardContent className="py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <p className="font-medium">
                {t('business.cta.no_business') || 'Aún no tienes un negocio creado.'}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('business.cta.create_hint') ||
                  'Crea tu negocio para empezar a agendar y gestionar tus citas.'}
              </p>
            </div>
            <Button onClick={() => setShowBusinessRegistration(true)}>
              {t('business.cta.create_button') || 'Crear negocio'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map(stat => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 mr-1" />
                {stat.change} from last month
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          {user.activeRole !== 'client' && (
            <TabsTrigger value="overview">{t('dashboard.overview')}</TabsTrigger>
          )}
          <TabsTrigger value="appointments">{t('nav.appointments')}</TabsTrigger>
          {user.activeRole !== 'client' && (
            <TabsTrigger value="clients">{t('nav.clients')}</TabsTrigger>
          )}
        </TabsList>

        {user.activeRole !== 'client' && (
          <TabsContent value="overview" className="space-y-4">
            <DashboardOverview user={user} appointments={appointments} stats={stats} />
          </TabsContent>
        )}

        <TabsContent value="appointments" className="space-y-4">
          <AppointmentsView user={user} />
        </TabsContent>

        {user.activeRole !== 'client' && (
          <TabsContent value="clients" className="space-y-4">
            <ClientsView user={user} />
          </TabsContent>
        )}
      </Tabs>

      {/* Appointment Wizard Modal */}
      <AppointmentWizard
        open={showAppointmentForm}
        onClose={() => setShowAppointmentForm(false)}
        businessId={user.business_id || ''}
      />

      {/* Business Registration Modal */}
      {showBusinessRegistration && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                {t('business.registration.title') || 'Registrar Negocio'}
              </h3>
              <Button variant="ghost" onClick={() => setShowBusinessRegistration(false)}>
                ✕
              </Button>
            </div>
            <div className="p-4">
              <BusinessRegistration
                user={user}
                onBusinessCreated={() => {
                  setShowBusinessRegistration(false)
                  refetch()
                }}
                onCancel={() => setShowBusinessRegistration(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
