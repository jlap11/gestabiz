import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Clock } from '@phosphor-icons/react'
import { useLanguage } from '@/contexts/LanguageContext'
import type { Business } from '@/types'

interface BusinessHoursFormProps {
  business: Business
  onUpdate: (updates: Partial<Business>) => void
}

const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
] as const

export function BusinessHoursForm({ business, onUpdate }: BusinessHoursFormProps) {
  const { t } = useLanguage()

  const handleHourChange = (day: string, field: 'open_time' | 'close_time', value: string) => {
    const updatedHours = {
      ...business.business_hours,
      [day]: {
        ...business.business_hours[day],
        [field]: value
      }
    }
    onUpdate({ business_hours: updatedHours })
  }

  const handleIsOpenChange = (day: string, isOpen: boolean) => {
    const updatedHours = {
      ...business.business_hours,
      [day]: {
        ...business.business_hours[day],
        is_open: isOpen
      }
    }
    onUpdate({ business_hours: updatedHours })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Clock className="h-5 w-5 flex-shrink-0" />
          <span className="truncate">
            {t('business.management.business_hours')}
          </span>
        </CardTitle>
        <CardDescription className="text-sm">
          {t('business.management.hours_description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Grid responsivo para los días de la semana */}
        <div className="grid grid-cols-1 gap-4">
          {DAYS_OF_WEEK.map(day => {
            const dayHours = business.business_hours[day]
            
            return (
              <div 
                key={day}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border rounded-lg bg-muted/30"
              >
                {/* Día y switch */}
                <div className="flex items-center justify-between sm:justify-start sm:w-32 flex-shrink-0">
                  <Label className="text-sm font-medium capitalize">
                    {t(`common.days.${day}`)}
                  </Label>
                  <Switch
                    checked={dayHours.is_open}
                    onCheckedChange={(checked) => handleIsOpenChange(day, checked)}
                    className="ml-2 sm:ml-0"
                  />
                </div>

                {/* Horarios */}
                {dayHours.is_open ? (
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-1">
                    <div className="flex items-center gap-2 flex-1">
                      <Label className="text-xs text-muted-foreground whitespace-nowrap">
                        {t('business.management.open_time')}
                      </Label>
                      <Input
                        type="time"
                        value={dayHours.open_time}
                        onChange={(e) => handleHourChange(day, 'open_time', e.target.value)}
                        className="flex-1 min-w-0"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2 flex-1">
                      <Label className="text-xs text-muted-foreground whitespace-nowrap">
                        {t('business.management.close_time')}
                      </Label>
                      <Input
                        type="time"
                        value={dayHours.close_time}
                        onChange={(e) => handleHourChange(day, 'close_time', e.target.value)}
                        className="flex-1 min-w-0"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center">
                    <span className="text-sm text-muted-foreground">
                      {t('business.management.closed')}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Nota informativa */}
        <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
            <strong>{t('common.note')}:</strong> {t('business.management.hours_note')}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}