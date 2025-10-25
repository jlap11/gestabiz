import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useLanguage } from '@/contexts/LanguageContext'

interface BusinessHours {
  open: string
  close: string
  closed: boolean
}

interface BusinessHoursSectionProps {
  businessHours: Record<string, BusinessHours>
  onBusinessHoursChange: (day: string, field: string, value: string | boolean) => void
}

export function BusinessHoursSection({ 
  businessHours, 
  onBusinessHoursChange 
}: BusinessHoursSectionProps) {
  const { t } = useLanguage()

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <span className="h-5 w-5" aria-hidden="true">⏰</span>
        {t('business.registration.business_hours')}
      </h3>
      <div className="space-y-3" role="group" aria-labelledby="business-hours-title">
        {Object.entries(businessHours).map(([day, hours]) => (
          <div key={day} className="flex items-center gap-4 p-3 border rounded-lg">
            <div className="w-24">
              <Label className="font-medium">
                {t(`business.registration.days.${day}`)}
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!hours.closed}
                onChange={e =>
                  onBusinessHoursChange(day, 'closed', !e.target.checked)
                }
                className="rounded min-h-[44px] min-w-[44px]"
                aria-label={`${t('business.registration.open')} ${t(`business.registration.days.${day}`)}`}
              />
              <Label className="text-sm">{t('business.registration.open')}</Label>
            </div>
            {!hours.closed && (
              <>
                <Input
                  type="time"
                  value={hours.open}
                  onChange={e => onBusinessHoursChange(day, 'open', e.target.value)}
                  className="w-32"
                  aria-label={`Hora de apertura ${t(`business.registration.days.${day}`)}`}
                />
                <span aria-hidden="true">-</span>
                <Input
                  type="time"
                  value={hours.close}
                  onChange={e => onBusinessHoursChange(day, 'close', e.target.value)}
                  className="w-32"
                  aria-label={`Hora de cierre ${t(`business.registration.days.${day}`)}`}
                />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}