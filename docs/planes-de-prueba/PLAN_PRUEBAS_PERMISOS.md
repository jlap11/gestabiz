# Plan de Pruebas - Sistema de Permisos v2.0

**Fecha**: 16/11/2025  
**Objetivo**: Validar que el sistema de permisos v2.0 funciona correctamente con todos los roles definidos

---

## 1. Usuarios de Prueba

### 1.1. Usuarios del Sistema

Los usuarios de prueba están documentados en archivos CSV existentes en el proyecto:
- `database/sample-data.sql` - Datos de ejemplo en SQL
- Usuarios creados manualmente en Supabase

### 1.2. Roles a Probar

| Rol | Template | Permisos | Descripción |
|-----|----------|----------|-------------|
| **Owner** | N/A | BYPASS TOTAL | Dueño del negocio, acceso completo sin restricciones |
| **Admin Completo** | Admin Completo | 42 permisos | Full access a todos los módulos |
| **Gerente de Sede** | Gerente de Sede | 16 permisos | Operaciones, empleados, citas |
| **Contador** | Contador | 14 permisos | Contabilidad + reportes financieros |
| **Recepcionista** | Recepcionista | 10 permisos | Citas + clientes + servicios (view only) |
| **Profesional** | Profesional | 6 permisos | Solo sus propias citas + servicios asignados |
| **Cliente** | N/A | 1 permiso | Solo reservar citas (legacy) |

---

## 2. Casos de Prueba por Módulo

### 2.1. Módulo Contabilidad

**Permisos relevantes**: `accounting.*` (9 permisos)

| Rol | Puede acceder | Puede ver impuestos | Puede crear gastos | Puede pagar gastos | Puede ver nómina | Puede exportar |
|-----|--------------|--------------------|--------------------|-------------------|-----------------|----------------|
| **Owner** | ✅ SÍ | ✅ SÍ | ✅ SÍ | ✅ SÍ | ✅ SÍ | ✅ SÍ |
| **Admin Completo** | ✅ SÍ | ✅ SÍ | ✅ SÍ | ✅ SÍ | ✅ SÍ | ✅ SÍ |
| **Contador** | ✅ SÍ | ✅ SÍ | ✅ SÍ | ✅ SÍ | ✅ SÍ | ✅ SÍ |
| **Gerente** | ❌ NO | ❌ NO | ❌ NO | ❌ NO | ❌ NO | ❌ NO |
| **Recepcionista** | ❌ NO | ❌ NO | ❌ NO | ❌ NO | ❌ NO | ❌ NO |
| **Profesional** | ❌ NO | ❌ NO | ❌ NO | ❌ NO | ❌ NO | ❌ NO |

**Pasos de Prueba**:
1. Iniciar sesión con cada rol
2. Navegar a `/app/admin/accounting`
3. **Owner/Admin/Contador**: Debe ver página completa
   - Verificar tabs visibles: Transacciones, Impuestos, Nómina
   - Intentar crear gasto → Debe funcionar
   - Intentar editar configuración impuestos → Debe funcionar
   - Intentar exportar → Debe mostrar botón
4. **Gerente/Recepcionista/Profesional**: Debe ver AccessDenied
   - Verificar mensaje: "Acceso Denegado"
   - Verificar permiso faltante: `accounting.view`
   - Verificar botones: Volver, Inicio, Solicitar Acceso

### 2.2. Módulo Reportes

**Permisos relevantes**: `reports.*` (4 permisos)

| Rol | Ver Financieros | Ver Operacionales | Exportar | Analytics |
|-----|----------------|------------------|----------|-----------|
| **Owner** | ✅ SÍ | ✅ SÍ | ✅ SÍ | ✅ SÍ |
| **Admin Completo** | ✅ SÍ | ✅ SÍ | ✅ SÍ | ✅ SÍ |
| **Contador** | ✅ SÍ | ❌ NO | ✅ SÍ | ✅ SÍ |
| **Gerente** | ❌ NO | ✅ SÍ | ✅ SÍ | ❌ NO |
| **Recepcionista** | ❌ NO | ❌ NO | ❌ NO | ❌ NO |
| **Profesional** | ❌ NO | ❌ NO | ❌ NO | ❌ NO |

