# Sistema de Validación de Horarios para Citas

## 📋 Resumen

Sistema para validar la disponibilidad de horarios al crear/modificar citas, considerando:
1. Horario laboral de la sede (opens_at, closes_at)
2. Horario de almuerzo del profesional (lunch_break_start, lunch_break_end)
3. Citas ya agendadas para el profesional en esa fecha
4. Modo edición: NO bloquear la cita que se está editando

## ✅ Completado (2025-10-18)

- [x] Prop `appointmentToEdit?: Appointment | null` añadida a AppointmentWizard
- [x] Título dinámico: "Nueva Cita" vs "Editar Cita"
- [x] ClientDashboard pasa `appointmentToEdit` al wizard en `handleRescheduleAppointment`
- [x] `handleCloseWizard` limpia `appointmentToEdit` al cerrar el modal

## ⏳ Pendiente de Implementación

### 1. Obtener Horario de la Sede

**Archivo**: `src/components/appointments/wizard-steps/DateTimeSelection.tsx`

**Lógica**:
```typescript
interface LocationSchedule {
  opens_at: string; // "09:00:00"
  closes_at: string; // "17:00:00"
}

// Query a tabla locations
const { data: location } = await supabase
  .from('locations')
  .select('opens_at, closes_at')
  .eq('id', wizardData.locationId)
  .single();
```

### 2. Obtener Horario de Almuerzo del Profesional

**Archivo**: `src/components/appointments/wizard-steps/DateTimeSelection.tsx`

**Lógica**:
```typescript
interface EmployeeSchedule {
  lunch_break_start: string; // "12:00:00"
  lunch_break_end: string; // "13:00:00"
  has_lunch_break: boolean;
}

// Query a tabla business_employees
const { data: employeeConfig } = await supabase
  .from('business_employees')
  .select('lunch_break_start, lunch_break_end, has_lunch_break')
  .eq('employee_id', wizardData.employeeId)
  .eq('business_id', wizardData.businessId)
  .single();
```

### 3. Obtener Citas Existentes del Profesional

**Archivo**: `src/components/appointments/wizard-steps/DateTimeSelection.tsx`

**Lógica**:
```typescript
interface ExistingAppointment {
  id: string;
  start_time: string; // "2025-10-21T10:00:00Z"
  end_time: string;   // "2025-10-21T11:00:00Z"
}

// Query a tabla appointments
const { data: existingAppointments } = await supabase
  .from('appointments')
  .select('id, start_time, end_time')
  .eq('employee_id', wizardData.employeeId)
  .gte('start_time', format(selectedDate, 'yyyy-MM-dd 00:00:00'))
  .lte('start_time', format(selectedDate, 'yyyy-MM-dd 23:59:59'))
  .in('status', ['pending', 'confirmed']) // Solo citas activas
  .order('start_time');

// IMPORTANTE: Si estamos editando una cita, EXCLUIR la cita que se está editando:
if (appointmentToEdit) {
  existingAppointments = existingAppointments.filter(apt => apt.id !== appointmentToEdit.id);
}
```

### 4. Actualizar Lógica de generateTimeSlots

**Archivo**: `src/components/appointments/wizard-steps/DateTimeSelection.tsx`

**Implementación Completa**:
```typescript
const generateTimeSlots = React.useCallback((
  locationSchedule: LocationSchedule | null,
  employeeSchedule: EmployeeSchedule | null,
  existingAppointments: ExistingAppointment[]
) => {
  const slots: TimeSlot[] = [];
  const popularTimes = ['10:00 AM', '03:00 PM'];

  // 1. Determinar horario válido (usar location o default 9-17)
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

    // 2. Validar horario de almuerzo
    if (employeeSchedule?.has_lunch_break) {
      const lunchStart = parseInt(employeeSchedule.lunch_break_start.split(':')[0]);
      const lunchEnd = parseInt(employeeSchedule.lunch_break_end.split(':')[0]);
      
      if (hour >= lunchStart && hour < lunchEnd) {
        isAvailable = false;
        unavailableReason = 'Hora de almuerzo';
      }
    }

    // 3. Validar citas existentes
    const slotStartTime = parse(time12h, 'hh:mm a', selectedDate);
    const slotEndTime = addMinutes(slotStartTime, service?.duration_minutes || 60);

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

    slots.push({
      id: `slot-${hour}`,
      time: time12h,
      available: isAvailable,
      isPopular: popularTimes.includes(time12h),
      unavailableReason // Añadir campo para mostrar tooltip
    });
  }

  setTimeSlots(slots);
}, [selectedDate, service?.duration_minutes]);
```

### 5. Actualizar Props de DateTimeSelection

**Archivo**: `src/components/appointments/wizard-steps/DateTimeSelection.tsx`

**Interfaz Actualizada**:
```typescript
interface DateTimeSelectionProps {
  readonly service: Service | null;
  readonly selectedDate: Date | null;
  readonly selectedTime: string | null;
  readonly onSelectDate: (date: Date) => void;
  readonly onSelectTime: (startTime: string, endTime: string) => void;
  readonly employeeId: string | null; // NUEVO
  readonly locationId: string | null; // NUEVO
  readonly businessId: string | null; // NUEVO
  readonly appointmentToEdit?: Appointment | null; // NUEVO
}
```

### 6. Actualizar Llamada en AppointmentWizard

**Archivo**: `src/components/appointments/AppointmentWizard.tsx` (línea ~711)

