# Guía de Usuario: Sistema de Permisos Granulares
**Gestabiz v2.0 - Sistema de Control de Acceso**  
**Actualizado**: Noviembre 2025  
**Audiencia**: Administradores de Negocio

---

## 📖 INTRODUCCIÓN

El **Sistema de Permisos Granulares** de Gestabiz te permite controlar exactamente qué puede hacer cada empleado en tu negocio. Puedes asignar permisos individualmente o usar plantillas pre-configuradas para roles comunes.

### ¿Qué son los permisos?

Los permisos son **autorizaciones específicas** que determinan qué acciones puede realizar un empleado. Por ejemplo:
- ✅ **appointments.create**: Puede crear citas
- ✅ **services.edit**: Puede editar servicios
- ❌ **employees.delete**: NO puede eliminar empleados

### ¿Por qué son importantes?

- 🔒 **Seguridad**: Previene accesos no autorizados
- 📊 **Control**: Sabes quién puede hacer qué
- 🎯 **Eficiencia**: Cada empleado ve solo lo que necesita
- 📝 **Auditoría**: Registro completo de cambios de permisos

---

## 🎭 ROLES VS PERMISOS

### Roles (Automáticos)

Gestabiz tiene 3 roles **calculados automáticamente**:

| Rol | ¿Cómo se obtiene? | Acceso |
|-----|-------------------|--------|
| **OWNER** | Creaste el negocio | 100% sin restricciones |
| **ADMIN** | Registrado en `business_roles` como admin | Según permisos asignados |
| **EMPLOYEE** | Registrado en `business_employees` | Según permisos asignados |
| **CLIENT** | Cualquier usuario | Solo funciones de cliente |

**IMPORTANTE**: 
- ✅ **OWNER**: Bypass total de permisos (eres dueño)
- ⚠️ **ADMIN/EMPLOYEE**: Necesitan permisos asignados

### Permisos (Granulares)

Los permisos se asignan **individualmente** a cada admin/employee. Ejemplo:

**María es ADMIN en "Salón Belleza XYZ"**:
- ✅ Tiene permiso `appointments.create` → Puede crear citas
- ❌ NO tiene permiso `employees.delete` → NO puede eliminar empleados

---

## 📋 CATEGORÍAS DE PERMISOS

Gestabiz tiene **79 tipos de permisos** organizados en categorías:

### 1. Servicios (services.*)
- `create`: Crear nuevos servicios
- `edit`: Editar servicios existentes
- `delete`: Eliminar servicios
- `view`: Ver lista de servicios

**Ejemplo**: Gerente de servicios necesita `services.create`, `services.edit`, `services.view`

---

### 2. Recursos (resources.*)
- `create`: Crear recursos físicos (salas, equipos)
- `edit`: Editar recursos
- `delete`: Eliminar recursos
- `view`: Ver recursos

**Ejemplo**: Recepcionista necesita `resources.view` para asignar salas

---

### 3. Ubicaciones (locations.*)
- `create`: Crear nuevas sedes
- `edit`: Editar sedes existentes
- `delete`: Eliminar sedes
- `view`: Ver lista de sedes

**Ejemplo**: Manager de sede necesita `locations.view` (solo ver)

---

### 4. Empleados (employees.*)
- `create`: Contratar empleados
- `edit`: Editar perfiles de empleados
- `delete`: Despedir empleados
- `view`: Ver lista de empleados
- `edit_salary`: Editar salarios
- `edit_own_profile`: Editar su propio perfil

**Ejemplo**: Recepcionista solo necesita `employees.view`

---

### 5. Citas (appointments.*)
- `create`: Crear citas para clientes
- `edit`: Editar citas existentes
- `delete`: Eliminar citas
- `cancel`: Cancelar citas
- `cancel_own`: Cancelar solo sus propias citas
- `reschedule_own`: Reprogramar solo sus propias citas

**Ejemplo**: Vendedor necesita `appointments.create`, `appointments.view`, `appointments.edit`

---

