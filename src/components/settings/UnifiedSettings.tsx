import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User } from '@/types'
import { useLanguage } from '@/contexts/LanguageContext'
import UserProfile from './UserProfile'
import { NotificationSettings } from './NotificationSettings'
import { ThemeSelector } from './ThemeSelector'
import { LanguageSelector } from './LanguageSelector'
import { AdminSettings } from './AdminSettings'
import { ClientSettings } from './ClientSettings'
import { UnifiedSettingsProps } from '@/types/settings'
import {
  Bell,
  Briefcase,
  Globe,
  Palette,
  ShoppingCart,
  UserCircle,
  User as UserIcon,
} from '@phosphor-icons/react'

export default function UnifiedSettings({
  user,
  onUserUpdate,
  currentRole,
  businessId,
}: UnifiedSettingsProps) {
  const { t } = useLanguage()

  // Tabs dinámicas según rol
  const tabs = [
    { value: 'general', label: t('settings.general'), icon: <Palette className="h-4 w-4" /> },
    { value: 'profile', label: t('settings.profile'), icon: <UserIcon className="h-4 w-4" /> },
    {
      value: 'notifications',
      label: t('settings.notifications'),
      icon: <Bell className="h-4 w-4" />,
    },
  ]

  // Pestaña específica por rol
  if (currentRole === 'admin') {
    tabs.push({
      value: 'admin',
      label: t('businessInfo.title'),
      icon: <Briefcase className="h-4 w-4" />,
    })
  } else if (currentRole === 'employee') {
    tabs.push({
      value: 'employee',
      label: t('settings.employeePrefs.title'),
      icon: <UserCircle className="h-4 w-4" />,
    })
  } else if (currentRole === 'client') {
    tabs.push({
      value: 'client',
      label: t('settings.clientPreferences'),
      icon: <ShoppingCart className="h-4 w-4" />,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('settings.title')}</h2>
          <p className="text-muted-foreground">{t('settings.preferences')}</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className={`grid w-full grid-cols-${tabs.length}`}>
          {tabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
              {tab.icon}
              <span className="hidden md:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* AJUSTES GENERALES - Para todos los roles */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                {t('settings.general')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <ThemeSelector />
              <LanguageSelector user={user} onUserUpdate={onUserUpdate} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* PERFIL - Para todos los roles */}
        <TabsContent value="profile">
          <UserProfile user={user} onUserUpdate={onUserUpdate} />
        </TabsContent>

        {/* NOTIFICACIONES - Para todos los roles */}
        <TabsContent value="notifications" className="space-y-6">
          <NotificationSettings userId={user.id} />
        </TabsContent>

        {/* CONFIGURACIONES ESPECÍFICAS DEL ROL ADMIN */}
        {currentRole === 'admin' && (
          <TabsContent value="admin" className="space-y-6">
            <AdminSettings businessId={businessId} />
          </TabsContent>
        )}

        {/* CONFIGURACIONES ESPECÍFICAS DEL ROL EMPLOYEE */}
        {currentRole === 'employee' && (
          <TabsContent value="employee" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCircle className="h-5 w-5" />
                  Preferencias de Empleado
                </CardTitle>
                <CardDescription>Configura tus horarios y disponibilidad laboral</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">Disponible para nuevas citas</Label>
                      <p className="text-sm text-muted-foreground">
                        Acepta nuevas asignaciones de citas de clientes
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">Notificar nuevas asignaciones</Label>
                      <p className="text-sm text-muted-foreground">
                        Recibe alertas cuando te asignen una nueva cita
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">Recordatorios de citas</Label>
                      <p className="text-sm text-muted-foreground">
                        Recibe recordatorios antes de cada cita agendada
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-base font-medium">Mi horario de trabajo</Label>
                  <p className="text-sm text-muted-foreground">
                    Define los días y horarios en los que estás disponible para atender
                  </p>
                  <div className="space-y-2 mt-3">
                    {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(
                      day => (
                        <div key={day} className="flex items-center gap-4 p-3 border rounded-lg">
                          <Switch defaultChecked={!day.includes('Domingo')} />
                          <span className="w-24 font-medium">{day}</span>
                          <div className="flex gap-2 flex-1">
                            <Select defaultValue="09:00">
                              <SelectTrigger className="w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 24 }, (_, i) => {
                                  const hour = i.toString().padStart(2, '0')
                                  return (
                                    <SelectItem key={i} value={`${hour}:00`}>
                                      {hour}:00
                                    </SelectItem>
                                  )
                                })}
                              </SelectContent>
                            </Select>
                            <span className="text-muted-foreground">-</span>
                            <Select defaultValue="18:00">
                              <SelectTrigger className="w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 24 }, (_, i) => {
                                  const hour = i.toString().padStart(2, '0')
                                  return (
                                    <SelectItem key={i} value={`${hour}:00`}>
                                      {hour}:00
                                    </SelectItem>
                                  )
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="pt-4">
                  <Button className="w-full">Guardar Horarios</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* CONFIGURACIONES ESPECÍFICAS DEL ROL CLIENT */}
        {currentRole === 'client' && (
          <TabsContent value="client" className="space-y-6">
            <ClientSettings />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
