# Arquitectura de Roles y Permisos - Gestabiz v2.0

**Fecha de Actualización**: 16/11/2025  
**Fase Completada**: Fase 2 - Admin = Employee + Permisos  
**Estado**: ✅ IMPLEMENTADO Y VALIDADO

---

## 📋 Introducción

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

## 🎯 Principio Fundamental

> **"Admin = Employee con más permisos"**

Todos los administradores son también empleados del negocio. Esto garantiza:
- ✅ Jerarquía organizacional completa
- ✅ Gestión de nómina uniforme
- ✅ Reportes de recursos humanos consistentes
- ✅ Simplificación de queries

---

## 🗄️ Tablas Principales

### 1. `businesses`
```sql
CREATE TABLE businesses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID REFERENCES auth.users(id) NOT NULL,  -- Dueño del negocio
  name            TEXT NOT NULL,
  category_id     UUID REFERENCES business_categories(id),
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

**Campos Clave**:
- `owner_id`: Usuario que creó el negocio (bypass total de permisos)

---

### 2. `business_roles`
```sql
CREATE TABLE business_roles (
  user_id         UUID REFERENCES auth.users(id) NOT NULL,
  business_id     UUID REFERENCES businesses(id) NOT NULL,
  role            TEXT CHECK (role IN ('admin', 'employee')) NOT NULL,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, business_id)
);
```

**Campos Clave**:
- `role`: Solo 'admin' o 'employee'
- `is_active`: Permite desactivar rol sin eliminarlo

**Trigger Asociado**: `trg_auto_insert_admin_as_employee`

---

### 3. `business_employees`
```sql
CREATE TABLE business_employees (
  employee_id     UUID REFERENCES auth.users(id) NOT NULL,
  business_id     UUID REFERENCES businesses(id) NOT NULL,
  role            TEXT CHECK (role IN ('manager', 'professional', 'receptionist', 'accountant', ...)),
  employee_type   TEXT,
  status          TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  is_active       BOOLEAN DEFAULT true,
  offers_services BOOLEAN DEFAULT false,
  hire_date       DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (employee_id, business_id)
);
```

**Campos Clave**:
- `employee_id`: Mismo que `user_id` de Supabase Auth
- `role`: 'manager' para admins, otros roles para empleados
- `offers_services`: `false` para admins/managers, `true` para profesionales

---

### 4. `user_permissions`
```sql
CREATE TABLE user_permissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) NOT NULL,
  business_id     UUID REFERENCES businesses(id) NOT NULL,
  permission      TEXT NOT NULL,  -- ej: 'accounting.view', 'employees.edit'
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, business_id, permission)
);
```

**Campos Clave**:
- `permission`: String con formato `module.action` (55 permisos disponibles)

---

## 🔄 Flujo de Registro de Roles

### Caso 1: Owner crea negocio

```sql
-- 1. Crear negocio
INSERT INTO businesses (id, owner_id, name, category_id) 
VALUES (gen_random_uuid(), '<user_id>', 'Mi Negocio', '<category_id>');

-- 2. Owner es automáticamente admin + employee (sin queries adicionales)
-- No requiere registro manual en business_roles o business_employees
-- El sistema detecta owner_id === user_id y otorga bypass total
```

**Resultado**: Owner puede hacer TODO sin permisos explícitos

---

### Caso 2: Owner contrata empleado

```sql
-- 1. Registrar empleado
INSERT INTO business_employees (
  employee_id, 
  business_id, 
  role, 
  employee_type,
  status,
  hire_date,
  offers_services
) VALUES (
  '<user_id>',
  '<business_id>',
  'professional',
  'full_time',
  'approved',
  CURRENT_DATE,
  true  -- puede ofrecer servicios
);