### 6. Reclutamiento (recruitment.*)
- `create_vacancy`: Publicar vacantes
- `edit_vacancy`: Editar vacantes
- `delete_vacancy`: Eliminar vacantes
- `manage_applications`: Gestionar aplicaciones

**Ejemplo**: Gerente de RRHH necesita todos los permisos de recruitment

---

### 7. Contabilidad (accounting.*)
- `create`: Registrar transacciones
- `edit`: Editar transacciones
- `delete`: Eliminar transacciones
- `view_reports`: Ver reportes financieros

**Ejemplo**: Contador necesita `accounting.create`, `accounting.view_reports`

---

### 8. Gastos (expenses.*)
- `create`: Registrar gastos
- `delete`: Eliminar gastos

**Ejemplo**: Manager necesita `expenses.create` para registrar compras

---

### 9. Reseñas (reviews.*)
- `create`: Crear reseñas (clientes)
- `moderate`: Moderar reseñas
- `respond`: Responder a reseñas

**Ejemplo**: Community Manager necesita `reviews.moderate`, `reviews.respond`

---

### 10. Facturación (billing.*)
- `manage`: Gestionar suscripciones y pagos
- `view`: Ver historial de facturación

**Ejemplo**: Solo OWNER necesita `billing.manage`

---

### 11. Notificaciones (notifications.*)
- `manage`: Configurar canales y recordatorios
- `view`: Ver notificaciones

**Ejemplo**: Todos necesitan `notifications.view`, solo admins `notifications.manage`

---

### 12. Configuraciones (settings.*)
- `edit`: Editar configuraciones generales
- `edit_business`: Editar información del negocio

**Ejemplo**: Solo OWNER o gerente general necesita `settings.edit_business`

---

### 13. Permisos (permissions.*)
- `manage`: Asignar/revocar permisos
- `view`: Ver permisos de otros
- `assign`: Asignar permisos específicos

**Ejemplo**: Solo OWNER y gerentes de RRHH necesitan `permissions.manage`

---

### 14. Ausencias (absences.*)
- `approve`: Aprobar ausencias/vacaciones
- `request`: Solicitar ausencias

**Ejemplo**: Todos los empleados tienen `absences.request`, solo admins `absences.approve`

---

### 15. Favoritos (favorites.*)
- `toggle`: Marcar/desmarcar como favorito

**Ejemplo**: Clientes tienen `favorites.toggle`

---

### 16. Ventas (sales.*)
- `create`: Registrar ventas rápidas (walk-in)

**Ejemplo**: Cajero y vendedor necesitan `sales.create`

---

## 🎨 PLANTILLAS DE PERMISOS

Las **plantillas** son conjuntos pre-configurados de permisos para roles comunes. Gestabiz incluye **9 plantillas del sistema**:

### 1. Admin Completo (44 permisos) 🔑

**Para**: Gerente General, Co-owner

**Permisos incluidos**: TODOS excepto billing (reservado para owner)

**Ideal para**: Tu gerente de confianza que necesita acceso casi total

---

### 2. Vendedor (8 permisos) 💼

**Para**: Vendedor, Asesor Comercial

**Permisos**:
- `appointments.create` ✅
- `appointments.view` ✅
- `appointments.edit` ✅
- `services.view` ✅
- `locations.view` ✅
- `sales.create` ✅
- `reviews.view` ✅
- `notifications.view` ✅

**Ideal para**: Empleado enfocado en ventas y reservas de clientes

---

### 3. Cajero (6 permisos) 💵

**Para**: Cajero, Encargado de Pagos

**Permisos**:
- `sales.create` ✅
- `accounting.create` ✅
- `appointments.view` ✅
- `services.view` ✅
- `locations.view` ✅
- `notifications.view` ✅

**Ideal para**: Empleado que maneja pagos y transacciones

---

### 4. Manager de Sede (15 permisos) 🏢

**Para**: Gerente de Sucursal, Supervisor de Sede

**Permisos**:
- `appointments.*` (create, edit, view, cancel) ✅
- `services.view` ✅
- `locations.view` ✅
- `employees.view` ✅
- `sales.create` ✅
- `accounting.view_reports` ✅
- `expenses.view` ✅
- `reviews.view` ✅
- `reviews.respond` ✅
- `notifications.manage` ✅
- `absences.approve` ✅

