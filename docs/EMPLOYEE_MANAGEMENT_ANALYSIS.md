# Análisis y Plan de Acción: Sistema de Gestión Jerárquica de Empleados
**Fecha**: 14 de Octubre de 2025  
**Versión**: 1.2 
**Autor**: AI Assistant

> **🎉 FASE 1 COMPLETADA** (14/10/2025): Backend y migraciones implementadas exitosamente.  
> Ver detalles completos en: [EMPLOYEE_HIERARCHY_FASE1_COMPLETADA.md](./EMPLOYEE_HIERARCHY_FASE1_COMPLETADA.md)
>
> **🚀 FASE 2 EN PROGRESO** (14/10/2025): Hooks y servicios 67% completos (4/6 tareas).  
> Ver detalles completos en: [EMPLOYEE_HIERARCHY_FASE2_COMPLETADA.md](../EMPLOYEE_HIERARCHY_FASE2_COMPLETADA.md)

---

## 📋 Resumen Ejecutivo

Este documento analiza el estado actual del sistema de empleados en AppointSync Pro y propone un plan de acción para implementar un sistema de gestión jerárquica completo con visualizaciones avanzadas, métricas de rendimiento y filtros especializados.

**Estado actual:** Fase 1 (Backend/Database) completada con 6 migraciones, 7 funciones SQL, 4 permisos nuevos y 9 índices optimizados.

### Objetivos Principales
1. **Listar empleados con jerarquía**: Owner → Admins → Managers → Staff
2. **Mostrar sede principal y servicios por empleado**: Por cada sede donde opera
3. **Métricas de desempeño**: Calificación, ocupación diaria, ingresos generados
4. **Visualizaciones duales**: Vista en mapa organizacional + vista en lista segmentada
5. **Filtros avanzados**: Por servicios, calificación, ocupación, ingresos, periodo

---

## 1. Análisis del Estado Actual

### 1.1 Contexto del Sistema
- **Dynamic multi-role system**: Todos los usuarios pueden actuar como admin, employee o client dependiendo del negocio y relaciones (hook `useUserRoles`, tablas `businesses`, `business_roles`, `business_employees`).
- **Estado en UI**: En `AdminDashboard` la entrada "Empleados" muestra un placeholder; existe `EmployeeManagementNew.tsx` con flujos de onboarding locales (localStorage) NO conectados a Supabase.
- **Requerimiento crítico**: Construir pantalla completa que liste TODOS los usuarios asociados a un negocio, con jerarquía clara (owner > admins > employees), mostrando sede asignada y servicios por sede que ofrece cada empleado, y habilitar visualizaciones estilo mapa y lista con filtros avanzados.

### 1.2 Tabla de Hallazgos Clave

| Aspecto | Estado Actual | Gap Identificado |
|---------|---------------|------------------|
| **Jerarquía** | No existe estructura formal | Falta modelo `reports_to` o `hierarchy_level` |
| **Métricas UI** | `TopPerformers.tsx` solo para dashboards | No hay pantalla dedicada con filtros |
| **Vista Empleados** | Placeholder en `AdminDashboard` | Componente completo inexistente |
| **Calificaciones** | Tabla `reviews` global | Falta agregación por negocio+empleado |
| **Ocupación** | No calculada | Necesita: citas/día vs capacidad teórica |
| **Sede múltiple** | `employee_services.location_id` | UI no refleja servicios por sede |
| **Filtros** | No existen | Requiere UI+backend paramétrico |

---

## 2. Análisis del Modelo de Datos

### 2.1 Entidades Principales en Supabase

#### `businesses`
```sql
Columnas clave:
- id (uuid, PK)
- owner_id (uuid) → Raíz de la jerarquía
- name, description, phone, email, address, city, state, country
- total_reviews, average_rating, total_appointments, total_revenue
- is_active
```
**Rol**: Identifica al dueño del negocio (nivel 0 jerarquía)

#### `business_roles` ⭐ CRÍTICO
```sql
Columnas actuales:
- id, business_id, user_id, role (admin/employee)
- employee_type (service_provider/support_staff)
- assigned_by, assigned_at, is_active
- created_at, updated_at

FALTA:
- hierarchy_level (INTEGER) → 0=Owner, 1=Admin, 2=Manager, 3=Lead, 4=Staff
- reports_to (UUID) → Referencia a supervisor directo
```
**Rol**: Gestiona roles y permisos. **Admin Dueño = user_id === businesses.owner_id**

#### `business_employees` ⭐ CRÍTICO
```sql
Columnas actuales:
- id, business_id, employee_id (FK a profiles)
- role (text, default 'employee')
- status (pending/approved/rejected)
- location_id (UUID) → Sede principal asignada
- employee_type (service_provider/support_staff)
- offers_services (boolean)
- salary_base, salary_type, contract_type
- hired_at, is_active

OBSERVACIONES:
- Duplica concepto 'role' con business_roles
- location_id es sede PRINCIPAL, pero empleado puede ofrecer servicios en múltiples sedes
- ❌ FALTA: Columna 'job_title' o 'position' para cargo dentro del negocio
  (Ejemplo: "Estilista Senior", "Recepcionista", "Gerente de Ventas")
  Esto es DISTINTO a role del sistema (admin/employee) y employee_type (service_provider/support_staff)
```
**Rol**: Atributos operativos y laborales del empleado

**⚠️ IMPORTANTE - Sistema de Cargos**:
- **Role del sistema**: admin, employee, client (en `business_roles`)
- **Employee type**: service_provider, support_staff, location_manager, team_lead
- **Job title** (NUEVO): Cargo personalizado dentro del negocio (libre texto)
  - Ejemplos: "Estilista Senior", "Barbero Junior", "Recepcionista", "Gerente de Sucursal"
  - Se mostrará en UI junto a nombre del empleado
  - Configurable por cada negocio

#### `employee_services` ⭐ CRÍTICO
```sql
Columnas:
- id, employee_id, service_id, business_id, location_id
- expertise_level (INTEGER 1-5)
- commission_percentage, is_active
- created_at, updated_at

OBSERVACIÓN:
- Permite modelar servicios por sede: un empleado puede ofrecer Servicio A en Sede 1 y Servicio B en Sede 2
```
**Rol**: Relaciona empleado-servicio-sede con nivel de expertise

#### `appointments`
```sql
Columnas clave para métricas:
- employee_id, business_id, location_id, service_id
- start_time, end_time (duración real)
- status (confirmed/completed/cancelled)
- price (ingresos por cita)
```
**Rol**: Fuente de datos para ocupación y revenue

#### `reviews`
```sql
Columnas:
- employee_id, business_id, appointment_id, client_id
- rating (1-5), comment, is_visible, is_verified
```
**Rol**: Calificaciones cliente → empleado en contexto de negocio específico

#### `transactions`
```sql
Columnas:
- employee_id, business_id, appointment_id
- type (income/expense), amount, currency
- transaction_date
```
**Rol**: Alternativa para cálculo de ingresos

#### `employee_performance` (Vista Materializada)
```sql
Columnas calculadas:
- employee_id, business_id, location_id
- services_offered, total_appointments, completed_appointments
- average_rating, total_reviews
- total_revenue, total_paid
- completion_rate
```
**Rol**: Vista pre-calculada para dashboards (actualizada cada 5 min por cron)

### 2.2 Sistema de Permisos y RLS

#### Permisos Granulares (55 disponibles)
- **Empleados**: `employees.view`, `employees.create`, `employees.edit`, `employees.delete`, `employees.assign_services`, `employees.set_schedules`, `employees.view_performance`, `employees.view_salary`
- **Crítico**: Necesitamos nuevos permisos para jerarquía:
  - `employees.view_hierarchy` (ver organigrama)
  - `employees.manage_hierarchy` (asignar supervisores)
  - `employees.view_analytics` (métricas avanzadas)

