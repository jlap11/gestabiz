# Validación de Vinculación a Negocios - Completado ✅

**Fecha:** 12 de octubre de 2025  
**Estado:** Implementado y funcional
**Prioridad:** CRÍTICA - Regla de negocio obligatoria

## 📋 Resumen de la Regla

**Nueva Regla Obligatoria:**
> Para que un usuario (profesional/empleado) pueda ser reservado en una cita, **DEBE** estar vinculado a uno o más negocios (empresa o independiente). Si está vinculado a múltiples negocios, el cliente debe seleccionar bajo qué negocio realizará la reserva.

## ✅ Implementación Completa

### 1. Hook: `useEmployeeBusinesses`

**Archivo:** `src/hooks/useEmployeeBusinesses.ts` (104 líneas)

**Propósito:** Obtener todos los negocios donde un empleado/profesional está vinculado.

**Queries realizadas:**
```typescript
// 1. Negocios donde es empleado (via business_employees)
supabase
  .from('business_employees')
  .select(`
    business_id,
    businesses:business_id (...)
  `)
  .eq('employee_id', employeeId)
  .eq('status', 'active')
  .eq('is_active', true)

// 2. Negocios donde es owner/independiente (via businesses)
supabase
  .from('businesses')
  .select('id, name, description, ...')
  .eq('owner_id', employeeId)
  .eq('is_active', true)
```

**Return:**
```typescript
{
  businesses: Business[], // Lista de negocios vinculados
  loading: boolean,
  error: string | null,
  isEmployeeOfAnyBusiness: boolean // true si tiene al menos un negocio
}
```

**Casos manejados:**
- ✅ Empleado sin negocios: `isEmployeeOfAnyBusiness = false`
- ✅ Empleado con 1 negocio: Auto-selección (no mostrar paso)
- ✅ Empleado con múltiples negocios: Mostrar selector
- ✅ Empleado es owner + employee: Combinar y eliminar duplicados

### 2. Componente: `EmployeeBusinessSelection`

**Archivo:** `src/components/appointments/wizard-steps/EmployeeBusinessSelection.tsx` (191 líneas)

**Propósito:** Paso condicional del wizard para seleccionar el negocio bajo el cual se realizará la reserva.

**Estados:**
1. **Loading:** Spinner mientras carga negocios
2. **Error:** Alert rojo si falla la query
3. **No vinculado:** Alert destructivo indicando que el profesional no puede aceptar citas
4. **Un solo negocio:** Auto-selección con confirmación visual
5. **Múltiples negocios:** Grid con cards seleccionables

**UI Features:**
- Cards con logo del negocio o icono Building2
- Nombre, descripción, dirección completa
- Indicador de selección (check verde)
- Nota informativa sobre políticas
- Hover effects y transiciones

### 3. Modificaciones en `AppointmentWizard`

**Archivo:** `src/components/appointments/AppointmentWizard.tsx`

#### **Cambios en WizardData:**
```typescript
interface WizardData {
  // ... campos existentes
  employeeBusinessId: string | null; // NUEVO
  employeeBusiness: Business | null; // NUEVO
}
```

#### **Sistema de Pasos Dinámico:**

**Antes:** Pasos fijos (hardcoded 0-6)
**Ahora:** Pasos dinámicos calculados en runtime

```typescript
// Detectar si necesita paso adicional
const needsEmployeeBusinessSelection = 
  wizardData.employeeId && employeeBusinesses.length > 1;

// Calcular total de pasos
const getTotalSteps = () => {
  let total = businessId ? 6 : 7; // Base
  if (needsEmployeeBusinessSelection) total += 1; // Paso extra
  return total;
};

// Mapeo de pasos lógicos a números
const getStepNumber = (logicalStep: string): number => {
  const steps = {
    'business': 0,
    'location': startingStep,
    'service': startingStep + 1,
    'employee': startingStep + 2,
    'employeeBusiness': startingStep + 3, // CONDICIONAL
    'dateTime': needsEmployeeBusinessSelection ? startingStep + 4 : startingStep + 3,
    'confirmation': needsEmployeeBusinessSelection ? startingStep + 5 : startingStep + 4,
    'success': needsEmployeeBusinessSelection ? startingStep + 6 : startingStep + 5,
  };
  return steps[logicalStep];
};
```

