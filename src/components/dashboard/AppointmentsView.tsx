import { useState, useMemo, useEffect } from 'react'
import { useKV } from '@/lib/useKV'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Calendar, Clock, User, PencilSimple, Trash, SortAscending } from '@phosphor-icons/react'
import { User as UserType, Appointment, Client, AppointmentFilter } from '@/types'
import AppointmentForm from './AppointmentForm'
import AdvancedFilters from './AdvancedFilters'
import { toast } from 'sonner'
import { filterAppointments, sortAppointments } from '@/lib/appointmentUtils'
import { useNotifications } from '@/hooks/useNotifications'
import { useGoogleCalendarSync } from '@/hooks/useGoogleCalendarSync'

interface AppointmentsViewProps {
  user: UserType
}

export default function AppointmentsView({ user }: Readonly<AppointmentsViewProps>) {
  const [appointments, setAppointments] = useKV<Appointment[]>(`appointments-${user.business_id || user.id}`, [])
  const [clients] = useKV<Client[]>(`clients-${user.business_id || user.id}`, [])
  const [showForm, setShowForm] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [filter, setFilter] = useState<AppointmentFilter>({})
  const [sortBy, setSortBy] = useState<'date' | 'client' | 'status' | 'priority'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  const { scheduleReminder, processNotifications } = useNotifications()
  const { syncSingleAppointment, deleteSyncedAppointment, isConnected } = useGoogleCalendarSync(user)

  // Process notifications on appointments change
  useEffect(() => {
    processNotifications(appointments)
  }, [appointments, processNotifications])

  const filteredAndSortedAppointments = useMemo(() => {
    const filtered = filterAppointments(appointments, filter)
    return sortAppointments(filtered, sortBy, sortOrder)
  }, [appointments, filter, sortBy, sortOrder])

  const availableTags = useMemo(() => {
    const allTags = appointments.flatMap(apt => apt.tags || [])
    return Array.from(new Set(allTags))
  }, [appointments])

  const handleSaveAppointment = async (appointmentData: Omit<Appointment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    let savedAppointment: Appointment
    
    if (editingAppointment) {
      savedAppointment = {
        ...appointmentData,
        id: editingAppointment.id,
        userId: user.id,
        createdAt: editingAppointment.createdAt,
        updatedAt: new Date().toISOString()
      }
      
      setAppointments(current => 
        current.map(apt => 
          apt.id === editingAppointment.id ? savedAppointment : apt
        )
      )
      toast.success('Cita actualizada exitosamente')
    } else {
      savedAppointment = {
        ...appointmentData,
        id: crypto.randomUUID(),
        userId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      setAppointments(current => [...current, savedAppointment])
      
      // Schedule reminders for new appointment
      if (savedAppointment.status === 'scheduled') {
        scheduleReminder(savedAppointment)
      }
      
      toast.success('Cita creada exitosamente')
    }

    // Sync with Google Calendar if connected
    if (isConnected) {
      try {
        await syncSingleAppointment(savedAppointment)
      } catch (error) {
        console.error('Failed to sync with Google Calendar:', error)
        // Don't show error to user, sync will happen on next auto-sync
      }
    }
    
    setShowForm(false)
    setEditingAppointment(null)
  }

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta cita?')) {
      const appointmentToDelete = appointments.find(apt => apt.id === appointmentId)
      
      setAppointments(current => current.filter(apt => apt.id !== appointmentId))
      
      // Remove from Google Calendar if connected
      if (isConnected && appointmentToDelete) {
        try {
          await deleteSyncedAppointment(appointmentToDelete)
        } catch (error) {
          console.error('Failed to delete from Google Calendar:', error)
          // Don't show error to user, sync will handle it
        }
      }
      
      toast.success('Cita eliminada exitosamente')
    }
  }

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment)
    setShowForm(true)
  }

  const handleStatusChange = (appointmentId: string, newStatus: Appointment['status']) => {
    setAppointments(current =>
      current.map(apt =>
        apt.id === appointmentId
          ? { ...apt, status: newStatus, updatedAt: new Date().toISOString() }
          : apt
      )
    )
    toast.success('Estado de la cita actualizado')
  }

  const handleClearFilters = () => {
    setFilter({})
  }

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500/10 text-blue-700 border-blue-200'
      case 'completed': return 'bg-green-500/10 text-green-700 border-green-200'
      case 'cancelled': return 'bg-red-500/10 text-red-700 border-red-200'
  case 'no_show': return 'bg-orange-500/10 text-orange-700 border-orange-200'
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200'
    }
  }

  const getStatusLabel = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled': return 'Programada'
      case 'completed': return 'Completada'
      case 'cancelled': return 'Cancelada'
  case 'no_show': return 'No se presentó'
      default: return status
    }
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/10 text-red-700 border-red-200'
      case 'medium': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200'
      case 'low': return 'bg-blue-500/10 text-blue-700 border-blue-200'
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200'
    }
  }
  const getPriorityLabel = (priority?: string) => {
    switch (priority) {
      case 'high': return 'Alta'
      case 'medium': return 'Media'
      case 'low': return 'Baja'
      default: return 'Normal'
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', { 
      weekday: 'short',
      year: 'numeric',
      month: 'short', 
      day: 'numeric' 
    })
  }
  const formatDateFromAppointment = (apt: Appointment) => {
    const src = apt.date ?? apt.start_time
    return formatDate(src)
  }
  const formatStartTime = (apt: Appointment) => {
    if (apt.startTime) return apt.startTime
    try { return new Date(apt.start_time).toTimeString().slice(0,5) } catch { return '' }
  }
  const formatEndTime = (apt: Appointment) => {
    if (apt.endTime) return apt.endTime
    try { return new Date(apt.end_time).toTimeString().slice(0,5) } catch { return '' }
  }
  const getClientName = (apt: Appointment) => apt.clientName ?? apt.client_name

  if (showForm) {
    return (
      <AppointmentForm
        user={user}
        clients={clients}
        appointment={editingAppointment}
        onSave={handleSaveAppointment}
        onCancel={() => {
          setShowForm(false)
          setEditingAppointment(null)
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Citas</h2>
          <p className="text-muted-foreground">
            Administra y realiza seguimiento de todas tus citas
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'date' | 'client' | 'status' | 'priority')}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Fecha</SelectItem>
                <SelectItem value="client">Cliente</SelectItem>
                <SelectItem value="status">Estado</SelectItem>
                <SelectItem value="priority">Prioridad</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="gap-2"
            >
              <SortAscending className={`h-4 w-4 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
            </Button>
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus size={16} />
            Nueva Cita
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      <AdvancedFilters
        filter={filter}
        onFilterChange={setFilter}
        clients={clients}
        availableTags={availableTags}
        onClearFilters={handleClearFilters}
      />

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Mostrando {filteredAndSortedAppointments.length} de {appointments.length} citas</span>
      </div>

      {/* Appointments List */}
      {filteredAndSortedAppointments.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Calendar size={64} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No se encontraron citas</h3>
            <p className="text-muted-foreground mb-6">
              {Object.keys(filter).length === 0 && !filter.search
                ? "Aún no has programado ninguna cita." 
                : "No se encontraron citas con los filtros aplicados."
              }
            </p>
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus size={16} />
              Crear tu Primera Cita
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredAndSortedAppointments.map((appointment) => (
            <Card key={appointment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Calendar size={20} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-lg">{appointment.title}</h3>
                        <Badge className={getStatusColor(appointment.status)}>
                          {getStatusLabel(appointment.status)}
                        </Badge>
                        {appointment.priority && (
                          <Badge variant="outline" className={getPriorityColor(appointment.priority)}>
                            {getPriorityLabel(appointment.priority)}
                          </Badge>
                        )}
                      </div>
            <div className="flex items-center text-muted-foreground text-sm space-x-4 mb-2 flex-wrap gap-2">
                        <div className="flex items-center space-x-1">
                          <Calendar size={14} />
              <span>{formatDateFromAppointment(appointment)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock size={14} />
              <span>{formatStartTime(appointment)} - {formatEndTime(appointment)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <User size={14} />
              <span>{getClientName(appointment)}</span>
                        </div>
                      </div>
                      {appointment.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {appointment.description}
                        </p>
                      )}
                      {appointment.location && (
                        <p className="text-sm text-muted-foreground mb-2">
                          📍 {appointment.location}
                        </p>
                      )}
                      {appointment.tags && appointment.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {appointment.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
          {appointment.status === 'scheduled' && (
            <Select
                          value={appointment.status}
                          onValueChange={(status) => 
                            handleStatusChange(appointment.id, status as Appointment['status'])
                          }
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="scheduled">Programada</SelectItem>
                            <SelectItem value="completed">Completada</SelectItem>
                            <SelectItem value="cancelled">Cancelada</SelectItem>
                            <SelectItem value="no_show">No se presentó</SelectItem>
                          </SelectContent>
                        </Select>
          )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditAppointment(appointment)}
                      className="hover:bg-primary/10"
                    >
                      <PencilSimple size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAppointment(appointment.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash size={16} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}