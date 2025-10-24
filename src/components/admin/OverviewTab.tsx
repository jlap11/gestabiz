import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Calendar,
  Users,
  MapPin,
  Briefcase,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/contexts/LanguageContext'
import type { Business } from '@/types/types'
import { Skeleton } from '@/components/ui/skeleton'

interface OverviewTabProps {
  business: Business
}

interface Stats {
  totalAppointments: number
  todayAppointments: number
  upcomingAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  totalLocations: number
  totalServices: number
  totalEmployees: number
  monthlyRevenue: number
  averageAppointmentValue: number
}

export function OverviewTab({ business }: Readonly<OverviewTabProps>) {
  const { t } = useLanguage()
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchStats = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const now = new Date().toISOString()
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStart = today.toISOString()
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()

      // Get appointments
      const { data: appointments, error: apptError } = await supabase
        .from('appointments')
        .select('*')
        .eq('business_id', business.id)

      if (apptError) throw apptError

      const totalAppointments = appointments?.length || 0
      const todayAppointments = appointments?.filter(
        (a) => a.start_time >= todayStart && a.start_time < now
      ).length || 0
      const upcomingAppointments = appointments?.filter(
        (a) => a.start_time > now && a.status !== 'cancelled'
      ).length || 0
      const completedAppointments = appointments?.filter(
        (a) => a.status === 'completed'
      ).length || 0
      const cancelledAppointments = appointments?.filter(
        (a) => a.status === 'cancelled'
      ).length || 0

      // Get locations
      const { data: locations, error: locError } = await supabase
        .from('locations')
        .select('id')
        .eq('business_id', business.id)
        .eq('is_active', true)

      if (locError) throw locError

      // Get services
      const { data: services, error: servError } = await supabase
        .from('services')
        .select('id, price')
        .eq('business_id', business.id)
        .eq('is_active', true)

      if (servError) throw servError

      // Get employees
      const { data: employees, error: empError } = await supabase
        .from('business_employees')
        .select('id')
        .eq('business_id', business.id)

      if (empError) throw empError

      // Calculate revenue (only completed appointments)
      const completedThisMonth = appointments?.filter(
        (a) => a.status === 'completed' && a.start_time >= monthStart
      ) || []

      const monthlyRevenue = completedThisMonth.reduce((sum, appt) => {
        // Assuming appointment has a service with price
        return sum + (appt.total_price || 0)
      }, 0)

      const averageAppointmentValue = completedAppointments > 0
        ? monthlyRevenue / completedAppointments
        : 0

      setStats({
        totalAppointments,
        todayAppointments,
        upcomingAppointments,
        completedAppointments,
        cancelledAppointments,
        totalLocations: locations?.length || 0,
        totalServices: services?.length || 0,
        totalEmployees: employees?.length || 0,
        monthlyRevenue,
        averageAppointmentValue,
      })
    } catch {
      // Error silenciado - mostrar UI de error en su lugar
      setStats(null)
    } finally {
      setIsLoading(false)
    }
  }, [business.id])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="bg-card border-border">
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">No se pudieron cargar las estadísticas</p>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Citas',
      value: stats.totalAppointments,
      icon: Calendar,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Citas Hoy',
      value: stats.todayAppointments,
      icon: Clock,
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/10',
    },
    {
      title: 'Próximas Citas',
      value: stats.upcomingAppointments,
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Completadas',
      value: stats.completedAppointments,
      icon: CheckCircle,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Canceladas',
      value: stats.cancelledAppointments,
      icon: XCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
    },
    {
      title: 'Sedes',
      value: stats.totalLocations,
      icon: MapPin,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'Servicios',
      value: stats.totalServices,
      icon: Briefcase,
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10',
    },
    {
      title: 'Empleados',
      value: stats.totalEmployees,
      icon: Users,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
    },
  ]

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Main Stats Grid - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="bg-card border-border hover:border-primary/20 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`${stat.bgColor} p-1.5 sm:p-2 rounded-lg`}>
                <stat.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-xl sm:text-2xl font-bold text-foreground">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Cards - Responsive */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-400" />
              <span>Ingresos del Mes</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-foreground">
              ${stats.monthlyRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              Basado en citas completadas este mes
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-violet-400" />
              Valor Promedio por Cita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              ${stats.averageAppointmentValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Promedio de ingresos por cita completada
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions or Alerts */}
      {stats.totalLocations === 0 || stats.totalServices === 0 ? (
        <Card className="bg-amber-500/10 border-amber-500/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Configuración Incompleta
                </h3>
                <p className="text-sm text-foreground/90">
                  {stats.totalLocations === 0 && stats.totalServices === 0
                    ? 'Necesitas agregar sedes y servicios para empezar a recibir citas.'
                    : stats.totalLocations === 0
                    ? 'Necesitas agregar al menos una sede para tu negocio.'
                    : 'Necesitas agregar servicios que ofrecer a tus clientes.'}
                </p>
                <div className="flex gap-2 mt-3">
                  {stats.totalLocations === 0 && (
                    <Badge variant="outline" className="border-amber-500/50 text-amber-300">
                      Sin sedes
                    </Badge>
                  )}
                  {stats.totalServices === 0 && (
                    <Badge variant="outline" className="border-amber-500/50 text-amber-300">
                      Sin servicios
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Business Info Summary */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Información del Negocio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nombre</p>
              <p className="text-foreground font-medium">{business.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Categoría</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{business.category?.name || 'Sin categoría'}</Badge>
              </div>
            </div>
            {business.subcategories && business.subcategories.length > 0 && (
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground mb-2">Subcategorías</p>
                <div className="flex flex-wrap gap-2">
                  {business.subcategories.map((sub) => (
                    <Badge key={sub.id} variant="outline" className="border-border">
                      {sub.subcategory?.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {business.description && (
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">Descripción</p>
                <p className="text-foreground">{business.description}</p>
              </div>
            )}
            {business.phone && (
              <div>
                <p className="text-sm text-muted-foreground">Teléfono</p>
                <p className="text-foreground">{business.phone}</p>
              </div>
            )}
            {business.email && (
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-foreground">{business.email}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
