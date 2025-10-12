import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { BusinessCategory } from '@/types/types'

interface UseBusinessCategoriesReturn {
  // Categorías principales (parent_id = NULL)
  mainCategories: BusinessCategory[]
  // Todas las categorías (principales + subcategorías) con estructura jerárquica
  categories: BusinessCategory[]
  // Todas las categorías planas (para búsquedas)
  allCategories: BusinessCategory[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook para obtener las categorías de negocios con estructura jerárquica
 * - mainCategories: Solo categorías principales (parent_id = NULL)
 * - categories: Categorías principales con subcategories[] pobladas
 * - allCategories: Todas las categorías en lista plana
 */
export function useBusinessCategories(): UseBusinessCategoriesReturn {
  const [mainCategories, setMainCategories] = useState<BusinessCategory[]>([])
  const [categories, setCategories] = useState<BusinessCategory[]>([])
  const [allCategories, setAllCategories] = useState<BusinessCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch todas las categorías activas
      const { data, error: fetchError } = await supabase
        .from('business_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (fetchError) {
        throw fetchError
      }

      const allCats = data || []
      setAllCategories(allCats)

      // Separar principales y subcategorías
      const mains = allCats.filter(cat => !cat.parent_id)
      const subs = allCats.filter(cat => cat.parent_id)

      // Construir estructura jerárquica
      const mainsWithSubs = mains.map(main => ({
        ...main,
        subcategories: subs.filter(sub => sub.parent_id === main.id)
      }))

      setMainCategories(mains)
      setCategories(mainsWithSubs)
    } catch (err) {
      console.error('Error fetching business categories:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar categorías')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  return {
    mainCategories,
    categories,
    allCategories,
    isLoading,
    error,
    refetch: fetchCategories,
  }
}

/**
 * Hook para obtener una categoría específica por ID
 */
export function useBusinessCategory(categoryId: string | null | undefined) {
  const [category, setCategory] = useState<BusinessCategory | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!categoryId) {
      setCategory(null)
      return
    }

    const fetchCategory = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
          .from('business_categories')
          .select('*')
          .eq('id', categoryId)
          .single()

        if (fetchError) {
          throw fetchError
        }

        setCategory(data)
      } catch (err) {
        console.error('Error fetching business category:', err)
        setError(err instanceof Error ? err.message : 'Error al cargar categoría')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategory()
  }, [categoryId])

  return {
    category,
    isLoading,
    error,
  }
}
