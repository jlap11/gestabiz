import React from 'react'
import { Calendar, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useLanguage } from '@/contexts/LanguageContext'

interface EmptyAppointmentsStateProps {
  onNewAppointment: () => void
}

export function EmptyAppointmentsState({ onNewAppointment }: EmptyAppointmentsStateProps) {
  const { t } = useLanguage()

  return (
    <Card className="p-8 text-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
          <Calendar className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            {t('clientDashboard.noAppointments')}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            {t('clientDashboard.noAppointmentsDescription')}
          </p>
        </div>
        <Button
          onClick={onNewAppointment}
          className="flex items-center gap-2 mt-4"
          aria-label={t('clientDashboard.scheduleFirstAppointment')}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t('clientDashboard.scheduleFirstAppointment')}
        </Button>
      </div>
    </Card>
  )
}