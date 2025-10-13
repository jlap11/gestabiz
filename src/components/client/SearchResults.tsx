import React, { useState, useEffect, useMemo } from 'react'
import { 
  ArrowUpDown, 
  MapPin, 
  Star, 
  Calendar,
  Building2,
  Briefcase,
  User,
  Tag,
  SlidersHorizontal,
  X,
  Loader2
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
import { cn } from '@/lib/utils'
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

const sortOptions = [
  { value: 'relevance', label: 'Relevancia' },
  { value: 'balanced', label: 'Balanceado (Ubicación + Calificación)' },
  { value: 'distance', label: 'Más cercanos' },
  { value: 'rating', label: 'Mejor calificados' },
  { value: 'newest', label: 'Más nuevos' },
  { value: 'oldest', label: 'Más antiguos' }
]

export function SearchResults({ 
  searchTerm, 
  searchType, 
  userLocation,
  onResultClick,
  onClose 
}: SearchResultsProps) {
  const [results, setResults] = useState<SearchResultItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortOption>('balanced')
  const [showFilters, setShowFilters] = useState(false)

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
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
  }

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
              offset_count: 0
            })

            if (error) throw error

            // Fetch business info and locations
            const businessIds = [...new Set(servicesData?.map((s: any) => s.business_id).filter(Boolean))] || []
            
            const { data: businessesData } = await supabase
              .from('businesses')
              .select(`
                id,
                name,
                locations (
                  address,
                  city,
                  latitude,
                  longitude
                )
              `)
              .in('id', businessIds)

            const businessesMap = (businessesData || []).reduce((acc: any, business: any) => {
              acc[business.id] = business
              return acc
            }, {})

            data = (servicesData || []).map((service: any) => {
              const business = businessesMap[service.business_id]
              const location = business?.locations?.[0]
              const distance = userLocation && location?.latitude && location?.longitude
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
                business: business ? {
                  id: business.id,
                  name: business.name
                } : undefined,
                price: service.price,
                currency: service.currency,
                distance,
                location: location ? {
                  address: location.address,
                  city: location.city,
                  latitude: location.latitude,
                  longitude: location.longitude
                } : undefined,
                createdAt: service.created_at
              }
            })
            break
          }

          case 'businesses': {
            // Usar función RPC optimizada
            const { data: businessesData, error } = await supabase.rpc('search_businesses', {
              search_query: searchTerm,
              limit_count: 50,
              offset_count: 0
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
              const distance = userLocation && location?.latitude && location?.longitude
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
                location: location ? {
                  address: location.address,
                  city: location.city,
                  latitude: location.latitude,
                  longitude: location.longitude
                } : undefined,
                createdAt: business.created_at
              }
            })
            break
          }

          case 'categories': {
            const { data: categoriesData, error } = await supabase
              .from('business_categories')
              .select(`
                id,
                name,
                description,
                created_at
              `)
              .ilike('name', `%${searchTerm}%`)
              .eq('is_active', true)
              .limit(50)

            if (error) throw error

            data = (categoriesData || []).map((category: any) => ({
              id: category.id,
              name: category.name,
              type: 'categories' as SearchType,
              description: category.description,
              createdAt: category.created_at
            }))
            break
          }

          case 'users': {
            // Usar función RPC optimizada
            const { data: usersData, error } = await supabase.rpc('search_professionals', {
              search_query: searchTerm,
              limit_count: 50,
              offset_count: 0
            })

            if (error) throw error

            // Fetch business info for each professional
            const userIds = usersData?.map((u: any) => u.id) || []
            
            const { data: employeesData } = await supabase
              .from('business_employees')
              .select(`
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
              `)
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
              const distance = userLocation && businessLocation?.latitude && businessLocation?.longitude
                ? calculateDistance(
                    userLocation.latitude,
                    userLocation.longitude,
                    businessLocation.latitude,
                    businessLocation.longitude
                  )
                : undefined

              return {
                id: user.id,
                name: user.full_name || 'Usuario sin nombre',
                type: 'users' as SearchType,
                imageUrl: user.avatar_url,
                rating: user.average_rating || undefined,
                reviewCount: user.review_count || 0,
                distance,
                business: business ? {
                  id: business.id,
                  name: business.name
                } : undefined,
                location: businessLocation ? {
                  address: businessLocation.address,
                  city: businessLocation.city,
                  latitude: businessLocation.latitude,
                  longitude: businessLocation.longitude
                } : undefined,
                createdAt: user.created_at
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
  }, [searchTerm, searchType, userLocation])

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
          
          const scoreA = (
            ((a.rating || 0) / 5.0) * 0.6 +
            (a.distance !== undefined && maxDistance > 0 
              ? (1 - (a.distance / maxDistance)) * 0.4 
              : 0)
          )
          
          const scoreB = (
            ((b.rating || 0) / 5.0) * 0.6 +
            (b.distance !== undefined && maxDistance > 0 
              ? (1 - (b.distance / maxDistance)) * 0.4 
              : 0)
          )
          
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
      case 'services': return Briefcase
      case 'businesses': return Building2
      case 'categories': return Tag
      case 'users': return User
      default: return Building2
    }
  }

  const getTypeLabel = (type: SearchType) => {
    switch (type) {
      case 'services': return 'Servicio'
      case 'businesses': return 'Negocio'
      case 'categories': return 'Categoría'
      case 'users': return 'Profesional'
      default: return type
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium text-foreground">Buscando resultados...</p>
            <p className="text-sm text-muted-foreground mt-2">
              "{searchTerm}" en {getTypeLabel(searchType)}s
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Resultados de búsqueda
              </h1>
              <p className="text-muted-foreground">
                {sortedResults.length} resultado{sortedResults.length !== 1 ? 's' : ''} para "
                <span className="font-semibold text-foreground">{searchTerm}</span>" en{' '}
                {getTypeLabel(searchType)}s
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-10 w-10"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-4 mb-6">
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[280px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
              {showFilters && <Badge variant="secondary" className="ml-2">Activos</Badge>}
            </Button>

            {!userLocation && (
              <div className="flex-1 text-sm text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Habilita la ubicación para ver distancias</span>
              </div>
            )}
          </div>

          {/* Results Grid */}
          {sortedResults.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <div className="mb-4">
                  {React.createElement(getTypeIcon(searchType), { 
                    className: "h-16 w-16 mx-auto text-muted-foreground opacity-50" 
                  })}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No se encontraron resultados
                </h3>
                <p className="text-muted-foreground">
                  Intenta buscar con otros términos o cambia el tipo de búsqueda
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedResults.map((result) => {
                const TypeIcon = getTypeIcon(result.type)
                return (
                  <Card 
                    key={result.id}
                    className="hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => onResultClick(result)}
                  >
                    <CardContent className="p-5">
                      {/* Image or Icon */}
                      {result.imageUrl ? (
                        <div className="w-full h-40 rounded-lg overflow-hidden mb-4 bg-muted">
                          <img 
                            src={result.imageUrl} 
                            alt={result.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-40 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mb-4">
                          <TypeIcon className="h-16 w-16 text-primary/40" />
                        </div>
                      )}

                      {/* Content */}
                      <div className="space-y-3">
                        {/* Type Badge */}
                        <Badge variant="secondary" className="text-xs">
                          {getTypeLabel(result.type)}
                        </Badge>

                        {/* Name */}
                        <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {result.name}
                        </h3>

                        {/* Description */}
                        {result.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {result.description}
                          </p>
                        )}

                        {/* Business (for services/users) */}
                        {result.business && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Building2 className="h-4 w-4" />
                            <span className="truncate">{result.business.name}</span>
                          </div>
                        )}

                        {/* Rating */}
                        {result.rating !== undefined && (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-semibold text-foreground">
                                {result.rating.toFixed(1)}
                              </span>
                            </div>
                            {result.reviewCount !== undefined && result.reviewCount > 0 && (
                              <span className="text-sm text-muted-foreground">
                                ({result.reviewCount} reseña{result.reviewCount !== 1 ? 's' : ''})
                              </span>
                            )}
                          </div>
                        )}

                        {/* Distance */}
                        {result.distance !== undefined && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{result.distance.toFixed(1)} km</span>
                          </div>
                        )}

                        {/* Location */}
                        {result.location?.city && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            📍 {result.location.city}
                          </div>
                        )}

                        {/* Price (for services) */}
                        {result.price !== undefined && (
                          <div className="pt-2 border-t border-border">
                            <span className="text-lg font-bold text-primary">
                              ${result.price.toLocaleString('es-MX')} {result.currency || 'MXN'}
                            </span>
                          </div>
                        )}

                        {/* Category */}
                        {result.category && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Tag className="h-3 w-3" />
                            <span>{result.category}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
