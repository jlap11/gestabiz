import { Appointment, AppointmentFilter } from '@/types'

function inDateRange(apt: Appointment, dateRange: { start: string; end: string }): boolean {
  const src =
    apt.start_time || (apt.date && apt.startTime ? `${apt.date}T${apt.startTime}` : undefined)
  if (!src) return false
  const appointmentDate = new Date(src)
  const startDate = new Date(dateRange.start)
  const endDate = new Date(dateRange.end)
  return appointmentDate >= startDate && appointmentDate <= endDate
}

function matchesClients(apt: Appointment, clients?: string[]): boolean {
  if (!clients || clients.length === 0) return true
  const id = apt.client_id || apt.clientId
  return !!id && clients.includes(id)
}

function matchesTags(apt: Appointment, tags?: string[]): boolean {
  if (!tags || tags.length === 0) return true
  return Array.isArray(apt.tags) && tags.some(tag => apt.tags!.includes(tag))
}

function matchesPriority(apt: Appointment, priorities?: string[]): boolean {
  if (!priorities || priorities.length === 0) return true
  return !!apt.priority && priorities.includes(apt.priority)
}

function matchesSearch(apt: Appointment, search?: string): boolean {
  if (!search) return true
  const searchLower = search.toLowerCase()
  const fields = [
    apt.title,
    apt.clientName || apt.client_name,
    apt.description,
    apt.notes,
    apt.location,
  ]
    .filter(Boolean)
    .map(v => (v as string).toLowerCase())
  return fields.some(f => f.includes(searchLower))
}

export function filterAppointments(
  appointments: Appointment[],
  filters: AppointmentFilter
): Appointment[] {
  const hasStatus = !!filters.status?.length
  const hasDateRange = !!filters.dateRange
  return appointments.filter(apt => {
    if (hasStatus && !filters.status!.includes(apt.status)) return false
    if (hasDateRange && !inDateRange(apt, filters.dateRange!)) return false
    if (!matchesClients(apt, filters.clients)) return false
    if (!matchesTags(apt, filters.tags)) return false
    if (!matchesPriority(apt, filters.priority)) return false
    if (!matchesSearch(apt, filters.search)) return false
    return true
  })
}

export function sortAppointments(
  appointments: Appointment[],
  sortBy: 'date' | 'client' | 'status' | 'priority',
  order: 'asc' | 'desc' = 'asc'
): Appointment[] {
  return [...appointments].sort((a, b) => {
    let comparison = 0
    const aDateStr = a.start_time || (a.date && a.startTime ? `${a.date}T${a.startTime}` : '')
    const bDateStr = b.start_time || (b.date && b.startTime ? `${b.date}T${b.startTime}` : '')
    const aClient = a.clientName || a.client_name || ''
    const bClient = b.clientName || b.client_name || ''
    const statusOrder = ['scheduled', 'completed', 'cancelled', 'no_show'] as const
    const priorityOrder = ['high', 'medium', 'low'] as const
    const aPriorityCache: 'low' | 'medium' | 'high' = a.priority || 'low'
    const bPriorityCache: 'low' | 'medium' | 'high' = b.priority || 'low'

    switch (sortBy) {
      case 'date':
        comparison = new Date(aDateStr).getTime() - new Date(bDateStr).getTime()
        break

      case 'client':
        comparison = aClient.localeCompare(bClient)
        break

      case 'status':
        comparison =
          statusOrder.indexOf(a.status as (typeof statusOrder)[number]) -
          statusOrder.indexOf(b.status as (typeof statusOrder)[number])
        break

      case 'priority':
        comparison = priorityOrder.indexOf(aPriorityCache) - priorityOrder.indexOf(bPriorityCache)
        break
    }

    return order === 'desc' ? -comparison : comparison
  })
}

export function getUpcomingAppointments(
  appointments: Appointment[],
  limit: number = 5
): Appointment[] {
  const now = new Date()

  return appointments
    .filter(
      apt =>
        apt.status === 'scheduled' &&
        new Date(
          apt.start_time || (apt.date && apt.startTime ? `${apt.date}T${apt.startTime}` : '')
        ) > now
    )
    .sort((a, b) => {
      const dateA = new Date(
        a.start_time || (a.date && a.startTime ? `${a.date}T${a.startTime}` : '')
      )
      const dateB = new Date(
        b.start_time || (b.date && b.startTime ? `${b.date}T${b.startTime}` : '')
      )
      return dateA.getTime() - dateB.getTime()
    })
    .slice(0, limit)
}

export function getAppointmentsByDateRange(
  appointments: Appointment[],
  start: Date,
  end: Date
): Appointment[] {
  return appointments.filter(apt => {
    const src =
      apt.start_time || (apt.date && apt.startTime ? `${apt.date}T${apt.startTime}` : undefined)
    if (!src) return false
    const appointmentDate = new Date(src)
    return appointmentDate >= start && appointmentDate <= end
  })
}

export function groupAppointmentsByDate(appointments: Appointment[]): {
  [date: string]: Appointment[]
} {
  return appointments.reduce(
    (groups, appointment) => {
      const date =
        appointment.date ||
        (appointment.start_time ? appointment.start_time.split('T')[0] : undefined)
      if (!date) return groups
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(appointment)
      return groups
    },
    {} as { [date: string]: Appointment[] }
  )
}

export function getAvailableTimeSlots(
  appointments: Appointment[],
  date: string,
  workingHours: { start: string; end: string },
  slotDuration: number = 60
): string[] {
  const dayAppointments = appointments.filter(
    apt => apt.date === date && apt.status !== 'cancelled'
  )

  const slots: string[] = []
  const startHour = parseInt(workingHours.start.split(':')[0])
  const startMinute = parseInt(workingHours.start.split(':')[1])
  const endHour = parseInt(workingHours.end.split(':')[0])
  const endMinute = parseInt(workingHours.end.split(':')[1])

  const currentTime = new Date()
  currentTime.setHours(startHour, startMinute, 0, 0)

  const endTime = new Date()
  endTime.setHours(endHour, endMinute, 0, 0)

  while (currentTime < endTime) {
    const timeString = currentTime.toTimeString().slice(0, 5)

    // Check if this slot conflicts with existing appointments
    const hasConflict = dayAppointments.some(apt => {
      const aptStart = new Date(`1970-01-01T${apt.startTime}`)
      const aptEnd = new Date(`1970-01-01T${apt.endTime}`)
      const slotStart = new Date(`1970-01-01T${timeString}`)
      const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000)

      return slotStart < aptEnd && slotEnd > aptStart
    })

    if (!hasConflict) {
      slots.push(timeString)
    }

    currentTime.setMinutes(currentTime.getMinutes() + slotDuration)
  }

  return slots
}
