import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useTheme } from '@/contexts'
import { useLanguage } from '@/contexts/LanguageContext'
import { toast } from 'sonner'
import { User } from '@/types'
import { useKV } from '@/lib/useKV'
import {
  Globe,
  Monitor,
  Moon,
  Palette,
  Sun,
} from '@phosphor-icons/react'

interface GeneralSettingsProps {
  user: User
  onUserUpdate: (user: User) => void
}

export default function GeneralSettings({ user, onUserUpdate }: GeneralSettingsProps) {
  const { t, language, setLanguage } = useLanguage()
  const { theme, setTheme } = useTheme()
  const [, setUsers] = useKV<User[]>('users', [])

  // Helper para obtener info del tema actual
  const getThemeInfo = () => {
    if (theme === 'light')
      return { label: 'Claro', classes: 'bg-yellow-100 text-yellow-600', icon: Sun }
    if (theme === 'dark')
      return { label: 'Oscuro', classes: 'bg-blue-100 text-blue-600', icon: Moon }
    return { label: 'Sistema', classes: 'bg-primary/10 text-primary', icon: Monitor }
  }

  const themeInfo = getThemeInfo()
  const ThemeIcon = themeInfo.icon

  const handleLanguageChange = async (newLanguage: 'es' | 'en') => {
    try {
      const updatedUser = {
        ...user,
        language: newLanguage,
        updated_at: new Date().toISOString(),
      }

      await setUsers(prev => prev.map(u => (u.id === user.id ? updatedUser : u)))

      setLanguage(newLanguage)
      onUserUpdate(updatedUser)
      toast.success(t('settings.preferences_saved'))
    } catch (error) {
      toast.error(t('common.messages.updateError'))
      throw error
    }
  }

  const themeOptions = [
    {
      value: 'light',
      label: t('settings.themeSection.light'),
      description: t('settings.themeSection.lightDescription'),
      icon: Sun,
      classes: 'bg-yellow-100 text-yellow-600 border-yellow-200',
    },
    {
      value: 'dark',
      label: t('settings.themeSection.dark'),
      description: t('settings.themeSection.darkDescription'),
      icon: Moon,
      classes: 'bg-blue-100 text-blue-600 border-blue-200',
    },
    {
      value: 'system',
      label: t('settings.themeSection.system'),
      description: t('settings.themeSection.systemDescription'),
      icon: Monitor,
      classes: 'bg-primary/10 text-primary border-primary/20',
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          {t('settings.themeSection.title')}
        </CardTitle>
        <CardDescription>{t('settings.themeSection.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme Selection */}
        <div className="space-y-3">
          <Label className="text-base font-medium flex items-center gap-2">
            <Sun className="h-4 w-4" />
            {t('settings.themeSection.appearance')}
          </Label>
          <p className="text-sm text-muted-foreground mb-3">
            {t('settings.themeSection.description')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {themeOptions.map(themeOption => {
              const IconComponent = themeOption.icon
              const isSelected = theme === themeOption.value
              return (
                <button
                  key={themeOption.value}
                  onClick={() => setTheme(themeOption.value as 'light' | 'dark' | 'system')}
                  className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/50'
                  }`}
                  aria-pressed={isSelected}
                  aria-label={`${t('settings.themeSection.selectTheme')} ${themeOption.label}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${themeOption.classes}`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground">{themeOption.label}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {themeOption.description}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg mt-3">
            <div className={`p-2 rounded-full ${themeInfo.classes}`}>
              <ThemeIcon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">
                {t('settings.themeSection.currentTheme', { theme: themeInfo.label })}
              </p>
              <p className="text-xs text-muted-foreground">
                {theme === 'system'
                  ? t('settings.themeSection.systemThemeNote')
                  : t('settings.themeSection.changeAnytime')}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Language Selection */}
        <div className="space-y-3">
          <Label className="text-base font-medium flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {t('settings.language')}
          </Label>
          <p className="text-sm text-muted-foreground mb-3">
            {t('settings.languageSection.description')}
          </p>
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="es">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🇪🇸</span>
                  <span>{t('settings.spanish')}</span>
                </div>
              </SelectItem>
              <SelectItem value="en">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🇺🇸</span>
                  <span>{t('settings.english')}</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}