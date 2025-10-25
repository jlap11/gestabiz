import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addDays, format, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { useLanguage } from '@/contexts/LanguageContext'

interface CalendarHeaderProps {
  selectedDate: Date
  setSelectedDate: (date: Date) => void
}

export function CalendarHeader({ selectedDate, setSelectedDate }: CalendarHeaderProps) {
  const { t } = useLanguage()

  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <h1 id="appointments-calendar-title" className="text-xl sm:text-2xl font-bold text-foreground">
        {t('admin.appointmentCalendar.title')}
      </h1>

      <nav 
        className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4"
        aria-label="Navegación de fechas del calendario"
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedDate(subDays(selectedDate, 1))}
            className="p-2 hover:bg-muted rounded-md min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
            aria-label={t('calendar.previous')}
            title={t('calendar.previous')}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="text-center px-2">
            <div className="text-sm sm:text-lg font-semibold text-foreground">
              {format(selectedDate, 'EEEE', { locale: es })}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {format(selectedDate, 'dd MMMM yyyy', { locale: es })}
            </div>
          </div>

          <button
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            className="p-2 hover:bg-muted rounded-md min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
            aria-label={t('calendar.next')}
            title={t('calendar.next')}
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <button
          onClick={() => setSelectedDate(new Date())}
          className="px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors text-sm sm:text-base min-h-[44px]"
          aria-label={t('calendar.today')}
          title={t('calendar.today')}
        >
          {t('calendar.today')}
        </button>
      </nav>
    </header>
  )
}