**Pasos de Prueba**:
1. Navegar a `/app/admin/reports`
2. **Contador**: Debe ver tab "Financieros" pero NO "Operacionales"
3. **Gerente**: Debe ver tab "Operacionales" pero NO "Financieros"
4. Intentar exportar reportes → Verificar según tabla

### 2.3. Módulo Empleados

**Permisos relevantes**: `employees.*` (8 permisos)

| Rol | Ver lista | Crear | Editar | Eliminar | Asignar servicios | Ver nómina | Gestionar nómina | Horarios |
|-----|----------|-------|--------|---------|------------------|-----------|-----------------|----------|
| **Owner** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Admin Completo** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Gerente** | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ |
| **Contador** | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Recepcionista** | ✅ (view) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Profesional** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Pasos de Prueba**:
1. Navegar a `/app/admin/employees`
2. Verificar visibilidad de lista según rol
3. Intentar crear empleado → Botón visible/oculto según tabla
4. Intentar editar empleado → Botón visible/oculto según tabla
5. Intentar asignar servicios → Sección visible/oculta según tabla

### 2.4. Módulo Clientes

**Permisos relevantes**: `clients.*` (7 permisos)

| Rol | Ver | Crear | Editar | Eliminar | Exportar | Comunicación | Historial |
|-----|-----|-------|--------|---------|----------|--------------|-----------|
| **Owner** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Admin Completo** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Gerente** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| **Recepcionista** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| **Contador** | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Profesional** | ✅ (solo suyos) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Pasos de Prueba**:
1. Navegar a módulo de clientes
2. **Profesional**: Solo debe ver clientes de sus propias citas
3. **Recepcionista**: Puede crear/editar pero NO eliminar
4. **Contador**: Solo lectura + exportar

### 2.5. Módulo Citas (Appointments)

**Permisos relevantes**: `appointments.*` (7 permisos)

| Rol | Ver todas | Ver propias | Crear | Editar | Eliminar | Asignar | Confirmar |
|-----|----------|------------|-------|--------|---------|---------|-----------|
| **Owner** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Admin Completo** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Gerente** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Recepcionista** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Profesional** | ❌ | ✅ | ❌ | ✅ (solo suyas) | ❌ | ❌ | ✅ (solo suyas) |
| **Cliente** | ❌ | ✅ | ✅ (solo para sí) | ❌ | ❌ | ❌ | ❌ |

**Pasos de Prueba**:
1. **Admin/Gerente/Recepcionista**: Ver calendario completo del negocio
2. **Profesional**: Solo ver calendario propio
3. **Cliente**: Solo ver sus propias citas reservadas
4. Intentar crear cita para otro cliente → Solo admin/gerente/recepcionista
5. Intentar cancelar cita → Verificar según rol

---

## 3. Escenarios de Prueba Críticos

### 3.1. Escenario: Owner Bypass Total

**Usuario**: Owner del negocio  
**Expectativa**: Acceso completo sin restricciones, sin consultar tabla `user_permissions`

**Pruebas**:
1. ✅ Puede acceder a todos los módulos
2. ✅ No ve mensajes de AccessDenied nunca
3. ✅ Todos los botones/acciones están habilitados
4. ✅ No necesita tener permisos asignados en BD

### 3.2. Escenario: Contador Solo Finanzas

**Usuario**: Admin con template "Contador" (14 permisos)  
**Expectativa**: Solo acceso a contabilidad y reportes financieros

**Pruebas**:
1. ✅ Puede acceder a `/app/admin/accounting`
2. ✅ Puede acceder a `/app/admin/reports` (solo tab Financieros)
3. ❌ NO puede acceder a `/app/admin/employees`
4. ❌ NO puede crear/editar servicios
5. ❌ NO puede gestionar ubicaciones
6. ❌ NO ve tab "Operacionales" en reportes
7. ✅ Puede exportar datos contables
8. ✅ Puede configurar impuestos

### 3.3. Escenario: Recepcionista Operaciones

