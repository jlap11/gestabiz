import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { User } from '@/types'
import { useKV } from '@/lib/useKV'
import { useTheme } from '@/contexts'
import { useLanguage } from '@/contexts/LanguageContext'
import { toast } from 'sonner'
import UserProfile from './UserProfile'
import { NotificationSettings } from './NotificationSettings'
import { Bell, Globe, Monitor, Moon, Palette, Sun, User as UserIcon } from '@phosphor-icons/react'

interface UserSettingsComponentProps {
  user: User
  onUserUpdate: (user: User) => void
}

export default function UserSettingsComponent({ user, onUserUpdate }: UserSettingsComponentProps) {
  const { t, language, setLanguage } = useLanguage()
  const { theme, setTheme } = useTheme()
  const [, setUsers] = useKV<User[]>('users', [])

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
      toast.error('Error updating language')
      throw error
    }
  }

  return (
    <main 
      role="main" 
      aria-labelledby="user-settings-title"
      className="space-y-6 max-w-[95vw] mx-auto"
    >
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 id="user-settings-title" className="text-xl sm:text-2xl font-bold tracking-tight">
            {t('settings.title')}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
      </header>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList 
          className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto sm:h-10"
          role="tablist"
          aria-label="Secciones de configuración de usuario"
        >
          <TabsTrigger 
            value="profile" 
            className="flex items-center gap-2 min-h-[44px] justify-center sm:justify-start"
            aria-label="Configuración de perfil"
          >
            <UserIcon className="h-4 w-4" aria-hidden="true" />
            <span className="text-sm sm:text-base">{t('settings.profile')}</span>
          </TabsTrigger>
          <TabsTrigger 
            value="appearance" 
            className="flex items-center gap-2 min-h-[44px] justify-center sm:justify-start"
            aria-label="Configuración de apariencia"
          >
            <Palette className="h-4 w-4" aria-hidden="true" />
            <span className="text-sm sm:text-base">{t('settings.appearance')}</span>
          </TabsTrigger>
          <TabsTrigger 
            value="notifications" 
            className="flex items-center gap-2 min-h-[44px] justify-center sm:justify-start"
            aria-label="Configuración de notificaciones"
          >
            <Bell className="h-4 w-4" aria-hidden="true" />
            <span className="text-sm sm:text-base">{t('settings.notifications')}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" role="tabpanel" aria-labelledby="profile-tab">
          <UserProfile user={user} onUserUpdate={onUserUpdate} />
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6" role="tabpanel" aria-labelledby="appearance-tab">
          <Card className="p-4 sm:p-6">
            <CardHeader className="p-0 pb-4 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Palette className="h-5 w-5" aria-hidden="true" />
                {t('settings.appearance')}
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Customize the appearance of the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-0">
              {/* Theme Selection */}
              <section role="region" aria-labelledby="theme-selection-title">
                <h3 id="theme-selection-title" className="text-base font-medium mb-3">
                  {t('settings.theme')}
                </h3>
                <div 
                  className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                  role="radiogroup"
                  aria-labelledby="theme-selection-title"
                  aria-describedby="theme-selection-help"
                >
                  <div id="theme-selection-help" className="sr-only">
                    Selecciona el tema de la aplicación: claro, oscuro o automático según el sistema
                  </div>
                  {[
                    {
                      value: 'light',
                      label: t('settings.light'),
                      icon: <Sun className="h-4 w-4" aria-hidden="true" />,
                    },
                    {
                      value: 'dark',
                      label: t('settings.dark'),
                      icon: <Moon className="h-4 w-4" aria-hidden="true" />,
                    },
                    {
                      value: 'system',
                      label: t('settings.system'),
                      icon: <Monitor className="h-4 w-4" aria-hidden="true" />,
                    },
                  ].map(themeOption => (
                    <Button
                      key={themeOption.value}
                      variant={theme === themeOption.value ? 'default' : 'outline'}
                      onClick={() => setTheme(themeOption.value as 'light' | 'dark' | 'system')}
                      className="flex items-center gap-2 h-auto p-3 justify-start min-h-[44px] min-w-[44px]"
                      role="radio"
                      aria-checked={theme === themeOption.value}
                      aria-label={`Tema ${themeOption.label}`}
                      title={`Seleccionar tema ${themeOption.label}`}
                    >
                      {themeOption.icon}
                      <span className="text-sm sm:text-base">{themeOption.label}</span>
                    </Button>
                  ))}
                </div>
              </section>

              <Separator />

              {/* Language Selection */}
              <section role="region" aria-labelledby="language-selection-title">
                <Label 
                  htmlFor="language-select"
                  className="text-base font-medium flex items-center gap-2 mb-3"
                  id="language-selection-title"
                >
                  <Globe className="h-4 w-4" aria-hidden="true" />
                  {t('settings.language')}
                </Label>
                <Select 
                  value={language} 
                  onValueChange={handleLanguageChange}
                  aria-label="Seleccionar idioma de la aplicación"
                  aria-describedby="language-selection-help"
                >
                  <SelectTrigger 
                    id="language-select"
                    className="w-full sm:w-48 min-h-[44px]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent role="listbox">
                    <SelectItem value="es" role="option">
                      {t('settings.spanish')}
                    </SelectItem>
                    <SelectItem value="en" role="option">
                      {t('settings.english')}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <div id="language-selection-help" className="sr-only">
                  Cambia el idioma de la interfaz de la aplicación
                </div>
              </section>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6" role="tabpanel" aria-labelledby="notifications-tab">
          <NotificationSettings userId={user.id} />
        </TabsContent>
      </Tabs>
    </main>
  )
}