#### RLS Policies Activas
```sql
business_roles:
- SELECT: Owner + Admin con permissions.view
- INSERT: Owner + Admin con permissions.assign_*
- UPDATE: Owner + Admin con permissions.modify
- DELETE: Owner + Admin con permissions.revoke (excepto propio admin)

business_employees:
- SELECT: Owner + Admin + Propio empleado
- INSERT: Owner + Admin con permissions.assign_employee
- UPDATE: Owner + Admin
- DELETE: Owner + Admin
```

### 2.3 Inconsistencias y Duplicaciones

| Problema | Impacto | Solución Propuesta |
|----------|---------|-------------------|
| `business_roles.role` vs `business_employees.role` | Confusión conceptual | Deprecar `business_employees.role`, usar solo `business_roles` |
| Falta jerarquía formal | No se puede mapear quién reporta a quién | Añadir `hierarchy_level` + `reports_to` |
| `location_id` ambiguo | Sede principal vs sedes donde ofrece servicios | Mantener en `business_employees`, detallar en `employee_services` |
| Sin agregación rating x negocio | `reviews` es global | Crear vista `employee_business_ratings` |
| Sin métrica de ocupación | No existe cálculo | Implementar en RPC con fórmula definida |

---

## 3. Análisis de Componentes UI Existentes

### 3.1 `AdminDashboard.tsx`
```tsx
Ubicación: src/components/admin/AdminDashboard.tsx
Estado: Entrada "Empleados" con placeholder
Código actual:
case 'employees':
  return (
    <div className="p-12 text-center">
      <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-xl font-semibold">Gestión de Empleados</h3>
      <p className="text-muted-foreground">
        Esta funcionalidad estará disponible próximamente
      </p>
    </div>
  )
```
**Acción**: Reemplazar completamente con componente `EmployeeManagementHierarchy`

### 3.2 `EmployeeManagementNew.tsx`
```tsx
Ubicación: src/components/admin/EmployeeManagementNew.tsx
Líneas: 417
Estado: ❌ USA LOCALSTORAGE - NO CONECTADO A SUPABASE
Funcionalidades:
- Tabs: "Solicitudes" + "Empleados actuales"
- Aprobar/rechazar solicitudes de empleo
- Listar empleados con avatar, email, fecha contratación
- Remover empleados

Problemas:
✗ Datos en localStorage (array 'users', 'employee-requests')
✗ No consulta business_employees ni business_roles
✗ No muestra sede asignada
✗ No muestra servicios ofrecidos
✗ No calcula métricas (rating, ocupación, ingresos)
```
**Acción**: Deprecar y reescribir conectado a Supabase

### 3.3 `PermissionsManager.tsx`
```tsx
Ubicación: src/components/admin/PermissionsManager.tsx
Líneas: ~500
Estado: ✅ PARCIALMENTE FUNCIONAL
Funcionalidades:
- Tabs: "Usuarios", "Permisos", "Roles", "Auditoría"
- Lista usuarios con rol (admin/employee)
- Muestra badge "Owner" para propietario
- Cuenta admins y empleados
- Hook usePermissions-v2 integrado

Reutilizable:
✓ Layout de tabs
✓ Cards de estadísticas
✓ Badges de roles
✓ Integración con usePermissions
✓ Manejo de búsqueda y filtros

Faltante:
✗ No muestra sede
✗ No muestra servicios
✗ No muestra métricas
✗ No representa jerarquía
```
**Acción**: Reutilizar componentes base (cards, badges, tabs)

### 3.4 `TopPerformers.tsx`
```tsx
Ubicación: src/components/dashboard/financial/TopPerformers.tsx
Líneas: ~250
Estado: ✅ FUNCIONAL - CALCULA MÉTRICAS
Funcionalidades:
- Consulta business_employees + appointments + reviews
- Calcula por empleado:
  * total_appointments, completed_appointments
  * total_revenue (suma price de citas completadas)
  * average_rating (promedio reviews)
  * completion_rate (% completadas)
  * average_ticket (revenue / citas)
- Filtros por periodo (week/month/year)
- Ordenamiento por métrica

Código referencia para métricas:
```typescript
const empAppointments = appointments?.filter(a => a.employee_id === emp.employee_id) || []
const completedAppointments = empAppointments.filter(a => a.status === 'completed')
const totalRevenue = completedAppointments.reduce((sum, a) => sum + a.service.price, 0)
const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
```
```
**Acción**: Adaptar lógica de cálculo para nueva pantalla

### 3.5 `EmployeeSelection.tsx`
```tsx
Ubicación: src/components/appointments/wizard-steps/EmployeeSelection.tsx
Funcionalidades:
- Consulta employee_services con join a profiles
- Muestra empleados con expertise_level y ratings
- Calcula rating promedio por empleado desde reviews
```
**Acción**: Reutilizar query pattern para servicios por empleado

---

## 4. Reglas de Negocio y Restricciones

### 4.1 Roles Dinámicos Multi-Negocio
```
Escenario: Usuario puede ser OWNER en Negocio A, ADMIN en Negocio B, EMPLOYEE en Negocio C
Regla: La jerarquía se evalúa POR NEGOCIO
Implementación: Filtrar business_roles WHERE business_id = :current_business
```

### 4.2 Admin que Ofrece Servicios
```
Caso: Un Admin puede ser también Service Provider
Regla: Debe aparecer en AMBOS segmentos (lista admins + lista empleados)
Detección: 
- business_roles.role = 'admin' AND business_employees.offers_services = true
- O existe en employee_services
UI: Badge dual "Admin · Service Provider"
```

### 4.3 Sede Principal vs Sedes de Servicio
```sql
-- Sede principal (donde reporta)
SELECT location_id FROM business_employees WHERE employee_id = :emp_id

-- Sedes donde ofrece servicios (puede ser múltiple)
SELECT DISTINCT location_id, l.name
FROM employee_services es
JOIN locations l ON es.location_id = l.id
WHERE es.employee_id = :emp_id AND es.is_active = true
```
**UI**: Mostrar sede principal + chips con sedes adicionales

### 4.4 Calificaciones: Global vs Por Negocio
```sql
-- Rating global del empleado (TODAS sus citas como profesional)
SELECT AVG(rating) FROM reviews WHERE employee_id = :emp_id

-- Rating en negocio específico (REQUERIDO PARA PANTALLA)
SELECT AVG(rating) FROM reviews 
WHERE employee_id = :emp_id AND business_id = :business_id
```
**Importante**: Usar rating por negocio para la pantalla

### 4.5 Ocupación Diaria Promedio
```
Fórmula propuesta:
ocupación = (citas_completadas_periodo / días_laborables_periodo) / capacidad_teórica_diaria

Donde:
- citas_completadas_periodo: COUNT appointments WHERE status='completed' AND employee_id=X
- días_laborables_periodo: días entre start_date y end_date (excluir domingos?)
- capacidad_teórica_diaria: 8 horas / duración_promedio_servicio (configurable)

Ejemplo:
- 40 citas completadas en 20 días laborables = 2 citas/día
- Capacidad teórica: 8h / 1h = 8 citas/día
- Ocupación = 2/8 = 25%
```
**NOTA**: Requiere definición del negocio sobre capacidad teórica

