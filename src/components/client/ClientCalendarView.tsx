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
        className="p-3 sm:p-4 space-y-3"
      >
        <h4 id="day-view-title" className="sr-only">
          {t('clientDashboard.calendar.dayViewTitle', {
            date: d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
          })}
        </h4>
        
        {/* Day header with date info */}
        <div className="flex items-center justify-between pb-2 border-b">
          <div>
            <h5 className="text-lg sm:text-xl font-semibold">
              {d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h5>
            <p className="text-sm text-muted-foreground">
              {appts.length} {appts.length === 1 ? 'cita' : 'citas'}
            </p>
          </div>
          {onCreateAppointment && (
            <Button
              onClick={() => onCreateAppointment(d)}
              size="sm"
              className="min-h-[44px] min-w-[44px] touch-manipulation"
              aria-label={t('clientDashboard.calendar.addAppointment')}
              title={t('clientDashboard.calendar.addAppointment')}
            >
              <Plus className="h-4 w-4 sm:mr-2" aria-hidden="true" /> 
              <span className="hidden sm:inline">{t('clientDashboard.calendar.addAppointment')}</span>
            </Button>
          )}
        </div>

        {/* Appointments list */}
        <div role="list" aria-label={t('clientDashboard.calendar.appointmentsForDay')} className="space-y-2">
          {appts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm sm:text-base">No hay citas programadas para este día</p>
            </div>
          ) : (
            appts.map(a => (
              <Card
                key={a.id}
                className="cursor-pointer hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[60px] sm:min-h-[70px] touch-manipulation"
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
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm sm:text-base font-semibold truncate mb-1">
                        {a.service?.name || a.title}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                        <span>{formatTimeInTZ(a.start_time)}</span>
                        {a.business?.name && (
                          <>
                            <span>•</span>
                            <span className="truncate">{a.business.name}</span>
                          </>
                        )}
                      </div>
                      {a.employee?.full_name && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Con: {a.employee.full_name}
                        </div>
                      )}
                    </div>
                    <Badge 
                      variant={a.status === 'confirmed' ? 'default' : 'secondary'} 
                      className="flex-shrink-0 text-xs"
                    >
                      {a.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
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
        className="p-2 sm:p-4"
      >
        <h4 id="week-view-title" className="sr-only">
          {t('clientDashboard.calendar.weekViewTitle', {
            start: String(start.getDate()),
            end: String(days[6].getDate()),
            monthYear: start.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }),
          })}
        </h4>
        
        {/* Week grid - responsive layout */}
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3" role="grid" aria-label={t('clientDashboard.calendar.weekGrid')}>
          {days.map(d => {
            const dayAppts = getAppointmentsForDate(d)
            const nowParts = extractTimeZoneParts(new Date(), DEFAULT_TIME_ZONE)
            const dayParts = extractTimeZoneParts(d, DEFAULT_TIME_ZONE)
            const isToday = dayParts.day === nowParts.day && dayParts.month === nowParts.month && dayParts.year === nowParts.year

            return (
              <Card
                key={d.toISOString()}
                className={cn(
                  "min-h-[140px] sm:min-h-[160px] transition-all duration-200 hover:shadow-md",
                  isToday && "border-primary border-2 bg-primary/5"
                )}
                role="gridcell"
                aria-selected={isToday}
                aria-label={(() => {
                  const dateLabel = d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
                  const countStr = String(dayAppts.length)
                  return t('clientDashboard.calendar.daySummary', {
                    date: dateLabel,
                    count: countStr,
                    todaySuffix: isToday ? `, ${t('clientDashboard.calendar.todayShort')}` : '',
                  })
                })()}
              >
                <CardContent className="p-2 sm:p-3 h-full flex flex-col">
                  {/* Day header */}
                  <div className="flex items-center justify-between mb-2 pb-1 border-b border-border/50">
                    <div className="text-xs sm:text-sm font-semibold">
                      <div className="hidden sm:block">
                        {d.toLocaleDateString('es-MX', { weekday: 'short' })}
                      </div>
                      <div>{d.getDate()}</div>
                    </div>
                    <Badge variant="secondary" className="text-xs h-5 min-w-[20px] flex items-center justify-center">
                      {dayAppts.length}
                    </Badge>
                  </div>
                  
                  {/* Appointments list */}
                  <div className="flex-1 space-y-1 overflow-hidden" role="list" aria-label={t('clientDashboard.calendar.appointmentsForDay')}>
                    {dayAppts.slice(0, 4).map(a => (
                      <div
                        key={a.id}
                        className="text-xs cursor-pointer p-1.5 rounded hover:bg-muted transition-colors focus:outline-none focus:ring-1 focus:ring-primary min-h-[28px] flex items-center touch-manipulation"
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
                      >
                        <div className="truncate flex-1">
                          <div className="font-medium truncate">{a.service?.name || a.title}</div>
                          <div className="text-muted-foreground">{formatTimeInTZ(a.start_time)}</div>
                        </div>
                      </div>
                    ))}
                    {dayAppts.length > 4 && (
                      <div className="text-xs text-muted-foreground text-center py-1">
                        +{dayAppts.length - 4} más
                      </div>
                    )}
                  </div>
                  
                  {/* Add appointment button */}
                  {onCreateAppointment && (
                    <div className="mt-2 pt-1 border-t border-border/50">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCreateAppointment(d)}
                        className="w-full h-8 text-xs touch-manipulation"
                        aria-label={t('clientDashboard.calendar.addAppointment')}
                      >
                        <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                        <span className="hidden sm:inline">Agregar</span>
                        <span className="sm:hidden">+</span>
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
        className="p-2 sm:p-4"
      >
        <h4 id="month-view-title" className="sr-only">
          {t('clientDashboard.calendar.monthViewTitle', {
            monthYear: start.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }),
          })}
        </h4>
        
        {/* Month grid - responsive layout */}
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-1.5 sm:gap-2" role="grid" aria-label={t('clientDashboard.calendar.monthGrid')}>
          {days.map(d => {
            const appts = getAppointmentsForDate(d)
            const nowParts = extractTimeZoneParts(new Date(), DEFAULT_TIME_ZONE)
            const dayParts = extractTimeZoneParts(d, DEFAULT_TIME_ZONE)
            const isToday = dayParts.day === nowParts.day && dayParts.month === nowParts.month && dayParts.year === nowParts.year

            return (
              <Card
                key={d.toISOString()}
                className={cn(
                  'min-h-[80px] xs:min-h-[100px] sm:min-h-[120px] transition-all duration-200 hover:shadow-md cursor-pointer',
                  isToday && 'border-primary border-2 bg-primary/5'
                )}
                role="gridcell"
                aria-selected={isToday}
                tabIndex={0}
                onClick={() => onCreateAppointment?.(d)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onCreateAppointment?.(d)
                  }
                }}
                aria-label={t('clientDashboard.calendar.daySummary', {
                  date: d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
                  count: String(appts.length),
                  todaySuffix: isToday ? `, ${t('clientDashboard.calendar.todayShort')}` : '',
                })}
              >
                <CardContent className="p-1.5 sm:p-2 h-full flex flex-col">
                  {/* Day header */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs sm:text-sm font-semibold">
                      {d.getDate()}
                    </div>
                    {appts.length > 0 && (
                      <Badge variant="secondary" className="text-xs h-4 min-w-[16px] flex items-center justify-center">
                        {appts.length}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Appointments preview */}
                  <div className="flex-1 space-y-0.5 overflow-hidden" role="list" aria-label={t('clientDashboard.calendar.appointmentsForDay')}>
                    {appts.slice(0, 2).map(a => (
                      <div
                        key={a.id}
                        className="text-xs cursor-pointer p-1 rounded hover:bg-muted transition-colors focus:outline-none focus:ring-1 focus:ring-primary min-h-[20px] flex items-center touch-manipulation"
                        onClick={(e) => {
                          e.stopPropagation()
                          onAppointmentClick?.(a)
                        }}
                        role="listitem"
                        tabIndex={0}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            e.stopPropagation()
                            onAppointmentClick?.(a)
                          }
                        }}
                        aria-label={t('clientDashboard.calendar.openAppointmentAt', {
                          title: a.service?.name || a.title,
                          time: formatTimeInTZ(a.start_time),
                        })}
                      >
                        <div className="truncate text-xs">
                          {a.service?.name || a.title}
                        </div>
                      </div>
                    ))}
                    {appts.length > 2 && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{appts.length - 2}
                      </div>
                    )}
                  </div>
                  
                  {/* Add appointment indicator */}
                  {onCreateAppointment && appts.length === 0 && (
                    <div className="flex-1 flex items-center justify-center">
                      <Plus className="h-3 w-3 text-muted-foreground/50" aria-hidden="true" />
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
      className="space-y-3 sm:space-y-4 max-w-full mx-auto px-2 sm:px-4"
    >
      <h2 id="calendar-main-title" className="sr-only">
        Calendario de citas
      </h2>
      
      {/* Enhanced mobile-first header with better touch targets */}
      <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
        {/* Navigation controls - optimized for mobile */}
        <nav 
          className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3" 
          role="navigation" 
          aria-label={t('clientDashboard.calendar.controlsAria')}
        >
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={navigatePrevious}
              className="hover:bg-primary hover:text-primary-foreground hover:border-primary min-h-[48px] min-w-[48px] p-2 sm:p-3 touch-manipulation"
              aria-label={t('clientDashboard.calendar.prevPeriod')}
              title={t('clientDashboard.calendar.prevPeriod')}
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="hover:bg-primary hover:text-primary-foreground hover:border-primary min-h-[48px] px-3 sm:px-4 touch-manipulation text-xs sm:text-sm"
              aria-label={t('clientDashboard.calendar.today')}
              title={t('clientDashboard.calendar.today')}
            >
              <span className="hidden xs:inline">{t('clientDashboard.calendar.today')}</span>
              <span className="xs:hidden">Hoy</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={navigateNext}
              className="hover:bg-primary hover:text-primary-foreground hover:border-primary min-h-[48px] min-w-[48px] p-2 sm:p-3 touch-manipulation"
              aria-label={t('clientDashboard.calendar.nextPeriod')}
              title={t('clientDashboard.calendar.nextPeriod')}
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
            </Button>
          </div>

          {/* Current period display - responsive text */}
          <div className="text-center sm:text-left">
            <h3 className="text-sm sm:text-lg font-semibold text-foreground">
              {view === 'day' && currentDate.toLocaleDateString('es-MX', { 
                weekday: 'short', 
                day: 'numeric', 
                month: 'short',
                year: 'numeric' 
              })}
              {view === 'week' && `${getDateRange.start.toLocaleDateString('es-MX', { 
                day: 'numeric', 
                month: 'short' 
              })} - ${getDateRange.end.toLocaleDateString('es-MX', { 
                day: 'numeric', 
                month: 'short',
                year: 'numeric' 
              })}`}
              {view === 'month' && currentDate.toLocaleDateString('es-MX', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </h3>
          </div>
        </nav>

        {/* View selector - mobile-optimized */}
        <div 
          className="flex items-center gap-1 sm:gap-2 bg-muted/50 p-1 rounded-lg"
          role="tablist" 
          aria-label={t('clientDashboard.calendar.viewSelector')}
        >
          <Button
            variant={view === 'day' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('day')}
            className={cn(
              view !== 'day' && 'hover:bg-primary/10 hover:text-primary',
              'min-h-[44px] min-w-[44px] px-2 sm:px-3 text-xs sm:text-sm touch-manipulation transition-all duration-200'
            )}
            role="tab"
            aria-selected={view === 'day'}
            aria-controls="calendar-content"
            aria-label={t('clientDashboard.calendar.day')}
            title={t('clientDashboard.calendar.day')}
          >
            <span className="hidden sm:inline">{t('clientDashboard.calendar.day')}</span>
            <span className="sm:hidden">Día</span>
          </Button>
          <Button
            variant={view === 'week' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('week')}
            className={cn(
              view !== 'week' && 'hover:bg-primary/10 hover:text-primary',
              'min-h-[44px] min-w-[44px] px-2 sm:px-3 text-xs sm:text-sm touch-manipulation transition-all duration-200'
            )}
            role="tab"
            aria-selected={view === 'week'}
            aria-controls="calendar-content"
            aria-label={t('clientDashboard.calendar.week')}
            title={t('clientDashboard.calendar.week')}
          >
            <span className="hidden sm:inline">{t('clientDashboard.calendar.week')}</span>
            <span className="sm:hidden">Sem</span>
          </Button>
          <Button
            variant={view === 'month' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('month')}
            className={cn(
              view !== 'month' && 'hover:bg-primary/10 hover:text-primary',
              'min-h-[44px] min-w-[44px] px-2 sm:px-3 text-xs sm:text-sm touch-manipulation transition-all duration-200'
            )}
            role="tab"
            aria-selected={view === 'month'}
            aria-controls="calendar-content"
            aria-label={t('clientDashboard.calendar.month')}
            title={t('clientDashboard.calendar.month')}
          >
            <span className="hidden sm:inline">{t('clientDashboard.calendar.month')}</span>
            <span className="sm:hidden">Mes</span>
          </Button>
        </div>
      </div>

      {/* Calendar content with improved mobile layout */}
      <div 
        id="calendar-content"
        className="overflow-hidden rounded-lg border bg-card"
        role="tabpanel"
        aria-labelledby="calendar-main-title"
      >
        {view === 'day' && renderDayView()}
        {view === 'week' && renderWeekView()}
        {view === 'month' && renderMonthView()}
      </div>
    </section>
  )
}