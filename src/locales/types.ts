// Types for i18n system
export type Language = 'es' | 'en'
export type TranslationKey = string
export type TranslationParams = Record<string, string | number>

export interface TranslationModule {
  [key: string]: string | TranslationModule
}

// Type-safe translation object
export interface Translations {
  // Core modules (Phase 2-3)
  common: typeof import('./en/common').common
  auth: typeof import('./en/auth').auth
  emailVerification: typeof import('./en/auth').emailVerification
  accountInactive: typeof import('./en/auth').accountInactive
  appointments: typeof import('./en/appointments').appointments
  dashboard: typeof import('./en/dashboard').dashboard
  calendar: typeof import('./en/dashboard').calendar
  settings: typeof import('./en/dashboard').settings
  
  // Navigation group (Phase 4)
  nav: typeof import('./en/navigation').nav
  ui: typeof import('./en/navigation').ui
  validation: typeof import('./en/navigation').validation
  profile: typeof import('./en/navigation').profile
  
  // Business entities (Phase 4)
  business: typeof import('./en/business').business
  clients: typeof import('./en/business').clients
  services: typeof import('./en/business').services
  locations: typeof import('./en/business').locations
  employees: typeof import('./en/business').employees
  
  // Secondary features (Phase 4)
  notifications: typeof import('./en/features').notifications
  reviews: typeof import('./en/features').reviews
  jobs: typeof import('./en/features').jobs
  absences: typeof import('./en/features').absences
  sales: typeof import('./en/features').sales
  billing: typeof import('./en/features').billing
  accounting: typeof import('./en/features').accounting
  
  // Admin & System (Phase 4)
  businessResources: typeof import('./en/admin').businessResources
  permissions: typeof import('./en/admin').permissions
  reports: typeof import('./en/admin').reports
  admin: typeof import('./en/admin').admin
  search: typeof import('./en/admin').search
  taxConfiguration: typeof import('./en/admin').taxConfiguration
  userProfile: typeof import('./en/admin').userProfile
  
  // UI Components (Phase 4)
  adminDashboard: typeof import('./en/components').adminDashboard
  employeeDashboard: typeof import('./en/components').employeeDashboard
  clientDashboard: typeof import('./en/components').clientDashboard
  imageCropper: typeof import('./en/components').imageCropper
  bannerCropper: typeof import('./en/components').bannerCropper
  quickSaleForm: typeof import('./en/components').quickSaleForm
  reviewForm: typeof import('./en/components').reviewForm
  reviewCard: typeof import('./en/components').reviewCard
  reviewList: typeof import('./en/components').reviewList
  favoritesList: typeof import('./en/components').favoritesList
  citySelector: typeof import('./en/components').citySelector
  businessSelector: typeof import('./en/components').businessSelector
  themeToggle: typeof import('./en/components').themeToggle
  roleSelector: typeof import('./en/components').roleSelector
  serviceStatusBadge: typeof import('./en/components').serviceStatusBadge
  languageToggle: typeof import('./en/components').languageToggle
  ownerBadge: typeof import('./en/components').ownerBadge
  businessInvitationCard: typeof import('./en/components').businessInvitationCard
  profilePage: typeof import('./en/components').profilePage
  recommendedBusinesses: typeof import('./en/components').recommendedBusinesses
  businessSuggestions: typeof import('./en/components').businessSuggestions
  dashboardOverview: typeof import('./en/components').dashboardOverview
  cookieConsent: typeof import('./en/components').cookieConsent
  
  // Landing & Employee (Phase 4)
  landing: typeof import('./en/landing').landing
  employee: typeof import('./en/landing').employee
}

