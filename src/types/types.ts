// User roles enum
export type UserRole = 'admin' | 'employee' | 'client'

// User role assignment (a user can have multiple roles)
export interface UserRoleAssignment {
  id: string
  user_id: string
  role: UserRole
  business_id: string | null  // null for client role, required for admin/employee
  business_name?: string
  is_active: boolean
  created_at: string
}

// Permission types
export type Permission = 
  | 'read_appointments' 
  | 'write_appointments' 
  | 'delete_appointments'
  | 'read_clients' 
  | 'write_clients' 
  | 'delete_clients'
  | 'read_employees' 
  | 'write_employees' 
  | 'delete_employees'
  | 'read_business' 
  | 'write_business' 
  | 'delete_business'
  | 'read_reports' 
  | 'write_reports'
  | 'read_locations' 
  | 'write_locations' 
  | 'delete_locations'
  | 'read_services' 
  | 'write_services' 
  | 'delete_services'
  | 'manage_settings'
  | 'send_notifications'

// Core user profile interface matching Supabase schema
export interface User {
  id: string
  email: string
  name: string // Changed from full_name for consistency
  username?: string
  avatar_url?: string
  timezone?: string
  
  // Multi-role support
  roles: UserRoleAssignment[]  // All roles assigned to this user
  activeRole: UserRole  // Currently selected role
  activeBusiness?: {  // Business context when in admin/employee role
    id: string
    name: string
  }
  
  // Legacy single role (deprecated, kept for backward compatibility)
  /** @deprecated Use activeRole instead */
  role: UserRole
  
  /** @deprecated Use activeBusiness.id instead */
  business_id?: string
  
  location_id?: string
  phone?: string
  language: 'es' | 'en'
  notification_preferences: {
    email: boolean
    push: boolean
    browser: boolean
    whatsapp: boolean
    reminder_24h: boolean
    reminder_1h: boolean
    reminder_15m: boolean
    daily_digest: boolean
    weekly_report: boolean
  }
  permissions: Permission[]
  created_at: string
  updated_at?: string
  is_active?: boolean
  last_login?: string
}

// Legacy interface for backward compatibility
export interface UserLegacy {
  id: string
  email: string
  name: string
  avatar?: string
  createdAt: string
  preferences?: Record<string, unknown>
}

// Business information
export interface Business {
  id: string
  name: string
  description?: string
  category: string
  logo_url?: string
  website?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  latitude?: number
  longitude?: number
  business_hours: {
    monday: { open: string; close: string; closed: boolean }
    tuesday: { open: string; close: string; closed: boolean }
    wednesday: { open: string; close: string; closed: boolean }
    thursday: { open: string; close: string; closed: boolean }
    friday: { open: string; close: string; closed: boolean }
    saturday: { open: string; close: string; closed: boolean }
    sunday: { open: string; close: string; closed: boolean }
  }
  timezone?: string
  owner_id: string
  settings: {
    appointment_buffer: number
    advance_booking_days: number
    cancellation_policy: number
    auto_confirm: boolean
    require_deposit: boolean
    deposit_percentage: number
    currency: string
  }
  created_at: string
  updated_at: string
  is_active?: boolean
}

// Business locations (branches/offices)
export interface Location {
  id: string
  business_id: string
  name: string
  address: string
  city: string
  state: string
  country: string
  postal_code: string
  latitude?: number
  longitude?: number
  phone?: string
  email?: string
  business_hours: {
    [key: string]: {
      open: string
      close: string
      is_open: boolean
    }
  }
  // Extended (optional) fields
  website?: string
  description?: string
  is_active: boolean
  is_main?: boolean
  created_at: string
  updated_at: string
  created_by?: string
  amenities?: string[]
  capacity?: number
}

// Services offered by the business
export interface Service {
  id: string
  business_id: string
  name: string
  description?: string
  duration: number // in minutes
  price: number
  currency?: string
  category: string
  is_active: boolean
  created_at: string
  updated_at: string
  // Optional/extended fields
  location_id?: string
  requires_preparation?: boolean
  online_available?: boolean
  max_participants?: number
  created_by?: string
  tags?: string[]
  color?: string
  image_url?: string
}

// Employee request interface
export interface EmployeeRequest {
  id: string
  user_id: string
  business_id: string
  message?: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  reviewed_at?: string
  reviewed_by?: string
}

// Client information embedded in appointments
export interface Client {
  id: string
  business_id: string
  name: string
  email?: string
  phone?: string
  whatsapp?: string
  company?: string
  address?: string
  city?: string
  state?: string
  country?: string
  date_of_birth?: string
  notes?: string
  avatar_url?: string
  language: 'es' | 'en'
  total_appointments: number
  last_appointment?: string
  is_recurring: boolean
  status: 'active' | 'inactive' | 'blocked'
  tags: string[]
  created_at: string
  updated_at: string
  created_by: string
}

