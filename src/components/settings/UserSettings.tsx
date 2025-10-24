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

  //

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('settings.title')}</h2>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            {t('settings.profile')}
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            {t('settings.appearance')}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            {t('settings.notifications')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <UserProfile user={user} onUserUpdate={onUserUpdate} />
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                {t('settings.appearance')}
              </CardTitle>
              <CardDescription>Customize the appearance of the application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme Selection */}
              <div className="space-y-3">
                <Label className="text-base font-medium">{t('settings.theme')}</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      value: 'light',
                      label: t('settings.light'),
                      icon: <Sun className="h-4 w-4" />,
                    },
                    {
                      value: 'dark',
                      label: t('settings.dark'),
                      icon: <Moon className="h-4 w-4" />,
                    },
                    {
                      value: 'system',
                      label: t('settings.system'),
                      icon: <Monitor className="h-4 w-4" />,
                    },
                  ].map(themeOption => (
                    <Button
                      key={themeOption.value}
                      variant={theme === themeOption.value ? 'default' : 'outline'}
                      onClick={() => setTheme(themeOption.value as 'light' | 'dark' | 'system')}
                      className="flex items-center gap-2 h-auto p-3 justify-start"
                    >
                      {themeOption.icon}
                      {themeOption.label}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Language Selection */}
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  {t('settings.language')}
                </Label>
                <Select value={language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">{t('settings.spanish')}</SelectItem>
                    <SelectItem value="en">{t('settings.english')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <NotificationSettings userId={user.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