### 4.6 Ganancias Brutas (Revenue)
```sql
-- Opción 1: Desde appointments (RECOMENDADO)
SELECT SUM(price) FROM appointments
WHERE employee_id = :emp_id 
  AND business_id = :business_id
  AND status = 'completed'
  AND start_time BETWEEN :start_date AND :end_date

-- Opción 2: Desde transactions
SELECT SUM(amount) FROM transactions
WHERE employee_id = :emp_id 
  AND business_id = :business_id
  AND type = 'income'
  AND transaction_date BETWEEN :start_date AND :end_date

-- Opción 3: Vista pre-calculada (MÁS RÁPIDO)
SELECT total_revenue FROM employee_performance
WHERE employee_id = :emp_id AND business_id = :business_id
```
**Decisión**: Usar `employee_performance.total_revenue` + recalcular con filtro de periodo si necesario

### 4.7 Servicios Opcionales
```
Empleados que NO ofrecen servicios:
- business_employees.offers_services = false
- employee_type = 'support_staff'
- Ausencia en employee_services

UI: Mostrar badge "Staff Soporte" y N/A en columna servicios
```

---

## 5. Identificación de Gaps Críticos

### 5.1 ❌ Modelo Jerárquico Inexistente

**Problema**: No hay forma de representar relaciones supervisor-subordinado

**Opciones de Solución**:

#### Opción A: Extender `business_roles` (RECOMENDADO)
```sql
ALTER TABLE business_roles
ADD COLUMN hierarchy_level INTEGER DEFAULT 4, -- 0=Owner,1=Admin,2=Manager,3=Lead,4=Staff
ADD COLUMN reports_to UUID REFERENCES profiles(id);

CREATE INDEX idx_business_roles_hierarchy ON business_roles(business_id, hierarchy_level);
CREATE INDEX idx_business_roles_reports_to ON business_roles(reports_to);
```
**Pros**: Centraliza jerarquía con roles, simple
**Contras**: Mezcla conceptos (rol vs jerarquía)

#### Opción B: Tabla Dedicada
```sql
CREATE TABLE business_hierarchy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  hierarchy_level INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, employee_id)
);
```
**Pros**: Separación limpia, flexibilidad
**Contras**: Tabla adicional, sincronización con business_roles

**DECISIÓN**: Usar Opción A para simplicidad

### 5.2 ❌ Sin RPC para Jerarquía Completa

**Problema**: Queries individuales lentas (N+1)

**Solución**: Crear función PostgreSQL
```sql
CREATE OR REPLACE FUNCTION get_business_hierarchy(
  p_business_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
) RETURNS TABLE (
  employee_id UUID,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  hierarchy_level INTEGER,
  reports_to UUID,
  role TEXT,
  employee_type TEXT,
  location_id UUID,
  location_name TEXT,
  services_offered JSONB, -- [{id, name, location_id, expertise}]
  avg_rating NUMERIC,
  total_appointments INTEGER,
  completed_appointments INTEGER,
  occupancy_rate NUMERIC,
  total_revenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT ...
  -- Join business_roles, business_employees, employee_services, 
  -- locations, reviews, appointments con filtros
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5.3 ❌ Métricas No Calculadas

| Métrica | Estado | Acción Requerida |
|---------|--------|------------------|
| **Servicios por sede** | ❌ No agregado | Query `employee_services` + group by location |
| **Rating por negocio** | ❌ Global solamente | Filtrar `reviews` por `business_id` |
| **Ocupación diaria** | ❌ No existe | Implementar fórmula (citas/días/capacidad) |
| **Revenue por periodo** | ⚠️ Existe sin filtro | Extender con parámetros fecha |

### 5.4 ❌ Sin Componente Organigrama

**Problema**: No hay visualización de mapa jerárquico

**Opciones**:
1. **Librería**: `react-organizational-chart`, `react-orgchart` (MIT license)
2. **Custom**: Implementar con Tailwind + flex/grid + líneas SVG

**DECISIÓN**: Evaluar librería en Fase 2, fallback custom

### 5.5 ❌ Sin Sistema de Filtros Avanzados

**Filtros Requeridos**:
```typescript
interface EmployeeFilters {
  search?: string // Nombre, email
  services?: string[] // Array de service_id
  locations?: string[] // Array de location_id
  ratingRange?: [number, number] // Min-Max (1-5)
  occupancyRange?: [number, number] // Min-Max (0-100%)
  revenueRange?: [number, number] // Min-Max en COP
  period?: { start: Date; end: Date }
  roles?: ('admin' | 'employee')[]
  employeeTypes?: ('service_provider' | 'support_staff')[]
}
```

**UI Necesaria**:
- Sidebar con filtros colapsables
- Multi-select para servicios/sedes
- Sliders para rangos numéricos
- Date pickers para periodo
- Botón "Reset Filtros"

### 5.6 ❌ Vista Lista No Segmentada

**Problema**: `EmployeeManagementNew` lista todos mezclados

**Solución**: Secciones separadas
```
┌─ ADMINISTRADORES (3) ─────────────────────────┐
│ 👑 Juan Pérez (Owner)                         │
│ 🛡️ María García (Admin · Service Provider)   │
│ 🛡️ Carlos López (Admin)                      │
└───────────────────────────────────────────────┘

┌─ EMPLEADOS (12) ──────────────────────────────┐
│ Filtros: [Servicios] [Calificación] [Sede]   │
│                                               │
│ Ana Martínez · Sede Centro · ⭐ 4.8          │
│ Servicios: Corte, Tinte, Manicure            │
│ Ocupación: 65% · Ingresos: $2.5M             │
│ ...                                           │
└───────────────────────────────────────────────┘
```

### 5.7 ❌ Sin Internacionalización

**Textos nuevos para `src/lib/translations.ts`**:
```typescript
employees: {
  hierarchy: { es: 'Jerarquía', en: 'Hierarchy' },
  listView: { es: 'Vista Lista', en: 'List View' },
  mapView: { es: 'Vista Mapa', en: 'Map View' },
  administrators: { es: 'Administradores', en: 'Administrators' },
  staff: { es: 'Personal', en: 'Staff' },
  reportsTo: { es: 'Reporta a', en: 'Reports to' },
  primaryLocation: { es: 'Sede Principal', en: 'Primary Location' },
  servicesOffered: { es: 'Servicios Ofrecidos', en: 'Services Offered' },
  occupancyRate: { es: 'Tasa de Ocupación', en: 'Occupancy Rate' },
  grossRevenue: { es: 'Ingresos Brutos', en: 'Gross Revenue' },
  avgRating: { es: 'Calificación Promedio', en: 'Avg Rating' },
  // ... más textos
}
```

### 5.8 ❌ Permisos Granulares Faltantes

**Nuevos permisos requeridos**:
```sql
INSERT INTO permission_templates (permissions) VALUES
  ('employees.view_hierarchy'),      -- Ver organigrama
  ('employees.manage_hierarchy'),    -- Asignar supervisores
  ('employees.view_analytics'),      -- Ver métricas completas
  ('employees.export_data');         -- Exportar CSV/PDF
```

---

## 6. Modelo Jerárquico Propuesto

### 6.1 Niveles de Jerarquía

```
Nivel 0: OWNER (Dueño del Negocio)
│
├─ Nivel 1: BUSINESS ADMIN (Administrador General)
│  │
│  ├─ Nivel 2: LOCATION MANAGER (Gerente de Sede)
│  │  │
│  │  ├─ Nivel 3: TEAM LEAD (Líder de Equipo)
│  │  │  │
│  │  │  └─ Nivel 4: STAFF (Personal Base)
│  │  │     ├─ Service Provider (Presta servicios)
│  │  │     └─ Support Staff (No presta servicios)
│  │  │
│  │  └─ Nivel 4: STAFF (Personal Base)
│  │
│  └─ Nivel 2: SPECIALIST (Especialista sin equipo)
│
└─ Nivel 1: STAFF (Personal directo del owner)
```

### 6.2 Esquema de Base de Datos

#### Extender `business_roles`
```sql
-- Migración: 20251014000000_employee_hierarchy.sql
ALTER TABLE business_roles
ADD COLUMN IF NOT EXISTS hierarchy_level INTEGER DEFAULT 4 CHECK (hierarchy_level BETWEEN 0 AND 4),
ADD COLUMN IF NOT EXISTS reports_to UUID REFERENCES profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN business_roles.hierarchy_level IS 
  '0=Owner, 1=Admin, 2=Manager, 3=Lead, 4=Staff';
