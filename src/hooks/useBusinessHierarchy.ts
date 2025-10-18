/**
 * @file useBusinessHierarchy.ts
 * @description React Query hook para gestión de jerarquía de empleados de un negocio
 * Provee datos, filtros, mutations y cache management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { hierarchyService, type HierarchyUpdateData, type SupervisorAssignment } from '@/lib/hierarchyService';

// =====================================================
// TIPOS
// =====================================================

export interface HierarchyFilters {
  searchQuery?: string;
  hierarchyLevel?: number | null;
  employeeType?: string | null;
  departmentId?: string | null;
  location_id?: string | null; // Filtro por sede
}

export interface EmployeeHierarchy {
  employee_id: string;
  full_name: string;
  email: string;
  role: string;
  employee_type: string;
  hierarchy_level: number;
  job_title: string | null;
  reports_to: string | null;
  supervisor_name: string | null;
  location_id: string | null;
  location_name: string | null;
  direct_reports_count: number;
  all_reports_count: number;
  occupancy_rate: number | null;
  average_rating: number | null;
  gross_revenue: number | null;
  total_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  total_reviews: number;
  services_offered: Array<{
    service_id: string;
    service_name: string;
    expertise_level: string;
    commission_percentage: number;
  }> | null;
  is_active: boolean;
  hired_at: string | null;
  phone: string | null;
  avatar_url: string | null;
}

// =====================================================
// HOOK PRINCIPAL
// =====================================================

/**
 * Hook para gestión de jerarquía de empleados de un negocio
 * @param businessId - ID del negocio
 * @param initialFilters - Filtros iniciales (opcional)
 */
