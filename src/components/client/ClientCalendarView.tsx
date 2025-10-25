import React, { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DEFAULT_TIME_ZONE, cn, extractTimeZoneParts } from '@/lib/utils'
import type { Appointment } from '@/types'
import { useLanguage } from '@/contexts/LanguageContext'

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
  const { t } = useLanguage()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarView>('month')

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
      <section 
        role="region" 
        aria-labelledby="day-view-title"
        className="space-y-2"
      >
        <h4 id="day-view-title" className="sr-only">
          {t('clientDashboard.calendar.dayViewTitle', {
            date: d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
          })}
        </h4>
        <div role="list" aria-label={t('clientDashboard.calendar.appointmentsForDay')}>
          {appts.map(a => (
            <Card
              key={a.id}
              className="p-2 cursor-pointer hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px]"
              onClick={() => onAppointmentClick?.(a)}
              role="listitem"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onAppointmentClick?.(a)
                }
              }}
              aria-label={t('clientDashboard.calendar.openAppointmentAt', {
                title: a.service?.name || a.title,
                time: formatTimeInTZ(a.start_time),
              })}
              title={t('clientDashboard.calendar.openAppointmentAt', {
                title: a.service?.name || a.title,
                time: formatTimeInTZ(a.start_time),
              })}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate">{a.service?.name || a.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatTimeInTZ(a.start_time)}
                    </div>
                  </div>
                  <Badge className="ml-2 flex-shrink-0">{a.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {onCreateAppointment && (
          <div className="pt-2">
              <Button
              onClick={() => onCreateAppointment(d)}
              className="min-h-[44px] min-w-[44px] w-full sm:w-auto"
              aria-label={t('clientDashboard.calendar.addAppointment')}
              title={t('clientDashboard.calendar.addAppointment')}
            >
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" /> 
              <span className="hidden sm:inline">{t('clientDashboard.calendar.addAppointment')}</span>
              <span className="sm:hidden">{t('clientDashboard.calendar.addShort')}</span>
            </Button>
          </div>
        )}
      </section>
    )
  }

  const renderWeekView = () => {
    const start = new Date(getDateRange.start)
    const days = Array.from(
      { length: 7 },
      (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    )
    return (
      <section 
        role="region" 
        aria-labelledby="week-view-title"
      >
        <h4 id="week-view-title" className="sr-only">
          {t('clientDashboard.calendar.weekViewTitle', {
            start: String(start.getDate()),
            end: String(days[6].getDate()),
            monthYear: start.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }),
          })}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2" role="grid" aria-label={t('clientDashboard.calendar.weekGrid')}>
          {days.map(d => (
              <Card
                key={d.toISOString()}
                className="p-2 min-h-[120px]"
                role="gridcell"
                aria-label={(() => {
                  const dateLabel = d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
                  const countStr = String(getAppointmentsForDate(d).length)
                  const nowParts = extractTimeZoneParts(new Date(), DEFAULT_TIME_ZONE)
                  const dayParts = extractTimeZoneParts(d, DEFAULT_TIME_ZONE)
                  const isTodayLocal =
                    dayParts.day === nowParts.day &&
                    dayParts.month === nowParts.month &&
                    dayParts.year === nowParts.year

                  return t('clientDashboard.calendar.daySummary', {
                    date: dateLabel,
                    count: countStr,
                    todaySuffix: isTodayLocal ? `, ${t('clientDashboard.calendar.todayShort')}` : '',
                  })
                })()}
              >
              <CardContent className="p-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs sm:text-sm font-semibold">
                    {d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                  </div>
                  <Badge variant="secondary" className="text-xs">{getAppointmentsForDate(d).length}</Badge>
                </div>
                <div className="space-y-1" role="list" aria-label={t('clientDashboard.calendar.appointmentsForDay')}>
                  {getAppointmentsForDate(d).map(a => (
                    <div
                      key={a.id}
                      className="text-xs truncate cursor-pointer p-1 rounded hover:bg-muted transition-colors focus:outline-none focus:ring-1 focus:ring-primary min-h-[24px] flex items-center"
                      onClick={() => onAppointmentClick?.(a)}
                      role="listitem"
                      tabIndex={0}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onAppointmentClick?.(a)
                        }
                      }}
                      aria-label={t('clientDashboard.calendar.openAppointmentAt', {
                        title: a.service?.name || a.title,
                        time: formatTimeInTZ(a.start_time),
                      })}
                      title={t('clientDashboard.calendar.openAppointmentAt', {
                        title: a.service?.name || a.title,
                        time: formatTimeInTZ(a.start_time),
                      })}
                    >
                      <span className="truncate">{a.service?.name || a.title}</span>
                      <span className="hidden sm:inline"> • {formatTimeInTZ(a.start_time)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
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
      <section 
        role="region" 
        aria-labelledby="month-view-title"
      >
        <h4 id="month-view-title" className="sr-only">
          {t('clientDashboard.calendar.monthViewTitle', {
            monthYear: start.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }),
          })}
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2" role="grid" aria-label={t('clientDashboard.calendar.monthGrid')}>
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
                className={cn(
                  'p-2 min-h-[100px] sm:min-h-[120px] transition-colors hover:shadow-md',
                  isToday && 'border-primary border-2 bg-primary/5'
                )}
                role="gridcell"
                aria-selected={isToday}
                aria-label={t('clientDashboard.calendar.daySummary', {
                  date: d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
                  count: String(appts.length),
                  todaySuffix: isToday ? `, ${t('clientDashboard.calendar.todayShort')}` : '',
                })}
              >
                <CardContent className="p-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs sm:text-sm font-semibold">
                      {d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                    </div>
                    <Badge variant="secondary" className="text-xs">{appts.length}</Badge>
                  </div>
                  <div className="space-y-1" role="list" aria-label={t('clientDashboard.calendar.appointmentsForDay')}>
                    {appts.slice(0, 3).map(a => (
                      <div
                        key={a.id}
                        className="text-xs truncate cursor-pointer p-1 rounded hover:bg-muted transition-colors focus:outline-none focus:ring-1 focus:ring-primary min-h-[20px] flex items-center"
                        onClick={() => onAppointmentClick?.(a)}
                        role="listitem"
                        tabIndex={0}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            onAppointmentClick?.(a)
                          }
                        }}
                        aria-label={t('clientDashboard.calendar.openAppointmentAt', {
                          title: a.service?.name || a.title,
                          time: formatTimeInTZ(a.start_time),
                        })}
                        title={t('clientDashboard.calendar.openAppointmentAt', {
                          title: a.service?.name || a.title,
                          time: formatTimeInTZ(a.start_time),
                        })}
                      >
                        <span className="truncate">{a.service?.name || a.title}</span>
                        <span className="hidden sm:inline"> • {formatTimeInTZ(a.start_time)}</span>
                      </div>
                    ))}
                    {appts.length > 3 && (
                      <div className="text-xs text-muted-foreground" aria-label={`${appts.length - 3} citas adicionales`}>
                        {t('clientDashboard.calendar.moreCount', { count: String(appts.length - 3) })}
                      </div>
                    )}
                  </div>
                  {onCreateAppointment && (
                    <div className="mt-2 flex justify-end">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => onCreateAppointment(d)} 
                        className="min-h-[32px] min-w-[32px] p-1" 
                        aria-label={t('clientDashboard.calendar.addAppointment')} 
                        title={t('clientDashboard.calendar.addAppointment')}
                      >
                        <Plus className="h-3 w-3" aria-hidden="true" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>
    )
  }

  return (
    <section 
      role="main" 
      aria-labelledby="calendar-main-title"
      className="space-y-4 max-w-[95vw] mx-auto"
    >
      <h2 id="calendar-main-title" className="sr-only">
        Calendario de citas
      </h2>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <nav 
          className="flex flex-wrap items-center gap-2" 
          role="navigation" 
          aria-label={t('clientDashboard.calendar.controlsAria')}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={navigatePrevious}
            className="hover:bg-primary hover:text-primary-foreground hover:border-primary min-h-[44px] min-w-[44px]"
            aria-label={t('clientDashboard.calendar.prevPeriod')}
            title={t('clientDashboard.calendar.prevPeriod')}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="hover:bg-primary hover:text-primary-foreground hover:border-primary min-h-[44px] min-w-[44px]"
            aria-label={t('clientDashboard.calendar.today')}
            title={t('clientDashboard.calendar.today')}
          >
            <span className="hidden sm:inline">{t('clientDashboard.calendar.today')}</span>
            <span className="sm:hidden">Hoy</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={navigateNext}
            className="hover:bg-primary hover:text-primary-foreground hover:border-primary min-h-[44px] min-w-[44px]"
            aria-label={t('clientDashboard.calendar.nextPeriod')}
            title={t('clientDashboard.calendar.nextPeriod')}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
          <h3 className="text-base sm:text-lg font-semibold text-foreground ml-2 truncate">
            {getHeaderTitle()}
          </h3>
        </nav>

        <div 
          className="flex flex-wrap items-center gap-2" 
          role="group" 
          aria-label={t('clientDashboard.calendar.viewMode')}
        >
          <Button
            variant={view === 'day' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('day')}
            className={cn(
              view !== 'day' && 'hover:bg-primary hover:text-primary-foreground hover:border-primary',
              'min-h-[44px] min-w-[44px]'
            )}
            aria-label={t('clientDashboard.calendar.day')}
            aria-pressed={view === 'day'}
            title={t('clientDashboard.calendar.day')}
          >
            <span className="hidden sm:inline">{t('clientDashboard.calendar.day')}</span>
            <span className="sm:hidden">Día</span>
          </Button>
          <Button
            variant={view === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('week')}
            className={cn(
              view !== 'week' && 'hover:bg-primary hover:text-primary-foreground hover:border-primary',
              'min-h-[44px] min-w-[44px]'
            )}
            aria-label={t('clientDashboard.calendar.week')}
            aria-pressed={view === 'week'}
            title={t('clientDashboard.calendar.week')}
          >
            <span className="hidden sm:inline">{t('clientDashboard.calendar.week')}</span>
            <span className="sm:hidden">Sem</span>
          </Button>
          <Button
            variant={view === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('month')}
            className={cn(
              view !== 'month' && 'hover:bg-primary hover:text-primary-foreground hover:border-primary',
              'min-h-[44px] min-w-[44px]'
            )}
            aria-label={t('clientDashboard.calendar.month')}
            aria-pressed={view === 'month'}
            title={t('clientDashboard.calendar.month')}
          >
            <span className="hidden sm:inline">{t('clientDashboard.calendar.month')}</span>
            <span className="sm:hidden">Mes</span>
          </Button>
        </div>
      </div>

      <div className="overflow-hidden">
        {view === 'day' && renderDayView()}
        {view === 'week' && renderWeekView()}
        {view === 'month' && renderMonthView()}
      </div>
    </section>
  )
}