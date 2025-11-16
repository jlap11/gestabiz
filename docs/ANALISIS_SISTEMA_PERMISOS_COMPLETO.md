# 📊 ANÁLISIS COMPLETO: Sistema de Permisos Gestabiz
**Fecha**: 21 de Octubre de 2025  
**Solicitado por**: Usuario  
**Analista**: GitHub Copilot AI  
**Estado del Proyecto**: FASE BETA COMPLETADA (Solo bugs y optimizaciones)

---

## 🎯 RESUMEN EJECUTIVO

Se ha identificado que Gestabiz cuenta con **DOS SISTEMAS DE PERMISOS COEXISTENTES**:

1. **Sistema LEGACY** (`permissions.ts`): 22 permisos, sistema simple basado en roles fijos
2. **Sistema V2.0** (`permissions-v2.ts`): 55+ permisos, sistema granular con base de datos

### Estado Actual del Sistema V2.0 ✅

**✅ COMPLETAMENTE IMPLEMENTADO** en:
- ✅ Base de datos (3 tablas + triggers + RLS)
- ✅ Backend (permissions-v2.ts - 554 líneas)
- ✅ Hook (usePermissions-v2.tsx - 501 líneas)
- ✅ UI Completa (5 componentes + tests)
- ✅ 6 plantillas de sistema precargadas
- ✅ 95 registros en audit log
- ✅ Tests unitarios (2 archivos de tests)

### Problema Real Identificado

**NO es falta de implementación**. El sistema v2.0 está **100% funcional** pero:
- ❌ **NO está siendo usado en la aplicación principal**
- ❌ Solo 2 archivos usan el sistema LEGACY (`useSupabase.ts`, `usePermissions.tsx`)
- ❌ El sistema v2.0 solo se usa en el módulo de gestión de permisos (`/app/admin/permissions`)
- ❌ El resto de la app NO valida permisos granulares

---

## 📂 INVENTARIO DETALLADO DE ARCHIVOS

### Sistema LEGACY (permissions.ts)
**Archivo**: `src/lib/permissions.ts` (200 líneas)

```typescript
// SOLO 22 PERMISOS LEGACY
export const ROLE_PERMISSIONS: RolePermissions = {
  admin: [22 permisos completos],
  employee: [7 permisos básicos],
  client: [1 permiso]
}

// Funciones exportadas:
- getRolePermissions(role)
- hasPermission(role, permission)
- userHasPermission(userRole, userPermissions, requiredPermission)
- getAllPermissions()
```

**Usado en**:
1. `src/hooks/useSupabase.ts` (línea 5)
2. `src/hooks/usePermissions.tsx` (línea 4)

### Sistema V2.0 (permissions-v2.ts)
**Archivo**: `src/lib/permissions-v2.ts` (554 líneas)

```typescript
// 55+ PERMISOS GRANULARES ORGANIZADOS POR CATEGORÍA
export const ALL_PERMISSIONS: Permission[] = [
  // Business Management (5)
  'business.view', 'business.edit', 'business.delete', 'business.settings', 'business.categories',
  
  // Locations (5)
  'locations.view', 'locations.create', 'locations.edit', 'locations.delete', 'locations.assign_employees',
  
  // Services (5)
  'services.view', 'services.create', 'services.edit', 'services.delete', 'services.prices',
  
  // Employees (8)
  'employees.view', 'employees.create', 'employees.edit', 'employees.delete',
  'employees.assign_services', 'employees.view_payroll', 'employees.manage_payroll', 'employees.set_schedules',
  
  // Appointments (7)
  'appointments.view_all', 'appointments.view_own', 'appointments.create', 'appointments.edit',
  'appointments.delete', 'appointments.assign', 'appointments.confirm',
  
  // Clients (7)
  'clients.view', 'clients.create', 'clients.edit', 'clients.delete',
  'clients.export', 'clients.communication', 'clients.history',
  
  // Accounting (9) - CRÍTICO: No implementado en módulo contable
  'accounting.view', 'accounting.tax_config',
  'accounting.expenses.view', 'accounting.expenses.create', 'accounting.expenses.pay',
  'accounting.payroll.view', 'accounting.payroll.create', 'accounting.payroll.config',
  'accounting.export',
  
  // Reports (4) - CRÍTICO: No implementado en módulo de reportes
  'reports.view_financial', 'reports.view_operations', 'reports.export', 'reports.analytics',
  
  // Permissions Management (5)
  'permissions.view', 'permissions.assign_admin', 'permissions.assign_employee',
  'permissions.modify', 'permissions.revoke',
  
  // Notifications (2)
  'notifications.send', 'notifications.bulk',
  
  // Settings (3)
  'settings.view', 'settings.edit_own', 'settings.edit_business'
]

// EXPORTS:
export {
  ALL_PERMISSIONS,
  PERMISSION_DESCRIPTIONS,        // Español
  PERMISSION_CATEGORIES,          // Organización UI
  PERMISSION_REQUIREMENT_LEVELS,  // Críticos, importantes, opcionales
  ADMIN_PERMISSIONS,              // Admin completo
  EMPLOYEE_BASE_PERMISSIONS,      // Base empleado
  isBusinessOwner,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserActivePermissions,
  hasBusinessRole,
  getUserBusinessRole,
  canProvideServices,
}
```

