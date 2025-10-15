import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { REGEX_PATTERNS } from '@/constants'

// Tailwind CSS class utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date formatting utilities
export const formatDate = (
  dateStr: string, 
  locale: string = 'en-US',
  options?: Intl.DateTimeFormatOptions
) => {
  const date = new Date(dateStr)
  const defaultOptions: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }
  return date.toLocaleDateString(locale, options || defaultOptions)
}

export const formatTime = (timeStr: string, format24h: boolean = false) => {
  const [hours, minutes] = timeStr.split(':')
  const hour24 = parseInt(hours)
  
  if (format24h) {
    return `${hour24.toString().padStart(2, '0')}:${minutes}`
  }
  
  let hour12 = hour24
  if (hour24 === 0) {
    hour12 = 12
  } else if (hour24 > 12) {
    hour12 = hour24 - 12
  }
  const ampm = hour24 < 12 ? 'AM' : 'PM'
  return `${hour12}:${minutes} ${ampm}`
}

export const formatDateTime = (dateStr: string, timeStr?: string, locale: string = 'en-US') => {
  const date = new Date(dateStr)
  if (timeStr) {
    const [hours, minutes] = timeStr.split(':')
    date.setHours(parseInt(hours), parseInt(minutes))
  }
  return date.toLocaleString(locale)
}

export const formatDateRange = (startDate: string, endDate?: string, locale: string = 'en-US') => {
  const start = new Date(startDate)
  
  if (!endDate) {
    return formatDate(startDate, locale)
  }
  
  const end = new Date(endDate)
  
  if (start.getFullYear() === end.getFullYear()) {
    if (start.getMonth() === end.getMonth()) {
      return `${start.toLocaleDateString(locale, { month: 'short' })} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`
    }
    return `${start.toLocaleDateString(locale, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(locale, { month: 'short', day: 'numeric' })}, ${start.getFullYear()}`
  }
  
  return `${formatDate(startDate, locale)} - ${formatDate(endDate, locale)}`
}

// Date utilities
export const isToday = (dateStr: string) => {
  const date = new Date(dateStr)
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

export const isTomorrow = (dateStr: string) => {
  const date = new Date(dateStr)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return date.toDateString() === tomorrow.toDateString()
}

export const isYesterday = (dateStr: string) => {
  const date = new Date(dateStr)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return date.toDateString() === yesterday.toDateString()
}

export const getRelativeDate = (dateStr: string, language: 'es' | 'en' = 'en') => {
  if (isToday(dateStr)) return language === 'es' ? 'Hoy' : 'Today'
  if (isTomorrow(dateStr)) return language === 'es' ? 'Mañana' : 'Tomorrow'
  if (isYesterday(dateStr)) return language === 'es' ? 'Ayer' : 'Yesterday'
  return formatDate(dateStr, language === 'es' ? 'es-ES' : 'en-US')
}

export const getDaysBetween = (startDate: string, endDate: string) => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export const addDays = (dateStr: string, days: number) => {
  const date = new Date(dateStr)
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

// Validation utilities
export const validateEmail = (email: string) => {
  return REGEX_PATTERNS.EMAIL.test(email)
}

export const validatePhone = (phone: string) => {
  return REGEX_PATTERNS.PHONE.test(phone.replace(/[\s\-()]/g, ''))
}

export const validateTime = (time: string) => {
  return REGEX_PATTERNS.TIME_24H.test(time)
}

export const validatePostalCode = (postalCode: string) => {
  return REGEX_PATTERNS.POSTAL_CODE.test(postalCode)
}

// Time utilities
export const generateTimeSlots = (
  startHour = 6, 
  endHour = 22, 
  intervalMinutes = 30,
  format24h = false
) => {
  const slots: Array<{ value: string; label: string }> = []
  
  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      if (hour === endHour && minute > 0) break
      
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      slots.push({
        value: timeStr,
        label: formatTime(timeStr, format24h)
      })
    }
  }
  
  return slots
}

