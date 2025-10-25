import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import {
  ArrowDown,
  ArrowUp,
  Bell,
  Clock,
  Envelope,
  Phone,
  Plus,
  Trash,
  WhatsappLogo,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface BusinessNotificationSettings {
  id?: string
  business_id: string
  email_enabled: boolean
  sms_enabled: boolean
  whatsapp_enabled: boolean
  channel_priority: ('email' | 'sms' | 'whatsapp')[]
  reminder_times: number[]
  notification_types: Record<string, { enabled: boolean; channels: string[] }>
  email_from_name: string
  email_from_address: string
  twilio_phone_number: string
  whatsapp_phone_number: string
  send_notifications_from: string
  send_notifications_until: string
  timezone: string
  use_fallback: boolean
  max_retry_attempts: number
}

const NOTIFICATION_TYPE_CONFIGS = [
  {
    key: 'appointment_reminder',
    label: 'Recordatorios de citas',
    description: 'Notificaciones automáticas antes de la cita',
  },
  {
    key: 'appointment_confirmation',
    label: 'Confirmación de citas',
    description: 'Al confirmar una nueva cita',
  },
  { key: 'appointment_cancellation', label: 'Cancelaciones', description: 'Al cancelar una cita' },
  {
    key: 'appointment_rescheduled',
    label: 'Reagendamientos',
    description: 'Al reprogramar una cita',
  },
  {
    key: 'employee_request',
    label: 'Solicitudes de empleados',
    description: 'Nuevas solicitudes para unirse al negocio',
  },
  { key: 'daily_digest', label: 'Resumen diario', description: 'Resumen de actividades del día' },
]

const TIMEZONES = [
  { value: 'America/Bogota', label: 'Bogotá (GMT-5)' },
  { value: 'America/Mexico_City', label: 'Ciudad de México (GMT-6)' },
  { value: 'America/New_York', label: 'Nueva York (GMT-5/4)' },
  { value: 'America/Los_Angeles', label: 'Los Ángeles (GMT-8/7)' },
  { value: 'Europe/Madrid', label: 'Madrid (GMT+1/2)' },
]

function formatMinutesToHuman(minutes: number): string {
  if (minutes < 60) return `${minutes} minutos`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) return `${hours} hora${hours > 1 ? 's' : ''}`
  return `${hours}h ${mins}m`
}

