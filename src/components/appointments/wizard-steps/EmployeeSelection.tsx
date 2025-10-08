import React, { useEffect, useState } from 'react';
import { UserCircle2, Briefcase, Star, Loader2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import supabase from '@/lib/supabase';
import { toast } from 'sonner';

interface Employee {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  avatar_url: string | null;
}

interface BusinessEmployeeJoin {
  employee_id: string;
}

interface EmployeeSelectionProps {
  businessId: string;
  serviceId: string;
  selectedEmployeeId: string | null;
  onSelectEmployee: (employee: Employee) => void;
  preloadedEmployees?: Employee[]; // Datos pre-cargados
}

export function EmployeeSelection({ 
  businessId, 
  serviceId,
  selectedEmployeeId, 
  onSelectEmployee,
  preloadedEmployees 
}: Readonly<EmployeeSelectionProps>) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(!preloadedEmployees);

  useEffect(() => {
    // Si ya tenemos datos pre-cargados, usarlos (MÁS RÁPIDO)
    if (preloadedEmployees) {
      setEmployees(preloadedEmployees);
      setLoading(false);
      return;
    }

    // Si no, hacer la consulta tradicional
    const fetchEmployees = async () => {
      if (!businessId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // 1. Obtener IDs de empleados asignados al negocio
        const { data: assignments, error: assignError } = await supabase
          .from('business_employees')
          .select('employee_id')
          .eq('business_id', businessId)
          .eq('status', 'approved')
          .eq('is_active', true);

        if (assignError) {
          toast.error(`Error al cargar asignaciones: ${assignError.message}`);
          setEmployees([]);
          return;
        }

        // 2. Obtener IDs
        const employeeIds = (assignments || []).map((item: BusinessEmployeeJoin) => item.employee_id);

        if (employeeIds.length === 0) {
          setEmployees([]);
          return;
        }

        // 3. Consulta separada para obtener datos de empleados
        const { data: employeesData, error: empError } = await supabase
          .from('profiles')
          .select('id, email, full_name, role, avatar_url')
          .in('id', employeeIds)
          .order('full_name');

        if (empError) {
          toast.error(`Error al cargar profesionales: ${empError.message}`);
          setEmployees([]);
          return;
        }

        setEmployees(employeesData || []);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error inesperado';
        toast.error(`Error: ${message}`);
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [businessId, serviceId, preloadedEmployees]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <span className="ml-3 text-gray-400">Cargando profesionales...</span>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6">
        <Users className="h-16 w-16 text-gray-600 mb-4" />
        <p className="text-gray-400 text-center">
          No hay profesionales disponibles para este servicio.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">
          Selecciona un Profesional
        </h3>
        <p className="text-gray-400 text-sm">
          Elige el profesional con quien deseas tu cita
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map((employee) => (
          <button
            key={employee.id}
            onClick={() => onSelectEmployee(employee)}
            className={cn(
              "relative group rounded-xl p-6 text-left transition-all duration-200 border-2",
              "hover:scale-[1.02] hover:shadow-xl",
              selectedEmployeeId === employee.id
                ? "bg-purple-500/20 border-purple-500 shadow-lg shadow-purple-500/20"
                : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
            )}
          >
            {/* Selected indicator */}
            {selectedEmployeeId === employee.id && (
              <div className="absolute top-3 right-3 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
            )}

            {/* Employee Avatar */}
            <div className="flex flex-col items-center mb-4">
              {employee.avatar_url ? (
                <img
                  src={employee.avatar_url}
                  alt={employee.full_name || 'Employee'}
                  className="w-20 h-20 rounded-full object-cover border-2 border-white/20 mb-3"
                />
              ) : (
                <div className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center mb-3 border-2",
                  selectedEmployeeId === employee.id 
                    ? "bg-purple-500/30 border-purple-500" 
                    : "bg-white/10 border-white/20 group-hover:bg-white/20"
                )}>
                  <UserCircle2 className={cn(
                    "h-12 w-12",
                    selectedEmployeeId === employee.id ? "text-purple-400" : "text-gray-400"
                  )} />
                </div>
              )}

              {/* Employee Name */}
              <h4 className="text-lg font-semibold text-white text-center">
                {employee.full_name || 'Profesional'}
              </h4>

              {/* Role Badge */}
              <div className={cn(
                "mt-2 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1",
                selectedEmployeeId === employee.id
                  ? "bg-purple-500/30 text-purple-300"
                  : "bg-white/10 text-gray-400"
              )}>
                <Briefcase className="h-3 w-3" />
                <span className="capitalize">{employee.role === 'admin' ? 'Administrador' : 'Empleado'}</span>
              </div>
            </div>

            {/* Email */}
            <div className="text-center">
              <p className="text-sm text-gray-400 truncate">
                {employee.email}
              </p>
            </div>

            {/* Rating (placeholder - puede agregarse después) */}
            <div className="flex justify-center items-center gap-1 mt-3 text-yellow-500">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="h-4 w-4 fill-current" />
              ))}
              <span className="text-xs text-gray-400 ml-2">(5.0)</span>
            </div>

            {/* Hover Effect Border */}
            <div className={cn(
              "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none",
              "bg-gradient-to-br from-purple-500/10 to-transparent"
            )} />
          </button>
        ))}
      </div>
    </div>
  );
}
