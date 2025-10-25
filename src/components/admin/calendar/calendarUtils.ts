import { parseISO } from 'date-fns'
import { DEFAULT_TIME_ZONE, extractTimeZoneParts } from '@/lib/utils'

// Utility functions for calendar operations
export const isSameDayInTimeZone = (dateA: Date, dateB: Date, timeZone: string = DEFAULT_TIME_ZONE) => {
  const optionsA = { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' } as const
  const optionsB = { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' } as const
  return dateA.toLocaleDateString('en-CA', optionsA) === dateB.toLocaleDateString('en-CA', optionsB)
}

export const formatTimeInColombia = (isoString: string): string => {
  const date = parseISO(isoString)
  const { hours, minutes } = extractTimeZoneParts(date, DEFAULT_TIME_ZONE)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

// Constants
export const EMPLOYEE_COLORS = [
  'bg-blue-50 dark:bg-blue-950/30',
  'bg-green-50 dark:bg-green-950/30',
  'bg-purple-50 dark:bg-purple-950/30',
  'bg-orange-50 dark:bg-orange-950/30',
  'bg-pink-50 dark:bg-pink-950/30',
  'bg-indigo-50 dark:bg-indigo-950/30',
  'bg-yellow-50 dark:bg-yellow-950/30',
  'bg-red-50 dark:bg-red-950/30',
]

export const HOURS_24 = Array.from({ length: 24 }, (_, i) => i)

// Appointment status styling
export const getAppointmentClass = (status: string): string => {
  switch (status) {
    case 'confirmed':
      return 'bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100 border border-blue-200 dark:border-blue-800'
    case 'completed':
      return 'bg-green-100 dark:bg-green-900/50 text-green-900 dark:text-green-100 border border-green-200 dark:border-green-800'
    case 'cancelled':
      return 'bg-red-100 dark:bg-red-900/50 text-red-900 dark:text-red-100 border border-red-200 dark:border-red-800'
    case 'no_show':
      return 'bg-gray-100 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-800'
    default:
      return 'bg-gray-100 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-800'
  }
}