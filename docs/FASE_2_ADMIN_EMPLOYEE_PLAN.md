# Fase 2: Admin = Employee + Permisos - Plan de Ejecución

**Fecha de Inicio**: 16/11/2025  
**Responsable**: GitHub Copilot Agent  
**Prioridad**: 🟡 ALTA  
**Estimación**: 2-3 horas  
**Dependencias**: Ninguna (puede ejecutarse en paralelo con Fase 1)

---

## 📊 RESUMEN EJECUTIVO

### Problema Actual
- **Arquitectura inconsistente**: Admins NO están registrados en `business_employees`
- **Regla de negocio incumplida**: "Admin = Employee con más permisos"
- **Impacto**: Gestión de empleados y jerarquía organizacional incompleta

### Solución Propuesta
1. **Trigger automático**: Registra admins en `business_employees` al asignarles rol
2. **Backfill histórico**: Migra admins existentes a `business_employees`
3. **Documentación**: Actualiza arquitectura y guías

### Beneficios
- ✅ Cumplimiento de regla de negocio
- ✅ Jerarquía organizacional completa
- ✅ Simplificación de queries (1 tabla para empleados)
- ✅ Consistencia en dashboards y reportes
- ✅ Base para permisos de nómina y recursos

---

## 🎯 OBJETIVOS ESPECÍFICOS

### OBJ-1: Trigger Automático
**Descripción**: Al asignar rol `admin` en `business_roles`, automáticamente crear registro en `business_employees` como `manager`.

**Criterios de Éxito**:
- ✅ Función SQL `auto_insert_admin_as_employee()` creada
- ✅ Trigger `AFTER INSERT OR UPDATE` funcional
- ✅ Manejo de duplicados (ON CONFLICT DO NOTHING)
- ✅ RLS policies permiten la inserción

### OBJ-2: Backfill Histórico
**Descripción**: Migrar TODOS los admins existentes que no estén en `business_employees`.

**Criterios de Éxito**:
- ✅ Query identifica admins faltantes
- ✅ Script inserta registros sin errores
- ✅ Verificación post-migración (0 admins sin registro)

### OBJ-3: Documentación Técnica
**Descripción**: Actualizar documentación de arquitectura y patrones.

**Criterios de Éxito**:
- ✅ Comentarios en código SQL explicando lógica
- ✅ Actualización de `permissions-v2.ts` con nueva arquitectura
- ✅ README con flujo completo de roles
- ✅ Diagrama de relaciones actualizado

---

## 📝 PLAN DE EJECUCIÓN DETALLADO

### Paso 1: Análisis de Estado Actual (15 min)

**Objetivo**: Entender cuántos admins faltan en `business_employees`

**Acciones**:
```sql
-- Query 1: Contar admins totales
SELECT COUNT(*) as total_admins
FROM business_roles
WHERE role = 'admin' AND is_active = true;

-- Query 2: Contar admins ya en business_employees
SELECT COUNT(DISTINCT br.user_id) as admins_in_employees
FROM business_roles br
INNER JOIN business_employees be ON be.employee_id = br.user_id AND be.business_id = br.business_id
WHERE br.role = 'admin' AND br.is_active = true;

-- Query 3: Listar admins faltantes
SELECT br.user_id, br.business_id, p.full_name, p.email, b.name as business_name
FROM business_roles br
INNER JOIN profiles p ON p.id = br.user_id
INNER JOIN businesses b ON b.id = br.business_id
WHERE br.role = 'admin' AND br.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM business_employees be 
    WHERE be.employee_id = br.user_id AND be.business_id = br.business_id
  )
ORDER BY b.name, p.full_name;
```

**Resultado Esperado**: Lista de X admins que necesitan migración

---

### Paso 2: Crear Migración SQL (30 min)

**Archivo**: `supabase/migrations/20251116000000_auto_insert_admin_to_business_employees.sql`

**Contenido Completo**:

