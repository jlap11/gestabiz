import React from 'react'
import { Clock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/contexts/LanguageContext'

export interface DaySchedule {
  open: string
  close: string
  closed: boolean
}

export interface BusinessHours {
  monday: DaySchedule
  tuesday: DaySchedule
  wednesday: DaySchedule
  thursday: DaySchedule
  friday: DaySchedule
  saturday: DaySchedule
  sunday: DaySchedule
}

interface BusinessHoursPickerProps {
  value?: BusinessHours
  onChange: (hours: BusinessHours) => void
  className?: string
}

const DEFAULT_HOURS: BusinessHours = {
  monday: { open: '09:00', close: '18:00', closed: false },
  tuesday: { open: '09:00', close: '18:00', closed: false },
  wednesday: { open: '09:00', close: '18:00', closed: false },
  thursday: { open: '09:00', close: '18:00', closed: false },
  friday: { open: '09:00', close: '18:00', closed: false },
  saturday: { open: '09:00', close: '14:00', closed: false },
  sunday: { open: '09:00', close: '14:00', closed: true },
}

const DAYS: Array<{ key: keyof BusinessHours; label: string; short: string }> = [
  { key: 'monday', label: 'monday', short: 'L' },
  { key: 'tuesday', label: 'tuesday', short: 'M' },
  { key: 'wednesday', label: 'wednesday', short: 'X' },
  { key: 'thursday', label: 'thursday', short: 'J' },
  { key: 'friday', label: 'friday', short: 'V' },
  { key: 'saturday', label: 'saturday', short: 'S' },
  { key: 'sunday', label: 'sunday', short: 'D' },
]

export function BusinessHoursPicker({ value, onChange, className }: BusinessHoursPickerProps) {
  const currentValue = value || DEFAULT_HOURS
  const { t } = useLanguage()

  const handleDayChange = (
    day: keyof BusinessHours,
    field: keyof DaySchedule,
    newValue: string | boolean
  ) => {
    onChange({
      ...currentValue,
      [day]: {
        ...currentValue[day],
        [field]: newValue,
      },
    })
  }

  const handleCopyToAll = (sourceDay: keyof BusinessHours) => {
    const sourceSchedule = currentValue[sourceDay]
    const newHours: BusinessHours = {} as BusinessHours

    DAYS.forEach(day => {
      newHours[day.key] = { ...sourceSchedule }
    })

    onChange(newHours)
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-medium text-foreground">{t('businessHours.title')}</h3>
      </div>

      <div className="space-y-3">
        {DAYS.map(day => {
          const schedule = currentValue[day.key]
          const isClosed = schedule.closed

          return (
            <div
              key={day.key}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 p-4 rounded-lg bg-card border border-border mb-2"
            >
              {/* Day name */}
              <div className="flex items-center gap-2 min-w-[100px]">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">
                  {day.short}
                </div>
                <span className="text-sm font-medium text-foreground">
                  {t(`businessHours.days.${day.label}`)}
                </span>
              </div>

              {/* Time inputs or "Cerrado" */}
              {!isClosed ? (
                <div className="flex items-center gap-4 flex-1 w-full sm:w-auto py-1">
                  <Input
                    type="time"
                    value={schedule.open}
                    onChange={e => handleDayChange(day.key, 'open', e.target.value)}
                    className="flex-1 sm:w-28 bg-background border-border mb-1"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    type="time"
                    value={schedule.close}
                    onChange={e => handleDayChange(day.key, 'close', e.target.value)}
                    className="flex-1 sm:w-28 bg-background border-border mb-1"
                  />

                  {/* Copy to all button */}
                  <button
                    type="button"
                    onClick={() => handleCopyToAll(day.key)}
                    className="hidden sm:block text-xs text-primary hover:text-primary/80 whitespace-nowrap ml-3"
                    title={t('businessHours.copyToAllTitle')}
                  >
                    {t('businessHours.copyToAll')}
                  </button>
                </div>
              ) : (
                <div className="flex-1 text-sm text-muted-foreground">
                  {t('businessHours.closed')}
                </div>
              )}

              {/* Closed checkbox */}
              <div className="flex items-center gap-2 ml-auto sm:ml-0">
                <Checkbox
                  id={`closed-${day.key}`}
                  checked={isClosed}
                  onCheckedChange={checked => handleDayChange(day.key, 'closed', checked === true)}
                />
                <Label
                  htmlFor={`closed-${day.key}`}
                  className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap"
                >
                  {t('businessHours.closed')}
                </Label>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick presets */}
      <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
        <p className="text-xs text-muted-foreground mb-2">{t('businessHours.presetsTitle')}</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              const weekdaySchedule: DaySchedule = { open: '09:00', close: '18:00', closed: false }
              onChange({
                monday: weekdaySchedule,
                tuesday: weekdaySchedule,
                wednesday: weekdaySchedule,
                thursday: weekdaySchedule,
                friday: weekdaySchedule,
                saturday: { open: '09:00', close: '14:00', closed: false },
                sunday: { open: '00:00', close: '00:00', closed: true },
              })
            }}
            className="px-3 py-1.5 text-xs rounded-md bg-card hover:bg-muted text-foreground border border-border transition-colors"
          >
            {t('businessHours.presets.lunFriSat')}
          </button>
          <button
            type="button"
            onClick={() => {
              const allDaySchedule: DaySchedule = { open: '09:00', close: '18:00', closed: false }
              onChange({
                monday: allDaySchedule,
                tuesday: allDaySchedule,
                wednesday: allDaySchedule,
                thursday: allDaySchedule,
                friday: allDaySchedule,
                saturday: allDaySchedule,
                sunday: { open: '00:00', close: '00:00', closed: true },
              })
            }}
            className="px-3 py-1.5 text-xs rounded-md bg-card hover:bg-muted text-foreground border border-border transition-colors"
          >
            {t('businessHours.presets.lunSat')}
          </button>
          <button
            type="button"
            onClick={() => {
              const schedule: DaySchedule = { open: '10:00', close: '20:00', closed: false }
              onChange({
                monday: schedule,
                tuesday: schedule,
                wednesday: { open: '00:00', close: '00:00', closed: true },
                thursday: schedule,
                friday: schedule,
                saturday: schedule,
                sunday: schedule,
              })
            }}
            className="px-3 py-1.5 text-xs rounded-md bg-card hover:bg-muted text-foreground border border-border transition-colors"
          >
            {t('businessHours.presets.lunDom')}
          </button>
        </div>
      </div>
    </div>
  )
}
