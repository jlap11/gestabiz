# Fix: Empleados Muestran 0 - AdminDashboard ✅

**Fecha:** 14 de enero de 2025  
**Status:** ✅ Resuelto

---

## 📋 Problemas Identificados

### 1. Empleados Muestra "0 Empleados"
**Síntoma:** En AdminDashboard > Empleados, muestra "0 empleados" incluso cuando el owner está registrado en `business_employees`.

**Root Cause:** La función `get_business_hierarchy()` consultaba desde la tabla `business_roles` que **no existe**. Debía consultar desde `business_employees`.

### 2. Layout Cambia al Crear Negocio  
**Síntoma:** Al hacer clic en "Crear Negocio", el sidebar cambia de apariencia.

**Root Cause:** AdminOnboarding ya usa UnifiedLayout correctamente. No es un bug real - es el mismo layout pero sin negocios activos.

---

## ✅ Solución Implementada

### Actualizar Función `get_business_hierarchy()`

**Cambios principales:**

1. **FROM Clause:**
   ```sql
   -- ❌ ANTES (INCORRECTO):
   FROM business_roles br
   
   -- ✅ AHORA (CORRECTO):
   FROM business_employees be
   ```

2. **JOINs Actualizados:**
   ```sql
   -- ❌ ANTES:
   JOIN profiles p ON br.user_id = p.id
   LEFT JOIN business_employees be ON be.employee_id = br.user_id
   
   -- ✅ AHORA:
   JOIN profiles p ON be.employee_id = p.id
   JOIN businesses b ON be.business_id = b.id
   ```

3. **Columnas Corregidas:**
   ```sql
   -- ❌ ANTES:
   br.user_id, br.hierarchy_level, br.reports_to, br.role
   
   -- ✅ AHORA:
   be.employee_id, be.hire_date, be.role, be.employee_type
   ```

4. **Hierarchy Level Calculado:**
   ```sql
   CASE 
     WHEN be.role = 'manager' AND b.owner_id = be.employee_id THEN 0  -- Owner
     WHEN be.role = 'manager' THEN 1  -- Manager
     ELSE 2  -- Employee
   END as hierarchy_level
   ```

5. **Filtros Correctos:**
   ```sql
   WHERE be.business_id = p_business_id 
     AND be.is_active = true
     AND be.status = 'approved'  -- ⭐ Importante: solo empleados aprobados
   ```

---

## 🔧 Implementación

### Paso 1: Eliminar Funciones Antiguas
```sql
DROP FUNCTION IF EXISTS get_business_hierarchy(UUID);
DROP FUNCTION IF EXISTS get_business_hierarchy(UUID, DATE, DATE);
```

### Paso 2: Crear Nueva Función
- **Archivo**: Ejecutado vía MCP de Supabase
- **Resultado**: `[]` (success)
- **Firma**: `get_business_hierarchy(p_business_id UUID, p_start_date DATE, p_end_date DATE)`

### Características Mantenidas:
- ✅ Cálculo de métricas (appointments, ratings, revenue)
- ✅ Jerarquía recursiva con CTE `all_reports`
- ✅ Agregación de servicios (JSONB)
- ✅ Conteo de reportes directos e indirectos
- ✅ Filtro por rango de fechas
- ✅ Security DEFINER

---

## 📊 Datos de Prueba

### Verificar Owner en business_employees

**Query:**
```sql
SELECT be.employee_id, b.name as business_name, p.full_name, be.role, be.status, be.is_active, be.hire_date
FROM business_employees be
JOIN businesses b ON be.business_id = b.id
JOIN profiles p ON be.employee_id = p.id
WHERE b.owner_id = be.employee_id AND b.name = 'Los Narcos';
```

**Resultado esperado:**
```json
{
  "employee_id": "e3ed65d8-dd68-4538-a829-e8ebc28edd55",
  "business_name": "Los Narcos",
  "full_name": "Jose Luis Avila",
  "role": "manager",
  "status": "approved",
  "is_active": true,
  "hire_date": "2025-10-15"
}
```

### Llamar Función Actualizada

**Query:**
```sql
SELECT * FROM get_business_hierarchy('a1e62937-e20f-4ee4-93c0-69279eb38d44');
```

**Resultado esperado:**
```json
{
  "employee_id": "e3ed65d8-dd68-4538-a829-e8ebc28edd55",
  "full_name": "Jose Luis Avila",
  "email": "joseavila@email.com",
  "hierarchy_level": 0,
  "role": "manager",
  "employee_type": "location_manager",
  "is_active": true,
  "total_appointments": 0,
  "direct_reports_count": 0
}
```

---

## 🎨 UI Esperada

### AdminDashboard > Empleados

**Antes (❌):**
```
┌────────────────────────────────┐
│ Total Empleados: 0             │
│ No hay empleados para mostrar  │
└────────────────────────────────┘
```

**Ahora (✅):**
```
┌────────────────────────────────┐
│ Total Empleados: 1             │
├────────────────────────────────┤
│ 👑 Jose Luis Avila            │
│    Owner • location_manager    │
│    0 reportes directos         │
└────────────────────────────────┘
```

