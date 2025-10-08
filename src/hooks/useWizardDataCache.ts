import { useEffect, useState } from 'react';
import supabase from '@/lib/supabase';
import type { Location, Service } from '@/types/types';

interface Employee {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  avatar_url: string | null;
}

interface BusinessEmployeeAssignment {
  employee_id: string;
}

interface WizardDataCache {
  locations: Location[];
  services: Service[];
  employees: Employee[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook para pre-cargar todos los datos del wizard de una sola vez
 * Esto evita múltiples llamadas a Supabase y mejora la UX
 */
export function useWizardDataCache(businessId: string | null) {
  const [cache, setCache] = useState<WizardDataCache>({
    locations: [],
    services: [],
    employees: [],
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!businessId) {
      setCache({
        locations: [],
        services: [],
        employees: [],
        loading: false,
        error: null,
      });
      return;
    }

    const loadAllData = async () => {
      setCache(prev => ({ ...prev, loading: true, error: null }));

      try {
        // Ejecutar todas las consultas en paralelo para máxima velocidad
        const [locationsResult, servicesResult, businessEmployeesResult] = await Promise.all([
          // Cargar sedes
          supabase
            .from('locations')
            .select('*')
            .eq('business_id', businessId)
            .eq('is_active', true)
            .order('name'),

          // Cargar servicios
          supabase
            .from('services')
            .select('*')
            .eq('business_id', businessId)
            .eq('is_active', true)
            .order('name'),

          // Cargar asignaciones de empleados
          supabase
            .from('business_employees')
            .select('employee_id')
            .eq('business_id', businessId)
            .eq('status', 'approved')
            .eq('is_active', true),
        ]);

        // Obtener los IDs de empleados
        const employeeIds = (businessEmployeesResult.data as BusinessEmployeeAssignment[] || [])
          .map((item) => item.employee_id);

        // Consulta separada para obtener datos de empleados
        const employeesResult = employeeIds.length > 0
          ? await supabase
              .from('profiles')
              .select('id, email, full_name, role, avatar_url')
              .in('id', employeeIds)
              .order('full_name')
          : { data: [], error: null };

        // Verificar errores
        if (locationsResult.error) throw new Error(`Locations: ${locationsResult.error.message}`);
        if (servicesResult.error) throw new Error(`Services: ${servicesResult.error.message}`);
        if (businessEmployeesResult.error) throw new Error(`Business Employees: ${businessEmployeesResult.error.message}`);
        if (employeesResult.error) throw new Error(`Employees: ${employeesResult.error.message}`);

        setCache({
          locations: (locationsResult.data as Location[]) || [],
          services: (servicesResult.data as Service[]) || [],
          employees: (employeesResult.data as Employee[]) || [],
          loading: false,
          error: null,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error al cargar datos';
        setCache({
          locations: [],
          services: [],
          employees: [],
          loading: false,
          error: message,
        });
      }
    };

    loadAllData();
  }, [businessId]);

  return cache;
}
