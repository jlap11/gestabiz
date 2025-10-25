import type { SearchResultItem } from '@/components/client/SearchResults'
import type { SortOption } from '@/components/client/SearchFilters'

/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 Latitude of first point
 * @param lng1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lng2 Longitude of second point
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLng = (lng2 - lng1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Sort search results based on the selected sort option
 * @param results Array of search results to sort
 * @param sortBy Sort option to apply
 * @returns Sorted array of search results
 */
export const sortSearchResults = (
  results: SearchResultItem[],
  sortBy: SortOption
): SearchResultItem[] => {
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
}