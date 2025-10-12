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
  // New fields for invitation system
  invitation_code?: string
  last_activity_at?: string
  first_client_at?: string
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

// ============================================================================
// NUEVO MODELO DE DATOS (2025-10-11)
// ============================================================================

// Transaction types and categories
export type TransactionType = 'income' | 'expense';

export type TransactionCategory = 
  // Income categories
  | 'appointment_payment'
  | 'product_sale'
  | 'tip'
  | 'membership'
  | 'package'
  | 'other_income'
  // Expense categories
  | 'salary'
  | 'commission'
  | 'rent'
  | 'utilities'
  | 'supplies'
  | 'maintenance'
  | 'marketing'
  | 'tax'
  | 'insurance'
  | 'equipment'
  | 'training'
  | 'other_expense';

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