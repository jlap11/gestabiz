# ✅ Plan de Acción DETALLADO – Sistema de Permisos Gestabiz v2.0

**Fecha**: 16/11/2025  
**Responsable**: Equipo TI-Turing  
**Contexto**: Sistema de permisos v2.0 ya implementado (backend + UI + DB), pero poco adoptado fuera del módulo de administración.

Este plan traduce el análisis de `ANALISIS_SISTEMA_PERMISOS_COMPLETO.md` en pasos accionables y priorizados, con detalle técnico completo para su ejecución inmediata.

---

## 📊 Resumen Ejecutivo

**Problema Identificado**: 
- Sistema v2.0 (55+ permisos) implementado al 100% pero solo usado en módulo de administración
- 30+ componentes críticos sin validación de permisos (contabilidad, reportes, empleados)
- Todos los admins tienen acceso total sin control granular
- Arquitectura admin vs employee no cumple regla de negocio

**Solución Propuesta**: 
- Migrar 35 archivos al sistema v2.0
- Implementar trigger DB para admin = employee + permisos
- Aplicar plantillas automáticamente
- Proteger 30+ componentes con PermissionGate

**Impacto Esperado**:
- ✅ Control granular de 55 permisos en toda la app
- ✅ Cumplimiento de regla "admin = employee con más permisos"
- ✅ Reducción de riesgos de seguridad (acceso indebido)
- ✅ Audit trail completo de cambios de permisos
- ✅ Templates pre-configurados para 6 roles comunes

**Métricas de Éxito**:
- [ ] 100% de módulos críticos protegidos con permisos v2.0
- [ ] 0 admins sin plantilla de permisos aplicada
- [ ] 100% de admins registrados en business_employees
- [ ] Audit log captura todos los cambios de permisos
- [ ] Sistema LEGACY marcado como deprecated

---

## 1. Objetivos Detallados

### 1.1. Objetivo Principal
Migrar toda la aplicación Gestabiz al **sistema de permisos v2.0** (55+ permisos granulares) para tener control fino de acceso por rol y funcionalidad.

### 1.2. Objetivos Específicos

**OBJ-1: Migración Técnica**
- Deprecar sistema LEGACY (permissions.ts) sin romper compatibilidad
- Crear componente PermissionGate reutilizable
- Aplicar validación de permisos en 30+ componentes críticos
- Unificar API de permisos a través de usePermissions hook

**OBJ-2: Arquitectura Admin-Employee**
- Implementar trigger DB que auto-registra admins en business_employees
- Backfill de admins existentes como empleados tipo 'manager'
- Documentar nueva arquitectura: Admin = Employee + permisos elevados

**OBJ-3: Auto-aplicación de Plantillas**
- Modificar hook para aplicar plantilla al asignar rol
- Configurar mapeo: Admin → "Admin Completo", Employee → "Profesional"
- Registrar aplicación de plantilla en audit log

**OBJ-4: UI con Datos Reales**
- Reemplazar datos simulados ("Usuario Ejemplo") por query real
- JOIN business_roles + profiles para mostrar nombre/email/avatar
- Calcular permissions_count por usuario

---

## 2. Fases, Prioridades y Dependencias

### Matriz de Priorización

| Fase | Prioridad | Impacto | Esfuerzo | Riesgo | Dependencias |
|------|-----------|---------|----------|--------|--------------|
| **Fase 1** | 🔴 CRÍTICA | MUY ALTO | 3-4h | MEDIO | Ninguna |
| **Fase 2** | 🟡 ALTA | ALTO | 2-3h | BAJO | Ninguna |
| **Fase 3** | 🟢 MEDIA | MEDIO | 1-1.5h | BAJO | Fase 1 |
| **Fase 4** | 🟢 BAJA | BAJO | 0.5-1h | MUY BAJO | Fase 1 |

### Estrategia de Ejecución

**Opción A - Secuencial (Recomendada)**:
1. Completar Fase 1 → Deploy staging → Validar
2. Completar Fase 2 → Deploy staging → Validar
3. Completar Fases 3+4 → Deploy staging → Validar
4. Deploy producción con todo

**Opción B - Paralela (Mayor riesgo)**:
- Fase 1 + Fase 2 en paralelo (diferentes archivos)
- Fases 3+4 después de validar 1+2

**Opción C - Incremental (Más segura)**:
- Fase 1 por módulos: Contabilidad → Reportes → Empleados → etc.
- Deploy parcial por cada módulo validado

