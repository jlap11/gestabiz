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

// =====================================================
// SISTEMA DE PERMISOS GRANULAR (v2.0 - 13/10/2025)
// =====================================================

// Tipos de empleado
export type EmployeeType = 'service_provider' | 'support_staff'

// =====================================================
// MODELO DE NEGOCIO FLEXIBLE (21/10/2025)
// =====================================================

// Tipos de modelo de recurso para negocios
export type ResourceModel = 
  | 'professional'       // Modelo actual (empleados/profesionales)
  | 'physical_resource'  // Recursos físicos (habitaciones, mesas, canchas)
  | 'hybrid'             // Ambos (profesional + recurso)
  | 'group_class'        // Clases grupales con capacidad múltiple

// Tipos de recursos físicos
export type PhysicalResourceType = 
  | 'room'          // Habitaciones (hoteles, hostales)
  | 'table'         // Mesas (restaurantes, cafés)
  | 'court'         // Canchas (deportes: fútbol, tenis, paddle)
  | 'studio'        // Estudios (grabación, fotografía)
  | 'meeting_room'  // Salas de reuniones
  | 'desk'          // Escritorios (coworking)
  | 'equipment'     // Equipos (cámaras, instrumentos)
  | 'vehicle'       // Vehículos (autos, bicicletas)
  | 'space'         // Espacios genéricos
  | 'lane'          // Pistas (bowling, natación)
  | 'field'         // Campos (golf, paintball)
  | 'station'       // Estaciones (computadoras, laboratorio)
  | 'parking_spot'  // Espacios de parqueadero
  | 'bed'           // Camas (hospital, hostel)
  | 'other'         // Otros recursos

// Interface para recursos físicos de negocios
export interface BusinessResource {
  id: string
  created_at: string
  updated_at: string
  
  // Relaciones
  business_id: string
  location_id?: string
  
  // Información del recurso
  name: string
  resource_type: PhysicalResourceType
  description?: string
  
  // Capacidad
  capacity?: number
  
  // Disponibilidad
  is_active: boolean
  available_hours?: {
    monday: { open: string; close: string; closed: boolean }
    tuesday: { open: string; close: string; closed: boolean }
    wednesday: { open: string; close: string; closed: boolean }
    thursday: { open: string; close: string; closed: boolean }
    friday: { open: string; close: string; closed: boolean }
    saturday: { open: string; close: string; closed: boolean }
    sunday: { open: string; close: string; closed: boolean }
  }
  
  // Metadata
  image_url?: string
  amenities?: string[]
  price_per_hour?: number
  price_per_day?: number
  currency?: string
  
  // Para clases grupales
  max_simultaneous_bookings?: number
  
  // Computed properties (frontend only - poblados con JOINs)
  location?: Location
  services?: Service[]
  upcoming_bookings?: number
  next_available_from?: string
}

// Relación N:M entre recursos y servicios
export interface ResourceService {
  id: string
  created_at: string
  updated_at: string
  resource_id: string
  service_id: string
  custom_price?: number
  is_active: boolean
  
  // Computed properties (frontend only)
  resource?: BusinessResource
  service?: Service
}

// Business Role (admin o employee)
export interface BusinessRole {
  id: string
  business_id: string
  user_id: string
  role: 'admin' | 'employee'
  employee_type?: EmployeeType
  assigned_by?: string
  assigned_at: string
  is_active: boolean
  notes?: string
  created_at: string
  updated_at: string
}

// User Permission (permiso granular)
export interface UserPermission {
  id: string
  business_id: string
  user_id: string
  permission: string
  granted_by?: string
  granted_at: string
  expires_at?: string
  is_active: boolean
  notes?: string
  created_at: string
  updated_at: string
}

// Permission Template
export interface PermissionTemplate {
  id: string
  business_id?: string
  name: string
  description?: string
  role: 'admin' | 'employee'
  permissions: string[]
  is_system_template: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

// Audit Log Entry
export interface PermissionAuditLog {
  id: string
  business_id: string
  user_id: string
  action: 'grant' | 'revoke' | 'modify' | 'assign_role' | 'remove_role' | 'role.assign' | 'role.revoke' | 'permission.grant' | 'permission.revoke' | 'template.apply' | 'template.create' | 'template.delete'
  permission?: string
  old_value?: string
  new_value?: string
  performed_by: string
  performed_at: string
  created_at: string
  notes?: string
  // Relaciones (JOIN)
  user?: {
    id: string
    name: string
    email: string
  }
  performed_by_user?: {
    id: string
    name: string
    email: string
  }
  // Campos calculados para UI
  user_name?: string
  performed_by_name?: string
  role?: 'admin' | 'employee'
}

// Permisos granulares disponibles (55 permisos)
export type Permission = 
  // Business Management (5)
  | 'business.view'
  | 'business.edit'
  | 'business.delete'
  | 'business.settings'
  | 'business.categories'
  
