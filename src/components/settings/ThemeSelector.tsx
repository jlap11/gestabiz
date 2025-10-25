import React from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useTheme } from '@/hooks/useTheme'
import { useLanguage } from '@/contexts/LanguageContext'
import { Monitor, Moon, Sun } from 'lucide-react'
import { ThemeSelectorProps } from '@/types/settings'

export function ThemeSelector() {
  const { theme, setTheme } = useTheme()
  const { t } = useLanguage()

  const getThemeInfo = () => {
    if (theme === 'light')
      return {
        label: t('settings.themeSection.themes.light.label'),
        classes: 'bg-yellow-100 text-yellow-600',
        icon: Sun,
      }
    if (theme === 'dark')
      return {
        label: t('settings.themeSection.themes.dark.label'),
        classes: 'bg-blue-100 text-blue-600',
        icon: Moon,
      }
    return {
      label: t('settings.themeSection.themes.system.label'),
      classes: 'bg-primary/10 text-primary',
      icon: Monitor,
    }
  }

  const themeInfo = getThemeInfo()
  const ThemeIcon = themeInfo.icon

  const themes = [
    { value: 'light', label: t('settings.themeSection.themes.light.label'), icon: Sun },
    { value: 'dark', label: t('settings.themeSection.themes.dark.label'), icon: Moon },
    { value: 'system', label: t('settings.themeSection.themes.system.label'), icon: Monitor },
  ] as const

  return (
    <div className="space-y-3">
      <Label className="text-base font-medium">{t('settings.themeSection.title')}</Label>
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${themeInfo.classes}`}>
          <ThemeIcon className="h-4 w-4" />
          <span className="text-sm font-medium">{themeInfo.label}</span>
        </div>
        <div className="flex gap-1">
          {themes.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant={theme === value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme(value)}
              className="flex items-center gap-2"
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}