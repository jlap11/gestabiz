import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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

/**
 * Hook para obtener los negocios donde un empleado/profesional está vinculado
 * @param employeeId - ID del empleado/profesional
 * @param includeIndependent - Si incluir negocios independientes (donde el empleado es owner)
 * @returns Objeto con businesses, loading, error, e isEmployeeOfAnyBusiness
 */
export function useEmployeeBusinesses(
  employeeId: string | null | undefined,
  includeIndependent: boolean = true
): UseEmployeeBusinessesResult {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!employeeId) {
      setBusinesses([]);
      setLoading(false);
      return;
    }

    const fetchEmployeeBusinesses = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔍 useEmployeeBusinesses - employeeId:', employeeId);
        console.log('🔍 useEmployeeBusinesses - includeIndependent:', includeIndependent);

        // 1. Obtener negocios donde el usuario es empleado (via business_employees)
        const { data: employeeBusinesses, error: employeeError } = await supabase
          .from('business_employees')
          .select(`
            business_id,
            businesses:business_id (
              id,
              name,
              description,
              logo_url,
              phone,
              email,
              address,
              city,
              state
            )
          `)
          .eq('employee_id', employeeId)
          .eq('status', 'approved')
          .eq('is_active', true);

        console.log('🔍 useEmployeeBusinesses - employeeBusinesses from business_employees:', employeeBusinesses);
        if (employeeError) console.error('❌ useEmployeeBusinesses - employeeError:', employeeError);
        if (employeeError) throw employeeError;

        // Mapear los negocios como empleado
        const businessesAsEmployee = (employeeBusinesses || [])
          .map((item) => {
            const biz = Array.isArray(item.businesses) 
              ? item.businesses[0] 
              : item.businesses;
            return biz;
          })
          .filter(Boolean);

        let allBusinesses = [...businessesAsEmployee];

        // 2. Si includeIndependent, obtener negocios donde el usuario es owner (independiente)
        if (includeIndependent) {
          const { data: ownedBusinesses, error: ownerError } = await supabase
            .from('businesses')
            .select('id, name, description, logo_url, phone, email, address, city, state')
            .eq('owner_id', employeeId)
            .eq('is_active', true);

          console.log('🔍 useEmployeeBusinesses - ownedBusinesses from businesses:', ownedBusinesses);
          if (ownerError) console.error('❌ useEmployeeBusinesses - ownerError:', ownerError);
          if (ownerError) throw ownerError;

          // Combinar y eliminar duplicados
          const employeeIds = businessesAsEmployee.map(b => b.id);
          
          const uniqueOwnedBusinesses = (ownedBusinesses || []).filter(
            b => !employeeIds.includes(b.id)
          );

          allBusinesses = [...businessesAsEmployee, ...uniqueOwnedBusinesses];
        }

        console.log('🔍 useEmployeeBusinesses - FINAL allBusinesses:', allBusinesses);
        setBusinesses(allBusinesses);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar negocios';
        setError(errorMessage);
        setBusinesses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeBusinesses();
  }, [employeeId, includeIndependent]);

  return {
    businesses,
    loading,
    error,
    isEmployeeOfAnyBusiness: businesses.length > 0
  };
}
