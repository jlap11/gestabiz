import React, { useState, useEffect } from 'react'
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
  { key: 'appointment_confirmation', label: 'notifications.types.appointmentConfirmation', icon: Check },
  { key: 'appointment_cancellation', label: 'notifications.types.appointmentCancellation', icon: X },
  { key: 'appointment_rescheduled', label: 'notifications.types.appointmentRescheduled', icon: Clock },
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
  }, [userId])

  useEffect(() => {
    loadPreferences()
  }, [loadPreferences])

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

      toast.success(t('common.messages.saveSuccess'), {
        description: t('notifications.preferencesSaved') || 'Your notification preferences have been updated'
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
        <p className="text-muted-foreground">{t('notifications.errors.noPreferences')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Canales principales */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5" />
          {t('notifications.channels.title')}
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Envelope className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="email-channel">{t('notifications.channels.email')}</Label>
                {preferences.email_verified && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    <Check className="h-3 w-3 mr-1" />
                    {t('notifications.channels.verified')}
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
                <Label htmlFor="sms-channel">{t('notifications.channels.sms')}</Label>
                {preferences.phone_verified && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    <Check className="h-3 w-3 mr-1" />
                    {t('notifications.channels.verified')}
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
                <Label htmlFor="whatsapp-channel">{t('notifications.channels.whatsapp')}</Label>
                {preferences.whatsapp_verified && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    <Check className="h-3 w-3 mr-1" />
                    {t('notifications.channels.verified')}
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
        <h3 className="text-lg font-semibold mb-4">{t('notifications.types.title')}</h3>
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
                  <Label>{t(type.label)}</Label>
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
                    <span className="text-sm text-muted-foreground">{t('notifications.channels.email')}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefs.sms}
                      onChange={(e) => updateNotificationChannel(type.key, 'sms', e.target.checked)}
                      disabled={!preferences.sms_enabled}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-muted-foreground">{t('notifications.channels.sms')}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefs.whatsapp}
                      onChange={(e) => updateNotificationChannel(type.key, 'whatsapp', e.target.checked)}
                      disabled={!preferences.whatsapp_enabled}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-muted-foreground">{t('notifications.channels.whatsapp')}</span>
                  </label>
                </div>
                {type.key !== NOTIFICATION_TYPES[NOTIFICATION_TYPES.length - 1]?.key && (
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
          <h3 className="text-lg font-semibold">{t('notifications.doNotDisturb.title')}</h3>
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
              <Label htmlFor="dnd-start">{t('notifications.doNotDisturb.from')}</Label>
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
              <Label htmlFor="dnd-end">{t('notifications.doNotDisturb.until')}</Label>
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
        <h3 className="text-lg font-semibold mb-4">{t('notifications.summaries.title')}</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="daily-digest">{t('notifications.summaries.dailyDigest')}</Label>
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
              <Label htmlFor="digest-time">{t('notifications.summaries.sendTime')}</Label>
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
            <Label htmlFor="weekly-summary">{t('notifications.summaries.weeklyDigest')}</Label>
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
              <Label htmlFor="summary-day">{t('notifications.summaries.sendDay')}</Label>
              <select
                id="summary-day"
                value={preferences.weekly_summary_day}
                onChange={(e) =>
                  setPreferences({ ...preferences, weekly_summary_day: Number.parseInt(e.target.value) })
                }
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
              >
                {DAYS_KEYS.map((dayKey, index) => (
                  <option key={dayKey} value={index}>
                    {t(dayKey)}
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
          {saving ? t('common.actions.saving') : t('common.actions.save')}
        </Button>
      </div>
    </div>
  )
}