**Usado en**:
1. `src/hooks/usePermissions-v2.tsx`
2. `src/components/admin/PermissionEditor.tsx`
3. `src/components/admin/PermissionTemplates.tsx`
4. `src/components/admin/PermissionsManager.tsx`
5. `src/components/admin/RoleAssignment.tsx`
6. `src/components/admin/AuditLog.tsx`
7. Tests (3 archivos)

### Hook V2.0 (usePermissions-v2.tsx)
**Archivo**: `src/hooks/usePermissions-v2.tsx` (501 líneas)

```typescript
// HOOK COMPLETO CON REACT QUERY
export function usePermissions({ userId, businessId, ownerId }) {
  // ✅ 4 QUERIES
  const businessRoles = useQuery(['business-roles', ...])
  const userPermissions = useQuery(['user-permissions', ...])
  const templates = useQuery(['permission-templates', ...])
  const auditLog = useQuery(['permission-audit-log', ...])
  
  // ✅ VERIFICACIONES
  const checkPermission = (permission: Permission) => PermissionCheckResult
  const checkAnyPermission = (permissions: Permission[]) => PermissionCheckResult
  const checkAllPermissions = (permissions: Permission[]) => PermissionCheckResult
  
  // ✅ MUTATIONS (5)
  const assignRoleMutation
  const removeRoleMutation
  const grantPermissionMutation
  const revokePermissionMutation
  const applyTemplateMutation
  
  // ✅ HELPERS
  const getActivePermissions = () => Permission[]
  const isOwner: boolean
  const isAdmin: boolean
  const isEmployee: boolean
  const canProvideServices: boolean
  
  // ✅ EXPORTS
  return {
    businessRoles,
    userPermissions,
    templates,
    auditLog,
    checkPermission,
    checkAnyPermission,
    checkAllPermissions,
    assignRole,
    removeRole,
    grantPermission,
    revokePermission,
    applyTemplate,
    getActivePermissions,
    isOwner,
    isAdmin,
    isEmployee,
    canProvideServices,
    isLoading,
  }
}

// ✅ HOOK ADICIONAL
export function useHasPermission(permission: Permission, options) {
  return checkPermission(permission).hasPermission
}
```

### Componentes UI V2.0

#### 1. PermissionsManager.tsx (454 líneas)
**Ruta**: `/app/admin/permissions`

```tsx
export function PermissionsManager({ businessId, ownerId, currentUserId }) {
  // ✅ TABS IMPLEMENTADOS
  - Usuarios: Lista con búsqueda y filtros
  - Permisos: PermissionEditor (granular por usuario)
  - Plantillas: PermissionTemplates (6 system templates)
  - Historial: AuditLog (95 registros actuales)
  
  // ✅ FEATURES
  - Búsqueda por nombre/email
  - Filtro por rol (admin/employee)
  - Badge "Propietario" (OwnerBadge)
  - Contador de permisos por usuario
  - Estado activo/inactivo
  
  // ⚠️ LIMITACIÓN ACTUAL
  // Datos de usuarios simulados (no conectado a profiles reales)
}
```

