import type { Business, Location, Service, Appointment } from '@/types'
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
      monday: { open: '09:00', close: '17:00', is_open: true },
      tuesday: { open: '09:00', close: '17:00', is_open: true },
      wednesday: { open: '09:00', close: '17:00', is_open: true },
      thursday: { open: '09:00', close: '17:00', is_open: true },
      friday: { open: '09:00', close: '17:00', is_open: true },
      saturday: { open: '09:00', close: '17:00', is_open: true },
      sunday: { open: '09:00', close: '17:00', is_open: false },
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
