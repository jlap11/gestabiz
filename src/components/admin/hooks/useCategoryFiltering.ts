import { useMemo } from 'react'
import { useBusinessCategories } from '@/hooks/useBusinessCategories'

export function useCategoryFiltering(categoryFilter: string) {
  const { mainCategories, categories, isLoading: categoriesLoading } = useBusinessCategories()

  // Filter MAIN categories by search term (frontend filter)
  // Also sort alphabetically (case-insensitive, locale 'es') for consistent dropdown order
  const normalizeName = (s: string) =>
    s
      .normalize('NFD')
      // Remove combining diacritical marks (safe range)
      .replaceAll(/[\u0300-\u036f]/g, '')
      .toLowerCase()

  const filteredMainCategories = useMemo(() => {
    return mainCategories
      .slice() // create a copy to avoid mutating original
      .filter(cat => normalizeName(cat.name).includes(categoryFilter.toLowerCase()))
      .sort((a, b) => {
        const na = normalizeName(a.name)
        const nb = normalizeName(b.name)

        // Force 'otros servicios' to the end
        if (na === 'otros servicios' && nb !== 'otros servicios') return 1
        if (nb === 'otros servicios' && na !== 'otros servicios') return -1

        return na.localeCompare(nb, 'es', { sensitivity: 'base' })
      })
  }, [mainCategories, categoryFilter])

  return {
    mainCategories,
    categories,
    categoriesLoading,
    filteredMainCategories,
  }
}