COMMENT ON COLUMN business_roles.reports_to IS 
  'ID del supervisor directo dentro del mismo negocio';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_business_roles_hierarchy 
  ON business_roles(business_id, hierarchy_level);
CREATE INDEX IF NOT EXISTS idx_business_roles_reports_to 
  ON business_roles(reports_to) WHERE reports_to IS NOT NULL;

-- Sincronizar datos existentes
UPDATE business_roles br
SET hierarchy_level = CASE
  WHEN br.user_id = (SELECT owner_id FROM businesses WHERE id = br.business_id) THEN 0 -- Owner
  WHEN br.role = 'admin' THEN 1 -- Admin
  ELSE 4 -- Staff por defecto
END,
reports_to = CASE
  WHEN br.role = 'employee' THEN (SELECT owner_id FROM businesses WHERE id = br.business_id)
  ELSE NULL
END
WHERE hierarchy_level IS NULL;
```

#### Extender `employee_type` enum
```sql
-- Agregar nuevos tipos
ALTER TYPE employee_type_enum ADD VALUE IF NOT EXISTS 'location_manager';
ALTER TYPE employee_type_enum ADD VALUE IF NOT EXISTS 'team_lead';

-- Valores finales:
-- 'service_provider' (presta servicios)
-- 'support_staff' (no presta servicios)
-- 'location_manager' (gerente de sede)
-- 'team_lead' (líder de equipo)
```

### 6.3 RPC para Jerarquía Completa

```sql
CREATE OR REPLACE FUNCTION get_business_hierarchy(
  p_business_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE,
  p_filters JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  employee_id UUID,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  role TEXT,
  employee_type TEXT,
  hierarchy_level INTEGER,
  reports_to UUID,
  reports_to_name TEXT,
  location_id UUID,
  location_name TEXT,
  services_offered JSONB,
  avg_rating NUMERIC(3,2),
  review_count INTEGER,
  total_appointments INTEGER,
  completed_appointments INTEGER,
  occupancy_rate NUMERIC(5,2),
  total_revenue NUMERIC(12,2),
  is_active BOOLEAN
) 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH employee_data AS (
    SELECT 
      p.id as employee_id,
      p.full_name,
      p.email,
      p.avatar_url,
      br.role,
      COALESCE(be.employee_type, 'service_provider') as employee_type,
      br.hierarchy_level,
      br.reports_to,
      supervisor.full_name as reports_to_name,
      be.location_id,
      l.name as location_name,
      br.is_active
    FROM profiles p
    INNER JOIN business_roles br ON p.id = br.user_id
    LEFT JOIN business_employees be ON p.id = be.employee_id AND be.business_id = p_business_id
    LEFT JOIN locations l ON be.location_id = l.id
    LEFT JOIN profiles supervisor ON br.reports_to = supervisor.id
    WHERE br.business_id = p_business_id
  ),
  services_agg AS (
    SELECT 
      es.employee_id,
      jsonb_agg(
        jsonb_build_object(
          'service_id', s.id,
          'service_name', s.name,
          'location_id', es.location_id,
          'location_name', loc.name,
          'expertise_level', es.expertise_level
        )
      ) as services
    FROM employee_services es
    INNER JOIN services s ON es.service_id = s.id
    INNER JOIN locations loc ON es.location_id = loc.id
    WHERE es.business_id = p_business_id 
      AND es.is_active = true
    GROUP BY es.employee_id
  ),
  metrics AS (
    SELECT
      a.employee_id,
      AVG(r.rating) as avg_rating,
      COUNT(DISTINCT r.id) as review_count,
      COUNT(a.id) as total_appointments,
      COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_appointments,
      SUM(CASE WHEN a.status = 'completed' THEN a.price ELSE 0 END) as total_revenue,
      -- Ocupación: citas completadas / (días * capacidad teórica)
      (COUNT(CASE WHEN a.status = 'completed' THEN 1 END)::NUMERIC / 
        NULLIF(EXTRACT(DAY FROM p_end_date - p_start_date), 0) / 8) * 100 as occupancy_rate
    FROM appointments a
    LEFT JOIN reviews r ON a.id = r.appointment_id AND r.business_id = p_business_id
    WHERE a.business_id = p_business_id
      AND a.start_time BETWEEN p_start_date AND p_end_date
    GROUP BY a.employee_id
  )
  SELECT 
    ed.employee_id,
    ed.full_name,
    ed.email,
    ed.avatar_url,
    ed.role,
    ed.employee_type,
    ed.hierarchy_level,
    ed.reports_to,
    ed.reports_to_name,
    ed.location_id,
    ed.location_name,
    COALESCE(sa.services, '[]'::jsonb) as services_offered,
    COALESCE(m.avg_rating, 0) as avg_rating,
    COALESCE(m.review_count, 0) as review_count,
    COALESCE(m.total_appointments, 0) as total_appointments,
    COALESCE(m.completed_appointments, 0) as completed_appointments,
    COALESCE(m.occupancy_rate, 0) as occupancy_rate,
    COALESCE(m.total_revenue, 0) as total_revenue,
    ed.is_active
  FROM employee_data ed
  LEFT JOIN services_agg sa ON ed.employee_id = sa.employee_id
  LEFT JOIN metrics m ON ed.employee_id = m.employee_id
  WHERE 
    -- Aplicar filtros JSON si existen
    (p_filters->>'search' IS NULL OR 
      ed.full_name ILIKE '%' || (p_filters->>'search') || '%' OR
      ed.email ILIKE '%' || (p_filters->>'search') || '%')
  ORDER BY ed.hierarchy_level, ed.full_name;
END;
$$;

-- Grant execute a owners y admins
GRANT EXECUTE ON FUNCTION get_business_hierarchy TO authenticated;
```

### 6.4 Vista Materializada (Opcional)

```sql
CREATE MATERIALIZED VIEW employee_hierarchy_cache AS
SELECT * FROM get_business_hierarchy(business_id, CURRENT_DATE - 30, CURRENT_DATE, '{}'::jsonb)
FROM businesses;

CREATE UNIQUE INDEX ON employee_hierarchy_cache (employee_id, business_id);

