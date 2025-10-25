import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowUpDown,
  Briefcase,
  Building2,
  Loader2,
  MapPin,
  SlidersHorizontal,
  Star,
  Tag,
  User,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLanguage } from '@/contexts/LanguageContext'
import { supabase } from '@/lib/supabase'
import type { SearchType } from './SearchBar'

interface SearchResultsProps {
  searchTerm: string
  searchType: SearchType
  userLocation?: { latitude: number; longitude: number }
  onResultClick: (result: SearchResultItem) => void
  onClose: () => void
}

interface SearchResultItem {
  id: string
  name: string
  type: SearchType
  description?: string
  rating?: number
  reviewCount?: number
  distance?: number
  createdAt?: string
  imageUrl?: string
  category?: string
  subcategory?: string
  location?: {
    address?: string
    city?: string
    latitude?: number
    longitude?: number
  }
  business?: {
    id: string
    name: string
  }
  price?: number
  currency?: string
}

type SortOption = 'relevance' | 'distance' | 'rating' | 'newest' | 'oldest' | 'balanced'

export const SearchResults = React.memo(function SearchResults({
  searchTerm,
  searchType,
  userLocation,
  onResultClick,
  onClose,
}: Readonly<SearchResultsProps>) {
  const { t } = useLanguage()
  const [results, setResults] = useState<SearchResultItem[]>([])
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('balanced')
  const [showFilters, setShowFilters] = useState(false)

  const sortOptions = [
    { value: 'relevance' as SortOption, label: t('search.sorting.relevance') },
    { value: 'balanced' as SortOption, label: t('search.sorting.balanced') },
    { value: 'distance' as SortOption, label: t('search.sorting.distance') },
    { value: 'rating' as SortOption, label: t('search.sorting.rating') },
    { value: 'newest' as SortOption, label: t('search.sorting.newest') },
    { value: 'oldest' as SortOption, label: t('search.sorting.oldest') },
  ]

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371 // Radius of Earth in kilometers
      const dLat = (lat2 - lat1) * (Math.PI / 180)
      const dLon = (lon2 - lon1) * (Math.PI / 180)

      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
          Math.cos(lat2 * (Math.PI / 180)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2)

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      return R * c // Distance in km
    },
    []
  )

  // Fetch results
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true)
      try {
        let data: SearchResultItem[] = []

        switch (searchType) {
          case 'services': {
            // Usar función RPC optimizada
            const { data: servicesData, error } = await supabase.rpc('search_services', {
              search_query: searchTerm,
              limit_count: 50,
              offset_count: 0,
            })

            if (error) throw error

            // Fetch business info and locations
            const businessIds =
              [...new Set(servicesData?.map((s: any) => s.business_id).filter(Boolean))] || []

            const { data: businessesData } = await supabase
              .from('businesses')
              .select(
                `
                id,
                name,
                locations (
                  address,
                  city,
                  latitude,
                  longitude
                )
              `
              )
              .in('id', businessIds)

            const businessesMap = (businessesData || []).reduce((acc: any, business: any) => {
              acc[business.id] = business
              return acc
            }, {})

            data = (servicesData || []).map((service: any) => {
              const business = businessesMap[service.business_id]
              const location = business?.locations?.[0]
              const distance =
                userLocation && location?.latitude && location?.longitude
                  ? calculateDistance(
                      userLocation.latitude,
                      userLocation.longitude,
                      location.latitude,
                      location.longitude
                    )
                  : undefined

              return {
                id: service.id,
                name: service.name,
                type: 'services' as SearchType,
                description: service.description,
                business: business
                  ? {
                      id: business.id,
                      name: business.name,
                    }
                  : undefined,
                price: service.price,
                currency: service.currency,
                distance,
                location: location
                  ? {
                      address: location.address,
                      city: location.city,
                      latitude: location.latitude,
                      longitude: location.longitude,
                    }
                  : undefined,
                createdAt: service.created_at,
              }
            })
            break
          }

          case 'businesses': {
            // Usar función RPC optimizada
            const { data: businessesData, error } = await supabase.rpc('search_businesses', {
              search_query: searchTerm,
              limit_count: 50,
              offset_count: 0,
            })

            if (error) throw error

            // Fetch locations for distance calculation
            const businessIds = businessesData?.map((b: any) => b.id) || []
            const { data: locationsData } = await supabase
              .from('locations')
              .select('business_id, address, city, latitude, longitude')
              .in('business_id', businessIds)
              .eq('is_active', true)

            const locationsByBusiness = (locationsData || []).reduce((acc: any, loc: any) => {
              if (!acc[loc.business_id]) {
                acc[loc.business_id] = loc
              }
              return acc
            }, {})

            // Fetch category names
            const categoryIds = businessesData?.map((b: any) => b.category_id).filter(Boolean) || []
            const { data: categoriesData } = await supabase
              .from('business_categories')
              .select('id, name')
              .in('id', categoryIds)

            const categoriesByIdMap = (categoriesData || []).reduce((acc: any, cat: any) => {
              acc[cat.id] = cat.name
              return acc
            }, {})

            data = (businessesData || []).map((business: any) => {
              const location = locationsByBusiness[business.id]
              const distance =
                userLocation && location?.latitude && location?.longitude
                  ? calculateDistance(
                      userLocation.latitude,
                      userLocation.longitude,
                      location.latitude,
                      location.longitude
                    )
                  : undefined

              return {
                id: business.id,
                name: business.name,
                type: 'businesses' as SearchType,
                description: business.description,
                imageUrl: business.logo_url,
                category: categoriesByIdMap[business.category_id],
                rating: business.average_rating || undefined,
                reviewCount: business.review_count || 0,
                distance,
                location: location
                  ? {
                      address: location.address,
                      city: location.city,
                      latitude: location.latitude,
                      longitude: location.longitude,
                    }
                  : undefined,
                createdAt: business.created_at,
              }
            })
            break
          }

          case 'categories': {
            const { data: categoriesData, error } = await supabase
              .from('business_categories')
              .select(
                `
                id,
                name,
                description,
                created_at
              `
              )
              .ilike('name', `%${searchTerm}%`)
              .eq('is_active', true)
              .limit(50)

            if (error) throw error

            data = (categoriesData || []).map((category: any) => ({
              id: category.id,
              name: category.name,
              type: 'categories' as SearchType,
              description: category.description,
              createdAt: category.created_at,
            }))
            break
          }

          case 'users': {
            // Usar función RPC optimizada
            const { data: usersData, error } = await supabase.rpc('search_professionals', {
              search_query: searchTerm,
              limit_count: 50,
              offset_count: 0,
            })

            if (error) throw error

            // Fetch business info for each professional
            const userIds = usersData?.map((u: any) => u.id) || []

            const { data: employeesData } = await supabase
              .from('business_employees')
              .select(
                `
                employee_id,
                business:businesses!business_employees_business_id_fkey (
                  id,
                  name,
                  locations (
                    address,
                    city,
                    latitude,
                    longitude
                  )
                )
              `
              )
              .in('employee_id', userIds)

            const businessesByEmployee = (employeesData || []).reduce((acc: any, emp: any) => {
              if (!acc[emp.employee_id]) {
                acc[emp.employee_id] = emp.business
              }
              return acc
            }, {})

            data = (usersData || []).map((user: any) => {
              const business = businessesByEmployee[user.id]
              const businessLocation = business?.locations?.[0]
              const distance =
                userLocation && businessLocation?.latitude && businessLocation?.longitude
                  ? calculateDistance(
                      userLocation.latitude,
                      userLocation.longitude,
                      businessLocation.latitude,
                      businessLocation.longitude
                    )
                  : undefined

              return {
                id: user.id,
                name: user.full_name || t('search.results.userNoName'),
                type: 'users' as SearchType,
                imageUrl: user.avatar_url,
                rating: user.average_rating || undefined,
                reviewCount: user.review_count || 0,
                distance,
                business: business
                  ? {
                      id: business.id,
                      name: business.name,
                    }
                  : undefined,
                location: businessLocation
                  ? {
                      address: businessLocation.address,
                      city: businessLocation.city,
                      latitude: businessLocation.latitude,
                      longitude: businessLocation.longitude,
                    }
                  : undefined,
                createdAt: user.created_at,
              }
            })
            break
          }
        }

        setResults(data)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching search results:', error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [searchTerm, searchType, userLocation, calculateDistance, t])

  // Sort results
  const sortedResults = useMemo(() => {
    const sorted = [...results]

    switch (sortBy) {
      case 'distance':
        sorted.sort((a, b) => {
          if (a.distance === undefined) return 1
          if (b.distance === undefined) return -1
          return a.distance - b.distance
        })
        break

      case 'rating':
        sorted.sort((a, b) => {
          if (a.rating === undefined) return 1
          if (b.rating === undefined) return -1
          return b.rating - a.rating
        })
        break

      case 'newest':
        sorted.sort((a, b) => {
          if (!a.createdAt) return 1
          if (!b.createdAt) return -1
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
        break

      case 'oldest':
        sorted.sort((a, b) => {
          if (!a.createdAt) return 1
          if (!b.createdAt) return -1
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        })
        break

      case 'balanced': {
        // Balanced score: 60% rating + 40% proximity
        sorted.sort((a, b) => {
          const maxDistance = Math.max(...results.map(r => r.distance || 0).filter(d => d > 0))

          const scoreA =
            ((a.rating || 0) / 5.0) * 0.6 +
            (a.distance !== undefined && maxDistance > 0 ? (1 - a.distance / maxDistance) * 0.4 : 0)

          const scoreB =
            ((b.rating || 0) / 5.0) * 0.6 +
            (b.distance !== undefined && maxDistance > 0 ? (1 - b.distance / maxDistance) * 0.4 : 0)

          return scoreB - scoreA
        })
        break
      }

      case 'relevance':
      default:
        // Keep original order (most relevant by search)
        break
    }

    return sorted
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

  if (loading) {
    return (
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
        role="dialog" 
        aria-modal="true" 
        aria-label={t('search.resultsPage.searching')}
      >
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4" role="status" aria-live="polite">
            <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-primary mb-3 sm:mb-4" aria-hidden="true" />
            <p className="text-base sm:text-lg font-medium text-foreground text-center">
              {t('search.resultsPage.searching')}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2 text-center">
              "{searchTerm}" {t('search.resultsPage.in')} {getTypeLabel(searchType)}s
            </p>
          </CardContent>
        </Card>
      </div>
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
                </span>" {t('search.resultsPage.in')} {getTypeLabel(searchType)}s
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
              {sortedResults.map((result, index) => {
                const TypeIcon = getTypeIcon(result.type)
                return (
                  <Card
                    key={result.id}
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
              })}
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