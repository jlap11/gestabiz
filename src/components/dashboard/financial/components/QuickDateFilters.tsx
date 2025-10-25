import React from 'react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'

interface QuickDateFiltersProps {
  onQuickDateRange: (range: 'week' | 'month' | 'quarter' | 'year') => void
}

export function QuickDateFilters({ onQuickDateRange }: QuickDateFiltersProps) {
  const { t } = useLanguage()

  return (
    <div className="flex-1">
      <label className="text-sm font-medium mb-2 block">{t('financial.quickFilters')}</label>
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onQuickDateRange('week')}
          className="flex-1"
        >
          {t('financial.week')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onQuickDateRange('month')}
          className="flex-1"
        >
          {t('financial.month')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onQuickDateRange('quarter')}
          className="flex-1"
        >
          {t('financial.quarter')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onQuickDateRange('year')}
          className="flex-1"
        >
          {t('financial.year')}
        </Button>
      </div>
    </div>
  )
}