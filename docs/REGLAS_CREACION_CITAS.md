# Reglas de Creación de Citas - AppointSync Pro

**Última actualización**: 18 de octubre de 2025  
**Estado**: Documentación Completa

## 📋 Resumen Ejecutivo

El sistema **SÍ tiene reglas de tiempo mínimo** para crear citas. Actualmente existe una regla de **90 minutos de anticipación** para citas el mismo día (hoy). Esta es una regla crítica que previene la saturación de agenda y asegurar que haya tiempo suficiente para preparación.

## 🎯 Reglas Actuales Implementadas

### 1. **Regla de 90 minutos para citas de hoy** ✅ IMPLEMENTADA
- **Aplica a**: Cualquier cita programada para el día actual
- **Validación**: Si la hora seleccionada está a menos de 90 minutos del hora actual, el slot está **deshabilitado**
- **Ubicación del código**: `src/components/appointments/wizard-steps/DateTimeSelection.tsx` (líneas 47-65)
- **Lógica**:
  ```tsx
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
  ```

### 2. **Validación de fecha futura** ✅ IMPLEMENTADA
- **Aplica a**: Todas las citas
- **Validación**: `startDateTime < new Date()` → Error
- **Mensaje**: `"La hora de la cita debe ser en el futuro"` (`validation.futureTimeRequired`)
- **Ubicación**: `src/components/dashboard/AppointmentForm.tsx` (línea 160)

### 3. **Validación de rango de tiempo válido** ✅ IMPLEMENTADA
- **Aplica a**: Todas las citas
- **Validación**: `startDateTime >= endDateTime` → Error
- **Mensaje**: `"Rango de tiempo inválido"` (`validation.invalidTimeRange`)
- **Ubicación**: `src/components/dashboard/AppointmentForm.tsx` (línea 157)

### 4. **Deshabilitación de fechas pasadas en calendario** ✅ IMPLEMENTADA
- **Aplica a**: Selección de fecha en el wizard
- **Validación**: `disabled={(date) => date < new Date()}`
- **Ubicación**: `src/components/appointments/wizard-steps/DateTimeSelection.tsx` (línea 127)

### 5. **Validación de campos requeridos** ✅ IMPLEMENTADA
- **Campos obligatorios**:
  - `client_name` (Nombre del cliente)
  - `date` (Fecha)
  - `start_time` (Hora de inicio)
  - `service_id` (Servicio)
- **Ubicación**: `src/components/dashboard/AppointmentForm.tsx` (líneas 138-154)

## 📊 Detalles Técnicos

### Flujo de Validación en el Wizard

```
1. Usuario selecciona fecha
   └─ Si es hoy → Sistema calcula slots con regla de 90 minutos
   └─ Si es futuro → Todos los slots disponibles (9AM-5PM)

2. Usuario selecciona hora
   └─ Si está deshabilitada → Botón disabled, cursor not-allowed
   └─ Si está habilitada → Se permite seleccionar

3. Usuario confirma cita
   └─ Validación: startDateTime >= endDateTime
   └─ Validación: startDateTime < new Date()
   └─ Validación: Campos requeridos completos
   └─ Si todo es válido → Crear cita en Supabase
```

### Interfaz de Usuario

**Mensaje informativo en DateTimeSelection**:
```tsx
{selectedDate && selectedDate.toDateString() === new Date().toDateString() && (
  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
    <p className="text-sm text-blue-800 dark:text-blue-200">
      ℹ️ Para citas el mismo día, solo están disponibles horarios con al menos 90 minutos de anticipación.
    </p>
  </div>
)}
```

**Estilo de slots deshabilitados**:
```tsx
!slot.available && "opacity-40 cursor-not-allowed bg-muted"
```

## 🔍 Validaciones Secundarias

### En AppointmentForm (Admin/Employee):

```tsx
// Validar nombre del cliente
if (!formData.client_name.trim()) {
  toast.error(t('validation.clientNameRequired'))
  return
}

// Validar fecha
if (!formData.date) {
  toast.error(t('validation.dateRequired'))
  return
}

// Validar hora de inicio
if (!formData.start_time) {
  toast.error(t('validation.startTimeRequired'))
  return
}

// Validar servicio
if (!formData.service_id) {
  toast.error(t('validation.serviceRequired'))
  return
}

// Validar que hora de fin sea después de inicio
if (startDateTime >= endDateTime) {
  toast.error(t('validation.invalidTimeRange'))
  return
}

// Validar que sea fecha futura
if (startDateTime < new Date()) {
  toast.error(t('validation.futureTimeRequired'))
  return
}
```

### En AppointmentWizard:

```tsx
const createAppointment = async () => {
  if (!wizardData.businessId || !wizardData.serviceId || 
      !wizardData.date || !wizardData.startTime) {
    toast.error('Faltan datos requeridos para crear la cita');
    return false;
  }

  if (!userId) {
    toast.error('Debes iniciar sesión para crear una cita');
    return false;
  }

  // ... resto de creación
};
```

## 📈 Mejoras Sugeridas

### Propuesta 1: **Hacer configurable el tiempo mínimo**
**Descripción**: Permitir que cada negocio configure su propio tiempo mínimo de anticipación.

