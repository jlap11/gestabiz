import React, { useEffect, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { Appointment, Service } from '@/types/types'
import { addMinutes, format, parse } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useEmployeeTransferAvailability } from '@/hooks/useEmployeeTransferAvailability'

interface DateTimeSelectionProps {
  readonly service: Service | null
  readonly selectedDate: Date | null
  readonly selectedTime: string | null
  readonly onSelectDate: (date: Date) => void
  readonly onSelectTime: (startTime: string, endTime: string) => void
  readonly employeeId: string | null
  readonly resourceId?: string | null // NUEVO: Soporte para recursos físicos
  readonly locationId: string | null
  readonly businessId: string | null
  readonly appointmentToEdit?: Appointment | null
}

interface TimeSlot {
  id: string
  time: string
  available: boolean
  isPopular: boolean
  unavailableReason?: string
}

interface LocationSchedule {
  opens_at: string | null
  closes_at: string | null
}

interface EmployeeSchedule {
  lunch_break_start: string | null
  lunch_break_end: string | null
  has_lunch_break: boolean
}

interface ExistingAppointment {
  id: string
  start_time: string
  end_time: string
}

/**
 * Helper para convertir hora a formato 12h
 */
function formatHourTo12h(hour: number): string {
  if (hour > 12) {
    return `${String(hour - 12).padStart(2, '0')}:00 PM`
  }
  if (hour === 12) {
    return '12:00 PM'
  }
  return `${String(hour).padStart(2, '0')}:00 AM`
}

/**
 * Helper para validar si hora se superpone con lunch break
 */
function isLunchBreakTime(
  hour: number,
  hasLunchBreak: boolean,
  lunchStart: string | null,
  lunchEnd: string | null
): boolean {
  if (!hasLunchBreak || !lunchStart || !lunchEnd) return false

  const lunchStartHour = Number.parseInt(lunchStart.split(':')[0])
  const lunchEndHour = Number.parseInt(lunchEnd.split(':')[0])

  return hour >= lunchStartHour && hour < lunchEndHour
}

/**
 * Helper para validar si slot se superpone con citas existentes
 */
function isSlotOccupied(
  slotStartTime: Date,
  slotEndTime: Date,
  existingAppointments: ExistingAppointment[]
): boolean {
  return existingAppointments.some(apt => {
    const aptStart = new Date(apt.start_time)
    const aptEnd = new Date(apt.end_time)
    return slotStartTime < aptEnd && slotEndTime > aptStart
  })
}