### Criterios de Aceptación por Fase

**Fase 1**:
- ✅ Sistema LEGACY marcado @deprecated
- ✅ PermissionGate componente creado y testeado
- ✅ 30+ componentes protegidos con permisos v2.0
- ✅ Tests manuales con Owner, Admin, Employee pasados
- ✅ AccessDenied componente funcional

**Fase 2**:
- ✅ Trigger auto_insert_admin_as_employee creado
- ✅ 100% admins existentes backfilled en business_employees
- ✅ Documentación actualizada
- ✅ Tests de integridad DB pasados

**Fase 3**:
- ✅ Plantillas aplicadas automáticamente al asignar rol
- ✅ Audit log registra aplicación de plantilla
- ✅ UI permite seleccionar plantilla customizada
- ✅ Tests con 6 plantillas pasados

**Fase 4**:
- ✅ Datos reales de usuarios mostrados en PermissionsManager
- ✅ Avatares, nombres, emails correctos
- ✅ Contador de permisos por usuario funcional

---

## 3. Fase 1 – Migración al sistema v2.0 (CRÍTICA)

**Objetivo**: Aplicar sistema v2.0 en todos los módulos críticos sin protección actual.

**Prioridad**: 🔴 CRÍTICA  
**Esfuerzo**: 3-4 horas  
**Impacto**: MUY ALTO (cierra brecha de seguridad)  
**Archivos afectados**: ~30 archivos

### 3.1. Deprecar sistema LEGACY

**Archivos involucrados**:
- `src/lib/permissions.ts` (200 líneas)
- `src/hooks/usePermissions.tsx` (wrapper actual)
- `src/hooks/useSupabase.ts` (2 usos de getRolePermissions)

**Acciones Detalladas**:

**Paso 3.1.1 - Marcar permissions.ts como deprecated**
```typescript
/**
 * @deprecated Este módulo usa el sistema LEGACY de 22 permisos.
 * Usar src/lib/permissions-v2.ts (55+ permisos) para nuevos desarrollos.
 * Este archivo se mantiene solo para compatibilidad temporal.
 * Fecha de deprecación: 16/11/2025
 * Fecha de eliminación planeada: Sprint Q1 2026
 */
```

- [ ] Agregar JSDoc @deprecated al inicio del archivo
- [ ] Agregar comentario explicando migración a v2.0
- [ ] Documentar fecha de eliminación futura

**Paso 3.1.2 - Evitar nuevos imports (opcional)**
- [ ] Agregar regla ESLint custom si se desea enforcement estricto:
  ```json
  {
    "no-restricted-imports": ["error", {
      "paths": [{
        "name": "@/lib/permissions",
        "message": "Use @/lib/permissions-v2 instead. Legacy system deprecated."
      }]
    }]
  }
  ```

**Paso 3.1.3 - Auditar usos existentes**
- [ ] Buscar todos los `import.*from.*permissions` (no v2) en codebase
- [ ] Documentar en qué archivos se usa aún (debe ser <5 archivos)
- [ ] Crear plan de migración para esos archivos específicos

**Resultado Esperado**:
- ✅ permissions.ts marcado @deprecated
- ✅ Inventario completo de usos LEGACY identificado
- ✅ Plan de eliminación documentado con fecha

### 3.2. Unificar API de permisos a través de `usePermissions`

**Objetivo**: Que toda la app use una única API basada en v2, manteniendo compatibilidad con código existente.

**Archivo Principal**: `src/hooks/usePermissions.tsx`

