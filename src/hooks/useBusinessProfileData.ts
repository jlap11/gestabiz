import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface Category {
  name: string
  icon?: string
}

interface Subcategory {
  name: string
}

interface Location {
  id: string
  name: string
  address: string
  city: string
  state: string
  postal_code: string
  country: string
  latitude?: number
  longitude?: number
  phone?: string
  email?: string
  business_hours?: {
    [key: string]: {
      open: string
      close: string
      closed?: boolean
    }
  }
}

interface Service {
  id: string
  name: string
  description: string
  duration: number
  price: number
  category?: string
  is_active: boolean
}

interface Employee {
  id: string
  user_id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  avatar_url?: string
  title?: string
  bio?: string
  specializations?: string[]
  rating?: number
  review_count?: number
  services?: Array<{
    service_id: string
    service_name: string
  }>
}

interface BusinessData {
  id: string
  name: string
  description: string
  phone: string
  email: string
  website?: string
  logo_url?: string
  banner_url?: string
  slug?: string
  rating: number
  reviewCount: number
  category?: Category
  subcategories?: Subcategory[]
  locations: Location[]
  services: Service[]
  employees: Employee[]
  meta_title?: string
  meta_description?: string
  meta_keywords?: string[]
  og_image_url?: string
  is_public?: boolean
}

interface UseBusinessProfileDataOptions {
  businessId?: string
  slug?: string
  userLocation?: {
    latitude: number
    longitude: number
  }
}