```sql
-- =====================================================================
-- Migración: Auto-inserción de admins en business_employees
-- Fecha: 16/11/2025
-- Autor: TI-Turing Team
-- Descripción: Implementa trigger automático y backfill histórico
-- =====================================================================

-- PASO 1: Crear función que inserta admin como employee
-- =====================================================================

CREATE OR REPLACE FUNCTION auto_insert_admin_as_employee()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Solo ejecutar si:
  -- 1. El rol es 'admin'
  -- 2. El registro está activo
  -- 3. Es un INSERT o el is_active cambió a true
  IF NEW.role = 'admin' AND NEW.is_active = true THEN
    -- Insertar en business_employees si no existe
    INSERT INTO business_employees (
      employee_id,
      business_id,
      role,
      employee_type,
      status,
      is_active,
      hire_date,
      offers_services,
      created_at,
      updated_at
    )
    VALUES (
      NEW.user_id,              -- employee_id (es el mismo user_id)
      NEW.business_id,
      'manager',                -- rol en business_employees
      'location_manager',       -- tipo de empleado
      'approved',               -- pre-aprobado
      true,                     -- activo
      CURRENT_DATE,             -- fecha de contratación hoy
      false,                    -- admins no ofrecen servicios directos
      NOW(),
      NOW()
    )
    ON CONFLICT (employee_id, business_id) 
    DO UPDATE SET
      -- Si ya existe, actualizar campos clave
      is_active = true,
      status = 'approved',
      role = 'manager',
      updated_at = NOW();
    
    RAISE NOTICE 'Admin % registrado en business_employees para negocio %', 
                 NEW.user_id, NEW.business_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Agregar comentario a la función
COMMENT ON FUNCTION auto_insert_admin_as_employee() IS 
'Trigger function: Auto-registra admins en business_employees como managers al asignar rol admin en business_roles';

-- =====================================================================
-- PASO 2: Crear trigger AFTER INSERT OR UPDATE
-- =====================================================================

DROP TRIGGER IF EXISTS trg_auto_insert_admin_as_employee ON business_roles;

CREATE TRIGGER trg_auto_insert_admin_as_employee
  AFTER INSERT OR UPDATE OF role, is_active ON business_roles
  FOR EACH ROW
  EXECUTE FUNCTION auto_insert_admin_as_employee();

-- Agregar comentario al trigger
COMMENT ON TRIGGER trg_auto_insert_admin_as_employee ON business_roles IS 
'Auto-registra admins en business_employees cuando se les asigna rol admin';

-- =====================================================================
-- PASO 3: Backfill de admins existentes
-- =====================================================================

-- Insertar TODOS los admins activos que no estén en business_employees
INSERT INTO business_employees (
  employee_id,
  business_id,
  role,
  employee_type,
  status,
  is_active,
  hire_date,
  offers_services,
  created_at,
  updated_at
)
SELECT 
  br.user_id,                  -- employee_id
  br.business_id,
  'manager',                   -- rol
  'location_manager',          -- tipo
  'approved',                  -- status
  true,                        -- is_active
  COALESCE(br.created_at::date, CURRENT_DATE), -- usar fecha de asignación de rol
  false,                       -- offers_services
  NOW(),
  NOW()
FROM business_roles br
WHERE br.role = 'admin' 
  AND br.is_active = true
  AND NOT EXISTS (
    -- No insertar duplicados
    SELECT 1 
    FROM business_employees be 
    WHERE be.employee_id = br.user_id 
      AND be.business_id = br.business_id
  )
ON CONFLICT (employee_id, business_id) DO NOTHING;

-- Log de resultados
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM business_employees be
  INNER JOIN business_roles br ON be.employee_id = br.user_id AND be.business_id = br.business_id
  WHERE br.role = 'admin' AND br.is_active = true;
  
  RAISE NOTICE 'Backfill completado: % admins registrados en business_employees', v_count;
END $$;

-- =====================================================================
-- PASO 4: Verificación post-migración
-- =====================================================================

-- Query de validación (debe retornar 0 filas)
DO $$
DECLARE
  v_missing INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_missing
  FROM business_roles br
  WHERE br.role = 'admin' AND br.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM business_employees be 
      WHERE be.employee_id = br.user_id AND be.business_id = br.business_id
    );
  
  IF v_missing > 0 THEN
    RAISE WARNING '⚠️ Aún faltan % admins por migrar a business_employees', v_missing;
  ELSE
    RAISE NOTICE '✅ Todos los admins están registrados en business_employees';
  END IF;
END $$;
```

