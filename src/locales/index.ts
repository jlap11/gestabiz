// Main entry point for i18n translations
import { en } from './en'
import { es } from './es'
import type { Language, Translations } from './types'

export const translations: Record<Language, Partial<Translations>> = {
  en,
  es,
}

export type { Language, TranslationKey, TranslationParams, Translations } from './types'