  // Locations (5)
  | 'locations.view'
  | 'locations.create'
  | 'locations.edit'
  | 'locations.delete'
  | 'locations.assign_employees'
  
  // Services (5)
  | 'services.view'
  | 'services.create'
  | 'services.edit'
  | 'services.delete'
  | 'services.prices'
  
  // Employees (8)
  | 'employees.view'
  | 'employees.create'
  | 'employees.edit'
  | 'employees.delete'
  | 'employees.assign_services'
  | 'employees.view_payroll'
  | 'employees.manage_payroll'
  | 'employees.set_schedules'
  
  // Appointments (7)
  | 'appointments.view_all'
  | 'appointments.view_own'
  | 'appointments.create'
  | 'appointments.edit'
  | 'appointments.delete'
  | 'appointments.assign'
  | 'appointments.confirm'
  
  // Clients (7)
  | 'clients.view'
  | 'clients.create'
  | 'clients.edit'
  | 'clients.delete'
  | 'clients.export'
  | 'clients.communication'
  | 'clients.history'
  
  // Accounting (9)
  | 'accounting.view'
  | 'accounting.tax_config'
  | 'accounting.expenses.view'
  | 'accounting.expenses.create'
  | 'accounting.expenses.pay'
  | 'accounting.payroll.view'
  | 'accounting.payroll.create'
  | 'accounting.payroll.config'
  | 'accounting.export'
  
  // Reports (4)
  | 'reports.view_financial'
  | 'reports.view_operations'
  | 'reports.export'
  | 'reports.analytics'
  
  // Permissions Management (5)
  | 'permissions.view'
  | 'permissions.assign_admin'
  | 'permissions.assign_employee'
  | 'permissions.modify'
  | 'permissions.revoke'
  
  // Notifications (2)
  | 'notifications.send'
  | 'notifications.bulk'
  
  // Settings (3)
  | 'settings.view'
  | 'settings.edit_own'
  | 'settings.edit_business'
  
  // Legacy permissions (backward compatibility)
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
  deactivated_at?: string  // Timestamp when account was deactivated
  last_login?: string
  accountInactive?: boolean  // Flag indicating account needs reactivation
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

// Business category types (DEPRECATED - usar BusinessCategory interface)
export type BusinessCategoryEnum = 
  | 'health'        // Salud (médicos, dentistas, fisioterapia)
  | 'beauty'        // Belleza (peluquerías, spas, estética)
  | 'fitness'       // Fitness (gimnasios, yoga, entrenadores)
  | 'education'     // Educación (tutorías, cursos, academias)
  | 'consulting'    // Consultoría (coaches, asesores)
  | 'professional'  // Servicios profesionales (abogados, contadores)
  | 'maintenance'   // Mantenimiento (mecánicos, técnicos)
  | 'food'          // Alimentos (restaurantes, chefs)
  | 'entertainment' // Entretenimiento (fotografía, eventos)
  | 'other'         // Otros

// Legal entity type
export type LegalEntityType = 'company' | 'individual'

// Business Category from database (jerarquía: categorías principales y subcategorías)
export interface BusinessCategory {
  id: string
  created_at: string
  updated_at: string
  name: string
  slug: string
  description?: string
  icon_name?: string
  is_active: boolean
  sort_order: number
  parent_id?: string | null // NULL = categoría principal, UUID = subcategoría
  // Computed properties (frontend only)
  subcategories?: BusinessCategory[] // Subcategorías de esta categoría principal
  parent?: BusinessCategory // Categoría principal de esta subcategoría
}

// Relación N:M entre negocios y subcategorías (máximo 3 por negocio)
export interface BusinessSubcategory {
  id: string
  created_at: string
  business_id: string
  subcategory_id: string
  subcategory?: BusinessCategory // Populated cuando se hace join
}

// Business information
export interface Business {
  id: string
  name: string
  slug?: string  // URL-friendly unique identifier (autogenerado desde name)
  description?: string
  category_id?: string // FK to business_categories (categoría PRINCIPAL)
  legal_entity_type?: LegalEntityType // Empresa o independiente
  tax_id?: string // NIT, RUT, or Cédula
  legal_name?: string // Razón social or full legal name
  registration_number?: string // Registro mercantil
  logo_url?: string
  // Computed properties (frontend only - se cargan con joins)
  category?: BusinessCategory // Categoría principal poblada
  subcategories?: BusinessSubcategory[] // Máximo 3 subcategorías
  website?: string
  phone?: string
  email?: string
  
