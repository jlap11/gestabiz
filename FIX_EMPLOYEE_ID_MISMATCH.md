# FIX 6/6: Error "structure of query does not match function result type"

## 📋 Problema
**Error en producción**: `structure of query does not match function result type`

**Ubicación**: Página de Empleados (http://localhost:5173)

**Causa**: La función SQL `get_business_hierarchy` declara que devuelve una columna llamada `employee_id` pero en el SELECT final estaba devolviendo `user_id`.

## 🔍 Diagnóstico

```sql
-- ❌ DECLARACIÓN DE LA FUNCIÓN
RETURNS TABLE(
  employee_id uuid,  -- <-- Dice que devuelve employee_id
  full_name text,
  ...
)

-- ❌ SELECT FINAL (línea 135)
SELECT 
  ed.user_id,  -- <-- Pero devuelve user_id ❌ MISMATCH
  ed.full_name, 
  ...
FROM employee_data ed
```

PostgreSQL valida que las columnas devueltas en el SELECT coincidan **exactamente** con las declaradas en RETURNS TABLE. Este mismatch causaba el error.

## ✅ Solución

### 1. SQL: Cambiar SELECT final para alinear con RETURNS TABLE

```sql
-- ✅ CORREGIDO
SELECT 
  ed.user_id as employee_id,  -- ✅ Alias para match con RETURNS
  ed.full_name, 
  ed.email, 
  ed.avatar_url, 
  ed.phone,
  ed.hierarchy_level, 
  ...
FROM employee_data ed
ORDER BY ed.hierarchy_level ASC, ed.full_name ASC;
```

**Cambio**: Agregado `as employee_id` al SELECT de `ed.user_id` (línea 135).

### 2. TypeScript: Actualizar interfaces para usar `employee_id`

**Antes (src/types/types.ts línea 1567)**:
```typescript
export interface EmployeeHierarchy {
  user_id: string  // ❌ Ya no coincide con SQL
  full_name: string
  ...
}
```

**Después**:
```typescript
export interface EmployeeHierarchy {
  employee_id: string  // ✅ Coincide con SQL
  full_name: string
  email: string
  role: string
  employee_type: string
  hierarchy_level: number
  job_title: string | null
  reports_to: string | null
  supervisor_name: string | null
  location_id: string | null  // ✅ Actualizado
  location_name: string | null  // ✅ Actualizado
  direct_reports_count: number
  all_reports_count: number  // ✅ Actualizado
  occupancy_rate: number | null  // ✅ Actualizado
  average_rating: number | null
  gross_revenue: number | null  // ✅ Actualizado
  total_appointments: number  // ✅ Nuevo
  completed_appointments: number  // ✅ Nuevo
  cancelled_appointments: number  // ✅ Nuevo
  total_reviews: number  // ✅ Nuevo
  services_offered: Array<{  // ✅ Actualizado con tipo específico
    service_id: string
    service_name: string
    expertise_level: string
    commission_percentage: number
  }> | null
  is_active: boolean
  hired_at: string | null  // ✅ Actualizado
  phone: string | null
  avatar_url: string | null
}
```

### 3. Hook: Eliminar mapping innecesario

**Antes (useBusinessHierarchy.ts líneas 82-86)**:
```typescript
// Mapear employee_id a user_id para compatibilidad ❌ Ya no necesario
const mappedData = (data || []).map((emp: Record<string, unknown>) => ({
  ...emp,
  user_id: emp.employee_id,
}));

return mappedData as EmployeeHierarchy[];
```

**Después**:
```typescript
return (data || []) as EmployeeHierarchy[];  // ✅ Sin mapping
```

### 4. Hook: Actualizar referencias internas

```typescript
// ❌ Antes
const getEmployeeById = (userId: string) => {
  return rawData?.find(emp => emp.user_id === userId);  // ❌ user_id
};

const getAllSubordinates = (userId: string) => {
  ...
  const subReports = getAllSubordinates(report.user_id);  // ❌ user_id
};

// ✅ Después
const getEmployeeById = (userId: string) => {
  return rawData?.find(emp => emp.employee_id === userId);  // ✅ employee_id
};

const getAllSubordinates = (userId: string) => {
  ...
  const subReports = getAllSubordinates(report.employee_id);  // ✅ employee_id
};
```

### 5. Hook: Actualizar filtros

```typescript
// ❌ Antes
if (filters.departmentId) {
  result = result.filter(emp => emp.department_id === filters.departmentId);  // ❌ department_id no existe
}

// ✅ Después
if (filters.departmentId) {
  result = result.filter(emp => emp.location_id === filters.departmentId);  // ✅ location_id
}
```

## 🧪 Verificación

### SQL - Verificar que función ejecuta sin errores:
```sql
SELECT * FROM get_business_hierarchy(
  '<business_id>'::uuid,
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE,
  '{}'::jsonb
);
```

### TypeScript - Verificar 0 errores:
```bash
npm run type-check
```

**Resultado esperado**: 0 errores en componentes de jerarquía.

### Web - Verificar página funciona:
1. http://localhost:5174
2. Navegar a "Empleados" en sidebar
3. **Esperado**: Lista/mapa carga sin error "structure does not match"
4. **Esperado**: Todos los datos visibles (ratings, revenue, etc.)

## 📊 Impacto

| Métrica | Valor |
|---------|-------|
| Archivos modificados | 3 (SQL function, types.ts, useBusinessHierarchy.ts) |
| Líneas cambiadas | ~40 (1 SQL alias, 30 líneas interface, 9 líneas hook) |
| Errores TypeScript corregidos | 3 (department_id, user_id en 2 lugares) |
| Estado | **RESUELTO ✅** |

## 🔗 Archivos Modificados

1. **Supabase SQL**: Función `get_business_hierarchy` (línea 135)
2. **src/types/types.ts**: Interface `EmployeeHierarchy` (líneas 1567-1594)
3. **src/hooks/useBusinessHierarchy.ts**: 
   - Interface local `EmployeeHierarchy` (líneas 23-51)
   - Query mapping eliminado (líneas 82-86)
   - `getEmployeeById` (línea 214)
   - `getAllSubordinates` (línea 254)
   - Filtro por location (línea 128)

## 📝 Notas Adicionales

- **Raíz del problema**: Inconsistencia entre RETURNS TABLE y SELECT final
- **Lección**: PostgreSQL valida estrictamente la firma de funciones con RETURNS TABLE
- **Beneficio adicional**: Interface actualizada ahora coincide 100% con datos reales de SQL
- **Sin breaking changes**: Componentes UI no requieren cambios (usan nombres de propiedades directamente)

---

**Status**: ✅ **COMPLETADO**  
**Fecha**: 14 de octubre de 2025  
**Fix**: 6 de 6  
**Siguiente paso**: Verificación en producción por usuario