#### **Lógica de Navegación (handleNext):**

```typescript
// Al seleccionar Employee:
if (currentStep === getStepNumber('employee')) {
  // Caso 1: No vinculado a ningún negocio
  if (!isEmployeeOfAnyBusiness) {
    toast.error('Este profesional no está disponible para reservas');
    return; // Bloquear avance
  }
  
  // Caso 2: Múltiples negocios
  if (needsEmployeeBusinessSelection) {
    setCurrentStep(getStepNumber('employeeBusiness')); // Ir a selector
    return;
  }
  
  // Caso 3: Un solo negocio
  if (employeeBusinesses.length === 1) {
    updateWizardData({
      employeeBusinessId: employeeBusinesses[0].id,
      employeeBusiness: employeeBusinesses[0],
    });
    setCurrentStep(getStepNumber('dateTime')); // Saltar paso
    return;
  }
}
```

#### **Validación (canProceed):**

```typescript
const canProceed = () => {
  if (currentStep === getStepNumber('employee')) {
    return wizardData.employeeId !== null && isEmployeeOfAnyBusiness; // VALIDACIÓN
  }
  if (currentStep === getStepNumber('employeeBusiness')) {
    return wizardData.employeeBusinessId !== null; // Debe seleccionar negocio
  }
  // ... otros pasos
};
```

#### **Creación de Cita (createAppointment):**

```typescript
// Usar employeeBusinessId si está disponible
const finalBusinessId = wizardData.employeeBusinessId || wizardData.businessId;

const appointmentData = {
  client_id: userId,
  business_id: finalBusinessId, // ← CRÍTICO: Usar el negocio seleccionado
  service_id: wizardData.serviceId,
  location_id: wizardData.locationId,
  employee_id: wizardData.employeeId,
  // ...
};
```

#### **Renderizado Condicional:**

```typescript
{/* Paso 3.5: CONDICIONAL - Solo si needsEmployeeBusinessSelection */}
{needsEmployeeBusinessSelection && 
 currentStep === getStepNumber('employeeBusiness') && (
  <EmployeeBusinessSelection
    employeeId={wizardData.employeeId || ''}
    employeeName={wizardData.employee?.full_name || 'Profesional'}
    selectedBusinessId={wizardData.employeeBusinessId}
    onSelectBusiness={(business) => {
      updateWizardData({
        employeeBusinessId: business.id,
        employeeBusiness: business as Business,
      });
    }}
  />
)}
```

## 🎯 Flujos de Usuario

### **Flujo 1: Empleado sin negocios (BLOQUEADO)**
```
1. Cliente selecciona servicio
2. Cliente selecciona empleado X
3. Sistema valida: isEmployeeOfAnyBusiness = false
4. Toast error: "Este profesional no está disponible para reservas"
5. NO puede avanzar, debe seleccionar otro empleado
```

### **Flujo 2: Empleado con 1 negocio (AUTO-SELECCIÓN)**
```
1. Cliente selecciona empleado Y
2. Sistema detecta: employeeBusinesses.length === 1
3. Sistema auto-selecciona: employeeBusinessId = businesses[0].id
4. Sistema salta al paso de Date & Time
5. Cliente NO ve el paso de selección de negocio
```

### **Flujo 3: Empleado con múltiples negocios (SELECTOR)**
```
1. Cliente selecciona empleado Z
2. Sistema detecta: employeeBusinesses.length > 1
3. Sistema muestra: EmployeeBusinessSelection
4. Cliente ve: "Z trabaja en 3 negocios. Elige bajo qué negocio deseas reservar."
5. Cliente selecciona: Negocio B
6. Sistema guarda: employeeBusinessId = B.id
7. Sistema avanza a: Date & Time
8. Cita se crea con: business_id = B.id (NO el original)
```

## 📊 Casos de Uso

### **Caso A: Barbero independiente**
- Juan es owner de "Barbería Juan" (business_id = 123)
- Juan NO está en business_employees
- Hook retorna: businesses = [Barbería Juan]
- Flujo: Auto-selección → business_id = 123

