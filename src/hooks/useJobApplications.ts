import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export interface JobApplication {
  id: string
  vacancy_id: string
  user_id: string
  status: 'pending' | 'reviewing' | 'in_selection_process' | 'accepted' | 'rejected' | 'withdrawn'
  cover_letter?: string
  cv_url?: string // URL del CV en Supabase Storage (bucket: cvs/)
  expected_salary?: number
  available_from?: string // DATE: cuando puede comenzar
  availability_notes?: string // TEXT: notas adicionales sobre disponibilidad
  rejection_reason?: string
  created_at: string
  updated_at: string
  reviewed_at?: string
  selection_started_at?: string // ⭐ NUEVO: cuando se inició el proceso de selección
  selection_started_by?: string // ⭐ NUEVO: admin que inició el proceso

  // Joined data
  vacancy?: {
    id: string
    title: string
    business_id: string
    position_type?: string
    salary_min?: number
    salary_max?: number
    currency?: string
    status?: string
  }
  applicant?: {
    id: string
    full_name: string
    email: string
    avatar_url?: string
    phone?: string
  }
}

export interface CreateApplicationInput {
  vacancy_id: string
  cover_letter?: string
  cv_file?: File // Archivo de CV (PDF o DOCX)
  expected_salary?: number
  available_from?: string // ISO date string (YYYY-MM-DD)
  availability_notes?: string
}

export interface ApplicationFilters {
  vacancyId?: string
  userId?: string
  status?: JobApplication['status']
  businessId?: string
}