export function DateTimeSelection({
  service,
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime,
  employeeId,
  resourceId,
  locationId,
  businessId,
  appointmentToEdit,
}: Readonly<DateTimeSelectionProps>) {
  const { t } = useLanguage()
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [locationSchedule, setLocationSchedule] = useState<LocationSchedule | null>(null)
  const [employeeSchedule, setEmployeeSchedule] = useState<EmployeeSchedule | null>(null)
  const [existingAppointments, setExistingAppointments] = useState<ExistingAppointment[]>([])
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false)
  const { validateAvailability } = useEmployeeTransferAvailability()

  // Cargar horarios, citas existentes y validar disponibilidad
  useEffect(() => {
    const loadScheduleData = async () => {
      // Validar que haya employeeId O resourceId (al menos uno)
      if ((!employeeId && !resourceId) || !locationId || !businessId || !selectedDate) return

      setIsLoadingSchedule(true)

      try {
        // 1. Obtener horario de la sede
        const { data: locationData } = await supabase
          .from('locations')
          .select('opens_at, closes_at')
          .eq('id', locationId)
          .single()

        setLocationSchedule(locationData)

        // 2. Obtener horario de almuerzo del empleado (solo si es empleado)
        if (employeeId) {
          const { data: employeeData } = await supabase
            .from('business_employees')
            .select('lunch_break_start, lunch_break_end, has_lunch_break')
            .eq('employee_id', employeeId)
            .eq('business_id', businessId)
            .single()

          setEmployeeSchedule(employeeData)
        } else {
          // Si es recurso, no tiene lunch break
          setEmployeeSchedule(null)
        }

        // 3. Obtener citas existentes
        const dayStart = new Date(selectedDate)
        dayStart.setHours(0, 0, 0, 0)

        const dayEnd = new Date(selectedDate)
        dayEnd.setHours(23, 59, 59, 999)

        if (employeeId) {
          // Buscar citas del empleado
          const { data: employeeRecord } = await supabase
            .from('business_employees')
            .select('id')
            .eq('employee_id', employeeId)
            .eq('business_id', businessId)
            .single()

          if (employeeRecord) {
            const { data: appointments } = await supabase
              .from('appointments')
              .select('id, start_time, end_time')
              .eq('employee_id', employeeRecord.id)
              .gte('start_time', dayStart.toISOString())
              .lte('start_time', dayEnd.toISOString())
              .in('status', ['pending', 'confirmed'])
              .order('start_time')

            const filteredAppointments = appointmentToEdit
              ? (appointments || []).filter(apt => apt.id !== appointmentToEdit.id)
              : appointments || []

            setExistingAppointments(filteredAppointments)
          }
        } else if (resourceId) {
          // Buscar reservas del recurso físico
          const { data: appointments } = await supabase
            .from('appointments')
            .select('id, start_time, end_time')
            .eq('resource_id', resourceId)
            .gte('start_time', dayStart.toISOString())
            .lte('start_time', dayEnd.toISOString())
            .in('status', ['pending', 'confirmed'])
            .order('start_time')

          const filteredAppointments = appointmentToEdit
            ? (appointments || []).filter(apt => apt.id !== appointmentToEdit.id)
            : appointments || []

          setExistingAppointments(filteredAppointments)
        }
      } catch {
        toast.error('No se pudo cargar la disponibilidad')
      } finally {
        setIsLoadingSchedule(false)
      }
    }

    loadScheduleData()
  }, [employeeId, resourceId, locationId, businessId, selectedDate, appointmentToEdit])

  const generateTimeSlots = React.useCallback(async () => {
    if (!selectedDate || !employeeId || !locationId || !businessId) return

    const slots: TimeSlot[] = []
    const popularTimes = new Set(['10:00 AM', '03:00 PM'])

    const openHour = locationSchedule?.opens_at
      ? Number.parseInt(locationSchedule.opens_at.split(':')[0])
      : 9
    const closeHour = locationSchedule?.closes_at
      ? Number.parseInt(locationSchedule.closes_at.split(':')[0])
      : 17

    // Validar disponibilidad por traslado
    const transferValidation = await validateAvailability(
      employeeId,
      businessId,
      selectedDate,
      locationId
    )

    for (let hour = openHour; hour <= closeHour; hour++) {
      const time12h = formatHourTo12h(hour)

      let isAvailable = true
      let unavailableReason = ''

      // Regla 1: Validar ausencias aprobadas
      const checkDate = format(selectedDate, 'yyyy-MM-dd')
      const { data: absenceData } = await supabase
        .from('employee_absences')
        .select('id, absence_type')
        .eq('employee_id', employeeId)
        .eq('business_id', businessId)
        .eq('status', 'approved')
        .lte('start_date', checkDate)
        .gte('end_date', checkDate)
        .single()

      if (absenceData) {
        isAvailable = false
        const typeLabels: Record<string, string> = {
          vacation: 'Vacaciones',
          emergency: 'Emergencia',
          sick_leave: 'Incapacidad',
          personal: 'Asunto personal',
          other: 'Ausencia',
        }
        unavailableReason = typeLabels[absenceData.absence_type] || 'Ausente'
      }

      // Regla 2: Validar traslado
      if (isAvailable && !transferValidation.isAvailable) {
        isAvailable = false
        unavailableReason = transferValidation.reason || 'Empleado en período de traslado'
      }

      // Regla 3: Validar horario de almuerzo
      if (
        isAvailable &&
        isLunchBreakTime(
          hour,
          employeeSchedule?.has_lunch_break || false,
          employeeSchedule?.lunch_break_start || null,
          employeeSchedule?.lunch_break_end || null
        )
      ) {
        isAvailable = false
        unavailableReason = 'Hora de almuerzo'
      }

      // Regla 4: Validar citas existentes
      if (isAvailable && service) {
        const slotStartTime = parse(time12h, 'hh:mm a', selectedDate)
        const slotEndTime = addMinutes(slotStartTime, service.duration || 60)

        if (isSlotOccupied(slotStartTime, slotEndTime, existingAppointments)) {
          isAvailable = false
          // Diferenciar entre recurso y empleado en el mensaje
          unavailableReason = resourceId ? 'Recurso Ocupado' : 'Ocupado'
        }
      }

      slots.push({
        id: `slot-${hour}`,
        time: time12h,
        available: isAvailable,
        isPopular: popularTimes.has(time12h),
        unavailableReason,
      })
    }

    setTimeSlots(slots)
  }, [
    selectedDate,
    service,
    locationSchedule,
    employeeSchedule,
    existingAppointments,
    employeeId,
    resourceId,
    locationId,
    businessId,
    validateAvailability,
  ])

  useEffect(() => {
    if (selectedDate && !isLoadingSchedule) {
      generateTimeSlots()
    }
  }, [selectedDate, generateTimeSlots, isLoadingSchedule])

  const handleTimeSelect = (slot: TimeSlot) => {
    if (!slot.available) return

    const startTimeParsed = parse(slot.time, 'hh:mm a', new Date())
    const endTime = addMinutes(startTimeParsed, service?.duration || 60)
    const endTimeFormatted = format(endTime, 'hh:mm a')

    onSelectTime(slot.time, endTimeFormatted)
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <h3 className="text-xl font-semibold text-foreground mb-6">Select Date & Time</h3>

      {service && (
        <div className="mb-6 p-3 bg-card rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">Selected service:</p>
          <p className="text-foreground font-semibold">
            {service.name}{' '}
            <span className="text-muted-foreground font-normal">({service.duration} min)</span>
          </p>
        </div>
      )}

      {selectedDate && selectedDate.toDateString() === new Date().toDateString() && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            ℹ️ Para citas el mismo día, solo están disponibles horarios con al menos 90 minutos de
            anticipación.
          </p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendario */}
        <div className="bg-card rounded-xl border border-border shadow-sm w-full lg:w-auto lg:flex-shrink-0">
          <Calendar
            selected={selectedDate || undefined}
            onSelect={date => date && onSelectDate(date)}
            disabled={date => date < new Date()}
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
                {timeSlots.map(slot => {
                  const buttonContent = (
                    <Button
                      key={slot.id}
                      disabled={!slot.available}
                      onClick={() => handleTimeSelect(slot)}
                      variant={selectedTime === slot.time ? 'default' : 'outline'}
                      className={cn(
                        'relative w-full h-12 text-base font-medium transition-all',
                        selectedTime === slot.time &&
                          'bg-primary text-primary-foreground border-primary hover:bg-primary/90',
                        selectedTime !== slot.time &&
                          slot.available &&
                          'bg-card border-border text-foreground hover:border-primary',
                        !slot.available && 'opacity-40 cursor-not-allowed bg-muted'
                      )}
                    >
                      {slot.time}

                      {slot.isPopular && slot.available && (
                        <Badge className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-0.5 font-bold uppercase tracking-wide shadow-md border-none">
                          HOT
                        </Badge>
                      )}
                    </Button>
                  )

                  if (!slot.available && slot.unavailableReason) {
                    return (
                      <TooltipProvider key={slot.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
                          <TooltipContent>
                            <p>{slot.unavailableReason}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )
                  }

                  return buttonContent
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
  )
}
