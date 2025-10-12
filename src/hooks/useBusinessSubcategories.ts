import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { BusinessSubcategory, BusinessCategory } from '@/types/types'

interface UseBusinessSubcategoriesReturn {
  subcategories: BusinessSubcategory[]
  isLoading: boolean
  error: string | null
  addSubcategory: (subcategoryId: string) => Promise<boolean>
  removeSubcategory: (subcategoryId: string) => Promise<boolean>
  refetch: () => Promise<void>
}

/**
 * Hook para gestionar las subcategorías de un negocio
 * Máximo 3 subcategorías por negocio (validado por trigger en DB)
 */
export function useBusinessSubcategories(
  businessId: string | null | undefined
): UseBusinessSubcategoriesReturn {
  const [subcategories, setSubcategories] = useState<BusinessSubcategory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSubcategories = async () => {
    if (!businessId) {
      setSubcategories([])
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('business_subcategories')
        .select(`
          *,
          subcategory:business_categories!subcategory_id(*)
        `)
        .eq('business_id', businessId)

      if (fetchError) {
        throw fetchError
      }

      setSubcategories(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar subcategorías')
    } finally {
      setIsLoading(false)
    }
  }

  const addSubcategory = async (subcategoryId: string): Promise<boolean> => {
    if (!businessId) return false

    try {
      // Verificar que no tengamos ya 3 subcategorías (el trigger también valida)
      if (subcategories.length >= 3) {
        setError('Máximo 3 subcategorías permitidas por negocio')
        return false
      }

      const { error: insertError } = await supabase
        .from('business_subcategories')
        .insert({
          business_id: businessId,
          subcategory_id: subcategoryId,
        })

      if (insertError) {
        throw insertError
      }

      await fetchSubcategories()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar subcategoría')
      return false
    }
  }

  const removeSubcategory = async (subcategoryId: string): Promise<boolean> => {
    if (!businessId) return false

    try {
      const { error: deleteError } = await supabase
        .from('business_subcategories')
        .delete()
        .eq('business_id', businessId)
        .eq('subcategory_id', subcategoryId)

      if (deleteError) {
        throw deleteError
      }

      await fetchSubcategories()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar subcategoría')
      return false
    }
  }

  useEffect(() => {
    fetchSubcategories()
  }, [businessId])

  return {
    subcategories,
    isLoading,
    error,
    addSubcategory,
    removeSubcategory,
    refetch: fetchSubcategories,
  }
}

/**
 * Hook para obtener las subcategorías disponibles de una categoría principal
 */
export function useSubcategoriesByParent(parentId: string | null | undefined) {
  const [subcategories, setSubcategories] = useState<BusinessCategory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!parentId) {
      setSubcategories([])
      return
    }

    const fetchSubcategories = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
          .from('business_categories')
          .select('*')
          .eq('parent_id', parentId)
          .eq('is_active', true)
          .order('sort_order', { ascending: true })

        if (fetchError) {
          throw fetchError
        }

        setSubcategories(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar subcategorías')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubcategories()
  }, [parentId])

  return {
    subcategories,
    isLoading,
    error,
  }
}