// Appointment interface matching Supabase schema
export interface Appointment {
  id: string
  business_id: string
  location_id?: string
  service_id?: string
  user_id: string // employee assigned
  client_id: string
  title: string
  description?: string
  client_name: string
  client_email?: string
  client_phone?: string
  client_whatsapp?: string
  start_time: string
  end_time: string
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled'
  location?: string
  site_name?: string
  notes?: string
  price?: number
  currency?: string
  reminder_sent: boolean
  created_at: string
  updated_at: string
  created_by: string
  cancelled_reason?: string
  rescheduled_from?: string
  google_calendar_event_id?: string
  
  // Legacy fields for backward compatibility
  clientId?: string
  clientName?: string
  clientEmail?: string
  clientPhone?: string
  date?: string
  startTime?: string
  time?: string
  endTime?: string
  userId?: string
  createdAt?: string
  updatedAt?: string
  priority?: 'low' | 'medium' | 'high'
  tags?: string[]
  reminderSent?: boolean
}

// Notification interface matching Supabase schema
export interface Notification {
  id: string
  user_id: string
  appointment_id?: string
  type: 'reminder_24h' | 'reminder_1h' | 'reminder_15m' | 'cancelled' | 'rescheduled'
  title: string
  message: string
  scheduled_for: string
  sent_at?: string
  delivery_method: 'email' | 'push' | 'browser'
  status: 'pending' | 'sent' | 'failed' | 'cancelled'
  created_at: string
}

// User settings interface matching Supabase schema
export interface UserSettings {
  id: string
  user_id: string
  theme: 'light' | 'dark' | 'system'
  language: 'es' | 'en'
  timezone: string
  default_appointment_duration: number
  business_hours: {
    start: string
    end: string
    days: number[]
  }
  auto_reminders: boolean
  reminder_times: number[]
  email_notifications: {
    appointment_reminders: boolean
    appointment_confirmations: boolean
    appointment_cancellations: boolean
    daily_digest: boolean
    weekly_report: boolean
    marketing: boolean
  }
  whatsapp_notifications: {
    appointment_reminders: boolean
    appointment_confirmations: boolean
    follow_ups: boolean
  }
  date_format: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
  time_format: '12h' | '24h'
  created_at: string
  updated_at: string
}

// Legacy notification settings for backward compatibility
export interface NotificationSettings {
  id: string
  userId: string
  emailReminders: boolean
  reminderTiming: number[]
  dailyDigest: boolean
  weeklyReport: boolean
}

// Filter interface for appointments
export interface AppointmentFilter {
  status?: string[]
  dateRange?: {
    start: string
    end: string
  }
  clients?: string[]
  tags?: string[]
  priority?: string[]
  search?: string
}

// Dashboard statistics interface
export interface DashboardStats {
  total_appointments: number
  scheduled_appointments: number
  completed_appointments: number
  cancelled_appointments: number
  no_show_appointments: number
  upcoming_today: number
  upcoming_week: number
  revenue_total: number
  revenue_this_month: number
  average_appointment_value: number
  client_retention_rate: number
  popular_services: Array<{ service: string; count: number; revenue: number }>
  popular_times: Array<{ time: string; count: number }>
  employee_performance: Array<{ 
    employee_id: string
    employee_name: string
    total_appointments: number
    completed_appointments: number
    revenue: number
    average_rating?: number
  }>
  location_performance: Array<{
    location_id: string
    location_name: string
    total_appointments: number
    revenue: number
  }>
  
  // Legacy fields for backward compatibility
  totalAppointments?: number
  upcomingAppointments?: number
  completedAppointments?: number
  cancelledAppointments?: number
  noShowAppointments?: number
  totalClients?: number
  thisWeekAppointments?: number
  thisMonthAppointments?: number
  averageAppointmentsPerDay?: number
  conversionRate?: number
  recentActivity?: Array<{
    id: string
    type: 'created' | 'completed' | 'cancelled'
    appointmentTitle: string
    clientName: string
    timestamp: string
  }>
}

// Business analytics and reports
export interface BusinessAnalytics {
  period: 'week' | 'month' | 'quarter' | 'year'
  start_date: string
  end_date: string
  appointments: {
    total: number
    completed: number
    cancelled: number
    no_show: number
    revenue: number
  }
  clients: {
    total: number
    new: number
    returning: number
    lost: number
  }
  employees: Array<{
    id: string
    name: string
    appointments_total: number
    appointments_completed: number
    revenue: number
    efficiency_rate: number
  }>
  services: Array<{
    id: string
    name: string
    bookings: number
    revenue: number
    average_price: number
  }>
  locations: Array<{
    id: string
    name: string
    appointments: number
    revenue: number
  }>
  peak_hours: Array<{
    hour: number
    day_of_week: number
    appointment_count: number
  }>
  recurring_clients: Array<{
    client_id: string
    client_name: string
    last_appointment: string
    days_since_last: number
    total_appointments: number
    status: 'active' | 'at_risk' | 'lost'
  }>
}

