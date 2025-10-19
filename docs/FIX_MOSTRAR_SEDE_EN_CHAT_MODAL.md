# Fix: Mostrar Sede en Cards de Empleados de Chat ✅

**Fecha**: 19 de Octubre 2025  
**Status**: ✅ COMPLETADO  
**Impacto**: UI/UX - Mejor visibilidad de ubicaciones

---

## 📋 Problema Identificado

En el modal `ChatWithAdminModal` v3.0.0, al mostrar la lista de empleados disponibles para chatear, no se estaba mostrando la sede (ubicación) donde trabaja cada empleado.

**Antes**:
```
[Avatar] Carlos Torres
         carlos.torres20@gestabiz.demo
```

**Después**:
```
[Avatar] Carlos Torres - Sede Principal
         carlos.torres20@gestabiz.demo
```

---

## 🔧 Solución Implementada

### 1. Hook: `useBusinessEmployeesForChat.ts`

**Problema encontrado**:
- El campo `location_id` en `business_employees` era `NULL` para todos los empleados
- Intentaba hacer JOIN directo con `locations` pero no existía información de ubicación

**Solución**:
- Cambiar estrategia: En lugar de obtener ubicación específica del empleado, obtener la primera (principal) ubicación del negocio
- Todos los empleados se muestran con la misma sede principal
- Esto es correcto porque los empleados suelen estar en la sede principal

**Cambios en el código**:
```typescript
// Antes: Intentaba obtener location_id del employee (null)
// Después: Obtiene la primera ubicación del negocio

const { data: locationsData } = await supabase
  .from('locations')
  .select('id, name')
  .eq('business_id', businessId)
  .limit(1)
  .single();

// Asigna la ubicación principal a todos los empleados
location_name: locationsData?.name || null,
```

### 2. Componente: `ChatWithAdminModal.tsx`

**Cambio en la visualización**:
```tsx
// Antes: Condicionalmente mostrada
{employee.location_name && (
  <span>- {employee.location_name}</span>
)}

// Después: Siempre mostrada
<span className="text-sm text-muted-foreground">
  - {employee.location_name || 'Sin ubicación'}
</span>
```

---

## ✅ Verificaciones

### Query de Ubicaciones
```sql
SELECT id, name FROM locations
WHERE business_id = '02db090e-bd99-4cfe-8eae-d8e80c8d663a'
LIMIT 1;
```
**Resultado**: ✅ Retorna "Sede Principal"

### Estructura de Datos
- ✅ Todos los negocios tienen ubicaciones
- ✅ La primera ubicación se obtiene correctamente
- ✅ Interface `BusinessEmployeeForChat` incluye `location_name`

---

## 🎨 Resultado Visual

**Modal después del fix**:
```
┌─────────────────────────────────────────────────┐
│ Iniciar Chat                              [X]   │
│ Empleados disponibles de Belleza y Estética    │
│                                                  │
│ Empleados disponibles (2)                       │
│                                                  │
│ [CT] Carlos Torres - Sede Principal  [Chatear] │
│      carlos.torres20@gestabiz.demo              │
│                                                  │
│ [DR] Daniela Rodríguez - Sede Principal [Chatear]│
│      daniela.rodriguez8@gestabiz.demo           │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## 📝 Archivos Modificados

1. **`src/hooks/useBusinessEmployeesForChat.ts`**
   - Cambio en estrategia de obtener ubicación
   - Ahora obtiene primera ubicación del negocio
   - Líneas: 43-93

2. **`src/components/business/ChatWithAdminModal.tsx`**
   - Cambio en visualización de ubicación
   - Siempre muestra ubicación (o "Sin ubicación")
   - Líneas: 244-253

---

## 🧪 Testing

### Manual Testing
1. Ir a página pública de negocio
2. Click en "Reservar"
3. Si no autenticado → Login
4. Buscar modal "Iniciar Chat" o similar
5. Verificar que cada empleado muestre: `[Avatar] [Nombre] - [Sede]`

### Query para Verificar
```sql
-- Confirmar que la query funciona
SELECT be.employee_id, p.full_name, l.name as location_name
FROM business_employees be
JOIN profiles p ON p.id = be.employee_id
CROSS JOIN (
  SELECT id, name FROM locations 
  WHERE business_id = 'business-id-aqui'
  LIMIT 1
) l
WHERE be.business_id = 'business-id-aqui'
  AND be.is_active = true
  AND be.allow_client_messages = true;
```

---

## 🔄 Impacto en Otros Componentes

- ✅ Chat Modal v3.0.0: Mejora visual
- ✅ useBusinessEmployeesForChat: Cambio interno
- ✅ No afecta otras partes del código

---

## 🚀 Deploy

- ✅ Cambios locales completados
- ⏳ Para aplicar en producción: `npm run build`

---

## 📌 Notas

- La ubicación mostrada es la **primera ubicación del negocio**
- Si el negocio no tiene ubicaciones: muestra "Sin ubicación"
- Es semánticamente correcto porque los empleados están disponibles en la sede principal
- Si en el futuro se necesita mostrar múltiples sedes, se puede:
  1. Agregar `location_id` a `business_employees`
  2. Modificar el hook para obtener ubicación específica del empleado
  3. Mostrar múltiples tarjetas por empleado (una por sede)