-- Refresh automático (agregar a existing cron job)
-- Cada 5 minutos junto con business_ratings_stats
```

---

## 7. Resumen de Ajustes Requeridos

### 7.1 Backend / Base de Datos

| Componente | Acción | Prioridad |
|------------|--------|-----------|
| `business_roles` | Añadir `hierarchy_level`, `reports_to` | 🔴 CRÍTICA |
| `employee_type` enum | Agregar `location_manager`, `team_lead` | 🟠 ALTA |
| RPC `get_business_hierarchy` | Crear función con filtros | 🔴 CRÍTICA |
| Permisos nuevos | `employees.view_hierarchy`, etc. | 🟠 ALTA |
| RLS policies | Extender para jerarquía | 🟡 MEDIA |
| Vista materializada | `employee_hierarchy_cache` (opcional) | 🟢 BAJA |

### 7.2 Frontend / Hooks & Services

| Componente | Acción | Ubicación |
|------------|--------|-----------|
| `useBusinessHierarchy` | Crear hook React Query | `src/hooks/` |
| `useEmployeeMetrics` | Hook para métricas con cache | `src/hooks/` |
| `usePermissions` | Extender con permisos jerarquía | Existing file |
| Service layer | `hierarchyService.ts` con métodos CRUD | `src/lib/` |

### 7.3 UI / Componentes

| Componente | Descripción | Líneas Est. | Archivo |
|------------|-------------|-------------|---------|
| `EmployeeManagementHierarchy` | Componente principal con tabs | ~800 | Nuevo |
| `HierarchyMapView` | Vista organigrama (grafo) | ~400 | Nuevo |
| `EmployeeListView` | Vista lista segmentada | ~500 | Nuevo |
| `EmployeeFiltersPanel` | Panel lateral filtros | ~300 | Nuevo |
| `EmployeeCard` | Card individual con métricas | ~200 | Nuevo |
| `HierarchyNode` | Nodo del organigrama | ~150 | Nuevo |

### 7.4 Internacionalización

- Añadir ~40 nuevas claves a `src/lib/translations.ts`
- Secciones: `employees.hierarchy`, `employees.metrics`, `employees.filters`

### 7.5 Documentación

- Actualizar `DYNAMIC_ROLES_SYSTEM.md` con jerarquía
- Crear `EMPLOYEE_HIERARCHY_GUIDE.md` (guía de uso)
- Actualizar `.github/copilot-instructions.md`

---

## 8. Riesgos y Consideraciones

### 8.1 Performance y Escalabilidad

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| RPC lento con muchos empleados (>100) | 🟡 Media | 🔴 Alto | Vista materializada + cache React Query |
| Query N+1 en servicios por empleado | 🟠 Alta | 🟠 Medio | JSONB aggregation en RPC |
| Filtros complejos lentos | 🟡 Media | 🟡 Medio | Índices en columnas filtradas |
| Refresh de métricas costoso | 🟡 Media | 🟢 Bajo | Cron cada 5 min (ya existe) |

### 8.2 Complejidad RLS

**Escenarios a probar**:
```sql
-- Admin puede ver jerarquía de su negocio
SELECT * FROM get_business_hierarchy(business_id) 
WHERE user has 'employees.view_hierarchy'

-- Empleado NO puede ver jerarquía (solo su info)
REVOKE employees.view_hierarchy FROM employee_role

-- Owner SIEMPRE puede ver jerarquía
GRANT ALL ON employees TO owner
```

### 8.3 Datos Históricos y Periodos

**Problema**: Métricas varían según periodo seleccionado
**Solución**: 
- UI con date picker (último mes por defecto)
- Cache por periodo en React Query
- Preset periods: "Última semana", "Último mes", "Último trimestre"

### 8.4 Compatibilidad Móvil

**Organigrama**: No viable en móvil (pantalla pequeña)
**Solución**: 
- Móvil: Solo vista lista (sin mapa)
- Tablet: Ambas vistas con layout adaptado
- Desktop: Full featured

### 8.5 Sincronización business_roles ↔ business_employees

**Problema**: Dos tablas con info duplicada (role, employee_type)
**Solución**: 
- Trigger para sincronizar cambios
- Deprecar `business_employees.role` gradualmente
- Documentar source of truth: `business_roles`

### 8.6 Definición de Ocupación

**Problema**: No hay consenso sobre capacidad teórica
**Solución**: 
- Hacer configurable por negocio (`businesses.settings.daily_capacity`)
- Default: 8 horas / duración promedio servicio
- Permitir override en UI (configuración)

---

## 9. PLAN DE ACCIÓN DETALLADO

### 📅 Fase 1 · Base de Datos y Backend (3-4 días)

#### Migración 1: Jerarquía en `business_roles`
```sql
-- Archivo: supabase/migrations/20251014000000_employee_hierarchy.sql
-- Tiempo estimado: 1 hora + testing
```
**Tareas**:
- [ ] Añadir columnas `hierarchy_level` (INTEGER) y `reports_to` (UUID)
- [ ] Crear índices para performance
- [ ] Script de migración de datos existentes (owner=0, admin=1, employee=4)
- [ ] Constraint check: `reports_to` debe existir en mismo `business_id`

#### Migración 2: Extender employee_type
```sql
-- Archivo: supabase/migrations/20251014000001_employee_types.sql
-- Tiempo estimado: 30 min
```
**Tareas**:
- [ ] `ALTER TYPE` para agregar `location_manager`, `team_lead`
- [ ] Actualizar comentarios de documentación

#### RPC: get_business_hierarchy
```sql
-- Archivo: supabase/migrations/20251014000002_hierarchy_rpc.sql
-- Tiempo estimado: 3 horas + testing
```
**Tareas**:
- [ ] Implementar función con todos los joins necesarios
- [ ] Calcular métricas (rating, ocupación, revenue)
- [ ] Agregación JSONB para servicios por sede
- [ ] Aplicar filtros dinámicos desde parámetro JSONB
- [ ] Testing con datos reales (100+ empleados)

#### Permisos y RLS
```sql
-- Archivo: supabase/migrations/20251014000003_hierarchy_permissions.sql
-- Tiempo estimado: 2 horas
```
**Tareas**:
- [ ] Añadir 4 nuevos permisos (`employees.view_hierarchy`, etc.)
- [ ] RLS policy para `get_business_hierarchy` (solo owner/admin)
- [ ] Testing: owner ve todo, admin con permiso ve todo, empleado no ve
- [ ] Audit log entry para cambios de jerarquía

#### Validación
- [ ] Ejecutar migraciones en Supabase staging
- [ ] Seed data con jerarquía de prueba (5 niveles)
- [ ] Performance test: RPC con 200 empleados < 500ms
- [ ] Deploy a producción con `npx supabase db push`

---

### 🔧 Fase 2 · Hooks y Servicios (2-3 días)

#### Hook: useBusinessHierarchy
```typescript
// Archivo: src/hooks/useBusinessHierarchy.ts
// Líneas estimadas: 150-200
// Tiempo: 4 horas
```
**Funcionalidades**:
```typescript
export function useBusinessHierarchy(
  businessId: string,
  filters?: EmployeeFilters,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ['business-hierarchy', businessId, filters],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_business_hierarchy', {
          p_business_id: businessId,
          p_start_date: filters?.period?.start || startOfMonth(new Date()),
          p_end_date: filters?.period?.end || new Date(),
          p_filters: JSON.stringify(filters || {})
        })
      if (error) throw error
      return data as HierarchyEmployee[]
    },
    staleTime: 5 * 60 * 1000, // 5 min
    ...options
  })
}
```
**Tareas**:
- [ ] Definir tipos `HierarchyEmployee`, `EmployeeFilters`
- [ ] Integrar React Query con cache
- [ ] Manejo de errores con toast
- [ ] Export funciones auxiliares (buildHierarchyTree, flattenHierarchy)

#### Hook: useEmployeeMetrics
```typescript
// Archivo: src/hooks/useEmployeeMetrics.ts
// Líneas: ~100
// Tiempo: 2 horas
```
**Funcionalidades**:
- Calcular métricas individuales por empleado
- Cache por periodo
- Reutilizable en dashboards y cards

#### Service: hierarchyService
```typescript
// Archivo: src/lib/hierarchyService.ts
// Líneas: ~200
// Tiempo: 3 horas
```
**Métodos**:
```typescript
export const hierarchyService = {
  updateReportsTo(employeeId, managerId, businessId),
  updateHierarchyLevel(employeeId, level, businessId),
  getDirectReports(employeeId, businessId),
  getHierarchyPath(employeeId, businessId), // [owner → ... → employee]
  validateHierarchyChange(employeeId, newManagerId), // Prevenir ciclos
  bulkUpdateHierarchy(changes: HierarchyChange[])
}
```

#### Actualizar usePermissions
```typescript
// Archivo: src/hooks/usePermissions-v2.tsx (existing)
// Añadir: ~50 líneas
// Tiempo: 1 hora
```
**Tareas**:
- [ ] Exponer `checkPermission('employees.view_hierarchy')`
- [ ] Helper `canManageHierarchy()`

---

### 🎨 Fase 3 · UI Principal (5-6 días)

#### Componente: EmployeeManagementHierarchy
```typescript
// Archivo: src/components/admin/EmployeeManagementHierarchy.tsx
// Líneas: ~800
// Tiempo: 8 horas
```
**Estructura**:
```tsx
<div className="space-y-6">
  <Header>
    <Title>Gestión de Empleados</Title>
    <ViewToggle /> {/* Lista / Mapa */}
    <Filters />
  </Header>

  <Tabs value={activeView}>
    <TabsList>
      <Tab value="list">Vista Lista</Tab>
      <Tab value="hierarchy">Jerarquía</Tab>
      <Tab value="requests">Solicitudes</Tab>
    </TabsList>

    <TabsContent value="list">
      <EmployeeListView />
    </TabsContent>

    <TabsContent value="hierarchy">
      <HierarchyMapView />
    </TabsContent>

    <TabsContent value="requests">
      <EmployeeRequests /> {/* Reutilizar existing */}
    </TabsContent>
  </Tabs>
