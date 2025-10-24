import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export interface MatchingVacancy {
  id: string
  business_id: string
  business_name: string
  title: string
  description: string
  position_type?: string
  required_services: string[]
  preferred_services?: string[]
  remote_allowed: boolean
  location_city?: string
  location_address?: string
  experience_required: 'any' | 'entry_level' | 'mid_level' | 'senior'
  salary_min?: number
  salary_max?: number
  currency?: string
  benefits?: string[]
  work_schedule?: Record<string, unknown>
  number_of_positions: number
  status: string
  published_at?: string
  expires_at?: string
  views_count: number
  applications_count: number
  match_score: number // 0-100 from RPC function
}

export interface VacancyFilters {
  city?: string
  remote_only?: boolean
  position_type?: string
  experience_level?: string
  min_salary?: number
  max_salary?: number
  limit?: number
  offset?: number
}

export function useMatchingVacancies() {
  const [vacancies, setVacancies] = useState<MatchingVacancy[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  const fetchMatchingVacancies = useCallback(
    async (userId?: string, filters?: VacancyFilters): Promise<MatchingVacancy[]> => {
      try {
        setLoading(true)
        setError(null)

        let targetUserId = userId

        if (!targetUserId) {
          const { data: session } = await supabase.auth.getSession()
          if (!session?.session?.user) {
            throw new Error('Usuario no autenticado')
          }
          targetUserId = session.session.user.id
        }

        // Call RPC function
        const { data, error: rpcError } = await supabase.rpc('get_matching_vacancies', {
          p_user_id: targetUserId,
          p_city: filters?.city || null,
          p_limit: filters?.limit || 50,
          p_offset: filters?.offset || 0,
        })

        if (rpcError) throw rpcError

        // Map vacancy_id to id for consistency
        let filtered = (data || []).map((v: MatchingVacancy & { vacancy_id?: string }) => ({
          ...v,
          id: v.vacancy_id || v.id, // Support both field names
        }))

        // Apply additional client-side filters
        if (filters?.remote_only) {
          filtered = filtered.filter((v: MatchingVacancy) => v.remote_allowed)
        }

        if (filters?.position_type) {
          filtered = filtered.filter(
            (v: MatchingVacancy) => v.position_type === filters.position_type
          )
        }

        if (filters?.experience_level) {
          filtered = filtered.filter(
            (v: MatchingVacancy) => v.experience_required === filters.experience_level
          )
        }

        if (filters?.min_salary !== undefined) {
          filtered = filtered.filter(
            (v: MatchingVacancy) =>
              v.salary_min !== null &&
              v.salary_min !== undefined &&
              v.salary_min >= (filters.min_salary || 0)
          )
        }

        if (filters?.max_salary !== undefined) {
          filtered = filtered.filter(
            (v: MatchingVacancy) =>
              v.salary_max !== null &&
              v.salary_max !== undefined &&
              v.salary_max <= (filters.max_salary || Infinity)
          )
        }

        setVacancies(filtered)
        setTotalCount(filtered.length)

        return filtered
      } catch (err: unknown) {
        const error = err as Error
        setError(error.message)
        toast.error('Error al cargar vacantes', {
          description: error.message,
        })
        return []
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const sortVacancies = useCallback(
    (
      sortBy: 'match_score' | 'salary' | 'published_at' | 'applications_count',
      order: 'asc' | 'desc' = 'desc'
    ) => {
      const sorted = [...vacancies].sort((a, b) => {
        let comparison = 0

        switch (sortBy) {
          case 'match_score':
            comparison = a.match_score - b.match_score
            break
          case 'salary':
            comparison = (a.salary_min || 0) - (b.salary_min || 0)
            break
          case 'published_at':
            comparison =
              new Date(a.published_at || 0).getTime() - new Date(b.published_at || 0).getTime()
            break
          case 'applications_count':
            comparison = a.applications_count - b.applications_count
            break
        }

        return order === 'desc' ? -comparison : comparison
      })

      setVacancies(sorted)
    },
    [vacancies]
  )

  const filterByScore = useCallback(
    (minScore: number) => {
      const filtered = vacancies.filter(v => v.match_score >= minScore)
      setVacancies(filtered)
      setTotalCount(filtered.length)
    },
    [vacancies]
  )

  const resetFilters = useCallback(async () => {
    await fetchMatchingVacancies()
  }, [fetchMatchingVacancies])

  return {
    vacancies,
    loading,
    error,
    totalCount,
    fetchMatchingVacancies,
    sortVacancies,
    filterByScore,
    resetFilters,
  }
}