  // ⭐ UBICACIÓN LEGAL DEL NEGOCIO (usando catálogo)
  // Los negocios NO tienen dirección física - las SEDES sí
  country_id?: string  // FK to countries (Ej: Colombia)
  region_id?: string   // FK to regions (Ej: Antioquia, Cundinamarca)
  city_id?: string     // FK to cities (Ej: Medellín, Bogotá)
  
  // ⚠️ DEPRECATED - Usar catálogo arriba (country_id, region_id, city_id)
  // Estos campos se mantienen por retrocompatibilidad pero NO se usan en nuevos negocios
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  latitude?: number
  longitude?: number
  
  // ⚠️ DEPRECATED - Los negocios NO tienen horarios - las SEDES sí
  // Este campo se mantiene por retrocompatibilidad pero NO se usa en nuevos negocios
  business_hours?: {
    monday: { open: string; close: string; closed: boolean }
    tuesday: { open: string; close: string; closed: boolean }
    wednesday: { open: string; close: string; closed: boolean }
    thursday: { open: string; close: string; closed: boolean }
    friday: { open: string; close: string; closed: boolean }
    saturday: { open: string; close: string; closed: boolean }
    sunday: { open: string; close: string; closed: boolean }
  }
  
  timezone?: string  // Zona horaria (Ej: America/Bogota)
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
  // New fields for invitation system
  invitation_code?: string
  last_activity_at?: string
  first_client_at?: string
  created_at: string
  updated_at: string
  is_active?: boolean
  
  // Public profile fields for SEO and discoverability
  slug?: string                    // URL-friendly unique identifier (e.g., 'salon-belleza-medellin')
  meta_title?: string              // Custom SEO title (max 60 chars)
  meta_description?: string        // Custom SEO description (max 160 chars)
  meta_keywords?: string[]         // SEO keywords array
  og_image_url?: string            // Open Graph image URL for social sharing
  is_public?: boolean              // If false, business won't appear in public profiles
  
  // Computed fields for public profiles (from joins)
  average_rating?: number          // From business_ratings_stats view
  review_count?: number            // From business_ratings_stats view
  location_count?: number          // Count of active locations
  service_count?: number           // Count of active services
  
  // NUEVO: Modelo de Negocio Flexible (21/10/2025)
  resource_model: ResourceModel    // Tipo de recurso que ofrece el negocio
  resources?: BusinessResource[]   // Recursos físicos disponibles (computed)
  resource_count?: number          // Cantidad de recursos activos (computed)
}

// Business locations (branches/offices)
export interface Location {
  id: string
  business_id: string
  name: string
  address: string
  city: string
  city_name?: string // Resolved city name from cities table
  state: string
  country: string
  postal_code: string
  latitude?: number
  longitude?: number
  phone?: string
  email?: string
  description?: string
  images?: string[] // Array of image URLs from Supabase Storage
  business_hours: {
    monday: { open: string; close: string; closed: boolean }
    tuesday: { open: string; close: string; closed: boolean }
    wednesday: { open: string; close: string; closed: boolean }
    thursday: { open: string; close: string; closed: boolean }
    friday: { open: string; close: string; closed: boolean }
    saturday: { open: string; close: string; closed: boolean }
    sunday: { open: string; close: string; closed: boolean }
  }
  is_active: boolean
  is_main?: boolean
  is_primary?: boolean // Indica si es la sede principal del negocio (solo puede haber una)
  created_at: string
  updated_at: string
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
  user_id: string // employee assigned (DEPRECATED - usar employee_id)
  employee_id?: string // ID del empleado asignado (OPCIONAL ahora)
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
  
  // NUEVO: Modelo de Negocio Flexible (21/10/2025)
  resource_id?: string              // ID del recurso físico asignado
  resource?: BusinessResource       // Recurso poblado con JOIN
  