**Ideal para**: Encargado de una sucursal específica

---

### 5. Recepcionista (11 permisos) 📞

**Para**: Recepcionista, Atención al Cliente

**Permisos**:
- `appointments.create` ✅
- `appointments.view` ✅
- `appointments.edit` ✅
- `services.view` ✅
- `locations.view` ✅
- `employees.view` ✅
- `reviews.view` ✅
- `notifications.view` ✅
- `resources.view` ✅
- `absences.request` ✅
- `favorites.toggle` ✅

**Ideal para**: Primer contacto con clientes, gestión de agendas

---

### 6. Contador (14 permisos) 📊

**Para**: Contador, Analista Financiero

**Permisos**:
- `accounting.*` (create, edit, view_reports) ✅
- `expenses.*` (create, delete) ✅
- `sales.create` ✅
- `billing.view` ✅
- `services.view` ✅
- `locations.view` ✅
- `notifications.view` ✅

**Ideal para**: Gestión contable y reportes financieros

---

### 7. Profesional (7 permisos) 💇‍♀️

**Para**: Estilista, Terapeuta, Profesional que ofrece servicios

**Permisos**:
- `appointments.view` ✅
- `appointments.cancel_own` ✅
- `appointments.reschedule_own` ✅
- `services.view` ✅
- `reviews.view` ✅
- `absences.request` ✅
- `notifications.view` ✅

**Ideal para**: Empleado que solo ofrece servicios a clientes

---

### 8. Gerente de Sede (18 permisos) 🏢 (Variante)

**Para**: Gerente de Sucursal con más permisos que Manager de Sede

**Similar a**: Manager de Sede pero con `employees.edit`, `recruitment.*`

**Ideal para**: Gerente que también contrata personal

---

### 9. Staff de Soporte (3 permisos) 🛠️

**Para**: Soporte Técnico, Mantenimiento

**Permisos**:
- `services.view` ✅
- `locations.view` ✅
- `notifications.view` ✅

**Ideal para**: Personal de soporte que necesita acceso mínimo

---

## 🔧 CÓMO ASIGNAR PERMISOS

### Opción 1: Usar Plantilla (Recomendado) ✨

**Paso 1**: Ve a **Admin Dashboard** → **Permisos**

**Paso 2**: Selecciona empleado en la lista

**Paso 3**: Clic en **"Aplicar Plantilla"**

**Paso 4**: Elige plantilla (ej: "Vendedor")

**Paso 5**: Confirma aplicación

**Resultado**: El empleado recibe los 8 permisos del template "Vendedor" automáticamente

**Ventajas**:
- ✅ Rápido (1 clic)
- ✅ Sin errores (plantilla pre-configurada)
- ✅ Consistente (todos los vendedores tienen mismos permisos)

---

### Opción 2: Asignar Individualmente

**Paso 1**: Ve a **Admin Dashboard** → **Permisos**

**Paso 2**: Selecciona empleado

**Paso 3**: Clic en **"Asignar Permiso"**

**Paso 4**: Selecciona permiso del dropdown (ej: `appointments.create`)

**Paso 5**: Agrega nota opcional (ej: "Necesita crear citas")

**Paso 6**: Confirma asignación

**Resultado**: Empleado recibe UN permiso

**Ventajas**:
- ✅ Control total
- ✅ Permisos personalizados
- ✅ Notas explicativas

**Desventajas**:
- ⏱️ Más lento (1 permiso a la vez)
- ⚠️ Riesgo de olvidar permisos necesarios

---

### Opción 3: Asignación Masiva (Bulk)

**Paso 1**: Selecciona empleado

**Paso 2**: Clic en **"Asignación Masiva"**

**Paso 3**: Selecciona múltiples permisos con checkboxes

**Paso 4**: Confirma asignación

**Resultado**: Empleado recibe todos los permisos seleccionados en 1 operación

**Ventajas**:
- ✅ Más rápido que individual
- ✅ Selección visual con checkboxes
- ✅ Confirmación antes de aplicar

