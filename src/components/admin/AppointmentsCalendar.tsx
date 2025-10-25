import React, { useEffect, useRef, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { 
  AppointmentModal, 
  CalendarFilters, 
  CalendarHeader, 
  CalendarTimeline 
} from './calendar'
import { useCalendarData } from './calendar/useCalendarData'
import { useCalendarFilters } from './calendar/useCalendarFilters'
import { useAppointmentActions } from './calendar/useAppointmentActions'
import { useCalendarHelpers } from './calendar/useCalendarHelpers'
import { getAppointmentClass, EMPLOYEE_COLORS, HOURS_24 } from './calendar/calendarUtils'
import type { Appointment } from './calendar/useCalendarData'

export const AppointmentsCalendar: React.FC = () => {
  const { t } = useLanguage()

  // State
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [showServices, setShowServices] = useState(false)

  // Custom hooks
  const { employees, appointments, isLoading, locations, services, fetchAppointments } = useCalendarData(selectedDate)
  
  const {
    filterStatus,
    setFilterStatus,
    filterLocation,
    setFilterLocation,
    filterService,
    setFilterService,
    filterEmployee,
    setFilterEmployee,
    showFilters,
    setShowFilters,
    openDropdowns,
    setOpenDropdowns,
    initializeFilters,
    resetFilters,
  } = useCalendarFilters(locations, services, employees)

  const { handleCompleteAppointment, handleCancelAppointment, handleNoShowAppointment } = useAppointmentActions(fetchAppointments)

  const {
    isBusinessHour,
    isLunchBreak,
    getAppointmentsForSlot,
    currentTimePosition,
    isSelectedDateToday,
  } = useCalendarHelpers(selectedDate, appointments, locations, filterStatus, filterLocation)

  // Refs
  const timelineRef = useRef<HTMLDivElement>(null)
  const statusBtnRef = useRef<HTMLButtonElement>(null)
  const locationBtnRef = useRef<HTMLButtonElement>(null)
  const serviceBtnRef = useRef<HTMLButtonElement>(null)
  const employeeBtnRef = useRef<HTMLButtonElement>(null)

  // Initialize filters when data is loaded
  useEffect(() => {
    if (locations.length > 0 || services.length > 0 || employees.length > 0) {
      initializeFilters()
    }
  }, [locations, services, employees, initializeFilters])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <CalendarHeader 
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      />

      <CalendarFilters
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterLocation={filterLocation}
        setFilterLocation={setFilterLocation}
        filterService={filterService}
        setFilterService={setFilterService}
        filterEmployee={filterEmployee}
        setFilterEmployee={setFilterEmployee}
        locations={locations}
        services={services}
        employees={employees}
        openDropdowns={openDropdowns}
        setOpenDropdowns={setOpenDropdowns}
        statusBtnRef={statusBtnRef}
        locationBtnRef={locationBtnRef}
        serviceBtnRef={serviceBtnRef}
        employeeBtnRef={employeeBtnRef}
        resetFilters={resetFilters}
      />

      <CalendarTimeline
        ref={timelineRef}
        employees={employees}
        hours={HOURS_24}
        employeeColors={EMPLOYEE_COLORS}
        isBusinessHour={isBusinessHour}
        isLunchBreak={isLunchBreak}
        getAppointmentsForSlot={getAppointmentsForSlot}
        getAppointmentClass={getAppointmentClass}
        currentTimePosition={currentTimePosition}
        isSelectedDateToday={isSelectedDateToday}
        onAppointmentClick={setSelectedAppointment}
      />

      <AppointmentModal
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        onComplete={handleCompleteAppointment}
        onCancel={handleCancelAppointment}
        onNoShow={handleNoShowAppointment}
      />
    </div>
  )
}