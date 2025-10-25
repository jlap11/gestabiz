import React from 'react'
import { Calendar, Clock } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface AppointmentDateTimeProps {
  startTime: string
  endTime: string
  duration?: number
}

export function AppointmentDateTime({ startTime, endTime, duration }: AppointmentDateTimeProps) {
  const { t } = useLanguage()

  return (
    <section role="region" aria-labelledby="datetime-info">
      <h3 id="datetime-info" className="sr-only">{t('clientDashboard.dateTimeInfo')}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
            <Calendar className="h-4 w-4" aria-hidden="true" />
            {t('clientDashboard.dateLabel')}
          </h4>
          <p className="text-sm sm:text-base text-foreground">
            {new Date(startTime).toLocaleDateString('es', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
            <Clock className="h-4 w-4" aria-hidden="true" />
            {t('clientDashboard.timeLabel')}
          </h4>
          <p className="text-sm sm:text-base text-foreground">
            {new Date(startTime).toLocaleTimeString('es', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })}
            {' - '}
            {new Date(endTime).toLocaleTimeString('es', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })}
          </p>
          {duration && (
            <p className="text-xs text-muted-foreground mt-1">
              {t('clientDashboard.durationShort', { minutes: String(duration) })}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}