import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { calculateDistance } from '@/lib/searchUtils'
import type { SearchResultItem } from '@/components/client/SearchResults'
import type { SearchType } from '@/components/client/SearchBar'

interface UseSearchLogicProps {
  searchTerm: string
  searchType: SearchType
  userLocation: { lat: number; lng: number } | null
}

export const useSearchLogic = ({ searchTerm, searchType, userLocation }: UseSearchLogicProps) => {
  const [results, setResults] = useState<SearchResultItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchResults = async () => {
      if (!searchTerm.trim()) {
        setResults([])
        return
      }

      setLoading(true)
      try {
        let data: SearchResultItem[] = []

        switch (searchType) {
          case 'services': {
            const { data: servicesData, error } = await supabase.rpc('search_services', {
              search_term: searchTerm,
            })

            if (error) throw error

            // Fetch business and location data for each service
            const servicesWithDetails = await Promise.all(
              servicesData.map(async (service: any) => {
                const { data: businessData } = await supabase
                  .from('businesses')
                  .select('id, name, description, image_url')
                  .eq('id', service.business_id)
                  .single()

                const { data: locationData } = await supabase
                  .from('business_locations')
                  .select('latitude, longitude, city, address')
                  .eq('business_id', service.business_id)
                  .single()

                let distance: number | undefined
                if (userLocation && locationData?.latitude && locationData?.longitude) {
                  distance = calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    locationData.latitude,
                    locationData.longitude
                  )
                }

                return {
                  id: service.id,
                  type: 'services' as const,
                  name: service.name,
                  description: service.description,
                  imageUrl: service.image_url,
                  price: service.price,
                  rating: service.rating,
                  reviewCount: service.review_count,
                  category: service.category_name,
                  business: businessData,
                  location: locationData ? {
                    city: locationData.city,
                    address: locationData.address,
                    latitude: locationData.latitude,
                    longitude: locationData.longitude,
                  } : undefined,
                  distance,
                  createdAt: service.created_at,
                }
              })
            )

            data = servicesWithDetails
            break
          }

          case 'businesses': {
            const { data: businessesData, error } = await supabase.rpc('search_businesses', {
              search_term: searchTerm,
            })

            if (error) throw error

            // Fetch location data for each business
            const businessesWithDetails = await Promise.all(
              businessesData.map(async (business: any) => {
                const { data: locationData } = await supabase
                  .from('business_locations')
                  .select('latitude, longitude, city, address')
                  .eq('business_id', business.id)
                  .single()

                let distance: number | undefined
                if (userLocation && locationData?.latitude && locationData?.longitude) {
                  distance = calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    locationData.latitude,
                    locationData.longitude
                  )
                }

                return {
                  id: business.id,
                  type: 'businesses' as const,
                  name: business.name,
                  description: business.description,
                  imageUrl: business.image_url,
                  rating: business.rating,
                  reviewCount: business.review_count,
                  location: locationData ? {
                    city: locationData.city,
                    address: locationData.address,
                    latitude: locationData.latitude,
                    longitude: locationData.longitude,
                  } : undefined,
                  distance,
                  createdAt: business.created_at,
                }
              })
            )

            data = businessesWithDetails
            break
          }

          case 'categories': {
            const { data: categoriesData, error } = await supabase.rpc('search_categories', {
              search_term: searchTerm,
            })

            if (error) throw error

            data = categoriesData.map((category: any) => ({
              id: category.id,
              type: 'categories' as const,
              name: category.name,
              description: category.description,
              imageUrl: category.image_url,
              createdAt: category.created_at,
            }))
            break
          }

          case 'users': {
            const { data: usersData, error } = await supabase.rpc('search_professionals', {
              search_term: searchTerm,
            })

            if (error) throw error

            // Fetch business and location data for each user
            const usersWithDetails = await Promise.all(
              usersData.map(async (user: any) => {
                const { data: businessData } = await supabase
                  .from('businesses')
                  .select('id, name, description, image_url')
                  .eq('id', user.business_id)
                  .single()

                const { data: locationData } = await supabase
                  .from('business_locations')
                  .select('latitude, longitude, city, address')
                  .eq('business_id', user.business_id)
                  .single()

                let distance: number | undefined
                if (userLocation && locationData?.latitude && locationData?.longitude) {
                  distance = calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    locationData.latitude,
                    locationData.longitude
                  )
                }

                return {
                  id: user.id,
                  type: 'users' as const,
                  name: `${user.first_name} ${user.last_name}`,
                  description: user.bio,
                  imageUrl: user.avatar_url,
                  rating: user.rating,
                  reviewCount: user.review_count,
                  business: businessData,
                  location: locationData ? {
                    city: locationData.city,
                    address: locationData.address,
                    latitude: locationData.latitude,
                    longitude: locationData.longitude,
                  } : undefined,
                  distance,
                  createdAt: user.created_at,
                }
              })
            )

            data = usersWithDetails
            break
          }
        }

        setResults(data)
      } catch (error) {
        console.error('Error fetching search results:', error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [searchTerm, searchType, userLocation])

  return { results, loading }
}