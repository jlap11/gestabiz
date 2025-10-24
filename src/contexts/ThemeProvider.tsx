import React, { useEffect, useMemo } from 'react'
import { useKV } from '@/lib/useKV'
import { Theme, ThemeContext } from './theme-core'

export function ThemeProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [theme, setTheme] = useKV<Theme>('theme-preference', 'light')

  // Calculate effective theme
  const effectiveTheme = useMemo(() => {
    if (theme !== 'system') return theme
    return globalThis.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }, [theme])
  const isDark = effectiveTheme === 'dark'

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = effectiveTheme

    // Also add class for compatibility
    if (effectiveTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    // Also apply to body for portals (like sonner)
    if (effectiveTheme === 'dark') {
      document.body.classList.add('dark')
      document.body.dataset.theme = 'dark'
    } else {
      document.body.classList.remove('dark')
      delete document.body.dataset.theme
    }
  }, [effectiveTheme])

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = globalThis.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const systemTheme = mediaQuery.matches ? 'dark' : 'light'
      document.documentElement.dataset.theme = systemTheme

      if (systemTheme === 'dark') {
        document.documentElement.classList.add('dark')
        document.body.classList.add('dark')
        document.body.dataset.theme = 'dark'
      } else {
        document.documentElement.classList.remove('dark')
        document.body.classList.remove('dark')
        delete document.body.dataset.theme
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const value = useMemo(() => ({ theme, setTheme, isDark }), [theme, setTheme, isDark])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
