/**
 * Utilities for business registration form
 */

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validates required fields in business form
 */
export function validateRequiredFields(formData: Record<string, any>, requiredFields: string[]): string[] {
  return requiredFields.filter(field => !formData[field])
}

/**
 * Formats price input for display
 */
export function formatPriceForDisplay(price: number | string): string {
  if (typeof price === 'string' && price === '') {
    return ''
  }
  
  return Number(price).toLocaleString('es-MX', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

/**
 * Cleans and parses price input
 */
export function parsePriceInput(input: string): number | string {
  // Clean input to allow only digits and dots
  let raw = input.replace(/[^\d.]/g, '')
  
  // Replace multiple dots with single dot
  const parts = raw.split('.')
  if (parts.length > 2) {
    raw = parts[0] + '.' + parts.slice(1).join('')
  }
  
  if (raw === '') {
    return ''
  }
  
  const num = parseFloat(raw)
  return !isNaN(num) ? num : ''
}

/**
 * Validates coordinate values
 */
export function isValidCoordinate(latitude: string, longitude: string): boolean {
  const lat = parseFloat(latitude)
  const lng = parseFloat(longitude)
  
  return (
    !isNaN(lat) && 
    !isNaN(lng) && 
    lat >= -90 && 
    lat <= 90 && 
    lng >= -180 && 
    lng <= 180
  )
}

/**
 * Formats coordinates for storage
 */
export function formatCoordinatesForStorage(latitude: string, longitude: string): { latitude: number | null; longitude: number | null } {
  return {
    latitude: latitude ? parseFloat(latitude) : null,
    longitude: longitude ? parseFloat(longitude) : null,
  }
}

/**
 * Validates business hours
 */
export function validateBusinessHours(businessHours: Record<string, { open: string; close: string; closed: boolean }>): boolean {
  const openDays = Object.values(businessHours).filter(hours => !hours.closed)
  
  if (openDays.length === 0) {
    return false // At least one day should be open
  }
  
  return openDays.every(hours => {
    const openTime = new Date(`1970-01-01T${hours.open}:00`)
    const closeTime = new Date(`1970-01-01T${hours.close}:00`)
    return openTime < closeTime
  })
}

/**
 * Default business hours configuration
 */
export const DEFAULT_BUSINESS_HOURS = {
  monday: { open: '09:00', close: '18:00', closed: false },
  tuesday: { open: '09:00', close: '18:00', closed: false },
  wednesday: { open: '09:00', close: '18:00', closed: false },
  thursday: { open: '09:00', close: '18:00', closed: false },
  friday: { open: '09:00', close: '18:00', closed: false },
  saturday: { open: '09:00', close: '14:00', closed: false },
  sunday: { open: '09:00', close: '14:00', closed: true },
}

/**
 * Creates a new service template
 */
export function createNewService() {
  return {
    _key: crypto.randomUUID(),
    name: '',
    category: '',
    duration: 60,
    price: 0,
    description: '',
  }
}