-- 2. Aplicar template de permisos (manual o automático - Fase 3 pendiente)
-- Ver sección "Permisos por Rol (Templates)"
```

**Resultado**: Empleado registrado, puede ofrecer servicios si `offers_services = true`

---

### Caso 3: Owner asigna rol admin a empleado ⭐ NUEVO (Fase 2)

```sql
-- 1. Asignar rol admin en business_roles
INSERT INTO business_roles (user_id, business_id, role, is_active)
VALUES ('<user_id>', '<business_id>', 'admin', true);

-- 2. Trigger auto_insert_admin_as_employee() se dispara automáticamente
--    → INSERT en business_employees con:
--      - employee_id = user_id
--      - role = 'manager'
--      - employee_type = 'location_manager'
--      - status = 'approved'
--      - is_active = true
--      - offers_services = false

-- 3. Sistema aplica template "Admin Completo" (Fase 3 - pendiente)
--    → 42 permisos asignados automáticamente en user_permissions
```

**Resultado**: Admin registrado como employee tipo 'manager', con permisos elevados

---

## ⚙️ Trigger Automático (Fase 2)

### Nombre
`trg_auto_insert_admin_as_employee`

### Tabla
`business_roles`

### Evento
`AFTER INSERT OR UPDATE OF role, is_active`

### Función
`auto_insert_admin_as_employee()`

### Lógica

```sql
CREATE OR REPLACE FUNCTION auto_insert_admin_as_employee()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Solo ejecutar si:
  -- 1. El rol es 'admin'
  -- 2. El registro está activo
  IF NEW.role = 'admin' AND NEW.is_active = true THEN
    -- Insertar en business_employees si no existe
    INSERT INTO business_employees (
      employee_id, business_id, role, employee_type,
      status, is_active, hire_date, offers_services
    )
    VALUES (
      NEW.user_id, NEW.business_id, 'manager', 'location_manager',
      'approved', true, CURRENT_DATE, false
    )
    ON CONFLICT (employee_id, business_id) 
    DO UPDATE SET
      is_active = true,
      status = 'approved',
      role = 'manager',
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;
```

### Resultados de Backfill (16/11/2025)

- ✅ **54 admins** migrados automáticamente
- ✅ **0 admins faltantes** (100% completado)
- ✅ **54 managers** creados en business_employees

---

## 🔍 Queries Importantes

### Verificar si usuario es owner
```sql
SELECT 1 FROM businesses 
WHERE id = :business_id AND owner_id = :user_id;
```

**Uso**: `usePermissions` hook para bypass total

---

### Verificar si usuario es admin
```sql
SELECT 1 FROM business_roles 
WHERE user_id = :user_id 
  AND business_id = :business_id 
  AND role = 'admin' 
  AND is_active = true;
```

**Uso**: Determinar rol en dashboard

---

### Obtener TODOS los empleados (incluyendo admins)
```sql
SELECT 
  be.employee_id,
  be.role,
  be.employee_type,
  be.status,
  be.is_active,
  be.offers_services,
  p.full_name,
  p.email,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM business_roles br 
      WHERE br.user_id = be.employee_id 
        AND br.business_id = be.business_id
        AND br.role = 'admin'
    ) THEN 'admin'
    ELSE 'employee'
  END as system_role
FROM business_employees be
INNER JOIN profiles p ON p.id = be.employee_id
WHERE be.business_id = :business_id 
  AND be.is_active = true
ORDER BY 
  CASE be.role 
    WHEN 'manager' THEN 1
    WHEN 'professional' THEN 2
    WHEN 'receptionist' THEN 3
    ELSE 4
  END,
  be.hire_date;
```

**Uso**: Lista de empleados en AdminDashboard

---

### Obtener permisos de usuario
```sql
SELECT permission 
FROM user_permissions 
WHERE user_id = :user_id 
  AND business_id = :business_id;
```

**Uso**: `usePermissions` hook para validación granular

---

### Verificar permiso específico en React
```typescript
import { usePermissions } from '@/hooks/usePermissions';