  // Para clases grupales
  capacity_used?: number            // Cupos tomados
  participants?: Array<{
    client_id: string
    client_name: string
    client_email?: string
  }>
  
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

// ============================================================================
// NUEVO MODELO DE DATOS (2025-10-11)
// ============================================================================

// Transaction types and categories
export type TransactionType = 'income' | 'expense';

export type TransactionCategory = 
  // Income categories
  | 'appointment_payment'
  | 'product_sale'
  | 'service_sale'
  | 'tip'
  | 'membership'
  | 'package'
  | 'other_income'
  // Expense categories - Payroll
  | 'salary'
  | 'payroll'
  | 'bonuses'
  | 'commission'
  // Expense categories - Rent & Utilities
  | 'rent'
  | 'utilities'
  | 'electricity'
  | 'water'
  | 'gas'
  | 'internet'
  | 'phone'
  // Expense categories - Maintenance & Supplies
  | 'supplies'
  | 'cleaning'
  | 'repairs'
  | 'furniture'
  | 'tools'
  | 'software'
  | 'maintenance'
  // Expense categories - Marketing
  | 'marketing'
  | 'advertising'
  | 'social_media'
  // Expense categories - Taxes
  | 'tax'
  | 'property_tax'
  | 'income_tax'
  | 'vat'
  | 'withholding'
  // Expense categories - Insurance
  | 'insurance'
  | 'liability_insurance'
  | 'fire_insurance'
  | 'theft_insurance'
  | 'health_insurance'
  // Expense categories - Training & Equipment
  | 'training'
  | 'certifications'
  | 'courses'
  | 'equipment'
  // Expense categories - Transportation
  | 'fuel'
  | 'parking'
  | 'public_transport'
  // Expense categories - Professional Fees
  | 'accounting_fees'
  | 'legal_fees'
  | 'consulting_fees'
  // Expense categories - Other
  | 'depreciation'
  | 'bank_fees'
  | 'interest'
  | 'donations'
  | 'uniforms'
  | 'security'
  | 'waste_disposal'
  | 'other_expense';

export type RecurrenceFrequency = 
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly';

// Location Services - Servicios disponibles en cada sede
export interface LocationService {
  id: string;
  created_at: string;
  updated_at: string;
  location_id: string;
  service_id: string;
  is_active: boolean;
  notes?: string;
  // Populated fields
  service?: Service;
  location?: Location;
}

// Employee Services - Servicios que ofrece cada empleado
export interface EmployeeService {
  id: string;
  created_at: string;
  updated_at: string;
  employee_id: string;
  service_id: string;
  business_id: string;
  location_id: string;
  expertise_level: 1 | 2 | 3 | 4 | 5; // 1=Principiante, 5=Experto
  is_active: boolean;
  commission_percentage?: number;
  notes?: string;
  // Populated fields
  employee?: User;
  service?: Service;
  location?: Location;
}

// Reviews - Calificaciones de clientes
export interface Review {
  id: string;
  created_at: string;
  updated_at: string;
  business_id: string;
  appointment_id: string;
  client_id: string;
  employee_id?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  response?: string;
  response_at?: string;
  response_by?: string;
  is_visible: boolean;
  is_verified: boolean; // Cliente verificado que asistió
  helpful_count: number;
  // Populated fields (from joins)
  client?: User;
  employee?: User;
  appointment?: Appointment;
  // Denormalized fields for quick display
  client_name?: string;
  employee_name?: string;
}

// Transactions - Ingresos y Egresos
export interface Transaction {
  id: string;
  created_at: string;
  updated_at: string;
  business_id: string;
  location_id?: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  currency: string;
  description?: string;
  appointment_id?: string;
  employee_id?: string;
  created_by?: string;
  transaction_date: string; // DATE format
  payment_method?: string;
  reference_number?: string;
  metadata?: Record<string, unknown>;
  is_verified: boolean;
  verified_by?: string;
  verified_at?: string;
  // Populated fields
  location?: Location;
  appointment?: Appointment;
  employee?: User;
}

// Recurring Expenses - Egresos Recurrentes
export interface RecurringExpense {
  id: string;
  created_at: string;
  updated_at: string;
  business_id: string;
  location_id?: string;
  employee_id?: string;
  created_by?: string;
  name?: string;
  description: string;
  category: TransactionCategory;
  amount: number;
  currency: string;
  recurrence_frequency: RecurrenceFrequency;
  recurrence_day?: number; // 1-31
  next_payment_date: string; // DATE format
  last_payment_date?: string; // DATE format
  start_date?: string; // DATE format
  end_date?: string; // DATE format
  is_active: boolean;
  is_automated: boolean;
  payment_method?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  total_paid: number;
  payments_count: number;
  // Populated fields
  location?: Location;
  employee?: {
    id: string;
    full_name: string;
  };
}

// Location Expense Config - Configuración de egresos por sede
export interface LocationExpenseConfig {
  id: string;
  created_at: string;
  updated_at: string;
  location_id: string;
  business_id: string;
  // Rent
  rent_amount?: number;
  rent_due_day?: number; // 1-31
  landlord_name?: string;
  landlord_contact?: string;
  lease_start_date?: string; // DATE format
  lease_end_date?: string; // DATE format
  // Utilities averages
  electricity_avg?: number;
  water_avg?: number;
  gas_avg?: number;
  internet_avg?: number;
  phone_avg?: number;
  // Other fixed costs
  security_amount?: number;
  cleaning_amount?: number;
  waste_disposal_amount?: number;
  // Additional
  metadata?: Record<string, unknown>;
  notes?: string;
  is_active: boolean;
  // Populated fields
  location?: Location;
}

// Employee Performance View
export interface EmployeePerformance {
  employee_id: string;
  employee_name: string;
  email: string;
  avatar_url?: string;
  business_id: string;
  business_name: string;
  location_id?: string;
  location_name?: string;
  position: 'employee' | 'manager';
  services_offered: number;
  total_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  completion_rate: number;
  average_rating: number;
  total_reviews: number;
  total_revenue: number;
  total_paid: number;
}

// Financial Summary View
export interface FinancialSummary {
  business_id: string;
  business_name: string;
  location_id?: string;
  location_name?: string;
  period: string; // Month timestamp
  total_income: number;
  total_expenses: number;
  net_profit: number;
  income_transactions: number;
  expense_transactions: number;
  appointment_count: number;
}

// Location Services Availability View
export interface LocationServiceAvailability {
  location_id: string;
  location_name: string;
  business_id: string;
  business_name: string;
  service_id: string;
  service_name: string;
  duration_minutes: number;
  price: number;
  category?: string;
  available_at_location: boolean;
  employees_offering: number;
  average_rating: number;
  total_reviews: number;
}

// Extended Business interface with new fields
export interface BusinessExtended extends Business {
  total_reviews: number;
  average_rating: number;
  total_appointments: number;
  total_revenue: number;
}

// Extended Appointment interface with new fields
export interface AppointmentExtended extends Appointment {
  is_location_exception: boolean;
  original_location_id?: string;
}

// Extended Business Employee with location assignment
export interface BusinessEmployee {
  id: string;
  created_at: string;
  updated_at: string;
  business_id: string;
  employee_id: string;
  location_id?: string; // Sede asignada por defecto
  role: 'employee' | 'manager';
  status: 'pending' | 'approved' | 'rejected';
  hired_at?: string;
  is_active: boolean;
  // Populated fields
  employee?: User;
  business?: Business;
  location?: Location;
}

// Filters for new entities
export interface ReviewFilters {
  business_id?: string;
  employee_id?: string;
  client_id?: string;
  rating?: number[];
  is_verified?: boolean;
  date_range?: {
    start: string;
    end: string;
  };
}

export interface TransactionFilters {
  business_id?: string;
  location_id?: string;
  type?: TransactionType[];
  category?: TransactionCategory[];
  date_range?: {
    start: string;
    end: string;
  };
  is_verified?: boolean;
  min_amount?: number;
  max_amount?: number;
}

export interface EmployeeServiceFilters {
  employee_id?: string;
  service_id?: string;
  business_id?: string;
  location_id?: string;
  is_active?: boolean;
  min_expertise_level?: number;
}

// ============================================================================
// FIN NUEVO MODELO DE DATOS
// ============================================================================

// ============================================================================
// EMPLOYEE REQUESTS & BUSINESS INVITATION SYSTEM
// ============================================================================

// Employee request status
export type EmployeeRequestStatus = 'pending' | 'approved' | 'rejected'

// Employee request interface
export interface EmployeeRequest {
  id: string
  business_id: string
  user_id: string
  invitation_code: string
  status: EmployeeRequestStatus
  created_at: string
  responded_at?: string
  responded_by?: string
  message?: string
  // Populated fields
  business?: Business
  user?: User
  responder?: User
}

// Extended Business interface with invitation code
export interface BusinessWithInvitation extends Business {
  invitation_code: string
  last_activity_at: string
  first_client_at?: string
  is_active: boolean
}

// QR Code data structure
export interface BusinessInvitationQRData {
  type: 'business_invitation'
  business_id: string
  business_name: string
  invitation_code: string
  generated_at: string
}

// Business inactivity check result
export interface BusinessInactivityStatus {
  business_id: string
  business_name: string
  days_inactive: number
  should_deactivate: boolean // >30 days
  should_delete: boolean // >1 year without clients
  last_activity_at: string
  first_client_at?: string
}

// =====================================================
// NOTIFICACIONES IN-APP (v1.0 - 13/10/2025)
// =====================================================

// Estado de notificación in-app
export type NotificationStatus = 'unread' | 'read' | 'archived'

// Tipos de notificaciones (100% alineado con notification_type_enum de producción)
// IMPORTANTE: Estos tipos deben coincidir EXACTAMENTE con el enum en Supabase
export type InAppNotificationType = 
  // Citas (7 tipos)
  | 'appointment_reminder'            // Recordatorio automático programado
  | 'appointment_confirmation'        // ⚠️ usar confirmation NO confirmed
  | 'appointment_cancellation'        // ⚠️ usar cancellation NO cancelled
  | 'appointment_rescheduled'         // Cita reprogramada
  | 'appointment_new_client'          // Al cliente cuando agenda
  | 'appointment_new_employee'        // Al empleado cuando le asignan
  | 'appointment_new_business'        // Al negocio cuando hay nueva cita
  
