import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export interface JobVacancy {
  id: string
  business_id: string
  title: string
  description: string
  requirements?: string
  responsibilities?: string
  benefits?: string[]
  position_type?: string
  experience_required?: string
  salary_min?: number
  salary_max?: number
  currency?: string
  location_id?: string
  location_city?: string
  location_address?: string
  remote_allowed: boolean
  work_schedule?: Record<string, { start: string; end: string }>
  number_of_positions: number
  required_services?: string[]
  preferred_services?: string[]
  status: 'draft' | 'open' | 'closed' | 'filled'
  published_at?: string
  expires_at?: string
  filled_at?: string
  views_count: number
  applications_count: number
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface CreateVacancyInput {
  business_id: string
  title: string
  description: string
  requirements?: string
  responsibilities?: string
  benefits?: string[]
  position_type?: string
  experience_required?: string
  salary_min?: number
  salary_max?: number
  currency?: string
  location_id?: string
  location_city?: string
  location_address?: string
  remote_allowed?: boolean
  work_schedule?: Record<string, { start: string; end: string }>
  number_of_positions?: number
  required_services?: string[]
  preferred_services?: string[]
  status?: 'draft' | 'open'
  expires_at?: string
}

export function useJobVacancies(businessId?: string) {
  const [vacancies, setVacancies] = useState<JobVacancy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVacancies = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('job_vacancies')
        .select('*')
        .order('created_at', { ascending: false })

      if (businessId) {
        query = query.eq('business_id', businessId)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setVacancies(data || [])
    } catch (err: any) {
      console.error('Error fetching vacancies:', err)
      setError(err.message)
      toast.error('Error al cargar vacantes')
    } finally {
      setLoading(false)
    }
  }, [businessId])

  useEffect(() => {
    fetchVacancies()
  }, [fetchVacancies])

  const createVacancy = async (input: CreateVacancyInput): Promise<JobVacancy | null> => {
    try {
      // Validaciones
      if (!input.title?.trim()) {
        throw new Error('El título es requerido')
      }

      if (!input.description?.trim() || input.description.length < 100) {
        throw new Error('La descripción debe tener al menos 100 caracteres')
      }

      if (input.salary_min && input.salary_max && input.salary_min > input.salary_max) {
        throw new Error('El salario mínimo no puede ser mayor que el máximo')
      }

      const vacancyData = {
        business_id: input.business_id,
        title: input.title.trim(),
        description: input.description.trim(),
        requirements: input.requirements?.trim(),
        responsibilities: input.responsibilities?.trim(),
        benefits: input.benefits || [],
        position_type: input.position_type || 'full_time',
        experience_required: input.experience_required || 'any',
        salary_min: input.salary_min,
        salary_max: input.salary_max,
        currency: input.currency || 'COP',
        location_id: input.location_id,
        location_city: input.location_city,
        location_address: input.location_address,
        remote_allowed: input.remote_allowed || false,
        work_schedule: input.work_schedule || null,
        number_of_positions: input.number_of_positions || 1,
        required_services: input.required_services || [],
        preferred_services: input.preferred_services || [],
        status: input.status || 'draft',
        expires_at: input.expires_at,
        published_at: input.status === 'open' ? new Date().toISOString() : null,
        views_count: 0,
        applications_count: 0,
      }

      const { data, error: insertError } = await supabase
        .from('job_vacancies')
        .insert(vacancyData)
        .select()
        .single()

      if (insertError) throw insertError

      toast.success('Vacante creada exitosamente')
      
      // Refrescar lista
      await fetchVacancies()

      return data
    } catch (err: any) {
      console.error('Error creating vacancy:', err)
      toast.error(err.message || 'Error al crear vacante')
      return null
    }
  }

  const updateVacancy = async (
    vacancyId: string,
    updates: Partial<CreateVacancyInput>
  ): Promise<boolean> => {
    try {
      // Si está cambiando a 'open', actualizar published_at
      if (updates.status === 'open' && vacancies.find(v => v.id === vacancyId)?.status !== 'open') {
        updates = {
          ...updates,
          published_at: new Date().toISOString(),
        }
      }

      const { error: updateError } = await supabase
        .from('job_vacancies')
        .update(updates)
        .eq('id', vacancyId)

      if (updateError) throw updateError

      toast.success('Vacante actualizada')
      await fetchVacancies()

      return true
    } catch (err: any) {
      console.error('Error updating vacancy:', err)
      toast.error(err.message || 'Error al actualizar vacante')
      return false
    }
  }

  const deleteVacancy = async (vacancyId: string): Promise<boolean> => {
    try {
      // Verificar si tiene aplicaciones
      const { data: applications } = await supabase
        .from('job_applications')
        .select('id')
        .eq('vacancy_id', vacancyId)
        .limit(1)

      if (applications && applications.length > 0) {
        throw new Error('No se puede eliminar una vacante con aplicaciones. Ciérrala en su lugar.')
      }

      const { error: deleteError } = await supabase
        .from('job_vacancies')
        .delete()
        .eq('id', vacancyId)

      if (deleteError) throw deleteError

      toast.success('Vacante eliminada')
      await fetchVacancies()

      return true
    } catch (err: any) {
      console.error('Error deleting vacancy:', err)
      toast.error(err.message || 'Error al eliminar vacante')
      return false
    }
  }

  const closeVacancy = async (vacancyId: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('job_vacancies')
        .update({ 
          status: 'closed',
          filled_at: new Date().toISOString()
        })
        .eq('id', vacancyId)

      if (updateError) throw updateError

      toast.success('Vacante cerrada')
      await fetchVacancies()

      return true
    } catch (err: any) {
      console.error('Error closing vacancy:', err)
      toast.error(err.message || 'Error al cerrar vacante')
      return false
    }
  }

  const incrementViews = async (vacancyId: string): Promise<void> => {
    try {
      await supabase.rpc('increment_vacancy_views', { vacancy_id: vacancyId })
    } catch (err: any) {
      console.error('Error incrementing views:', err)
    }
  }

  return {
    vacancies,
    loading,
    error,
    fetchVacancies,
    createVacancy,
    updateVacancy,
    deleteVacancy,
    closeVacancy,
    incrementViews,
  }
}