**Validaciones Pre-Deploy**:
- [ ] Revisar sintaxis SQL
- [ ] Probar función en entorno local (si disponible)
- [ ] Verificar que RLS policies permiten INSERT
- [ ] Confirmar que no hay constraints que bloqueen

---

### Paso 3: Aplicar Migración en Supabase (10 min)

**Comando**:
```powershell
npx supabase db push --yes --dns-resolver https
```

**Validaciones Post-Deploy**:
```sql
-- Verificar que trigger existe
SELECT * FROM pg_trigger WHERE tgname = 'trg_auto_insert_admin_as_employee';

-- Verificar función existe
SELECT * FROM pg_proc WHERE proname = 'auto_insert_admin_as_employee';

-- Verificar backfill exitoso (debe ser 0)
SELECT COUNT(*) as admins_faltantes
FROM business_roles br
WHERE br.role = 'admin' AND br.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM business_employees be 
    WHERE be.employee_id = br.user_id AND be.business_id = br.business_id
  );
```

**Resultado Esperado**: 
- ✅ Trigger creado
- ✅ Función creada
- ✅ 0 admins faltantes

---

### Paso 4: Testing Manual (20 min)

#### Test 1: Trigger en INSERT
```sql
-- Crear usuario de prueba
INSERT INTO profiles (id, email, full_name) 
VALUES (gen_random_uuid(), 'test-admin@example.com', 'Test Admin')
RETURNING id;

-- Asignar rol admin (debe disparar trigger)
INSERT INTO business_roles (user_id, business_id, role, is_active)
VALUES (
  '<user_id_del_paso_anterior>',
  '<id_de_un_negocio_existente>',
  'admin',
  true
);

-- Verificar que se creó en business_employees
SELECT * FROM business_employees 
WHERE employee_id = '<user_id_del_paso_anterior>';
```

**Resultado Esperado**: 1 fila con `role = 'manager'`, `status = 'approved'`

#### Test 2: Trigger en UPDATE
```sql
-- Cambiar rol de employee a admin
UPDATE business_roles
SET role = 'admin', is_active = true
WHERE user_id = '<id_empleado_existente>' 
  AND business_id = '<id_negocio>';

-- Verificar que se actualizó en business_employees
SELECT role, status, is_active FROM business_employees 
WHERE employee_id = '<id_empleado_existente>';
```

**Resultado Esperado**: `role = 'manager'`, `status = 'approved'`, `is_active = true`

#### Test 3: No duplica si ya existe
```sql
-- Intentar insertar admin que ya existe en business_employees
INSERT INTO business_roles (user_id, business_id, role, is_active)
VALUES (
  '<user_id_existente>',
  '<business_id_existente>',
  'admin',
  true
)
ON CONFLICT (user_id, business_id) 
DO UPDATE SET role = 'admin', is_active = true;

-- Verificar que NO se duplicó
SELECT COUNT(*) as total FROM business_employees 
WHERE employee_id = '<user_id_existente>' 
  AND business_id = '<business_id_existente>';
```

**Resultado Esperado**: `total = 1` (no hay duplicados)

---

### Paso 5: Actualizar Documentación (30 min)

#### 5.1. Actualizar `src/lib/permissions-v2.ts`

**Agregar al inicio del archivo**:

