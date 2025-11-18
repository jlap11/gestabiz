// Types for i18n system
export type Language = 'es' | 'en'
export type TranslationKey = string
export type TranslationParams = Record<string, string | number>

export interface TranslationModule {
  [key: string]: string | TranslationModule
}

// Type-safe translation object
export interface Translations {
  common: typeof import('./en/common').common
  // TODO: Uncomment as modules are migrated
  // auth: typeof import('./en/auth').auth
  // appointments: typeof import('./en/appointments').appointments
  // dashboard: typeof import('./en/dashboard').dashboard
  // settings: typeof import('./en/settings').settings
  // billing: typeof import('./en/billing').billing
  // accounting: typeof import('./en/accounting').accounting
  // jobs: typeof import('./en/jobs').jobs
  // absences: typeof import('./en/absences').absences
  // sales: typeof import('./en/sales').sales
  // chat: typeof import('./en/chat').chat
  // notifications: typeof import('./en/notifications').notifications
  // reviews: typeof import('./en/reviews').reviews
  // business: typeof import('./en/business').business
  // employees: typeof import('./en/employees').employees
  // clients: typeof import('./en/clients').clients
  // services: typeof import('./en/services').services
  // locations: typeof import('./en/locations').locations
  // resources: typeof import('./en/resources').resources
  // permissions: typeof import('./en/permissions').permissions
  // landing: typeof import('./en/landing').landing
  // profile: typeof import('./en/profile').profile
  // ui: typeof import('./en/ui').ui
  // validation: typeof import('./en/validation').validation
  // calendar: typeof import('./en/calendar').calendar
}
