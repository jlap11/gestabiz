import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowUpDown, SlidersHorizontal, MapPin } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export type SortOption = 'relevance' | 'distance' | 'rating' | 'newest' | 'oldest' | 'balanced'

interface SearchFiltersProps {
  sortBy: SortOption
  setSortBy: (sortBy: SortOption) => void
  showFilters: boolean
  setShowFilters: (show: boolean) => void
  userLocation: { lat: number; lng: number } | null
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  sortBy,
  setSortBy,
  showFilters,
  setShowFilters,
  userLocation,
}) => {
  const { t } = useLanguage()

  const sortOptions = [
    { value: 'relevance' as const, label: t('search.filters.sortOptions.relevance') },
    { value: 'distance' as const, label: t('search.filters.sortOptions.distance') },
    { value: 'rating' as const, label: t('search.filters.sortOptions.rating') },
    { value: 'newest' as const, label: t('search.filters.sortOptions.newest') },
    { value: 'oldest' as const, label: t('search.filters.sortOptions.oldest') },
    { value: 'balanced' as const, label: t('search.filters.sortOptions.balanced') },
  ]

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4 lg:mb-6">
      <Select value={sortBy} onValueChange={v => setSortBy(v as SortOption)}>
        <SelectTrigger 
          className="w-full sm:w-[260px] lg:w-[280px] min-h-[44px] touch-manipulation" 
          aria-label={t('common.placeholders.sortBy')} 
          title={t('common.placeholders.sortBy')}
        >
          <ArrowUpDown className="h-4 w-4 mr-2 flex-shrink-0" aria-hidden="true" />
          <SelectValue placeholder={t('common.placeholders.sortBy')} />
        </SelectTrigger>
        <SelectContent className="max-w-[95vw] z-50">
          {sortOptions.map(option => (
            <SelectItem key={option.value} value={option.value} className="min-h-[44px] touch-manipulation">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        onClick={() => setShowFilters(!showFilters)}
        className="gap-2 min-h-[44px] min-w-[44px] w-full sm:w-auto touch-manipulation"
        aria-label={t('search.filters.filters')}
        title={t('search.filters.filters')}
        aria-pressed={showFilters}
        aria-expanded={showFilters}
      >
        <SlidersHorizontal className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
        <span className="hidden sm:inline">{t('search.filters.filters')}</span>
        <span className="sm:hidden">{t('search.filters.filter')}</span>
        {showFilters && (
          <Badge variant="secondary" className="ml-1 sm:ml-2 text-[10px] px-1.5 py-0.5">
            {t('search.filters.active')}
          </Badge>
        )}
      </Button>

      {!userLocation && (
        <div className="flex-1 text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5 sm:gap-2 p-2 sm:p-0 rounded-md bg-muted/50 sm:bg-transparent">
          <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">{t('search.filters.enableLocation')}</span>
          <span className="sm:hidden text-[11px]">{t('search.filters.enableLocationShort')}</span>
        </div>
      )}
    </div>
  )
}