export function useBusinessProfileData({
  businessId,
  slug,
  userLocation,
}: UseBusinessProfileDataOptions) {
  const [business, setBusiness] = useState<BusinessData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371 // Radio de la Tierra en km
      const dLat = ((lat2 - lat1) * Math.PI) / 180
      const dLon = ((lon2 - lon1) * Math.PI) / 180
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      return R * c
    },
    []
  )

  const fetchBusinessData = useCallback(async () => {
    if (!businessId && !slug) {
      setError('Se requiere businessId o slug')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // 1. Fetch business basic info
      const businessQuery = supabase
        .from('businesses')
        .select(
          `
          id,
          name,
          description,
          phone,
          email,
          website,
          logo_url,
          banner_url,
          slug,
          meta_title,
          meta_description,
          meta_keywords,
          og_image_url,
          is_public,
          category_id,
          categories!businesses_category_id_fkey (
            id,
            name,
            icon
          )
        `
        )
        .eq(slug ? 'slug' : 'id', slug || businessId)
        .single()

      const { data: businessData, error: businessError } = await businessQuery

      if (businessError) throw businessError
      if (!businessData) throw new Error('Negocio no encontrado')

      // 2. Fetch subcategories
      const { data: subcategoriesData } = await supabase
        .from('business_subcategories')
        .select(
          `
          subcategory_id,
          subcategories (
            id,
            name
          )
        `
        )
        .eq('business_id', businessData.id)

      // 3. Fetch locations
      const { data: locationsData } = await supabase
        .from('business_locations')
        .select('*')
        .eq('business_id', businessData.id)
        .eq('is_active', true)
        .order('name')

      // 4. Fetch services
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', businessData.id)
        .eq('is_active', true)
        .order('name')

      // 5. Fetch employees with ratings
      const { data: employeesData } = await supabase
        .from('business_employees')
        .select(
          `
          id,
          user_id,
          title,
          bio,
          specializations,
          profiles!business_employees_user_id_fkey (
            first_name,
            last_name,
            email,
            phone,
            avatar_url
          )
  `
        )
        .eq('business_id', businessData.id)
        .eq('status', 'approved')

      // 6. Fetch employee ratings from materialized view
      const employeeIds = employeesData?.map(e => e.id) || []
      const employeeRatings: Record<string, { rating: number; review_count: number }> = {}

      if (employeeIds.length > 0) {
        const { data: ratingsData } = await supabase
          .from('employee_ratings_stats')
          .select('employee_id, average_rating, review_count')
          .in('employee_id', employeeIds)

        if (ratingsData) {
          ratingsData.forEach(r => {
            employeeRatings[r.employee_id] = {
              rating: r.average_rating,
              review_count: r.review_count,
            }
          })
        }
      }

      // 7. Fetch employee services
      const employeeServices: Record<
        string,
        Array<{ service_id: string; service_name: string }>
      > = {}

      if (employeeIds.length > 0) {
        const { data: servicesMapping } = await supabase
          .from('employee_services')
          .select(
            `
            employee_id,
            service_id,
            services (
              name
            )
          `
          )
          .in('employee_id', employeeIds)

        if (servicesMapping) {
          servicesMapping.forEach((mapping: any) => {
            if (!employeeServices[mapping.employee_id]) {
              employeeServices[mapping.employee_id] = []
            }
            employeeServices[mapping.employee_id].push({
              service_id: mapping.service_id,
              service_name: Array.isArray(mapping.services)
                ? mapping.services[0]?.name || ''
                : mapping.services?.name || '',
            })
          })
        }
      }

      // 8. Fetch business rating and review count
      const { data: statsData } = await supabase
        .from('business_ratings_stats')
        .select('average_rating, review_count')
        .eq('business_id', businessData.id)
        .single()

      // 9. Calculate distances if user location is provided
      let locationsWithDistance = locationsData || []
      if (userLocation && locationsData) {
        locationsWithDistance = locationsData.map(loc => ({
          ...loc,
          distance:
            loc.latitude && loc.longitude
              ? calculateDistance(
                  userLocation.latitude,
                  userLocation.longitude,
                  loc.latitude,
                  loc.longitude
                )
              : undefined,
        }))
        locationsWithDistance.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity))
      }

      // 10. Map employees data
      const mappedEmployees: Employee[] = (employeesData || []).map((emp: any) => {
        const profile = Array.isArray(emp.profiles) ? emp.profiles[0] : emp.profiles

        return {
          id: emp.id,
          user_id: emp.user_id,
          first_name: profile?.first_name || '',
          last_name: profile?.last_name || '',
          email: profile?.email || '',
          phone: profile?.phone,
          avatar_url: profile?.avatar_url,
          title: emp.title,
          bio: emp.bio,
          specializations: emp.specializations,
          rating: employeeRatings[emp.id]?.rating,
          review_count: employeeRatings[emp.id]?.review_count,
          services: employeeServices[emp.id] || [],
        }
      })

      // 11. Build final business object
      const category = Array.isArray(businessData.categories)
        ? businessData.categories[0]
        : businessData.categories

      const finalBusiness: BusinessData = {
        id: businessData.id,
        name: businessData.name,
        description: businessData.description,
        phone: businessData.phone,
        email: businessData.email,
        website: businessData.website,
        logo_url: businessData.logo_url,
        banner_url: businessData.banner_url,
        slug: businessData.slug,
        rating: statsData?.average_rating || 0,
        reviewCount: statsData?.review_count || 0,
        category: category
          ? {
              name: category.name,
              icon: category.icon,
            }
          : undefined,
        subcategories:
          subcategoriesData?.map((sc: any) => {
            const subcat = Array.isArray(sc.subcategories) ? sc.subcategories[0] : sc.subcategories
            return {
              name: subcat?.name || '',
            }
          }) || [],
        locations: locationsWithDistance,
        services: servicesData || [],
        employees: mappedEmployees,
        meta_title: businessData.meta_title,
        meta_description: businessData.meta_description,
        meta_keywords: businessData.meta_keywords,
        og_image_url: businessData.og_image_url,
        is_public: businessData.is_public,
      }

      setBusiness(finalBusiness)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar datos del negocio'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [businessId, slug, userLocation, calculateDistance])

  useEffect(() => {
    fetchBusinessData()
  }, [fetchBusinessData])

  return {
    business,
    isLoading,
    error,
    refetch: fetchBusinessData,
  }
}