```typescript
/**
 * ARQUITECTURA DE ROLES - Gestabiz v2.0
 * 
 * Esta arquitectura implementa el principio: "Admin = Employee con más permisos"
 * 
 * @version 2.0.0
 * @date 16/11/2025
 * 
 * JERARQUÍA:
 * 
 * 1. OWNER (Dueño del Negocio)
 *    - Usuario que creó el negocio (businesses.owner_id)
 *    - Bypass TOTAL de permisos (puede hacer TODO)
 *    - Automáticamente es admin + employee del negocio
 *    - No requiere registro manual en business_roles o business_employees
 * 
 * 2. ADMIN (Administrador)
 *    - Registrado en business_roles con role = 'admin'
 *    - Automáticamente registrado en business_employees como 'manager'
 *    - Trigger: trg_auto_insert_admin_as_employee() ejecuta el registro
 *    - Tiene permisos elevados según template aplicado (42 permisos típicos)
 *    - Puede gestionar empleados, finanzas, reportes, etc.
 * 
 * 3. EMPLOYEE (Empleado)
 *    - Registrado en business_employees (employee_id, business_id)
 *    - Tiene permisos granulares según su rol/template
 *    - Puede ofrecer servicios (offers_services = true)
 *    - Roles típicos: manager, professional, receptionist, accountant
 * 
 * 4. CLIENT (Cliente)
 *    - Usuario que reserva citas pero NO es empleado
 *    - No tiene entrada en business_roles ni business_employees
 *    - Permisos limitados: ver citas propias, editar perfil, favoritos
 * 
 * FLUJO DE ASIGNACIÓN:
 * 
 * 1. Owner contrata empleado:
 *    INSERT INTO business_employees (employee_id, business_id, role, ...)
 * 
 * 2. Owner asigna rol admin a empleado:
 *    INSERT INTO business_roles (user_id, business_id, role = 'admin', is_active = true)
 *    → Trigger auto_insert_admin_as_employee() se dispara
 *    → INSERT/UPDATE en business_employees con role = 'manager'
 * 
 * 3. Sistema aplica template de permisos:
 *    → INSERT en user_permissions con permisos del template "Admin Completo"
 *    → 42 permisos asignados automáticamente
 * 
 * QUERIES IMPORTANTES:
 * 
 * - Obtener TODOS los empleados (incluyendo admins):
 *   SELECT * FROM business_employees WHERE business_id = ?
 * 
 * - Verificar si usuario es admin:
 *   SELECT 1 FROM business_roles WHERE user_id = ? AND business_id = ? AND role = 'admin'
 * 
 * - Verificar si usuario es owner:
 *   SELECT 1 FROM businesses WHERE id = ? AND owner_id = ?
 * 
 * - Obtener permisos de usuario:
 *   SELECT permission FROM user_permissions WHERE user_id = ? AND business_id = ?
 */
```

#### 5.2. Crear README.md de Arquitectura

**Archivo**: `docs/ARQUITECTURA_ROLES_Y_PERMISOS.md`

(Ver contenido en anexo al final de este documento)

#### 5.3. Actualizar copilot-instructions.md

**Agregar sección**:

```markdown
### Sistema de Roles Dinámicos ⭐ ACTUALIZADO (16/11/2025)
**Administradores son automáticamente empleados**

- **OWNER**: Usuario es `owner_id` de un negocio en `businesses` (bypass total)
- **ADMIN**: 
  - Registrado en `business_roles` con `role = 'admin'`
  - **Automáticamente** registrado en `business_employees` como `manager` (trigger)
  - Tiene permisos elevados según template aplicado
- **EMPLOYEE**: Registrado en `business_employees` (puede ofrecer servicios)
- **CLIENT**: No tiene entrada en business_roles ni business_employees

**IMPORTANTE**: 
- Trigger `trg_auto_insert_admin_as_employee` mantiene sincronía
- NO crear manualmente admins en business_employees (trigger lo hace)
- Query empleados: SIEMPRE desde `business_employees` (incluye admins)
```

---

### Paso 6: Verificación Final (15 min)

#### Checklist de Validación

- [ ] ✅ Trigger creado en base de datos
- [ ] ✅ Función SQL funcional
- [ ] ✅ Backfill completado (0 admins faltantes)
- [ ] ✅ Test 1 pasado: INSERT dispara trigger
- [ ] ✅ Test 2 pasado: UPDATE dispara trigger
- [ ] ✅ Test 3 pasado: No duplica registros
- [ ] ✅ Documentación actualizada
- [ ] ✅ copilot-instructions.md actualizado
- [ ] ✅ Sin errores en Supabase logs

#### Query de Verificación Final

