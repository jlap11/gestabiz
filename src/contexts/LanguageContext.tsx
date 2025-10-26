/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useMemo } from 'react'
import { useKV } from '@/lib/useKV'
import { translations } from '@/lib/translations'

export type Language = 'es' | 'en'

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
    const translation = getNestedValue(translations[language], key)
    
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