/* eslint-disable react-refresh/only-export-components */
/**
 * LANGUAGE CONTEXT - i18n System
 * 
 * MIGRATION STATUS (Nov 2025): ✅ MODULAR SYSTEM ACTIVE
 * - Old system: src/lib/translations.ts (monolithic, 4,386 lines) - DEPRECATED
 * - New system: src/locales/{en,es}/ (modular, 16 files, 69 modules)
 * 
 * MERGE STRATEGY:
 * - Both old and new translations coexist via merge
 * - New modular translations take precedence when keys overlap
 * - Zero breaking changes - all existing t() calls continue working
 * 
 * USAGE:
 * ```tsx
 * const { t, language, setLanguage } = useLanguage()
 * 
 * // Access translations with dot notation
 * t('common.actions.save') // "Guardar" (ES) or "Save" (EN)
 * t('auth.login.title') // "Iniciar Sesión" (ES)
 * t('appointments.status.pending') // "Pendiente" (ES)
 * 
 * // With parameters
 * t('common.messages.success', { action: 'Guardado' })
 * ```
 * 
 * MODULAR STRUCTURE:
 * - common: Actions, states, messages, forms, validation
 * - auth: Login, register, password reset
 * - appointments: CRUD, status, wizard
 * - dashboard, calendar, settings: Dashboard modules
 * - nav, ui, validation, profile: Navigation & UI
 * - business, clients, services, locations, employees: Business entities
 * - notifications, reviews, jobs, absences, sales, billing, accounting: Features
 * - And 25+ UI components
 * 
 * See: src/locales/README.md for complete documentation
 */
import React, { createContext, useContext, useEffect, useMemo } from 'react'
import { useKV } from '@/lib/useKV'
import { translations as oldTranslations } from '@/lib/translations'
import { translations as newTranslations } from '@/locales'

export type Language = 'es' | 'en'

/**
 * Merge old monolithic translations with new modular system
 * New translations take precedence when keys overlap
 * This ensures backward compatibility during migration
 */
const mergedTranslations = {
  en: { ...oldTranslations.en, ...newTranslations.en },
  es: { ...oldTranslations.es, ...newTranslations.es },
}

// Helper to get nested translation value with safe typing
function getNestedValue<T extends Record<string, unknown>>(obj: T, path: string): string | undefined {
  return path.split('.').reduce<unknown>((current, key) => (current as Record<string, unknown> | undefined)?.[key], obj) as string | undefined
}

interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string, params?: Record<string, string>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [language, setLanguage] = useKV<Language>('user-language', 'es')

  // Translation function with memoization
  const t = useMemo(() => (key: string, params?: Record<string, string>): string => {
    const translation = getNestedValue(mergedTranslations[language], key)
    
    if (!translation) {
      // Return key instead of logging in production
      return key
    }

    let text = translation

    // Replace parameters if provided
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(new RegExp(`{{${param}}}`, 'g'), value)
      })
    }

    return text
  }, [language])

  // Update document language
  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t])
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

// Helper function for date formatting
// moved helpers to '@/lib/i18n' to avoid Fast Refresh boundary issues