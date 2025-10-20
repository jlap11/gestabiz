/**
 * Hook: useEmployeeAbsences
 * 
 * Gestiona ausencias y vacaciones desde la perspectiva del empleado.
 * 
 * Features:
 * - Solicitar ausencias/vacaciones
 * - Ver balance de vacaciones
 * - Ver historial de ausencias
 * - Cancelar solicitudes pendientes
 * - Ver citas afectadas por ausencias
 * 
 * @example
 * const { requestAbsence, vacationBalance, absences, loading } = useEmployeeAbsences(businessId);
 * await requestAbsence({ absenceType: 'vacation', startDate: '2025-01-25', endDate: '2025-02-05', reason: 'Vacaciones anuales' });
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface AbsenceRequest {
  absenceType: 'vacation' | 'emergency' | 'sick_leave' | 'personal' | 'other';
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: string;
  employeeNotes?: string;
}

export interface EmployeeAbsence {
  id: string;
  businessId: string;
  absenceType: 'vacation' | 'emergency' | 'sick_leave' | 'personal' | 'other';
  startDate: string;
  endDate: string;
  reason: string;
  employeeNotes?: string;
  adminNotes?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface VacationBalance {
  year: number;
  totalDaysAvailable: number;
  daysUsed: number;
  daysPending: number;
  daysRemaining: number;
}

export function useEmployeeAbsences(businessId: string) {
  const { user } = useAuth();
  
  const [absences, setAbsences] = useState<EmployeeAbsence[]>([]);
  const [vacationBalance, setVacationBalance] = useState<VacationBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch ausencias del empleado
  const fetchAbsences = useCallback(async () => {
    if (!user || !businessId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('employee_absences')
        .select('*')
        .eq('business_id', businessId)
        .eq('employee_id', user.id)
        .order('start_date', { ascending: false });

      if (error) throw error;

      setAbsences(
        data.map((absence) => ({
          id: absence.id,
          businessId: absence.business_id,
          absenceType: absence.absence_type,
          startDate: absence.start_date,
          endDate: absence.end_date,
          reason: absence.reason,
          employeeNotes: absence.employee_notes,
          adminNotes: absence.admin_notes,
          status: absence.status,
          approvedBy: absence.approved_by,
          approvedAt: absence.approved_at,
          createdAt: absence.created_at,
        }))
      );
    } catch (error) {
      toast.error('No se pudieron cargar las ausencias');
    } finally {
      setLoading(false);
    }
  }, [user, businessId]);

  // Fetch balance de vacaciones
  const fetchVacationBalance = useCallback(async () => {
    if (!user || !businessId) return;

    try {
      const currentYear = new Date().getFullYear();
      
      const { data, error } = await supabase
        .from('vacation_balance')
        .select('*')
        .eq('business_id', businessId)
        .eq('employee_id', user.id)
        .eq('year', currentYear)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignorar "no rows" error

      if (data) {
        setVacationBalance({
          year: data.year,
          totalDaysAvailable: data.total_days_available,
          daysUsed: data.days_used,
          daysPending: data.days_pending,
          daysRemaining: data.total_days_available - data.days_used - data.days_pending,
        });
      } else {
        // No hay balance aún, obtener configuración del negocio
        const { data: businessData } = await supabase
          .from('businesses')
          .select('vacation_days_per_year')
          .eq('id', businessId)
          .single();

        if (businessData) {
          setVacationBalance({
            year: currentYear,
            totalDaysAvailable: businessData.vacation_days_per_year || 15,
            daysUsed: 0,
            daysPending: 0,
            daysRemaining: businessData.vacation_days_per_year || 15,
          });
        }
      }
    } catch {
      // Error fetching vacation balance
    }
  }, [user, businessId]);

  // Solicitar ausencia
  const requestAbsence = async (request: AbsenceRequest): Promise<boolean> => {
    if (!user || !businessId) {
      toast.error('Debe estar autenticado');
      return false;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('request-absence', {
        body: {
          businessId,
          ...request,
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error);
      }

      toast.success(data.message || 'Su solicitud ha sido enviada exitosamente');

      // Refrescar datos
      setRefreshKey((prev) => prev + 1);
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Cancelar solicitud pendiente
  const cancelAbsence = async (absenceId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('employee_absences')
        .update({ status: 'cancelled' })
        .eq('id', absenceId)
        .eq('employee_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;

      toast.success('La solicitud ha sido cancelada exitosamente');

      setRefreshKey((prev) => prev + 1);
      return true;
    } catch {
      toast.error('No se pudo cancelar la solicitud');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar y cuando cambie el refreshKey
  useEffect(() => {
    fetchAbsences();
    fetchVacationBalance();
  }, [fetchAbsences, fetchVacationBalance, refreshKey]);

  return {
    absences,
    vacationBalance,
    loading,
    requestAbsence,
    cancelAbsence,
    refresh: () => setRefreshKey((prev) => prev + 1),
  };
}
