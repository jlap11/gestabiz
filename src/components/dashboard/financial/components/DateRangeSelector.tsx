import React from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

interface DateRange {
  start: string
  end: string
}

interface DateRangeSelectorProps {
  value: DateRange
  onChange: (dateRange: DateRange) => void
}

export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  const { t } = useLanguage()

  return (
    <div className="flex-1">
      <label className="text-sm font-medium mb-2 block">{t('financial.dateRange')}</label>
      <div className="flex gap-2">
        <input
          type="date"
          value={value.start}
          onChange={e => onChange({ ...value, start: e.target.value })}
          className="flex-1 px-3 py-2 border rounded-md text-sm"
        />
        <span className="flex items-center text-muted-foreground">-</span>
        <input
          type="date"
          value={value.end}
          onChange={e => onChange({ ...value, end: e.target.value })}
          className="flex-1 px-3 py-2 border rounded-md text-sm"
        />
      </div>
    </div>
  )
}