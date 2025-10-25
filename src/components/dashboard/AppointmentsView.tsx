import { useMemo, useState } from 'react'
import { useKV } from '@/lib/useKV'
// import { Button } from '@/components/ui/button'
import RecommendedBusinesses from './RecommendedBusinesses'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar } from 'lucide-react'
import { Appointment, User as UserType } from '@/types'
import type { AppointmentFilter } from '@/types/types'
import { filterAppointments, sortAppointments } from '@/lib/appointmentUtils'
// import { useNotifications } from '@/hooks/useNotifications' // Disabled to prevent infinite loop
import { useGoogleCalendarSync } from '@/hooks/useGoogleCalendarSync'

interface AppointmentsViewProps {
  user: UserType
}

export default function AppointmentsView({ user }: Readonly<AppointmentsViewProps>) {
  const [appointments] = useKV<Appointment[]>(`appointments-${user.business_id || user.id}`, [])
  const [filter] = useState<AppointmentFilter>({})
  const sortBy: 'date' | 'client' | 'status' | 'priority' = 'date'
  const sortOrder: 'asc' | 'desc' = 'desc'

  // const { processNotifications } = useNotifications() // Disabled to prevent infinite loop
  useGoogleCalendarSync(user)

  // Process notifications on appointments change - DISABLED to prevent infinite loop
  // useEffect(() => {
  //   processNotifications(appointments)
  // }, [appointments, processNotifications])

  const filteredAndSortedAppointments = useMemo(() => {
    let base = filterAppointments(appointments, filter)
    if (user.activeRole === 'client') {
      base = base.filter(apt => ['scheduled', 'confirmed', 'in_progress'].includes(apt.status))
    }
    return sortAppointments(base, sortBy, sortOrder)
  }, [appointments, filter, user.activeRole])

  // Agrupación de citas por mes y día
  const groupedAppointments = useMemo(() => {
    const grouped: Record<string, Record<string, Appointment[]>> = {}
    filteredAndSortedAppointments.forEach(apt => {
      const dateObj = new Date(apt.start_time || apt.date || '')
      const month = dateObj.toLocaleString('es-ES', { month: 'long', year: 'numeric' })
      const day = dateObj.toLocaleString('es-ES', { day: 'numeric', weekday: 'long' })
      if (!grouped[month]) grouped[month] = {}
      if (!grouped[month][day]) grouped[month][day] = []
      grouped[month][day].push(apt)
    })
    return grouped
  }, [filteredAndSortedAppointments])

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-500/10 text-blue-700 border-blue-200'
      case 'completed':
        return 'bg-green-500/10 text-green-700 border-green-200'
      case 'cancelled':
        return 'bg-red-500/10 text-red-700 border-red-200'
      case 'no_show':
        return 'bg-orange-500/10 text-orange-700 border-orange-200'
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200'
    }
  }

  const getStatusLabel = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled':
        return 'Programada'
      case 'completed':
        return 'Completada'
      case 'cancelled':
        return 'Cancelada'
      case 'no_show':
        return 'No se presentó'
      default:
        return status
    }
  }

  const formatStartTime = (apt: Appointment) => {
    if (apt.startTime) return apt.startTime
    try {
      return new Date(apt.start_time).toTimeString().slice(0, 5)
    } catch {
      return ''
    }
  }

  const formatEndTime = (apt: Appointment) => {
    if (apt.endTime) return apt.endTime
    try {
      return new Date(apt.end_time).toTimeString().slice(0, 5)
    } catch {
      return ''
    }
  }

  // Render principal
  return (
    <div
      className={
        user.activeRole === 'client' ? 'grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 max-w-[95vw]' : 'space-y-6 max-w-[95vw]'
      }
      role="main"
      aria-label="Vista de citas"
    >
      {/* Columna principal: Citas programadas */}
      <section aria-labelledby="appointments-title">
        <h2 id="appointments-title" className="text-xl lg:text-2xl font-bold mb-2">Citas programadas</h2>
        {Object.keys(groupedAppointments).length === 0 ? (
          <Card className="max-w-full">
            <CardContent className="py-8 lg:py-16 text-center" role="status" aria-live="polite">
              <Calendar size={48} className="mx-auto text-muted-foreground mb-4 lg:w-16 lg:h-16" aria-hidden="true" />
              <h3 className="text-base lg:text-lg font-semibold mb-2">No tienes reservas pendientes</h3>
              {/* <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus size={16} />
                Crear Reserva
              </Button> */}
            </CardContent>
          </Card>
        ) : (
          <div role="region" aria-label="Lista de citas agrupadas por fecha">
            {Object.entries(groupedAppointments).map(([month, days]) => (
              <section key={month} className="mb-6 lg:mb-8" aria-labelledby={`month-${month.replace(/\s+/g, '-')}`}>
                <h3 id={`month-${month.replace(/\s+/g, '-')}`} className="text-lg lg:text-xl font-semibold mb-4">{month}</h3>
                {Object.entries(days).map(([day, appointments]) => (
                  <div key={day} className="mb-4 lg:mb-6" role="group" aria-labelledby={`day-${day.replace(/\s+/g, '-')}`}>
                    <h4 id={`day-${day.replace(/\s+/g, '-')}`} className="text-base lg:text-lg font-semibold mb-2">{day}</h4>
                    <div className="space-y-3 lg:space-y-4" role="list" aria-label={`Citas para ${day}`}>
                      {appointments.map(appointment => (
                        <Card 
                          key={appointment.id} 
                          className="hover:shadow-md transition-shadow max-w-full"
                          role="listitem"
                        >
                          <CardContent className="p-4 lg:p-6">
                            <div className="flex flex-col gap-2">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <h5 className="font-semibold text-base lg:text-lg flex-1 min-w-0 truncate">{appointment.title}</h5>
                                <Badge 
                                  className={`${getStatusColor(appointment.status)} self-start sm:self-center flex-shrink-0`}
                                  aria-label={`Estado: ${getStatusLabel(appointment.status)}`}
                                >
                                  {getStatusLabel(appointment.status)}
                                </Badge>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-muted-foreground text-sm">
                                <span className="flex-shrink-0">
                                  <span className="font-medium">Negocio:</span>{' '}
                                  <span className="break-words">
                                    {appointment.site_name || appointment.location || 'Sin nombre'}
                                  </span>
                                </span>
                                <span className="flex-shrink-0">
                                  <span className="font-medium">Hora:</span> {formatStartTime(appointment)} -{' '}
                                  {formatEndTime(appointment)}
                                </span>
                                <span className="flex-shrink-0">
                                  <span className="font-medium">Lugar:</span>{' '}
                                  <span className="break-words">{appointment.location || 'Sin lugar'}</span>
                                </span>
                              </div>
                              {appointment.description && (
                                <p className="text-sm text-muted-foreground mb-2 break-words">
                                  {appointment.description}
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            ))}
          </div>
        )}
      </section>

      {/* Columna secundaria: Recomendados */}
      {user.activeRole === 'client' && (
        <aside aria-label="Negocios recomendados" className="max-w-full">
          <RecommendedBusinesses />
        </aside>
      )}
    </div>
  )
}