**Usuario**: Employee con template "Recepcionista" (10 permisos)  
**Expectativa**: Solo citas, clientes, servicios (view), sin módulos admin

**Pruebas**:
1. ✅ Puede ver y crear citas
2. ✅ Puede ver y crear clientes
3. ✅ Puede ver servicios (NO crear/editar)
4. ❌ NO puede acceder a contabilidad
5. ❌ NO puede acceder a reportes
6. ❌ NO puede gestionar empleados
7. ✅ Puede asignar empleados a citas
8. ✅ Puede confirmar citas

### 3.4. Escenario: Profesional Solo Sus Citas

**Usuario**: Employee con template "Profesional" (6 permisos)  
**Expectativa**: Solo ver y confirmar sus propias citas

**Pruebas**:
1. ✅ Ve solo citas donde él es el assignee
2. ❌ NO ve citas de otros profesionales
3. ✅ Puede confirmar sus citas
4. ❌ NO puede crear citas para otros
5. ❌ NO puede cancelar citas
6. ❌ NO puede acceder a ningún módulo admin
7. ✅ Puede ver sus servicios asignados
8. ❌ NO puede modificar precios de servicios

---

## 4. Matriz de Pruebas Completa

### 4.1. Template: Admin Completo (42 permisos)

| Módulo | Acción | Resultado Esperado |
|--------|--------|-------------------|
| Negocio | Ver configuración | ✅ Acceso completo |
| Negocio | Editar configuración | ✅ Permitido |
| Negocio | Cambiar categorías | ✅ Permitido |
| Ubicaciones | Ver lista | ✅ Acceso completo |
| Ubicaciones | Crear nueva | ✅ Permitido |
| Ubicaciones | Editar | ✅ Permitido |
| Ubicaciones | Eliminar | ✅ Permitido |
| Servicios | Ver lista | ✅ Acceso completo |
| Servicios | Crear | ✅ Permitido |
| Servicios | Modificar precios | ✅ Permitido |
| Empleados | Ver todos | ✅ Acceso completo |
| Empleados | Contratar | ✅ Permitido |
| Empleados | Asignar servicios | ✅ Permitido |
| Empleados | Ver nómina | ✅ Permitido |
| Citas | Ver todas | ✅ Acceso completo |
| Citas | Crear cualquiera | ✅ Permitido |
| Citas | Reasignar | ✅ Permitido |
| Clientes | Ver todos | ✅ Acceso completo |
| Clientes | Exportar | ✅ Permitido |
| Contabilidad | Acceder módulo | ✅ Acceso completo |
| Contabilidad | Config impuestos | ✅ Permitido |
| Contabilidad | Crear gastos | ✅ Permitido |
| Contabilidad | Pagar gastos | ✅ Permitido |
| Reportes | Ver financieros | ✅ Acceso completo |
| Reportes | Ver operacionales | ✅ Acceso completo |
| Reportes | Exportar | ✅ Permitido |
| Permisos | Ver usuarios | ✅ Acceso completo |
| Permisos | Asignar admin | ✅ Permitido |
| Permisos | Modificar permisos | ✅ Permitido |

### 4.2. Template: Gerente de Sede (16 permisos)

| Módulo | Acción | Resultado Esperado |
|--------|--------|-------------------|
| Ubicaciones | Ver | ✅ Permitido |
| Ubicaciones | Crear | ✅ Permitido |
| Ubicaciones | Editar | ✅ Permitido |
| Ubicaciones | Eliminar | ❌ AccessDenied |
| Servicios | Ver | ✅ Permitido |
| Servicios | Crear | ❌ AccessDenied |
| Empleados | Ver | ✅ Permitido |
| Empleados | Contratar | ✅ Permitido |
| Empleados | Asignar servicios | ✅ Permitido |
| Empleados | Ver nómina | ❌ AccessDenied |
| Citas | Ver todas | ✅ Permitido |
| Citas | Crear | ✅ Permitido |
| Citas | Asignar | ✅ Permitido |
| Clientes | Ver | ✅ Permitido |
| Clientes | Crear | ✅ Permitido |
| Clientes | Comunicación | ✅ Permitido |
| Contabilidad | Acceder | ❌ AccessDenied |
| Reportes | Ver financieros | ❌ AccessDenied |
| Reportes | Ver operacionales | ✅ Permitido |
| Reportes | Exportar | ✅ Permitido |