// Upcoming appointment interface for browser extension
export interface UpcomingAppointment {
  id: string
  title: string
  start_time: string
  client_name: string
  location?: string
  time_until: string
}

// Auth response interface
export interface AuthResponse {
  user: User | null
  error?: string
}

// API response wrapper
export interface ApiResponse<T> {
  data: T | null
  error?: string
  message?: string
}

// Form validation interface
export interface FormErrors {
  [key: string]: string | undefined
}

// Calendar event interface for external integrations
export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  description?: string
  location?: string
  attendees?: string[]
}

// Google Calendar integration interfaces
export interface GoogleCalendarEvent {
  id?: string
  summary?: string
  description?: string
  start: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  end: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  location?: string
  attendees?: Array<{
    email: string
    displayName?: string
  }>
  reminders?: {
    useDefault: boolean
    overrides?: Array<{
      method: 'email' | 'popup'
      minutes: number
    }>
  }
  status?: 'confirmed' | 'tentative' | 'cancelled'
  extendedProperties?: {
    private?: {
      appointmentId?: string
      source?: string
    }
  }
}

export interface GoogleCalendarSyncStatus {
  enabled: boolean
  calendar_id?: string
  last_sync?: string
  access_token?: string
  refresh_token?: string
  sync_direction: 'both' | 'export_only' | 'import_only'
  auto_sync: boolean
}

export interface CalendarSyncSettings {
  id: string
  user_id: string
  provider: 'google' | 'outlook' | 'apple'
  enabled: boolean
  calendar_id: string
  access_token: string
  refresh_token: string
  sync_direction: 'both' | 'export_only' | 'import_only'
  auto_sync: boolean
  last_sync: string
  sync_errors?: string[]
  created_at: string
  updated_at: string
}

export interface SyncConflictResolution {
  conflict_id: string
  appointment_id: string
  calendar_event_id: string
  resolution: 'keep_local' | 'keep_remote' | 'merge' | 'skip'
  resolved_at: string
}

// Role permissions mapping
export type RolePermissions = {
  [key in UserRole]: Permission[]
}

// WhatsApp message template
export interface WhatsAppTemplate {
  id: string
  business_id: string
  name: string
  type: 'reminder' | 'confirmation' | 'follow_up' | 'marketing'
  message: string
  variables: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

// Client analytics
export interface ClientAnalytics {
  client_id: string
  client_name: string
  total_appointments: number
  completed_appointments: number
  cancelled_appointments: number
  no_show_appointments: number
  total_revenue: number
  average_appointment_value: number
  first_appointment: string
  last_appointment: string
  frequency: 'frequent' | 'regular' | 'occasional' | 'rare'
  status: 'active' | 'at_risk' | 'lost'
  days_since_last_appointment: number
  preferred_services: string[]
  preferred_times: string[]
  preferred_employee?: string
  lifetime_value: number
}

// Report filters
export interface ReportFilters {
  date_range: {
    start: string
    end: string
    preset?: 'week' | 'month' | 'quarter' | 'year' | 'custom'
  }
  location_ids?: string[]
  employee_ids?: string[]
  service_ids?: string[]
  client_ids?: string[]
  status?: string[]
}

// Notification template
export interface NotificationTemplate {
  id: string
  business_id: string
  type: 'reminder_24h' | 'reminder_1h' | 'reminder_15m' | 'confirmation' | 'cancellation' | 'follow_up'
  channel: 'email' | 'whatsapp' | 'sms' | 'push'
  subject?: string
  message: string
  variables: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

// Employee work schedule
export interface WorkSchedule {
  id: string
  employee_id: string
  location_id?: string
  day_of_week: number
  start_time: string
  end_time: string
  break_start?: string
  break_end?: string
  is_working: boolean
  created_at: string
  updated_at: string
}

// Business subscription/plan
export interface BusinessPlan {
  id: string
  business_id: string
  plan_type: 'free' | 'basic' | 'professional' | 'enterprise'
  features: string[]
  limits: {
    max_employees: number
    max_locations: number
    max_appointments_per_month: number
    storage_mb: number
  }
  price: number
  currency: string
  billing_cycle: 'monthly' | 'yearly'
  status: 'active' | 'cancelled' | 'expired' | 'suspended'
  start_date: string
  end_date?: string
  created_at: string
  updated_at: string
}

// Service interface
// (Removed duplicate Service and Location interfaces defined below; merged into the primary definitions above.)