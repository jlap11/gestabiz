import React, { useState, useMemo, useEffect } from 'react'
import { Calendar, List, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EmployeeCalendarView } from './EmployeeCalendarView'
import { EmployeeAppointmentsList } from './EmployeeAppointmentsList'
import { useEmployeeAppointments } from '@/hooks/useEmployeeAppointments'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { supabase } from '@/lib/supabase'

interface Service {
  id: string
  name: string
}

interface EmployeeAppointmentsPageProps {
  employeeId: string
  businessId: string
}

type ViewMode = 'list' | 'calendar'
type StatusFilter = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'

export function EmployeeAppointmentsPage({ 
  employeeId, 
  businessId
}: EmployeeAppointmentsPageProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [serviceFilter, setServiceFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [services, setServices] = useState<Service[]>([])

  // Fetch services of the business
  useEffect(() => {
    const fetchServices = async () => {
      if (!businessId) return
      
      try {
        const { data, error } = await supabase
          .from('services')
          .select('id, name')
          .eq('business_id', businessId)
          .order('name')
        
        if (!error && data) {
          setServices(data)
        }
      } catch {
        // Error handling
      }
    }
    
    fetchServices()
  }, [businessId])

  // Fetch appointments asignadas al empleado
  const { 
    appointments, 
    loading, 
    error,
    refetch 
  } = useEmployeeAppointments(employeeId, businessId)

  // Filtrar citas
  const filteredAppointments = useMemo(() => {
    let filtered = appointments

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => {
        if (statusFilter === 'pending') {
          return apt.status === 'pending' || apt.status === 'pending_confirmation'
        }
        return apt.status === statusFilter
      })
    }

    // Filtro por servicio
    if (serviceFilter !== 'all') {
      filtered = filtered.filter(apt => apt.service_id === serviceFilter)
    }

    // Búsqueda por nombre de cliente
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(apt => 
        apt.client_name?.toLowerCase().includes(term)
      )
    }

    return filtered
  }, [appointments, statusFilter, serviceFilter, searchTerm])

  // Contar citas de hoy
  const todayAppointments = useMemo(() => {
    const today = new Date()
    const todayYear = today.getFullYear()
    const todayMonth = today.getMonth()
    const todayDay = today.getDate()

    return appointments.filter(apt => {
      const aptDate = new Date(apt.start_time)
      const aptYear = aptDate.getFullYear()
      const aptMonth = aptDate.getMonth()
      const aptDay = aptDate.getDate()
      
      return aptYear === todayYear && aptMonth === todayMonth && aptDay === todayDay
    })
  }, [appointments])

  // Stats por estado
  const stats = useMemo(() => {
    return {
      total: appointments.length,
      today: todayAppointments.length,
      pending: appointments.filter(a => a.status === 'pending' || a.status === 'pending_confirmation').length,
      confirmed: appointments.filter(a => a.status === 'confirmed').length,
      completed: appointments.filter(a => a.status === 'completed').length,
      cancelled: appointments.filter(a => a.status === 'cancelled').length,
    }
  }, [appointments, todayAppointments])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="p-6">
            <p className="text-destructive">Error al cargar las citas: {error.message}</p>
            <Button onClick={() => refetch()} className="mt-4">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header con stats */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Mis Citas</h2>
            <p className="text-muted-foreground">
              Gestiona tus citas asignadas
            </p>
          </div>
          
          {/* Toggle View Mode */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4 mr-2" />
              Lista
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('calendar')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Calendario
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">{stats.today}</div>
              <div className="text-sm text-muted-foreground">Citas Hoy</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.pending}</div>
              <div className="text-sm text-muted-foreground">Pendientes</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
              <div className="text-sm text-muted-foreground">Confirmadas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
              <div className="text-sm text-muted-foreground">Completadas</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Búsqueda por cliente */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre de cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro por estado */}
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="confirmed">Confirmadas</SelectItem>
                <SelectItem value="completed">Completadas</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro por servicio */}
            {services.length > 0 && (
              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Servicio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los servicios</SelectItem>
                  {services.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Limpiar filtros */}
            {(statusFilter !== 'all' || serviceFilter !== 'all' || searchTerm) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setStatusFilter('all')
                  setServiceFilter('all')
                  setSearchTerm('')
                }}
              >
                Limpiar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resultados count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredAppointments.length === 0 
            ? 'No se encontraron citas' 
            : `${filteredAppointments.length} cita${filteredAppointments.length !== 1 ? 's' : ''} encontrada${filteredAppointments.length !== 1 ? 's' : ''}`
          }
        </p>
      </div>

      {/* Content - List or Calendar */}
      {viewMode === 'list' ? (
        <EmployeeAppointmentsList 
          appointments={filteredAppointments}
          onRefresh={refetch}
        />
      ) : (
        <EmployeeCalendarView
          appointments={filteredAppointments}
          onRefresh={refetch}
        />
      )}
    </div>
  )
}
