/**
 * Hook para gestionar solicitudes de tiempo libre (vacaciones, ausencias)
 * ✨ OPTIMIZADO: Usa React Query con deduplicación y caché de 5 minutos
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import QUERY_CONFIG from '@/lib/queryConfig';

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
 * Hook para gestionar solicitudes de tiempo libre
 * @param employeeId - ID del empleado
 * @param businessId - (Opcional) Filtrar por negocio específico
 */
export function useEmployeeTimeOff(
  employeeId: string | null | undefined,
  businessId?: string | null
): UseEmployeeTimeOffResult {
  const queryClient = useQueryClient();

  // Query key que incluye el filtro de negocio si existe
  const queryKey = businessId 
    ? ['time-off-requests', employeeId, businessId]
    : ['time-off-requests', employeeId];

  // Query para obtener solicitudes
  const { data: requests = [], isLoading: loading, error, refetch: refetchQuery } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!employeeId) return [];

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
      return data as TimeOffRequest[] || [];
    },
    ...QUERY_CONFIG.FREQUENT, // Caché corto (1 minuto) porque cambia frecuentemente
    enabled: !!employeeId,
  });

  // Mutation para crear solicitud
  const createRequestMutation = useMutation({
    mutationFn: async (
      params: {
        businessId: string;
        type: TimeOffType;
        startDate: string;
        endDate: string;
        notes?: string;
      }
    ) => {
      if (!employeeId) {
        throw new Error('No se pudo identificar al empleado');
      }

      const start = new Date(params.startDate);
      const end = new Date(params.endDate);
      
      if (end < start) {
        throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
      }

      const { error: insertError } = await supabase
        .from('employee_absences')
        .insert({
          employee_id: employeeId,
          business_id: params.businessId,
          absence_type: params.type,
          start_date: params.startDate,
          end_date: params.endDate,
          reason: params.notes || '',
          employee_notes: params.notes || null,
          status: 'pending'
        });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      toast.success('Solicitud enviada correctamente');
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Error al crear solicitud');
    },
  });

  // Mutation para cancelar solicitud
  const cancelRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
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
    },
    onSuccess: () => {
      toast.success('Solicitud cancelada');
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Error al cancelar solicitud');
    },
  });

  return {
    requests,
    loading: loading || createRequestMutation.isPending || cancelRequestMutation.isPending,
    error: error?.message || null,
    createRequest: async (businessId, type, startDate, endDate, notes) => {
      await createRequestMutation.mutateAsync({
        businessId,
        type,
        startDate,
        endDate,
        notes,
      });
    },
    cancelRequest: async (requestId) => {
      await cancelRequestMutation.mutateAsync(requestId);
    },
    refetch: async () => {
      await refetchQuery();
    },
  };
}
