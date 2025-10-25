import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, Star, MapPin, Tag, Briefcase, User } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import type { SearchResultItem } from './SearchResults'
import type { SearchType } from './SearchBar'

interface SearchResultCardProps {
  result: SearchResultItem
  onResultClick: (result: SearchResultItem) => void
}

export const SearchResultCard: React.FC<SearchResultCardProps> = ({
  result,
  onResultClick,
}) => {
  const { t } = useLanguage()

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

  const TypeIcon = getTypeIcon(result.type)

  return (
    <Card
      className="hover:shadow-lg focus-within:shadow-lg transition-all cursor-pointer group hover:scale-[1.02] focus-within:scale-[1.02] touch-manipulation"
      onClick={() => onResultClick(result)}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onResultClick(result)
        }
      }}
      aria-label={`${t('search.resultsPage.openResult')} ${result.name}`}
      title={`${t('search.resultsPage.openResult')} ${result.name}`}
      aria-describedby={`result-${result.id}-description`}
    >
      <CardContent className="p-3 sm:p-4 lg:p-5">
        {/* Image or Icon - Mobile Optimized */}
        {result.imageUrl ? (
          <div className="w-full h-28 sm:h-32 lg:h-40 rounded-lg overflow-hidden mb-3 sm:mb-4 bg-muted">
            <img
              src={result.imageUrl}
              alt={`${result.name} - ${getTypeLabel(result.type)}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="w-full h-28 sm:h-32 lg:h-40 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mb-3 sm:mb-4 group-hover:from-primary/20 group-hover:to-secondary/20 transition-colors">
            <TypeIcon className="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 text-primary/40 group-hover:text-primary/60 transition-colors" aria-hidden="true" />
          </div>
        )}

        {/* Content - Mobile Compact */}
        <div className="space-y-2 sm:space-y-2.5 lg:space-y-3">
          {/* Type Badge */}
          <Badge variant="secondary" className="text-[10px] sm:text-xs font-medium">
            {getTypeLabel(result.type)}
          </Badge>

          {/* Name */}
          <h3 className="font-bold text-sm sm:text-base lg:text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
            {result.name}
          </h3>

          {/* Description */}
          {result.description && (
            <p 
              id={`result-${result.id}-description`}
              className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed"
            >
              {result.description}
            </p>
          )}

          {/* Business (for services/users) */}
          {result.business && (
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" aria-hidden="true" />
              <span className="truncate" title={result.business.name}>{result.business.name}</span>
            </div>
          )}

          {/* Rating */}
          {result.rating !== undefined && (
            <div className="flex items-center gap-2" aria-label={`${t('search.resultsPage.ratingLabel')}: ${result.rating.toFixed(1)} de 5`}>
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" aria-hidden="true" />
                <span className="font-semibold text-foreground text-sm sm:text-base">
                  {result.rating.toFixed(1)}
                </span>
              </div>
              {result.reviewCount !== undefined && result.reviewCount > 0 && (
                <span className="text-xs sm:text-sm text-muted-foreground">
                  ({result.reviewCount}{' '}
                  {t(
                    result.reviewCount === 1
                      ? 'reviews.review'
                      : 'reviews.reviewsPlural'
                  )}
                  )
                </span>
              )}
            </div>
          )}

          {/* Distance */}
          {result.distance !== undefined && (
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" aria-hidden="true" />
              <span>{result.distance.toFixed(1)} {t('search.resultsPage.distanceUnit')}</span>
            </div>
          )}

          {/* Location */}
          {result.location?.city && (
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
              <span aria-hidden="true">📍</span> 
              <span className="truncate" title={result.location.city}>{result.location.city}</span>
            </div>
          )}

          {/* Price (for services) */}
          {result.price !== undefined && (
            <div className="pt-2 border-t border-border">
              <span className="text-sm sm:text-base lg:text-lg font-bold text-primary">
                {t('common.currencySymbol')}
                {result.price.toLocaleString('es-CO', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}{' '}
                <span className="text-xs sm:text-sm font-normal">{t('search.resultsPage.currency')}</span>
              </span>
            </div>
          )}

          {/* Category */}
          {result.category && (
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
              <Tag className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
              <span className="truncate" title={result.category}>{result.category}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}