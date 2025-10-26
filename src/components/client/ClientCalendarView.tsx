import React, { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface AppointmentWithRelations {
  id: string
  business_id: string
  location_id?: string
  service_id?: string
  user_id: string
  client_id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled'
  notes?: string
  price?: number
  currency?: string
  business?: {
    id: string
    name: string
    description?: string
  }
  location?: {
    id: string
    name: string
    address?: string
  }
  employee?: {
    id: string
    full_name: string
    email?: string
    phone?: string
    avatar_url?: string
  }
  service?: {
    id: string
    name: string
    description?: string
    duration?: number
    price?: number
    currency?: string
  }
}

type CalendarView = 'day' | 'week' | 'month'

interface ClientCalendarViewProps {
  appointments: AppointmentWithRelations[]
  onAppointmentClick?: (appointment: AppointmentWithRelations) => void
  onCreateAppointment?: (date: Date, time?: string) => void
}

export function ClientCalendarView({ appointments, onAppointmentClick, onCreateAppointment }: ClientCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarView>('month')
  const [hoveredDay, setHoveredDay] = useState<string | null>(null)

  // Navigation functions
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
      const day = start.getDay()
      const diff = start.getDate() - day + (day === 0 ? -6 : 1) // Monday as first day
      start.setDate(diff)
      start.setHours(0, 0, 0, 0)
      end.setDate(start.getDate() + 6)
      end.setHours(23, 59, 59, 999)
    } else {
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      end.setMonth(start.getMonth() + 1)
      end.setDate(0)
      end.setHours(23, 59, 59, 999)
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
    return filteredAppointments.filter(apt => {
      const aptDate = new Date(apt.start_time)
      return (
        aptDate.getFullYear() === date.getFullYear() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getDate() === date.getDate()
      )
    })
  }

  // Format header title
  const getHeaderTitle = (): string => {
    const options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' }
    if (view === 'day') {
      return currentDate.toLocaleDateString('es-MX', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      })
    } else if (view === 'week') {
      const { start, end } = getDateRange
      return `${start.getDate()} ${start.toLocaleDateString('es-MX', { month: 'short' })} - ${end.getDate()} ${end.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}`
    }
    return currentDate.toLocaleDateString('es-MX', options)
  }

  // Get status badge variant
  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    if (status === 'confirmed') return 'default'
    if (status === 'cancelled') return 'destructive'
    return 'secondary'
  }

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      scheduled: 'Agendada',
      confirmed: 'Confirmada',
      in_progress: 'En Proceso',
      completed: 'Completada',
      cancelled: 'Cancelada',
      no_show: 'No Asistió',
      rescheduled: 'Reagendada'
    }
    return labels[status] || status
  }

  // Render appointment card
  const renderAppointmentCard = (appointment: AppointmentWithRelations, compact = false) => (
    <Card
      key={appointment.id}
      className={cn(
        "cursor-pointer hover:shadow-md transition-all hover:border-primary/50 hover:bg-accent/50",
        compact && "mb-2"
      )}
      onClick={() => onAppointmentClick?.(appointment)}
    >
      <CardContent className={cn("p-3", compact && "p-2")}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate hover:text-foreground">
              {appointment.service?.name || appointment.title}
            </p>
            {appointment.business?.name && (
              <p className="text-xs text-muted-foreground truncate hover:text-muted-foreground">
                {appointment.business.name}
              </p>
            )}
          </div>
          <Badge variant={getStatusVariant(appointment.status)} className="flex-shrink-0 text-xs">
            {getStatusLabel(appointment.status)}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground hover:text-muted-foreground">
          <CalendarIcon className="h-3 w-3" />
          <span>
            {new Date(appointment.start_time).toLocaleTimeString('es-MX', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
          {appointment.service?.duration && (
            <span className="text-muted-foreground hover:text-muted-foreground">
              • {appointment.service.duration} min
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )

  // Render Day View with hourly slots
  const renderDayView = () => {
    const dayAppointments = getAppointmentsForDate(currentDate)
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const isToday = 
      currentDate.getDate() === now.getDate() &&
      currentDate.getMonth() === now.getMonth() &&
      currentDate.getFullYear() === now.getFullYear()

    // Verificar si una hora es válida para agendar (90 minutos desde ahora si es hoy)
    const isHourAvailable = (hour: number): boolean => {
      if (!isToday) return true
      const hourInMinutes = hour * 60
      const nowInMinutes = currentHour * 60 + currentMinute
      return hourInMinutes >= nowInMinutes + 90
    }

    // Obtener citas para una hora específica
    const getAppointmentsForHour = (hour: number): AppointmentWithRelations[] => {
      return dayAppointments.filter(apt => {
        const aptHour = new Date(apt.start_time).getHours()
        return aptHour === hour
      })
    }

    return (
      <div className="space-y-1">
        {hours.map(hour => {
          const hourAppointments = getAppointmentsForHour(hour)
          const hourTime = `${hour.toString().padStart(2, '0')}:00`
          const isCurrentHour = isToday && hour === currentHour
          const canCreateAppointment = isHourAvailable(hour)

          return (
            <div key={hour} className="relative">
              {/* Línea indicadora de hora actual */}
              {isCurrentHour && (
                <div className="absolute left-0 right-0 top-0 z-10 flex items-center">
                  <div className="h-0.5 flex-1 bg-primary"></div>
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                </div>
              )}
              
              <div
                className={cn(
                  "group flex items-start gap-2 border-b border-border p-2 min-h-[60px] transition-colors relative",
                  isCurrentHour && "bg-primary/5",
                  canCreateAppointment && "hover:bg-muted/30"
                )}
              >
                {/* Hora */}
                <div className={cn(
                  "text-sm font-semibold w-16 flex-shrink-0",
                  isCurrentHour ? "text-primary" : "text-muted-foreground"
                )}>
                  {hourTime}
                </div>

                {/* Citas */}
                <div className="flex-1 flex items-start gap-2">
                  {hourAppointments.length > 0 ? (
                    <div className="flex-1 space-y-2">
                      {hourAppointments.map(apt => (
                        <div key={apt.id} className="w-full">
                          {renderAppointmentCard(apt, true)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 text-xs text-muted-foreground py-2">
                      {canCreateAppointment ? 'Sin citas' : 'No disponible'}
                    </div>
                  )}
                </div>

                {/* Botón de agregar cita (visible al hover con group) */}
                {canCreateAppointment && onCreateAppointment && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-primary-foreground hover:border-primary"
                    onClick={(e) => {
                      e.stopPropagation()
                      onCreateAppointment(currentDate, hourTime)
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Render Week View
  const renderWeekView = () => {
    const { start } = getDateRange
    const days = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start)
      day.setDate(start.getDate() + i)
      return day
    })

    const now = new Date()

    // Verificar si un día es válido para agendar
    const isDayAvailable = (day: Date): boolean => {
      const isToday = 
        day.getDate() === now.getDate() &&
        day.getMonth() === now.getMonth() &&
        day.getFullYear() === now.getFullYear()
      
      if (!isToday) return true
      
      // Para hoy, verificar que haya al menos 90 minutos disponibles
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()
      const minutesLeft = (24 * 60) - (currentHour * 60 + currentMinute)
      return minutesLeft >= 90
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
        {days.map(day => {
          const dayAppointments = getAppointmentsForDate(day)
          const isToday = 
            day.getDate() === now.getDate() &&
            day.getMonth() === now.getMonth() &&
            day.getFullYear() === now.getFullYear()
          const canCreate = isDayAvailable(day)

          return (
            <div key={day.toISOString()} className="min-h-[200px] flex flex-col">
              <div className={cn(
                "text-center p-2 rounded-t-lg font-semibold",
                isToday ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                <div className="text-xs uppercase">
                  {day.toLocaleDateString('es-MX', { weekday: 'short' })}
                </div>
                <div className="text-lg">
                  {day.getDate()}
                </div>
              </div>
              <div className="space-y-2 mt-2 flex-1">
                {dayAppointments.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Sin citas</p>
                ) : (
                  dayAppointments
                    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                    .map(apt => renderAppointmentCard(apt, true))
                )}
              </div>
              {/* Botón para agregar cita */}
              {canCreate && onCreateAppointment && (
                <div className="mt-2 pt-2 border-t border-border">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full hover:bg-primary hover:text-primary-foreground hover:border-primary"
                    onClick={() => onCreateAppointment(day)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // Render Month View
  const renderMonthView = () => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    const startDate = new Date(firstDay)
    const day = startDate.getDay()
    startDate.setDate(startDate.getDate() - (day === 0 ? 6 : day - 1))

    const weeks: Date[][] = []
    let currentWeek: Date[] = []
    const currentDay = new Date(startDate)

    while (currentDay <= lastDay || currentWeek.length < 7) {
      currentWeek.push(new Date(currentDay))
      if (currentWeek.length === 7) {
        weeks.push([...currentWeek])
        currentWeek = []
      }
      currentDay.setDate(currentDay.getDate() + 1)
      
      if (currentDay > lastDay && currentWeek.length === 0) break
    }

    const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

    return (
      <div className="space-y-2">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-sm font-semibold text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        {weeks.map((week) => {
          const weekKey = week[0].toISOString()
          return (
            <div key={weekKey} className="grid grid-cols-7 gap-2">
              {week.map((day) => {
                const dayKey = day.toISOString()
                const dayAppointments = getAppointmentsForDate(day)
                const isCurrentMonth = day.getMonth() === currentDate.getMonth()
                const now = new Date()
                const isToday = 
                  day.getDate() === now.getDate() &&
                  day.getMonth() === now.getMonth() &&
                  day.getFullYear() === now.getFullYear()

                // Verificar si se puede crear cita en este día
                const canCreateAppointment = (() => {
                  if (!isToday) return true
                  const currentHour = now.getHours()
                  const currentMinute = now.getMinutes()
                  const minutesLeft = (24 * 60) - (currentHour * 60 + currentMinute)
                  return minutesLeft >= 90
                })()

                const isHovered = hoveredDay === dayKey

                return (
                  <div
                    key={dayKey}
                    className={cn(
                      "min-h-[120px] border rounded-lg p-2 relative transition-colors",
                      !isCurrentMonth && "bg-muted/30",
                      isToday && "border-primary border-2 bg-primary/5",
                      canCreateAppointment && "hover:bg-muted/30"
                    )}
                    onMouseEnter={() => setHoveredDay(dayKey)}
                    onMouseLeave={() => setHoveredDay(null)}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className={cn(
                        "text-sm font-semibold",
                        isCurrentMonth ? "text-foreground" : "text-muted-foreground",
                        isToday && "text-primary"
                      )}>
                        {day.getDate()}
                      </div>
                      
                      {/* Botón de agregar cita (visible al hover) */}
                      {canCreateAppointment && isHovered && onCreateAppointment && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 hover:bg-primary hover:text-primary-foreground"
                          onClick={(e) => {
                            e.stopPropagation()
                            onCreateAppointment(day)
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 2).map(apt => (
                        <button
                          key={apt.id}
                          type="button"
                          className="text-xs p-1 rounded bg-primary/10 hover:bg-primary/20 cursor-pointer truncate w-full text-left transition-colors"
                          onClick={() => onAppointmentClick?.(apt)}
                        >
                          <div className="font-medium truncate text-foreground">
                            {new Date(apt.start_time).toLocaleTimeString('es-MX', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          <div className="truncate text-muted-foreground">
                            {apt.service?.name || apt.title}
                          </div>
                        </button>
                      ))}
                      {dayAppointments.length > 2 && (
                        <div className="text-xs text-muted-foreground text-center">
                          +{dayAppointments.length - 2} más
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with navigation and view controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={navigatePrevious}
            className="hover:bg-primary hover:text-primary-foreground hover:border-primary"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goToToday}
            className="hover:bg-primary hover:text-primary-foreground hover:border-primary"
          >
            Hoy
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={navigateNext}
            className="hover:bg-primary hover:text-primary-foreground hover:border-primary"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold text-foreground ml-2">
            {getHeaderTitle()}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={view === 'day' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('day')}
            className={cn(
              view !== 'day' && "hover:bg-primary hover:text-primary-foreground hover:border-primary"
            )}
          >
            Día
          </Button>
          <Button
            variant={view === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('week')}
            className={cn(
              view !== 'week' && "hover:bg-primary hover:text-primary-foreground hover:border-primary"
            )}
          >
            Semana
          </Button>
          <Button
            variant={view === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('month')}
            className={cn(
              view !== 'month' && "hover:bg-primary hover:text-primary-foreground hover:border-primary"
            )}
          >
            Mes
          </Button>
        </div>
      </div>

      {/* Calendar content */}
      <div>
        {view === 'day' && renderDayView()}
        {view === 'week' && renderWeekView()}
        {view === 'month' && renderMonthView()}
      </div>
    </div>
  )
}
