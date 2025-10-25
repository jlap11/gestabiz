import { useCallback, useMemo } from 'react'
import { isWithinInterval, parseISO } from 'date-fns'
import { DEFAULT_TIME_ZONE, extractTimeZoneParts } from '@/lib/utils'
import { isSameDayInTimeZone } from './calendarUtils'
import { Appointment, Employee, LocationWithHours } from './useCalendarData'

export const useCalendarHelpers = (
  selectedDate: Date,
  appointments: Appointment[],
  locations: LocationWithHours[],
  filterStatus: string[],
  filterLocation: string[]
) => {
  // Helper functions
  const isBusinessHour = useCallback((hour: number): boolean => {
    if (locations.length === 0) return true

    const relevantLocations = filterLocation.length > 0 
      ? locations.filter(loc => filterLocation.includes(loc.id))
      : locations

    return relevantLocations.some(location => {
      if (!location.opens_at || !location.closes_at) return true

      const opensHour = parseInt(location.opens_at.split(':')[0])
      const closesHour = parseInt(location.closes_at.split(':')[0])

      return hour >= opensHour && hour < closesHour
    })
  }, [locations, filterLocation])

  const isLunchBreak = useCallback((hour: number, employee: Employee): boolean => {
    if (!employee.has_lunch_break || !employee.lunch_break_start || !employee.lunch_break_end) {
      return false
    }

    const lunchStart = parseInt(employee.lunch_break_start.split(':')[0])
    const lunchEnd = parseInt(employee.lunch_break_end.split(':')[0])

    return hour >= lunchStart && hour < lunchEnd
  }, [])

  const getAppointmentsForSlot = useCallback((employeeId: string, hour: number): Appointment[] => {
    return appointments.filter(apt => {
      const startTime = parseISO(apt.start_time)
      const endTime = parseISO(apt.end_time)
      const slotStart = new Date(selectedDate)
      slotStart.setHours(hour, 0, 0, 0)
      const slotEnd = new Date(selectedDate)
      slotEnd.setHours(hour + 1, 0, 0, 0)

      const isInTimeSlot = isWithinInterval(startTime, { start: slotStart, end: slotEnd }) ||
                          isWithinInterval(slotStart, { start: startTime, end: endTime })

      const matchesEmployee = apt.employee_id === employeeId
      const matchesStatus = filterStatus.includes(apt.status)
      const matchesLocation = filterLocation.length === 0 || 
                             (apt.location_id && filterLocation.includes(apt.location_id))

      return isInTimeSlot && matchesEmployee && matchesStatus && matchesLocation
    })
  }, [appointments, selectedDate, filterStatus, filterLocation])

  // Current time position
  const currentTimePosition = useMemo(() => {
    const now = new Date()
    if (!isSameDayInTimeZone(selectedDate, now)) return null

    const { hours, minutes } = extractTimeZoneParts(now, DEFAULT_TIME_ZONE)
    return (hours * 60 + minutes) / (24 * 60) * 100
  }, [selectedDate])

  const isSelectedDateToday = useMemo(() => {
    return isSameDayInTimeZone(selectedDate, new Date())
  }, [selectedDate])

  return {
    isBusinessHour,
    isLunchBreak,
    getAppointmentsForSlot,
    currentTimePosition,
    isSelectedDateToday,
  }
}