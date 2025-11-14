import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface WorkSchedule {
  [day: string]: {
    enabled: boolean;
    start_time: string; // "HH:MM" format
    end_time: string;   // "HH:MM" format
  };
}

export interface ScheduleConflict {
  business_id: string;
  business_name: string;
  conflicting_days: string[];
  overlap_details: {
    day: string;
    existing_hours: string; // e.g., "09:00-17:00"
    new_hours: string;      // e.g., "14:00-22:00"
    overlap_hours: string;  // e.g., "14:00-17:00"
  }[];
}

export interface BusinessEmployment {
  business_id: string;
  business_name: string;
  work_schedule?: WorkSchedule;
}

const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
];

export function useScheduleConflicts() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentEmployments = async (): Promise<BusinessEmployment[]> => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        throw new Error('Usuario no autenticado');
      }

      const { data, error: fetchError } = await supabase
        .from('business_employees')
        .select(`
          business_id,
          business:businesses!business_employees_business_id_fkey(name)
        `)
  .eq('employee_id', session.session.user.id)
  .eq('status', 'approved');

      if (fetchError) throw fetchError;

      return (data || []).map(emp => ({
        business_id: emp.business_id,
        business_name: 'Negocio', // work_schedule no se almacena en business_employees
        work_schedule: undefined // work_schedule no se almacena en business_employees
      }));
    } catch (err: unknown) {
      const error = err as Error;
      throw new Error(`Error al obtener empleos actuales: ${error.message}`);
    }
  };

  const parseTime = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes; // Convert to minutes since midnight
  };

  const formatMinutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const calculateTimeOverlap = (
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): { hasOverlap: boolean; overlapStart?: string; overlapEnd?: string } => {
    const start1Minutes = parseTime(start1);
    const end1Minutes = parseTime(end1);
    const start2Minutes = parseTime(start2);
    const end2Minutes = parseTime(end2);

    // Check if there's any overlap
    if (end1Minutes <= start2Minutes || end2Minutes <= start1Minutes) {
      return { hasOverlap: false };
    }

    // Calculate overlap
    const overlapStartMinutes = Math.max(start1Minutes, start2Minutes);
    const overlapEndMinutes = Math.min(end1Minutes, end2Minutes);

    return {
      hasOverlap: true,
      overlapStart: formatMinutesToTime(overlapStartMinutes),
      overlapEnd: formatMinutesToTime(overlapEndMinutes)
    };
  };

  const checkConflict = useCallback(async (
    newSchedule: WorkSchedule
  ): Promise<{ hasConflict: boolean; conflicts: ScheduleConflict[] }> => {
    try {
      setLoading(true);
      setError(null);

      // Get current employments
      const currentEmployments = await getCurrentEmployments();

      if (currentEmployments.length === 0) {
        return { hasConflict: false, conflicts: [] };
      }

      const conflicts: ScheduleConflict[] = [];

      // Check each employment for conflicts
      for (const employment of currentEmployments) {
        if (!employment.work_schedule) continue;

        const conflictDetails: ScheduleConflict['overlap_details'] = [];

        // Check each day of the week
        for (const day of DAYS_OF_WEEK) {
          const existingDay = employment.work_schedule[day];
          const newDay = newSchedule[day];

          // Skip if either schedule doesn't have this day enabled
          if (!existingDay?.enabled || !newDay?.enabled) continue;

          // Check for time overlap
          const overlap = calculateTimeOverlap(
            existingDay.start_time,
            existingDay.end_time,
            newDay.start_time,
            newDay.end_time
          );

          if (overlap.hasOverlap && overlap.overlapStart && overlap.overlapEnd) {
            conflictDetails.push({
              day,
              existing_hours: `${existingDay.start_time}-${existingDay.end_time}`,
              new_hours: `${newDay.start_time}-${newDay.end_time}`,
              overlap_hours: `${overlap.overlapStart}-${overlap.overlapEnd}`
            });
          }
        }

        if (conflictDetails.length > 0) {
          conflicts.push({
            business_id: employment.business_id,
            business_name: employment.business_name,
            conflicting_days: conflictDetails.map(d => d.day),
            overlap_details: conflictDetails
          });
        }
      }

      if (conflicts.length > 0) {
        toast.warning('Conflictos de horario detectados', {
          description: `Hay conflictos con ${conflicts.length} negocio(s) existente(s)`
        });
      }

      return {
        hasConflict: conflicts.length > 0,
        conflicts
      };
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
      toast.error('Error al verificar conflictos', {
        description: error.message
      });
      return { hasConflict: false, conflicts: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  const getConflictingBusinesses = useCallback(async (
    userId: string,
    schedule: WorkSchedule
  ): Promise<string[]> => {
    try {
      setLoading(true);
      setError(null);

      // NOTA: work_schedule no se almacena en business_employees
      // Este método retorna un array vacío hasta que se implemente la tabla work_schedules
      return [];
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
      toast.error('Error al obtener negocios conflictivos', {
        description: error.message
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const formatConflictSummary = (conflicts: ScheduleConflict[]): string => {
    if (conflicts.length === 0) return 'Sin conflictos';

    const summaries = conflicts.map(conflict => {
      const daysText = conflict.conflicting_days
        .map(day => day.charAt(0).toUpperCase() + day.slice(1))
        .join(', ');
      
      return `${conflict.business_name}: ${daysText}`;
    });

    return summaries.join(' | ');
  };

  return {
    loading,
    error,
    checkConflict,
    getConflictingBusinesses,
    getCurrentEmployments,
    formatConflictSummary
  };
}
