/**
 * useBusinessEmployeesForChat Hook
 * 
 * Obtiene empleados de un negocio que permiten recibir mensajes de clientes.
 * Filtra por `allow_client_messages = true` y `is_active = true`.
 * 
 * ✨ OPTIMIZADO: Usa React Query con deduplicación y caché de 5 minutos
 * 
 * @author Gestabiz Team
 * @version 2.0.0 (React Query)
 * @date 2025-10-20
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import QUERY_CONFIG from '@/lib/queryConfig';

export interface BusinessEmployeeForChat {
  employee_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: string;
  location_id: string | null;
  location_name: string | null;
}

interface UseBusinessEmployeesForChatOptions {
  businessId: string;
  enabled?: boolean;
}

export function useBusinessEmployeesForChat({ 
  businessId, 
  enabled = true 
}: UseBusinessEmployeesForChatOptions) {
  const { data: employees = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: QUERY_CONFIG.KEYS.BUSINESS_EMPLOYEES(businessId),
    queryFn: async () => {
      if (!businessId) return [];

      // Fetch employees with allow_client_messages = true
      const { data: employeesData, error: employeesError } = await supabase
        .from('business_employees')
        .select(`
          employee_id,
          role,
          profiles!business_employees_employee_id_fkey (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('business_id', businessId)
        .eq('is_active', true)
        .eq('allow_client_messages', true);

      if (employeesError) throw employeesError;

      // Fetch first location of the business for all employees
      const { data: locationsData, error: locationsError } = await supabase
        .from('locations')
        .select('id, name')
        .eq('business_id', businessId)
        .limit(1)
        .single();

      if (locationsError && locationsError.code !== 'PGRST116') {
        throw locationsError;
      }

      if (!employeesData || employeesData.length === 0) {
        return [];
      }

      // Map to interface
      const mappedEmployees: BusinessEmployeeForChat[] = employeesData.map(emp => {
        const profiles = emp.profiles as unknown as { id: string; full_name: string; email: string; avatar_url: string | null };
        // Managers (owners) no muestran ubicación (trabajan en todas las sedes)
        const isManager = emp.role === 'manager';
        
        return {
          employee_id: emp.employee_id,
          full_name: profiles?.full_name || 'Empleado',
          email: profiles?.email || '',
          avatar_url: profiles?.avatar_url || null,
          role: emp.role || 'employee',
          location_id: isManager ? null : (locationsData?.id || null),
          location_name: isManager ? null : (locationsData?.name || null),
        };
      });

      return mappedEmployees;
    },
    ...QUERY_CONFIG.STABLE, // 5 minutos de caché
    enabled: enabled && !!businessId,
  });

  return {
    employees,
    loading,
    error: error?.message || null,
    refetch,
  };
}