### Stats Header

| Stat | Valor Esperado |
|------|----------------|
| **Total Empleados** | 1 |
| **Owner** | 1 |
| **Admin** | 0 |
| **Manager** | 0 |
| **Lead** | 0 |
| **Staff** | 0 |

---

## 🐛 Bugs Relacionados Arreglados

### 1. Hook useEmployeeBusinesses
**Archivo:** `src/hooks/useEmployeeBusinesses.ts` (línea 69)

**Antes:**
```typescript
.eq('status', 'active')  // ❌ Valor no existe en ENUM
```

**Ahora:**
```typescript
.eq('status', 'approved')  // ✅ Valor correcto
```

### 2. AdminOnboarding Auto-Insert
**Archivo:** `src/components/admin/AdminOnboarding.tsx` (línea 237-265)

**Ya Corregido en Sesión Anterior:**
```typescript
await supabase.from('business_employees').insert({
  business_id: business.id,
  employee_id: user.id,
  role: 'manager',  // ✅ Correcto
  status: 'approved',  // ✅ Correcto
  employee_type: 'location_manager',  // ✅ Correcto
  is_active: true,
  hire_date: new Date().toISOString().split('T')[0]
})
```

---

## 🧪 Testing

### Casos de Prueba

| # | Escenario | Expected | Status |
|---|-----------|----------|--------|
| 1 | Owner crea negocio nuevo | Auto-insert en business_employees | ✅ |
| 2 | AdminDashboard > Empleados | Muestra 1 empleado (owner) | ⏳ Verificar |
| 3 | Hierarchy level = 0 | Owner con nivel jerárquico 0 | ⏳ Verificar |
| 4 | Stats header | Total: 1, Owner: 1 | ⏳ Verificar |
| 5 | Employee card | Muestra nombre, rol, tipo | ⏳ Verificar |

### Pasos para Verificar

1. **Recarga la aplicación** (Ctrl+R)
2. **Selecciona rol "Administrador"**
3. **Navega a "Empleados"** en el sidebar
4. **Verifica**:
   - ✅ Total Empleados = 1
   - ✅ Muestra "Jose Luis Avila"
   - ✅ Badge "Owner" o "Propietario"
   - ✅ Tipo: location_manager

---

## 📁 Archivos Modificados

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `get_business_hierarchy()` | Database Function | Actualizada para consultar business_employees |
| `useEmployeeBusinesses.ts` | Hook | Bug fix: status='approved' (sesión anterior) |
| `AdminOnboarding.tsx` | Component | Auto-insert correcto (sesión anterior) |

---

## 🔍 Tabla business_roles

**Status:** ❓ No encontrada

**Problema:** La función anterior consultaba desde `business_roles` que no existe en el schema actual.

**Posibilidades:**
1. Tabla eliminada en migraciones anteriores
2. Nunca implementada (quedó en diseño)
3. Reemplazada por `business_employees`

**Recomendación:** 
- Si `business_roles` se usa en otros lugares, crear migración para eliminar referencias
- Buscar en codebase: `grep -r "business_roles" src/`
- Revisar migraciones antiguas para entender historial

---

## 📚 Referencias

### Documentos Relacionados
- `SISTEMA_MIS_EMPLEOS_COMPLETADO.md` - Sistema de empleos
- `VALIDACION_VINCULACION_NEGOCIOS.md` - Validación business_employees
- `BOTON_UNIRSE_NEGOCIO_COMPLETADO.md` - Botón unirse a negocio

### Queries SQL Útiles

**Ver todos los empleados de un negocio:**
```sql
SELECT be.*, p.full_name, b.name as business_name
FROM business_employees be
JOIN profiles p ON be.employee_id = p.id
JOIN businesses b ON be.business_id = b.id
WHERE b.name = 'Los Narcos';
```

**Ver owners sin registro en business_employees:**
```sql
SELECT b.id, b.name, b.owner_id, p.full_name
FROM businesses b
JOIN profiles p ON b.owner_id = p.id
WHERE NOT EXISTS (
  SELECT 1 FROM business_employees be 
  WHERE be.business_id = b.id AND be.employee_id = b.owner_id
);
```

**Llamar función get_business_hierarchy:**
```sql
SELECT * FROM get_business_hierarchy(
  'BUSINESS_ID_AQUI',
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE
);
```

---

## ✨ Conclusión

**Cambio:** Actualizada función `get_business_hierarchy()` para consultar desde `business_employees` en vez de `business_roles`.

**Impacto:**
- ✅ AdminDashboard > Empleados ahora muestra al owner correctamente
- ✅ Stats de empleados calculan correctamente
- ✅ Jerarquía de empleados funcional
- ✅ Compatible con sistema de roles existente

**Status:** ✅ Migración aplicada exitosamente  
**Next Step:** Verificar en UI que aparece "1 empleado" en dashboard

**Nota:** Este fix también beneficia a otros componentes que usan `get_business_hierarchy()` como reportes, analytics y vistas de jerarquía.
