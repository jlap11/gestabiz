import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Gear } from '@phosphor-icons/react'
import { useLanguage } from '@/contexts/LanguageContext'
import type { Business } from '@/types'

interface BusinessSettingsFormProps {
  business: Business
  onUpdate: (updates: Partial<Business>) => void
}

export function BusinessSettingsForm({ business, onUpdate }: BusinessSettingsFormProps) {
  const { t } = useLanguage()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Gear className="h-5 w-5 flex-shrink-0" />
          <span className="truncate">
            {t('business.management.appointment_settings')}
          </span>
        </CardTitle>
        <CardDescription className="text-sm">
          {t('business.management.settings_description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Grid responsivo para configuraciones principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuración de reservas */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-foreground">
              {t('business.management.booking_settings')}
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="booking-advance" className="text-sm font-medium">
                {t('business.management.booking_advance_days')}
              </Label>
              <Input
                id="booking-advance"
                type="number"
                min="1"
                max="365"
                value={business.booking_advance_days}
                onChange={e => onUpdate({ booking_advance_days: parseInt(e.target.value) || 30 })}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                {t('business.management.booking_advance_help')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="min-booking-time" className="text-sm font-medium">
                {t('business.management.min_booking_time')}
              </Label>
              <Input
                id="min-booking-time"
                type="number"
                min="0"
                max="1440"
                value={business.min_booking_time}
                onChange={e => onUpdate({ min_booking_time: parseInt(e.target.value) || 60 })}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                {t('business.management.min_booking_time_help')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-booking-time" className="text-sm font-medium">
                {t('business.management.max_booking_time')}
              </Label>
              <Input
                id="max-booking-time"
                type="number"
                min="0"
                max="1440"
                value={business.max_booking_time}
                onChange={e => onUpdate({ max_booking_time: parseInt(e.target.value) || 480 })}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                {t('business.management.max_booking_time_help')}
              </p>
            </div>
          </div>

          {/* Configuración de cancelaciones */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-foreground">
              {t('business.management.cancellation_settings')}
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="cancellation-hours" className="text-sm font-medium">
                {t('business.management.cancellation_hours')}
              </Label>
              <Input
                id="cancellation-hours"
                type="number"
                min="0"
                max="168"
                value={business.cancellation_hours}
                onChange={e => onUpdate({ cancellation_hours: parseInt(e.target.value) || 24 })}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                {t('business.management.cancellation_hours_help')}
              </p>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-1 flex-1">
                <Label className="text-sm font-medium">
                  {t('business.management.auto_confirm')}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t('business.management.auto_confirm_help')}
                </p>
              </div>
              <Switch
                checked={business.auto_confirm_appointments}
                onCheckedChange={(checked) => onUpdate({ auto_confirm_appointments: checked })}
              />
            </div>
          </div>
        </div>

        {/* Políticas de negocio */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-foreground">
            {t('business.management.business_policies')}
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="booking-policy" className="text-sm font-medium">
                {t('business.management.booking_policy')}
              </Label>
              <Textarea
                id="booking-policy"
                value={business.booking_policy}
                onChange={e => onUpdate({ booking_policy: e.target.value })}
                placeholder={t('business.management.booking_policy_placeholder')}
                className="w-full min-h-[100px] resize-none"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cancellation-policy" className="text-sm font-medium">
                {t('business.management.cancellation_policy')}
              </Label>
              <Textarea
                id="cancellation-policy"
                value={business.cancellation_policy}
                onChange={e => onUpdate({ cancellation_policy: e.target.value })}
                placeholder={t('business.management.cancellation_policy_placeholder')}
                className="w-full min-h-[100px] resize-none"
                rows={4}
              />
            </div>
          </div>
        </div>

        {/* Nota informativa */}
        <div className="mt-6 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300">
            <strong>{t('common.important')}:</strong> {t('business.management.settings_note')}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}