**Diseño Propuesto** (~100 líneas):
```typescript
import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessContext } from '@/contexts/BusinessContext'; // o similar
import { usePermissions as usePermissionsV2 } from './usePermissions-v2';
import { Permission } from '@/types/types';

/**
 * Hook unificado de permisos - Wrapper de usePermissions-v2
 * Mantiene API compatible con código LEGACY pero usa sistema v2.0 internamente
 * 
 * @param businessId - ID del negocio (opcional, usa contexto si no se provee)
 * @returns API de permisos unificada (legacy + v2)
 * 
 * @example
 * const { hasPermission, isOwner } = usePermissions();
 * if (hasPermission('accounting.view')) {
 *   // Mostrar módulo de contabilidad
 * }
 * 
 * @example Con businessId específico
 * const { checkPermission } = usePermissions(businessId);
 * const result = checkPermission('employees.edit');
 * if (!result.hasPermission) {
 *   console.log('Razón:', result.reason);
 * }
 */
export function usePermissions(businessId?: string) {
  const { user } = useAuth();
  const { currentBusiness } = useBusinessContext(); // Ajustar según tu contexto
  
  const finalBusinessId = businessId || currentBusiness?.id;
  
  // Usar hook v2 internamente
  const {
    checkPermission,
    checkAnyPermission,
    checkAllPermissions,
    isOwner,
    isAdmin,
    isEmployee,
    canProvideServices,
    userPermissions,
    businessRoles,
    getActivePermissions
  } = usePermissionsV2(user?.id, finalBusinessId);
  
  // === API LEGACY (compatible con código existente) ===
  
  /**
   * Verifica si el usuario tiene un permiso específico
   * @deprecated Use checkPermission() para obtener más contexto
   */
  const hasPermission = useCallback((permission: Permission): boolean => {
    if (isOwner) return true;
    const result = checkPermission(permission);
    return result.hasPermission;
  }, [checkPermission, isOwner]);
  
  // === API V2 (nueva, con más información) ===
  
  /**
   * Verifica permiso y retorna objeto con contexto completo
   * Retorna: { hasPermission: boolean, isOwner: boolean, reason: string }
   */
  const checkPermissionDetailed = useCallback((permission: Permission) => {
    return checkPermission(permission);
  }, [checkPermission]);
  
  return {
    // === API Legacy (para compatibilidad) ===
    hasPermission,        // boolean simple
    
    // === API v2 (recomendada para nuevo código) ===
    checkPermission: checkPermissionDetailed,  // objeto con contexto
    checkAnyPermission,                         // verifica al menos uno
    checkAllPermissions,                        // verifica todos
    
    // === Flags útiles ===
    isOwner,              // es dueño del negocio (bypass total)
    isAdmin,              // tiene rol admin
    isEmployee,           // tiene rol employee
    canProvideServices,   // puede ofrecer servicios (employee activo)
    
    // === Datos raw (para casos avanzados) ===
    userPermissions,      // array de permisos asignados
    businessRoles,        // roles en el negocio
    getActivePermissions, // función para obtener permisos activos
    
    // === Contexto ===
    businessId: finalBusinessId,
    userId: user?.id
  };
}

/**
 * Hook helper para casos simples de verificación
 * Útil para condicionales en componentes
 * 
 * @example
 * const canEdit = useHasPermission('employees.edit');
 * if (!canEdit) return <AccessDenied />;
 */
export function useHasPermission(permission: Permission, businessId?: string): boolean {
  const { hasPermission } = usePermissions(businessId);
  return hasPermission(permission);
}

/**
 * Hook helper para verificar múltiples permisos (ANY)
 * 
 * @example
 * const canManage = useHasAnyPermission(['employees.edit', 'employees.delete']);
 */
export function useHasAnyPermission(permissions: Permission[], businessId?: string): boolean {
  const { checkAnyPermission } = usePermissions(businessId);
  const result = checkAnyPermission(permissions);
  return result.hasPermission;
}

/**
 * Hook helper para verificar múltiples permisos (ALL)
 * 
 * @example
 * const canFullAccess = useHasAllPermissions(['accounting.view', 'accounting.export']);
 */
export function useHasAllPermissions(permissions: Permission[], businessId?: string): boolean {
  const { checkAllPermissions } = usePermissions(businessId);
  const result = checkAllPermissions(permissions);
  return result.hasPermission;
}
```

**Acciones Detalladas**:

**Paso 3.2.1 - Modificar usePermissions.tsx**
- [ ] Abrir `src/hooks/usePermissions.tsx`
- [ ] Reemplazar implementación con código propuesto arriba
- [ ] Importar `usePermissionsV2` desde `./usePermissions-v2`
- [ ] Obtener `businessId` del contexto (ajustar según tu implementación)
- [ ] Exponer API compatible (hasPermission) + API v2 extendida (checkPermission)

**Paso 3.2.2 - Agregar hooks auxiliares**
- [ ] Implementar `useHasPermission` - retorna boolean simple
- [ ] Implementar `useHasAnyPermission` - verifica OR lógico
- [ ] Implementar `useHasAllPermissions` - verifica AND lógico
- [ ] Exportar todos los hooks desde el archivo

