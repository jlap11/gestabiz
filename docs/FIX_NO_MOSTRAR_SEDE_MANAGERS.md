# ✅ FIX: No Mostrar Sede para Managers/Owners

**Fecha**: 19 de Octubre 2025  
**Status**: ✅ COMPLETADO  
**Impacto**: UX - Claridad en roles

---

## 🎯 Problema Identificado

En el modal de chat, cuando se mostraba la lista de empleados, los **managers/owners** también mostraban la sede (ej: "- Sede Sur"). Esto es incorrecto porque:

1. Los managers/owners no trabajan en una sede específica
2. Trabajan en **todas las sedes** del negocio
3. No tiene sentido mostrar una ubicación para ellos

**Antes**:
```
[Manager] Carlos Torres - Sede Sur  ❌ (incorrecto)
[Employee] Daniela Rodríguez - Sede Sur  ✅ (correcto)
```

**Después**:
```
[Manager] Carlos Torres  ✅ (sin sede)
[Employee] Daniela Rodríguez - Sede Sur  ✅ (con sede)
```

---

## 🔧 Solución Implementada

**Archivo**: `src/hooks/useBusinessEmployeesForChat.ts`

```typescript
// ✅ NUEVO: Detectar si es manager y NO mostrar ubicación
const isManager = emp.role === 'manager';

return {
  employee_id: emp.employee_id,
  full_name: profiles?.full_name || 'Empleado',
  email: profiles?.email || '',
  avatar_url: profiles?.avatar_url || null,
  role: emp.role || 'employee',
  // ✅ Si es manager: location_name = null
  location_id: isManager ? null : (locationsData?.id || null),
  location_name: isManager ? null : (locationsData?.name || null),
};
```

**Lógica**:
- Si `role === 'manager'`: `location_name = null` (no muestra ubicación)
- Si `role !== 'manager'`: `location_name = ubicación del negocio` (muestra ubicación)

---

## ✨ Resultado Visual

**Modal Actualizado**:
```
┌─────────────────────────────────────────────────────┐
│ Iniciar Chat                                   [X]   │
│ Empleados disponibles de Belleza y Estética       │
│                                                      │
│ Empleados disponibles (2)                           │
│                                                      │
│ [CT] Carlos Torres                    [Chatear]    │
│      carlos.torres20@gestabiz.demo                  │
│                                                      │
│ [DR] Daniela Rodríguez - Sede Sur    [Chatear]    │
│      daniela.rodriguez8@gestabiz.demo              │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 🧪 Testing

### Caso 1: Cliente ve empleados
- ✅ Empleados normales muestran su sede
- ✅ Managers NO muestran sede

### Caso 2: Owner ve empleados
- ✅ Managers NO muestran sede
- ✅ Employees muestran sede

### Caso 3: Diferentes roles
- ✅ `role = 'manager'`: Sin sede
- ✅ `role = 'service_provider'`: Con sede
- ✅ `role = 'support_staff'`: Con sede
- ✅ `role = 'location_manager'`: Con sede

---

## 📊 Cambios Realizados

| Archivo | Cambio | Líneas |
|---------|--------|--------|
| `useBusinessEmployeesForChat.ts` | + Lógica para excluir sede de managers | 84-96 |

---

## ✅ Validaciones

- ✅ TypeScript: Sin errores
- ✅ Backward compatible
- ✅ No requiere cambios en otros archivos
- ✅ Lógica clara y mantenible

---

## 📌 Notas Técnicas

- Los managers tienen `role = 'manager'` en `business_employees`
- La ubicación se obtiene de la primera sede del negocio
- Managers no se asocian a una sede específica en BD
- Por lo tanto, no tiene sentido mostrar una para ellos

---

## 🎯 Regla de Negocio Establecida

**Mostrar ubicación SOLO para**:
- `service_provider`
- `support_staff`
- `location_manager`
- `team_lead`

**NO mostrar ubicación para**:
- `manager` (owners/dueños del negocio)