#### 2. RoleAssignment.tsx (265 líneas)
```tsx
// ✅ Modal de asignación de roles
- Asignar rol admin/employee
- Validación: No puede cambiar owner
- Audit log automático
```

#### 3. PermissionEditor.tsx (588 líneas)
```tsx
// ✅ Editor granular de permisos por categoría
- 9 categorías organizadas
- Checkboxes individuales por permiso
- Aplicar plantillas
- Validación: Owner bypasea todo
- Toast notifications
```

#### 4. PermissionTemplates.tsx (403 líneas)
```tsx
// ✅ Gestión de plantillas
- 6 plantillas de sistema (no editables)
- Crear plantillas personalizadas
- Aplicar template a usuario
- Visualización de permisos incluidos
```

#### 5. AuditLog.tsx (323 líneas)
```tsx
// ✅ Historial de cambios
- 95 registros actuales en DB
- Filtros por acción y usuario
- Timeline visual
- Detalles de cambios (old_value -> new_value)
```

---

## 🗄️ BASE DE DATOS

### Tablas de Permisos (3)

#### 1. `user_permissions` (0 registros)
```sql
CREATE TABLE user_permissions (
  id UUID PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  permission TEXT NOT NULL,  -- De tipo Permission
  granted_by UUID REFERENCES profiles(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS APLICADO
-- ÍNDICES: business_id, user_id, (business_id, user_id, permission)
```

**Estado**: ✅ Tabla creada, RLS aplicado, 0 registros  
**Razón**: Owners bypassean verificaciones, no necesitan registros