export const getAppointmentDuration = (startTime: string, endTime: string) => {
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)
  
  const startMinutes = startHour * 60 + startMinute
  const endMinutes = endHour * 60 + endMinute
  
  const durationMinutes = endMinutes - startMinutes
  
  if (durationMinutes < 60) {
    return `${durationMinutes}m`
  }
  
  const hours = Math.floor(durationMinutes / 60)
  const minutes = durationMinutes % 60
  
  if (minutes === 0) {
    return `${hours}h`
  }
  
  return `${hours}h ${minutes}m`
}

export const addMinutesToTime = (time: string, minutes: number) => {
  const [hours, mins] = time.split(':').map(Number)
  const totalMinutes = hours * 60 + mins + minutes
  const newHours = Math.floor(totalMinutes / 60) % 24
  const newMins = totalMinutes % 60
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`
}

// String utilities
export const capitalizeFirst = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export const camelToSnake = (str: string) => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
}

export const snakeToCamel = (str: string) => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

export const slugify = (str: string) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/(^-+)|(-+$)/g, '')
}

// Social handle generator (Instagram-like):
// - lowercased
// - spaces/hyphens -> dots
// - prefixed with '@'
export const generateHandle = (name: string) => {
  const base = slugify(name)
    .replace(/-+/g, '.')
    .replace(/\.{2,}/g, '.')
  return `@${base}`
}

export const truncate = (str: string, length: number, suffix = '...') => {
  if (str.length <= length) return str
  return str.substring(0, length) + suffix
}

// Number utilities
/**
 * Formatea moneda en formato colombiano (COP)
 * Formato: $30.000 (punto para miles, sin decimales)
 */
export const formatCurrency = (
  amount: number, 
  currency = 'COP', 
  locale = 'es-CO'
) => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Formatea número con separador de miles (punto)
 * Formato: 30.000
 */
export const formatNumber = (num: number, locale = 'es-CO') => {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num)
}

export const formatPercentage = (value: number, locale = 'es-ES') => {
  return new Intl.NumberFormat(locale, { 
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / 100)
}

export const roundToDecimals = (num: number, decimals = 2) => {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

// Array utilities
export const groupBy = <T, K extends PropertyKey>(
  array: T[], 
  key: (item: T) => K
): Record<K, T[]> => {
  return array.reduce<Record<K, T[]>>((groups, item) => {
    const group = key(item)
    groups[group] = groups[group] || []
    groups[group].push(item)
    return groups
  }, {} as Record<K, T[]>)
}

export const unique = <T>(array: T[]): T[] => {
  return [...new Set(array)]
}

export const sortBy = <T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1
    if (aVal > bVal) return direction === 'asc' ? 1 : -1
    return 0
  })
}

// Debounce utility
export const debounce = <A extends unknown[], R>(
  func: (...args: A) => R,
  wait: number
): ((...args: A) => void) => {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: A) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Local storage utilities
export const storage = {
  get: <T>(key: string, defaultValue?: T): T | null => {
    try {
      const item = localStorage.getItem(key)
  return item ? JSON.parse(item) : (defaultValue ?? null)
    } catch {
  return defaultValue ?? null
    }
  },
  
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Handle quota exceeded or other errors silently
    }
  },
  
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key)
    } catch {
      // Handle errors silently
    }
  },
  
  clear: (): void => {
    try {
      localStorage.clear()
    } catch {
      // Handle errors silently
    }
  }
}

// URL utilities
export const getQueryParam = (param: string): string | null => {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get(param)
}

export const setQueryParam = (param: string, value: string): void => {
  const url = new URL(window.location.href)
  url.searchParams.set(param, value)
  window.history.pushState({}, '', url.toString())
}

export const removeQueryParam = (param: string): void => {
  const url = new URL(window.location.href)
  url.searchParams.delete(param)
  window.history.pushState({}, '', url.toString())
}

// Error handling utilities
export const safeExecute = async <T>(
  fn: () => Promise<T>,
  fallback?: T
): Promise<T | null> => {
  try {
    return await fn()
  } catch {
    return fallback ?? null
  }
}

export const retryAsync = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T | null> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  return null
}

// File utilities
export const getFileExtension = (filename: string): string => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}

export const isImageFile = (filename: string): boolean => {
  const ext = getFileExtension(filename).toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}