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
  calendar: typeof import('./en/calendar').calendar
  settings: typeof import('./en/settings').settings
  
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
  
  // Dashboard modules (Phase 4)
  adminDashboard: typeof import('./en/adminDashboard').adminDashboard
  employeeDashboard: typeof import('./en/employeeDashboard').employeeDashboard
  clientDashboard: typeof import('./en/clientDashboard').clientDashboard
  
  // UI Component modules (Phase 4)
  imageCropper: typeof import('./en/imageCropper').imageCropper
  bannerCropper: typeof import('./en/bannerCropper').bannerCropper
  favoritesList: typeof import('./en/favoritesList').favoritesList
  citySelector: typeof import('./en/citySelector').citySelector
  businessSelector: typeof import('./en/businessSelector').businessSelector
  themeToggle: typeof import('./en/themeToggle').themeToggle
  roleSelector: typeof import('./en/roleSelector').roleSelector
  serviceStatusBadge: typeof import('./en/serviceStatusBadge').serviceStatusBadge
  languageToggle: typeof import('./en/languageToggle').languageToggle
  ownerBadge: typeof import('./en/ownerBadge').ownerBadge
  
  // Business feature modules (Phase 4)
  businessInvitationCard: typeof import('./en/businessInvitationCard').businessInvitationCard
  quickSaleForm: typeof import('./en/quickSaleForm').quickSaleForm
  businessSuggestions: typeof import('./en/businessSuggestions').businessSuggestions
  recommendedBusinesses: typeof import('./en/recommendedBusinesses').recommendedBusinesses
  dashboardOverview: typeof import('./en/dashboardOverview').dashboardOverview
  
  // Review system modules (Phase 4)
  reviewForm: typeof import('./en/reviewForm').reviewForm
  reviewCard: typeof import('./en/reviewCard').reviewCard
  reviewList: typeof import('./en/reviewList').reviewList
  
  // Other modules (Phase 4)
  profilePage: typeof import('./en/profilePage').profilePage
  cookieConsent: typeof import('./en/cookieConsent').cookieConsent
  
  // Landing & Employee (Phase 4)
  landing: typeof import('./en/landing').landing
  employee: typeof import('./en/landing').employee
}

