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
  expertise_level?: number; // Nivel de experiencia 1-5
  average_rating?: number; // Calificación promedio
  total_reviews?: number; // Total de reviews
}

interface EmployeeSelectionProps {
  businessId: string;
  locationId: string; // NUEVO: Sede seleccionada
  serviceId: string;
  selectedEmployeeId: string | null;
  onSelectEmployee: (employee: Employee) => void;
}

export function EmployeeSelection({ 
  businessId, 
  locationId,
  serviceId,
  selectedEmployeeId, 
  onSelectEmployee,
}: Readonly<EmployeeSelectionProps>) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /**
     * NUEVA LÓGICA: Filtrar empleados que:
     * 1. Ofrezcan el servicio seleccionado (employee_services)
     * 2. Estén asignados a la sede seleccionada o sin sede específica
     * 3. Estén activos y aprobados
     * 4. Incluir nivel de experiencia y calificaciones
     */
    const fetchEmployeesForService = async () => {
      if (!businessId || !locationId || !serviceId) {
        setEmployees([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Consulta de employee_services para obtener empleados que ofrecen el servicio
        // en la sede seleccionada, ordenados por expertise_level (mayor primero)
        const { data: employeeServices, error: servicesError } = await supabase
          .from('employee_services')
          .select(`
            employee_id,
            expertise_level,
            employee:profiles!employee_services_employee_id_fkey(
              id,
              email,
              full_name,
              role,
              avatar_url
            )
          `)
          .eq('service_id', serviceId)
          .eq('location_id', locationId)
          .eq('business_id', businessId)
          .eq('is_active', true)
          .order('expertise_level', { ascending: false });

        if (servicesError) {
          toast.error(`Error al cargar profesionales: ${servicesError.message}`);
          setEmployees([]);
          return;
        }

        if (!employeeServices || employeeServices.length === 0) {
          setEmployees([]);
          return;
        }

        // Obtener IDs de empleados (usando 'any' para evitar conflictos de tipos con Supabase)
        const employeeIds = employeeServices
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((es: any) => es.employee?.id)
          .filter((id: string | undefined): id is string => id !== null && id !== undefined);

        if (employeeIds.length === 0) {
          setEmployees([]);
          return;
        }

        // Obtener calificaciones promedio de reviews para cada empleado
        const { data: reviews } = await supabase
          .from('reviews')
          .select('employee_id, rating')
          .in('employee_id', employeeIds)
          .eq('is_visible', true);

        // Calcular rating promedio y total reviews por empleado
        const reviewStats = reviews?.reduce((acc: Record<string, { avg: number; count: number }>, review) => {
          const empId = review.employee_id;
          if (!empId) return acc;
          
          if (!acc[empId]) {
            acc[empId] = { avg: 0, count: 0 };
          }
          acc[empId].avg += review.rating;
          acc[empId].count += 1;
          return acc;
        }, {} as Record<string, { avg: number; count: number }>);

        // Mapear empleados con expertise y ratings
        const mappedEmployees: Employee[] = employeeServices
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((es: any) => {
            if (!es.employee) return null;
            
            const stats = reviewStats?.[es.employee_id];
            return {
              id: es.employee.id,
              email: es.employee.email,
              full_name: es.employee.full_name,
              role: es.employee.role,
              avatar_url: es.employee.avatar_url,
              expertise_level: es.expertise_level,
              average_rating: stats ? Math.round((stats.avg / stats.count) * 10) / 10 : 0,
              total_reviews: stats?.count || 0,
            } as Employee;
          })
          .filter((emp): emp is Employee => emp !== null);

        setEmployees(mappedEmployees);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error inesperado';
        toast.error(`Error: ${message}`);
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeesForService();
  }, [businessId, serviceId, locationId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Cargando profesionales...</span>
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
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Selecciona un Profesional
        </h3>
        <p className="text-muted-foreground text-sm">
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
                ? "bg-primary/20 border-primary shadow-lg shadow-primary/20"
                : "bg-muted/50 border-border hover:bg-muted hover:border-border/50"
            )}
          >
            {/* Selected indicator */}
            {selectedEmployeeId === employee.id && (
              <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground text-xs font-bold">✓</span>
              </div>
            )}

            {/* Employee Avatar */}
            <div className="flex flex-col items-center mb-4">
              {employee.avatar_url ? (
                <img
                  src={employee.avatar_url}
                  alt={employee.full_name || 'Employee'}
                  className="w-20 h-20 rounded-full object-cover border-2 border-border mb-3"
                />
              ) : (
                <div className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center mb-3 border-2",
                  selectedEmployeeId === employee.id 
                    ? "bg-primary/30 border-primary" 
                    : "bg-muted border-border group-hover:bg-muted/80"
                )}>
                  <UserCircle2 className={cn(
                    "h-12 w-12",
                    selectedEmployeeId === employee.id ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
              )}

              {/* Employee Name */}
              <h4 className="text-lg font-semibold text-foreground text-center">
                {employee.full_name || 'Profesional'}
              </h4>

              {/* Role Badge */}
              <div className={cn(
                "mt-2 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1",
                selectedEmployeeId === employee.id
                  ? "bg-primary/30 text-primary"
                  : "bg-muted text-muted-foreground"
              )}>
                <Briefcase className="h-3 w-3" />
                <span className="capitalize">{employee.role === 'admin' ? 'Administrador' : 'Empleado'}</span>
              </div>
            </div>

            {/* Email */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground truncate">
                {employee.email}
              </p>
            </div>

            {/* Rating (placeholder - puede agregarse después) */}
            <div className="flex justify-center items-center gap-1 mt-3 text-yellow-500">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="h-4 w-4 fill-current" />
              ))}
              <span className="text-xs text-muted-foreground ml-2">(5.0)</span>
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
