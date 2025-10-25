import React from 'react'
import { Calendar, Search } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'

interface EmptyHistoryStateProps {
  readonly hasActiveFilters: boolean
  readonly onClearFilters: () => void
  readonly onNavigateToBooking?: () => void
}

export const EmptyHistoryState = React.memo(function EmptyHistoryState({
  hasActiveFilters,
  onClearFilters,
  onNavigateToBooking,
}: EmptyHistoryStateProps) {
  const { t } = useLanguage()

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          {hasActiveFilters ? (
            <Search className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          ) : (
            <Calendar className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          )}
        </div>

        <h3 className="text-lg font-semibold mb-2">
          {hasActiveFilters
            ? t('clientHistory.messages.noResults')
            : t('clientHistory.messages.noAppointments')}
        </h3>

        <p className="text-muted-foreground mb-6 max-w-md">
          {hasActiveFilters
            ? t('clientHistory.messages.noResultsDescription')
            : t('clientHistory.messages.noAppointmentsDescription')}
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={onClearFilters}
              className="min-h-[44px]"
              aria-label={t('common.actions.clearFilters')}
            >
              {t('common.actions.clearFilters')}
            </Button>
          )}

          {onNavigateToBooking && !hasActiveFilters && (
            <Button
              onClick={onNavigateToBooking}
              className="min-h-[44px]"
              aria-label={t('clientHistory.actions.bookAppointment')}
            >
              <Calendar className="h-4 w-4 mr-2" aria-hidden="true" />
              {t('clientHistory.actions.bookAppointment')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
})