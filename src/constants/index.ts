/**
 * Application Constants
 * Centralized configuration values and magic numbers
 */

// App Configuration
export const APP_CONFIG = {
  NAME: 'AppointmentPro',
  VERSION: '1.0.0',
  DESCRIPTION: 'Sistema de Gestión de Citas',
  DEFAULT_LOCALE: 'es',
  DEFAULT_THEME: 'dark',
  DEFAULT_TIMEZONE: 'Europe/Madrid'
} as const

// Business Settings
export const BUSINESS_CONFIG = {
  DEFAULT_APPOINTMENT_DURATION: 60, // minutes
  DEFAULT_BUFFER_TIME: 15, // minutes
  MAX_ADVANCE_BOOKING_DAYS: 365,
  MIN_ADVANCE_BOOKING_HOURS: 2,
  DEFAULT_CANCELLATION_HOURS: 24,
  MAX_LOCATIONS_PER_BUSINESS: 10,
  MAX_EMPLOYEES_PER_BUSINESS: 50,
  MAX_SERVICES_PER_BUSINESS: 100
} as const

// UI Constants
export const UI_CONFIG = {
  SIDEBAR_WIDTH: 280,
  MOBILE_BREAKPOINT: 768,
  TOAST_DURATION: 4000,
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 200
} as const

// Date & Time Formats
export const DATE_FORMATS = {
  SHORT: 'DD/MM/YYYY',
  LONG: 'dddd, DD [de] MMMM [de] YYYY',
  DATETIME: 'DD/MM/YYYY HH:mm',
  TIME: 'HH:mm'
} as const

// Notification Settings
export const NOTIFICATION_CONFIG = {
  REMINDER_TIMES: [
    { label: '1 día antes', hours: 24 },
    { label: '1 hora antes', hours: 1 },
    { label: '15 minutos antes', minutes: 15 }
  ],
  MAX_RETRIES: 3
} as const

// API Configuration
export const API_CONFIG = {
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  BASE_URL: import.meta.env.VITE_SUPABASE_URL || ''
} as const

// File Upload Limits
export const FILE_CONFIG = {
  MAX_SIZE_MB: 5,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'text/plain', 'application/msword']
} as const

// Status Colors for UI
export const STATUS_COLORS = {
  scheduled: 'blue',
  in_progress: 'yellow',
  completed: 'green',
  cancelled: 'red',
  rescheduled: 'orange'
} as const

export const PRIORITY_COLORS = {
  high: 'red',
  medium: 'yellow',
  low: 'green'
} as const

// Role Colors
export const ROLE_COLORS = {
  admin: 'purple',
  employee: 'blue',
  client: 'green'
} as const

export const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))'
] as const

// Regular Expressions
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[+]?[\d\s-()]{8,}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  TIME_24H: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
  POSTAL_CODE: /^[0-9]{5}(-[0-9]{4})?$/
} as const

// Error Messages
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'Este campo es obligatorio',
  INVALID_EMAIL: 'Email inválido',
  INVALID_PHONE: 'Formato de teléfono inválido',
  INVALID_TIME: 'Formato de hora inválido (HH:MM)',
  PASSWORD_TOO_SHORT: 'La contraseña debe tener al menos 8 caracteres',
  UNAUTHORIZED: 'No tienes permisos para realizar esta acción',
  VALIDATION_ERROR: 'Error de validación',
  NETWORK_ERROR: 'Error de conexión'
} as const

export const SUCCESS_MESSAGES = {
  APPOINTMENT_CREATED: 'Cita creada exitosamente',
  APPOINTMENT_UPDATED: 'Cita actualizada exitosamente',
  APPOINTMENT_DELETED: 'Cita cancelada exitosamente',
  BUSINESS_CREATED: 'Negocio registrado exitosamente',
  PROFILE_UPDATED: 'Perfil actualizado exitosamente'
} as const

// Local Storage Keys
export const STORAGE_KEYS = {
  USER_THEME: 'appointment-pro-theme',
  USER_LANGUAGE: 'appointment-pro-language',
  USER_PREFERENCES: 'appointment-pro-preferences'
} as const

// Feature Flags
export const FEATURES = {
  GOOGLE_CALENDAR_SYNC: true,
  WHATSAPP_INTEGRATION: true,
  REPORTS_ANALYTICS: true,
  EMPLOYEE_MANAGEMENT: true,
  ONLINE_PAYMENTS: false,
  MULTI_LOCATION: true
} as const