---

## 🗑️ CÓMO REVOCAR PERMISOS

### Revocar Permiso Individual

**Paso 1**: Ve a **Admin Dashboard** → **Permisos**

**Paso 2**: Selecciona empleado

**Paso 3**: Encuentra permiso en la lista de "Permisos Activos"

**Paso 4**: Clic en botón **"Revocar"** (ícono de prohibido)

**Paso 5**: Confirma revocación

**Paso 6**: Agrega nota opcional (ej: "Ya no es gerente")

**Resultado**: Permiso se marca como `is_active = false`

**IMPORTANTE**: El permiso NO se elimina, solo se **desactiva**. Puede reactivarse después.

---

### Revocar Todos los Permisos

**Paso 1**: Selecciona empleado

**Paso 2**: Clic en **"Revocar Todos"**

**Paso 3**: Confirma acción (modal de advertencia)

**Paso 4**: Agrega nota (ej: "Empleado despedido")

**Resultado**: TODOS los permisos activos se desactivan

**⚠️ ADVERTENCIA**: Esta acción es reversible, pero requiere reasignación manual.

---

## 📊 VER PERMISOS DE UN EMPLEADO

### Vista de Tabla

**Ubicación**: Admin Dashboard → Permisos → Seleccionar Empleado

**Información mostrada**:
- ✅ Permiso (ej: `appointments.create`)
- ✅ Estado (Activo / Revocado)
- ✅ Asignado por (nombre del admin)
- ✅ Fecha de asignación
- ✅ Notas

**Filtros disponibles**:
- Por estado: Solo activos / Solo revocados / Todos
- Por categoría: appointments / services / employees / etc.
- Por fecha: Últimos 7 días / Último mes / Todo

---

### Vista de Auditoría

**Ubicación**: Admin Dashboard → Permisos → Auditoría

**Registro completo de cambios**:
- 📝 Quién asignó/revocó el permiso
- 📅 Cuándo se hizo el cambio
- 🔄 Qué permiso cambió
- 📄 Notas del cambio

**Útil para**:
- Investigar cambios sospechosos
- Reportes de compliance
- Auditorías de seguridad

---

## 🎯 ESCENARIOS COMUNES

### Escenario 1: Contratar Nuevo Vendedor

**Situación**: Contrataste a Juan como vendedor

**Pasos**:
1. Juan completa onboarding como empleado
2. Admin va a **Permisos** → Selecciona a Juan
3. Clic en **"Aplicar Plantilla"** → Elige **"Vendedor"**
4. Confirma aplicación
5. ✅ Juan recibe 8 permisos: appointments.*, services.view, sales.create, etc.

**Tiempo**: 30 segundos

---

### Escenario 2: Promover Empleado a Gerente

**Situación**: María era vendedora, ahora es gerente de sede

**Pasos**:
1. Admin va a **Permisos** → Selecciona a María
2. Clic en **"Aplicar Plantilla"** → Elige **"Manager de Sede"**
3. Confirma aplicación
4. ✅ María recibe 15 permisos (incluye los 8 de vendedor + 7 nuevos)

**Nota**: Los permisos existentes se mantienen, solo se agregan los nuevos

**Tiempo**: 30 segundos

---

### Escenario 3: Empleado Cambia de Rol

**Situación**: Pedro era cajero, ahora será recepcionista

**Pasos**:
1. Admin va a **Permisos** → Selecciona a Pedro
2. Clic en **"Revocar Todos"** (para limpiar permisos de cajero)
3. Agrega nota: "Cambio de rol: cajero → recepcionista"
4. Clic en **"Aplicar Plantilla"** → Elige **"Recepcionista"**
5. ✅ Pedro pierde permisos de cajero y recibe permisos de recepcionista

**Tiempo**: 1 minuto

---

### Escenario 4: Empleado Sale de Vacaciones (Temporal)

**Situación**: Laura se va de vacaciones 2 semanas

**Opción A (Recomendada)**: No hacer nada
- Los permisos se mantienen
- El sistema de ausencias bloquea sus citas automáticamente
- Al regresar, todo funciona normal

