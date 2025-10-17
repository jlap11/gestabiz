import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface JobApplication {
  id: string;
  vacancy_id: string;
  user_id: string;
  status: 'pending' | 'reviewing' | 'accepted' | 'rejected' | 'withdrawn';
  cover_letter?: string;
  cv_url?: string; // URL del CV en Supabase Storage (bucket: cvs/)
  expected_salary?: number;
  available_from?: string; // DATE: cuando puede comenzar
  availability_notes?: string; // TEXT: notas adicionales sobre disponibilidad
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  reviewed_at?: string;
  
  // Joined data
  vacancy?: {
    id: string;
    title: string;
    business_id: string;
    position_type?: string;
    salary_min?: number;
    salary_max?: number;
    currency?: string;
    status?: string;
  };
  applicant?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
    phone?: string;
  };
}

export interface CreateApplicationInput {
  vacancy_id: string;
  cover_letter?: string;
  cv_file?: File; // Archivo de CV (PDF o DOCX)
  expected_salary?: number;
  available_from?: string; // ISO date string (YYYY-MM-DD)
  availability_notes?: string;
}

export interface ApplicationFilters {
  vacancyId?: string;
  userId?: string;
  status?: JobApplication['status'];
  businessId?: string;
}

export function useJobApplications(filters?: ApplicationFilters) {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('job_applications')
        .select(`
          *,
          vacancy:job_vacancies(
            id, title, business_id, position_type,
            salary_min, salary_max, currency, status
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.vacancyId) {
        query = query.eq('vacancy_id', filters.vacancyId);
      }
      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      // Note: business_id filter would need a separate join, skipping for now

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Fetch user data separately for each application
      const applicationsWithUsers = await Promise.all(
        (data || []).map(async (app) => {
          const { data: userData } = await supabase
            .from('profiles')
            .select('id, full_name, email, avatar_url, phone')
            .eq('id', app.user_id)
            .single();
          
          return {
            ...app,
            applicant: userData || undefined
          };
        })
      );

      setApplications(applicationsWithUsers);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
      toast.error('Error al cargar aplicaciones', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const createApplication = async (input: CreateApplicationInput): Promise<JobApplication | null> => {
    try {
      // Validations
      if (!input.vacancy_id) {
        throw new Error('ID de vacante es requerido');
      }
      if (input.cover_letter && input.cover_letter.length < 50) {
        throw new Error('La carta de presentación debe tener al menos 50 caracteres');
      }

      // Check if user already applied
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        throw new Error('Usuario no autenticado');
      }

      const { data: existing, error: checkError } = await supabase
        .from('job_applications')
        .select('id')
        .eq('vacancy_id', input.vacancy_id)
        .eq('user_id', session.session.user.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing application:', checkError);
        // Continue anyway, backend will handle constraint violation
      }

      if (existing) {
        throw new Error('Ya has aplicado a esta vacante');
      }

      // Check vacancy is still open and get business_id
      const { data: vacancy, error: vacancyError } = await supabase
        .from('job_vacancies')
        .select('status, business_id')
        .eq('id', input.vacancy_id)
        .single();

      if (vacancyError) throw vacancyError;
      if (vacancy.status !== 'open') {
        throw new Error('Esta vacante ya no está disponible');
      }

      // Upload CV file if provided
      let cvUrl: string | undefined;
      if (input.cv_file) {
        const fileExt = input.cv_file.name.split('.').pop()?.toLowerCase();
        if (!fileExt || !['pdf', 'docx'].includes(fileExt)) {
          throw new Error('Solo se permiten archivos PDF o DOCX');
        }

        // Check file size (5MB max)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (input.cv_file.size > maxSize) {
          throw new Error('El archivo debe ser menor a 5MB');
        }

        const timestamp = Date.now();
        const fileName = `${input.vacancy_id}_${timestamp}.${fileExt}`;
        const filePath = `${session.session.user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('cvs')
          .upload(filePath, input.cv_file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Error uploading CV:', uploadError);
          throw new Error('Error al cargar el CV: ' + uploadError.message);
        }

        cvUrl = filePath; // Store the path in the database
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
        availability_notes: input.availability_notes
      };

      const { data, error: insertError } = await supabase
        .from('job_applications')
        .insert(applicationData)
        .select(`
          *,
          vacancy:job_vacancies!inner(
            id, title, business_id, position_type,
            salary_min, salary_max, currency, status
          )
        `)
        .single();

      if (insertError) throw insertError;

      // Fetch user data separately
      const { data: userData } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, phone')
        .eq('id', session.session.user.id)
        .single();

      // Add applicant data to response
      const applicationWithUser = {
        ...data,
        applicant: userData || undefined
      };

      // Increment applications_count on vacancy
      await supabase.rpc('increment_vacancy_applications', {
        p_vacancy_id: input.vacancy_id
      });

      toast.success('Aplicación enviada', {
        description: 'Tu aplicación ha sido enviada exitosamente'
      });

      await fetchApplications();
      return applicationWithUser as JobApplication;
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
      toast.error('Error al enviar aplicación', {
        description: error.message
      });
      return null;
    }
  };

  const updateApplicationStatus = async (
    id: string,
    status: JobApplication['status'],
    rejectionReason?: string
  ): Promise<boolean> => {
    try {
      const updates: Partial<JobApplication> = {
        status,
        reviewed_at: new Date().toISOString()
      };

      if (status === 'rejected' && rejectionReason) {
        updates.rejection_reason = rejectionReason;
      }

      const { error: updateError } = await supabase
        .from('job_applications')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      toast.success('Estado actualizado', {
        description: `Aplicación marcada como ${status}`
      });

      await fetchApplications();
      return true;
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
      toast.error('Error al actualizar estado', {
        description: error.message
      });
      return false;
    }
  };

  const rejectApplication = async (id: string, reason?: string): Promise<boolean> => {
    return updateApplicationStatus(id, 'rejected', reason);
  };

  const acceptApplication = async (id: string): Promise<boolean> => {
    try {
      // Get application details
      const { data: application, error: appError } = await supabase
        .from('job_applications')
        .select('vacancy_id')
        .eq('id', id)
        .single();

      if (appError) throw appError;

      // Update application status
      const success = await updateApplicationStatus(id, 'accepted');
      if (!success) return false;

      // Optionally close the vacancy if positions filled
      const { data: vacancy } = await supabase
        .from('job_vacancies')
        .select('number_of_positions, applications_count')
        .eq('id', application.vacancy_id)
        .single();

      if (vacancy && vacancy.applications_count >= (vacancy.number_of_positions || 1)) {
        await supabase
          .from('job_vacancies')
          .update({
            status: 'filled',
            filled_at: new Date().toISOString()
          })
          .eq('id', application.vacancy_id);
      }

      return true;
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
      toast.error('Error al aceptar aplicación', {
        description: error.message
      });
      return false;
    }
  };

  const withdrawApplication = async (id: string): Promise<boolean> => {
    try {
      // Get application to check ownership
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        throw new Error('Usuario no autenticado');
      }

      const { data: application, error: appError } = await supabase
        .from('job_applications')
        .select('user_id')
        .eq('id', id)
        .single();

      if (appError) throw appError;
      if (application.user_id !== session.session.user.id) {
        throw new Error('No tienes permiso para retirar esta aplicación');
      }

      const { error: updateError } = await supabase
        .from('job_applications')
        .update({ status: 'withdrawn' })
        .eq('id', id);

      if (updateError) throw updateError;

      toast.success('Aplicación retirada', {
        description: 'Has retirado tu aplicación exitosamente'
      });

      await fetchApplications();
      return true;
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
      toast.error('Error al retirar aplicación', {
        description: error.message
      });
      return false;
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [filters?.vacancyId, filters?.userId, filters?.status, filters?.businessId]);

  return {
    applications,
    loading,
    error,
    fetchApplications,
    createApplication,
    updateApplicationStatus,
    rejectApplication,
    acceptApplication,
    withdrawApplication
  };
}
