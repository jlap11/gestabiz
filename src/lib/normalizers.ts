import type { Business, Location, Service, Appointment, UserSettings } from '@/types'
import type { Row } from '@/lib/supabaseTyped'

export function normalizeService(row: Row<'services'>): Service {
  return {
    id: row.id,
    business_id: row.business_id,
    name: row.name,
    description: row.description ?? undefined,
    duration: row.duration_minutes,
    price: row.price,
    currency: row.currency || 'MXN',
    category: row.category || 'General',
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export function normalizeLocation(row: Row<'locations'>): Location {
  return {
    id: row.id,
    business_id: row.business_id,
    name: row.name,
    address: row.address,
    city: row.city,
    state: row.state || '',
    country: row.country,
    postal_code: row.postal_code || '',
    phone: row.phone ?? undefined,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    business_hours: {
      monday: { open: '09:00', close: '17:00', closed: false },
      tuesday: { open: '09:00', close: '17:00', closed: false },
      wednesday: { open: '09:00', close: '17:00', closed: false },
      thursday: { open: '09:00', close: '17:00', closed: false },
      friday: { open: '09:00', close: '17:00', closed: false },
      saturday: { open: '09:00', close: '17:00', closed: false },
      sunday: { open: '09:00', close: '17:00', closed: true },
    },
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export function normalizeBusiness(row: Row<'businesses'>): Business {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    category: 'Services',
    logo_url: row.logo_url ?? undefined,
    website: row.website ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    address: row.address ?? undefined,
    city: row.city ?? undefined,
    state: row.state ?? undefined,
    country: row.country ?? undefined,
    postal_code: row.postal_code ?? undefined,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    business_hours: (row.business_hours as unknown as Business['business_hours']) || {
      monday: { open: '09:00', close: '17:00', closed: false },
      tuesday: { open: '09:00', close: '17:00', closed: false },
      wednesday: { open: '09:00', close: '17:00', closed: false },
      thursday: { open: '09:00', close: '17:00', closed: false },
      friday: { open: '09:00', close: '17:00', closed: false },
      saturday: { open: '09:00', close: '17:00', closed: false },
      sunday: { open: '09:00', close: '17:00', closed: true },
    },
    timezone: 'America/Mexico_City',
    owner_id: row.owner_id,
    settings: (row.settings as unknown as Business['settings']) || {
      appointment_buffer: 15,
      advance_booking_days: 30,
      cancellation_policy: 24,
      auto_confirm: false,
      require_deposit: false,
      deposit_percentage: 0,
      currency: 'MXN',
    },
    created_at: row.created_at,
    updated_at: row.updated_at,
    is_active: row.is_active,
  }
}

export function normalizeAppointmentStatus(s: string): Appointment['status'] {
  if (s === 'pending') return 'scheduled'
  const allowed: Appointment['status'][] = [
    'scheduled','confirmed','in_progress','completed','cancelled','no_show','rescheduled'
  ]
  return (allowed as string[]).includes(s) ? (s as Appointment['status']) : 'scheduled'
}

// Mapear estado de dominio -> enum de DB
export function toDbAppointmentStatus(s: Appointment['status']): 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' {
  switch (s) {
    case 'scheduled':
      return 'pending'
    case 'in_progress':
      // No existe en DB, usamos "confirmed" como aproximación para permitir recordatorios
      return 'confirmed'
    case 'rescheduled':
      // No existe en DB; tratamos como confirmado tras reprogramar
      return 'confirmed'
    case 'confirmed':
      return 'confirmed'
    case 'completed':
      return 'completed'
    case 'cancelled':
      return 'cancelled'
    case 'no_show':
      return 'no_show'
    default:
      return 'pending'
  }
}

// Normalizador de citas desde la tabla de DB (campos mínimos)
export function normalizeAppointment(row: Row<'appointments'>): Appointment {
  return {
    id: row.id,
    business_id: row.business_id,
    location_id: row.location_id ?? undefined,
    service_id: row.service_id,
    user_id: row.employee_id ?? '',
    client_id: row.client_id,
    // Campos no presentes en la tabla: defaults seguros
    title: '',
    client_name: '',
    client_email: undefined,
    client_phone: undefined,
    client_whatsapp: undefined,
    description: row.notes ?? undefined,
    notes: row.client_notes ?? undefined,
    start_time: row.start_time,
    end_time: row.end_time,
    status: normalizeAppointmentStatus(row.status),
    location: undefined,
    price: row.price ?? undefined,
    currency: row.currency ?? undefined,
    reminder_sent: row.reminder_sent,
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by: row.cancelled_by ?? '',
    cancelled_reason: row.cancel_reason ?? undefined,
    rescheduled_from: undefined,
    google_calendar_event_id: undefined,
    // Legacy opcionales
    tags: undefined,
    priority: undefined,
    reminderSent: undefined,
  }
}

// User settings normalizer (shared)
type AnyRecord = Record<string, unknown>
const asString = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback)
const asNumber = (v: unknown, fallback = 0): number => {
  if (typeof v === 'number') return v
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}
const asBoolean = (v: unknown, fallback = false): boolean => (typeof v === 'boolean' ? v : Boolean(v ?? fallback))
const asNumberArray = (v: unknown, fallback: number[] = []): number[] => (
  Array.isArray(v) ? v.filter((x): x is number => typeof x === 'number') : fallback
)
const isTheme = (v: unknown): v is UserSettings['theme'] => v === 'light' || v === 'dark' || v === 'system'
const isDateFormat = (v: unknown): v is UserSettings['date_format'] => v === 'DD/MM/YYYY' || v === 'MM/DD/YYYY' || v === 'YYYY-MM-DD'
const isTimeFormat = (v: unknown): v is UserSettings['time_format'] => v === '12h' || v === '24h'
const isLanguage = (v: unknown): v is UserSettings['language'] => v === 'es' || v === 'en'

export function normalizeUserSettings(row: AnyRecord | null | undefined): UserSettings {
  const email_notifications = (row?.email_notifications as AnyRecord) ?? {}
  const whatsapp_notifications = (row?.whatsapp_notifications as AnyRecord) ?? {}
  const business_hours = (row?.business_hours as AnyRecord) ?? {}
  const lang = asString(row?.language, '')
  const theme = isTheme(row?.theme) ? row?.theme : 'system'
  return {
    id: asString(row?.id, ''),
    user_id: asString(row?.user_id, ''),
    theme,
    language: isLanguage(lang) ? lang : 'es',
    timezone: asString(row?.timezone, 'America/Mexico_City'),
    default_appointment_duration: asNumber(row?.default_appointment_duration, 60),
    business_hours: {
      start: asString(business_hours?.start, '09:00'),
      end: asString(business_hours?.end, '18:00'),
      days: asNumberArray(business_hours?.days, [1,2,3,4,5]),
    },
    auto_reminders: asBoolean(row?.auto_reminders, true),
    reminder_times: asNumberArray(row?.reminder_times, [1440, 60, 15]),
    email_notifications: {
      appointment_reminders: asBoolean(email_notifications?.appointment_reminders, true),
      appointment_confirmations: asBoolean(email_notifications?.appointment_confirmations, true),
      appointment_cancellations: asBoolean(email_notifications?.appointment_cancellations, true),
      daily_digest: asBoolean(email_notifications?.daily_digest, false),
      weekly_report: asBoolean(email_notifications?.weekly_report, false),
      marketing: asBoolean(email_notifications?.marketing, false),
    },
    whatsapp_notifications: {
      appointment_reminders: asBoolean(whatsapp_notifications?.appointment_reminders, false),
      appointment_confirmations: asBoolean(whatsapp_notifications?.appointment_confirmations, false),
      follow_ups: asBoolean(whatsapp_notifications?.follow_ups, false),
    },
  date_format: isDateFormat(row?.date_format) ? row?.date_format : 'DD/MM/YYYY',
  time_format: isTimeFormat(row?.time_format) ? row?.time_format : '24h',
    created_at: asString(row?.created_at, new Date().toISOString()),
    updated_at: asString(row?.updated_at, new Date().toISOString()),
  }
}
