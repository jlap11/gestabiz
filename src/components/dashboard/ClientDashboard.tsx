import { useState, useMemo } from 'react'
import { User, Appointment } from '@/types'
import { useLanguage } from '@/contexts'
import { useKV } from '@/lib/useKV'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import supabase from '@/lib/supabase'
import { 
  Calendar, 
  Clock, 
  MapPin,
  Plus,
  CalendarCheck,
  CalendarX,
  Trash2,
  CalendarPlus
} from 'lucide-react'
import { AppointmentWizard } from '@/components/appointments/AppointmentWizard'
import { toast } from 'sonner'

interface ClientDashboardProps {
  user: User
  appointments: Appointment[]
  createAppointment: (appointment: Partial<Appointment>) => Promise<Appointment | void | null>
  refetch: () => void
}

export default function ClientDashboard({ 
  user, 
  appointments,
  createAppointment,
  refetch
}: Readonly<ClientDashboardProps>) {
  const { t } = useLanguage()
  const [showAppointmentForm, setShowAppointmentForm] = useState(false)
  const [localAppointments, setLocalAppointments] = useKV<Appointment[]>(
    `appointments-${user.business_id || user.id}`, 
    []
  )
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  // Combinar appointments del servidor con los locales
  const allAppointments = useMemo(() => {
    const combined = [...appointments, ...localAppointments]
    const uniqueMap = new Map()
    combined.forEach(apt => uniqueMap.set(apt.id, apt))
    return Array.from(uniqueMap.values())
  }, [appointments, localAppointments])

  // Filtrar citas próximas (upcoming)
  const upcomingAppointments = useMemo(() => {
    const now = new Date()
    return allAppointments
      .filter(apt => {
        const aptDate = new Date(apt.start_time)
        return aptDate >= now && ['pending', 'confirmed', 'scheduled'].includes(apt.status)
      })
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, 3) // Solo las próximas 3
  }, [allAppointments])

  // Filtrar citas pasadas (past)
  const pastAppointments = useMemo(() => {
    const now = new Date()
    return allAppointments
      .filter(apt => {
        const aptDate = new Date(apt.start_time)
        return aptDate < now || ['completed', 'cancelled', 'no-show'].includes(apt.status)
      })
      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
      .slice(0, 10) // Últimas 10
  }, [allAppointments])

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      })
    } catch {
      return dateString
    }
  }

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    } catch {
      return ''
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      confirmed: { 
        label: 'Confirmed', 
        className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-medium' 
      },
      pending: { 
        label: 'Pending', 
        className: 'bg-amber-500/20 text-amber-400 border-amber-500/30 font-medium' 
      },
      completed: { 
        label: 'Completed', 
        className: 'bg-blue-500/20 text-blue-400 border-blue-500/30 font-medium' 
      },
      cancelled: { 
        label: 'Cancelled', 
        className: 'bg-red-500/20 text-red-400 border-red-500/30 font-medium' 
      },
      scheduled: { 
        label: 'Scheduled', 
        className: 'bg-primary/20 text-primary border-primary/30 font-medium' 
      },
      'no-show': { 
        label: 'No Show', 
        className: 'bg-muted text-muted-foreground border-border font-medium' 
      },
    }

    const config = statusConfig[status] || statusConfig.pending
    return (
      <Badge variant="outline" className={`${config.className} px-3 py-1`}>
        {config.label}
      </Badge>
    )
  }



  // Función para confirmar cita
  const handleConfirmAppointment = async (appointmentId: string) => {
    setConfirmingId(appointmentId)
    
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId)

      if (error) {
        toast.error(`Error al confirmar la cita: ${error.message}`)
        return
      }

      toast.success('✅ Cita confirmada exitosamente')
      refetch() // Recargar la lista de citas
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error inesperado'
      toast.error(`Error al confirmar: ${message}`)
    } finally {
      setConfirmingId(null)
    }
  }

  // Función para agregar a Google Calendar
  const handleAddToGoogleCalendar = (appointment: Appointment) => {
    try {
      // Crear URL de Google Calendar
      const startDate = new Date(appointment.start_time)
      const endDate = new Date(appointment.end_time || appointment.start_time)
      
      // Si no hay end_time, agregar 1 hora por defecto
      if (!appointment.end_time) {
        endDate.setHours(endDate.getHours() + 1)
      }

      // Formatear fechas para Google Calendar (formato: YYYYMMDDTHHmmssZ)
      const formatGoogleDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
      }

      const title = encodeURIComponent(appointment.title || 'Cita')
      const details = encodeURIComponent(appointment.notes || 'Cita agendada')
      const location = encodeURIComponent(appointment.location || '')
      const dates = `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`

      const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`

      // Abrir en nueva ventana
      window.open(googleCalendarUrl, '_blank')
      toast.success('📅 Abriendo Google Calendar...')
    } catch (error) {
      toast.error('Error al abrir Google Calendar')
    }
  }

  // Función para eliminar cita
  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta cita?')) {
      return
    }

    setDeletingId(appointmentId)
    
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId)

      if (error) {
        toast.error(`Error al eliminar la cita: ${error.message}`)
        return
      }

      toast.success('Cita eliminada exitosamente')
      refetch() // Recargar la lista de citas
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error inesperado'
      toast.error(`Error al eliminar: ${message}`)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header is now in Layout - no need to render here */}
      
      <div className="px-6 py-8 space-y-8">
        {/* Upcoming Appointments Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              Upcoming Appointments
            </h2>
            {upcomingAppointments.length > 0 && (
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                View All
              </Button>
            )}
          </div>

          {upcomingAppointments.length === 0 ? (
            <Card className="border-dashed border-2 border-border bg-transparent">
              <CardContent className="py-16 text-center">
                <CalendarX className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-foreground">No upcoming appointments</h3>
                <p className="text-muted-foreground mb-6">
                  Book your first appointment to get started
                </p>
                <Button 
                  onClick={() => setShowAppointmentForm(true)}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Book Appointment
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcomingAppointments.map((appointment) => (
                <Card 
                  key={appointment.id}
                  className="bg-card border-border hover:border-primary/20 transition-all"
                >
                  <CardContent className="p-6">
                    {/* Title and Badge */}
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-semibold text-foreground">
                        {appointment.title || 'Appointment'}
                      </h3>
                      {getStatusBadge(appointment.status)}
                    </div>

                    {/* Provider */}
                    <div className="text-muted-foreground mb-4">
                      with {appointment.employee_name || 'Provider'}
                    </div>

                    {/* Date, Time, Location */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-foreground/90 text-sm">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(appointment.start_time)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-foreground/90 text-sm">
                        <Clock className="h-4 w-4" />
                        <span>{formatTime(appointment.start_time)}</span>
                      </div>
                      {appointment.location && (
                        <div className="flex items-center gap-2 text-foreground/90 text-sm">
                          <MapPin className="h-4 w-4" />
                          <span>{appointment.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Icons */}
                    <div className="flex gap-3 pt-4 border-t border-border">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-muted-foreground hover:text-green-500 hover:bg-muted"
                        onClick={() => handleConfirmAppointment(appointment.id)}
                        disabled={confirmingId === appointment.id || appointment.status === 'confirmed'}
                        title={appointment.status === 'confirmed' ? 'Ya confirmada' : 'Confirmar cita'}
                      >
                        {confirmingId === appointment.id ? (
                          <span className="animate-spin">⏳</span>
                        ) : (
                          <CalendarCheck className="h-5 w-5" />
                        )}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-muted-foreground hover:text-blue-500 hover:bg-muted"
                        onClick={() => handleAddToGoogleCalendar(appointment)}
                        title="Agregar a Google Calendar"
                      >
                        <CalendarPlus className="h-5 w-5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-muted-foreground hover:text-red-500 hover:bg-muted"
                        onClick={() => handleDeleteAppointment(appointment.id)}
                        disabled={deletingId === appointment.id}
                        title="Eliminar cita"
                      >
                        {deletingId === appointment.id ? (
                          <span className="animate-spin">⏳</span>
                        ) : (
                          <Trash2 className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Past Appointments Section */}
        {pastAppointments.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">
                Past Appointments
              </h2>
            </div>

            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-border">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                          Service
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                          Date & Time
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                          Provider
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                          Location
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {pastAppointments.map((appointment) => (
                        <tr 
                          key={appointment.id}
                          className="hover:bg-muted transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="font-medium text-foreground">
                              {appointment.title || 'Appointment'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-foreground/90">
                              {formatDate(appointment.start_time)}, {formatTime(appointment.start_time)}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground/90">
                            {appointment.employee_name || 'Provider'}
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground/90">
                            {appointment.location || 'Location'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <Button 
                                variant="link" 
                                size="sm"
                                className="text-[#8B5CF6] hover:text-[#a78bfa] font-semibold p-0 h-auto"
                              >
                                Rebook
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteAppointment(appointment.id)}
                                disabled={deletingId === appointment.id}
                                className="text-muted-foreground hover:text-red-500 p-1 h-auto"
                                title="Eliminar cita"
                              >
                                {deletingId === appointment.id ? (
                                  <span className="animate-spin text-sm">⏳</span>
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </div>

      {/* Appointment Wizard Modal */}
      <AppointmentWizard
        open={showAppointmentForm}
        onClose={() => setShowAppointmentForm(false)}
        businessId={user.business_id || ''}
        userId={user.id}
        onSuccess={() => {
          refetch(); // Recargar citas después de crear una nueva
          setShowAppointmentForm(false);
        }}
      />
    </div>
  )
}