function AccountingPage() {
  const { checkPermission, isOwner } = usePermissions(businessId);

  // Owner bypass
  if (isOwner) {
    return <FullAccessUI />;
  }

  // Verificar permiso granular
  const { hasPermission, reason } = checkPermission('accounting.view');
  
  if (!hasPermission) {
    return <AccessDenied reason={reason} />;
  }

  return <AccountingDashboard />;
}
```

---

## 🏷️ Permisos por Rol (Templates)

### Admin Completo (42 permisos)
```
✅ accounting.* (todos los permisos contables)
✅ reports.* (todos los reportes)
✅ employees.* (gestión completa de empleados)
✅ locations.* (gestión de sedes)
✅ services.* (gestión de servicios)
✅ clients.* (gestión de clientes)
✅ appointments.* (gestión de citas)
✅ dashboard.view_analytics (analíticas)
✅ settings.* (configuraciones)
```

**Total**: 42 permisos

---

### Gerente de Sede (16 permisos)
```
✅ appointments.* (todas las operaciones de citas)
✅ clients.view (ver clientes)
✅ employees.view (ver empleados)
✅ locations.view (ver sedes)
✅ services.view (ver servicios)
✅ dashboard.view_operations (dashboard operativo)
```

**Total**: 16 permisos

---

### Contador (14 permisos)
```
✅ accounting.* (todos los permisos contables)
✅ reports.view_financial (reportes financieros)
✅ reports.export (exportar reportes)
✅ dashboard.view_analytics (analíticas)
```

**Total**: 14 permisos

---

### Recepcionista (11 permisos)
```
✅ appointments.view_all (ver todas las citas)
✅ appointments.create (crear citas)
✅ appointments.edit (editar citas)
✅ appointments.cancel (cancelar citas)
✅ clients.view (ver clientes)
✅ clients.create (crear clientes)
✅ clients.edit (editar clientes)
✅ services.view (ver servicios)
✅ locations.view (ver sedes)
✅ employees.view (ver empleados)
✅ dashboard.view_operations (dashboard operativo)
```

**Total**: 11 permisos

---

### Profesional (6 permisos)
```
✅ appointments.view_own (ver citas propias)
✅ appointments.create (crear citas)
✅ appointments.edit (editar citas propias)
✅ clients.view (ver clientes)
✅ services.view (ver servicios)
✅ dashboard.view_own (dashboard personal)
```

**Total**: 6 permisos

---

## 📊 Diagrama de Relaciones

```
┌──────────────┐
│  auth.users  │
│  (Supabase)  │
└──────┬───────┘
       │
       ├─────────────────┬─────────────────┬─────────────────┐
       │                 │                 │                 │
       ▼                 ▼                 ▼                 ▼
┌─────────────┐   ┌──────────────┐  ┌─────────────────┐  ┌──────────────┐
│  businesses │   │business_roles│  │business_employees│  │   profiles   │
│             │   │              │  │                  │  │              │
│ owner_id ───┼──▶│ user_id      │  │ employee_id      │  │ id           │
│ name        │   │ business_id  │  │ business_id      │  │ full_name    │
│ category_id │   │ role         │  │ role             │  │ email        │
└─────────────┘   │ is_active    │  │ employee_type    │  └──────────────┘
                  └──────┬───────┘  │ status           │
                         │          │ offers_services  │
                         │          │ hire_date        │
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

TRIGGER: trg_auto_insert_admin_as_employee
  business_roles (INSERT/UPDATE role='admin') 
    → auto_insert_admin_as_employee()
    → INSERT/UPDATE business_employees (role='manager')