```sql
-- Dashboard de estado post-migración
SELECT 
  (SELECT COUNT(*) FROM business_roles WHERE role = 'admin' AND is_active = true) as total_admins,
  (SELECT COUNT(DISTINCT be.employee_id) 
   FROM business_employees be 
   INNER JOIN business_roles br ON be.employee_id = br.user_id AND be.business_id = br.business_id
   WHERE br.role = 'admin' AND br.is_active = true) as admins_in_employees,
  (SELECT COUNT(*) FROM business_employees WHERE role = 'manager') as total_managers,
  (SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'trg_auto_insert_admin_as_employee') as trigger_exists,
  (SELECT COUNT(*) FROM pg_proc WHERE proname = 'auto_insert_admin_as_employee') as function_exists;
```

**Resultado Esperado**:
```
total_admins | admins_in_employees | total_managers | trigger_exists | function_exists
-------------|---------------------|----------------|----------------|----------------
     15      |         15          |       15       |       1        |        1
```

---

## 📊 RIESGOS Y MITIGACIONES

### Riesgo 1: RLS bloquea inserción del trigger
**Probabilidad**: BAJA  
**Impacto**: ALTO (trigger falla silenciosamente)  
**Mitigación**: 
- Usar `SECURITY DEFINER` en función
- Verificar policies de `business_employees`
- Testing con usuario no-admin

### Riesgo 2: Constraint violations en backfill
**Probabilidad**: MEDIA  
**Impacto**: MEDIO (algunos admins no migran)  
**Mitigación**:
- Usar `ON CONFLICT DO NOTHING`
- Validar pre-requisitos (hire_date, status)
- Ejecutar query de verificación post-backfill

### Riesgo 3: Duplicados por race condition
**Probabilidad**: BAJA  
**Impacto**: BAJO (solo duplica un registro)  
**Mitigación**:
- Constraint UNIQUE en (employee_id, business_id)
- ON CONFLICT en función de trigger
- Monitoreo de logs post-deploy

### Riesgo 4: Performance en trigger
**Probabilidad**: BAJA  
**Impacto**: BAJO (INSERT adicional por admin)  
**Mitigación**:
- Función optimizada (1 INSERT simple)
- Índices existentes en business_employees
- Solo ejecuta si role = 'admin'

---

## 📈 MÉTRICAS DE ÉXITO

### Métricas Cuantitativas

| Métrica | Valor Objetivo | Medición |
|---------|---------------|----------|
| Admins migrados | 100% | Query post-backfill |
| Trigger funcional | 1 | pg_trigger count |
| Función creada | 1 | pg_proc count |
| Duplicados | 0 | COUNT con GROUP BY |
| Tiempo ejecución trigger | <50ms | pg_stat_statements |

### Métricas Cualitativas

- ✅ Documentación clara y completa
- ✅ Tests manuales pasados
- ✅ Sin errores en Supabase logs
- ✅ Arquitectura consistente con regla de negocio
- ✅ Stakeholders informados

---

## 🚀 PRÓXIMOS PASOS POST-FASE 2

### Inmediatos
1. Validar que dashboards muestran admins como empleados
2. Verificar queries de jerarquía organizacional
3. Probar flujos de nómina con admins incluidos

### Corto Plazo (Esta semana)
1. Implementar Fase 3: Auto-aplicación de templates
2. Agregar tests automatizados para trigger
3. Monitorear performance en producción

### Mediano Plazo (Próximo sprint)
1. Refactorizar queries que asumen admin ≠ employee
2. Actualizar documentación de usuario
3. Capacitar stakeholders en nueva arquitectura

---

## ANEXO: README de Arquitectura

**Archivo**: `docs/ARQUITECTURA_ROLES_Y_PERMISOS.md`

```markdown
# Arquitectura de Roles y Permisos - Gestabiz v2.0

## Introducción

Gestabiz implementa un sistema de permisos granulares de 4 niveles con la siguiente jerarquía:

```
OWNER (Bypass Total)
  ↓
ADMIN (42+ permisos) = EMPLOYEE + permisos elevados
  ↓
EMPLOYEE (Permisos según rol)
  ↓