export function BusinessNotificationSettings({ businessId }: { businessId: string }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<BusinessNotificationSettings | null>(null)
  const [newReminderTime, setNewReminderTime] = useState('')

  useEffect(() => {
    loadSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId])

  async function loadSettings() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('business_notification_settings')
        .select('*')
        .eq('business_id', businessId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No existe, crear valores por defecto
          const defaultSettings: BusinessNotificationSettings = {
            business_id: businessId,
            email_enabled: true,
            sms_enabled: false,
            whatsapp_enabled: false,
            channel_priority: ['whatsapp', 'email', 'sms'],
            reminder_times: [1440, 60], // 24h y 1h antes
            notification_types: {
              appointment_reminder: { enabled: true, channels: ['email', 'whatsapp'] },
              appointment_confirmation: { enabled: true, channels: ['email', 'whatsapp'] },
              appointment_cancellation: { enabled: true, channels: ['email', 'sms', 'whatsapp'] },
              appointment_rescheduled: { enabled: true, channels: ['email', 'whatsapp'] },
              employee_request: { enabled: true, channels: ['email'] },
              daily_digest: { enabled: false, channels: ['email'] },
            },
            email_from_name: '',
            email_from_address: '',
            twilio_phone_number: '',
            whatsapp_phone_number: '',
            send_notifications_from: '08:00:00',
            send_notifications_until: '22:00:00',
            timezone: 'America/Bogota',
            use_fallback: true,
            max_retry_attempts: 3,
          }
          setSettings(defaultSettings)
        } else {
          throw error
        }
      } else {
        setSettings(data as BusinessNotificationSettings)
      }
    } catch {
      toast.error('No se pudieron cargar las configuraciones')
    } finally {
      setLoading(false)
    }
  }

  async function saveSettings() {
    if (!settings) return

    try {
      setSaving(true)

      const { error } = await supabase.from('business_notification_settings').upsert({
        business_id: businessId,
        email_enabled: settings.email_enabled,
        sms_enabled: settings.sms_enabled,
        whatsapp_enabled: settings.whatsapp_enabled,
        channel_priority: settings.channel_priority,
        reminder_times: settings.reminder_times,
        notification_types: settings.notification_types,
        email_from_name: settings.email_from_name,
        email_from_address: settings.email_from_address,
        twilio_phone_number: settings.twilio_phone_number,
        whatsapp_phone_number: settings.whatsapp_phone_number,
        send_notifications_from: settings.send_notifications_from,
        send_notifications_until: settings.send_notifications_until,
        timezone: settings.timezone,
        use_fallback: settings.use_fallback,
        max_retry_attempts: settings.max_retry_attempts,
      })

      if (error) throw error

      toast.success('Configuración guardada correctamente')
    } catch {
      toast.error('No se pudieron guardar las configuraciones')
    } finally {
      setSaving(false)
    }
  }

  function updateSettings(updates: Partial<BusinessNotificationSettings>) {
    if (!settings) return
    setSettings({ ...settings, ...updates })
  }

  function moveChannelUp(index: number) {
    if (!settings || index === 0) return
    const newPriority = [...settings.channel_priority]
    ;[newPriority[index - 1], newPriority[index]] = [newPriority[index], newPriority[index - 1]]
    updateSettings({ channel_priority: newPriority })
  }

  function moveChannelDown(index: number) {
    if (!settings || index === settings.channel_priority.length - 1) return
    const newPriority = [...settings.channel_priority]
    ;[newPriority[index], newPriority[index + 1]] = [newPriority[index + 1], newPriority[index]]
    updateSettings({ channel_priority: newPriority })
  }

  function addReminderTime() {
    if (!settings || !newReminderTime) return
    const minutes = parseInt(newReminderTime)
    if (isNaN(minutes) || minutes <= 0) {
      toast.error('Ingrese un número de minutos válido')
      return
    }
    if (settings.reminder_times.includes(minutes)) {
      toast.error('Este tiempo ya está en la lista')
      return
    }
    const newTimes = [...settings.reminder_times, minutes].sort((a, b) => b - a)
    updateSettings({ reminder_times: newTimes })
    setNewReminderTime('')
  }

  function removeReminderTime(minutes: number) {
    if (!settings) return
    const newTimes = settings.reminder_times.filter(t => t !== minutes)
    updateSettings({ reminder_times: newTimes })
  }

  function updateNotificationType(
    key: string,
    field: 'enabled' | 'channels',
    value: boolean | string[]
  ) {
    if (!settings) return
    const newTypes = {
      ...settings.notification_types,
      [key]: {
        ...settings.notification_types[key],
        [field]: value,
      },
    }
    updateSettings({ notification_types: newTypes })
  }

  function toggleNotificationChannel(notifKey: string, channel: string) {
    if (!settings) return
    const currentChannels = settings.notification_types[notifKey]?.channels || []
    const newChannels = currentChannels.includes(channel)
      ? currentChannels.filter(c => c !== channel)
      : [...currentChannels, channel]
    updateNotificationType(notifKey, 'channels', newChannels)
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Envelope weight="fill" />
      case 'sms':
        return <Phone weight="fill" />
      case 'whatsapp':
        return <WhatsappLogo weight="fill" />
      default:
        return <Bell weight="fill" />
    }
  }

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'email':
        return 'text-blue-500'
      case 'sms':
        return 'text-green-500'
      case 'whatsapp':
        return 'text-emerald-500'
      default:
        return 'text-muted-foreground'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8" role="status" aria-label="Cargando configuración de notificaciones">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="sr-only">Cargando configuración de notificaciones...</span>
      </div>
    )
  }

  if (!settings) return null

  return (
    <main role="main" aria-labelledby="business-notification-settings-title" className="space-y-6 max-w-[95vw]">
      <h1 id="business-notification-settings-title" className="sr-only">Configuración de Notificaciones del Negocio</h1>
      
      {/* Canales Habilitados */}
      <section role="region" aria-labelledby="notification-channels-title">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground text-lg sm:text-xl" id="notification-channels-title">
              <Bell className="h-5 w-5" aria-hidden="true" />
              Canales de Notificación
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm sm:text-base">
              Selecciona qué canales estarán disponibles para enviar notificaciones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2 text-foreground text-sm sm:text-base">
                    <Envelope className="h-4 w-4 text-blue-500" aria-hidden="true" />
                    Email
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Notificaciones por correo electrónico
                  </p>
                </div>
                <Switch
                  checked={settings.email_enabled}
                  onCheckedChange={checked => updateSettings({ email_enabled: checked })}
                  aria-label="Habilitar notificaciones por email"
                  className="min-h-[44px] min-w-[44px]"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2 text-foreground text-sm sm:text-base">
                    <Phone className="h-4 w-4 text-green-500" aria-hidden="true" />
                    SMS
                  </Label>
                  <p className="text-sm text-muted-foreground">Mensajes de texto vía AWS SNS</p>
                </div>
                <Switch
                  checked={settings.sms_enabled}
                  onCheckedChange={checked => updateSettings({ sms_enabled: checked })}
                  aria-label="Habilitar notificaciones por SMS"
                  className="min-h-[44px] min-w-[44px]"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2 text-foreground text-sm sm:text-base">
                    <WhatsappLogo className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                    WhatsApp
                  </Label>
                  <p className="text-sm text-muted-foreground">Mensajes vía WhatsApp Business API</p>
                </div>
                <Switch
                  checked={settings.whatsapp_enabled}
                  onCheckedChange={checked => updateSettings({ whatsapp_enabled: checked })}
                  aria-label="Habilitar notificaciones por WhatsApp"
                  className="min-h-[44px] min-w-[44px]"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Prioridad de Canales */}
      <section role="region" aria-labelledby="channel-priority-title">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground text-lg sm:text-xl" id="channel-priority-title">Prioridad de Canales</CardTitle>
            <CardDescription className="text-muted-foreground text-sm sm:text-base">
              Orden en que se intentarán los canales si uno falla
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-2">
              {settings.channel_priority.map((channel, index) => (
                <div
                  key={channel}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border border-border rounded-lg bg-background"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-muted-foreground">#{index + 1}</span>
                    <span className={cn('flex items-center gap-2', getChannelColor(channel))}>
                      {getChannelIcon(channel)}
                      <span className="font-medium capitalize text-sm sm:text-base">{channel}</span>
                    </span>
                  </div>
                  <div className="flex gap-1 self-end sm:self-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={index === 0}
                      onClick={() => moveChannelUp(index)}
                      aria-label={`Mover ${channel} hacia arriba en la prioridad`}
                      title={`Mover ${channel} hacia arriba`}
                      className="min-h-[44px] min-w-[44px]"
                    >
                      <ArrowUp className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={index === settings.channel_priority.length - 1}
                      onClick={() => moveChannelDown(index)}
                      aria-label={`Mover ${channel} hacia abajo en la prioridad`}
                      title={`Mover ${channel} hacia abajo`}
                      className="min-h-[44px] min-w-[44px]"
                    >
                      <ArrowDown className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2">
              <Switch
                checked={settings.use_fallback}
                onCheckedChange={checked => updateSettings({ use_fallback: checked })}
                aria-label="Usar sistema de respaldo"
                className="min-h-[44px] min-w-[44px]"
              />
              <Label className="text-foreground text-sm sm:text-base">
                Usar sistema de respaldo (intentar siguiente canal si falla)
              </Label>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Tiempos de Recordatorio */}
      <section role="region" aria-labelledby="reminder-times-title">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground text-lg sm:text-xl" id="reminder-times-title">
              <Clock className="h-5 w-5" aria-hidden="true" />
              Tiempos de Recordatorio
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm sm:text-base">
              Define cuándo enviar recordatorios antes de las citas (en minutos)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="number"
                placeholder="Minutos (ej: 1440 para 24h)"
                value={newReminderTime}
                onChange={e => setNewReminderTime(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addReminderTime()}
                aria-label="Nuevo tiempo de recordatorio en minutos"
                aria-describedby="reminder-time-help"
                className="min-h-[44px] focus:ring-2 focus:ring-primary focus:ring-offset-2"
              />
              <span id="reminder-time-help" className="sr-only">Ingresa el tiempo en minutos antes de la cita para enviar el recordatorio</span>
              <Button 
                onClick={addReminderTime}
                aria-label="Agregar nuevo tiempo de recordatorio"
                className="min-h-[44px] w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                Agregar
              </Button>
            </div>

            <div className="space-y-2" role="list" aria-label="Tiempos de recordatorio configurados">
              {settings.reminder_times
                .sort((a, b) => b - a)
                .map(minutes => (
                  <div
                    key={minutes}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border border-border rounded-lg bg-background"
                    role="listitem"
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      <span className="font-medium text-sm sm:text-base">{formatMinutesToHuman(minutes)} antes</span>
                      <Badge variant="secondary" className="text-xs">{minutes} min</Badge>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeReminderTime(minutes)}
                      aria-label={`Eliminar recordatorio de ${formatMinutesToHuman(minutes)} antes`}
                      title={`Eliminar recordatorio de ${formatMinutesToHuman(minutes)}`}
                      className="min-h-[44px] min-w-[44px] self-end sm:self-auto"
                    >
                      <Trash className="h-4 w-4 text-destructive" aria-hidden="true" />
                    </Button>
                  </div>
                ))}
              {settings.reminder_times.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4" role="status">
                  No hay recordatorios configurados
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Tipos de Notificación */}
      <section role="region" aria-labelledby="notification-types-title">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground text-lg sm:text-xl" id="notification-types-title">Configuración por Tipo de Notificación</CardTitle>
            <CardDescription className="text-muted-foreground text-sm sm:text-base">
              Personaliza qué canales usar para cada tipo de notificación
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6">
            {NOTIFICATION_TYPE_CONFIGS.map(config => {
              const notifSettings = settings.notification_types[config.key] || {
                enabled: false,
                channels: [],
              }
              return (
                <div key={config.key} className="space-y-3 pb-4 border-b border-border last:border-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <Label className="text-foreground text-sm sm:text-base">{config.label}</Label>
                      <p className="text-sm text-muted-foreground">{config.description}</p>
                    </div>
                    <Switch
                      checked={notifSettings.enabled}
                      onCheckedChange={checked =>
                        updateNotificationType(config.key, 'enabled', checked)
                      }
                      aria-label={`Habilitar ${config.label}`}
                      className="min-h-[44px] min-w-[44px]"
                    />
                  </div>
                  {notifSettings.enabled && (
                    <div className="flex flex-wrap gap-2 ml-0 sm:ml-4" role="group" aria-label={`Canales para ${config.label}`}>
                      <Button
                        variant={notifSettings.channels.includes('email') ? 'default' : 'outline'}
                        size="sm"
                        disabled={!settings.email_enabled}
                        onClick={() => toggleNotificationChannel(config.key, 'email')}
                        aria-label={`${notifSettings.channels.includes('email') ? 'Desactivar' : 'Activar'} email para ${config.label}`}
                        className="min-h-[44px]"
                      >
                        <Envelope className="h-4 w-4 mr-1" aria-hidden="true" />
                        Email
                      </Button>
                      <Button
                        variant={notifSettings.channels.includes('sms') ? 'default' : 'outline'}
                        size="sm"
                        disabled={!settings.sms_enabled}
                        onClick={() => toggleNotificationChannel(config.key, 'sms')}
                        aria-label={`${notifSettings.channels.includes('sms') ? 'Desactivar' : 'Activar'} SMS para ${config.label}`}
                        className="min-h-[44px]"
                      >
                        <Phone className="h-4 w-4 mr-1" aria-hidden="true" />
                        SMS
                      </Button>
                      <Button
                        variant={notifSettings.channels.includes('whatsapp') ? 'default' : 'outline'}
                        size="sm"
                        disabled={!settings.whatsapp_enabled}
                        onClick={() => toggleNotificationChannel(config.key, 'whatsapp')}
                        aria-label={`${notifSettings.channels.includes('whatsapp') ? 'Desactivar' : 'Activar'} WhatsApp para ${config.label}`}
                        className="min-h-[44px]"
                      >
                        <WhatsappLogo className="h-4 w-4 mr-1" aria-hidden="true" />
                        WhatsApp
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      </section>

      {/* Horarios de Envío */}
      <section role="region" aria-labelledby="send-schedule-title">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground text-lg sm:text-xl" id="send-schedule-title">Horarios de Envío</CardTitle>
            <CardDescription className="text-muted-foreground text-sm sm:text-base">
              Define el rango horario en que se pueden enviar notificaciones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground text-sm sm:text-base">Desde</Label>
                <Input
                  type="time"
                  value={settings.send_notifications_from}
                  onChange={e => updateSettings({ send_notifications_from: e.target.value })}
                  aria-label="Hora de inicio para envío de notificaciones"
                  className="min-h-[44px] focus:ring-2 focus:ring-primary focus:ring-offset-2"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground text-sm sm:text-base">Hasta</Label>
                <Input
                  type="time"
                  value={settings.send_notifications_until}
                  onChange={e => updateSettings({ send_notifications_until: e.target.value })}
                  aria-label="Hora de fin para envío de notificaciones"
                  className="min-h-[44px] focus:ring-2 focus:ring-primary focus:ring-offset-2"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground text-sm sm:text-base">Zona Horaria</Label>
              <select
                className="flex h-10 min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:ring-offset-2"
                value={settings.timezone}
                onChange={e => updateSettings({ timezone: e.target.value })}
                aria-label="Seleccionar zona horaria"
              >
                {TIMEZONES.map(tz => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Configuración de Contactos */}
      <section role="region" aria-labelledby="contact-config-title">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground text-lg sm:text-xl" id="contact-config-title">Configuración de Contactos</CardTitle>
            <CardDescription className="text-muted-foreground text-sm sm:text-base">
              Datos de contacto del remitente para cada canal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div className="space-y-2">
              <Label className="text-foreground text-sm sm:text-base">Nombre del remitente (Email)</Label>
              <Input
                placeholder="Mi Negocio"
                value={settings.email_from_name}
                onChange={e => updateSettings({ email_from_name: e.target.value })}
                aria-label="Nombre del remitente para emails"
                aria-describedby="email-from-name-help"
                className="min-h-[44px] focus:ring-2 focus:ring-primary focus:ring-offset-2"
              />
              <span id="email-from-name-help" className="sr-only">Este nombre aparecerá como remitente en los emails enviados</span>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground text-sm sm:text-base">Email del remitente</Label>
              <Input
                type="email"
                placeholder="noreply@minegocio.com"
                value={settings.email_from_address}
                onChange={e => updateSettings({ email_from_address: e.target.value })}
                aria-label="Dirección de email del remitente"
                aria-describedby="email-from-address-help"
                className="min-h-[44px] focus:ring-2 focus:ring-primary focus:ring-offset-2"
              />
              <span id="email-from-address-help" className="sr-only">Dirección de email que aparecerá como remitente</span>
            </div>

            <Separator className="bg-border" />

            <div className="space-y-2">
              <Label className="text-foreground text-sm sm:text-base">Número de teléfono AWS SNS (SMS)</Label>
              <Input
                placeholder="+1234567890"
                value={settings.twilio_phone_number}
                onChange={e => updateSettings({ twilio_phone_number: e.target.value })}
                aria-label="Número de teléfono para SMS"
                aria-describedby="sms-phone-help"
                className="min-h-[44px] focus:ring-2 focus:ring-primary focus:ring-offset-2"
              />
              <span id="sms-phone-help" className="sr-only">Número de teléfono configurado en AWS SNS para envío de SMS</span>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground text-sm sm:text-base">Número de WhatsApp Business</Label>
              <Input
                placeholder="+1234567890"
                value={settings.whatsapp_phone_number}
                onChange={e => updateSettings({ whatsapp_phone_number: e.target.value })}
                aria-label="Número de WhatsApp Business"
                aria-describedby="whatsapp-phone-help"
                className="min-h-[44px] focus:ring-2 focus:ring-primary focus:ring-offset-2"
              />
              <span id="whatsapp-phone-help" className="sr-only">Número de teléfono configurado en WhatsApp Business API</span>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Configuración Avanzada */}
      <section role="region" aria-labelledby="advanced-config-title">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground text-lg sm:text-xl" id="advanced-config-title">Configuración Avanzada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div className="space-y-2">
              <Label className="text-foreground text-sm sm:text-base">Máximo de reintentos</Label>
              <Input
                type="number"
                min="1"
                max="5"
                value={settings.max_retry_attempts}
                onChange={e => updateSettings({ max_retry_attempts: parseInt(e.target.value) || 3 })}
                aria-label="Número máximo de reintentos"
                aria-describedby="max-retry-help"
                className="min-h-[44px] focus:ring-2 focus:ring-primary focus:ring-offset-2"
              />
              <p id="max-retry-help" className="text-sm text-muted-foreground">
                Número de veces que se reintentará enviar una notificación fallida
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Botón de Guardar */}
      <div className="flex flex-col sm:flex-row justify-end gap-3">
        <Button 
          variant="outline" 
          onClick={loadSettings} 
          disabled={saving}
          aria-label="Descartar cambios y recargar configuración"
          className="min-h-[44px] w-full sm:w-auto"
        >
          Descartar cambios
        </Button>
        <Button
          onClick={saveSettings}
          disabled={saving}
          className="bg-primary hover:bg-primary/90 text-primary-foreground min-h-[44px] w-full sm:w-auto"
          aria-label={saving ? 'Guardando configuración...' : 'Guardar configuración de notificaciones'}
        >
          {saving ? 'Guardando...' : 'Guardar configuración'}
        </Button>
      </div>
    </main>
  )
}