### 4.3. Template: Contador (14 permisos)

| Módulo | Acción | Resultado Esperado |
|--------|--------|-------------------|
| Contabilidad | Acceder | ✅ Permitido |
| Contabilidad | Ver transacciones | ✅ Permitido |
| Contabilidad | Crear gastos | ✅ Permitido |
| Contabilidad | Editar gastos | ✅ Permitido |
| Contabilidad | Pagar gastos | ✅ Permitido |
| Contabilidad | Config impuestos | ✅ Permitido |
| Contabilidad | Ver nómina | ✅ Permitido |
| Contabilidad | Crear pago nómina | ✅ Permitido |
| Contabilidad | Config nómina | ✅ Permitido |
| Contabilidad | Exportar | ✅ Permitido |
| Reportes | Ver financieros | ✅ Permitido |
| Reportes | Ver operacionales | ❌ AccessDenied |
| Reportes | Exportar | ✅ Permitido |
| Reportes | Analytics | ✅ Permitido |
| Empleados | Ver lista | ✅ Permitido (solo lectura) |
| Empleados | Ver nómina | ✅ Permitido |
| Empleados | Editar | ❌ AccessDenied |
| Citas | Ver | ❌ AccessDenied |
| Clientes | Ver | ✅ Permitido (solo lectura) |
| Clientes | Exportar | ✅ Permitido |

### 4.4. Template: Recepcionista (10 permisos)

| Módulo | Acción | Resultado Esperado |
|--------|--------|-------------------|
| Citas | Ver todas | ✅ Permitido |
| Citas | Crear | ✅ Permitido |
| Citas | Editar | ✅ Permitido |
| Citas | Eliminar | ❌ AccessDenied |
| Citas | Asignar | ✅ Permitido |
| Citas | Confirmar | ✅ Permitido |
| Clientes | Ver | ✅ Permitido |
| Clientes | Crear | ✅ Permitido |
| Clientes | Editar | ✅ Permitido |
| Clientes | Eliminar | ❌ AccessDenied |
| Clientes | Comunicación | ✅ Permitido |
| Clientes | Historial | ✅ Permitido |
| Servicios | Ver | ✅ Permitido |
| Servicios | Crear | ❌ AccessDenied |
| Servicios | Editar | ❌ AccessDenied |
| Empleados | Ver | ❌ AccessDenied |
| Contabilidad | Acceder | ❌ AccessDenied |
| Reportes | Acceder | ❌ AccessDenied |

### 4.5. Template: Profesional (6 permisos)

| Módulo | Acción | Resultado Esperado |
|--------|--------|-------------------|
| Citas | Ver todas | ❌ AccessDenied (solo ve propias) |
| Citas | Ver propias | ✅ Permitido |
| Citas | Crear para sí | ❌ AccessDenied |
| Citas | Editar propias | ✅ Permitido |
| Citas | Confirmar propias | ✅ Permitido |
| Servicios | Ver asignados | ✅ Permitido |
| Servicios | Ver precios | ✅ Permitido |
| Servicios | Editar precios | ❌ AccessDenied |
| Clientes | Ver de sus citas | ✅ Permitido (filtrado) |
| Clientes | Ver todos | ❌ AccessDenied |
| Empleados | Ver lista | ❌ AccessDenied |
| Contabilidad | Acceder | ❌ AccessDenied |
| Reportes | Acceder | ❌ AccessDenied |

---

## 5. Procedimiento de Ejecución

### 5.1. Preparación

