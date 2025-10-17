import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issue_date: string;
  expiry_date?: string;
  credential_id?: string;
  credential_url?: string;
}

export interface EmployeeProfile {
  id: string;
  user_id: string;
  professional_summary?: string;
  years_of_experience?: number;
  specializations: string[];
  languages: string[];
  certifications: Certification[];
  portfolio_url?: string;
  linkedin_url?: string;
  github_url?: string;
  available_for_hire: boolean;
  preferred_work_type?: 'full_time' | 'part_time' | 'contract' | 'flexible';
  expected_salary_min?: number;
  expected_salary_max?: number;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileInput {
  professional_summary?: string;
  years_of_experience?: number;
  specializations?: string[];
  languages?: string[];
  certifications?: Certification[];
  portfolio_url?: string;
  linkedin_url?: string;
  github_url?: string;
  available_for_hire?: boolean;
  preferred_work_type?: EmployeeProfile['preferred_work_type'];
  expected_salary_min?: number;
  expected_salary_max?: number;
}

export function useEmployeeProfile(userId?: string) {
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (targetUserId?: string) => {
    try {
      setLoading(true);
      setError(null);

      let queryUserId = targetUserId || userId;

      if (!queryUserId) {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.user) {
          throw new Error('Usuario no autenticado');
        }
        queryUserId = session.session.user.id;
      }

      const { data, error: fetchError } = await supabase
        .from('employee_profiles')
        .select('*')
        .eq('user_id', queryUserId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = no rows returned (profile doesn't exist yet)
        throw fetchError;
      }

      setProfile(data || null);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
      toast.error('Error al cargar perfil', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const updateProfile = async (input: UpdateProfileInput): Promise<boolean> => {
    try {
      // Validations
      if (input.professional_summary && input.professional_summary.length < 50) {
        throw new Error('El resumen profesional debe tener al menos 50 caracteres');
      }
      if (input.years_of_experience !== undefined) {
        if (input.years_of_experience < 0 || input.years_of_experience > 50) {
          throw new Error('Años de experiencia debe estar entre 0 y 50');
        }
      }
      if (input.expected_salary_min && input.expected_salary_max) {
        if (input.expected_salary_min > input.expected_salary_max) {
          throw new Error('Salario mínimo no puede ser mayor que salario máximo');
        }
      }

      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        throw new Error('Usuario no autenticado');
      }

      const profileData = {
        user_id: session.session.user.id,
        professional_summary: input.professional_summary,
        years_of_experience: input.years_of_experience,
        specializations: input.specializations,
        languages: input.languages,
        certifications: input.certifications,
        portfolio_url: input.portfolio_url,
        linkedin_url: input.linkedin_url,
        github_url: input.github_url,
        available_for_hire: input.available_for_hire,
        preferred_work_type: input.preferred_work_type,
        expected_salary_min: input.expected_salary_min,
        expected_salary_max: input.expected_salary_max
      };

      // UPSERT operation
      const { data, error: upsertError } = await supabase
        .from('employee_profiles')
        .upsert(profileData, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (upsertError) throw upsertError;

      setProfile(data);
      toast.success('Perfil actualizado', {
        description: 'Tu perfil profesional ha sido actualizado exitosamente'
      });

      return true;
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
      toast.error('Error al actualizar perfil', {
        description: error.message
      });
      return false;
    }
  };

  const addCertification = async (cert: Omit<Certification, 'id'>): Promise<boolean> => {
    try {
      if (!profile) {
        throw new Error('Debes cargar el perfil primero');
      }

      const newCert: Certification = {
        ...cert,
        id: crypto.randomUUID()
      };

      const updatedCertifications = [...profile.certifications, newCert];

      return updateProfile({ certifications: updatedCertifications });
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
      toast.error('Error al agregar certificación', {
        description: error.message
      });
      return false;
    }
  };

  const removeCertification = async (certId: string): Promise<boolean> => {
    try {
      if (!profile) {
        throw new Error('Debes cargar el perfil primero');
      }

      const updatedCertifications = profile.certifications.filter(c => c.id !== certId);

      return updateProfile({ certifications: updatedCertifications });
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
      toast.error('Error al eliminar certificación', {
        description: error.message
      });
      return false;
    }
  };

  const addSpecialization = async (spec: string): Promise<boolean> => {
    try {
      if (!profile) {
        throw new Error('Debes cargar el perfil primero');
      }

      if (profile.specializations.includes(spec)) {
        throw new Error('Esta especialización ya existe');
      }

      const updatedSpecializations = [...profile.specializations, spec];

      return updateProfile({ specializations: updatedSpecializations });
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
      toast.error('Error al agregar especialización', {
        description: error.message
      });
      return false;
    }
  };

  const removeSpecialization = async (spec: string): Promise<boolean> => {
    try {
      if (!profile) {
        throw new Error('Debes cargar el perfil primero');
      }

      const updatedSpecializations = profile.specializations.filter(s => s !== spec);

      return updateProfile({ specializations: updatedSpecializations });
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
      toast.error('Error al eliminar especialización', {
        description: error.message
      });
      return false;
    }
  };

  const addLanguage = async (language: string): Promise<boolean> => {
    try {
      if (!profile) {
        throw new Error('Debes cargar el perfil primero');
      }

      if (profile.languages.includes(language)) {
        throw new Error('Este idioma ya existe');
      }

      const updatedLanguages = [...profile.languages, language];

      return updateProfile({ languages: updatedLanguages });
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
      toast.error('Error al agregar idioma', {
        description: error.message
      });
      return false;
    }
  };

  const removeLanguage = async (language: string): Promise<boolean> => {
    try {
      if (!profile) {
        throw new Error('Debes cargar el perfil primero');
      }

      const updatedLanguages = profile.languages.filter(l => l !== language);

      return updateProfile({ languages: updatedLanguages });
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
      toast.error('Error al eliminar idioma', {
        description: error.message
      });
      return false;
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
    addCertification,
    removeCertification,
    addSpecialization,
    removeSpecialization,
    addLanguage,
    removeLanguage
  };
}