#### 2. `permission_templates` (6 registros - SYSTEM)
```sql
CREATE TABLE permission_templates (
  id UUID PRIMARY KEY,
  business_id UUID REFERENCES businesses(id),  -- NULL = system template
  name TEXT NOT NULL,
  description TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'employee')),
  permissions JSONB NOT NULL DEFAULT '[]',
  is_system_template BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Plantillas del Sistema** (6):
1. **Admin Completo** (42 permisos)
2. **Gerente de Sede** (16 permisos)
3. **Contador** (14 permisos contables)
4. **Recepcionista** (10 permisos employee)
5. **Profesional** (6 permisos employee)
6. **Staff de Soporte** (3 permisos employee)

#### 3. `permission_audit_log` (95 registros)
```sql
CREATE TABLE permission_audit_log (
  id UUID PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL CHECK (action IN (
    'grant', 'revoke', 'modify', 
    'assign_role', 'remove_role'
  )),
  permission TEXT,
  old_value TEXT,
  new_value TEXT,
  performed_by UUID NOT NULL REFERENCES profiles(id),
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);
```

**Estado**: ✅ 95 registros de auditoría existentes

---

## 🔍 ANÁLISIS DE ADOPCIÓN

### ¿Dónde SE USA el sistema V2.0?

**✅ SOLO en el módulo de Permisos** (`/app/admin/permissions`):
- PermissionsManager
- RoleAssignment
- PermissionEditor
- PermissionTemplates
- AuditLog

### ❌ Dónde NO se usa (CRÍTICO)

#### Módulo Contable (`src/components/accounting/*`)
**Archivos afectados**: 10+ componentes

```typescript
// ❌ NO VALIDA:
'accounting.view'
'accounting.tax_config'
'accounting.expenses.view'
'accounting.expenses.create'
'accounting.expenses.pay'
'accounting.payroll.view'
'accounting.payroll.create'
'accounting.payroll.config'
'accounting.export'
```

**Componentes sin validación**:
- AccountingPage.tsx
- TaxConfiguration.tsx
- EnhancedTransactionForm.tsx
- RecurringExpensesManager.tsx
- PayrollConfiguration.tsx
- PayrollPayments.tsx

#### Módulo de Reportes (`src/components/reports/*`)
**Archivos afectados**: 5+ componentes

```typescript
// ❌ NO VALIDA:
'reports.view_financial'
'reports.view_operations'
'reports.export'
'reports.analytics'
```

**Componentes sin validación**:
- ReportsPage.tsx
- FinancialReports.tsx
- OperationalReports.tsx
- ExportButtons.tsx

#### Módulo de Empleados (`src/components/admin/*`)
**Archivos afectados**: 15+ componentes

```typescript
// ❌ NO VALIDA:
'employees.view'
'employees.create'
'employees.edit'
'employees.delete'
'employees.assign_services'
'employees.view_payroll'
'employees.manage_payroll'
'employees.set_schedules'
```

**Componentes sin validación**:
- EmployeesManager.tsx
- EmployeeForm.tsx
- EmployeeServices.tsx
- PayrollConfiguration.tsx

#### Módulo de Clientes
```typescript
// ❌ NO VALIDA:
'clients.view'
'clients.create'
'clients.edit'
'clients.delete'
'clients.export'
'clients.communication'
'clients.history'
```

#### Módulo de Sedes y Servicios
```typescript
// ❌ NO VALIDA:
'locations.view', 'locations.create', 'locations.edit', 'locations.delete'
'services.view', 'services.create', 'services.edit', 'services.delete'
```

#### Módulo de Citas
```typescript
// ❌ NO VALIDA:
'appointments.view_all'  // Todos ven todas las citas
'appointments.view_own'  // No implementado
'appointments.create'
'appointments.edit'
'appointments.delete'
```

---

## ⚠️ PROBLEMAS IDENTIFICADOS

### 1. 🔴 CRÍTICO: Sistema V2.0 No Implementado Fuera de Admin
**Impacto**: ALTO  
**Riesgo**: Seguridad y control de acceso

**Problema**:
- El sistema v2.0 está 100% funcional pero solo se usa en `/app/admin/permissions`
- El resto de la aplicación NO valida permisos granulares
- Cualquier admin puede acceder a TODO (contabilidad, reportes, nómina, etc.)
- No hay diferenciación entre "Admin Completo", "Gerente de Sede", "Contador"

**Evidencia**:
```bash
# Solo 15 archivos importan permissions-v2
grep -r "from '@/lib/permissions-v2'" src/ | wc -l
# 15 matches

# Solo 2 archivos usan el sistema LEGACY
grep -r "from '@/lib/permissions'" src/ | wc -l  
# 2 matches (useSupabase.ts, usePermissions.tsx)
```

### 2. 🟡 MEDIO: Arquitectura Admin = Employee + Permisos NO Cumplida
**Impacto**: MEDIO  
**Solicitado por Usuario**

**Problema**:
- Usuario solicitó: *"un administrador es a la vez un empleado al cual le dieron mas permisos"*
- Actualmente: `business_roles.role` es `'admin' | 'employee'` (mutuamente exclusivo)
- Admin NO tiene entrada en `business_employees` automáticamente
- Admin NO puede ser asignado a servicios/citas como empleado

**Evidencia en DB**:
```sql
-- business_roles tiene role='admin' o role='employee' (excluyente)
SELECT role FROM business_roles LIMIT 5;
-- Resultado: 'admin', 'employee', 'employee', 'admin', 'employee'

-- business_employees NO incluye admins automáticamente
SELECT COUNT(*) FROM business_employees WHERE employee_id IN (
  SELECT user_id FROM business_roles WHERE role='admin'
);
-- Resultado: 0 (admins NO están en business_employees)
```

### 3. 🟡 MEDIO: Plantillas NO Aplicadas por Defecto
**Impacto**: MEDIO  
**UX**: Confusión

**Problema**:
- Existen 6 plantillas de sistema perfectas
- Al asignar rol admin, NO se aplica plantilla automáticamente
- Usuario queda sin permisos granulares
- Owner bypasea todo (correcto), pero otros admins quedan sin config

**Solución Esperada**:
```typescript
// Al asignar rol 'admin' → Aplicar template "Admin Completo"
assignRoleMutation.mutate({
  role: 'admin',
  autoApplyTemplate: 'Admin Completo'  // ❌ No existe este parámetro
})
```

### 4. 🟢 BAJO: Datos Simulados en PermissionsManager
**Impacto**: BAJO  
**UX**: Incompleto

**Problema**:
```typescript
// PermissionsManager.tsx línea 109
const users: UserWithRoles[] = useMemo(() => {
  return businessRoles.map(role => ({
    id: role.user_id,
    name: 'Usuario Ejemplo',  // ❌ HARDCODED
    email: 'usuario@ejemplo.com',  // ❌ HARDCODED
    avatar_url: undefined,
    // ...
  }))
}, [businessRoles, ownerId, userPermissions])
```

**Solución**:
Hacer JOIN con `profiles`:
```sql
SELECT 
  br.*,
  p.full_name,
  p.email,
  p.avatar_url,
  COUNT(up.id) as permissions_count
FROM business_roles br
LEFT JOIN profiles p ON p.id = br.user_id
LEFT JOIN user_permissions up ON up.user_id = br.user_id 
  AND up.business_id = br.business_id
WHERE br.business_id = $1
GROUP BY br.id, p.id
```

---

## 🎯 REQUERIMIENTOS IDENTIFICADOS

### Usuario Solicitó:
> *"Hay un modulo de permisos que esta muy desactualizado, validalo, analizalo a fondo y revisa que se requiere para actualizarlo"*

> *"recuerda que un administrador es a la vez un empleado al cual le dieron mas permisos"*

> *"ajustalo porque hay muchas funcionalidades no contempladas en este modulo"*

### Interpretación:
1. ✅ **Validar sistema**: COMPLETADO (Sistema v2.0 existe y es robusto)
2. ❌ **Actualizar**: NO se requiere actualización, se requiere ADOPCIÓN
3. ❌ **Admin = Employee + Permisos**: NO cumplido (roles excluyentes)
4. ❌ **Funcionalidades contempladas**: 55 permisos definidos, 0 implementados fuera de admin

---

## 📋 PLAN DE ACCIÓN PROPUESTO

### Fase 1: Migración a Sistema V2.0 (CRÍTICO)
**Duración**: 3-4 horas  
**Prioridad**: 🔴 ALTA

**Objetivo**: Reemplazar sistema LEGACY por V2.0 en TODA la aplicación

#### 1.1. Deprecar Sistema LEGACY
```typescript
// src/lib/permissions.ts
/** @deprecated Use permissions-v2.ts instead */
export const ROLE_PERMISSIONS = { ... }
```

#### 1.2. Migrar Hook Principal
**Archivo**: `src/hooks/usePermissions.tsx`

**Antes** (LEGACY):
```typescript
import { userHasPermission } from '@/lib/permissions'

