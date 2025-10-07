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

  useEffect(() => {
    if (selectedDate) {
      generateTimeSlots();
    }
  }, [selectedDate]);

  const generateTimeSlots = () => {
    // Generar slots de 9AM a 5PM
    const slots: TimeSlot[] = [];
    const popularTimes = ['10:00 AM', '03:00 PM']; // Horarios populares de ejemplo

    for (let hour = 9; hour <= 17; hour++) {
      const time12h = hour > 12 ? `${String(hour - 12).padStart(2, '0')}:00 PM` : `${String(hour).padStart(2, '0')}:00 AM`;
      
      slots.push({
        id: `slot-${hour}`,
        time: time12h,
        available: Math.random() > 0.3, // 70% de disponibilidad simulada
        isPopular: popularTimes.includes(time12h),
      });
    }

    setTimeSlots(slots);
  };

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
      <h3 className="text-xl font-semibold text-white mb-6">
        Select Date & Time
      </h3>

      {service && (
        <div className="mb-6 p-3 bg-[#2d2640] rounded-lg border border-white/10">
          <p className="text-sm text-[#94a3b8]">Selected service:</p>
          <p className="text-white font-semibold">
            {service.name} <span className="text-[#94a3b8] font-normal">({service.duration} min)</span>
          </p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendario */}
        <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm w-full lg:w-auto lg:flex-shrink-0">
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
              <h3 className="text-lg font-semibold text-white">
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
                      selectedTime === slot.time && "bg-[#8b5cf6] text-white border-[#8b5cf6] hover:bg-[#7c3aed]",
                      selectedTime !== slot.time && slot.available && "bg-[#1e293b] border-white/10 text-white hover:border-[#8b5cf6]",
                      !slot.available && "opacity-40 cursor-not-allowed bg-[#0f172a]"
                    )}
                  >
                    {slot.time}

                    {/* Badge HOT para horarios populares */}
                    {slot.isPopular && slot.available && (
                      <Badge
                        className="absolute -top-2 -right-2 bg-[#ff8c00] text-white text-xs px-2 py-0.5 
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