**Opción B (Mayor Seguridad)**: Revocar permisos temporalmente
1. Admin va a **Permisos** → Selecciona a Laura
2. Clic en **"Revocar Todos"**
3. Agrega nota: "Vacaciones del 1-15 diciembre"
4. Al regresar: Reaplicar plantilla original

**Tiempo**: 2 minutos (ida y vuelta)

---

### Escenario 5: Despedir Empleado

**Situación**: Carlos fue despedido

**Pasos**:
1. Admin va a **Empleados** → Marca a Carlos como `is_active = false`
2. Admin va a **Permisos** → Selecciona a Carlos
3. Clic en **"Revocar Todos"**
4. Agrega nota: "Despido - Fecha: 15/Nov/2025"
5. ✅ Carlos pierde acceso a TODAS las funciones

**IMPORTANTE**: Marcar como `is_active = false` es CRÍTICO (no solo revocar permisos)

**Tiempo**: 2 minutos

---

### Escenario 6: Empleado Necesita Permiso Especial

**Situación**: Ana es recepcionista pero necesita editar servicios temporalmente

**Pasos**:
1. Admin va a **Permisos** → Selecciona a Ana
2. Clic en **"Asignar Permiso"** (NO aplicar plantilla)
3. Selecciona `services.edit`
4. Agrega nota: "Temporal - Actualización de precios"
5. ✅ Ana recibe 1 permiso adicional (mantiene los 11 de recepcionista)

**Al terminar**:
1. Admin revoca `services.edit`
2. Agrega nota: "Finalizada actualización de precios"

**Tiempo**: 1 minuto (asignar + revocar)

---

## ❓ PREGUNTAS FRECUENTES (FAQ)

### 1. ¿Puedo crear mis propias plantillas?

**Sí**. Ve a **Admin Dashboard** → **Permisos** → **Plantillas** → **"Crear Plantilla"**

**Pasos**:
1. Nombre de la plantilla (ej: "Recepcionista Senior")
2. Selecciona permisos con checkboxes
3. Guarda plantilla
4. ✅ Ahora puedes aplicarla a empleados

**Ventaja**: Plantillas personalizadas se guardan en tu negocio (no son del sistema)

---

### 2. ¿Qué pasa si aplico 2 plantillas al mismo empleado?

**Respuesta**: Se **acumulan** los permisos (NO se reemplazan)

**Ejemplo**:
- Empleado tiene plantilla "Vendedor" (8 permisos)
- Le aplicas plantilla "Cajero" (6 permisos)
- **Resultado**: Empleado tiene 14 permisos (8 + 6)

**Para reemplazar**: Primero revoca todos, luego aplica nueva plantilla

---

### 3. ¿Los permisos revocados se eliminan de la base de datos?

**No**. Los permisos revocados se marcan como `is_active = false` pero **NO se eliminan**.

**Ventaja**: 
- Historial completo de cambios
- Puedes reactivarlos después
- Auditoría de seguridad

**Para reactivar**: Asigna el mismo permiso nuevamente (se marca como activo otra vez)

---

### 4. ¿Los OWNERS necesitan permisos asignados?

**No**. Los OWNERS tienen **bypass total** de permisos.

**Razón**: Eres dueño del negocio, tienes acceso a TODO sin restricciones.

**Verificación**: El hook `usePermissions` detecta si eres owner y devuelve `true` en 0.1ms (99.4% más rápido)

---

### 5. ¿Qué pasa si un empleado NO tiene permiso?

**Depende del modo de PermissionGate**:

**Mode: hide** (favoritos, eliminar):
- Botón/elemento NO se muestra
- Empleado ni siquiera lo ve

**Mode: disable** (formularios, configuraciones):
- Botón/elemento se muestra pero DESHABILITADO
- Empleado lo ve en gris, no puede clickear

**Mode: show** (mensajes alternativos):
- Se muestra mensaje "No tienes permiso para esta acción"

---

### 6. ¿Puedo ver quién asignó un permiso?

**Sí**. Cada permiso tiene campo `granted_by` que registra quién lo asignó.