export function useBusinessHierarchy(businessId: string | null, initialFilters?: HierarchyFilters) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<HierarchyFilters>(initialFilters || {});

  // =====================================================
  // QUERY: Obtener jerarquía
  // =====================================================

  const {
    data: rawData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['businessHierarchy', businessId],
    queryFn: async () => {
      if (!businessId) return null;

      // Calcular últimos 30 días por defecto
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const { data, error } = await supabase.rpc('get_business_hierarchy', {
        p_business_id: businessId,
        p_start_date: startDate.toISOString().split('T')[0],
        p_end_date: endDate.toISOString().split('T')[0],
        p_filters: {},
      });

      if (error) throw new Error(error.message);
      
      return (data || []) as EmployeeHierarchy[];
    },
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    gcTime: 10 * 60 * 1000, // Mantener en memoria 10 minutos
  });

  // =====================================================
  // FILTRADO EN CLIENTE
  // =====================================================

  const filteredData = useMemo(() => {
    if (!rawData) return [];

    let result = [...rawData];

    // Filtro por búsqueda (nombre o email)
    if (filters.searchQuery?.trim()) {
      const query = filters.searchQuery.toLowerCase().trim();
      result = result.filter(
        emp =>
          emp.full_name?.toLowerCase().includes(query) ||
          emp.email?.toLowerCase().includes(query) ||
          emp.job_title?.toLowerCase().includes(query)
      );
    }

    // Filtro por nivel jerárquico
    if (filters.hierarchyLevel !== undefined && filters.hierarchyLevel !== null) {
      result = result.filter(emp => emp.hierarchy_level === filters.hierarchyLevel);
    }

    // Filtro por tipo de empleado
    if (filters.employeeType) {
      result = result.filter(emp => emp.employee_type === filters.employeeType);
    }

    // Filtro por sede/ubicación
    if (filters.location_id) {
      result = result.filter(emp => emp.location_id === filters.location_id);
    }

    // Filtro por ubicación (departmentId - legacy)
    if (filters.departmentId) {
      result = result.filter(emp => emp.location_id === filters.departmentId);
    }

    return result;
  }, [rawData, filters]);

  // =====================================================
  // MUTATION: Actualizar jerarquía
  // =====================================================

  const updateHierarchyMutation = useMutation({
    mutationFn: async (data: HierarchyUpdateData) => {
      const result = await hierarchyService.updateEmployeeHierarchy(data);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      // Invalidar cache para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['businessHierarchy', businessId] });
    },
  });

  // =====================================================
  // MUTATION: Asignar supervisor
  // =====================================================

  const assignSupervisorMutation = useMutation({
    mutationFn: async (assignment: SupervisorAssignment) => {
      const result = await hierarchyService.assignSupervisor(assignment);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businessHierarchy', businessId] });
    },
  });

  // =====================================================
  // MUTATION: Actualizar job title
  // =====================================================

  const updateJobTitleMutation = useMutation({
    mutationFn: async ({ employeeId, jobTitle }: { employeeId: string; jobTitle: string | null }) => {
      if (!businessId) throw new Error('businessId es requerido');
      const result = await hierarchyService.updateJobTitle(employeeId, businessId, jobTitle);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businessHierarchy', businessId] });
    },
  });

  // =====================================================
  // MUTATION: Validar cambio (sin aplicar)
  // =====================================================

  const validateChangeMutation = useMutation({
    mutationFn: async (data: HierarchyUpdateData) => {
      const result = await hierarchyService.validateHierarchyChange(data);
      return result;
    },
  });

  // =====================================================
  // HELPERS
  // =====================================================

  /**
   * Actualiza filtros y resetea a valores válidos
   */
  const updateFilters = (newFilters: Partial<HierarchyFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  /**
   * Limpia todos los filtros
   */
  const clearFilters = () => {
    setFilters({});
  };

  /**
   * Obtiene empleado por ID
   */
  const getEmployeeById = (userId: string): EmployeeHierarchy | undefined => {
    return rawData?.find(emp => emp.employee_id === userId);
  };

  /**
   * Obtiene subordinados directos de un empleado
   */
  const getDirectReports = (userId: string): EmployeeHierarchy[] => {
    return rawData?.filter(emp => emp.reports_to === userId) || [];
  };

  /**
   * Obtiene la cadena completa de supervisores (desde empleado hasta el top)
   */
  const getReportingChain = (userId: string): EmployeeHierarchy[] => {
    const chain: EmployeeHierarchy[] = [];
    let currentEmployee = getEmployeeById(userId);

    while (currentEmployee?.reports_to) {
      const supervisor = getEmployeeById(currentEmployee.reports_to);
      if (!supervisor) break;
      chain.push(supervisor);
      currentEmployee = supervisor;

      // Prevenir ciclos infinitos
      if (chain.length > 20) break;
    }

    return chain;
  };

  /**
   * Obtiene todos los subordinados recursivamente (árbol completo)
   */
  const getAllSubordinates = (userId: string): EmployeeHierarchy[] => {
    const subordinates: EmployeeHierarchy[] = [];
    const directReports = getDirectReports(userId);

    for (const report of directReports) {
      subordinates.push(report);
      // Recursivamente agregar subordinados de este empleado
      const subReports = getAllSubordinates(report.employee_id);
      subordinates.push(...subReports);

      // Prevenir recursión infinita
      if (subordinates.length > 200) break;
    }

    return subordinates;
  };

  // =====================================================
  // RETURN
  // =====================================================

  return {
    // Datos
    data: filteredData,
    rawData,
    isLoading,
    error,

    // Filtros
    filters,
    updateFilters,
    clearFilters,

    // Acciones (mutations)
    updateHierarchy: updateHierarchyMutation.mutate,
    updateHierarchyAsync: updateHierarchyMutation.mutateAsync,
    isUpdating: updateHierarchyMutation.isPending,
    updateError: updateHierarchyMutation.error,

    assignSupervisor: assignSupervisorMutation.mutate,
    assignSupervisorAsync: assignSupervisorMutation.mutateAsync,
    isAssigning: assignSupervisorMutation.isPending,
    assignError: assignSupervisorMutation.error,

    updateJobTitle: updateJobTitleMutation.mutate,
    updateJobTitleAsync: updateJobTitleMutation.mutateAsync,
    isUpdatingJobTitle: updateJobTitleMutation.isPending,
    updateJobTitleError: updateJobTitleMutation.error,

    validateChange: validateChangeMutation.mutate,
    validateChangeAsync: validateChangeMutation.mutateAsync,
    isValidating: validateChangeMutation.isPending,
    validationResult: validateChangeMutation.data,

    // Helpers
    refetch,
    getEmployeeById,
    getDirectReports,
    getReportingChain,
    getAllSubordinates,
  };
}

export default useBusinessHierarchy;
