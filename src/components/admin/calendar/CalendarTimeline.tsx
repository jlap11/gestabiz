import React from 'react'
import { User, Eye, EyeOff } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { formatTimeInColombia } from './calendarUtils'

interface Employee {
  id: string
  user_id: string
  profile_name: string
  profile_avatar?: string
  lunch_break_start?: string | null
  lunch_break_end?: string | null
  has_lunch_break?: boolean
  services?: string[]
}

interface Appointment {
  id: string
  start_time: string
  end_time: string
  status: string
  service_name: string
  service_price: number
  client_name: string
  employee_id: string
  employee_name: string
  location_id?: string
  notes?: string
}

interface CalendarTimelineProps {
  employees: Employee[]
  hours: number[]
  showServices: boolean
  setShowServices: (show: boolean) => void
  getAppointmentsForSlot: (employeeId: string, hour: number) => Appointment[]
  isBusinessHour: (hour: number) => boolean
  isLunchBreak: (hour: number, employee: Employee) => boolean
  getAppointmentClass: (status: string) => string
  setSelectedAppointment: (appointment: Appointment) => void
  currentTimePosition: number | null
  isSelectedDateToday: boolean
  timelineRef: React.RefObject<HTMLDivElement>
  employeeColors: string[]
}

export function CalendarTimeline({
  employees,
  hours,
  showServices,
  setShowServices,
  getAppointmentsForSlot,
  isBusinessHour,
  isLunchBreak,
  getAppointmentClass,
  setSelectedAppointment,
  currentTimePosition,
  isSelectedDateToday,
  timelineRef,
  employeeColors
}: CalendarTimelineProps) {
  const { t } = useLanguage()

  return (
    <section 
      className="bg-card border border-border rounded-lg overflow-hidden"
      aria-labelledby="calendar-grid-title"
    >
      <h2 id="calendar-grid-title" className="sr-only">
        Calendario de citas por empleado
      </h2>
      
      {/* Services Toggle Button */}
      <div className="bg-muted/30 border-b border-border px-4 py-2 flex items-center justify-end gap-2">
        <button
          onClick={() => setShowServices(!showServices)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors duration-200 font-medium min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-pressed={showServices}
          aria-label={showServices ? t('admin.appointmentCalendar.hideServices') : t('admin.appointmentCalendar.showServices')}
          title={showServices ? t('admin.appointmentCalendar.hideServices') : t('admin.appointmentCalendar.showServices')}
        >
          {showServices ? (
            <>
              <EyeOff className="h-4 w-4" aria-hidden="true" />
              {t('admin.appointmentCalendar.hideServices')}
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" aria-hidden="true" />
              {t('admin.appointmentCalendar.showServices')}
            </>
          )}
        </button>
      </div>

      <div className="overflow-x-auto" role="region" aria-label="Calendario de citas desplazable">
        <div className="inline-block min-w-full">
          {/* Header with employee names */}
          <div 
            className="flex border-b-2 border-border bg-muted/50 sticky top-0 z-20"
            role="row"
            aria-label="Encabezado del calendario con empleados"
          >
            <div 
              className="w-16 sm:w-20 flex-shrink-0 p-2 sm:p-3 font-semibold text-xs sm:text-sm text-muted-foreground border-r-2 border-border bg-background"
              role="columnheader"
              aria-label="Columna de horas"
            >
              {t('calendar.hour')}
            </div>
            {employees.map((employee, index) => (
              <div
                key={employee.id}
                className={`flex-1 min-w-[200px] sm:min-w-[280px] p-2 sm:p-3 border-r-2 border-border last:border-r-0 ${employeeColors[index % employeeColors.length]}`}
                role="columnheader"
                aria-label={`Columna de ${employee.profile_name || 'empleado sin nombre'}`}
              >
                <div className="flex flex-col items-center gap-1 sm:gap-2">
                  <div className="flex items-center gap-1 sm:gap-2">
                    {employee.profile_avatar ? (
                      <img
                        src={employee.profile_avatar}
                        alt={employee.profile_name || t('admin.appointmentCalendar.noEmployeeName')}
                        className="h-6 w-6 sm:h-8 sm:w-8 rounded-full ring-2 ring-white dark:ring-gray-800 object-cover"
                      />
                    ) : (
                      <div 
                        className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-primary/20 flex items-center justify-center ring-2 ring-white dark:ring-gray-800"
                        aria-label={`Avatar de ${employee.profile_name || 'empleado sin nombre'}`}
                      >
                        <User className="h-3 w-3 sm:h-4 sm:w-4 text-primary" aria-hidden="true" />
                      </div>
                    )}
                    <span className="font-semibold text-xs sm:text-sm text-foreground truncate max-w-[120px] sm:max-w-none">
                      {employee.profile_name || t('admin.appointmentCalendar.noEmployeeName')}
                    </span>
                  </div>

                  {/* Services - only show if toggle is ON */}
                  {showServices && employee.services && employee.services.length > 0 && (
                    <div 
                      className="flex flex-wrap gap-1 justify-center mt-1"
                      role="list"
                      aria-label={`Servicios de ${employee.profile_name || 'empleado'}`}
                    >
                      {employee.services.map((serviceName, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-1.5 sm:px-2 py-0.5 bg-primary/10 text-primary rounded-full border border-primary/20"
                          role="listitem"
                        >
                          {serviceName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Time slots */}
          <div 
            ref={timelineRef} 
            className="relative max-h-[600px] overflow-y-auto"
            role="grid"
            aria-label="Horarios de citas del calendario"
          >
            {hours.map(hour => {
              const isWorkHour = isBusinessHour(hour)
              const workHourClass = isWorkHour ? '' : 'bg-muted/40'

              // Verificar si la línea debe aparecer en esta hora
              const shouldShowLineInHour =
                currentTimePosition !== null &&
                isSelectedDateToday &&
                Math.floor(currentTimePosition / (100 / 24)) === hour

              return (
                <div
                  key={hour}
                  className={`flex border-b border-border min-h-[80px] ${workHourClass} hover:bg-muted/20 transition-colors relative`}
                  role="row"
                  aria-label={`Horario ${hour.toString().padStart(2, '0')}:00 ${isWorkHour ? '(horario laboral)' : '(fuera de horario laboral)'}`}
                >
                  {/* Línea de hora actual - SOLO si es la hora correcta */}
                  {shouldShowLineInHour && currentTimePosition !== null && (
                    <div
                      className="absolute left-0 right-0 h-0.5 bg-blue-500 z-10 pointer-events-none"
                      style={{
                        top: `${((currentTimePosition % (100 / 24)) / (100 / 24)) * 80}px`,
                      }}
                      aria-label="Indicador de hora actual"
                    >
                      <div className="absolute -left-2 -top-2 w-4 h-4 bg-blue-500 rounded-full shadow-lg"></div>
                    </div>
                  )}

                  <div 
                    className="w-16 sm:w-20 flex-shrink-0 p-1 sm:p-2 text-xs sm:text-sm text-muted-foreground font-medium border-r-2 border-border bg-background"
                    role="rowheader"
                    aria-label={`Hora ${hour.toString().padStart(2, '0')}:00`}
                  >
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  {employees.map((employee, index) => {
                    const slotAppointments = getAppointmentsForSlot(employee.user_id, hour)
                    const isLunch = isLunchBreak(hour, employee)

                    return (
                      <div
                        key={employee.id}
                        className={`flex-1 min-w-[200px] sm:min-w-[280px] p-1 sm:p-2 border-r-2 border-border last:border-r-0 transition-colors ${
                          isLunch
                            ? 'bg-gray-100 dark:bg-gray-900 opacity-60 cursor-not-allowed'
                            : `hover:bg-accent/50 ${employeeColors[index % employeeColors.length]}`
                        }`}
                        role="gridcell"
                        aria-label={`Citas de ${employee.profile_name || 'empleado'} a las ${hour.toString().padStart(2, '0')}:00`}
                      >
                        {isLunch ? (
                          <div 
                            className="flex items-center justify-center h-full text-xs text-muted-foreground italic"
                            role="status"
                            aria-label="Horario de almuerzo"
                          >
                            {t('employeePrefs.schedule.lunchBreak')}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {slotAppointments.map(apt => {
                              const appointmentClass = getAppointmentClass(apt.status)

                              return (
                                <button
                                  key={apt.id}
                                  onClick={() => setSelectedAppointment(apt)}
                                  className={`w-full p-1.5 sm:p-2 rounded-md text-left text-xs hover:opacity-80 transition-opacity shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 ${appointmentClass}`}
                                  aria-label={`Cita de ${apt.client_name} para ${apt.service_name} de ${formatTimeInColombia(apt.start_time)} a ${formatTimeInColombia(apt.end_time)}, estado: ${apt.status}`}
                                  title={`${apt.client_name} - ${apt.service_name}`}
                                >
                                  <div className="font-medium truncate">{apt.client_name}</div>
                                  <div className="truncate text-xs opacity-90">{apt.service_name}</div>
                                  <div className="text-xs opacity-75">
                                    {formatTimeInColombia(apt.start_time)} -{' '}
                                    {formatTimeInColombia(apt.end_time)}
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}