**Paso 3.2.3 - Actualizar useSupabase.ts**
- [ ] Buscar llamadas a `getRolePermissions()` del sistema LEGACY
- [ ] Reemplazar por `const { hasPermission } = usePermissions()`
- [ ] Verificar que lógica funcional se mantiene idéntica
- [ ] Eliminar imports de permissions.ts LEGACY

**Paso 3.2.4 - Testing del wrapper**
- [ ] Test manual: Owner bypasa todos los permisos
- [ ] Test manual: Admin con "Admin Completo" ve todos los módulos
- [ ] Test manual: Admin con "Contador" solo ve contabilidad + reportes
- [ ] Test manual: Employee con "Profesional" solo ve sus citas
- [ ] Test manual: Cliente sin permisos admin no ve módulos protegidos

**Resultado Esperado**:
- ✅ Hook usePermissions unificado y funcional
- ✅ Código LEGACY existente funciona sin cambios (compatibilidad)
- ✅ Nuevo código puede usar API v2 extendida (checkPermission con contexto)
- ✅ 4 hooks auxiliares disponibles para casos comunes
- ✅ JSDoc completo para autocomplete en VS Code
- ✅ Tests básicos manuales pasando

**Objetivo**: que el resto de la app use una única API basada en v2.

**Acciones**:
- [ ] Modificar `src/hooks/usePermissions.tsx` para que sea un wrapper de `usePermissions-v2`:
  - Recibir `userId`, `businessId`, `ownerId` (desde `useAuth` / contexto actual de negocio).
  - Exponer al menos:
    - `hasPermission(permission: Permission): boolean`
    - `checkPermission(permission: Permission): { hasPermission; isOwner; reason }`
- [ ] Actualizar `src/hooks/useSupabase.ts` para que use esta nueva API (si aplica) en lugar de `getRolePermissions` LEGACY.

### 3.3. Crear componente `PermissionGate`

**Objetivo**: Componente reutilizable para proteger secciones de UI según permisos.

**Nuevo archivo**: `src/components/ui/PermissionGate.tsx` (~120 líneas)

**Responsabilidad**: Encapsular lógica de control de acceso con 4 modos de operación.

**Implementación Completa**:

```typescript
import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/types/types';
import { AccessDenied } from './AccessDenied';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

interface PermissionGateProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  businessId?: string;
  showWarning?: boolean;
  mode?: 'block' | 'hide' | 'disable' | 'warn';
  deniedMessage?: string;
}

export function PermissionGate({
  permission,
  children,
  fallback,
  businessId,
  showWarning = false,
  mode = 'block',
  deniedMessage
}: PermissionGateProps) {
  const { checkPermission, isOwner } = usePermissions(businessId);
  const result = checkPermission(permission);
  const { hasPermission, reason } = result;
  
  // Owners siempre pasan
  if (isOwner || hasPermission) {
    return <>{children}</>;
  }
  
  // Modo warn - Solo dev
  if ((showWarning || mode === 'warn') && process.env.NODE_ENV === 'development') {
    return (
      <>
        <Alert variant="destructive" className="mb-4">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            <strong>⚠️ Permiso faltante:</strong> {permission}
          </AlertDescription>
        </Alert>
        {children}
      </>
    );
  }
  
  // Modo hide
  if (mode === 'hide') return null;
  
  // Modo disable
  if (mode === 'disable') {
    return (
      <div className="relative">
        <div className="pointer-events-none opacity-50">{children}</div>
        <div className="absolute inset-0 bg-background/30 flex items-center justify-center">
          <p className="text-sm">🔒 Acceso restringido</p>
        </div>
      </div>
    );
  }
  
  // Modo block
  return <>{fallback || <AccessDenied permission={permission} reason={reason} />}</>;
}
```

**Acciones Detalladas**:

**Paso 3.3.1 - Crear archivo**
- [ ] Crear `src/components/ui/PermissionGate.tsx`
- [ ] Copiar implementación completa
- [ ] Agregar JSDoc para autocomplete
- [ ] Exportar en `src/components/ui/index.ts`

**Paso 3.3.2 - Implementar 4 modos**
- [ ] **'block'**: Muestra AccessDenied (páginas)
- [ ] **'hide'**: No renderiza (menús)
- [ ] **'disable'**: Overlay bloqueado (botones)
- [ ] **'warn'**: Alert en dev (debugging)