1. **Crear usuarios de prueba** (si no existen):
```sql
-- Owner
INSERT INTO profiles (id, name, email, role) 
VALUES ('owner-test-id', 'Owner Test', 'owner@test.com', 'admin');

-- Admin Completo (asignar template después)
INSERT INTO profiles (id, name, email, role) 
VALUES ('admin-test-id', 'Admin Test', 'admin@test.com', 'admin');

-- Gerente
INSERT INTO profiles (id, name, email, role) 
VALUES ('manager-test-id', 'Manager Test', 'manager@test.com', 'admin');

-- Contador
INSERT INTO profiles (id, name, email, role) 
VALUES ('accountant-test-id', 'Accountant Test', 'accountant@test.com', 'admin');

-- Recepcionista
INSERT INTO profiles (id, name, email, role) 
VALUES ('receptionist-test-id', 'Receptionist Test', 'receptionist@test.com', 'employee');

-- Profesional
INSERT INTO profiles (id, name, email, role) 
VALUES ('professional-test-id', 'Professional Test', 'professional@test.com', 'employee');
```

2. **Asignar templates desde UI**:
   - Ir a `/app/admin/permissions`
   - Asignar template "Admin Completo" a admin-test-id
   - Asignar template "Gerente de Sede" a manager-test-id
   - Asignar template "Contador" a accountant-test-id
   - Asignar template "Recepcionista" a receptionist-test-id
   - Asignar template "Profesional" a professional-test-id

### 5.2. Ejecución por Rol

**Para cada rol**:
1. Cerrar sesión
2. Iniciar sesión con usuario de prueba
3. Navegar a cada módulo según matriz
4. Verificar acceso/denegación según esperado
5. Intentar acciones CRUD según matriz
6. Documentar resultados (✅ / ❌ / 🐛 bug)

### 5.3. Documentación de Resultados

Crear tabla de resultados en formato:

| Rol | Módulo | Acción | Esperado | Obtenido | Estado | Notas |
|-----|--------|--------|----------|----------|--------|-------|
| Contador | Contabilidad | Ver | ✅ | ✅ | PASS | - |
| Contador | Empleados | Editar | ❌ | ✅ | FAIL | Bug: no valida permiso |
| ... | ... | ... | ... | ... | ... | ... |

---

## 6. Criterios de Aceptación

### 6.1. Criterios Funcionales

- ✅ **100% de módulos protegidos**: Todos los módulos críticos usan PermissionGate
- ✅ **Owner bypass funciona**: Owner ve todo sin AccessDenied
- ✅ **AccessDenied muestra contexto**: Permiso faltante visible
- ✅ **Templates aplicados correctamente**: 6 templates funcionan según especificación
- ✅ **Audit log registra cambios**: Cada modificación de permisos se registra

### 6.2. Criterios de UX

- ✅ **Mensajes claros**: AccessDenied explica qué permiso falta
- ✅ **Botones ocultos apropiadamente**: Modo 'hide' funciona en menús
- ✅ **Navegación coherente**: Usuario no queda atrapado en loops
- ✅ **Performance aceptable**: Verificación de permisos < 50ms

### 6.3. Criterios de Seguridad

- ✅ **Sin bypass no autorizado**: RLS policies funcionan
- ✅ **Frontend + Backend validation**: Protección en ambos lados
- ✅ **Audit trail completo**: 100% de cambios tracked
- ✅ **Roles no hardcodeados**: Sistema dinámico por BD

---

## 7. Bugs Conocidos a Verificar

1. ❓ **Admin sin template**: ¿Qué pasa si admin no tiene permisos asignados?
2. ❓ **Multi-negocio**: ¿Permisos se aplican por negocio correctamente?
3. ❓ **Cache de permisos**: ¿Cambios se reflejan inmediatamente o requiere refresh?
4. ❓ **Empleado en múltiples negocios**: ¿Permisos se segregan correctamente?

---

## 8. Reporte Final

Al completar todas las pruebas, generar documento `RESULTADOS_PRUEBAS_PERMISOS.md` con:

- Resumen ejecutivo (X de Y pruebas pasaron)
- Tabla completa de resultados
- Lista de bugs encontrados (críticos, altos, medios, bajos)
- Evidencia de pantallas (screenshots de AccessDenied, etc.)
- Recomendaciones para correcciones
- Aprobación para deploy a producción (SÍ/NO)

---

**Responsable de Ejecución**: Equipo de QA / Desarrollador asignado  
**Tiempo Estimado**: 3-4 horas de testing manual  
**Fecha Objetivo**: 18-19/11/2025
