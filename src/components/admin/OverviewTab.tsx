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
import type { Business } from '@/types/types'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import PublicBusinessProfile from '@/pages/PublicBusinessProfile'

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

export function OverviewTab({ business }: OverviewTabProps) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showPublicProfile, setShowPublicProfile] = useState(false)

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

      if (locError) throw locError

      // Get services
      const { data: services, error: svcError } = await supabase
        .from('services')
        .select('id')
        .eq('business_id', business.id)

      if (svcError) throw svcError

      // Get employees
      const { data: employees, error: empError } = await supabase
        .from('business_roles')
        .select('user_id')
        .eq('business_id', business.id)
        .eq('role', 'employee')
        .eq('is_active', true)

      if (empError) throw empError

      // Calculate stats
      const monthlyRevenue = appointments?.filter(
        (a) => new Date(a.start_time).getMonth() === new Date().getMonth() && a.status === 'completed'
      ).reduce((sum, a) => sum + (a.price || 0), 0) || 0

      const averageAppointmentValue = totalAppointments > 0
        ? (appointments?.reduce((sum, a) => sum + (a.price || 0), 0) || 0) / totalAppointments
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
    } catch (err) {
      console.error('Error fetching stats:', err)
    } finally {
      setIsLoading(false)
    }
  }, [business.id])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  if (isLoading || !stats) {
    return (
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Resumen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-400" />
              Citas Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Citas programadas para hoy
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-teal-400" />
              Próximas Citas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.upcomingAppointments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Citas futuras programadas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              Citas Completadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.completedAppointments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Citas marcadas como completadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats Grid */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-400" />
              Citas Canceladas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.cancelledAppointments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total de citas canceladas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-400" />
              Empleados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Miembros del equipo activos
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4 text-pink-400" />
              Sedes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.totalLocations}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Ubicaciones del negocio
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-emerald-400" />
              Servicios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.totalServices}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Servicios ofertados activos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue and Avg Value */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-orange-400" />
              Ingresos del Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              ${stats.monthlyRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total de ingresos por citas completadas este mes
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
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPublicProfile((prev) => !prev)}
            >
              {showPublicProfile ? 'Ocultar perfil' : 'Ver perfil del negocio'}
            </Button>
          </div>
          {showPublicProfile && (
            <div className="mt-4">
              <PublicBusinessProfile slug={business.slug} embedded />
            </div>
          )}
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