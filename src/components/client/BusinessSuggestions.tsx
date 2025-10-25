import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, MapPin, Star, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

interface SimpleBusiness {
  id: string
  name: string
  logo_url: string | null
  average_rating: number
  category_name?: string
  review_count?: number
  city?: string
}

interface BusinessSuggestionsProps {
  userId: string
  preferredCityName: string | null
  preferredRegionName: string | null
  onBusinessSelect?: (businessId: string) => void
}

const ITEMS_PER_PAGE = 10

export function BusinessSuggestions({
  userId,
  preferredCityName,
  preferredRegionName,
  onBusinessSelect,
}: Readonly<BusinessSuggestionsProps>) {
  const { t } = useLanguage()
  const [favoriteBusiness, setFavoriteBusiness] = useState<SimpleBusiness | null>(null)
  const [allSuggestedBusinesses, setAllSuggestedBusinesses] = useState<SimpleBusiness[]>([])
  const [displayedBusinesses, setDisplayedBusinesses] = useState<SimpleBusiness[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)

  const loadFavoriteBusiness = async (userId: string) => {
    // Get completed appointments
    const { data: completed } = await supabase
      .from('appointments')
      .select('id, business_id')
      .eq('client_id', userId)
      .eq('status', 'completed')

    if (!completed || completed.length === 0) return null

    const appointmentIds = completed.map(apt => apt.id)
    const { data: reviews } = await supabase
      .from('reviews')
      .select('business_id')
      .in('appointment_id', appointmentIds)
      .gte('rating', 4)

    if (!reviews || reviews.length === 0) return null

    // Count reviews per business
    const counts = new Map<string, number>()
    for (const r of reviews) {
      counts.set(r.business_id, (counts.get(r.business_id) || 0) + 1)
    }

    // Pick random favorite business
    const bizIds = Array.from(counts.keys())
    const randomId = bizIds[Math.floor(Math.random() * bizIds.length)]

    // Get business details
    const { data: biz } = await supabase
      .from('businesses')
      .select('id, name, logo_url, average_rating')
      .eq('id', randomId)
      .single()

    if (!biz) return null

    return {
      id: biz.id,
      name: biz.name,
      logo_url: biz.logo_url,
      average_rating: biz.average_rating,
      review_count: counts.get(randomId),
    }
  }

  const loadSuggestedBusinesses = async (
    cityName: string | null,
    regionName: string | null,
    excludeId: string | null
  ) => {
    if (!cityName && !regionName) return []

    const query = supabase.from('locations').select('city, state, business_id')

    let filtered = query

    // Normalize city/region name by removing accents and special chars
    const normalize = (str: string) => {
      return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[,.]/g, '')
        .trim()
        .toLowerCase()
    }

    // Handle special cases and normalize search
    if (!cityName && regionName) {
      // If only region is provided (e.g., "BOGOTÃ, D.C." or "Bogotá D.C.")
      const normalizedRegion = normalize(regionName)
      if (normalizedRegion.includes('bogota')) {
        filtered = filtered.ilike('city', '%Bogot%') // Search by city instead
      } else {
        filtered = filtered.ilike('state', `%${regionName.split(',')[0].trim()}%`)
      }
    } else if (cityName) {
      // If city is provided, search by normalized city name
      const normalizedCity = normalize(cityName)
      if (normalizedCity.includes('bogota')) {
        filtered = filtered.ilike('city', '%Bogot%')
      } else {
        filtered = filtered.ilike('city', `%${cityName}%`)
      }
    }

    const { data: locations } = await filtered

    if (!locations || locations.length === 0) return []

    // Get unique business IDs
    const uniqueIds = Array.from(
      new Set(locations.map(l => l.business_id).filter(id => id !== excludeId))
    )

    if (uniqueIds.length === 0) return []

    // Fetch ALL businesses, not just first 10
    const { data: businesses } = await supabase
      .from('businesses')
      .select('id, name, logo_url, average_rating')
      .in('id', uniqueIds)

    if (!businesses) return []

    // Deduplicate by business ID (in case a business has multiple locations)
    const uniqueBusinesses = Array.from(new Map(businesses.map(b => [b.id, b])).values())

    return uniqueBusinesses.map(b => ({
      id: b.id,
      name: b.name,
      logo_url: b.logo_url,
      average_rating: b.average_rating,
      city: cityName || regionName || undefined,
    }))
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const favorite = await loadFavoriteBusiness(userId)
        setFavoriteBusiness(favorite)

        const suggested = await loadSuggestedBusinesses(
          preferredCityName,
          preferredRegionName,
          favorite?.id || null
        )

        // Filter out duplicate (favorite business if it appears in suggestions)
        const filtered = suggested.filter(s => s.id !== favorite?.id)

        setAllSuggestedBusinesses(filtered)
        setCurrentPage(0)
        // Show first 10
        setDisplayedBusinesses(filtered.slice(0, ITEMS_PER_PAGE))
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [userId, preferredCityName, preferredRegionName])

  const handleLoadMore = () => {
    const nextPage = currentPage + 1
    const startIndex = nextPage * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE

    setCurrentPage(nextPage)
    setDisplayedBusinesses([
      ...displayedBusinesses,
      ...allSuggestedBusinesses.slice(startIndex, endIndex),
    ])
  }

  const hasMoreBusinesses = (currentPage + 1) * ITEMS_PER_PAGE < allSuggestedBusinesses.length

  const renderBusinessCard = (business: SimpleBusiness, isFavorite: boolean = false) => (
    <Card
      key={business.id}
      className={cn(
        'cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        'touch-manipulation select-none',
        isFavorite && 'border-primary border-2'
      )}
      onClick={() => onBusinessSelect?.(business.id)}
      role="button"
      tabIndex={0}
      aria-label={t('businessSuggestions.openBusiness', { name: business.name })}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onBusinessSelect?.(business.id)
        }
      }}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="space-y-3">
          {/* Logo y nombre */}
          <div className="flex items-start gap-3">
            {business.logo_url ? (
              <img
                src={business.logo_url}
                alt={business.name}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover border-2 border-border flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/20 flex items-center justify-center border-2 border-primary/30 flex-shrink-0">
                <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" aria-hidden="true" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground truncate text-sm sm:text-base leading-tight">
                {business.name}
              </h4>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" aria-hidden="true" />
              <span className="text-sm font-semibold text-foreground">
                {business.average_rating.toFixed(1)}
              </span>
            </div>
            {business.review_count && business.review_count > 0 && (
              <span className="text-xs text-muted-foreground">({business.review_count})</span>
            )}
          </div>

          {business.city && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">{business.city}</span>
            </div>
          )}

          {isFavorite && (
            <Badge variant="default" className="w-full justify-center text-xs sm:text-sm py-1">
              {t('businessSuggestions.favoriteBadge')}
            </Badge>
          )}

          <Button
            variant={isFavorite ? 'default' : 'outline'}
            className="w-full min-h-[44px] min-w-[44px] text-sm sm:text-base touch-manipulation"
            onClick={e => {
              e.stopPropagation()
              onBusinessSelect?.(business.id)
            }}
            aria-label={isFavorite ? t('businessSuggestions.bookAgain') : t('businessSuggestions.bookNow')}
            title={isFavorite ? t('businessSuggestions.bookAgain') : t('businessSuggestions.bookNow')}
          >
            {isFavorite ? t('businessSuggestions.bookAgain') : t('businessSuggestions.bookNow')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="space-y-4 px-2 sm:px-0">
        <Card
          className="w-full max-w-none sm:max-w-[95vw] max-h-[90vh] overflow-auto"
          role="dialog"
          aria-modal="true"
          aria-label={t('businessSuggestions.loadingAria')}
        >
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2" id="loading-title">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">{t('businessSuggestions.title')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="flex flex-col items-center justify-center py-8 space-y-3"
              role="status"
              aria-live="polite"
              aria-label={t('businessSuggestions.loadingAria')}
            >
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" aria-hidden="true"></div>
              <span className="text-sm text-muted-foreground">{t('businessSuggestions.loadingScreen')}</span>
              <span className="sr-only">{t('businessSuggestions.loadingAria')}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!favoriteBusiness && displayedBusinesses.length === 0) {
    return null // No mostrar nada si no hay sugerencias
  }

  return (
    <div className="space-y-4 px-2 sm:px-0">
      <Card className="w-full max-w-none sm:max-w-[95vw] max-h-[90vh] overflow-auto">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2" id="business-suggestions-title">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" aria-hidden="true" />
            <span className="truncate">{t('businessSuggestions.title')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6" role="region" aria-labelledby="business-suggestions-title">
          {favoriteBusiness && (
            <section className="space-y-3" aria-labelledby="favorite-section-title">
              <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide" id="favorite-section-title">
                {t('businessSuggestions.basedOnReviews')}
              </h3>
              <div role="list" aria-label={t('businessSuggestions.favoriteListAria')}>
                <div role="listitem">{renderBusinessCard(favoriteBusiness, true)}</div>
              </div>
            </section>
          )}

          {displayedBusinesses.length > 0 && (
            <section className="space-y-3" aria-labelledby="suggestions-section-title">
              <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide" id="suggestions-section-title">
                <span className="block sm:inline">{t('businessSuggestions.inCity')}</span>{' '}
                <span className="block sm:inline font-normal">{preferredCityName || preferredRegionName}</span>
              </h3>
              <div className="space-y-3" role="list" aria-label={t('businessSuggestions.suggestedListAria')}>
                {displayedBusinesses.map(business => (
                  <div key={business.id} role="listitem">{renderBusinessCard(business, false)}</div>
                ))}
              </div>
              {hasMoreBusinesses && (
                <Button
                  variant="outline"
                  className="w-full mt-4 min-h-[44px] min-w-[44px] text-sm sm:text-base touch-manipulation"
                  onClick={handleLoadMore}
                  aria-label={t('businessSuggestions.viewMore')}
                  title={t('businessSuggestions.viewMore')}
                >
                  {t('businessSuggestions.viewMore')}
                </Button>
              )}
            </section>
          )}
        </CardContent>
      </Card>
    </div>
  )
}