import type { Language } from '@/contexts/LanguageContext'

export function formatDate(
  date: Date | string,
  format: 'short' | 'long' | 'time' = 'short',
  language: Language = 'es'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const locale = language === 'es' ? 'es-ES' : 'en-US'
  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString(locale)
    case 'long':
      return dateObj.toLocaleDateString(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    case 'time':
      return dateObj.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
      })
    default:
      return dateObj.toLocaleDateString(locale)
  }
}

export function formatCurrency(
  amount: number,
  currency: string = 'EUR',
  language: Language = 'es'
): string {
  const locale = language === 'es' ? 'es-ES' : 'en-US'
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount)
}

export function formatNumber(num: number, language: Language = 'es'): string {
  const locale = language === 'es' ? 'es-ES' : 'en-US'
  return new Intl.NumberFormat(locale).format(num)
}