</div>
```

#### Componente: EmployeeListView
```typescript
// Archivo: src/components/admin/employees/EmployeeListView.tsx
// Líneas: ~500
// Tiempo: 6 horas
```
**Secciones**:
```tsx
{/* Administradores */}
<Card>
  <CardHeader>
    <Title>Administradores ({admins.length})</Title>
  </CardHeader>
  <CardContent>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Empleado</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>Sede Principal</TableHead>
          <TableHead>Servicios</TableHead>
          <TableHead>Calificación</TableHead>
          <TableHead>Ingresos</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {admins.map(admin => (
          <EmployeeRow key={admin.id} employee={admin} />
        ))}
      </TableBody>
    </Table>
  </CardContent>
</Card>

{/* Personal */}
<Card>
  <CardHeader>
    <div className="flex justify-between">
      <Title>Personal ({employees.length})</Title>
      <Input placeholder="Buscar..." />
    </div>
  </CardHeader>
  <CardContent>
    <Table>
      {/* Similar estructura */}
    </Table>
  </CardContent>
</Card>
```

#### Componente: HierarchyMapView
```typescript
// Archivo: src/components/admin/employees/HierarchyMapView.tsx
// Líneas: ~400
// Tiempo: 8 horas (complejo)
```
**Opciones de implementación**:

**Opción A**: Librería `react-organizational-chart`
```bash
npm install react-organizational-chart
```
```tsx
import { Tree, TreeNode } from 'react-organizational-chart'

<Tree label={<OwnerNode owner={owner} />}>
  {admins.map(admin => (
    <TreeNode label={<AdminNode admin={admin} />}>
      {admin.reports.map(emp => (
        <TreeNode label={<EmployeeNode employee={emp} />} />
      ))}
    </TreeNode>
  ))}
</Tree>
```

**Opción B**: Custom con Tailwind + SVG
```tsx
<div className="relative p-8">
  {/* Nodos */}
  <div className="flex flex-col gap-8">
    {levels.map(level => (
      <div key={level} className="flex justify-center gap-4">
        {getEmployeesByLevel(level).map(emp => (
          <HierarchyNode key={emp.id} employee={emp} />
        ))}
      </div>
    ))}
  </div>

  {/* Líneas conectoras (SVG) */}
  <svg className="absolute inset-0 pointer-events-none">
    {connections.map(conn => (
      <line
        key={`${conn.from}-${conn.to}`}
        x1={positions[conn.from].x}
        y1={positions[conn.from].y}
        x2={positions[conn.to].x}
        y2={positions[conn.to].y}
        stroke="currentColor"
        strokeWidth="2"
      />
    ))}
  </svg>
</div>
```

**Decisión**: Empezar con Opción A (rápido), fallback a B si styling limitado

#### Componente: EmployeeFiltersPanel
```typescript
// Archivo: src/components/admin/employees/EmployeeFiltersPanel.tsx
// Líneas: ~300
// Tiempo: 4 horas
```
**Filtros**:
```tsx
<aside className="w-80 space-y-6">
  {/* Búsqueda */}
  <Input placeholder="Buscar por nombre o email" />

  {/* Servicios */}
  <MultiSelect
    label="Servicios"
    options={services}
    value={filters.services}
    onChange={handleServicesChange}
  />

  {/* Sedes */}
  <MultiSelect
    label="Sedes"
    options={locations}
    value={filters.locations}
    onChange={handleLocationsChange}
  />

  {/* Calificación */}
  <div>
    <Label>Calificación</Label>
    <Slider
      min={1}
      max={5}
      step={0.5}
      value={filters.ratingRange}
      onChange={handleRatingChange}
    />
    <div className="flex justify-between text-xs">
      <span>⭐ {filters.ratingRange[0]}</span>
      <span>⭐ {filters.ratingRange[1]}</span>
    </div>
  </div>

  {/* Ocupación */}
  <div>
    <Label>Ocupación (%)</Label>
    <Slider
      min={0}
      max={100}
      value={filters.occupancyRange}
      onChange={handleOccupancyChange}
    />
  </div>

  {/* Ingresos */}
  <div>
    <Label>Ingresos (COP)</Label>
    <div className="flex gap-2">
      <Input
        type="number"
        placeholder="Mínimo"
        value={filters.revenueRange[0]}
      />
      <Input
        type="number"
        placeholder="Máximo"
        value={filters.revenueRange[1]}
      />
    </div>
  </div>

  {/* Periodo */}
  <DateRangePicker
    value={filters.period}
    onChange={handlePeriodChange}
  />

  {/* Roles */}
  <CheckboxGroup
    label="Roles"
    options={['admin', 'employee']}
    value={filters.roles}
    onChange={handleRolesChange}
  />

  {/* Reset */}
  <Button variant="outline" onClick={resetFilters}>
    Reset Filtros
  </Button>