  // Empleados (3 tipos)
  | 'employee_request_new'            // Al admin cuando recibe solicitud
  | 'employee_request_accepted'       // Al usuario cuando aceptan
  | 'employee_request_rejected'       // Al usuario cuando rechazan
  
  // Ausencias y Vacaciones (1 tipo)
  | 'absence_request'                 // Al admin cuando empleado solicita ausencia
  
  // Vacantes laborales (5 tipos)
  | 'job_vacancy_new'                 // Nueva vacante publicada
  | 'job_application_new'             // Al admin: nueva aplicación
  | 'job_application_accepted'        // Al aplicante: aceptado
  | 'job_application_rejected'        // Al aplicante: rechazado
  | 'job_application_interview'       // Invitación a entrevista
  
  // Verificación de contactos (3 tipos)
  | 'email_verification'              // Verificar email
  | 'phone_verification_sms'          // Verificar teléfono por SMS
  | 'phone_verification_whatsapp'     // Verificar teléfono por WhatsApp
  
  // Sistema (4 tipos)
  | 'security_alert'                  // Alertas de seguridad
  | 'account_activity'                // Actividad de cuenta
  | 'daily_digest'                    // Resumen diario
  | 'weekly_summary'                  // Resumen semanal
  
  // Chat (1 tipo) ✨ NUEVO
  | 'chat_message'                    // Nuevo mensaje de chat

// TOTAL: 23 tipos alineados con notification_type_enum de producción
// Nota: reminder_24h, reminder_1h, reminder_15m se manejan como appointment_reminder con metadata

// Prioridad de notificación
export type NotificationPriority = -1 | 0 | 1 | 2 // -1=baja, 0=normal, 1=alta, 2=urgente

// Notificación In-App
export interface InAppNotification {
  id: string
  created_at: string
  updated_at: string
  read_at?: string
  
