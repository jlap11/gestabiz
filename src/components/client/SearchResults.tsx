import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { X, Briefcase, Building2, Tag, User } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useSearchLogic } from '@/hooks/useSearchLogic'
import { sortSearchResults } from '@/lib/searchUtils'
import { SearchResultCard } from './SearchResultCard'
import { SearchFilters, type SortOption } from './SearchFilters'
import { SearchLoadingState } from './SearchLoadingState'
import type { SearchType } from './SearchBar'

export interface SearchResultItem {
  id: string
  type: SearchType
  name: string
  description?: string
  imageUrl?: string
  price?: number
  rating?: number
  reviewCount?: number
  category?: string
  business?: {
    id: string
    name: string
    description?: string
    imageUrl?: string
  }
  location?: {
    city: string
    address: string
    latitude: number
    longitude: number
  }
  distance?: number
  createdAt?: string
}

interface SearchResultsProps {
  searchTerm: string
  searchType: SearchType
  userLocation?: { latitude: number; longitude: number }
  onClose: () => void
  onResultClick: (result: SearchResultItem) => void
}

export const SearchResults = React.memo(function SearchResults({
  searchTerm,
  searchType,
  userLocation,
  onClose,
  onResultClick,
}: Readonly<SearchResultsProps>) {
  const { t } = useLanguage()
  const [sortBy, setSortBy] = useState<SortOption>('balanced')
  const [showFilters, setShowFilters] = useState(false)

  const { results, loading } = useSearchLogic({
    searchTerm,
    searchType,
    userLocation: userLocation ? { lat: userLocation.latitude, lng: userLocation.longitude } : null,
  })

  const sortedResults = useMemo(() => {
    return sortSearchResults(results, sortBy)
  }, [results, sortBy])

  const getTypeIcon = (type: SearchType) => {
    switch (type) {
      case 'services':
        return Briefcase
      case 'businesses':
        return Building2
      case 'categories':
        return Tag
      case 'users':
        return User
      default:
        return Building2
    }
  }

  const getTypeLabel = (type: SearchType) => {
    switch (type) {
      case 'services':
        return t('search.resultsPage.typeLabels.service')
      case 'businesses':
        return t('search.resultsPage.typeLabels.business')
      case 'categories':
        return t('search.resultsPage.typeLabels.category')
      case 'users':
        return t('search.resultsPage.typeLabels.user')
      default:
        return type
    }
  }

  const getTypeLabelPlural = (type: SearchType) => {
    switch (type) {
      case 'services':
        return t('search.resultsPage.typeLabelsPlural.service')
      case 'businesses':
        return t('search.resultsPage.typeLabelsPlural.business')
      case 'categories':
        return t('search.resultsPage.typeLabelsPlural.category')
      case 'users':
        return t('search.resultsPage.typeLabelsPlural.user')
      default:
        return `${getTypeLabel(type)}s`
    }
  }

  if (loading) {
    return (
      <SearchLoadingState 
        searchTerm={searchTerm} 
        searchType={searchType} 
      />
    )
  }

  return (
    <div 
      className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 overflow-y-auto touch-pan-y" 
      role="dialog" 
      aria-modal="true" 
      aria-label={t('search.resultsPage.title')}
    >
      <div className="min-h-screen py-2 sm:py-4 lg:py-8 px-2 sm:px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header - Mobile Responsive */}
          <div className="flex items-start justify-between gap-2 sm:gap-3 mb-3 sm:mb-4 lg:mb-6 sticky top-0 bg-background/95 backdrop-blur-sm py-2 sm:py-3 z-10">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-foreground mb-1 truncate">
                {t('search.resultsPage.title')}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                <span className="font-semibold">{sortedResults.length}</span>{' '}
                {t(
                  sortedResults.length === 1
                    ? 'search.resultsPage.resultsFor'
                    : 'search.resultsPage.resultsForPlural'
                )}{' '}
                "<span className="font-semibold text-foreground truncate inline-block max-w-[120px] sm:max-w-[200px] lg:max-w-none align-bottom">
                  {searchTerm}
                </span>" {t('search.resultsPage.in')} {getTypeLabelPlural(searchType)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-9 w-9 sm:h-10 sm:w-10 lg:h-12 lg:w-12 flex-shrink-0 min-w-[44px] min-h-[44px] touch-manipulation"
              aria-label={t('common.actions.close')}
              title={t('common.actions.close')}
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" aria-hidden="true" />
            </Button>
          </div>

          {/* Toolbar - Mobile Optimized */}
          <SearchFilters
            sortBy={sortBy}
            onSortChange={setSortBy}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
            userLocation={userLocation}
          />

          {/* Results Grid - Mobile Responsive */}
          {sortedResults.length === 0 ? (
            <Card className="mx-auto max-w-md">
              <CardContent className="py-8 sm:py-12 lg:py-16 px-4 text-center" role="status" aria-live="polite">
                <div className="mb-3 sm:mb-4">
                  {React.createElement(getTypeIcon(searchType), {
                    className: 'h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 mx-auto text-muted-foreground opacity-50',
                    'aria-hidden': true,
                  })}
                </div>
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-foreground mb-2">
                  {t('search.resultsPage.noResultsTitle')}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t('search.resultsPage.noResultsDescription')}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5" 
              role="list" 
              aria-label={t('search.resultsPage.listLabel')}
            >
              {sortedResults.map((result) => (
                <SearchResultCard
                  key={result.id}
                  result={result}
                  onResultClick={onResultClick}
                />
              ))}
            </div>
          )}

          {/* Scroll to top button for mobile */}
          {sortedResults.length > 6 && (
            <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-10">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-shadow touch-manipulation"
                aria-label={t('common.actions.scrollToTop')}
                title={t('common.actions.scrollToTop')}
              >
                <ArrowUpDown className="h-5 w-5 rotate-180" aria-hidden="true" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})