**Paso 3.3.3 - Testing**
- [ ] Owner ve contenido siempre
- [ ] User con permiso ve normal
- [ ] User sin permiso ve AccessDenied
- [ ] Modo hide no renderiza
- [ ] Modo disable muestra overlay
- [ ] Modo warn muestra alert en dev

**Resultado Esperado**:
- ✅ PermissionGate funcional con 4 modos
- ✅ JSDoc completo
- ✅ Tests manuales pasados

### 3.4. Crear componente `AccessDenied`

**Objetivo**: Vista estándar de acceso denegado con contexto útil.

**Nuevo archivo**: `src/components/ui/AccessDenied.tsx` (~100 líneas)

**Implementación Completa**:

```typescript
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldX, ArrowLeft, Mail, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Permission } from '@/types/types';
import { PERMISSION_DESCRIPTIONS } from '@/lib/permissions-v2';

interface AccessDeniedProps {
  permission?: Permission;
  reason?: string;
  title?: string;
  description?: string;
  showContactButton?: boolean;
  showHomeButton?: boolean;
  onGoBack?: () => void;
}

export function AccessDenied({
  permission,
  reason,
  title = 'Acceso Denegado',
  description,
  showContactButton = true,
  showHomeButton = true,
  onGoBack
}: AccessDeniedProps) {
  const navigate = useNavigate();
  const permissionDescription = permission ? PERMISSION_DESCRIPTIONS[permission] : undefined;
  const defaultDescription = 'No tienes los permisos necesarios para acceder a esta sección.';
  
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldX className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description || defaultDescription}</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {permission && (
            <div className="bg-muted p-4 rounded-md">
              <p className="font-medium text-sm">Permiso requerido:</p>
              <code className="text-xs bg-background px-2 py-1 rounded block">{permission}</code>
              {permissionDescription && (
                <p className="text-muted-foreground text-xs mt-2">{permissionDescription}</p>
              )}
            </div>
          )}
          
          {reason && (
            <div className="text-sm text-muted-foreground">
              <p className="font-medium">Detalles:</p>
              <p className="text-xs">{reason}</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => onGoBack ? onGoBack() : navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            {showHomeButton && (
              <Button variant="outline" onClick={() => navigate('/app')}>
                <Home className="w-4 h-4 mr-2" />
                Inicio
              </Button>
            )}
          </div>
          
          {showContactButton && (
            <Button variant="default" onClick={() => navigate('/app/admin/permissions')} className="w-full">
              <Mail className="w-4 h-4 mr-2" />
              Solicitar Acceso
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

**Acciones**:
- [ ] Crear `src/components/ui/AccessDenied.tsx`
- [ ] Implementar con Card de shadcn/ui
- [ ] Icono ShieldX de Lucide (NO emoji)
- [ ] Mostrar descripción de PERMISSION_DESCRIPTIONS
- [ ] Botones: Volver, Inicio, Solicitar Acceso
- [ ] Exportar en src/components/ui/index.ts

**Testing**:
- [ ] Renderizado sin props
- [ ] Con permission muestra código
- [ ] Con reason muestra detalles
- [ ] Botones funcionan (navigate)
- [ ] Responsive en móvil

**Resultado**:
- ✅ Vista profesional de acceso denegado
- ✅ Contexto útil (qué permiso falta)
- ✅ Acciones claras
- ✅ Integración con PERMISSION_DESCRIPTIONS

### 3.5. Aplicar permisos en módulos críticos

**Objetivo General**: Proteger 30+ componentes sin validación actual con PermissionGate.

**Estrategia**: Aplicar permisos de manera granular según la acción (view, create, edit, delete, export).

**Archivos Totales**: ~30 archivos a modificar
**Tiempo Estimado**: 2-3 horas (patrón repetible)

---

#### 3.5.1. Módulo Contabilidad (`accounting`) - 9 permisos

**Permisos a aplicar**:
- `accounting.view` - Ver módulo de contabilidad
- `accounting.tax_config` - Configurar impuestos
- `accounting.expenses.create` - Crear gastos
- `accounting.expenses.edit` - Editar gastos
- `accounting.expenses.pay` - Pagar gastos
- `accounting.payroll.view` - Ver nómina
- `accounting.payroll.create` - Crear pagos de nómina
- `accounting.payroll.config` - Configurar nómina
- `accounting.export` - Exportar datos contables

**Archivos a modificar** (~10 archivos):
- `src/components/accounting/AccountingPage.tsx` (proteger módulo completo)
- `src/components/accounting/TaxConfiguration.tsx` (tax_config)
- `src/components/accounting/EnhancedTransactionForm.tsx` (expenses.create/edit)
- `src/components/accounting/RecurringExpensesManager.tsx` (expenses.create)
- `src/components/accounting/PayrollConfiguration.tsx` (payroll.config)
- `src/components/accounting/PayrollPayments.tsx` (payroll.create)
- Componentes de exportación (accounting.export)

**Ejemplo de implementación - AccountingPage.tsx**:
```typescript
// ANTES (sin protección)
export function AccountingPage() {
  return (
    <div className="p-6">
      <h1>Contabilidad</h1>
      <Tabs>
        <TabsList>
          <TabsTrigger value="transactions">Transacciones</TabsTrigger>
          <TabsTrigger value="tax">Impuestos</TabsTrigger>
          <TabsTrigger value="payroll">Nómina</TabsTrigger>
        </TabsList>
        
        <TabsContent value="transactions">
          <TransactionList />
        </TabsContent>
        
        <TabsContent value="tax">
          <TaxConfiguration />
        </TabsContent>
        
        <TabsContent value="payroll">
          <PayrollSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// DESPUÉS (con protección)
import { PermissionGate } from '@/components/ui/PermissionGate';

export function AccountingPage() {
  return (
    // Proteger TODA la página con accounting.view
    <PermissionGate permission="accounting.view">
      <div className="p-6">
        <h1>Contabilidad</h1>
        <Tabs>
          <TabsList>
            <TabsTrigger value="transactions">Transacciones</TabsTrigger>
            
            {/* Tabs individuales protegidas */}
            <PermissionGate permission="accounting.tax_config" mode="hide">
              <TabsTrigger value="tax">Impuestos</TabsTrigger>
            </PermissionGate>
            
            <PermissionGate permission="accounting.payroll.view" mode="hide">
              <TabsTrigger value="payroll">Nómina</TabsTrigger>
            </PermissionGate>
          </TabsList>
          
          <TabsContent value="transactions">
            <TransactionList />
          </TabsContent>
          
          <TabsContent value="tax">
            <PermissionGate permission="accounting.tax_config">
              <TaxConfiguration />
            </PermissionGate>
          </TabsContent>
          
          <TabsContent value="payroll">
            <PermissionGate permission="accounting.payroll.view">
              <PayrollSection />
            </PermissionGate>
          </TabsContent>
        </Tabs>
      </div>
    </PermissionGate>
  );
}
```

**Ejemplo - EnhancedTransactionForm.tsx** (crear/editar gastos):
```typescript
import { PermissionGate } from '@/components/ui/PermissionGate';
import { useHasPermission } from '@/hooks/usePermissions';

export function EnhancedTransactionForm({ transaction, onSave }: Props) {
  const canEdit = useHasPermission(
    transaction ? 'accounting.expenses.edit' : 'accounting.expenses.create'
  );
  const canPay = useHasPermission('accounting.expenses.pay');
  
  if (!canEdit) {
    return <AccessDenied permission={transaction ? 'accounting.expenses.edit' : 'accounting.expenses.create'} />;
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Campos del formulario */}
      
      {/* Botón Guardar */}
      <Button type="submit">
        {transaction ? 'Actualizar Gasto' : 'Crear Gasto'}
      </Button>
      
      {/* Botón Pagar (solo si tiene permiso) */}
      <PermissionGate permission="accounting.expenses.pay" mode="hide">
        <Button onClick={handlePay} disabled={!canPay}>
          Marcar como Pagado
        </Button>
      </PermissionGate>
    </form>
  );
}
```

**Acciones Detalladas** - Módulo Contabilidad:

- [ ] **AccountingPage.tsx**: Proteger módulo completo con `accounting.view`
- [ ] **TaxConfiguration.tsx**: Proteger con `accounting.tax_config`
- [ ] **EnhancedTransactionForm**: Crear con `accounting.expenses.create`, editar con `accounting.expenses.edit`
- [ ] **RecurringExpensesManager**: Proteger con `accounting.expenses.create`
- [ ] **PayrollConfiguration**: Proteger con `accounting.payroll.config`
- [ ] **PayrollPayments**: Proteger con `accounting.payroll.create`
- [ ] **Botones de exportación**: Proteger con `accounting.export` (modo hide)
- [ ] **TransactionList**: Botones de editar/eliminar con permissions respectivos
- [ ] **Testing**: Probar con rol "Contador" (debe ver todo contabilidad)
- [ ] **Testing**: Probar con rol "Gerente de Sede" (NO debe ver contabilidad)
- `src/components/accounting/PayrollConfiguration.tsx`
- `src/components/accounting/PayrollPayments.tsx`

**Acciones**:
- [ ] En `AccountingPage.tsx`: proteger el módulo completo con `PermissionGate` → `accounting.view`.
- [ ] En `TaxConfiguration.tsx`: requerir `accounting.tax_config`.
- [ ] En creación/edición de gastos: requerir `accounting.expenses.create`.
- [ ] En pago de gastos: requerir `accounting.expenses.pay`.
- [ ] En vistas/manejo de nómina: usar `accounting.payroll.view` / `accounting.payroll.create` / `accounting.payroll.config`.
- [ ] En exportaciones contables: requerir `accounting.export`.

#### 3.5.2. Reportes (`reports`)

**Archivos aproximados**:
- `src/components/reports/ReportsPage.tsx`
- `src/components/reports/FinancialReports.tsx`
- `src/components/reports/OperationalReports.tsx`
- `src/components/reports/ExportButtons.tsx`

**Acciones**:
- [ ] Proteger `ReportsPage.tsx` con `reports.view_financial` o `reports.view_operations` (según pestaña).
- [ ] Proteger componentes financieros con `reports.view_financial`.
- [ ] Proteger componentes operacionales con `reports.view_operations`.
- [ ] Proteger exportaciones con `reports.export`.
- [ ] Proteger vistas de analytics avanzado con `reports.analytics`.

#### 3.5.3. Empleados (`employees`)

**Acciones**:
- [ ] En listado de empleados (`EmployeesManager`): requerir `employees.view`.
- [ ] En creación de empleado (`EmployeeForm`): requerir `employees.create`.
- [ ] En edición de empleado: requerir `employees.edit`.
- [ ] En eliminación: requerir `employees.delete`.
- [ ] En asignación de servicios: requerir `employees.assign_services`.
- [ ] En vistas de nómina de empleados desde UI de empleados: `employees.view_payroll` / `employees.manage_payroll`.

#### 3.5.4. Clientes (`clients`)

**Acciones**:
- [ ] Listado: `clients.view`.
- [ ] Crear/editar: `clients.create` / `clients.edit`.
- [ ] Eliminar: `clients.delete`.
- [ ] Exportar: `clients.export`.
- [ ] Módulos de comunicación (emails, WhatsApp): `clients.communication`.
- [ ] Historial de clientes: `clients.history`.

#### 3.5.5. Sedes y Servicios (`locations`, `services`)

**Acciones**:
- [ ] Listado sedes: `locations.view`.
- [ ] Crear/editar/eliminar sede: `locations.create` / `locations.edit` / `locations.delete`.
- [ ] Asignar empleados a sede: `locations.assign_employees`.
- [ ] Listado servicios: `services.view`.
- [ ] Crear/editar/eliminar servicios: `services.create` / `services.edit` / `services.delete`.
- [ ] Gestión de precios: `services.prices`.

#### 3.5.6. Citas (`appointments`)

**Acciones**:
- [ ] Diferenciar vistas:
  - `appointments.view_all` para admins/recepción.
  - `appointments.view_own` para profesionales.
- [ ] Crear cita: `appointments.create`.
- [ ] Editar cita: `appointments.edit`.
- [ ] Cancelar cita: `appointments.delete`.
- [ ] Asignar empleado o recurso: `appointments.assign`.
- [ ] Confirmar cita: `appointments.confirm`.

### 3.6. Testing Fase 1

**Acciones**:
- [ ] Probar navegación completa como **Owner** (bypasa todo).
- [ ] Probar como **Admin Completo** (con todos los permisos).
- [ ] Probar como **Gerente de Sede** (sólo operaciones).
- [ ] Probar como **Contador** (sólo contabilidad y reportes financieros).
- [ ] Verificar que se muestran correctamente las vistas de acceso denegado.

---

## 4. Fase 2 – Admin = Employee + Permisos

### 4.1. Trigger para registrar admins en `business_employees`

**Nueva migración**: `supabase/migrations/20251021000000_auto_insert_admin_to_business_employees.sql`

**Acciones**:
- [ ] Crear función `auto_insert_admin_as_employee()` que:
  - Inserte en `business_employees` una fila tipo `manager`/`location_manager` cuando se asigna rol `admin` en `business_roles`.
  - Marque `status = 'approved'`, `is_active = true`, `hire_date = CURRENT_DATE`, `offers_services = false`.
- [ ] Crear trigger `AFTER INSERT OR UPDATE ON business_roles` que llame a esta función cuando `role = 'admin'` y `is_active = true`.

### 4.2. Backfill de admins existentes

**Acciones**:
- [ ] Insertar en `business_employees` a todos los usuarios con `business_roles.role = 'admin'` que no existan todavía como empleados.
- [ ] Verificar que no se rompen constraints ni RLS.

### 4.3. Documentación

**Acciones**:
- [ ] Actualizar comentario en `src/lib/permissions-v2.ts` explicando la arquitectura:
  - OWNER = admin + employee implícito (dueño del negocio).
  - ADMIN = registrado también en `business_employees` como manager.
  - EMPLOYEE = empleado estándar con permisos granulares.

---

## 5. Fase 3 – Auto-aplicación de plantillas

### 5.1. Extender `assignRoleMutation` en `usePermissions-v2`

**Archivo**: `src/hooks/usePermissions-v2.tsx`

**Acciones**:
- [ ] Añadir parámetro opcional `autoApplyTemplate?: boolean` y `templateName?: string`.
- [ ] Tras asignar el rol en `business_roles`, si `autoApplyTemplate`:
  - Buscar plantilla en `permission_templates`:
    - Admin → "Admin Completo" por defecto.
    - Employee (service provider) → "Profesional".
    - Employee (support) → "Staff de Soporte" o "Recepcionista" según tipo.
  - Insertar en `user_permissions` los permisos del template.
- [ ] Registrar en `permission_audit_log` la aplicación de plantilla.

### 5.2. Actualizar `RoleAssignment.tsx`

**Acciones**:
- [ ] Agregar selector de plantilla en el modal de asignación de rol (combo simple):
  - "Sin plantilla", "Admin Completo", "Gerente de Sede", "Contador", "Recepcionista", "Profesional", "Staff de Soporte".
- [ ] Pasar `templateName` y `autoApplyTemplate = templateName !== 'none'` a la mutation.

---

## 6. Fase 4 – Mejoras de UI en módulo de permisos

### 6.1. Reemplazar datos simulados en `PermissionsManager`

**Archivo**: `src/components/admin/PermissionsManager.tsx`

**Acciones**:
- [ ] Crear query real combinando `business_roles`, `profiles` y `user_permissions` (JOIN o varias queries):
  - Obtener nombre, email y avatar desde `profiles`.
  - Calcular `permissions_count` por usuario.
- [ ] Reemplazar el `useMemo` que usa `name: 'Usuario Ejemplo'` y `email: 'usuario@ejemplo.com'` por los datos reales.

### 6.2. Mejoras opcionales

- [ ] Filtros adicionales en AuditLog (por tipo de acción, usuario, fecha).
- [ ] Tooltips con descripción de permisos usando `PERMISSION_DESCRIPTIONS`.
- [ ] Indicar visualmente cuando un usuario es OWNER y cuando los permisos vienen de plantilla.

---

## 7. Estimación de Esfuerzo

| Fase | Estimación | Comentario |
|------|-----------|-----------|
| Fase 1 – Migración v2.0 | 3–4 horas | Muchos componentes, pero patrón repetible con `PermissionGate`. |
| Fase 2 – Admin = Employee | 2–3 horas | Trabajo en DB + pequeña documentación. |
| Fase 3 – Plantillas auto | 1–1.5 horas | Lógica en un hook + un componente. |
| Fase 4 – UI permisos | 0.5–1 hora | 1 componente + query real. |
| **Total estimado** | **6–9.5 horas** | Dependiendo de pruebas manuales y revisiones. |

---

## 8. Checklist Ejecutiva

1. [ ] Aprobación del plan por parte del Product Owner.  
2. [ ] Crear rama de trabajo (`feature/permissions-v2-adoption`).  
3. [ ] Implementar Fase 1 completa + pruebas manuales.  
4. [ ] Deploy controlado (staging) y validación con usuarios de prueba.  
5. [ ] Implementar Fases 2–4 de forma incremental.  
6. [ ] Actualizar documentación (`copilot-instructions.md` si aplica).  
7. [ ] Eliminar sistema LEGACY cuando se confirme estabilidad (en un sprint posterior).

---

Fin del plan de acción.