export function usePermissions() {
  return {
    hasPermission: (permission) => 
      userHasPermission(activeRole, user.permissions, permission)
  }
}
```

**Después** (V2.0):
```typescript
import { usePermissions as usePermissionsV2 } from '@/hooks/usePermissions-v2'

export function usePermissions() {
  const { checkPermission } = usePermissionsV2({ userId, businessId, ownerId })
  
  return {
    hasPermission: (permission) => checkPermission(permission).hasPermission
  }
}
```

#### 1.3. Implementar Validación en Módulos Clave

**Ejemplo: AccountingPage.tsx**
```typescript
import { usePermissions } from '@/hooks/usePermissions-v2'

export function AccountingPage({ businessId, userId, ownerId }) {
  const { checkPermission } = usePermissions({ userId, businessId, ownerId })
  
  // Validar acceso al módulo
  if (!checkPermission('accounting.view').hasPermission) {
    return <AccessDenied permission="accounting.view" />
  }
  
  // Validar funciones específicas
  const canEditTaxConfig = checkPermission('accounting.tax_config').hasPermission
  const canCreateExpenses = checkPermission('accounting.expenses.create').hasPermission
  
  return (
    <Card>
      {canEditTaxConfig && <TaxConfiguration />}
      {canCreateExpenses && <Button>Nueva Transacción</Button>}
    </Card>
  )
}
```

#### 1.4. Crear Componente Reutilizable
**Archivo**: `src/components/ui/PermissionGate.tsx`

```typescript
export function PermissionGate({ 
  permission, 
  fallback = <AccessDenied />,
  children 
}) {
  const { checkPermission } = usePermissions()
  
  if (!checkPermission(permission).hasPermission) {
    return fallback
  }
  
  return <>{children}</>
}

// Uso:
<PermissionGate permission="accounting.view">
  <AccountingModule />