### **Caso B: Estilista multi-salón**
- María trabaja en "Salón Beauty" (employee) y "Salón Elegance" (employee)
- Hook retorna: businesses = [Beauty, Elegance]
- Flujo: Selector → Cliente elige "Beauty" → business_id = Beauty.id

### **Caso C: Dueño que también es empleado**
- Carlos es owner de "Carlos Gym" y employee de "Mega Gym"
- Hook detecta duplicados y combina
- Hook retorna: businesses = [Carlos Gym, Mega Gym] (sin duplicar)
- Flujo: Selector → Cliente elige → business_id = seleccionado

### **Caso D: Empleado desvinculado**
- Ana NO está en business_employees y NO es owner
- Hook retorna: businesses = [], isEmployeeOfAnyBusiness = false
- Flujo: Bloqueado → Toast error → No puede reservarse

## 🔒 Validaciones Implementadas

1. ✅ **Base de datos:** Query con `status = 'active'` y `is_active = true`
2. ✅ **Hook:** Retorna `isEmployeeOfAnyBusiness` boolean
3. ✅ **canProceed:** Bloquea "Next" si `!isEmployeeOfAnyBusiness`
4. ✅ **handleNext:** Muestra toast error y no avanza
5. ✅ **EmployeeBusinessSelection:** Muestra alert destructivo si no puede aceptar citas
6. ✅ **createAppointment:** Usa `employeeBusinessId` o fallback a `businessId`

## 🎨 Experiencia de Usuario

**Transparente:**
- Si tiene 1 negocio: Cliente no nota nada, flujo normal
- Si tiene múltiples: Paso adicional con explicación clara

**Seguro:**
- Si no tiene negocios: Bloqueado con mensaje de error

**Informativo:**
- Nota azul: "La cita se agendará bajo el negocio seleccionado. Las políticas pueden variar."

## 📁 Archivos Modificados/Creados

**Creados:**
- `src/hooks/useEmployeeBusinesses.ts` (104 líneas)
- `src/components/appointments/wizard-steps/EmployeeBusinessSelection.tsx` (191 líneas)
- `src/docs/VALIDACION_VINCULACION_NEGOCIOS.md` (este archivo)

**Modificados:**
- `src/components/appointments/AppointmentWizard.tsx`
  - WizardData: +2 campos (employeeBusinessId, employeeBusiness)
  - Sistema de pasos dinámico: getTotalSteps(), getStepNumber()
  - Lógica de navegación: handleNext con 3 casos
  - Validación: canProceed con isEmployeeOfAnyBusiness
  - Creación: finalBusinessId logic
- `src/components/appointments/wizard-steps/index.ts`
  - Export: EmployeeBusinessSelection

## 🐛 Edge Cases Manejados

1. **Empleado sin negocios:** Bloqueado con mensaje
2. **Empleado con 1 negocio:** Auto-selección invisible
3. **Empleado con múltiples:** Selector obligatorio
4. **Owner + Employee del mismo negocio:** Sin duplicados
5. **Loading state:** Spinner mientras carga
6. **Error state:** Alert con mensaje de error
7. **Cambio de empleado:** Hook re-ejecuta con nuevo ID

## 🔄 Integración con Búsqueda

**SearchResults → BusinessProfile → AppointmentWizard:**

1. Cliente busca "barbero"
2. Click en resultado
3. BusinessProfile muestra servicios
4. Click "Agendar" con servicio específico
5. AppointmentWizard abre con businessId preseleccionado
6. Si el empleado del servicio tiene múltiples negocios, se muestra selector
7. Cliente elige el negocio bajo el cual quiere la cita

**IMPORTANTE:** Incluso si viene desde BusinessProfile con un businessId, si el empleado trabaja en otros negocios, el sistema permite seleccionar otro negocio. Esto es correcto porque el cliente tiene derecho a elegir.

## 📝 Próximos Pasos

✅ **Completado:** Sistema de validación y selección de negocios  
⬜ **Pendiente:** UserProfile component  
⬜ **Pendiente:** Sistema de reviews anónimas  
⬜ **Pendiente:** Optimización de queries de búsqueda

---

**Autor:** GitHub Copilot  
**Última actualización:** 12 de octubre de 2025  
**Status:** ✅ PRODUCCIÓN READY