CLIENT (Permisos básicos)
```

## Principio Fundamental

> **"Admin = Employee con más permisos"**

Todos los administradores son también empleados del negocio. Esto garantiza:
- Jerarquía organizacional completa
- Gestión de nómina uniforme
- Reportes de recursos humanos consistentes
- Simplificación de queries

## Tablas Principales

### 1. `businesses`
```sql
id              UUID PRIMARY KEY
owner_id        UUID REFERENCES auth.users(id)  -- Dueño del negocio
name            TEXT
-- ... otros campos
```

### 2. `business_roles`
```sql
user_id         UUID REFERENCES auth.users(id)
business_id     UUID REFERENCES businesses(id)
role            TEXT CHECK (role IN ('admin', 'employee'))
is_active       BOOLEAN DEFAULT true
-- ... otros campos
PRIMARY KEY (user_id, business_id)
```

### 3. `business_employees`
```sql
employee_id     UUID REFERENCES auth.users(id)
business_id     UUID REFERENCES businesses(id)
role            TEXT CHECK (role IN ('manager', 'professional', 'receptionist', ...))
employee_type   TEXT
status          TEXT CHECK (status IN ('pending', 'approved', 'rejected'))
is_active       BOOLEAN DEFAULT true
offers_services BOOLEAN DEFAULT false
hire_date       DATE
-- ... otros campos
PRIMARY KEY (employee_id, business_id)
```

### 4. `user_permissions`
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES auth.users(id)
business_id     UUID REFERENCES businesses(id)
permission      TEXT  -- ej: 'accounting.view', 'employees.edit'
-- ... otros campos
UNIQUE (user_id, business_id, permission)
```

## Flujo de Registro de Roles

### Caso 1: Owner crea negocio
```sql
-- 1. Crear negocio
INSERT INTO businesses (id, owner_id, name, ...) 
VALUES (uuid_generate_v4(), <user_id>, 'Mi Negocio', ...);

-- 2. Owner es automáticamente admin + employee (sin queries adicionales)
-- No requiere registro manual en business_roles o business_employees
```

### Caso 2: Owner contrata empleado
```sql
-- 1. Registrar empleado
INSERT INTO business_employees (
  employee_id, 
  business_id, 
  role, 
  employee_type,
  status,
  hire_date
) VALUES (
  <user_id>,
  <business_id>,
  'professional',
  'full_time',
  'approved',
  CURRENT_DATE
);

-- 2. Aplicar template de permisos (manual o automático)
-- Ver Fase 3 del plan
```

### Caso 3: Owner asigna rol admin a empleado
```sql
-- 1. Asignar rol admin en business_roles
INSERT INTO business_roles (user_id, business_id, role, is_active)
VALUES (<user_id>, <business_id>, 'admin', true);

-- 2. Trigger auto_insert_admin_as_employee() se dispara automáticamente
-- INSERT/UPDATE en business_employees con role = 'manager'

-- 3. Sistema aplica template "Admin Completo" (42 permisos)
-- Ver Fase 3 del plan
```

## Trigger Automático

**Nombre**: `trg_auto_insert_admin_as_employee`  
**Tabla**: `business_roles`  
**Evento**: `AFTER INSERT OR UPDATE OF role, is_active`  
**Función**: `auto_insert_admin_as_employee()`

**Lógica**:
1. Si `NEW.role = 'admin'` AND `NEW.is_active = true`
2. INSERT en `business_employees` con:
   - `employee_id = NEW.user_id`
   - `role = 'manager'`
   - `employee_type = 'location_manager'`
   - `status = 'approved'`
   - `is_active = true`
   - `offers_services = false`
3. Si ya existe: UPDATE para asegurar `is_active = true`

## Queries Importantes

### Verificar si usuario es owner
```sql
SELECT 1 FROM businesses 
WHERE id = :business_id AND owner_id = :user_id;
```

### Verificar si usuario es admin
```sql
SELECT 1 FROM business_roles 
WHERE user_id = :user_id 
  AND business_id = :business_id 
  AND role = 'admin' 
  AND is_active = true;
```

### Obtener TODOS los empleados (incluyendo admins)
```sql
SELECT * FROM business_employees 
WHERE business_id = :business_id 
  AND is_active = true
ORDER BY role, hire_date;
```

### Obtener permisos de usuario
```sql
SELECT permission FROM user_permissions 
WHERE user_id = :user_id 
  AND business_id = :business_id;
```