  // Usuario destinatario
  user_id: string
  
  // Contexto de negocio (opcional)
  business_id?: string
  
  // Tipo y contenido
  type: InAppNotificationType
  title: string
  message: string // Nombre de columna en base de datos
  body?: string // Alias para compatibilidad
  
  // Datos adicionales
  data: {
    appointment_id?: string
    business_name?: string
    employee_name?: string
    action?: string
    [key: string]: unknown
  }
  
  // Estado y prioridad
  status: NotificationStatus
  priority: NotificationPriority
  
  // URL de acción
  action_url?: string
  
  // Soft delete
  is_deleted: boolean
}

// Crear notificación in-app (payload)
export interface CreateInAppNotification {
  user_id: string
  type: InAppNotificationType
  title: string
  body: string
  data?: Record<string, unknown>
  business_id?: string
  priority?: NotificationPriority
  action_url?: string
}

// Estadísticas de notificaciones
export interface NotificationStats {
  total: number
  unread: number
  read: number
  archived: number
  by_type: Record<InAppNotificationType, number>
  by_priority: Record<NotificationPriority, number>
}

// =====================================================
// SISTEMA DE CHAT/MENSAJERÍA (v1.0 - 13/10/2025)
// =====================================================

// Tipo de conversación
export type ConversationType = 'direct' | 'group'

// Rol en conversación
export type ConversationRole = 'member' | 'admin'

// Tipo de mensaje
export type MessageType = 'text' | 'image' | 'file' | 'system'

// Scope de conversación (para filtrado y contexto)
export interface ConversationScope {
  location_id?: string
  service_id?: string
  role?: UserRole
  custom?: Record<string, unknown>
}

// Conversación
export interface Conversation {
  id: string
  created_at: string
  updated_at: string
  