**Ubicación**: Admin Dashboard → Permisos → Seleccionar empleado → Ver columna "Asignado Por"

**También en auditoría**: `permission_audit_log` registra TODOS los cambios con:
- Quién hizo el cambio (`performed_by`)
- Qué cambió (`action`: ASSIGNED / REVOKED)
- Cuándo se hizo (`created_at`)
- Notas del cambio

---

### 7. ¿Los permisos son por negocio o globales?

**Por negocio**. Cada empleado tiene permisos **independientes** en cada negocio.

**Ejemplo**:
- Juan es admin en "Salón ABC" → Tiene `employees.delete`
- Juan es employee en "Spa XYZ" → NO tiene `employees.delete`

**Multi-negocio**: Un usuario puede tener roles diferentes en negocios diferentes

---

### 8. ¿Cómo sé si un empleado tiene un permiso?

**Opción 1 (UI)**: Admin Dashboard → Permisos → Seleccionar empleado → Ver lista de permisos activos

**Opción 2 (Código)**: Hook `usePermissions`
```typescript
const hasPermission = usePermissions(businessId, 'services.create');
// true o false
```

**Opción 3 (Base de datos)**: Query a `user_permissions`
```sql
SELECT * FROM user_permissions
WHERE business_id = 'xxx' AND user_id = 'yyy' AND permission = 'services.create' AND is_active = true;
```

---

### 9. ¿Puedo exportar los permisos de un empleado?

**Sí** (feature pendiente).

**Workaround actual**: Ve a Admin Dashboard → Permisos → Seleccionar empleado → Copia la tabla

**Feature planificada**: Botón "Exportar a CSV" que descarga todos los permisos

---

### 10. ¿Hay límite de permisos por empleado?

**No hay límite técnico**. Un empleado puede tener desde 0 hasta 79 permisos (todos los tipos).

**Límite práctico**: La plantilla "Admin Completo" tiene 44 permisos (56% del total)

**Recomendación**: Asigna solo los permisos **necesarios** (principio de mínimo privilegio)

---

## 🛠️ SOLUCIÓN DE PROBLEMAS

### Problema 1: No puedo asignar permisos

**Síntomas**: Botón "Asignar Permiso" deshabilitado o invisible

**Posibles causas**:
1. ❌ No eres OWNER ni tienes permiso `permissions.manage`
2. ❌ El empleado ya tiene ese permiso activo
3. ❌ Error de red (Supabase no responde)

**Solución**:
1. Verifica que tienes permiso `permissions.manage` (si no eres owner)
2. Revisa lista de permisos activos del empleado
3. Revisa consola del navegador (F12) para errores

---

### Problema 2: Permisos no se aplican inmediatamente

**Síntomas**: Asigné permiso pero empleado aún no puede hacer la acción

**Posibles causas**:
1. ❌ Cache de React Query no invalidado
2. ❌ Empleado no refrescó la página
3. ❌ businessId incorrecto

**Solución**:
1. Empleado debe refrescar página (F5)
2. Admin debe verificar que businessId coincide
3. Espera 5 segundos (cache se refresca automáticamente)

---

### Problema 3: Template no aplica todos los permisos

**Síntomas**: Apliqué "Vendedor" pero solo se asignaron 6 de 8 permisos

**Posibles causas**:
1. ❌ Empleado ya tenía 2 permisos del template
2. ❌ Error durante asignación (red cortada)
3. ❌ Template personalizado tiene menos permisos

**Solución**:
1. Verifica lista de permisos activos (los 2 faltantes ya estaban)
2. Aplica template nuevamente (operación idempotente)
3. Revisa qué template aplicaste (puede ser customizado)

---

### Problema 4: No veo botón "Revocar"

**Síntomas**: Quiero revocar permiso pero no veo botón

**Posibles causas**:
1. ❌ No tienes permiso `permissions.manage`
2. ❌ El permiso ya está revocado (`is_active = false`)
3. ❌ Estás viendo otro usuario (no el que quieres revocar)

