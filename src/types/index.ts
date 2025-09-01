// Re-export all types for centralized imports
export * from './types'

// Bring types into local scope for type guards
import type { UserRole, Appointment, Notification, Client, Business } from './types'

// Type guards and utilities
export function isValidUserRole(role: string): role is UserRole {
  return ['admin', 'employee', 'client'].includes(role)
}

export function isValidLanguage(language: string): language is 'es' | 'en' {
  return ['es', 'en'].includes(language)
}

export function isValidAppointmentStatus(status: string): status is Appointment['status'] {
  return ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled'].includes(status)
}

export function isValidNotificationType(type: string): type is Notification['type'] {
  return ['reminder_24h', 'reminder_1h', 'reminder_15m', 'cancelled', 'rescheduled'].includes(type)
}

// Helper types for common use cases
export type OptionalExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>
export type RequiredExcept<T, K extends keyof T> = Required<T> & Partial<Pick<T, K>>

export type CreateAppointmentData = OptionalExcept<Appointment, 'business_id' | 'client_name' | 'start_time' | 'end_time' | 'status'>
export type UpdateAppointmentData = Partial<Omit<Appointment, 'id' | 'business_id' | 'created_at'>>

export type CreateClientData = OptionalExcept<Client, 'business_id' | 'name' | 'language' | 'status'>
export type UpdateClientData = Partial<Omit<Client, 'id' | 'business_id' | 'created_at'>>

export type CreateBusinessData = OptionalExcept<Business, 'name' | 'category' | 'owner_id'>
export type UpdateBusinessData = Partial<Omit<Business, 'id' | 'owner_id' | 'created_at'>>