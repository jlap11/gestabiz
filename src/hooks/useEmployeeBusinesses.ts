import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import QUERY_CONFIG from '@/lib/queryConfig';

interface Business {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
}

interface UseEmployeeBusinessesResult {
  businesses: Business[];
  loading: boolean;
  error: string | null;
  isEmployeeOfAnyBusiness: boolean;
}

export function useEmployeeBusinesses(
  employeeId: string | null | undefined,
  includeIndependent: boolean = true
): UseEmployeeBusinessesResult {
  const { data: businesses = [], isLoading: loading, error } = useQuery({
    queryKey: ['employee-businesses', employeeId, includeIndependent],
    queryFn: async () => {
      if (!employeeId) return [];

      try {
        // Intentar RPC combinada para reducir a una llamada
        const { data, error: rpcError } = await supabase.rpc('get_user_businesses', {
          p_user_id: employeeId,
          p_include_owner: includeIndependent,
        });

        if (!rpcError && data) {
          return (data as Business[]) || [];
        }

        // Fallback: dos consultas separadas
        const { data: employeeBusinesses, error: employeeError } = await supabase
          .from('business_employees')
          .select(`
            business_id,
            businesses:business_id (
              id, name, description, logo_url, phone, email, address, city, state
            )
          `)
          .eq('employee_id', employeeId)
          .eq('status', 'approved')
          .eq('is_active', true);

        if (employeeError) throw employeeError;

        const businessesAsEmployee = (employeeBusinesses || [])
          .map((item) => {
            const biz = Array.isArray(item.businesses) 
              ? item.businesses[0] 
              : item.businesses;
            return biz;
          })
          .filter(Boolean);

        let allBusinesses = [...businessesAsEmployee];

        if (includeIndependent) {
          const { data: ownedBusinesses, error: ownerError } = await supabase
            .from('businesses')
            .select('id, name, description, logo_url, phone, email, address, city, state')
            .eq('owner_id', employeeId)
            .eq('is_active', true);

          if (ownerError) throw ownerError;

          const employeeIds = businessesAsEmployee.map(b => b.id);
          const uniqueOwnedBusinesses = (ownedBusinesses || []).filter(
            b => !employeeIds.includes(b.id)
          );

          allBusinesses = [...businessesAsEmployee, ...uniqueOwnedBusinesses];
        }

        return allBusinesses;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar negocios';
        throw new Error(errorMessage);
      }
    },
    ...QUERY_CONFIG.STABLE,
    enabled: !!employeeId,
  });

  return {
    businesses,
    loading,
    error: error?.message || null,
    isEmployeeOfAnyBusiness: businesses.length > 0
  };
}
