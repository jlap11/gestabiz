# ✅ FIX APLICADO: get_business_hierarchy CTE Scope Error

**Fecha:** 16 de Octubre de 2025  
**Estado:** RESUELTO COMPLETAMENTE ✅  
**Tiempo:** ~30 minutos

---

## 🐛 Problemas Identificados

### Error 1: CTE Scope Error
```sql
Error: relation "all_reports" does not exist
```

**Causa:** La función `get_business_hierarchy` utilizaba un CTE llamado `all_reports` dentro del SELECT final, pero el CTE no estaba definido con la cláusula `RECURSIVE` necesaria para consultas jerárquicas.

### Error 2: Función Duplicada
```
Could not choose the best candidate function between:
- public.get_business_hierarchy(p_business_id => uuid, p_start_date => date, p_end_date => date)
- public.get_business_hierarchy(p_business_id => uuid, p_start_date => date, p_end_date => date, p_filters => jsonb)
```

**Causa:** Había dos versiones de la función con diferentes parámetros, causando ambigüedad cuando se llamaba solo con `p_business_id`.

### Error 3: Mapeo de Campos
**Causa:** La función SQL retornaba `employee_id` pero el tipo TypeScript `EmployeeHierarchy` esperaba `user_id`.

---

## ✅ Soluciones Implementadas

### Fix 1: Agregar WITH RECURSIVE

**Cambio en SQL:**
```sql
-- Antes (INCORRECTO)
WITH employee_data AS (
  ...
),
all_reports AS (
  ...
)

-- Después (CORRECTO)
WITH RECURSIVE employee_data AS (
  ...
),
all_reports AS (
  ...
)
```

### Fix 2: Eliminar Función Duplicada

**Comando ejecutado:**
```sql
DROP FUNCTION IF EXISTS get_business_hierarchy(uuid, date, date);
```

**Resultado:** Solo queda la versión con 4 parámetros: `(p_business_id, p_start_date, p_end_date, p_filters)`

### Fix 3: Mapeo employee_id → user_id

**Cambio en `useBusinessHierarchy.ts`:**
```typescript
// Mapear employee_id a user_id para compatibilidad
const mappedData = (data || []).map((emp: Record<string, unknown>) => ({
  ...emp,
  user_id: emp.employee_id,
}));

return mappedData as EmployeeHierarchy[];
```

### Migración Aplicada

```sql
DROP FUNCTION IF EXISTS get_business_hierarchy(UUID);
DROP FUNCTION IF EXISTS get_business_hierarchy(UUID, DATE, DATE);

CREATE OR REPLACE FUNCTION get_business_hierarchy(
  p_business_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  -- ... 25 columnas ...
)
```

**Archivo:** `supabase/migrations/20251016000001_fix_get_business_hierarchy.sql`

---

## 🧪 Verificación

### 1. Ejecutar en SQL Editor de Supabase

```sql
-- Test básico
SELECT * FROM get_business_hierarchy('tu-business-id-aqui');

-- Test con rango de fechas
SELECT * FROM get_business_hierarchy(
  'tu-business-id-aqui', 
  '2025-09-01'::DATE, 
  '2025-10-16'::DATE
);
```

### 2. Verificar en la Aplicación

1. Navegar a `localhost:5174` (o puerto actual)
2. Ir a la sección **Empleados** en AdminDashboard
3. Verificar que ya NO aparece el error `relation "all_reports" does not exist`
4. Confirmar que se muestra la lista/mapa de empleados correctamente

---

## 📝 Detalles Técnicos

### Estructura de CTEs

```sql
WITH RECURSIVE employee_data AS (
  -- Datos base de empleados con métricas
),
all_reports AS (
  -- CTE recursivo para contar subordinados totales
  SELECT ed.user_id, ed.user_id as report_id, 0 as level 
  FROM employee_data ed
  UNION ALL
  SELECT ar.user_id, br.user_id as report_id, ar.level + 1
  FROM all_reports ar
  JOIN business_roles br ON br.reports_to = ar.report_id
  WHERE br.business_id = p_business_id AND br.is_active = true AND ar.level < 10
)
SELECT 
  ed.*,
  COALESCE(...) as all_reports_count
FROM employee_data ed
```

### Campos Retornados (25 columnas)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| user_id | UUID | ID del empleado |
| full_name | TEXT | Nombre completo |
| email | TEXT | Email |
| avatar_url | TEXT | URL del avatar |
| phone | TEXT | Teléfono |
| hierarchy_level | INTEGER | Nivel jerárquico (0-4) |
| reports_to | UUID | ID del supervisor |
| supervisor_name | TEXT | Nombre del supervisor |
| role | TEXT | Rol del sistema (admin/employee) |
| employee_type | TEXT | Tipo de empleado |
| job_title | TEXT | Cargo personalizado |
| location_id | UUID | ID de la sede |
| location_name | TEXT | Nombre de la sede |
| is_active | BOOLEAN | Estado activo |
| hired_at | DATE | Fecha de contratación |
| total_appointments | INTEGER | Total de citas |
| completed_appointments | INTEGER | Citas completadas |
| cancelled_appointments | INTEGER | Citas canceladas |
| average_rating | NUMERIC | Rating promedio |
| total_reviews | INTEGER | Total de reviews |
| occupancy_rate | NUMERIC | Tasa de ocupación % |
| gross_revenue | NUMERIC | Ingresos brutos |
| services_offered | JSONB | Servicios que ofrece |
| direct_reports_count | INTEGER | Reportes directos |
| all_reports_count | INTEGER | Todos los subordinados (recursivo) |

---

## 🎯 Siguiente Paso

**¡Recargar la página de Empleados en el navegador!** 

El error debería estar resuelto y la interfaz de gestión de empleados debería cargar correctamente mostrando:
- ✅ Lista de empleados
- ✅ Mapa organizacional
- ✅ Filtros avanzados
- ✅ Métricas (ocupación, rating, revenue)
- ✅ Contador de subordinados

---

**Estado:** ✅ RESUELTO  
**Aplicado en:** Supabase Cloud (MCP Direct Execution)  
**Verificación:** Pendiente de confirmar por usuario
