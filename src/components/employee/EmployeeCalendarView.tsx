import React, { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { EmployeeAppointmentsList } from './EmployeeAppointmentsList'
import { EmployeeAppointmentModal } from './EmployeeAppointmentModal'

interface AppointmentWithRelations {
  id: string
  business_id: string
  location_id?: string
  service_id?: string
  client_id: string
  employee_id?: string
  start_time: string
  end_time: string
  status: 'pending' | 'pending_confirmation' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  notes?: string
  price?: number
  currency?: string
  client_name?: string
  client_phone?: string
  client_email?: string
  service_name?: string
  location_name?: string
  location_address?: string
}

interface EmployeeCalendarViewProps {
  appointments: AppointmentWithRelations[]
  onRefresh?: () => void
}

type CalendarView = 'day' | 'week' | 'month'

export function EmployeeCalendarView({ appointments, onRefresh }: EmployeeCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarView>('month')
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithRelations | null>(null)

  // Navigation
  const navigatePrevious = () => {
    const newDate = new Date(currentDate)
    if (view === 'day') {
      newDate.setDate(newDate.getDate() - 1)
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setMonth(newDate.getMonth() - 1)
    }
    setCurrentDate(newDate)
  }

  const navigateNext = () => {
    const newDate = new Date(currentDate)
    if (view === 'day') {
      newDate.setDate(newDate.getDate() + 1)
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Get date range based on view
  const getDateRange = useMemo((): { start: Date; end: Date } => {
    const start = new Date(currentDate)
    const end = new Date(currentDate)

    if (view === 'day') {
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
    } else if (view === 'week') {
      const weekStart = startOfWeek(currentDate, { locale: es })
      const weekEnd = endOfWeek(currentDate, { locale: es })
      return { start: weekStart, end: weekEnd }
    } else {
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(currentDate)
      return { start: monthStart, end: monthEnd }
    }

    return { start, end }
  }, [currentDate, view])

  // Filter appointments by date range
  const filteredAppointments = useMemo(() => {
    const { start, end } = getDateRange
    return appointments.filter(apt => {
      const aptDate = new Date(apt.start_time)
      return aptDate >= start && aptDate <= end
    })
  }, [appointments, getDateRange])

  // Get appointments for a specific date
  const getAppointmentsForDate = (date: Date): AppointmentWithRelations[] => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.start_time)
      // Comparar solo año, mes y día para evitar problemas de zona horaria
      const aptYear = aptDate.getFullYear()
      const aptMonth = aptDate.getMonth()
      const aptDay = aptDate.getDate()
      
      const targetYear = date.getFullYear()
      const targetMonth = date.getMonth()
      const targetDay = date.getDate()
      
      return aptYear === targetYear && aptMonth === targetMonth && aptDay === targetDay
    })
  }

  // Format header title
  const getHeaderTitle = (): string => {
    if (view === 'day') {
      return format(currentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
    } else if (view === 'week') {
      const { start, end } = getDateRange
      return `${format(start, 'd MMM', { locale: es })} - ${format(end, "d MMM yyyy", { locale: es })}`
    }
    return format(currentDate, "MMMM 'de' yyyy", { locale: es })
  }

  // Render month view
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStart, { locale: es })
    const calendarEnd = endOfWeek(monthEnd, { locale: es })
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

    const weekDays = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']

    return (
      <div className="space-y-2">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, idx) => {
            const dayAppointments = getAppointmentsForDate(day)
            const isToday = isSameDay(day, new Date())
            const isCurrentMonth = isSameMonth(day, currentDate)

            return (
              <Card
                key={idx}
                className={cn(
                  "min-h-[100px] cursor-pointer hover:shadow-md transition-all",
                  !isCurrentMonth && "opacity-40",
                  isToday && "ring-2 ring-primary"
                )}
                onClick={() => {
                  setCurrentDate(day)
                  setView('day')
                }}
              >
                <CardContent className="p-2">
                  <div className={cn(
                    "text-sm font-semibold mb-1",
                    isToday && "text-primary"
                  )}>
                    {format(day, 'd')}
                  </div>
                  
                  {dayAppointments.length > 0 && (
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 2).map(apt => (
                        <div
                          key={apt.id}
                          className={cn(
                            "text-xs p-1 rounded truncate",
                            apt.status === 'confirmed' && "bg-green-100 text-green-800",
                            apt.status === 'pending' && "bg-yellow-100 text-yellow-800",
                            apt.status === 'completed' && "bg-blue-100 text-blue-800",
                            apt.status === 'cancelled' && "bg-red-100 text-red-800"
                          )}
                        >
                          {format(new Date(apt.start_time), 'HH:mm')}
                        </div>
                      ))}
                      {dayAppointments.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayAppointments.length - 2} más
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  // Render week view
  const renderWeekView = () => {
    const { start, end } = getDateRange
    const days = eachDayOfInterval({ start, end })

    return (
      <div className="space-y-4">
        {days.map(day => {
          const dayAppointments = getAppointmentsForDate(day)
          const isToday = isSameDay(day, new Date())

          return (
            <Card key={day.toISOString()} className={cn(isToday && "ring-2 ring-primary")}>
              <CardContent className="p-4">
                <h3 className={cn(
                  "font-semibold mb-3 capitalize",
                  isToday && "text-primary"
                )}>
                  {format(day, "EEEE, d 'de' MMMM", { locale: es })}
                </h3>
                
                {dayAppointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay citas</p>
                ) : (
                  <EmployeeAppointmentsList 
                    appointments={dayAppointments}
                    onRefresh={onRefresh}
                  />
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  // Get appointment status class (mismos estilos del admin)
  const getAppointmentClass = (status: string): string => {
    if (status === 'pending' || status === 'pending_confirmation') {
      return 'bg-yellow-50 border border-yellow-500 text-yellow-900 font-semibold dark:bg-yellow-900/30 dark:border-yellow-600 dark:text-yellow-100';
    }
    if (status === 'confirmed') {
      return 'bg-blue-100 border border-blue-500 text-blue-950 font-semibold dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-100';
    }
    if (status === 'completed') {
      return 'bg-green-100 border border-green-500 text-green-950 font-semibold dark:bg-green-900/30 dark:border-green-600 dark:text-green-100';
    }
    if (status === 'cancelled' || status === 'no_show') {
      return 'bg-red-100 border border-red-500 text-red-950 font-semibold dark:bg-red-900/30 dark:border-red-600 dark:text-red-100';
    }
    // Default para in_progress
    return 'bg-purple-100 border border-purple-500 text-purple-950 font-semibold dark:bg-purple-900/30 dark:border-purple-600 dark:text-purple-100';
  }

  // Render day view con línea de tiempo (24 horas)
  const renderDayView = () => {
    const dayAppointments = getAppointmentsForDate(currentDate)
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const now = new Date()
    const currentHour = now.getHours()
    const isToday = 
      currentDate.getDate() === now.getDate() &&
      currentDate.getMonth() === now.getMonth() &&
      currentDate.getFullYear() === now.getFullYear()

    // Obtener citas para una hora específica
    const getAppointmentsForHour = (hour: number): AppointmentWithRelations[] => {
      return dayAppointments.filter(apt => {
        const aptHour = new Date(apt.start_time).getHours()
        return aptHour === hour
      })
    }

    return (
      <div className="space-y-1 max-h-[600px] overflow-y-auto">
        {hours.map(hour => {
          const hourAppointments = getAppointmentsForHour(hour)
          const hourTime = `${hour.toString().padStart(2, '0')}:00`
          const isCurrentHour = isToday && hour === currentHour

          return (
            <div key={hour} className="relative" id={`day-hour-${hour}`}>
              {/* Línea indicadora de hora actual */}
              {isCurrentHour && (
                <div className="absolute left-0 right-0 top-0 z-10 flex items-center">
                  <div className="h-0.5 flex-1 bg-primary"></div>
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                </div>
              )}
              
              <div
                className={cn(
                  "flex items-start gap-2 border-b border-border p-2 min-h-[60px] transition-colors relative",
                  isCurrentHour && "bg-primary/5"
                )}
              >
                {/* Hora */}
                <div className={cn(
                  "text-sm font-semibold w-16 shrink-0",
                  isCurrentHour ? "text-primary" : "text-muted-foreground"
                )}>
                  {hourTime}
                </div>

                {/* Citas */}
                <div className="flex-1 flex items-start gap-2">
                  {hourAppointments.length > 0 ? (
                    <div className="flex-1 space-y-2">
                      {hourAppointments.map(apt => {
                        const appointmentClass = getAppointmentClass(apt.status)
                        
                        return (
                          <button
                            key={apt.id}
                            onClick={() => setSelectedAppointment(apt)}
                            className={`w-full p-2 rounded-md text-left text-xs hover:opacity-80 transition-opacity shadow-sm ${appointmentClass}`}
                          >
                            <div className="font-medium truncate">{apt.client_name || 'Cliente sin nombre'}</div>
                            <div className="truncate">{apt.service_name || 'Servicio no especificado'}</div>
                            <div className="text-xs opacity-75">
                              {format(new Date(apt.start_time), 'HH:mm', { locale: es })} - {format(new Date(apt.end_time), 'HH:mm', { locale: es })}
                            </div>
                            {apt.location_name && (
                              <div className="text-xs opacity-60 truncate mt-1">
                                📍 {apt.location_name}
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex-1 text-xs text-muted-foreground py-2">
                      Sin citas
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            {/* Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={navigatePrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Hoy
              </Button>
              <Button variant="outline" size="sm" onClick={navigateNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Title */}
            <h2 className="text-lg font-semibold capitalize">{getHeaderTitle()}</h2>

            {/* View Toggle */}
            <div className="flex gap-1">
              <Button
                variant={view === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('day')}
              >
                Día
              </Button>
              <Button
                variant={view === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('week')}
              >
                Semana
              </Button>
              <Button
                variant={view === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('month')}
              >
                Mes
              </Button>
            </div>
          </div>

          {/* Appointments count */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {filteredAppointments.length} cita{filteredAppointments.length !== 1 ? 's' : ''}
            </span>
            {filteredAppointments.length > 0 && (
              <div className="flex gap-2">
                <Badge variant="default">
                  {filteredAppointments.filter(a => a.status === 'confirmed').length} Confirmadas
                </Badge>
                <Badge variant="outline">
                  {filteredAppointments.filter(a => a.status === 'pending' || a.status === 'pending_confirmation').length} Pendientes
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Calendar Content */}
      {view === 'month' && renderMonthView()}
      {view === 'week' && renderWeekView()}
      {view === 'day' && renderDayView()}

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <EmployeeAppointmentModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
        />
      )}
    </div>
  )
}
