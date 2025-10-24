import { useCallback, useEffect, useState } from 'react'
import supabase from '@/lib/supabase'
import { toast } from 'sonner'
import { logger } from '../lib/logger'

/**
 * Interface para los datos de favoritos que vienen de la RPC function
 */
export interface FavoriteBusiness {
  id: string
  name: string
  description: string | null
  logo_url: string | null
  address: string | null
  city: string | null
  phone: string | null
  average_rating: number
  review_count: number
  is_active: boolean
  favorited_at: string
}

/**
 * Hook para gestionar favoritos de negocios
 *
 * Características:
 * - Obtener lista de favoritos del usuario
 * - Toggle (marcar/desmarcar) favorito
 * - Verificar si un negocio es favorito
 * - Realtime subscriptions para sincronización multi-dispositivo
 * - Optimistic updates para mejor UX
 */
export function useFavorites(userId?: string) {
  const [favorites, setFavorites] = useState<FavoriteBusiness[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())

  /**
   * Fetch favorites usando RPC function
   */
  const fetchFavorites = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase.rpc('get_user_favorite_businesses')

      if (fetchError) throw fetchError

      const favoritesData = (data || []) as FavoriteBusiness[]
      setFavorites(favoritesData)

      // Crear Set de IDs para verificación rápida
      const ids = new Set(favoritesData.map(fav => fav.id))
      setFavoriteIds(ids)
    } catch (err) {
      const error = err as Error
      setError(error)
       
      logger.error('[useFavorites] Error fetching favorites:', { error })
      toast.error('Error al cargar favoritos')
    } finally {
      setLoading(false)
    }
  }, [userId])

  /**
   * Toggle favorite (marcar/desmarcar) con optimistic update
   */
  const toggleFavorite = useCallback(
    async (businessId: string, businessName?: string): Promise<boolean> => {
      if (!userId) {
        toast.error('Debes iniciar sesión para marcar favoritos')
        return false
      }

      // Optimistic update
      const wasAlreadyFavorite = favoriteIds.has(businessId)
      const newFavoriteIds = new Set(favoriteIds)

      if (wasAlreadyFavorite) {
        newFavoriteIds.delete(businessId)
        setFavoriteIds(newFavoriteIds)
        setFavorites(prev => prev.filter(fav => fav.id !== businessId))
      } else {
        newFavoriteIds.add(businessId)
        setFavoriteIds(newFavoriteIds)
      }

      try {
        const { data, error: toggleError } = await supabase.rpc('toggle_business_favorite', {
          p_business_id: businessId,
        })

        if (toggleError) throw toggleError

        const isNowFavorite = data as boolean

        // Mostrar toast según el resultado
        if (isNowFavorite) {
          toast.success(
            businessName ? `${businessName} agregado a favoritos` : 'Agregado a favoritos'
          )
        } else {
          toast.info(
            businessName ? `${businessName} eliminado de favoritos` : 'Eliminado de favoritos'
          )
        }

        // Refetch para sincronizar con datos reales
        await fetchFavorites()

        return isNowFavorite
      } catch (err) {
        const error = err as Error
         
        logger.error('[useFavorites] Error toggling favorite:', { error })

        // Revert optimistic update
        setFavoriteIds(new Set(favoriteIds))
        await fetchFavorites()

        toast.error('Error al actualizar favorito')
        return wasAlreadyFavorite
      }
    },
    [userId, favoriteIds, fetchFavorites]
  )

  /**
   * Verificar si un negocio es favorito (optimizado con Set local)
   */
  const isFavorite = useCallback(
    (businessId: string): boolean => {
      return favoriteIds.has(businessId)
    },
    [favoriteIds]
  )

  /**
   * Verificar si un negocio es favorito (desde BD - más confiable pero más lento)
   */
  const checkIsFavorite = useCallback(
    async (businessId: string): Promise<boolean> => {
      if (!userId) return false

      try {
        const { data, error: checkError } = await supabase.rpc('is_business_favorite', {
          p_business_id: businessId,
        })

        if (checkError) throw checkError

        return data as boolean
      } catch (err) {
         
        logger.error('[useFavorites] Error checking favorite status:', { error: err })
        return false
      }
    },
    [userId]
  )

  /**
   * Effect: Fetch favorites on mount y cuando userId cambia
   */
  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  /**
   * Effect: Realtime subscription para cambios en favoritos
   */
  useEffect(() => {
    if (!userId) return

     
    logger.info('[useFavorites] Setting up realtime subscription')

    const subscription = supabase
      .channel(`favorites:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'business_favorites',
          filter: `user_id=eq.${userId}`,
        },
        payload => {
           
          logger.info('[useFavorites] Realtime event:', { eventType: payload.eventType })

          // Refetch favorites cuando hay cambios
          fetchFavorites()
        }
      )
      .subscribe()

    return () => {
       
      logger.info('[useFavorites] Cleaning up realtime subscription')
      subscription.unsubscribe()
    }
  }, [userId, fetchFavorites])

  return {
    favorites,
    loading,
    error,
    favoriteIds,
    toggleFavorite,
    isFavorite,
    checkIsFavorite,
    refetch: fetchFavorites,
  }
}
