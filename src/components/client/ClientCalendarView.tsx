import React, { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DEFAULT_TIME_ZONE, cn, extractTimeZoneParts } from '@/lib/utils'
import type { Appointment } from '@/types'

type AppointmentWithRelations = Appointment & {
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

function formatTimeInTZ(dateStr: string): string {
  const date = new Date(dateStr)
  const { hour, minute } = extractTimeZoneParts(date, DEFAULT_TIME_ZONE)
  const h12 = hour % 12 || 12
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const mm = String(minute).padStart(2, '0')
  return `${h12}:${mm} ${ampm}`
}

export function ClientCalendarView({
  appointments,
  onAppointmentClick,
  onCreateAppointment,
}: ClientCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarView>('month')
  const [hoveredDay, setHoveredDay] = useState<string | null>(null)

  const navigatePrevious = () => {
    const newDate = new Date(currentDate)
    if (view === 'day') newDate.setDate(newDate.getDate() - 1)
    else if (view === 'week') newDate.setDate(newDate.getDate() - 7)
    else newDate.setMonth(newDate.getMonth() - 1)
    setCurrentDate(newDate)
  }

  const navigateNext = () => {
    const newDate = new Date(currentDate)
    if (view === 'day') newDate.setDate(newDate.getDate() + 1)
    else if (view === 'week') newDate.setDate(newDate.getDate() + 7)
    else newDate.setMonth(newDate.getMonth() + 1)
    setCurrentDate(newDate)
  }

  const goToToday = () => setCurrentDate(new Date())

  const getDateRange = useMemo((): { start: Date; end: Date } => {
    const start = new Date(currentDate)
    const end = new Date(currentDate)

    if (view === 'day') {
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
    } else if (view === 'week') {
      const day = start.getDay()
      const diff = start.getDate() - day + (day === 0 ? -6 : 1)
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

  const filteredAppointments = useMemo(() => {
    const { start, end } = getDateRange
    return appointments.filter(apt => {
      const aptDate = new Date(apt.start_time)
      return aptDate >= start && aptDate <= end
    })
  }, [appointments, getDateRange])

  const getAppointmentsForDate = (date: Date): AppointmentWithRelations[] => {
    const target = extractTimeZoneParts(date, DEFAULT_TIME_ZONE)
    return filteredAppointments.filter(apt => {
      const parts = extractTimeZoneParts(new Date(apt.start_time), DEFAULT_TIME_ZONE)
      return parts.year === target.year && parts.month === target.month && parts.day === target.day
    })
  }

  const getHeaderTitle = (): string => {
    const options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' }
    if (view === 'day') {
      return currentDate.toLocaleDateString('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    } else if (view === 'week') {
      const { start, end } = getDateRange
      return `${start.getDate()} ${start.toLocaleDateString('es-MX', { month: 'short' })} - ${end.getDate()} ${end.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}`
    }
    return currentDate.toLocaleDateString('es-MX', options)
  }

  const renderDayView = () => {
    const d = new Date(currentDate)
    const appts = getAppointmentsForDate(d)
    return (
      <div className="space-y-2">
        {appts.map(a => (
          <Card key={a.id} className="p-2" onClick={() => onAppointmentClick?.(a)}>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">{a.service?.name || a.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatTimeInTZ(a.start_time)}
                  </div>
                </div>
                <Badge>{a.status}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
        {onCreateAppointment && (
          <div className="pt-2">
            <Button onClick={() => onCreateAppointment(d)}>
              <Plus className="h-4 w-4 mr-2" /> Agregar cita
            </Button>
          </div>
        )}
      </div>
    )
  }

  const renderWeekView = () => {
    const start = new Date(getDateRange.start)
    const days = Array.from(
      { length: 7 },
      (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    )
    return (
      <div className="grid grid-cols-7 gap-2">
        {days.map(d => (
          <Card key={d.toISOString()} className="p-2">
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold">
                  {d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                </div>
                <Badge>{getAppointmentsForDate(d).length}</Badge>
              </div>
              <div className="space-y-1">
                {getAppointmentsForDate(d).map(a => (
                  <div
                    key={a.id}
                    className="text-xs truncate cursor-pointer"
                    onClick={() => onAppointmentClick?.(a)}
                  >
                    {a.service?.name || a.title} • {formatTimeInTZ(a.start_time)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const renderMonthView = () => {
    const start = new Date(getDateRange.start)
    const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate()
    const days = Array.from(
      { length: daysInMonth },
      (_, i) => new Date(start.getFullYear(), start.getMonth(), i + 1)
    )

    return (
      <div className="grid grid-cols-7 gap-2">
        {days.map(d => {
          const appts = getAppointmentsForDate(d)
          const nowParts = extractTimeZoneParts(new Date(), DEFAULT_TIME_ZONE)
          const dayParts = extractTimeZoneParts(d, DEFAULT_TIME_ZONE)
          const isToday =
            dayParts.day === nowParts.day &&
            dayParts.month === nowParts.month &&
            dayParts.year === nowParts.year

          return (
            <Card
              key={d.toISOString()}
              className={cn('p-2', isToday && 'border-primary border-2 bg-primary/5')}
            >
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold">
                    {d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                  </div>
                  <Badge>{appts.length}</Badge>
                </div>
                <div className="space-y-1">
                  {appts.slice(0, 3).map(a => (
                    <div
                      key={a.id}
                      className="text-xs truncate cursor-pointer"
                      onClick={() => onAppointmentClick?.(a)}
                    >
                      {a.service?.name || a.title} • {formatTimeInTZ(a.start_time)}
                    </div>
                  ))}
                  {appts.length > 3 && (
                    <div className="text-xs text-muted-foreground">+{appts.length - 3} más</div>
                  )}
                </div>
                {onCreateAppointment && (
                  <div className="mt-2 flex justify-end">
                    <Button size="sm" variant="outline" onClick={() => onCreateAppointment(d)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-4">
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
          <h3 className="text-lg font-semibold text-foreground ml-2">{getHeaderTitle()}</h3>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={view === 'day' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('day')}
            className={cn(
              view !== 'day' &&
                'hover:bg-primary hover:text-primary-foreground hover:border-primary'
            )}
          >
            Día
          </Button>
          <Button
            variant={view === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('week')}
            className={cn(
              view !== 'week' &&
                'hover:bg-primary hover:text-primary-foreground hover:border-primary'
            )}
          >
            Semana
          </Button>
          <Button
            variant={view === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('month')}
            className={cn(
              view !== 'month' &&
                'hover:bg-primary hover:text-primary-foreground hover:border-primary'
            )}
          >
            Mes
          </Button>
        </div>
      </div>

      <div>
        {view === 'day' && renderDayView()}
        {view === 'week' && renderWeekView()}
        {view === 'month' && renderMonthView()}
      </div>
    </div>
  )
}
