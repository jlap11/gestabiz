import { useCallback, useState } from 'react'
import { Employee, LocationWithHours } from './useCalendarData'

export const useCalendarFilters = (
  locations: LocationWithHours[],
  services: { id: string; name: string }[],
  employees: Employee[]
) => {
  // Filter states
  const [filterStatus, setFilterStatus] = useState<string[]>(['confirmed', 'completed', 'cancelled', 'no_show'])
  const [filterLocation, setFilterLocation] = useState<string[]>([])
  const [filterService, setFilterService] = useState<string[]>([])
  const [filterEmployee, setFilterEmployee] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  // Dropdown states
  const [openDropdowns, setOpenDropdowns] = useState({
    status: false,
    location: false,
    service: false,
    employee: false,
  })

  // Initialize filters when data is loaded
  const initializeFilters = useCallback(() => {
    setFilterLocation(locations.map(l => l.id))
    setFilterService(services.map(s => s.id))
    setFilterEmployee(employees.map(e => e.user_id))
  }, [locations, services, employees])

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilterStatus(['confirmed', 'completed', 'cancelled', 'no_show'])
    setFilterLocation(locations.map(l => l.id))
    setFilterService(services.map(s => s.id))
    setFilterEmployee(employees.map(e => e.user_id))
  }, [locations, services, employees])

  return {
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
  }
}