### Verificar permiso específico
```typescript
// Hook en React
const { checkPermission, isOwner } = usePermissions(businessId);

// Owner bypass
if (isOwner) {
  return { hasPermission: true, reason: 'owner_bypass' };
}

// Verificar permiso granular
const result = checkPermission('accounting.view');
if (result.hasPermission) {
  // Permitir acceso
}
```

## Permisos por Rol (Templates)

### Admin Completo (42 permisos)
```
accounting.*
reports.*
employees.*
locations.*
services.*
clients.*
appointments.*
dashboard.view_analytics
settings.*
```

### Gerente de Sede (16 permisos)
```
appointments.*
clients.view
employees.view
locations.view
services.view
dashboard.view_operations
```

### Contador (14 permisos)
```
accounting.*
reports.view_financial
reports.export
dashboard.view_analytics
```

### Profesional (6 permisos)
```
appointments.view_own
appointments.create
appointments.edit
clients.view
services.view
dashboard.view_own
```

## Diagrama de Relaciones

```
┌──────────────┐
│  auth.users  │
│  (Supabase)  │
└──────┬───────┘
       │
       ├─────────────────┬─────────────────┐
       │                 │                 │
       ▼                 ▼                 ▼
┌─────────────┐   ┌──────────────┐  ┌─────────────────┐
│  businesses │   │business_roles│  │business_employees│
│             │   │              │  │                  │
│ owner_id ───┼──▶│ user_id      │  │ employee_id      │
│             │   │ business_id  │  │ business_id      │
└─────────────┘   │ role         │  │ role             │
                  │ is_active    │  │ employee_type    │
                  └──────┬───────┘  │ status           │
                         │          │ offers_services  │
                         │          └─────────┬────────┘
                         │                    │
                         └────────┬───────────┘
                                  │
                                  ▼
                        ┌──────────────────┐
                        │ user_permissions │
                        │                  │
                        │ user_id          │
                        │ business_id      │
                        │ permission       │
                        └──────────────────┘
```

## Reglas de Negocio

1. **Owner siempre es admin implícito**: No requiere entrada en `business_roles`
2. **Admin siempre es employee**: Trigger garantiza inserción automática
3. **Employee puede ser promovido a admin**: Actualizar `business_roles.role`
4. **Admin degradado a employee**: Actualizar `business_roles.is_active = false`
5. **Permisos se asignan a nivel usuario-negocio**: No son globales
6. **Templates facilitan asignación masiva**: 6 templates predefinidos

## Seguridad (RLS)

Todas las tablas tienen Row Level Security habilitado:

- `business_roles`: Solo owner/admin puede modificar
- `business_employees`: Solo owner/admin puede crear/editar
- `user_permissions`: Solo owner/admin puede asignar permisos
- `businesses`: Owner puede modificar, otros solo leer

## Migración Histórica

Si tienes admins creados antes del 16/11/2025:

```sql
-- Ejecutar backfill manual
INSERT INTO business_employees (
  employee_id, business_id, role, employee_type, 
  status, is_active, hire_date, offers_services
)
SELECT 
  br.user_id, br.business_id, 'manager', 'location_manager',
  'approved', true, CURRENT_DATE, false
FROM business_roles br
WHERE br.role = 'admin' AND br.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM business_employees be 
    WHERE be.employee_id = br.user_id AND be.business_id = br.business_id
  )
ON CONFLICT DO NOTHING;
```

---

**Última actualización**: 16/11/2025  
**Versión**: 2.0.0  
**Autor**: TI-Turing Team
```

---

**FIN DEL PLAN DE EJECUCIÓN - FASE 2**

---

## 📋 CHECKLIST FINAL

- [ ] Análisis de estado actual completado
- [ ] Migración SQL creada y revisada
- [ ] Migración aplicada en Supabase
- [ ] Tests manuales ejecutados (3/3)
- [ ] Documentación actualizada (3 archivos)
- [ ] Verificación final pasada
- [ ] Stakeholders notificados
- [ ] Deploy documentado en changelog

**Tiempo Total Estimado**: 2-3 horas  
**Prioridad**: 🟡 ALTA  
**Estado**: ⏳ PENDIENTE DE EJECUCIÓN