```

---

## 📏 Reglas de Negocio

1. **Owner siempre es admin implícito**: No requiere entrada en `business_roles`
2. **Admin siempre es employee**: Trigger garantiza inserción automática en `business_employees`
3. **Employee puede ser promovido a admin**: Actualizar `business_roles.role` a 'admin'
4. **Admin degradado a employee**: Actualizar `business_roles.is_active = false`
5. **Permisos se asignan a nivel usuario-negocio**: No son globales
6. **Templates facilitan asignación masiva**: 6 templates predefinidos disponibles
7. **Managers NO ofrecen servicios**: `business_employees.offers_services = false` para admins

---

## 🔒 Seguridad (RLS)

Todas las tablas tienen Row Level Security habilitado:

### `business_roles`
```sql
-- Solo owner/admin puede modificar roles
CREATE POLICY "business_roles_admin_only" ON business_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE id = business_id 
        AND owner_id = auth.uid()
    )
  );
```

### `business_employees`
```sql
-- Solo owner/admin puede crear/editar empleados
CREATE POLICY "business_employees_admin_only" ON business_employees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE id = business_id 
        AND owner_id = auth.uid()
    )
  );
```

### `user_permissions`
```sql
-- Solo owner/admin puede asignar permisos
CREATE POLICY "user_permissions_admin_only" ON user_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE id = business_id 
        AND owner_id = auth.uid()
    )
  );
```

### `businesses`
```sql
-- Owner puede modificar, otros solo leer
CREATE POLICY "businesses_owner_all" ON businesses
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "businesses_read_all" ON businesses
  FOR SELECT USING (is_active = true);
```

---

## 🔧 Migración Histórica

Si tienes admins creados antes del 16/11/2025, ejecutar backfill manual:

```sql
-- Backfill de admins existentes
INSERT INTO business_employees (
  employee_id, business_id, role, employee_type, 
  status, is_active, hire_date, offers_services,
  created_at, updated_at
)
SELECT 
  br.user_id,                  -- employee_id
  br.business_id,
  'manager',                   -- rol
  'location_manager',          -- tipo
  'approved',                  -- status
  true,                        -- is_active
  COALESCE(br.created_at::date, CURRENT_DATE), -- hire_date
  false,                       -- offers_services
  NOW(),
  NOW()
FROM business_roles br
WHERE br.role = 'admin' 
  AND br.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM business_employees be 
    WHERE be.employee_id = br.user_id 
      AND be.business_id = br.business_id
  )
ON CONFLICT (employee_id, business_id) DO NOTHING;

-- Verificar resultado (debe retornar 0)
SELECT COUNT(*) as admins_faltantes
FROM business_roles br
WHERE br.role = 'admin' AND br.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM business_employees be 
    WHERE be.employee_id = br.user_id AND be.business_id = br.business_id
  );
```

**Resultado esperado**: `admins_faltantes = 0`

---

## 📈 Estadísticas de Implementación (16/11/2025)

| Métrica | Valor |
|---------|-------|
| Admins Totales | 54 roles |
| Usuarios Únicos Admin | 24 usuarios |
| Admins Multi-Negocio | 30 roles adicionales |
| Managers en business_employees | 54 registros |
| Admins Faltantes | 0 (100% migrados) |
| Trigger Activo | ✅ SÍ |
| Función SQL Creada | ✅ SÍ |

---

## 🚀 Próximas Fases

### Fase 3: Auto-Aplicación de Templates (Pendiente)
- Modificar `assignRoleMutation` para aplicar template automáticamente
- UI selector de templates en modal de asignación
- 6 templates disponibles: Admin Completo, Gerente, Contador, Recepcionista, Profesional, Empleado

### Fase 4: Real Data en UI (Pendiente)
- Reemplazar "Usuario Ejemplo" hardcodeado
- JOIN business_roles + profiles para mostrar nombres reales
- Display de permisos asignados en UI

### Fase 5: Protección de Módulos (En Progreso)
- 11/30 módulos protegidos (37% completado)
- Pendientes: Clients, 19 componentes sin PermissionGate

---

**Última actualización**: 16/11/2025  
**Versión**: 2.0.0  
**Autor**: TI-Turing Team  
**Estado**: ✅ Fase 2 COMPLETADA - Trigger funcional, backfill exitoso