**Ventajas**:
- Un salón de belleza podría necesitar 2 horas
- Un consultorio médico podría necesitar solo 30 minutos
- Flexibilidad por tipo de negocio

**Ubicación de implementación**:
- Crear campo `min_advance_booking_minutes` en tabla `businesses`
- Agregar configuración en `CompleteUnifiedSettings.tsx` → Pestaña "Preferencias del Negocio"
- Modificar `DateTimeSelection.tsx` para usar este valor dinámico en vez de 90 fijo

**Ejemplo de código**:
```tsx
// En DateTimeSelection.tsx
const minAdvanceMinutes = business?.min_advance_booking_minutes || 90; // Default 90 min

if (isToday) {
  if (minutesDifference < minAdvanceMinutes) {
    isAvailable = false;
  }
}
```

### Propuesta 2: **Diferenciar reglas por tipo de cita**
**Descripción**: Diferentes tiempos mínimos según el tipo de servicio.

**Ejemplo**:
- Servicios normales: 90 minutos
- Servicios express: 30 minutos
- Servicios premium: 2 horas

**Ubicación de implementación**:
- Agregar campo `min_advance_booking_minutes` a tabla `services`
- En `DateTimeSelection.tsx`, usar `service?.min_advance_booking_minutes`

### Propuesta 3: **Reglas según disponibilidad del empleado**
**Descripción**: Validar que el empleado tenga disponibilidad en el horario seleccionado.

**Considerar**:
- Horarios de trabajo del empleado (`business_employees.work_schedule`)
- Hora de almuerzo (`business_employees.lunch_break_start/end`)
- Disponibilidad específica del día

**Ubicación de implementación**:
- En `DateTimeSelection.tsx`, pasar `employee` como prop
- Validar que la hora esté dentro del `work_schedule` del empleado
- Marcar como no disponible si está en `lunch_break`

### Propuesta 4: **Mostrar contador regresivo**
**Descripción**: Mostrar cuántos minutos faltan para que una cita sea reservable.

**Ejemplo en UI**:
```
❌ 10:00 AM (disponible en 45 min)
✅ 11:30 AM (disponible ahora)
```

**Ubicación de implementación**:
- Modificar renderizado de slots en `DateTimeSelection.tsx`
- Calcular minutos restantes y mostrar badge informativo

```tsx
const minutesUntilAvailable = minAdvanceMinutes - minutesDifference;
if (minutesUntilAvailable > 0) {
  badge = `Disponible en ${minutesUntilAvailable} min`;
}
```

### Propuesta 5: **Ajustar 90 minutos según contexto**
**Descripción**: El tiempo de 90 minutos parece arbitrario. Considerar:

**Opciones**:
- **60 minutos** (1 hora): Más estándar para consultorios/servicios comunes
- **120 minutos** (2 horas): Para servicios que requieren más preparación
- **Tiempo variable**: Basado en duración del servicio (ej: duración + 30 min buffer)

**Recomendación**: Hacer que sea configurable globalmente (ver Propuesta 1)

## 🚀 Implementación Recomendada

**Prioridad 1 (Quick Win)**:
- Hacer configurable el tiempo mínimo por negocio (migración SQL + componente de configuración)

**Prioridad 2 (Mejora UX)**:
- Mostrar contador regresivo "Disponible en X minutos"
- Mejorar mensaje informativo con el valor actual

**Prioridad 3 (Escalable)**:
- Diferenciar por tipo de servicio
- Integrar disponibilidad del empleado

## 📝 Archivos Relacionados

- **Wizard**: `src/components/appointments/AppointmentWizard.tsx`
- **DateTimeSelection**: `src/components/appointments/wizard-steps/DateTimeSelection.tsx`
- **AppointmentForm**: `src/components/dashboard/AppointmentForm.tsx`
- **Validaciones**: `src/lib/validation.ts`
- **Traducciones**: `src/lib/translations.ts` (validation.*)

## 🔗 Base de Datos

### Campos relevantes en `businesses`:
- `id` (PK)
- `name`
- (PENDIENTE) `min_advance_booking_minutes` (sería new field)

### Campos relevantes en `services`:
- `id` (PK)
- `name`
- `duration` (minutos)
- (PENDIENTE) `min_advance_booking_minutes` (sería new field)

### Campos relevantes en `business_employees`:
- `employee_id` (FK)
- `lunch_break_start` (TIME)
- `lunch_break_end` (TIME)
- `has_lunch_break` (BOOLEAN)
- (PENDIENTE) `work_schedule` (JSON o tabla separada)

## ✅ Checklist de Próximas Acciones

- [ ] Decidir si cambia el tiempo mínimo de 90 minutos
- [ ] Decidir si hacerlo configurable por negocio
- [ ] Crear migración SQL si se agrega nuevo campo
- [ ] Actualizar UI de configuración si aplica
- [ ] Actualizar tests si existen
- [ ] Actualizar documentación de usuario
- [ ] Comunicar cambios al equipo

---

**Conclusión**: El sistema YA tiene protecciones robustas para evitar citas sin tiempo suficiente. La regla de 90 minutos para hoy está bien implementada. La siguiente mejora lógica sería hacerla configurable según las necesidades de cada negocio.
