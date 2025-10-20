import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export type TimeOffType = 'vacation' | 'emergency' | 'sick_leave' | 'personal' | 'other';
export type TimeOffStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface TimeOffRequest {
  id: string;
  created_at: string;
  updated_at: string;
  employee_id: string;
  business_id: string;
  absence_type: TimeOffType;
  start_date: string;
  end_date: string;
  status: TimeOffStatus;
  reason: string;
  employee_notes: string | null;
  admin_notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  appointments_cancelled_count: number;
  appointments_cancelled_at: string | null;
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
        .from('employee_absences')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

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
        .from('employee_absences')
        .insert({
          employee_id: employeeId,
          business_id: businessId,
          absence_type: type,
          start_date: startDate,
          end_date: endDate,
          reason: notes || '',
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
        .from('employee_absences')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .eq('employee_id', employeeId)
        .eq('status', 'pending');

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
