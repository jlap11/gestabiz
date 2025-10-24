import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import QUERY_CONFIG from '@/lib/queryConfig'

export function useAdminBusinesses(userId: string | undefined) {
  const {
    data: businesses = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-businesses', userId],
    queryFn: async () => {
      if (!userId) return []

      const { data, error: fetchError } = await supabase
        .from('businesses')
        .select(
          `
          *,
          category:category_id (
            id,
            name,
            slug,
            icon_name
          ),
          subcategories:business_subcategories (
            id,
            subcategory_id,
            subcategory:subcategory_id (
              id,
              name,
              slug
            )
          )
        `
        )
        .eq('owner_id', userId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      return data || []
    },
    ...QUERY_CONFIG.STABLE,
    enabled: !!userId,
  })

  return {
    businesses,
    isLoading,
    error: error?.message || null,
    refetch,
  }
}