**Solución**:
1. Verifica que tienes `permissions.manage`
2. Filtra solo por "Activos" (quita filtro "Revocados")
3. Selecciona empleado correcto de la lista

---

### Problema 5: Error "ERROR 23502: null value in column performed_by"

**Síntomas**: Error al revocar permiso desde código (no desde UI)

**Causa**: Estás usando UPDATE directo en vez de RPC function

**Solución**: Usa `permissionRPC.revokePermission()` en vez de `supabase.from('user_permissions').update()`

**Ejemplo correcto**:
```typescript
// ❌ INCORRECTO (trigger falla)
await supabase.from('user_permissions').update({ is_active: false }).eq('id', permissionId);

// ✅ CORRECTO (trigger funciona)
await permissionRPC.revokePermission(businessId, userId, permission, 'Revocado');
```

---

## 📚 RECURSOS ADICIONALES

### Documentación Técnica (Para Desarrolladores)

- `docs/FASE_5_RESUMEN_FINAL_SESION_16NOV.md` - Sistema completo de permisos
- `docs/REPORTE_TESTING_SISTEMA_PERMISOS_17NOV2025.md` - Testing y validaciones
- `docs/GUIA_AUDIT_TRIGGER_PERMISOS.md` - Audit trigger y workarounds
- `docs/FASE_3_RPC_FUNCTIONS_COMPLETADA.md` - Funciones RPC

### Código Relevante

- `src/components/ui/PermissionGate.tsx` - Componente de protección
- `src/hooks/usePermissions.ts` - Hook de verificación
- `src/lib/services/permissionRPC.ts` - Servicio RPC
- `supabase/migrations/20251117220000_add_permission_rpc_functions.sql` - Migraciones

### Soporte

**Si tienes problemas**:
1. Revisa esta guía (FAQ)
2. Revisa documentación técnica
3. Contacta a soporte técnico: soporte@gestabiz.com

---

## 🎓 MEJORES PRÁCTICAS

### 1. Usa Plantillas Siempre que Puedas ✅

**Ventajas**:
- Más rápido (1 clic vs 10+ clics)
- Sin errores (plantilla pre-configurada)
- Consistente (todos los vendedores iguales)

**Cuándo NO usar**: Empleado necesita permisos personalizados únicos

---

### 2. Documenta con Notas 📝

**Ejemplo**:
- ❌ Sin nota: "Asignado"
- ✅ Con nota: "Promovido a gerente - necesita aprobar ausencias"

**Ventaja**: Auditoría clara, sabes por qué se asignó/revocó

---

### 3. Principio de Mínimo Privilegio 🔒

**Regla**: Asigna SOLO los permisos **necesarios** para el trabajo

**Ejemplo**:
- ❌ Recepcionista con `employees.delete` (NO necesario)
- ✅ Recepcionista con `appointments.create` (SÍ necesario)

**Ventaja**: Mayor seguridad, menos riesgo de errores

---

### 4. Revisa Permisos Periódicamente 🔄

**Frecuencia recomendada**: Cada 3 meses

**Checklist**:
- [ ] Empleados despedidos tienen permisos revocados
- [ ] Empleados promovidos tienen nuevos permisos
- [ ] Empleados con permisos que ya no usan
- [ ] Plantillas actualizadas con nuevos permisos

**Ventaja**: Seguridad actualizada, menos permisos obsoletos

---

### 5. Aprovecha la Auditoría 📊

**Usa auditoría para**:
- Investigar incidentes de seguridad
- Reportes de compliance
- Entender patrones de cambio de permisos
- Detectar permisos asignados por error

**Acceso**: Admin Dashboard → Permisos → Auditoría

---

## 📞 CONTACTO

**¿Necesitas ayuda?**

📧 **Email**: soporte@gestabiz.com  
📱 **WhatsApp**: +57 300 123 4567  
🌐 **Web**: https://gestabiz.com/soporte  
📚 **Docs**: https://docs.gestabiz.com

**Horario de atención**: Lunes a Viernes, 8am-6pm (UTC-5)

---

**Versión de la guía**: 1.0  
**Última actualización**: Noviembre 2025  
**Próxima revisión**: Febrero 2026