</aside>
```

#### Componente: EmployeeCard
```typescript
// Archivo: src/components/admin/employees/EmployeeCard.tsx
// Líneas: ~200
// Tiempo: 3 horas
```
**Layout**:
```tsx
<Card className="hover:shadow-lg transition">
  <CardHeader>
    <div className="flex items-center gap-4">
      <Avatar size="lg" src={employee.avatar_url} />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{employee.full_name}</h3>
          {employee.is_owner && <Badge variant="gold">Owner</Badge>}
          {employee.role === 'admin' && <Badge>Admin</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">{employee.email}</p>
        <p className="text-xs text-muted-foreground">
          Reporta a: {employee.reports_to_name || 'Nadie'}
        </p>
      </div>
    </div>
  </CardHeader>

  <CardContent className="space-y-4">
    {/* Sede principal */}
    <div className="flex items-center gap-2">
      <MapPin className="h-4 w-4" />
      <span className="text-sm">{employee.location_name}</span>
    </div>

    {/* Servicios */}
    <div>
      <Label className="text-xs">Servicios Ofrecidos</Label>
      <div className="flex flex-wrap gap-1 mt-1">
        {employee.services_offered.map(service => (
          <Badge key={service.service_id} variant="outline">
            {service.service_name}
            {service.expertise_level && ` (${service.expertise_level}★)`}
          </Badge>
        ))}
      </div>
    </div>

    {/* Métricas */}
    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
      <div>
        <Label className="text-xs">Calificación</Label>
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 fill-yellow-400" />
          <span className="font-semibold">
            {employee.avg_rating.toFixed(1)}
          </span>
          <span className="text-xs text-muted-foreground">
            ({employee.review_count})
          </span>
        </div>
      </div>

      <div>
        <Label className="text-xs">Ocupación</Label>
        <div className="font-semibold">
          {employee.occupancy_rate.toFixed(0)}%
        </div>
      </div>

      <div>
        <Label className="text-xs">Citas</Label>
        <div className="font-semibold">
          {employee.completed_appointments}/{employee.total_appointments}
        </div>
      </div>

      <div>
        <Label className="text-xs">Ingresos</Label>
        <div className="font-semibold">
          {formatCurrency(employee.total_revenue, 'COP')}
        </div>
      </div>
    </div>
  </CardContent>

  <CardFooter>
    <Button variant="ghost" size="sm" onClick={onViewDetails}>
      Ver Detalles
    </Button>
    <Button variant="ghost" size="sm" onClick={onEdit}>
      Editar
    </Button>
  </CardFooter>
</Card>
```

#### Componente: HierarchyNode
```typescript
// Archivo: src/components/admin/employees/HierarchyNode.tsx
// Líneas: ~150
// Tiempo: 2 horas
```
**Layout simplificado para mapa**:
```tsx
<div className="relative bg-card border rounded-lg p-4 w-48">
  <Avatar src={employee.avatar_url} className="mx-auto" />
  <h4 className="text-center font-medium mt-2">{employee.full_name}</h4>
  <p className="text-xs text-center text-muted-foreground">{employee.role}</p>
  
  <div className="mt-3 space-y-1 text-xs">
    <div className="flex justify-between">
      <span>Rating:</span>
      <span>⭐ {employee.avg_rating.toFixed(1)}</span>
    </div>
    <div className="flex justify-between">
      <span>Ingresos:</span>
      <span>${(employee.total_revenue / 1e6).toFixed(1)}M</span>
    </div>
  </div>

  {canEdit && (
    <Button
      variant="ghost"
      size="sm"
      className="absolute top-2 right-2"
      onClick={onEdit}
    >
      <Edit className="h-3 w-3" />
    </Button>
  )}
</div>
```

---

### 📊 Fase 4 · Integración AdminDashboard (1 día)

#### Actualizar AdminDashboard.tsx
```typescript
// Archivo: src/components/admin/AdminDashboard.tsx (existing)
// Modificar: case 'employees'
// Tiempo: 1 hora
```
**Cambio**:
```tsx
// Reemplazar:
case 'employees':
  return (
    <div className="p-12 text-center">...</div> // Placeholder
  )

// Por:
case 'employees':
  return (
    <EmployeeManagementHierarchy
      businessId={business.id}
      ownerId={business.owner_id}
      currentUserId={currentUser.id}
    />
  )
```

---

### 🌍 Fase 5 · Internacionalización (4 horas)

#### Actualizar translations.ts
```typescript
// Archivo: src/lib/translations.ts (existing)
// Añadir: ~80 líneas
// Tiempo: 2 horas
```
**Textos nuevos**:
```typescript
export const translations = {
  es: {
    // ... existing
    employees: {
      hierarchy: 'Jerarquía',
      listView: 'Vista Lista',
      mapView: 'Vista Mapa',
      administrators: 'Administradores',
      staff: 'Personal',
      reportsTo: 'Reporta a',
      primaryLocation: 'Sede Principal',
      servicesOffered: 'Servicios Ofrecidos',
      occupancyRate: 'Tasa de Ocupación',
      grossRevenue: 'Ingresos Brutos',
      avgRating: 'Calificación Promedio',
      completedAppointments: 'Citas Completadas',
      totalAppointments: 'Citas Totales',
      filters: {
        title: 'Filtros',
        search: 'Buscar por nombre o email',
        services: 'Servicios',
        locations: 'Sedes',
        rating: 'Calificación',
        occupancy: 'Ocupación',
        revenue: 'Ingresos',
        period: 'Periodo',
        roles: 'Roles',
        reset: 'Restablecer Filtros'
      },
      levels: {
        owner: 'Propietario',
        admin: 'Administrador',
        manager: 'Gerente de Sede',
        lead: 'Líder de Equipo',
        staff: 'Personal Base'
      }
    }
  },
  en: {
    // ... translations
  }
}
```

---

### 🧪 Fase 6 · Testing (2-3 días)

#### Unit Tests: Hooks
```typescript
// Archivos:
// - src/hooks/__tests__/useBusinessHierarchy.test.tsx
// - src/hooks/__tests__/useEmployeeMetrics.test.tsx
// Líneas: ~400 total
// Tiempo: 4 horas
```
**Casos de prueba**:
- [ ] Hook retorna datos correctos con filtros
- [ ] Cache funciona (no re-fetch innecesario)
- [ ] Manejo de errores muestra toast
- [ ] Parámetros opcionales con defaults

#### Component Tests
```typescript
// Archivos:
// - src/components/admin/__tests__/EmployeeManagementHierarchy.test.tsx
// - src/components/admin/employees/__tests__/EmployeeListView.test.tsx
// - src/components/admin/employees/__tests__/HierarchyMapView.test.tsx
// Líneas: ~600 total
// Tiempo: 6 horas
```
**Casos clave**:
- [ ] Tabs cambian vistas correctamente
- [ ] Filtros actualizan resultados
- [ ] Lista segmenta admins y empleados
- [ ] Mapa renderiza jerarquía multi-nivel
- [ ] Cards muestran métricas correctas
- [ ] Permisos controlan acceso (owner vs admin vs employee)

#### Integration Tests: Supabase
```typescript
// Archivo: tests/integration/employeeHierarchy.test.ts
// Líneas: ~300
// Tiempo: 4 horas
```
**Escenarios**:
- [ ] RPC `get_business_hierarchy` retorna datos completos
- [ ] Filtros SQL funcionan (services, rating range, etc.)
- [ ] RLS permite a owner/admin, bloquea a employee
- [ ] Performance < 500ms con 200 empleados
- [ ] Métricas calculadas correctamente (ocupación, revenue)

#### E2E Tests (Opcional)
```typescript
// Archivo: tests/e2e/employeeManagement.spec.ts
// Líneas: ~200
// Tiempo: 3 horas
```
**Flujos**:
- [ ] Owner navega a "Empleados"
- [ ] Cambia entre vistas (Lista → Mapa)
- [ ] Aplica filtros, ve resultados actualizados
- [ ] Edita jerarquía (asigna supervisor)
- [ ] Verifica cambio se refleja en UI

---

### 📝 Fase 7 · Documentación (1 día)

#### Actualizar DYNAMIC_ROLES_SYSTEM.md
```markdown
## Sistema de Jerarquía Organizacional

Los roles NO se guardan en la base de datos estática. Se calculan dinámicamente:
- **OWNER**: `user_id === businesses.owner_id` (nivel 0)
- **ADMIN**: `business_roles.role = 'admin'` (nivel 1)
- **MANAGER**: `business_roles.employee_type = 'location_manager'` (nivel 2)
- **LEAD**: `business_roles.employee_type = 'team_lead'` (nivel 3)
- **STAFF**: Resto de empleados (nivel 4)

### Relación Supervisor-Subordinado
- Columna `business_roles.reports_to` → UUID del supervisor
- Validación: No crear ciclos (A reporta a B, B reporta a A)
- Owner NO reporta a nadie (reports_to = NULL)
```

#### Crear EMPLOYEE_HIERARCHY_GUIDE.md
```markdown
# Guía: Gestión Jerárquica de Empleados

## Para Administradores

### Ver Jerarquía
1. Navega a "Empleados" en el sidebar
2. Selecciona tab "Jerarquía"
3. Visualiza el organigrama del negocio

### Asignar Supervisor
1. Haz clic en un empleado
2. Selecciona "Editar Jerarquía"
3. Elige supervisor del dropdown
4. Guarda cambios

### Aplicar Filtros
1. Abre panel lateral "Filtros"
2. Selecciona servicios, sedes, rango calificación, etc.
3. Los resultados se actualizan en tiempo real

## Para Desarrolladores

### Hooks Disponibles
...

### RPC Functions
...

### Permisos Requeridos
...
```

#### Actualizar .github/copilot-instructions.md
```markdown
## Sistema de Jerarquía de Empleados (2025-10-14)

### Estructura en DB
- `business_roles.hierarchy_level` (0-4): Owner, Admin, Manager, Lead, Staff
- `business_roles.reports_to`: UUID del supervisor directo
- RPC `get_business_hierarchy(business_id, start_date, end_date, filters)`

### Componentes UI
- `EmployeeManagementHierarchy`: Componente principal con tabs
- `HierarchyMapView`: Vista organigrama (react-organizational-chart)
- `EmployeeListView`: Vista lista segmentada (admins + staff)
- `EmployeeFiltersPanel`: Filtros avanzados (servicios, rating, ocupación, revenue)

### Métricas Calculadas
- **Rating por negocio**: AVG(reviews.rating) WHERE business_id
- **Ocupación**: (citas_completadas / días / capacidad_teórica) * 100
- **Revenue**: SUM(appointments.price) WHERE status='completed'
```

---

### 📦 Resumen de Entregables

| Entregable | Tipo | Líneas de Código | Archivos |
|------------|------|------------------|----------|
| Migraciones SQL | Backend | ~600 | 4 |
| RPC Functions | Backend | ~300 | 1 |
| Hooks React Query | Frontend | ~400 | 3 |
| Componentes UI | Frontend | ~2350 | 6 |
| Tests | Testing | ~1300 | 6 |
| Documentación | Docs | ~800 | 3 |
| **TOTAL** | | **~5750 líneas** | **23 archivos** |

---

### ⏱️ Estimación de Tiempo

| Fase | Días Dev | Días Testing | Total |
|------|----------|--------------|-------|
| Fase 1: Backend | 3 | 1 | 4 días |
| Fase 2: Hooks | 2 | 0.5 | 2.5 días |
| Fase 3: UI | 5 | 1 | 6 días |
| Fase 4: Integración | 1 | 0 | 1 día |
| Fase 5: i18n | 0.5 | 0 | 0.5 días |
| Fase 6: Testing | 0 | 2 | 2 días |
| Fase 7: Docs | 1 | 0 | 1 día |
| **TOTAL** | **12.5 días** | **4.5 días** | **17 días** |

**Sprints recomendados**: 3 sprints de 1 semana c/u (considerando revisiones y ajustes)

---

## 10. Checklist de Implementación

### Pre-requisitos
- [ ] Aprobar propuesta de jerarquía (5 niveles)
- [ ] Definir fórmula de ocupación con stakeholders
- [ ] Configurar ambiente de testing con datos seed
- [ ] Crear branch feature/employee-hierarchy

### Fase 1: Backend
- [ ] Crear migración hierarchy (hierarchy_level, reports_to)
- [ ] Extender employee_type enum
- [ ] Implementar RPC get_business_hierarchy
- [ ] Añadir permisos y RLS
- [ ] Ejecutar en staging y validar

### Fase 2: Hooks
- [ ] Crear useBusinessHierarchy con React Query
- [ ] Crear useEmployeeMetrics
- [ ] Implementar hierarchyService
- [ ] Extender usePermissions
- [ ] Tests unitarios hooks

### Fase 3: UI
- [ ] Crear EmployeeManagementHierarchy (main)
- [ ] Implementar EmployeeListView
- [ ] Implementar HierarchyMapView
- [ ] Crear EmployeeFiltersPanel
- [ ] Crear EmployeeCard y HierarchyNode
- [ ] Integrar con AdminDashboard
- [ ] Tests de componentes

### Fase 4: i18n & Docs
- [ ] Añadir textos a translations.ts
- [ ] Actualizar DYNAMIC_ROLES_SYSTEM.md
- [ ] Crear EMPLOYEE_HIERARCHY_GUIDE.md
- [ ] Actualizar copilot-instructions.md

### Fase 5: Testing
- [ ] Tests unitarios (hooks, componentes)
- [ ] Tests integración Supabase (RPC, RLS)
- [ ] Tests E2E (opcional)
- [ ] Performance testing (200+ empleados)

### Fase 6: Deploy
- [ ] Code review completo
- [ ] Deploy migraciones a producción
- [ ] Deploy frontend
- [ ] Monitoring y logs
- [ ] Comunicación a usuarios

---

## 11. Criterios de Aceptación

### Funcionales
✅ **Jerarquía Multi-Nivel**
- Owner en nivel 0, puede tener hasta 4 niveles debajo
- Cada empleado reporta a máximo 1 supervisor
- No se permiten ciclos (A → B → A)

✅ **Visualizaciones**
- Vista Lista segmenta Administradores y Personal
- Vista Mapa muestra organigrama con líneas conectoras
- Ambas vistas muestran: sede principal, servicios, métricas

✅ **Filtros Avanzados**
- Por servicios (multi-select)
- Por calificación (slider 1-5)
- Por ocupación (slider 0-100%)
- Por ingresos (rango min-max)
- Por periodo (date picker)
- Por sede (multi-select)

✅ **Métricas**
- Calificación promedio por negocio (filtrada)
- Ocupación diaria promedio (configurable)
- Ingresos brutos por periodo
- Total citas completadas vs totales

✅ **Permisos**
- Owner y admins con `employees.view_hierarchy` ven todo
- Empleados sin permiso NO ven jerarquía
- Edición de jerarquía requiere `employees.manage_hierarchy`

### No Funcionales
✅ **Performance**
- RPC retorna datos en < 500ms con 200 empleados
- UI renderiza sin lag en lista de 100+ items
- Cache React Query reduce queries innecesarias

✅ **Accesibilidad**
- Navegación por teclado funcional
- Screen readers leen jerarquía correctamente
- Contraste de colores cumple WCAG 2.1 AA

✅ **Responsive**
- Desktop: Ambas vistas disponibles
- Tablet: Lista completa, mapa simplificado
- Móvil: Solo vista lista

✅ **Internacionalización**
- Todos los textos en español e inglés
- Formato de moneda según locale (COP para Colombia)

---

## 12. Riesgos Residuales

| Riesgo | Mitigación | Responsable |
|--------|------------|-------------|
| Librería organigrama con limitaciones de estilo | Fallback a implementación custom | Frontend Dev |
| Definición ocupación ambigua | Hacer configurable por negocio | Product Owner |
| Performance con >500 empleados | Vista materializada + pagination | Backend Dev |
| Ciclos en jerarquía | Validación frontend + backend | Full Stack Dev |

---

**FIN DEL DOCUMENTO**

**Próximos pasos**: 
1. Aprobar plan con stakeholders
2. Refinar estimaciones según capacidad del equipo
3. Crear tickets en sistema de gestión
4. Iniciar Fase 1 (Backend)
