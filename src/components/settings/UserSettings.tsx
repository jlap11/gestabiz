import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { User } from '@/types'
import { useKV } from '@/lib/useKV'
import { useTheme } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { toast } from 'sonner'
import UserProfile from './UserProfile'
import { 
  User as UserIcon, 
  Bell, 
  Palette, 
  Globe, 
  Moon,
  Sun,
  Monitor,
  EnvelopeSimple as Mail,
  DeviceMobile as Smartphone,
  ChatsCircle as MessageCircle
} from '@phosphor-icons/react'

interface UserSettingsComponentProps {
  user: User
  onUserUpdate: (user: User) => void
}

export default function UserSettingsComponent({ user, onUserUpdate }: UserSettingsComponentProps) {
  const { t, language, setLanguage } = useLanguage()
  const { theme, setTheme } = useTheme()
  const [users, setUsers] = useKV<User[]>('users', [])
  
  const [notificationPreferences, setNotificationPreferences] = useState(
    user.notification_preferences || {
      email: true,
      push: true,
      browser: true,
      whatsapp: false,
      reminder_24h: true,
      reminder_1h: true,
      reminder_15m: false,
      daily_digest: false,
      weekly_report: true
    }
  )

  const handleNotificationChange = async (key: string, value: boolean) => {
    const newPreferences = {
      ...notificationPreferences,
      [key]: value
    }
    
    setNotificationPreferences(newPreferences)
    
    try {
      const updatedUser = {
        ...user,
        notification_preferences: newPreferences,
        updated_at: new Date().toISOString()
      }

      await setUsers(prev => 
        prev.map(u => u.id === user.id ? updatedUser : u)
      )

      onUserUpdate(updatedUser)
      toast.success(t('settings.preferences_saved'))
    } catch (error) {
      console.error('Error updating notification preferences:', error)
      toast.error('Error updating preferences')
    }
  }

  const handleLanguageChange = async (newLanguage: 'es' | 'en') => {
    try {
      const updatedUser = {
        ...user,
        language: newLanguage,
        updated_at: new Date().toISOString()
      }

      await setUsers(prev => 
        prev.map(u => u.id === user.id ? updatedUser : u)
      )

      setLanguage(newLanguage)
      onUserUpdate(updatedUser)
      toast.success(t('settings.preferences_saved'))
    } catch (error) {
      console.error('Error updating language:', error)
      toast.error('Error updating language')
    }
  }

  const getThemeIcon = (themeValue: string) => {
    switch (themeValue) {
      case 'light':
        return <Sun className="h-4 w-4" />
      case 'dark':
        return <Moon className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('settings.title')}</h2>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
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
              <CardDescription>
                Customize the appearance of the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme Selection */}
              <div className="space-y-3">
                <Label className="text-base font-medium">{t('settings.theme')}</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'light', label: t('settings.light'), icon: <Sun className="h-4 w-4" /> },
                    { value: 'dark', label: t('settings.dark'), icon: <Moon className="h-4 w-4" /> },
                    { value: 'system', label: t('settings.system'), icon: <Monitor className="h-4 w-4" /> }
                  ].map((themeOption) => (
                    <Button
                      key={themeOption.value}
                      variant={theme === themeOption.value ? 'default' : 'outline'}
                      onClick={() => setTheme(themeOption.value as any)}
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                {t('settings.notifications')}
              </CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Notification Channels */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Notification Channels</Label>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <Label>{t('settings.email_notifications')}</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications via email
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={notificationPreferences.email}
                      onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <Label>{t('settings.push_notifications')}</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive push notifications on your device
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={notificationPreferences.push}
                      onCheckedChange={(checked) => handleNotificationChange('push', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <Label>{t('settings.browser_notifications')}</Label>
                        <p className="text-sm text-muted-foreground">
                          Show browser notifications
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={notificationPreferences.browser}
                      onCheckedChange={(checked) => handleNotificationChange('browser', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <Label>{t('settings.whatsapp_notifications')}</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications via WhatsApp
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={notificationPreferences.whatsapp}
                      onCheckedChange={(checked) => handleNotificationChange('whatsapp', checked)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Reminder Settings */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Appointment Reminders</Label>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{t('settings.reminder_24h')}</Label>
                      <p className="text-sm text-muted-foreground">
                        Send reminder 24 hours before appointment
                      </p>
                    </div>
                    <Switch
                      checked={notificationPreferences.reminder_24h}
                      onCheckedChange={(checked) => handleNotificationChange('reminder_24h', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{t('settings.reminder_1h')}</Label>
                      <p className="text-sm text-muted-foreground">
                        Send reminder 1 hour before appointment
                      </p>
                    </div>
                    <Switch
                      checked={notificationPreferences.reminder_1h}
                      onCheckedChange={(checked) => handleNotificationChange('reminder_1h', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{t('settings.reminder_15m')}</Label>
                      <p className="text-sm text-muted-foreground">
                        Send reminder 15 minutes before appointment
                      </p>
                    </div>
                    <Switch
                      checked={notificationPreferences.reminder_15m}
                      onCheckedChange={(checked) => handleNotificationChange('reminder_15m', checked)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Digest Settings */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Digest & Reports</Label>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{t('settings.daily_digest')}</Label>
                      <p className="text-sm text-muted-foreground">
                        Daily summary of your appointments
                      </p>
                    </div>
                    <Switch
                      checked={notificationPreferences.daily_digest}
                      onCheckedChange={(checked) => handleNotificationChange('daily_digest', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{t('settings.weekly_report')}</Label>
                      <p className="text-sm text-muted-foreground">
                        Weekly business performance report
                      </p>
                    </div>
                    <Switch
                      checked={notificationPreferences.weekly_report}
                      onCheckedChange={(checked) => handleNotificationChange('weekly_report', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}