export function useJobApplications(filters?: ApplicationFilters) {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchApplications = async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('job_applications')
        .select(
          `
          *,
          vacancy:job_vacancies(
            id, title, business_id, position_type,
            salary_min, salary_max, currency, status
          )
        `
        )
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters?.vacancyId) {
        query = query.eq('vacancy_id', filters.vacancyId)
      }
      if (filters?.userId) {
        query = query.eq('user_id', filters.userId)
      }
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      // Note: business_id filter would need a separate join, skipping for now

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      // Fetch user data separately for each application
      const applicationsWithUsers = await Promise.all(
        (data || []).map(async app => {
          const { data: userData } = await supabase
            .from('profiles')
            .select('id, full_name, email, avatar_url, phone')
            .eq('id', app.user_id)
            .single()

          return {
            ...app,
            applicant: userData || undefined,
          }
        })
      )

      setApplications(applicationsWithUsers)
    } catch (err: unknown) {
      const error = err as Error
      setError(error.message)
      toast.error('Error al cargar aplicaciones', {
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const createApplication = async (
    input: CreateApplicationInput
  ): Promise<JobApplication | null> => {
    try {
      // Validations
      if (!input.vacancy_id) {
        throw new Error('ID de vacante es requerido')
      }
      if (input.cover_letter && input.cover_letter.length < 50) {
        throw new Error('La carta de presentación debe tener al menos 50 caracteres')
      }

      // Check if user already applied
      const { data: session } = await supabase.auth.getSession()
      if (!session?.session?.user) {
        throw new Error('Usuario no autenticado')
      }

      const { data: existing, error: checkError } = await supabase
        .from('job_applications')
        .select('id')
        .eq('vacancy_id', input.vacancy_id)
        .eq('user_id', session.session.user.id)
        .maybeSingle()

      if (checkError) {
        console.error('Error checking existing application:', checkError)
        // Continue anyway, backend will handle constraint violation
      }

      if (existing) {
        throw new Error('Ya has aplicado a esta vacante')
      }

      // Check vacancy is still open and get business_id
      const { data: vacancy, error: vacancyError } = await supabase
        .from('job_vacancies')
        .select('status, business_id')
        .eq('id', input.vacancy_id)
        .single()

      if (vacancyError) throw vacancyError
      if (vacancy.status !== 'open') {
        throw new Error('Esta vacante ya no está disponible')
      }

      // Upload CV file if provided
      let cvUrl: string | undefined
      if (input.cv_file) {
        const fileExt = input.cv_file.name.split('.').pop()?.toLowerCase()
        if (!fileExt || !['pdf', 'docx'].includes(fileExt)) {
          throw new Error('Solo se permiten archivos PDF o DOCX')
        }

        // Check file size (5MB max)
        const maxSize = 5 * 1024 * 1024 // 5MB in bytes
        if (input.cv_file.size > maxSize) {
          throw new Error('El archivo debe ser menor a 5MB')
        }

        const timestamp = Date.now()
        const fileName = `${input.vacancy_id}_${timestamp}.${fileExt}`
        const filePath = `${session.session.user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('cvs')
          .upload(filePath, input.cv_file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) {
          console.error('Error uploading CV:', uploadError)
          throw new Error('Error al cargar el CV: ' + uploadError.message)
        }

        cvUrl = filePath // Store the path in the database
      }

      const applicationData = {
        vacancy_id: input.vacancy_id,
        user_id: session.session.user.id,
        business_id: vacancy.business_id,
        status: 'pending' as const,
        cover_letter: input.cover_letter,
        cv_url: cvUrl,
        expected_salary: input.expected_salary,
        available_from: input.available_from,
        availability_notes: input.availability_notes,
      }

      const { data, error: insertError } = await supabase
        .from('job_applications')
        .insert(applicationData)
        .select(
          `
          *,
          vacancy:job_vacancies!inner(
            id, title, business_id, position_type,
            salary_min, salary_max, currency, status
          )
        `
        )
        .single()

      if (insertError) throw insertError

      // Fetch user data separately
      const { data: userData } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, phone')
        .eq('id', session.session.user.id)
        .single()

      // Add applicant data to response
      const applicationWithUser = {
        ...data,
        applicant: userData || undefined,
      }

      // Increment applications_count on vacancy
      await supabase.rpc('increment_vacancy_applications', {
        p_vacancy_id: input.vacancy_id,
      })

      toast.success('Aplicación enviada', {
        description: 'Tu aplicación ha sido enviada exitosamente',
      })

      await fetchApplications()
      return applicationWithUser as JobApplication
    } catch (err: unknown) {
      const error = err as Error
      setError(error.message)
      toast.error('Error al enviar aplicación', {
        description: error.message,
      })
      return null
    }
  }

  const updateApplicationStatus = async (
    id: string,
    status: JobApplication['status'],
    rejectionReason?: string
  ): Promise<boolean> => {
    try {
      const updates: Partial<JobApplication> = {
        status,
        reviewed_at: new Date().toISOString(),
      }

      if (status === 'rejected' && rejectionReason) {
        updates.rejection_reason = rejectionReason
      }

      const { error: updateError } = await supabase
        .from('job_applications')
        .update(updates)
        .eq('id', id)

      if (updateError) throw updateError

      toast.success('Estado actualizado', {
        description: `Aplicación marcada como ${status}`,
      })

      await fetchApplications()
      return true
    } catch (err: unknown) {
      const error = err as Error
      setError(error.message)
      toast.error('Error al actualizar estado', {
        description: error.message,
      })
      return false
    }
  }

  const rejectApplication = async (id: string, reason?: string): Promise<boolean> => {
    return updateApplicationStatus(id, 'rejected', reason)
  }

  const acceptApplication = async (id: string): Promise<boolean> => {
    try {
      // Get application details
      const { data: application, error: appError } = await supabase
        .from('job_applications')
        .select('vacancy_id')
        .eq('id', id)
        .single()

      if (appError) throw appError

      // Update application status
      const success = await updateApplicationStatus(id, 'accepted')
      if (!success) return false

      // Optionally close the vacancy if positions filled
      const { data: vacancy } = await supabase
        .from('job_vacancies')
        .select('number_of_positions, applications_count')
        .eq('id', application.vacancy_id)
        .single()

      if (vacancy && vacancy.applications_count >= (vacancy.number_of_positions || 1)) {
        await supabase
          .from('job_vacancies')
          .update({
            status: 'filled',
            filled_at: new Date().toISOString(),
          })
          .eq('id', application.vacancy_id)
      }

      return true
    } catch (err: unknown) {
      const error = err as Error
      setError(error.message)
      toast.error('Error al aceptar aplicación', {
        description: error.message,
      })
      return false
    }
  }

  const withdrawApplication = async (id: string): Promise<boolean> => {
    try {
      // Get application to check ownership
      const { data: session } = await supabase.auth.getSession()
      if (!session?.session?.user) {
        throw new Error('Usuario no autenticado')
      }

      const { data: application, error: appError } = await supabase
        .from('job_applications')
        .select('user_id')
        .eq('id', id)
        .single()

      if (appError) throw appError
      if (application.user_id !== session.session.user.id) {
        throw new Error('No tienes permiso para retirar esta aplicación')
      }

      const { error: updateError } = await supabase
        .from('job_applications')
        .update({ status: 'withdrawn' })
        .eq('id', id)

      if (updateError) throw updateError

      toast.success('Aplicación retirada', {
        description: 'Has retirado tu aplicación exitosamente',
      })

      await fetchApplications()
      return true
    } catch (err: unknown) {
      const error = err as Error
      setError(error.message)
      toast.error('Error al retirar aplicación', {
        description: error.message,
      })
      return false
    }
  }

  useEffect(() => {
    fetchApplications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters?.vacancyId, filters?.userId, filters?.status, filters?.businessId])

  /**
   * Inicia el proceso de selección con un candidato
   * ⭐ NUEVO: Marca la aplicación como "in_selection_process"
   */
  const startSelectionProcess = async (applicationId: string): Promise<boolean> => {
    try {
      // Obtener usuario actual desde Supabase Auth (sin usar getSession)
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('No autorizado')
      }

      // Actualizar estado a in_selection_process
      const { error: updateError } = await supabase
        .from('job_applications')
        .update({
          status: 'in_selection_process',
          selection_started_at: new Date().toISOString(),
          selection_started_by: user.id,
        })
        .eq('id', applicationId)

      if (updateError) throw updateError

      // Obtener datos para notificación
      const { data: application, error: appError } = await supabase
        .from('job_applications')
        .select(
          `
          *,
          vacancy:job_vacancies(
            id, title, business_id
          )
        `
        )
        .eq('id', applicationId)
        .single()

      if (appError) throw appError

      // Fetch applicant separately
      const { data: applicant } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', application.user_id)
        .single()

      // Fetch business separately
      const { data: business } = await supabase
        .from('businesses')
        .select('id, name')
        .eq('id', application.vacancy.business_id)
        .single()

      // Llamar Edge Function para enviar notificaciones
      const { error: notifError } = await supabase.functions.invoke(
        'send-selection-notifications',
        {
          body: {
            type: 'started',
            application_id: applicationId,
            vacancy_id: application.vacancy.id,
            vacancy_title: application.vacancy.title,
            business_id: application.vacancy.business_id,
            business_name: business?.name || 'Negocio',
            user_id: application.user_id,
            user_email: applicant?.email || '',
            user_name: applicant?.full_name || 'Aplicante',
          },
        }
      )

      if (notifError) {
        // eslint-disable-next-line no-console
        console.error('Error enviando notificación:', notifError)
        // No fallar la operación si falla la notificación
      }

      toast.success('Proceso de selección iniciado', {
        description: 'El candidato ha sido notificado. Acuerda una entrevista con él.',
      })

      await fetchApplications()
      return true
    } catch (err: unknown) {
      const error = err as Error
      setError(error.message)
      toast.error('Error al iniciar proceso', {
        description: error.message,
      })
      return false
    }
  }

  /**
   * Selecciona un candidato como empleado final
   * ⭐ NUEVO: Acepta al candidato, agrega a business_employees, cierra vacante y rechaza a los demás
   */
  const selectAsEmployee = async (applicationId: string): Promise<boolean> => {
    try {
      // Obtener usuario actual desde Supabase Auth
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('No autorizado')
      }

      // 1. Obtener datos de la aplicación y vacante
      const { data: application, error: appError } = await supabase
        .from('job_applications')
        .select(
          `
          *,
          vacancy:job_vacancies(
            id, title, number_of_positions, business_id, status
          )
        `
        )
        .eq('id', applicationId)
        .single()

      if (appError) throw appError

      const vacancy = application.vacancy

      // Fetch business separately
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .select('id, name')
        .eq('id', vacancy.business_id)
        .single()

      if (businessError) throw businessError

      // Fetch applicant separately
      const { data: applicant, error: applicantError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', application.user_id)
        .single()

      if (applicantError) throw applicantError

      // 2. Obtener otros candidatos en proceso de selección
      const { data: otherCandidates, error: othersError } = await supabase
        .from('job_applications')
        .select(`id, user_id`)
        .eq('vacancy_id', vacancy.id)
        .eq('status', 'in_selection_process')
        .neq('id', applicationId)

      if (othersError) throw othersError

      // Fetch profiles for other candidates separately
      let otherCandidateProfiles: Array<{ id: string; email?: string; full_name?: string }> = []
      if (otherCandidates && otherCandidates.length > 0) {
        const userIds = otherCandidates.map(c => c.user_id)
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', userIds)
        otherCandidateProfiles = profiles || []
      }

      // 3. Marcar aplicación como aceptada
      const { error: acceptError } = await supabase
        .from('job_applications')
        .update({
          status: 'accepted',
          decision_at: new Date().toISOString(),
        })
        .eq('id', applicationId)

      if (acceptError) throw acceptError

      // 4. Agregar a business_employees
      const { error: employeeError } = await supabase.from('business_employees').insert({
        business_id: vacancy.business_id,
        employee_id: application.user_id,
        status: 'approved',
        is_active: true,
        role: 'employee',
        employee_type: 'service_provider',
        hire_date: new Date().toISOString(),
      })

      if (employeeError) throw employeeError

      // 5. Contar cuántos candidatos han sido aceptados (incluyendo este)
      const { count, error: countError } = await supabase
        .from('job_applications')
        .select('id', { count: 'exact', head: true })
        .eq('vacancy_id', vacancy.id)
        .eq('status', 'accepted')

      if (countError) throw countError

      const acceptedCount = count || 0
      const positionsToFill = vacancy.number_of_positions || 1

      // 6. Si se llenaron todas las posiciones, cerrar vacante y rechazar a los demás
      if (acceptedCount >= positionsToFill) {
        // Cerrar vacante
        const { error: vacancyError } = await supabase
          .from('job_vacancies')
          .update({
            status: 'filled',
            filled_at: new Date().toISOString(),
          })
          .eq('id', vacancy.id)

        if (vacancyError) throw vacancyError

        // Rechazar automáticamente a otros candidatos en proceso
        if (otherCandidates && otherCandidates.length > 0) {
          const { error: rejectError } = await supabase
            .from('job_applications')
            .update({
              status: 'rejected',
              decision_at: new Date().toISOString(),
              decision_notes: 'Vacante cubierta - Posiciones completas',
            })
            .in(
              'id',
              otherCandidates.map(c => c.id)
            )

          if (rejectError) throw rejectError
        }
      }

      // 7. Enviar notificaciones
      const { error: notifError } = await supabase.functions.invoke(
        'send-selection-notifications',
        {
          body: {
            type: 'selected',
            application_id: applicationId,
            vacancy_id: vacancy.id,
            vacancy_title: vacancy.title,
            business_id: vacancy.business_id,
            business_name: business?.name || 'Negocio',
            selected_user_id: application.user_id,
            selected_user_email: applicant?.email || '',
            selected_user_name: applicant?.full_name || 'Aplicante',
            rejected_candidates: (otherCandidates || []).map(c => {
              const profileData = otherCandidateProfiles.find(p => p.id === c.user_id)
              return {
                user_id: c.user_id,
                user_email: profileData?.email || '',
                user_name: profileData?.full_name || '',
              }
            }),
            vacancy_filled: acceptedCount >= positionsToFill,
          },
        }
      )

      if (notifError) {
        // eslint-disable-next-line no-console
        console.error('Error enviando notificaciones:', notifError)
        // No fallar la operación si falla la notificación
      }

      toast.success('¡Empleado seleccionado!', {
        description:
          acceptedCount >= positionsToFill
            ? 'La vacante ha sido cerrada y los candidatos han sido notificados'
            : 'El candidato ha sido agregado como empleado',
      })

      await fetchApplications()
      return true
    } catch (err: unknown) {
      const error = err as Error
      setError(error.message)
      toast.error('Error al seleccionar empleado', {
        description: error.message,
      })
      return false
    }
  }

  return {
    applications,
    loading,
    error,
    fetchApplications,
    createApplication,
    updateApplicationStatus,
    rejectApplication,
    acceptApplication,
    withdrawApplication,
    startSelectionProcess, // ⭐ NUEVO
    selectAsEmployee, // ⭐ NUEVO
  }
}
