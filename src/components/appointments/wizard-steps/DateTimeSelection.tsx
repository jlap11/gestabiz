import React, { useEffect, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Service, Appointment } from '@/types/types';
import { format, addMinutes, parse } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface DateTimeSelectionProps {
  readonly service: Service | null;
  readonly selectedDate: Date | null;
  readonly selectedTime: string | null;
  readonly onSelectDate: (date: Date) => void;
  readonly onSelectTime: (startTime: string, endTime: string) => void;
  readonly employeeId: string | null;
  readonly locationId: string | null;
  readonly businessId: string | null;
  readonly appointmentToEdit?: Appointment | null;
}

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  isPopular: boolean;
  unavailableReason?: string;
}

interface LocationSchedule {
  opens_at: string | null;
  closes_at: string | null;
}

interface EmployeeSchedule {
  lunch_break_start: string | null;
  lunch_break_end: string | null;
  has_lunch_break: boolean;
}

interface ExistingAppointment {
  id: string;
  start_time: string;
  end_time: string;
}

export function DateTimeSelection({
  service,
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime,
  employeeId,
  locationId,
  businessId,
  appointmentToEdit,
}: DateTimeSelectionProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [locationSchedule, setLocationSchedule] = useState<LocationSchedule | null>(null);
  const [employeeSchedule, setEmployeeSchedule] = useState<EmployeeSchedule | null>(null);
  const [existingAppointments, setExistingAppointments] = useState<ExistingAppointment[]>([]);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);

  // Cargar horarios y citas existentes
  useEffect(() => {
    const loadScheduleData = async () => {
      if (!employeeId || !locationId || !businessId) return;
      
      setIsLoadingSchedule(true);
      
      try {
        // 1. Obtener horario de la sede
        const { data: locationData } = await supabase
          .from('locations')
          .select('opens_at, closes_at')
          .eq('id', locationId)
          .single();
        
        setLocationSchedule(locationData);

        // 2. Obtener horario de almuerzo del empleado
        const { data: employeeData } = await supabase
          .from('business_employees')
          .select('lunch_break_start, lunch_break_end, has_lunch_break')
          .eq('employee_id', employeeId)
          .eq('business_id', businessId)
          .single();
        
        setEmployeeSchedule(employeeData);

        // 3. Obtener citas existentes del empleado para la fecha seleccionada
        if (selectedDate) {
          const startOfDay = format(selectedDate, 'yyyy-MM-dd 00:00:00');
          const endOfDay = format(selectedDate, 'yyyy-MM-dd 23:59:59');

          const { data: appointments } = await supabase
            .from('appointments')
            .select('id, start_time, end_time')
            .eq('employee_id', employeeId)
            .gte('start_time', startOfDay)
            .lte('start_time', endOfDay)
            .in('status', ['pending', 'confirmed'])
            .order('start_time');

          // Excluir la cita que se está editando
          const filteredAppointments = appointmentToEdit
            ? (appointments || []).filter(apt => apt.id !== appointmentToEdit.id)
            : (appointments || []);

          setExistingAppointments(filteredAppointments);
        }
      } catch (error) {
        console.error('Error al cargar horarios:', error);
        toast.error('No se pudo cargar la disponibilidad');
      } finally {
        setIsLoadingSchedule(false);
      }
    };

    loadScheduleData();
  }, [employeeId, locationId, businessId, selectedDate, appointmentToEdit]);

  const generateTimeSlots = React.useCallback(() => {
    if (!selectedDate) return;

    const slots: TimeSlot[] = [];
    const popularTimes = new Set(['10:00 AM', '03:00 PM']);

    // Determinar horario válido (usar location o default 9-17)
    const openHour = locationSchedule?.opens_at 
      ? parseInt(locationSchedule.opens_at.split(':')[0]) 
      : 9;
    const closeHour = locationSchedule?.closes_at 
      ? parseInt(locationSchedule.closes_at.split(':')[0]) 
      : 17;

    for (let hour = openHour; hour <= closeHour; hour++) {
      const time12h = hour > 12 
        ? `${String(hour - 12).padStart(2, '0')}:00 PM` 
        : `${String(hour).padStart(2, '0')}:00 AM`;
      
      let isAvailable = true;
      let unavailableReason = '';

      // Validar horario de almuerzo
      if (employeeSchedule?.has_lunch_break) {
        const lunchStart = parseInt(employeeSchedule.lunch_break_start?.split(':')[0] || '12');
        const lunchEnd = parseInt(employeeSchedule.lunch_break_end?.split(':')[0] || '13');
        
        if (hour >= lunchStart && hour < lunchEnd) {
          isAvailable = false;
          unavailableReason = 'Hora de almuerzo';
        }
      }

      // Validar citas existentes
      if (isAvailable && service) {
        const slotStartTime = parse(time12h, 'hh:mm a', selectedDate);
        const slotEndTime = addMinutes(slotStartTime, service.duration || 60);

        for (const apt of existingAppointments) {
          const aptStart = new Date(apt.start_time);
          const aptEnd = new Date(apt.end_time);

          // Verificar solapamiento: (SlotStart < AptEnd) AND (SlotEnd > AptStart)
          if (slotStartTime < aptEnd && slotEndTime > aptStart) {
            isAvailable = false;
            unavailableReason = 'Ocupado';
            break;
          }
        }
      }

      slots.push({
        id: `slot-${hour}`,
        time: time12h,
        available: isAvailable,
        isPopular: popularTimes.has(time12h),
        unavailableReason
      });
    }

    setTimeSlots(slots);
  }, [selectedDate, service, locationSchedule, employeeSchedule, existingAppointments]);

  useEffect(() => {
    if (selectedDate && !isLoadingSchedule) {
      generateTimeSlots();
    }
  }, [selectedDate, generateTimeSlots, isLoadingSchedule]);

  const handleTimeSelect = (slot: TimeSlot) => {
    if (!slot.available) return;

    // Calcular hora de fin basada en la duración del servicio
    const startTimeParsed = parse(slot.time, 'hh:mm a', new Date());
    const endTime = addMinutes(startTimeParsed, service?.duration || 60);
    const endTimeFormatted = format(endTime, 'hh:mm a');

    onSelectTime(slot.time, endTimeFormatted);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <h3 className="text-xl font-semibold text-foreground mb-6">
        Select Date & Time
      </h3>

      {service && (
        <div className="mb-6 p-3 bg-card rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">Selected service:</p>
          <p className="text-foreground font-semibold">
            {service.name} <span className="text-muted-foreground font-normal">({service.duration} min)</span>
          </p>
        </div>
      )}

      {/* Mensaje informativo sobre la regla de 90 minutos */}
      {selectedDate && selectedDate.toDateString() === new Date().toDateString() && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            ℹ️ Para citas el mismo día, solo están disponibles horarios con al menos 90 minutos de anticipación.
          </p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendario */}
        <div className="bg-card rounded-xl border border-border shadow-sm w-full lg:w-auto lg:flex-shrink-0">
          <Calendar
            selected={selectedDate || undefined}
            onSelect={(date) => date && onSelectDate(date)}
            disabled={(date) => date < new Date()}
            className="w-full"
          />
        </div>

        {/* Time Slots */}
        <div className="flex-1 space-y-4 min-w-0">
          {selectedDate ? (
            <>
              <h3 className="text-lg font-semibold text-foreground">
                Available on {format(selectedDate, 'MMMM d, yyyy')}
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-2">
                {timeSlots.map((slot) => {
                  const buttonContent = (
                    <Button
                      key={slot.id}
                      disabled={!slot.available}
                      onClick={() => handleTimeSelect(slot)}
                      variant={selectedTime === slot.time ? "default" : "outline"}
                      className={cn(
                        "relative w-full h-12 text-base font-medium transition-all",
                        selectedTime === slot.time && "bg-primary text-primary-foreground border-primary hover:bg-primary/90",
                        selectedTime !== slot.time && slot.available && "bg-card border-border text-foreground hover:border-primary",
                        !slot.available && "opacity-40 cursor-not-allowed bg-muted"
                      )}
                    >
                      {slot.time}

                      {/* Badge HOT para horarios populares */}
                      {slot.isPopular && slot.available && (
                        <Badge
                          className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-0.5 
                                   font-bold uppercase tracking-wide shadow-md border-none"
                        >
                          HOT
                        </Badge>
                      )}
                    </Button>
                  );

                  // Si el slot no está disponible, mostrar tooltip con la razón
                  if (!slot.available && slot.unavailableReason) {
                    return (
                      <TooltipProvider key={slot.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {buttonContent}
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{slot.unavailableReason}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  }

                  return buttonContent;
                })}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full min-h-[200px]">
              <p className="text-[#94a3b8] text-center">
                Please select a date to see available time slots
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
