import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export type TimeOffType = 'vacation' | 'sick_leave' | 'personal' | 'unpaid' | 'bereavement' | 'maternity' | 'paternity';
export type TimeOffStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface TimeOffRequest {
  id: string;
  created_at: string;
  employee_id: string;
  business_id: string;
  location_id: string | null;
  type: TimeOffType;
  start_date: string;
  end_date: string;
  total_days: number;
  status: TimeOffStatus;
  employee_notes: string | null;
  manager_notes: string | null;
  rejection_reason: string | null;
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  cancelled_at: string | null;
}

interface UseEmployeeTimeOffResult {
  requests: TimeOffRequest[];
  loading: boolean;
  error: string | null;
  createRequest: (
    businessId: string,
    type: TimeOffType,
    startDate: string,
    endDate: string,
    notes?: string
  ) => Promise<void>;
  cancelRequest: (requestId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook para gestionar solicitudes de tiempo libre (vacaciones, ausencias)
 * @param employeeId - ID del empleado
 * @param businessId - (Opcional) Filtrar por negocio específico
 */
export function useEmployeeTimeOff(
  employeeId: string | null | undefined,
  businessId?: string | null
): UseEmployeeTimeOffResult {
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!employeeId) {
      setRequests([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('employee_time_off')
        .select('*')
        .eq('employee_id', employeeId)
        .order('requested_at', { ascending: false });

      if (businessId) {
        query = query.eq('business_id', businessId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setRequests(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar solicitudes';
      setError(errorMessage);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [employeeId, businessId]);

  const createRequest = async (
    businessId: string,
    type: TimeOffType,
    startDate: string,
    endDate: string,
    notes?: string
  ) => {
    if (!employeeId) {
      toast.error('No se pudo identificar al empleado');
      return;
    }

    try {
      // Validar fechas
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (end < start) {
        toast.error('La fecha de fin debe ser posterior a la fecha de inicio');
        return;
      }

      const { error: insertError } = await supabase
        .from('employee_time_off')
        .insert({
          employee_id: employeeId,
          business_id: businessId,
          type,
          start_date: startDate,
          end_date: endDate,
          employee_notes: notes || null,
          status: 'pending'
        });

      if (insertError) throw insertError;

      toast.success('Solicitud enviada correctamente');
      await fetchRequests(); // Refrescar lista
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear solicitud';
      toast.error(errorMessage);
      throw err;
    }
  };

  const cancelRequest = async (requestId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('employee_time_off')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .eq('employee_id', employeeId) // Seguridad: solo puede cancelar sus propias solicitudes
        .eq('status', 'pending'); // Solo se pueden cancelar solicitudes pendientes

      if (updateError) throw updateError;

      toast.success('Solicitud cancelada');
      await fetchRequests(); // Refrescar lista
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cancelar solicitud';
      toast.error(errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return {
    requests,
    loading,
    error,
    createRequest,
    cancelRequest,
    refetch: fetchRequests
  };
}
