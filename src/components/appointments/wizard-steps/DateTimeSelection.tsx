import React, { useEffect, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Service } from '@/types/types';
import { format, addMinutes, parse } from 'date-fns';

interface DateTimeSelectionProps {
  readonly service: Service | null;
  readonly selectedDate: Date | null;
  readonly selectedTime: string | null;
  readonly onSelectDate: (date: Date) => void;
  readonly onSelectTime: (startTime: string, endTime: string) => void;
}

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  isPopular: boolean;
}

export function DateTimeSelection({
  service,
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime,
}: DateTimeSelectionProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  const generateTimeSlots = React.useCallback(() => {
    // Generar slots de 9AM a 5PM
    const slots: TimeSlot[] = [];
    const popularTimes = ['10:00 AM', '03:00 PM']; // Horarios populares de ejemplo
    const now = new Date();
    const isToday = selectedDate && 
      selectedDate.getDate() === now.getDate() &&
      selectedDate.getMonth() === now.getMonth() &&
      selectedDate.getFullYear() === now.getFullYear();

    for (let hour = 9; hour <= 17; hour++) {
      const time12h = hour > 12 ? `${String(hour - 12).padStart(2, '0')}:00 PM` : `${String(hour).padStart(2, '0')}:00 AM`;
      
      // Verificar disponibilidad considerando la regla de 90 minutos para hoy
      let isAvailable = Math.random() > 0.3; // 70% de disponibilidad simulada base
      
      if (isToday) {
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const slotHour = hour;
        
        // Calcular diferencia en minutos
        const slotMinutes = slotHour * 60;
        const nowMinutes = currentHour * 60 + currentMinute;
        const minutesDifference = slotMinutes - nowMinutes;
        
        // Disponible solo si hay al menos 90 minutos de diferencia
        if (minutesDifference < 90) {
          isAvailable = false;
        }
      }
      
      slots.push({
        id: `slot-${hour}`,
        time: time12h,
        available: isAvailable,
        isPopular: popularTimes.includes(time12h),
      });
    }

    setTimeSlots(slots);
  }, [selectedDate]);

  useEffect(() => {
    if (selectedDate) {
      generateTimeSlots();
    }
  }, [selectedDate, generateTimeSlots]);

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
                {timeSlots.map((slot) => (
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
                ))}
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