  // Contexto
  business_id: string
  type: ConversationType
  
  // Metadata
  name?: string // Solo para grupos
  description?: string
  avatar_url?: string
  created_by: string
  
  // Estado
  is_archived: boolean
  last_message_at?: string
  last_message_preview?: string
  
  // Scope flexible
  scope: ConversationScope
  
  // Relaciones (JOIN opcional)
  business?: {
    id: string
    name: string
    logo_url?: string
  }
  creator?: {
    id: string
    full_name: string
    email: string
    avatar_url?: string
  }
  members?: ConversationMember[]
  last_message?: Message
  
  // Campos calculados para UI
  display_name?: string // Para conversaciones directas: nombre del otro usuario
  display_avatar?: string
  unread_count?: number // Del usuario actual
}

// Miembro de conversación
export interface ConversationMember {
  conversation_id: string
  user_id: string
  
  // Metadata
  joined_at: string
  role: ConversationRole
  
  // Configuración personal
  muted: boolean
  notifications_enabled: boolean
  custom_name?: string
  
  // Tracking
  last_read_at?: string
  last_seen_at?: string
  unread_count: number
  
  // Relaciones (JOIN opcional)
  user?: {
    id: string
    full_name: string
    email: string
    avatar_url?: string
  }
}

// Mensaje
export interface Message {
  id: string
  created_at: string
  updated_at: string
  edited_at?: string
  
  // Relaciones
  conversation_id: string
  sender_id?: string // null si fue eliminado el sender
  
  // Contenido
  type: MessageType
  body?: string
  metadata: MessageMetadata
  
  // Features
  reply_to?: string
  is_pinned: boolean
  pinned_by?: string
  pinned_at?: string
  
  // Soft delete
  is_deleted: boolean
  deleted_by?: string
  deleted_at?: string
  
  // Relaciones (JOIN opcional)
  sender?: {
    id: string
    full_name: string
    email: string
    avatar_url?: string
  }
  reply_to_message?: Message
  
  // Estado de entrega y lectura
  delivery_status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
  read_by: ReadReceipt[] // Array de quién leyó el mensaje
  
  // Campos calculados para UI
  is_own_message?: boolean // Si el mensaje es del usuario actual
  is_read?: boolean
}

// Recibo de lectura de mensaje
export interface ReadReceipt {
  user_id: string
  read_at: string
}

// Metadata de mensaje (flexible con JSONB)
export interface MessageMetadata {
  // Para archivos
  file_url?: string
  file_name?: string
  file_size?: number
  file_type?: string
  
  // Para imágenes
  image_url?: string
  image_width?: number
  image_height?: number
  image_thumbnail_url?: string
  
  // Para mensajes del sistema
  system_type?: 'user_joined' | 'user_left' | 'conversation_created' | 'name_changed' | 'member_added' | 'member_removed'
  system_data?: Record<string, unknown>
  
