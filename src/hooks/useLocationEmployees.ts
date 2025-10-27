/**
 * useLocationEmployees Hook
 * 
 * Obtiene empleados que trabajan en una sede específica.
 * Incluye información del perfil del empleado y servicios que ofrece.
 * 
 * @author Gestabiz Team
 * @version 1.0.0
 * @date 2025-01-20
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import QUERY_CONFIG from '@/lib/queryConfig';

export interface LocationEmployee {
  employee_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: string;
  job_title: string | null;
  employee_type: string | null;
  offers_services: boolean;
  is_active: boolean;
  services_count: number;
  services: Array<{
    service_id: string;
    service_name: string;
    expertise_level: number;
  }>;
}

interface UseLocationEmployeesOptions {
  locationId: string;
  businessId: string;
  enabled?: boolean;
}

export function useLocationEmployees({ 
  locationId, 
  businessId,
  enabled = true 
}: UseLocationEmployeesOptions) {
  const { data: employees = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: ['location-employees', locationId, businessId],
    queryFn: async () => {
      if (!locationId || !businessId) return [];

      // Obtener empleados de la sede
      const { data: employeesData, error: employeesError } = await supabase
        .from('business_employees')
        .select(`
          employee_id,
          role,
          job_title,
          employee_type,
          offers_services,
          is_active,
          profiles!business_employees_employee_id_fkey (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('business_id', businessId)
        .or(`location_id.eq.${locationId},location_id.is.null`)
        .eq('is_active', true)
        .eq('status', 'approved');

      if (employeesError) throw employeesError;

      if (!employeesData || employeesData.length === 0) {
        return [];
      }

      // Obtener servicios de cada empleado en esta sede
      const employeeIds = employeesData.map(emp => emp.employee_id);
      
      const { data: servicesData, error: servicesError } = await supabase
        .from('employee_services')
        .select(`
          employee_id,
          service_id,
          expertise_level,
          services!employee_services_service_id_fkey (
            id,
            name
          )
        `)
        .in('employee_id', employeeIds)
        .eq('business_id', businessId)
        .eq('location_id', locationId)
        .eq('is_active', true);

      if (servicesError) throw servicesError;

      // Mapear empleados con sus servicios
      const mappedEmployees: LocationEmployee[] = employeesData.map(emp => {
        const profiles = emp.profiles as unknown as { 
          id: string; 
          full_name: string; 
          email: string; 
          avatar_url: string | null 
        };

        const employeeServices = (servicesData || [])
          .filter(service => service.employee_id === emp.employee_id)
          .map(service => {
            const serviceData = service.services as unknown as { id: string; name: string };
            return {
              service_id: service.service_id,
              service_name: serviceData?.name || 'Servicio',
              expertise_level: service.expertise_level || 3,
            };
          });

        return {
          employee_id: emp.employee_id,
          full_name: profiles?.full_name || 'Empleado',
          email: profiles?.email || '',
          avatar_url: profiles?.avatar_url || null,
          role: emp.role || 'employee',
          job_title: emp.job_title || null,
          employee_type: emp.employee_type || null,
          offers_services: emp.offers_services || false,
          is_active: emp.is_active || false,
          services_count: employeeServices.length,
          services: employeeServices,
        };
      });

      // Ordenar por rol (managers primero) y luego por nombre
      return mappedEmployees.sort((a, b) => {
        if (a.role === 'manager' && b.role !== 'manager') return -1;
        if (b.role === 'manager' && a.role !== 'manager') return 1;
        return a.full_name.localeCompare(b.full_name);
      });
    },
    ...QUERY_CONFIG.STABLE, // 5 minutos de caché
    enabled: enabled && !!locationId && !!businessId,
  });

  return {
    employees,
    loading,
    error: error?.message || null,
    refetch,
  };
}