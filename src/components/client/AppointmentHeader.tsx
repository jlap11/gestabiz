import React from 'react'
import { Calendar, List, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'

interface AppointmentHeaderProps {
  viewMode: 'list' | 'calendar'
  onViewModeChange: (mode: 'list' | 'calendar') => void
  onNewAppointment: () => void
}

export function AppointmentHeader({
  viewMode,
  onViewModeChange,
  onNewAppointment,
}: AppointmentHeaderProps) {
  const { t } = useLanguage()

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-2">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">
          {t('clientDashboard.myAppointments')}
        </h2>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        {/* View Mode Toggle */}
        <div className="flex items-center bg-muted rounded-lg p-1 flex-1 sm:flex-none">
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            className="flex items-center gap-2 min-h-[36px] flex-1 sm:flex-none"
            aria-label={t('clientDashboard.listView')}
            title={t('clientDashboard.listView')}
          >
            <List className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t('clientDashboard.listView')}</span>
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('calendar')}
            className="flex items-center gap-2 min-h-[36px] flex-1 sm:flex-none"
            aria-label={t('clientDashboard.calendarView')}
            title={t('clientDashboard.calendarView')}
          >
            <Calendar className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t('clientDashboard.calendarView')}</span>
          </Button>
        </div>

        {/* New Appointment Button */}
        <Button
          onClick={onNewAppointment}
          className="flex items-center gap-2 min-h-[36px] whitespace-nowrap"
          aria-label={t('clientDashboard.newAppointment')}
          title={t('clientDashboard.newAppointment')}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">{t('clientDashboard.newAppointment')}</span>
          <span className="sm:hidden">{t('clientDashboard.new')}</span>
        </Button>
      </div>
    </div>
  )
}