  // Extras
  [key: string]: unknown
}

// Payload para crear conversación directa
export interface CreateDirectConversationPayload {
  business_id: string
  user_a: string
  user_b: string
}

// Payload para crear conversación de grupo
export interface CreateGroupConversationPayload {
  business_id: string
  name: string
  description?: string
  avatar_url?: string
  member_ids: string[]
  scope?: ConversationScope
}

// Payload para enviar mensaje
export interface SendMessagePayload {
  conversation_id: string
  type: MessageType
  body?: string
  metadata?: MessageMetadata
  reply_to?: string
}

// Payload para editar mensaje
export interface EditMessagePayload {
  message_id: string
  body: string
}

// Payload para eliminar mensaje
export interface DeleteMessagePayload {
  message_id: string
  conversation_id: string
}

// Payload para agregar miembros a grupo
export interface AddMembersPayload {
  conversation_id: string
  member_ids: string[]
}

// Payload para remover miembro de grupo
export interface RemoveMemberPayload {
  conversation_id: string
  user_id: string
}

// Payload para actualizar configuración de miembro
export interface UpdateMemberSettingsPayload {
  conversation_id: string
  muted?: boolean
  notifications_enabled?: boolean
  custom_name?: string
}

// Estadísticas de chat
export interface ChatStats {
  total_conversations: number
  unread_conversations: number
  total_messages: number
  messages_sent_today: number
  active_conversations_today: number
}

// Filtros para listar conversaciones
export interface ConversationFilters {
  business_id?: string
  type?: ConversationType
  is_archived?: boolean
  has_unread?: boolean
  search?: string // Buscar por nombre o último mensaje
  limit?: number
  offset?: number
}

// Filtros para listar mensajes
export interface MessageFilters {
  conversation_id: string
  before?: string // message_id o timestamp
  after?: string
  limit?: number
  include_deleted?: boolean
}

// Evento de typing (para realtime)
export interface TypingEvent {
  conversation_id: string
  user_id: string
  user_name: string
  is_typing: boolean
  timestamp: string
}

// Evento de presencia (para realtime)
export interface PresenceEvent {
  user_id: string
  status: 'online' | 'offline' | 'away'
  last_seen_at: string
}

// =====================================================
// EMPLOYEE HIERARCHY SYSTEM (Phase 2 - 14/10/2025)
// =====================================================

/**
 * Jerarquía completa de empleado (devuelta por get_business_hierarchy RPC)
 * Incluye datos personales, jerarquía, métricas y relaciones
 */
export interface EmployeeHierarchy {
  employee_id?: string
  user_id: string
  business_id: string // Agregado para EmployeeSalaryConfig
  full_name: string
  email: string
  phone: string | null
  avatar_url: string | null
  role: string
  employee_type: string
  hierarchy_level: number
  job_title: string | null
  reports_to: string | null
  supervisor_name: string | null
  location_id: string | null
  location_name: string | null
  is_active: boolean
  hired_at: string | null
  salary_base: number | null // Agregado para sistema de nómina
  salary_type: string | null // Agregado para sistema de nómina
  total_appointments: number
  completed_appointments: number
  cancelled_appointments: number
  average_rating: number | null
  total_reviews: number
  occupancy_rate: number | null
  gross_revenue: number | null
  services_offered: Array<{
    service_id: string
    service_name: string
    expertise_level: string
    commission_percentage: number
  }> | null
  direct_reports_count: number
  all_reports_count: number
}

/**
 * Filtros para jerarquía de empleados
 * Usado en useBusinessHierarchy para filtrado cliente-side
 */
export interface HierarchyFilters {
  searchQuery?: string
  hierarchyLevel?: number | null
  employeeType?: string | null
  departmentId?: string | null
  location_id?: string | null // Filtro por sede
}

/**
 * Configuración de cálculo de ocupación
 * Almacenada en businesses.settings.occupancy_config
 */
export interface OccupancyConfig {
  method: 'hours_based' | 'appointments_based'
  daily_hours: number
  exclude_days: string[] // ['sunday', 'saturday']
  include_breaks: boolean
  break_duration_minutes: number
}

/**
 * Métricas individuales de empleado
 * Devueltas por useEmployeeMetrics hook
 */
export interface EmployeeMetrics {
  occupancy: number | null
  rating: number | null
  revenue: number | null
}

/**
 * Nodo de jerarquía para visualización en árbol (tree view)
 * Usado en componentes UI de jerarquía
 */
export interface HierarchyNode {
  id: string
  user_id: string
  full_name: string
  email: string
  job_title: string | null
  hierarchy_level: number
  employee_type: string
  reports_to: string | null
  direct_reports_count: number
  avatar_url: string | null
  metrics?: EmployeeMetrics
  children: HierarchyNode[]
  is_expanded?: boolean
}

// Re-export tipos de hierarchyService para uso global
export type {
  HierarchyUpdateData,
  BulkHierarchyUpdate,
  HierarchyValidationResult,
  SupervisorAssignment,
  DirectReportNode,
  ReportingChainNode,
} from '@/lib/hierarchyService'

// Re-export tipos de useEmployeeMetrics para uso global
export type {
  UseEmployeeMetricsOptions,
} from '@/hooks/useEmployeeMetrics'