</PermissionGate>
```

#### 1.5. Módulos a Actualizar (30 archivos estimados)

**Contabilidad** (10 archivos):
- AccountingPage.tsx ✅ Validar `accounting.view`
- TaxConfiguration.tsx ✅ Validar `accounting.tax_config`
- EnhancedTransactionForm.tsx ✅ Validar `accounting.expenses.create`
- RecurringExpensesManager.tsx ✅ Validar `accounting.expenses.view`
- PayrollConfiguration.tsx ✅ Validar `accounting.payroll.config`
- PayrollPayments.tsx ✅ Validar `accounting.payroll.create`

**Reportes** (5 archivos):
- ReportsPage.tsx ✅ Validar `reports.view_operations` o `reports.view_financial`
- FinancialReports.tsx ✅ Validar `reports.view_financial`
- ExportButtons.tsx ✅ Validar `reports.export`

**Empleados** (8 archivos):
- EmployeesManager.tsx ✅ Validar `employees.view`
- EmployeeForm.tsx ✅ Validar `employees.create` o `employees.edit`
- EmployeeServices.tsx ✅ Validar `employees.assign_services`

**Clientes** (4 archivos):
- ClientsManager.tsx ✅ Validar `clients.view`
- ClientForm.tsx ✅ Validar `clients.create` o `clients.edit`

**Citas** (3 archivos):
- AppointmentsCalendar.tsx ✅ Validar `appointments.view_all` vs `appointments.view_own`

---

### Fase 2: Arquitectura Admin = Employee + Permisos
**Duración**: 2-3 horas  
**Prioridad**: 🟡 MEDIA

#### 2.1. Agregar Trigger Automático

**Migración**: `20251021000000_auto_insert_admin_to_business_employees.sql`

```sql
-- Función que inserta admin en business_employees automáticamente
CREATE OR REPLACE FUNCTION auto_insert_admin_as_employee()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el rol asignado es 'admin' y NO existe en business_employees
  IF NEW.role = 'admin' AND NOT EXISTS (
    SELECT 1 FROM business_employees 
    WHERE employee_id = NEW.user_id 
    AND business_id = NEW.business_id
  ) THEN
    INSERT INTO business_employees (
      business_id,
      employee_id,
      role,
      employee_type,
      status,
      is_active,
      hire_date,
      offers_services
    ) VALUES (
      NEW.business_id,
      NEW.user_id,
      'manager',  -- Admin → Manager en business_employees
      'location_manager',
      'approved',
      true,
      CURRENT_DATE,
      false  -- Admin NO ofrece servicios por defecto
    )
    ON CONFLICT (business_id, employee_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER trigger_auto_insert_admin_as_employee
  AFTER INSERT OR UPDATE ON business_roles
  FOR EACH ROW
  WHEN (NEW.role = 'admin' AND NEW.is_active = true)
  EXECUTE FUNCTION auto_insert_admin_as_employee();
```

#### 2.2. Actualizar Documentación
```typescript
// src/lib/permissions-v2.ts
/**
 * ARQUITECTURA DE ROLES EN GESTABIZ:
 * 
 * 1. OWNER (Admin Dueño)
 *    - Se identifica por: user_id === businesses.owner_id
 *    - Bypasea TODAS las verificaciones de permisos
 *    - Es automáticamente admin y manager en business_employees
 * 
 * 2. ADMIN (Administrador)
 *    - Definido en: business_roles.role = 'admin'
 *    - Es automáticamente 'manager' en business_employees (trigger)
 *    - Puede tener permisos granulares (user_permissions)
 *    - NO ofrece servicios por defecto (offers_services = false)
 * 
 * 3. EMPLOYEE (Empleado)
 *    - Definido en: business_roles.role = 'employee'
 *    - Debe existir en: business_employees
 *    - Puede tener permisos granulares (user_permissions)
 *    - Puede ofrecer servicios (offers_services = true)
 * 
 * IMPORTANTE: Admin = Employee + Permisos Elevados
 */
```

---

### Fase 3: Aplicación Automática de Plantillas
**Duración**: 1 hora  
**Prioridad**: 🟢 BAJA

#### 3.1. Modificar Mutation assignRole

**Archivo**: `src/hooks/usePermissions-v2.tsx`

```typescript
const assignRoleMutation = useMutation({
  mutationFn: async ({ 
    userId, 
    role, 
    employeeType,
    autoApplyTemplate = true  // ✅ NUEVO PARÁMETRO
  }) => {
    // 1. Asignar rol
    const { data: roleData, error: roleError } = await supabase
      .from('business_roles')
      .insert({ user_id: userId, business_id: businessId, role, employee_type: employeeType })
      .select()
      .single()
    
    if (roleError) throw roleError
    
    // 2. Si autoApplyTemplate, aplicar plantilla del sistema
    if (autoApplyTemplate) {
      const templateName = role === 'admin' ? 'Admin Completo' : 'Profesional'
      
      const { data: template } = await supabase
        .from('permission_templates')
        .select('*')
        .eq('name', templateName)
        .eq('is_system_template', true)
        .single()
      
      if (template) {
        const permissions = template.permissions as Permission[]
        
        // Insertar permisos en batch
        const permissionsToInsert = permissions.map(permission => ({
          user_id: userId,
          business_id: businessId,
          permission,
          granted_by: currentUserId,
        }))
        
        await supabase.from('user_permissions').insert(permissionsToInsert)
      }
    }
    
    return roleData
  }
})
```

#### 3.2. Actualizar UI RoleAssignment.tsx

```tsx
<Select onValueChange={(template) => setSelectedTemplate(template)}>
  <SelectTrigger>
    <SelectValue placeholder="Aplicar plantilla automáticamente" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="none">Sin plantilla</SelectItem>
    <SelectItem value="Admin Completo" recommended>Admin Completo (Recomendado)</SelectItem>
    <SelectItem value="Gerente de Sede">Gerente de Sede</SelectItem>
    <SelectItem value="Contador">Contador</SelectItem>
  </SelectContent>
</Select>
```

---

### Fase 4: Corrección de Datos en PermissionsManager
**Duración**: 30 min  
**Prioridad**: 🟢 BAJA

#### 4.1. Agregar Query de Profiles

**Archivo**: `src/components/admin/PermissionsManager.tsx`

```typescript
// ❌ ANTES
const users: UserWithRoles[] = useMemo(() => {
  return businessRoles.map(role => ({
    id: role.user_id,
    name: 'Usuario Ejemplo',  // HARDCODED
    email: 'usuario@ejemplo.com',  // HARDCODED
    // ...
  }))
}, [businessRoles])

// ✅ DESPUÉS
const { data: usersWithProfiles, isLoading: loadingUsers } = useQuery({
  queryKey: ['business-users-with-roles', businessId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('business_roles')
      .select(`
        *,
        profile:profiles!business_roles_user_id_fkey (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('business_id', businessId)
      .eq('is_active', true)
    
    if (error) throw error
    
    return data.map(role => ({
      id: role.user_id,
      name: role.profile.full_name || 'Sin nombre',
      email: role.profile.email,
      avatar_url: role.profile.avatar_url,
      role: role.role,
      employee_type: role.employee_type,
      is_owner: role.user_id === ownerId,
      permissions_count: 0,  // Calcular después
      is_active: role.is_active,
      assigned_at: role.assigned_at,
    }))
  },
  enabled: !!businessId,
})
```

---

## 📊 RESUMEN DE CAMBIOS ESTIMADOS

| Fase | Archivos Afectados | Líneas Modificadas | Duración | Prioridad |
|------|-------------------|-------------------|----------|-----------|
| Fase 1: Migración V2.0 | ~30 componentes | ~500 líneas | 3-4h | 🔴 ALTA |
| Fase 2: Admin = Employee | 2 archivos + 1 migración | ~150 líneas | 2-3h | 🟡 MEDIA |
| Fase 3: Auto-Plantillas | 2 archivos | ~100 líneas | 1h | 🟢 BAJA |
| Fase 4: Datos Reales | 1 archivo | ~50 líneas | 30min | 🟢 BAJA |
| **TOTAL** | **~35 archivos** | **~800 líneas** | **6-8.5h** | - |

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Pre-requisitos
- [ ] Leer este análisis completo
- [ ] Entender sistema v2.0 actual (`permissions-v2.ts`, `usePermissions-v2.tsx`)
- [ ] Revisar componentes de admin de permisos existentes
- [ ] Backup de base de datos

### Fase 1: Migración V2.0 (CRÍTICO)
- [ ] Deprecar `src/lib/permissions.ts` (agregar @deprecated)
- [ ] Crear `PermissionGate.tsx` componente reutilizable
- [ ] Crear `AccessDenied.tsx` componente de fallback
- [ ] Migrar `AccountingPage.tsx` (piloto)
- [ ] Migrar módulos de contabilidad (10 archivos)
- [ ] Migrar módulos de reportes (5 archivos)
- [ ] Migrar módulos de empleados (8 archivos)
- [ ] Migrar módulos de clientes (4 archivos)
- [ ] Migrar módulos de citas (3 archivos)
- [ ] Migrar módulos de sedes y servicios (6 archivos)
- [ ] Testing completo por módulo
- [ ] Documentar cambios

### Fase 2: Admin = Employee
- [ ] Crear migración `auto_insert_admin_to_business_employees.sql`
- [ ] Aplicar migración en Supabase
- [ ] Crear función SQL `auto_insert_admin_as_employee()`
- [ ] Crear trigger `trigger_auto_insert_admin_as_employee`
- [ ] Backfill: Insertar admins existentes en business_employees
- [ ] Actualizar documentación en `permissions-v2.ts`
- [ ] Testing con usuarios admin/employee

### Fase 3: Auto-Plantillas
- [ ] Modificar `usePermissions-v2.tsx::assignRoleMutation`
- [ ] Agregar parámetro `autoApplyTemplate`
- [ ] Actualizar `RoleAssignment.tsx` con selector de plantilla
- [ ] Testing de asignación de rol + plantilla

### Fase 4: Datos Reales
- [ ] Agregar query profiles en `PermissionsManager.tsx`
- [ ] Actualizar useMemo de usuarios
- [ ] Testing de UI con datos reales

### Testing Final
- [ ] Usuario Owner: Bypasea todo ✅
- [ ] Usuario Admin con template "Admin Completo": Acceso total
- [ ] Usuario Admin con template "Gerente de Sede": Acceso limitado a operaciones
- [ ] Usuario Admin con template "Contador": Solo contabilidad
- [ ] Usuario Employee con template "Recepcionista": Solo citas y clientes
- [ ] Usuario Employee con template "Profesional": Solo sus citas
- [ ] Validar audit log registra cambios

---

## 📝 NOTAS IMPORTANTES

### Para el Equipo de Desarrollo

1. **NO eliminar sistema LEGACY inmediatamente**
   - Marcar como @deprecated
   - Mantener por 1 sprint para rollback
   - Eliminar en versión 2.1.0

2. **Testing exhaustivo requerido**
   - 30 componentes modificados
   - Riesgo de romper flujos existentes
   - Validar con CSV test users

3. **Orden de implementación**
   - Fase 1 es BLOQUEANTE para Fase 2-4
   - Fase 2-4 pueden ejecutarse en paralelo

4. **Documentación**
   - Actualizar `copilot-instructions.md` con nuevo sistema
   - Crear guía de uso para nuevos devs
   - Documentar casos edge (owners, inactive users, expired permissions)

### Para Stakeholders

1. **Impacto en producción**: MEDIO
   - No rompe funcionalidad actual
   - Agrega control de acceso granular
   - Mejora seguridad y auditoría

2. **ROI**:
   - ✅ Mejor segregación de funciones
   - ✅ Prevención de errores por acceso indebido
   - ✅ Cumplimiento de auditorías
   - ✅ Flexibilidad en roles

3. **Riesgos**:
   - 🟡 Posible bloqueo temporal de usuarios si permisos no configurados
   - 🟢 Mitigado con auto-aplicación de plantillas

---

## 🎓 CONCLUSIÓN

El sistema de permisos v2.0 de Gestabiz está **completamente implementado y funcional**, pero **NO está siendo utilizado fuera del módulo de administración de permisos**.

La tarea NO es actualizar o crear un sistema, sino **migrar la aplicación existente** del sistema LEGACY (22 permisos simples) al sistema V2.0 (55+ permisos granulares).

**Recomendación**: Ejecutar Fase 1 (Migración V2.0) como PRIORIDAD ALTA en el próximo sprint. Fases 2-4 son mejoras incrementales opcionales.

---

**Fin del Análisis**  
**Próximos pasos**: Revisar con equipo y priorizar implementación

