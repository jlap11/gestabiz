import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Business } from '@/types/types'

export function useAdminBusinesses(userId: string | undefined) {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBusinesses = useCallback(async () => {
    if (!userId) {
      setBusinesses([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('businesses')
        .select(`
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
        `)
        .eq('owner_id', userId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setBusinesses(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar negocios')
      setBusinesses([])
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchBusinesses()
  }, [fetchBusinesses])

  return {
    businesses,
    isLoading,
    error,
    refetch: fetchBusinesses,
  }
}
