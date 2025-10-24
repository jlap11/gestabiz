import { useMemo, useState } from 'react'
import { Appointment, User } from '@/types'
import { useLanguage } from '@/contexts'
import { useKV } from '@/lib/useKV'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import supabase from '@/lib/supabase'
import {
  Calendar,
  CalendarCheck,
  CalendarPlus,
  CalendarX,
  Clock,
  MapPin,
  Plus,
  Trash2,
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
  refetch,
}: Readonly<ClientDashboardProps>) {
  const { t } = useLanguage()
  const [showAppointmentForm, setShowAppointmentForm] = useState(false)
  const [localAppointments] = useKV<Appointment[]>(
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
        year: 'numeric',
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
        hour12: true,
      })
    } catch {
      return ''
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      confirmed: {
        label: t('clientDashboard.status.confirmed'),
        className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-medium',
      },
      pending: {
        label: t('clientDashboard.status.pending'),
        className: 'bg-amber-500/20 text-amber-400 border-amber-500/30 font-medium',
      },
      completed: {
        label: t('clientDashboard.status.completed'),
        className: 'bg-blue-500/20 text-blue-400 border-blue-500/30 font-medium',
      },
      cancelled: {
        label: t('clientDashboard.status.cancelled'),
        className: 'bg-red-500/20 text-red-400 border-red-500/30 font-medium',
      },
      scheduled: {
        label: t('clientDashboard.status.scheduled'),
        className: 'bg-primary/20 text-primary border-primary/30 font-medium',
      },
      'no-show': {
        label: t('clientDashboard.status.noShow'),
        className: 'bg-muted text-muted-foreground border-border font-medium',
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
          updated_at: new Date().toISOString(),
        })
        .eq('id', appointmentId)

      if (error) {
        toast.error(t('clientDashboard.confirmError') + ': ' + error.message)
        return
      }

      toast.success('✅ Cita confirmada exitosamente')
      refetch() // Recargar la lista de citas
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error inesperado'
      toast.error(t('clientDashboard.confirmErrorWithMsg') + ': ' + message)
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
      toast.error(t('clientDashboard.googleCalendarError'))
    }
  }

  // Función para eliminar cita
  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!confirm(t('clientDashboard.confirmDelete'))) {
      return
    }

    setDeletingId(appointmentId)

    try {
      const { error } = await supabase.from('appointments').delete().eq('id', appointmentId)

      if (error) {
        toast.error(t('clientDashboard.deleteError'))
        return
      }

      toast.success(t('clientDashboard.deleteSuccess'))
      refetch() // Recargar la lista de citas
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error inesperado'
      toast.error(t('clientDashboard.errorDeleting', { message }))
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
              {t('clientDashboard.upcomingTitle')}
            </h2>
            {upcomingAppointments.length > 0 && (
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                {t('clientDashboard.viewAll')}
              </Button>
            )}
          </div>

          {upcomingAppointments.length === 0 ? (
            <Card className="border-dashed border-2 border-border bg-transparent">
              <CardContent className="py-16 text-center">
                <CalendarX className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-foreground">
                  {t('clientDashboard.noUpcoming')}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {t('clientDashboard.bookFirstAppointment')}
                </p>
                <Button
                  onClick={() => setShowAppointmentForm(true)}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('clientDashboard.bookAppointment')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcomingAppointments.map(appointment => (
                <Card
                  key={appointment.id}
                  className="bg-card border-border hover:border-primary/20 transition-all"
                >
                  <CardContent className="p-6">
                    {/* Title and Badge */}
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-semibold text-foreground">
                        {appointment.title || t('clientDashboard.appointment')}
                      </h3>
                      {getStatusBadge(appointment.status)}
                    </div>

                    {/* Provider */}
                    <div className="text-muted-foreground mb-4">
                      {t('clientDashboard.with')}{' '}
                      {appointment.employee_name || t('clientDashboard.table.provider')}
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
                        disabled={
                          confirmingId === appointment.id || appointment.status === 'confirmed'
                        }
                        title={
                          appointment.status === 'confirmed'
                            ? t('clientDashboard.alreadyConfirmed')
                            : t('clientDashboard.confirmButton')
                        }
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
                        title={t('clientDashboard.addToCalendar')}
                      >
                        <CalendarPlus className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-red-500 hover:bg-muted"
                        onClick={() => handleDeleteAppointment(appointment.id)}
                        disabled={deletingId === appointment.id}
                        title={t('clientDashboard.deleteAppointment')}
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
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-2xl font-bold text-foreground">
                {t('clientDashboard.pastTitle')}
              </h2>
            </div>

            <Card className="bg-card border-border">
              <CardContent className="p-0">
                {/* Desktop Table - Hidden on Mobile */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-border">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                          {t('clientDashboard.table.service')}
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                          {t('clientDashboard.table.dateTime')}
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                          {t('clientDashboard.table.provider')}
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                          {t('clientDashboard.table.location')}
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                          {t('clientDashboard.table.actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {pastAppointments.map(appointment => (
                        <tr key={appointment.id} className="hover:bg-muted transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-foreground">
                              {appointment.title || t('clientDashboard.appointment')}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-foreground/90">
                              {formatDate(appointment.start_time)},{' '}
                              {formatTime(appointment.start_time)}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground/90">
                            {appointment.employee_name || t('clientDashboard.table.provider')}
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground/90">
                            {appointment.location || t('clientDashboard.table.location')}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <Button
                                variant="link"
                                size="sm"
                                className="text-[#8B5CF6] hover:text-[#a78bfa] font-semibold p-0 h-auto"
                              >
                                {t('clientDashboard.rebook')}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteAppointment(appointment.id)}
                                disabled={deletingId === appointment.id}
                                className="text-muted-foreground hover:text-red-500 p-1 h-auto"
                                title={t('clientDashboard.deleteAppointment')}
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

                {/* Mobile Cards - Shown on Mobile Only */}
                <div className="md:hidden p-3 space-y-3">
                  {pastAppointments.map(appointment => (
                    <Card key={appointment.id} className="p-4 bg-muted/30">
                      <div className="space-y-3">
                        {/* Service Title */}
                        <div className="font-semibold text-foreground text-base">
                          {appointment.title || t('clientDashboard.appointment')}
                        </div>

                        {/* Date & Time */}
                        <div className="flex items-center gap-2 text-sm text-foreground/80">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(appointment.start_time)}</span>
                          <Clock className="h-4 w-4 ml-2" />
                          <span>{formatTime(appointment.start_time)}</span>
                        </div>

                        {/* Provider */}
                        <div className="text-sm text-foreground/70">
                          <span className="font-medium">
                            {t('clientDashboard.table.provider')}:
                          </span>{' '}
                          {appointment.employee_name || t('clientDashboard.table.provider')}
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-2 text-sm text-foreground/70">
                          <MapPin className="h-4 w-4" />
                          <span>{appointment.location || t('clientDashboard.table.location')}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2 border-t border-border">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 min-h-[44px] text-[#8B5CF6] hover:text-[#a78bfa] border-[#8B5CF6]"
                          >
                            {t('clientDashboard.rebook')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAppointment(appointment.id)}
                            disabled={deletingId === appointment.id}
                            className="min-w-[44px] min-h-[44px] border-destructive/50 hover:bg-destructive/10"
                            title={t('clientDashboard.deleteAppointment')}
                          >
                            {deletingId === appointment.id ? (
                              <span className="animate-spin text-sm">⏳</span>
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
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
          refetch() // Recargar citas después de crear una nueva
          setShowAppointmentForm(false)
        }}
      />
    </div>
  )
}
