/**
 * useBusinessEmployeesForChat Hook
 * 
 * Obtiene empleados de un negocio que permiten recibir mensajes de clientes.
 * Filtra por `allow_client_messages = true` y `is_active = true`.
 * 
 * @author Gestabiz Team
 * @version 1.0.0
 * @date 2025-10-19
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

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
  const [employees, setEmployees] = useState<BusinessEmployeeForChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    if (!businessId || !enabled) return;

    try {
      setLoading(true);
      setError(null);

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
        setEmployees([]);
        return;
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

      setEmployees(mappedEmployees);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error fetching employees for chat:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar empleados');
    } finally {
      setLoading(false);
    }
  }, [businessId, enabled]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return {
    employees,
    loading,
    error,
    refetch: fetchEmployees,
  };
}
