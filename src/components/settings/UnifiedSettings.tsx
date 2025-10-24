import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { User } from '@/types'
import { useKV } from '@/lib/useKV'
import { useTheme } from '@/contexts'
import { useLanguage } from '@/contexts/LanguageContext'
import { toast } from 'sonner'
import UserProfile from './UserProfile'
import { NotificationSettings } from './NotificationSettings'
import { 
  User as UserIcon, 
  Bell, 
  Palette, 
  Globe, 
  Moon,
  Sun,
  Monitor,
  Briefcase,
  UserCircle,
  ShoppingCart
} from '@phosphor-icons/react'

interface UnifiedSettingsProps {
  user: User
  onUserUpdate: (user: User) => void
  currentRole: 'admin' | 'employee' | 'client'
  businessId?: string // Para configuraciones específicas del negocio (admin/employee)
}

export default function UnifiedSettings({ user, onUserUpdate, currentRole, businessId }: UnifiedSettingsProps) {
  const { t, language, setLanguage } = useLanguage()
  const { theme, setTheme } = useTheme()
  const [, setUsers] = useKV<User[]>('users', [])

  // Helper para obtener info del tema actual
  const getThemeInfo = () => {
    if (theme === 'light') return { label: 'Claro', classes: 'bg-yellow-100 text-yellow-600', icon: Sun }
    if (theme === 'dark') return { label: 'Oscuro', classes: 'bg-blue-100 text-blue-600', icon: Moon }
    return { label: 'Sistema', classes: 'bg-primary/10 text-primary', icon: Monitor }
  }

  const themeInfo = getThemeInfo()
  const ThemeIcon = themeInfo.icon

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
      toast.error(t('common.messages.updateError'))
      throw error
    }
  }

  // Tabs dinámicas según rol
  const tabs = [
    { value: 'general', label: 'Ajustes Generales', icon: <Palette className="h-4 w-4" /> },
    { value: 'profile', label: t('settings.profile'), icon: <UserIcon className="h-4 w-4" /> },
    { value: 'notifications', label: t('settings.notifications'), icon: <Bell className="h-4 w-4" /> },
  ]

  // Pestaña específica por rol
  if (currentRole === 'admin') {
    tabs.push({ value: 'admin', label: 'Admin del Negocio', icon: <Briefcase className="h-4 w-4" /> })
  } else if (currentRole === 'employee') {
    tabs.push({ value: 'employee', label: 'Preferencias de Empleado', icon: <UserCircle className="h-4 w-4" /> })
  } else if (currentRole === 'client') {
    tabs.push({ value: 'client', label: 'Preferencias de Cliente', icon: <ShoppingCart className="h-4 w-4" /> })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('settings.title')}</h2>
          <p className="text-muted-foreground">
            Configura tu cuenta y preferencias
          </p>
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
                Apariencia y Sistema
              </CardTitle>
              <CardDescription>
                Personaliza el tema y el idioma de la aplicación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme Selection */}
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  Tema de la interfaz
                </Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Selecciona el tema que prefieres para la aplicación
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { 
                      value: 'light', 
                      label: 'Claro', 
                      icon: <Sun className="h-5 w-5" />,
                      description: 'Interfaz con colores claros'
                    },
                    { 
                      value: 'dark', 
                      label: 'Oscuro', 
                      icon: <Moon className="h-5 w-5" />,
                      description: 'Interfaz con colores oscuros'
                    },
                    { 
                      value: 'system', 
                      label: 'Sistema', 
                      icon: <Monitor className="h-5 w-5" />,
                      description: 'Según preferencias del sistema'
                    }
                  ].map((themeOption) => (
                    <button
                      key={themeOption.value}
                      onClick={() => setTheme(themeOption.value as 'light' | 'dark' | 'system')}
                      className={`
                        flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all
                        ${theme === themeOption.value 
                          ? 'border-primary bg-primary/5 shadow-sm' 
                          : 'border-border hover:border-primary/50 hover:bg-muted/30'
                        }
                      `}
                    >
                      <div className={`
                        p-3 rounded-full
                        ${theme === themeOption.value ? 'bg-primary text-primary-foreground' : 'bg-muted'}
                      `}>
                        {themeOption.icon}
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-sm">{themeOption.label}</p>
                        <p className="text-xs text-muted-foreground mt-1">{themeOption.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg mt-3">
                  <div className={`p-2 rounded-full ${themeInfo.classes}`}>
                    <ThemeIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Tema actual: {themeInfo.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {theme === 'system' 
                        ? 'El tema cambia automáticamente según las preferencias de tu sistema operativo'
                        : 'Puedes cambiar el tema en cualquier momento'}
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
                  Selecciona el idioma de la interfaz
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Configuraciones del Negocio
                </CardTitle>
                <CardDescription>
                  Administra las configuraciones de tu negocio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">Permitir reservas online</Label>
                      <p className="text-sm text-muted-foreground">
                        Los clientes pueden agendar citas directamente desde la plataforma
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">Confirmación automática</Label>
                      <p className="text-sm text-muted-foreground">
                        Las citas se confirman automáticamente sin necesidad de aprobación manual
                      </p>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">Recordatorios automáticos</Label>
                      <p className="text-sm text-muted-foreground">
                        Envía recordatorios automáticos a los clientes antes de sus citas
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">Mostrar precios públicamente</Label>
                      <p className="text-sm text-muted-foreground">
                        Los precios de los servicios son visibles para todos
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-base font-medium">Horario de atención predeterminado</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Apertura</Label>
                      <Select defaultValue="09:00">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => {
                            const hour = i.toString().padStart(2, '0')
                            return <SelectItem key={i} value={`${hour}:00`}>{hour}:00</SelectItem>
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Cierre</Label>
                      <Select defaultValue="18:00">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => {
                            const hour = i.toString().padStart(2, '0')
                            return <SelectItem key={i} value={`${hour}:00`}>{hour}:00</SelectItem>
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button className="w-full">Guardar Configuraciones</Button>
                </div>
              </CardContent>
            </Card>
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
                <CardDescription>
                  Configura tus horarios y disponibilidad laboral
                </CardDescription>
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
                    {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day) => (
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
                                return <SelectItem key={i} value={`${hour}:00`}>{hour}:00</SelectItem>
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
                                return <SelectItem key={i} value={`${hour}:00`}>{hour}:00</SelectItem>
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Preferencias de Cliente
                </CardTitle>
                <CardDescription>
                  Configura tus preferencias de reserva y comunicación
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">Recordatorios de citas</Label>
                      <p className="text-sm text-muted-foreground">
                        Recibe recordatorios automáticos antes de tus citas
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">Confirmación por email</Label>
                      <p className="text-sm text-muted-foreground">
                        Recibe confirmación por correo al agendar una cita
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">Notificaciones de promociones</Label>
                      <p className="text-sm text-muted-foreground">
                        Recibe ofertas especiales de los negocios que sigues
                      </p>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">Guardar métodos de pago</Label>
                      <p className="text-sm text-muted-foreground">
                        Almacena tarjetas para reservas más rápidas
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-base font-medium">Tiempo de anticipación preferido</Label>
                  <p className="text-sm text-muted-foreground">
                    ¿Con cuánta anticipación quieres recibir recordatorios?
                  </p>
                  <Select defaultValue="24">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hora antes</SelectItem>
                      <SelectItem value="2">2 horas antes</SelectItem>
                      <SelectItem value="4">4 horas antes</SelectItem>
                      <SelectItem value="24">1 día antes</SelectItem>
                      <SelectItem value="48">2 días antes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-base font-medium">Historial de servicios</Label>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Has completado <strong className="text-foreground">0 servicios</strong> hasta ahora
                    </p>
                    <Button variant="outline" className="mt-3 w-full">
                      Ver Historial Completo
                    </Button>
                  </div>
                </div>

                <div className="pt-4">
                  <Button className="w-full">Guardar Preferencias</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
