import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase'
import { Bell, Check, Clock, Envelope, Phone, WhatsappLogo, X } from '@phosphor-icons/react'

interface NotificationPreferences {
  email_enabled: boolean
  sms_enabled: boolean
  whatsapp_enabled: boolean
  email_verified: boolean
  phone_verified: boolean
  whatsapp_verified: boolean
  notification_preferences: Record<string, { email: boolean; sms: boolean; whatsapp: boolean }>
  do_not_disturb_enabled: boolean
  do_not_disturb_start: string
  do_not_disturb_end: string
  daily_digest_enabled: boolean
  daily_digest_time: string
  weekly_summary_enabled: boolean
  weekly_summary_day: number
}

const NOTIFICATION_TYPES = [
  { key: 'appointment_reminder', label: 'Recordatorios de citas', icon: Clock },
  { key: 'appointment_confirmation', label: 'Confirmaciones de citas', icon: Check },
  { key: 'appointment_cancellation', label: 'Cancelaciones', icon: X },
  { key: 'appointment_rescheduled', label: 'Reagendamientos', icon: Clock },
  { key: 'security_alert', label: 'Alertas de seguridad', icon: Bell },
]

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export function NotificationSettings({ userId }: { userId: string }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)

  useEffect(() => {
    loadPreferences()
  }, [userId])

  async function loadPreferences() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No existe registro, crear uno por defecto
          const defaultPrefs = {
            user_id: userId,
            email_enabled: true,
            sms_enabled: false,
            whatsapp_enabled: false,
            email_verified: false,
            phone_verified: false,
            whatsapp_verified: false,
            notification_preferences: {},
            do_not_disturb_enabled: false,
            do_not_disturb_start: '22:00:00',
            do_not_disturb_end: '08:00:00',
            daily_digest_enabled: false,
            daily_digest_time: '09:00:00',
            weekly_summary_enabled: false,
            weekly_summary_day: 1,
          }
          setPreferences(defaultPrefs)
        } else {
          throw error
        }
      } else {
        setPreferences(data as NotificationPreferences)
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar las preferencias',
      })
    } finally {
      setLoading(false)
    }
  }

  async function savePreferences() {
    if (!preferences) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from('user_notification_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error

      toast({
        title: 'Preferencias guardadas',
        description: 'Tus preferencias de notificación han sido actualizadas',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron guardar las preferencias',
      })
    } finally {
      setSaving(false)
    }
  }

  function updateChannelEnabled(channel: 'email' | 'sms' | 'whatsapp', enabled: boolean) {
    if (!preferences) return
    setPreferences({
      ...preferences,
      [`${channel}_enabled`]: enabled,
    })
  }

  function updateNotificationChannel(
    notifType: string,
    channel: 'email' | 'sms' | 'whatsapp',
    enabled: boolean
  ) {
    if (!preferences) return
    setPreferences({
      ...preferences,
      notification_preferences: {
        ...preferences.notification_preferences,
        [notifType]: {
          ...(preferences.notification_preferences[notifType] || { email: false, sms: false, whatsapp: false }),
          [channel]: enabled,
        },
      },
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!preferences) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">No se pudieron cargar las preferencias</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Canales principales */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Canales de notificación
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Envelope className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="email-channel">Email</Label>
                {preferences.email_verified && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    <Check className="h-3 w-3 mr-1" />
                    Verificado
                  </Badge>
                )}
              </div>
            </div>
            <Switch
              id="email-channel"
              checked={preferences.email_enabled}
              onCheckedChange={(checked) => updateChannelEnabled('email', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="sms-channel">SMS</Label>
                {preferences.phone_verified && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    <Check className="h-3 w-3 mr-1" />
                    Verificado
                  </Badge>
                )}
              </div>
            </div>
            <Switch
              id="sms-channel"
              checked={preferences.sms_enabled}
              onCheckedChange={(checked) => updateChannelEnabled('sms', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <WhatsappLogo className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="whatsapp-channel">WhatsApp</Label>
                {preferences.whatsapp_verified && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    <Check className="h-3 w-3 mr-1" />
                    Verificado
                  </Badge>
                )}
              </div>
            </div>
            <Switch
              id="whatsapp-channel"
              checked={preferences.whatsapp_enabled}
              onCheckedChange={(checked) => updateChannelEnabled('whatsapp', checked)}
            />
          </div>
        </div>
      </Card>

      {/* Tipos de notificación */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Preferencias por tipo</h3>
        <div className="space-y-4">
          {NOTIFICATION_TYPES.map((type) => {
            const Icon = type.icon
            const prefs = preferences.notification_preferences[type.key] || {
              email: false,
              sms: false,
              whatsapp: false,
            }

            return (
              <div key={type.key} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <Label>{type.label}</Label>
                </div>
                <div className="flex gap-4 ml-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefs.email}
                      onChange={(e) => updateNotificationChannel(type.key, 'email', e.target.checked)}
                      disabled={!preferences.email_enabled}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-muted-foreground">Email</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefs.sms}
                      onChange={(e) => updateNotificationChannel(type.key, 'sms', e.target.checked)}
                      disabled={!preferences.sms_enabled}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-muted-foreground">SMS</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefs.whatsapp}
                      onChange={(e) => updateNotificationChannel(type.key, 'whatsapp', e.target.checked)}
                      disabled={!preferences.whatsapp_enabled}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-muted-foreground">WhatsApp</span>
                  </label>
                </div>
                {type.key !== NOTIFICATION_TYPES[NOTIFICATION_TYPES.length - 1].key && (
                  <Separator className="mt-4" />
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* No molestar */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">No molestar</h3>
          <Switch
            checked={preferences.do_not_disturb_enabled}
            onCheckedChange={(checked) =>
              setPreferences({ ...preferences, do_not_disturb_enabled: checked })
            }
          />
        </div>
        {preferences.do_not_disturb_enabled && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="dnd-start">Desde</Label>
              <input
                id="dnd-start"
                type="time"
                value={preferences.do_not_disturb_start}
                onChange={(e) =>
                  setPreferences({ ...preferences, do_not_disturb_start: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
              />
            </div>
            <div>
              <Label htmlFor="dnd-end">Hasta</Label>
              <input
                id="dnd-end"
                type="time"
                value={preferences.do_not_disturb_end}
                onChange={(e) =>
                  setPreferences({ ...preferences, do_not_disturb_end: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
              />
            </div>
          </div>
        )}
      </Card>

      {/* Resúmenes */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Resúmenes</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="daily-digest">Resumen diario</Label>
            <Switch
              id="daily-digest"
              checked={preferences.daily_digest_enabled}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, daily_digest_enabled: checked })
              }
            />
          </div>
          {preferences.daily_digest_enabled && (
            <div>
              <Label htmlFor="digest-time">Hora de envío</Label>
              <input
                id="digest-time"
                type="time"
                value={preferences.daily_digest_time}
                onChange={(e) =>
                  setPreferences({ ...preferences, daily_digest_time: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
              />
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <Label htmlFor="weekly-summary">Resumen semanal</Label>
            <Switch
              id="weekly-summary"
              checked={preferences.weekly_summary_enabled}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, weekly_summary_enabled: checked })
              }
            />
          </div>
          {preferences.weekly_summary_enabled && (
            <div>
              <Label htmlFor="summary-day">Día de envío</Label>
              <select
                id="summary-day"
                value={preferences.weekly_summary_day}
                onChange={(e) =>
                  setPreferences({ ...preferences, weekly_summary_day: parseInt(e.target.value) })
                }
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
              >
                {DAYS.map((day, index) => (
                  <option key={index} value={index}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </Card>

      {/* Botón guardar */}
      <div className="flex justify-end">
        <Button onClick={savePreferences} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar preferencias'}
        </Button>
      </div>
    </div>
  )
}
