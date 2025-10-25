import React from 'react'
import { Card } from '@/components/ui/card'
import { BusinessSelector } from './BusinessSelector'
import { LocationSelector } from './LocationSelector'
import { DateRangeSelector } from './DateRangeSelector'
import { QuickDateFilters } from './QuickDateFilters'

interface Business {
  id: string
  name: string
}

interface Location {
  id: string
  name: string
}

interface DateRange {
  start: string
  end: string
}

interface FinancialFiltersPanelProps {
  selectedBusiness: string
  selectedLocation: string
  dateRange: DateRange
  businesses: Business[]
  locations: Location[]
  onBusinessChange: (value: string) => void
  onLocationChange: (value: string) => void
  onDateRangeChange: (dateRange: DateRange) => void
  onQuickDateRange: (range: 'week' | 'month' | 'quarter' | 'year') => void
}

export function FinancialFiltersPanel({
  selectedBusiness,
  selectedLocation,
  dateRange,
  businesses,
  locations,
  onBusinessChange,
  onLocationChange,
  onDateRangeChange,
  onQuickDateRange,
}: FinancialFiltersPanelProps) {
  return (
    <Card className="p-4">
      <div className="flex flex-col md:flex-row gap-4">
        <BusinessSelector
          value={selectedBusiness}
          businesses={businesses}
          onChange={onBusinessChange}
        />

        <LocationSelector
          value={selectedLocation}
          locations={locations}
          onChange={onLocationChange}
          show={selectedBusiness && selectedBusiness !== 'all'}
        />

        <DateRangeSelector
          value={dateRange}
          onChange={onDateRangeChange}
        />

        <QuickDateFilters
          onQuickDateRange={onQuickDateRange}
        />
      </div>
    </Card>
  )
}