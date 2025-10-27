import { useState, useEffect } from 'react';
import supabase from '@/lib/supabase';
import { EmployeeService, EmployeeServiceFilters } from '@/types/types';
import { toast } from 'sonner';

/**
 * Hook para gestionar servicios por empleado (employee_services)
 */
export function useEmployeeServices(filters?: EmployeeServiceFilters) {
  const [services, setServices] = useState<EmployeeService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch employee services
  const fetchEmployeeServices = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('employee_services')
        .select(`
          *,
          employee:profiles!employee_services_employee_id_fkey(*),
          service:services(*),
          location:locations(*)
        `);

      // Apply filters
      if (filters?.employee_id) query = query.eq('employee_id', filters.employee_id);
      if (filters?.service_id) query = query.eq('service_id', filters.service_id);
      if (filters?.business_id) query = query.eq('business_id', filters.business_id);
      if (filters?.location_id) query = query.eq('location_id', filters.location_id);
      if (filters?.is_active !== undefined) query = query.eq('is_active', filters.is_active);
      if (filters?.min_expertise_level) query = query.gte('expertise_level', filters.min_expertise_level);

      query = query.order('created_at', { ascending: false });

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setServices(data || []);
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast.error(`Error al cargar servicios del empleado: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Add service to employee
  const addServiceToEmployee = async (
    employeeId: string,
    serviceId: string,
    businessId: string,
    locationId: string,
    expertiseLevel: 1 | 2 | 3 | 4 | 5 = 3,
    commissionPercentage?: number
  ) => {
    try {
      let finalCommission = commissionPercentage;
      // Si no se proporciona comisión, usar la del servicio (si existe)
      if (finalCommission === undefined || finalCommission === null || Number.isNaN(finalCommission)) {
        const { data: svc, error: svcErr } = await supabase
          .from('services')
          .select('commission_percentage')
          .eq('id', serviceId)
          .single();
        if (!svcErr && svc) {
          finalCommission = (svc as any).commission_percentage ?? undefined;
        }
      }
      const { data, error: insertError } = await supabase
        .from('employee_services')
        .insert({
          employee_id: employeeId,
          service_id: serviceId,
          business_id: businessId,
          location_id: locationId,
          expertise_level: expertiseLevel,
          commission_percentage: finalCommission,
          is_active: true,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success('Servicio asignado al empleado exitosamente');
      fetchEmployeeServices();
      return data;
    } catch (err) {
      const error = err as Error;
      toast.error(`Error al asignar servicio: ${error.message}`);
      throw error;
    }
  };

  // Update employee service
  const updateEmployeeService = async (
    employeeServiceId: string,
    updates: {
      expertise_level?: 1 | 2 | 3 | 4 | 5;
      commission_percentage?: number;
      is_active?: boolean;
      notes?: string;
    }
  ) => {
    try {
      const { error: updateError } = await supabase
        .from('employee_services')
        .update(updates)
        .eq('id', employeeServiceId);

      if (updateError) throw updateError;

      toast.success('Servicio actualizado exitosamente');
      fetchEmployeeServices();
    } catch (err) {
      const error = err as Error;
      toast.error(`Error al actualizar servicio: ${error.message}`);
      throw error;
    }
  };

  // Remove service from employee
  const removeServiceFromEmployee = async (employeeServiceId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('employee_services')
        .delete()
        .eq('id', employeeServiceId);

      if (deleteError) throw deleteError;

      toast.success('Servicio removido del empleado');
      fetchEmployeeServices();
    } catch (err) {
      const error = err as Error;
      toast.error(`Error al remover servicio: ${error.message}`);
      throw error;
    }
  };

  // Get employees that offer a specific service at a location
  const getEmployeesForService = async (serviceId: string, locationId: string): Promise<EmployeeService[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('employee_services')
        .select(`
          *,
          employee:profiles!employee_services_employee_id_fkey(*)
        `)
        .eq('service_id', serviceId)
        .eq('location_id', locationId)
        .eq('is_active', true)
        .order('expertise_level', { ascending: false });

      if (fetchError) throw fetchError;

      return data || [];
    } catch (err) {
      const error = err as Error;
      toast.error(`Error al buscar empleados: ${error.message}`);
      throw error;
    }
  };

  useEffect(() => {
    fetchEmployeeServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters?.employee_id,
    filters?.service_id,
    filters?.business_id,
    filters?.location_id,
    filters?.is_active,
    filters?.min_expertise_level,
  ]);

  return {
    services,
    loading,
    error,
    addServiceToEmployee,
    updateEmployeeService,
    removeServiceFromEmployee,
    getEmployeesForService,
    refetch: fetchEmployeeServices,
  };
}
