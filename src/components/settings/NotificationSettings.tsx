import React, { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { useLanguage } from '@/contexts/LanguageContext'
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
  { key: 'appointment_reminder', label: 'notifications.types.appointmentReminder', icon: Clock },
  {
    key: 'appointment_confirmation',
    label: 'notifications.types.appointmentConfirmation',
    icon: Check,
  },
  {
    key: 'appointment_cancellation',
    label: 'notifications.types.appointmentCancellation',
    icon: X,
  },
  {
    key: 'appointment_rescheduled',
    label: 'notifications.types.appointmentRescheduled',
    icon: Clock,
  },
  { key: 'security_alert', label: 'notifications.types.securityAlert', icon: Bell },
]

const DAYS_KEYS = [
  'notifications.days.sunday',
  'notifications.days.monday',
  'notifications.days.tuesday',
  'notifications.days.wednesday',
  'notifications.days.thursday',
  'notifications.days.friday',
  'notifications.days.saturday',
]

export function NotificationSettings({ userId }: { userId: string }) {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)

  const loadPreferences = React.useCallback(async () => {
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
    } catch {
      toast.error(t('notifications.errors.loadError'))
    } finally {
      setLoading(false)
    }
  }, [userId, t])

  useEffect(() => {
    loadPreferences()
  }, [loadPreferences])

  async function savePreferences() {
    if (!preferences) return

    try {
      setSaving(true)
      const { error } = await supabase.from('user_notification_preferences').upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      toast.success(t('common.messages.saveSuccess'), {
        description:
          t('notifications.preferencesSaved') || 'Your notification preferences have been updated',
      })
    } catch {
      toast.error(t('common.messages.saveError'))
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
          ...(preferences.notification_preferences[notifType] || {
            email: false,
            sms: false,
            whatsapp: false,
          }),
          [channel]: enabled,
        },
      },
    })
  }

  if (loading) {
    return (
      <section 
        role="status" 
        aria-live="polite" 
        aria-label="Cargando configuración de notificaciones"
        className="flex items-center justify-center p-8"
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="sr-only">Cargando configuración de notificaciones...</span>
      </section>
    )
  }

  if (!preferences) {
    return (
      <section 
        role="region" 
        aria-labelledby="no-preferences-title"
        className="text-center p-8"
      >
        <h2 id="no-preferences-title" className="sr-only">Error al cargar preferencias</h2>
        <p className="text-muted-foreground">{t('notifications.errors.noPreferences')}</p>
      </section>
    )
  }

  return (
    <main 
      role="main" 
      aria-labelledby="notification-settings-title"
      className="space-y-6 max-w-[95vw] mx-auto"
    >
      <h1 id="notification-settings-title" className="sr-only">
        Configuración de notificaciones
      </h1>
      
      {/* Canales principales */}
      <Card className="p-4 sm:p-6">
        <section role="region" aria-labelledby="channels-title">
          <h2 id="channels-title" className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5" aria-hidden="true" />
            {t('notifications.channels.title')}
          </h2>
          <div className="space-y-4" role="list" aria-label="Canales de notificación disponibles">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" role="listitem">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Envelope className="h-5 w-5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <Label htmlFor="email-channel" className="text-sm sm:text-base">
                    {t('notifications.channels.email')}
                  </Label>
                  {preferences.email_verified && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      <Check className="h-3 w-3 mr-1" aria-hidden="true" />
                      {t('notifications.channels.verified')}
                    </Badge>
                  )}
                </div>
              </div>
              <Switch
                id="email-channel"
                checked={preferences.email_enabled}
                onCheckedChange={checked => updateChannelEnabled('email', checked)}
                aria-label={`${preferences.email_enabled ? 'Desactivar' : 'Activar'} notificaciones por email`}
                className="flex-shrink-0"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" role="listitem">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <Label htmlFor="sms-channel" className="text-sm sm:text-base">
                    {t('notifications.channels.sms')}
                  </Label>
                  {preferences.phone_verified && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      <Check className="h-3 w-3 mr-1" aria-hidden="true" />
                      {t('notifications.channels.verified')}
                    </Badge>
                  )}
                </div>
              </div>
              <Switch
                id="sms-channel"
                checked={preferences.sms_enabled}
                onCheckedChange={checked => updateChannelEnabled('sms', checked)}
                aria-label={`${preferences.sms_enabled ? 'Desactivar' : 'Activar'} notificaciones por SMS`}
                className="flex-shrink-0"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" role="listitem">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <WhatsappLogo className="h-5 w-5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <Label htmlFor="whatsapp-channel" className="text-sm sm:text-base">
                    {t('notifications.channels.whatsapp')}
                  </Label>
                  {preferences.whatsapp_verified && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      <Check className="h-3 w-3 mr-1" aria-hidden="true" />
                      {t('notifications.channels.verified')}
                    </Badge>
                  )}
                </div>
              </div>
              <Switch
                id="whatsapp-channel"
                checked={preferences.whatsapp_enabled}
                onCheckedChange={checked => updateChannelEnabled('whatsapp', checked)}
                aria-label={`${preferences.whatsapp_enabled ? 'Desactivar' : 'Activar'} notificaciones por WhatsApp`}
                className="flex-shrink-0"
              />
            </div>
          </div>
        </section>
      </Card>

      {/* Tipos de notificación */}
      <Card className="p-4 sm:p-6">
        <section role="region" aria-labelledby="notification-types-title">
          <h2 id="notification-types-title" className="text-lg font-semibold mb-4">
            {t('notifications.types.title')}
          </h2>
          <div className="space-y-4" role="list" aria-label="Tipos de notificación">
            {NOTIFICATION_TYPES.map((type, index) => {
              const Icon = type.icon
              const prefs = preferences.notification_preferences[type.key] || {
                email: false,
                sms: false,
                whatsapp: false,
              }

              return (
                <div key={type.key} className="space-y-2" role="listitem">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <Label className="text-sm sm:text-base">{t(type.label)}</Label>
                  </div>
                  <fieldset 
                    className="flex flex-col sm:flex-row gap-2 sm:gap-4 ml-6"
                    aria-labelledby={`notification-type-${type.key}`}
                  >
                    <legend id={`notification-type-${type.key}`} className="sr-only">
                      Canales para {t(type.label)}
                    </legend>
                    <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                      <input
                        type="checkbox"
                        checked={prefs.email}
                        onChange={e => updateNotificationChannel(type.key, 'email', e.target.checked)}
                        disabled={!preferences.email_enabled}
                        className="rounded border-gray-300 min-h-[16px] min-w-[16px] focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        aria-describedby={`email-help-${type.key}`}
                      />
                      <span className="text-sm text-muted-foreground">
                        {t('notifications.channels.email')}
                      </span>
                      <span id={`email-help-${type.key}`} className="sr-only">
                        {preferences.email_enabled ? 'Disponible' : 'No disponible - active el canal de email primero'}
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                      <input
                        type="checkbox"
                        checked={prefs.sms}
                        onChange={e => updateNotificationChannel(type.key, 'sms', e.target.checked)}
                        disabled={!preferences.sms_enabled}
                        className="rounded border-gray-300 min-h-[16px] min-w-[16px] focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        aria-describedby={`sms-help-${type.key}`}
                      />
                      <span className="text-sm text-muted-foreground">
                        {t('notifications.channels.sms')}
                      </span>
                      <span id={`sms-help-${type.key}`} className="sr-only">
                        {preferences.sms_enabled ? 'Disponible' : 'No disponible - active el canal de SMS primero'}
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                      <input
                        type="checkbox"
                        checked={prefs.whatsapp}
                        onChange={e =>
                          updateNotificationChannel(type.key, 'whatsapp', e.target.checked)
                        }
                        disabled={!preferences.whatsapp_enabled}
                        className="rounded border-gray-300 min-h-[16px] min-w-[16px] focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        aria-describedby={`whatsapp-help-${type.key}`}
                      />
                      <span className="text-sm text-muted-foreground">
                        {t('notifications.channels.whatsapp')}
                      </span>
                      <span id={`whatsapp-help-${type.key}`} className="sr-only">
                        {preferences.whatsapp_enabled ? 'Disponible' : 'No disponible - active el canal de WhatsApp primero'}
                      </span>
                    </label>
                  </fieldset>
                  {index < NOTIFICATION_TYPES.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              )
            })}
          </div>
        </section>
      </Card>

      {/* No molestar */}
      <Card className="p-4 sm:p-6">
        <section role="region" aria-labelledby="do-not-disturb-title">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 id="do-not-disturb-title" className="text-lg font-semibold">
              {t('notifications.doNotDisturb.title')}
            </h2>
            <Switch
              checked={preferences.do_not_disturb_enabled}
              onCheckedChange={checked =>
                setPreferences({ ...preferences, do_not_disturb_enabled: checked })
              }
              aria-label={`${preferences.do_not_disturb_enabled ? 'Desactivar' : 'Activar'} modo no molestar`}
              aria-describedby="dnd-description"
              className="flex-shrink-0"
            />
          </div>
          <div id="dnd-description" className="sr-only">
            El modo no molestar evita que recibas notificaciones durante las horas especificadas
          </div>
          {preferences.do_not_disturb_enabled && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="dnd-start" className="text-sm sm:text-base">
                  {t('notifications.doNotDisturb.from')}
                </Label>
                <input
                  id="dnd-start"
                  type="time"
                  value={preferences.do_not_disturb_start}
                  onChange={e =>
                    setPreferences({ ...preferences, do_not_disturb_start: e.target.value })
                  }
                  className="mt-1 block w-full sm:max-w-xs rounded-md border border-input bg-background px-3 py-2 min-h-[44px] focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-describedby="dnd-start-help"
                />
                <div id="dnd-start-help" className="sr-only">
                  Hora de inicio del período de no molestar
                </div>
              </div>
              <div>
                <Label htmlFor="dnd-end" className="text-sm sm:text-base">
                  {t('notifications.doNotDisturb.until')}
                </Label>
                <input
                  id="dnd-end"
                  type="time"
                  value={preferences.do_not_disturb_end}
                  onChange={e =>
                    setPreferences({ ...preferences, do_not_disturb_end: e.target.value })
                  }
                  className="mt-1 block w-full sm:max-w-xs rounded-md border border-input bg-background px-3 py-2 min-h-[44px] focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-describedby="dnd-end-help"
                />
                <div id="dnd-end-help" className="sr-only">
                  Hora de fin del período de no molestar
                </div>
              </div>
            </div>
          )}
        </section>
      </Card>

      {/* Resúmenes */}
      <Card className="p-4 sm:p-6">
        <section role="region" aria-labelledby="summaries-title">
          <h2 id="summaries-title" className="text-lg font-semibold mb-4">
            {t('notifications.summaries.title')}
          </h2>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <Label htmlFor="daily-digest" className="text-sm sm:text-base">
                {t('notifications.summaries.dailyDigest')}
              </Label>
              <Switch
                id="daily-digest"
                checked={preferences.daily_digest_enabled}
                onCheckedChange={checked =>
                  setPreferences({ ...preferences, daily_digest_enabled: checked })
                }
                aria-label={`${preferences.daily_digest_enabled ? 'Desactivar' : 'Activar'} resumen diario`}
                aria-describedby="daily-digest-description"
                className="flex-shrink-0"
              />
            </div>
            <div id="daily-digest-description" className="sr-only">
              Recibe un resumen diario de tus citas y actividades
            </div>
            {preferences.daily_digest_enabled && (
              <div>
                <Label htmlFor="digest-time" className="text-sm sm:text-base">
                  {t('notifications.summaries.sendTime')}
                </Label>
                <input
                  id="digest-time"
                  type="time"
                  value={preferences.daily_digest_time}
                  onChange={e =>
                    setPreferences({ ...preferences, daily_digest_time: e.target.value })
                  }
                  className="mt-1 block w-full sm:max-w-xs rounded-md border border-input bg-background px-3 py-2 min-h-[44px] focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-describedby="digest-time-help"
                />
                <div id="digest-time-help" className="sr-only">
                  Hora a la que se enviará el resumen diario
                </div>
              </div>
            )}

            <Separator />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <Label htmlFor="weekly-summary" className="text-sm sm:text-base">
                {t('notifications.summaries.weeklyDigest')}
              </Label>
              <Switch
                id="weekly-summary"
                checked={preferences.weekly_summary_enabled}
                onCheckedChange={checked =>
                  setPreferences({ ...preferences, weekly_summary_enabled: checked })
                }
                aria-label={`${preferences.weekly_summary_enabled ? 'Desactivar' : 'Activar'} resumen semanal`}
                aria-describedby="weekly-summary-description"
                className="flex-shrink-0"
              />
            </div>
            <div id="weekly-summary-description" className="sr-only">
              Recibe un resumen semanal de tus citas y actividades
            </div>
            {preferences.weekly_summary_enabled && (
              <div>
                <Label htmlFor="summary-day" className="text-sm sm:text-base">
                  {t('notifications.summaries.sendDay')}
                </Label>
                <select
                  id="summary-day"
                  value={preferences.weekly_summary_day}
                  onChange={e =>
                    setPreferences({
                      ...preferences,
                      weekly_summary_day: Number.parseInt(e.target.value),
                    })
                  }
                  className="mt-1 block w-full sm:max-w-xs rounded-md border border-input bg-background px-3 py-2 min-h-[44px] focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-describedby="summary-day-help"
                >
                  {DAYS_KEYS.map((dayKey, index) => (
                    <option key={dayKey} value={index}>
                      {t(dayKey)}
                    </option>
                  ))}
                </select>
                <div id="summary-day-help" className="sr-only">
                  Día de la semana en que se enviará el resumen semanal
                </div>
              </div>
            )}
          </div>
        </section>
      </Card>

      {/* Botón guardar */}
      <div className="flex justify-center sm:justify-end">
        <Button 
          onClick={savePreferences} 
          disabled={saving}
          className="min-h-[44px] min-w-[44px] w-full sm:w-auto"
          aria-label={saving ? 'Guardando configuración...' : 'Guardar configuración de notificaciones'}
          title={saving ? 'Guardando configuración...' : 'Guardar configuración de notificaciones'}
        >
          {saving ? t('common.actions.saving') : t('common.actions.save')}
        </Button>
      </div>
    </main>
  )
}