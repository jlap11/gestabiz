import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, User, DollarSign, X, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format, startOfDay, endOfDay, addDays, subDays, isSameDay, parseISO, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';

interface Employee {
  id: string;
  user_id: string;
  profile_name: string;
  profile_avatar?: string;
}

interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  service_name: string;
  service_price: number;
  client_name: string;
  employee_id: string;
  employee_name: string;
  notes?: string;
}

interface LocationHours {
  opens_at: string;
  closes_at: string;
}

interface AppointmentModalProps {
  appointment: Appointment | null;
  onClose: () => void;
  onComplete: (appointmentId: string, tip: number) => void;
  onCancel: (appointmentId: string) => void;
  onNoShow: (appointmentId: string) => void;
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({ 
  appointment, 
  onClose, 
  onComplete, 
  onCancel,
  onNoShow 
}) => {
  const [tip, setTip] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!appointment) return null;

  const handleComplete = async () => {
    setIsProcessing(true);
    try {
      await onComplete(appointment.id, tip);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    setIsProcessing(true);
    try {
      await onCancel(appointment.id);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNoShow = async () => {
    setIsProcessing(true);
    try {
      await onNoShow(appointment.id);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const isCompleted = appointment.status === 'completed';
  const isCancelled = appointment.status === 'cancelled';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg shadow-lg max-w-lg w-full">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Detalles de la Cita</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Cliente:</span>
              <span className="text-sm text-muted-foreground">{appointment.client_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Servicio:</span>
              <span className="text-sm text-muted-foreground">{appointment.service_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Horario:</span>
              <span className="text-sm text-muted-foreground">
                {format(parseISO(appointment.start_time), 'HH:mm', { locale: es })} - {format(parseISO(appointment.end_time), 'HH:mm', { locale: es })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Precio:</span>
              <span className="text-sm text-muted-foreground">
                ${appointment.service_price.toLocaleString('es-CO')} COP
              </span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Empleado:</span>
              <span className="text-sm text-muted-foreground">{appointment.employee_name}</span>
            </div>
            {appointment.notes && (
              <div className="mt-2 p-2 bg-muted rounded-md">
                <span className="text-sm font-medium text-foreground">Notas:</span>
                <p className="text-sm text-muted-foreground mt-1">{appointment.notes}</p>
              </div>
            )}
          </div>

          {!isCompleted && !isCancelled && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Propina (opcional)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="number"
                  value={tip}
                  onChange={(e) => setTip(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-md text-foreground"
                  placeholder="0"
                  min="0"
                  step="1000"
                />
              </div>
            </div>
          )}

          {isCompleted && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md">
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                <Check className="h-4 w-4" />
                Cita completada
              </p>
            </div>
          )}

          {isCancelled && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <X className="h-4 w-4" />
                Cita cancelada
              </p>
            </div>
          )}
        </div>

        {!isCompleted && !isCancelled && (
          <div className="p-4 border-t border-border flex gap-3">
            <button
              onClick={handleComplete}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="h-4 w-4 inline mr-2" />
              Marcar Completada
            </button>
            <button
              onClick={handleNoShow}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <AlertCircle className="h-4 w-4 inline mr-2" />
              Sin Asistencia
            </button>
            <button
              onClick={handleCancel}
              disabled={isProcessing}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="h-4 w-4 inline mr-2" />
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const AppointmentsCalendar: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [locationHours, setLocationHours] = useState<LocationHours | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Update current time every minute to refresh the time indicator
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render to update time indicator position
      setSelectedDate(prev => new Date(prev));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Fetch business and location data
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        // Get business owned by user
        const { data: business, error: businessError } = await supabase
          .from('businesses')
          .select('id')
          .eq('owner_id', user.id)
          .single();

        if (businessError) throw businessError;

        // Get first location hours
        const { data: location, error: locationError } = await supabase
          .from('locations')
          .select('opens_at, closes_at')
          .eq('business_id', business.id)
          .limit(1)
          .single();

        if (!locationError && location) {
          setLocationHours(location);
        }

        // Get employees with profiles
        const { data: employeesData, error: employeesError } = await supabase
          .from('business_employees')
          .select(`
            id,
            user_id,
            profiles:user_id (
              full_name,
              avatar_url
            )
          `)
          .eq('business_id', business.id)
          .eq('status', 'active');

        if (employeesError) throw employeesError;

        interface EmployeeData {
          id: string;
          user_id: string;
          profiles?: {
            full_name?: string;
            avatar_url?: string;
          };
        }

        const formattedEmployees = (employeesData as EmployeeData[]).map(emp => ({
          id: emp.id,
          user_id: emp.user_id,
          profile_name: emp.profiles?.full_name || 'Sin nombre',
          profile_avatar: emp.profiles?.avatar_url
        }));

        setEmployees(formattedEmployees);

        // Fetch appointments for selected date
        await fetchAppointments(business.id, selectedDate);
      } catch (error) {
        // Error fetching data
        toast.error('Error al cargar los datos');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, selectedDate]);

  const fetchAppointments = async (businessId: string, date: Date) => {
    const start = startOfDay(date);
    const end = endOfDay(date);

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        start_time,
        end_time,
        status,
        notes,
        services:service_id (
          name,
          price
        ),
        profiles:client_id (
          full_name
        ),
        business_employees:employee_id (
          id,
          profiles:user_id (
            full_name
          )
        )
      `)
      .eq('business_id', businessId)
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())
      .order('start_time');

    if (error) {
      return;
    }

    const formattedAppointments: Appointment[] = (data || []).map((apt: Record<string, unknown>) => ({
      id: apt.id as string,
      start_time: apt.start_time as string,
      end_time: apt.end_time as string,
      status: apt.status as string,
      service_name: (apt.services as Record<string, unknown>)?.name as string || 'Servicio sin nombre',
      service_price: (apt.services as Record<string, unknown>)?.price as number || 0,
      client_name: (apt.profiles as Record<string, unknown>)?.full_name as string || 'Cliente sin nombre',
      employee_id: (apt.business_employees as Record<string, unknown>)?.id as string || '',
      employee_name: ((apt.business_employees as Record<string, unknown>)?.profiles as Record<string, unknown>)?.full_name as string || 'Sin asignar',
      notes: apt.notes as string | undefined
    }));

    setAppointments(formattedAppointments);
  };

  const handleCompleteAppointment = async (appointmentId: string, tip: number) => {
    try {
      // Update appointment status
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appointmentId);

      if (updateError) throw updateError;

      // Get appointment details
      const appointment = appointments.find(a => a.id === appointmentId);
      if (!appointment) return;

      // Create transaction (sale)
      const totalAmount = appointment.service_price + tip;
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          business_id: (await supabase.from('appointments').select('business_id').eq('id', appointmentId).single()).data?.business_id,
          type: 'income',
          amount: totalAmount,
          description: `Cita completada - ${appointment.service_name}`,
          category: 'service',
          date: new Date().toISOString(),
          payment_method: 'cash',
          notes: tip > 0 ? `Propina: $${tip.toLocaleString('es-CO')}` : undefined
        });

      if (transactionError) throw transactionError;

      toast.success('Cita completada y venta registrada');
      
      // Refresh appointments
      if (user) {
        const { data: business } = await supabase
          .from('businesses')
          .select('id')
          .eq('owner_id', user.id)
          .single();

        if (business) {
          await fetchAppointments(business.id, selectedDate);
        }
      }
    } catch (error) {
      toast.error('Error al completar la cita');
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (error) throw error;

      toast.success('Cita cancelada');
      
      // Refresh appointments
      if (user) {
        const { data: business } = await supabase
          .from('businesses')
          .select('id')
          .eq('owner_id', user.id)
          .single();

        if (business) {
          await fetchAppointments(business.id, selectedDate);
        }
      }
    } catch {
      toast.error('Error al cancelar la cita');
    }
  };

  const handleNoShow = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status: 'cancelled',
          notes: 'Cliente no se presentó'
        })
        .eq('id', appointmentId);

      if (error) throw error;

      toast.warning('Cita marcada como sin asistencia');
      
      // Refresh appointments
      if (user) {
        const { data: business } = await supabase
          .from('businesses')
          .select('id')
          .eq('owner_id', user.id)
          .single();

        if (business) {
          await fetchAppointments(business.id, selectedDate);
        }
      }
    } catch {
      toast.error('Error al marcar sin asistencia');
    }
  };

  // Generate hours array (0-23)
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Check if hour is within business hours
  const isBusinessHour = (hour: number): boolean => {
    if (!locationHours) return true;
    
    const openHour = Number.parseInt(locationHours.opens_at.split(':')[0], 10);
    const closeHour = Number.parseInt(locationHours.closes_at.split(':')[0], 10);
    
    return hour >= openHour && hour < closeHour;
  };

  // Get appointments for specific employee and hour
  const getAppointmentsForSlot = (employeeId: string, hour: number): Appointment[] => {
    return appointments.filter(apt => {
      const aptHour = parseISO(apt.start_time).getHours();
      return apt.employee_id === employeeId && aptHour === hour;
    });
  };

  // Get active and overdue appointments
  const activeAppointments = useMemo(() => {
    const now = new Date();
    return appointments.filter(apt => {
      const start = parseISO(apt.start_time);
      const end = parseISO(apt.end_time);
      return apt.status === 'confirmed' && isWithinInterval(now, { start, end });
    });
  }, [appointments]);

  const overdueAppointments = useMemo(() => {
    const now = new Date();
    return appointments.filter(apt => {
      const end = parseISO(apt.end_time);
      return apt.status === 'confirmed' && end < now;
    });
  }, [appointments]);

  // Calculate current time position
  const currentTimePosition = useMemo(() => {
    if (!isSameDay(selectedDate, new Date())) return null;
    
    const now = new Date();
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const percentage = ((hour * 60 + minutes) / (24 * 60)) * 100;
    
    return percentage;
  }, [selectedDate]);

  // Get appointment status class
  const getAppointmentClass = (status: string): string => {
    if (status === 'confirmed') {
      return 'bg-blue-500/20 border border-blue-500/50 text-blue-700 dark:text-blue-300';
    }
    if (status === 'completed') {
      return 'bg-green-500/20 border border-green-500/50 text-green-700 dark:text-green-300';
    }
    return 'bg-red-500/20 border border-red-500/50 text-red-700 dark:text-red-300';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Cargando calendario...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with date navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Calendario de Citas</h2>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedDate(subDays(selectedDate, 1))}
            className="p-2 hover:bg-muted rounded-md"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-foreground">
              {format(selectedDate, 'EEEE', { locale: es })}
            </div>
            <div className="text-sm text-muted-foreground">
              {format(selectedDate, 'dd MMMM yyyy', { locale: es })}
            </div>
          </div>
          
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            className="p-2 hover:bg-muted rounded-md"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          
          <button
            onClick={() => setSelectedDate(new Date())}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90"
          >
            Hoy
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Header with employee names */}
            <div className="flex border-b border-border bg-muted/50">
              <div className="w-20 flex-shrink-0 p-2 font-medium text-sm text-muted-foreground">
                Hora
              </div>
              {employees.map(employee => (
                <div
                  key={employee.id}
                  className="flex-1 min-w-[200px] p-2 text-center border-l border-border"
                >
                  <div className="flex items-center justify-center gap-2">
                    {employee.profile_avatar && (
                      <img
                        src={employee.profile_avatar}
                        alt={employee.profile_name}
                        className="h-6 w-6 rounded-full"
                      />
                    )}
                    <span className="font-medium text-sm text-foreground">
                      {employee.profile_name}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Time slots */}
            <div className="relative">
              {/* Current time indicator */}
              {currentTimePosition !== null && (
                <div
                  className="absolute left-0 right-0 h-0.5 bg-blue-500 z-10"
                  style={{ top: `${currentTimePosition}%` }}
                >
                  <div className="absolute -left-2 -top-2 w-4 h-4 bg-blue-500 rounded-full"></div>
                </div>
              )}

              {hours.map(hour => {
                const isWorkHour = isBusinessHour(hour);
                const workHourClass = isWorkHour ? '' : 'bg-muted/30';
                
                return (
                  <div
                    key={hour}
                    className={`flex border-b border-border min-h-[80px] ${workHourClass}`}
                  >
                    <div className="w-20 flex-shrink-0 p-2 text-sm text-muted-foreground font-medium">
                      {hour.toString().padStart(2, '0')}:00
                    </div>
                    {employees.map(employee => {
                      const slotAppointments = getAppointmentsForSlot(employee.id, hour);
                      
                      return (
                        <div
                          key={employee.id}
                          className="flex-1 min-w-[200px] p-2 border-l border-border"
                        >
                          {slotAppointments.map(apt => {
                            const appointmentClass = getAppointmentClass(apt.status);
                            
                            return (
                              <button
                                key={apt.id}
                                onClick={() => setSelectedAppointment(apt)}
                                className={`w-full p-2 rounded-md text-left text-xs hover:opacity-80 transition-opacity ${appointmentClass}`}
                              >
                                <div className="font-medium truncate">{apt.client_name}</div>
                                <div className="truncate">{apt.service_name}</div>
                                <div className="text-xs opacity-75">
                                  {format(parseISO(apt.start_time), 'HH:mm')} - {format(parseISO(apt.end_time), 'HH:mm')}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Active and Overdue Appointments */}
      {(activeAppointments.length > 0 || overdueAppointments.length > 0) && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Active Appointments */}
          {activeAppointments.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                En Proceso ({activeAppointments.length})
              </h3>
              <div className="space-y-2">
                {activeAppointments.map(apt => (
                  <div
                    key={apt.id}
                    className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{apt.client_name}</div>
                        <div className="text-sm text-muted-foreground">{apt.service_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {apt.employee_name} • {format(parseISO(apt.start_time), 'HH:mm')} - {format(parseISO(apt.end_time), 'HH:mm')}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedAppointment(apt)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md"
                      >
                        Gestionar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overdue Appointments */}
          {overdueAppointments.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Pendientes de Confirmar ({overdueAppointments.length})
              </h3>
              <div className="space-y-2">
                {overdueAppointments.map(apt => (
                  <div
                    key={apt.id}
                    className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{apt.client_name}</div>
                        <div className="text-sm text-muted-foreground">{apt.service_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {apt.employee_name} • {format(parseISO(apt.start_time), 'HH:mm')} - {format(parseISO(apt.end_time), 'HH:mm')}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCompleteAppointment(apt.id, 0)}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md"
                        >
                          Completada
                        </button>
                        <button
                          onClick={() => handleNoShow(apt.id)}
                          className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-md"
                        >
                          Sin Asistencia
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Appointment Modal */}
      {selectedAppointment && (
        <AppointmentModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onComplete={handleCompleteAppointment}
          onCancel={handleCancelAppointment}
          onNoShow={handleNoShow}
        />
      )}
    </div>
  );
};