**Cambio**:
```typescript
{currentStep === getStepNumber('dateTime') && (
  <DateTimeSelection
    service={wizardData.service}
    selectedDate={wizardData.date}
    selectedTime={wizardData.startTime}
    employeeId={wizardData.employeeId}           // NUEVO
    locationId={wizardData.locationId}           // NUEVO
    businessId={wizardData.businessId}           // NUEVO
    appointmentToEdit={appointmentToEdit}        // NUEVO
    onSelectDate={(date) => {
      updateWizardData({ date });
      console.log('📅 Fecha seleccionada:', date);
    }}
    onSelectTime={(startTime, endTime) => {
      updateWizardData({ startTime, endTime });
      console.log('⏰ Hora seleccionada:', startTime, 'Fin:', endTime);
    }}
  />
)}
```

### 7. Lógica de Submit: UPDATE vs INSERT

**Archivo**: `src/components/appointments/AppointmentWizard.tsx`

**handleSubmit Actualizado**:
```typescript
const handleSubmit = async () => {
  try {
    setIsSubmitting(true);
    
    if (appointmentToEdit) {
      // MODO EDICIÓN: Actualizar cita existente
      const { error } = await supabase
        .from('appointments')
        .update({
          start_time: wizardData.startTime,
          end_time: wizardData.endTime,
          service_id: wizardData.serviceId,
          location_id: wizardData.locationId,
          employee_id: wizardData.employeeId,
          notes: wizardData.notes,
          status: 'pending', // Reset status a pending
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentToEdit.id);

      if (error) throw error;

      toast.success('Cita modificada exitosamente');
      analytics.trackBookingCompleted({
        businessId: wizardData.businessId,
        appointmentId: appointmentToEdit.id,
        action: 'updated'
      });
    } else {
      // MODO CREACIÓN: Insertar nueva cita
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          business_id: wizardData.businessId,
          location_id: wizardData.locationId,
          service_id: wizardData.serviceId,
          client_id: userId,
          employee_id: wizardData.employeeId,
          start_time: wizardData.startTime,
          end_time: wizardData.endTime,
          notes: wizardData.notes,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Cita creada exitosamente');
      analytics.trackBookingCompleted({
        businessId: wizardData.businessId,
        appointmentId: data.id,
        action: 'created'
      });
    }

    onSuccess?.();
    onClose();
  } catch (error) {
    console.error('Error al guardar cita:', error);
    toast.error('No se pudo guardar la cita. Intenta de nuevo.');
  } finally {
    setIsSubmitting(false);
  }
};
```

### 8. Mostrar Mini-Calendario con Citas del Profesional

**Archivo**: `src/components/appointments/wizard-steps/DateTimeSelection.tsx`

**Feature Adicional** (Opcional pero muy útil):

```typescript
// En el componente DateTimeSelection, mostrar un mini-calendario
// con indicadores visuales de días con citas:

<Calendar
  selected={selectedDate}
  onSelect={onSelectDate}
  modifiers={{
    booked: daysWithAppointments // Array de fechas con citas
  }}
  modifiersClassNames={{
    booked: 'bg-blue-100 font-semibold' // Resaltar días con citas
  }}
/>
```

## 📊 Diagrama de Flujo de Validación

```
Usuario selecciona fecha + hora
         ↓
┌────────────────────────────────┐
│ 1. Validar horario de sede     │
│    opens_at <= hora < closes_at │
└────────────┬───────────────────┘
             ↓ ✅ OK
┌────────────────────────────────┐
│ 2. Validar almuerzo empleado   │
│    NOT (lunch_start <= hora     │
│          < lunch_end)           │
└────────────┬───────────────────┘
             ↓ ✅ OK
┌────────────────────────────────┐
│ 3. Validar citas existentes    │
│    NO overlap con otras citas  │
│    (excepto la que se edita)   │
└────────────┬───────────────────┘
             ↓ ✅ OK
┌────────────────────────────────┐
│ Slot DISPONIBLE                │
│ Habilitar botón "Next"         │
└────────────────────────────────┘
```

## 🔑 Puntos Clave

1. **Excluir cita en edición**: Si `appointmentToEdit` existe, NO bloquear ese slot aunque esté ocupado por esa misma cita
2. **Considerar duración del servicio**: Un slot de 2:00 PM con servicio de 90 min bloqueará hasta 3:30 PM
3. **Query optimizada**: Cargar todas las citas del profesional para el día UNA SOLA VEZ, no por cada slot
4. **Feedback visual**: Mostrar tooltip en slots deshabilitados con la razón ("Almuerzo", "Ocupado", "Fuera de horario")
5. **Performance**: useCallback para evitar re-renders innecesarios

## 📝 Notas de Implementación

- **Hook sugerido**: Crear `useAvailableSlots(employeeId, locationId, businessId, selectedDate, appointmentToEdit)` que encapsule toda la lógica
- **Cache**: Considerar cachear queries de horarios (no cambian frecuentemente)
- **Loading states**: Mostrar skeleton mientras se cargan horarios y citas
- **Error handling**: Si no se puede cargar horario, usar defaults (9 AM - 5 PM, sin almuerzo)

## 🧪 Testing

### Casos de Prueba

1. **Crear nueva cita**: Slots con citas existentes deben estar deshabilitados
2. **Editar cita existente**: El slot de la cita actual debe estar disponible
3. **Almuerzo**: Slots dentro de lunch_break deben estar deshabilitados
4. **Fuera de horario**: Slots antes de opens_at o después de closes_at deshabilitados
5. **Día completo ocupado**: Todos los slots deshabilitados, mensaje informativo
6. **Empleado sin horario de almuerzo**: `has_lunch_break = false` ignora validación de almuerzo

---

**Estado**: ⏳ Pendiente de implementación completa  
**Prioridad**: 🔴 Alta (funcionalidad crítica para UX)  
**Estimación**: 3-4 horas de desarrollo + 1 hora de testing
