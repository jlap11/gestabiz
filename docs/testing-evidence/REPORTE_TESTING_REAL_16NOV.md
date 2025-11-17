# 🧪 Reporte de Testing en Tiempo Real - 16 Nov 2025

## ⚙️ Configuración del Ambiente

**Fecha de Ejecución**: 16 de Noviembre 2025  
**Hora Inicio**: 19:50 COT  
**Método**: Testing Dirigido (Chrome MCP limitado por instancia existente)  
**Servidores Disponibles**:
- Puerto 5173: ✅ Activo
- Puerto 5174: ✅ Activo  
- Puerto 5175: ✅ Activo (nuevo)

**Limitación Técnica**: Chrome MCP detectó instancia existente. Testing será dirigido con instrucciones manuales precisas.

---

## 📋 ESTRATEGIA DE TESTING

### Fase 1: Testing de Owner Delegando Permisos
**Objetivo**: Validar que owner puede delegar permisos a empleado y que funcionan correctamente

**Escenario**:
1. Owner crea negocio (si no existe)
2. Owner agrega empleado
3. Owner delega permisos específicos al empleado
4. Empleado inicia sesión
5. Empleado verifica permisos delegados funcionan
6. Empleado intenta acciones sin permiso → Bloqueado

### Fase 2: Testing de Módulos Críticos
**Objetivo**: Validar los 25 módulos protegidos funcionan correctamente

**Prioridad**:
1. ⭐ TIER 1: Módulos nuevos (BusinessRecurringExpenses, EmployeeSalaryConfig)
2. ⭐ TIER 2: Módulos de alta frecuencia (Services, Appointments, Employees)
3. TIER 3: Módulos administrativos (Billing, Permissions, Settings)

### Fase 3: Testing de Casos Edge
**Objetivo**: Validar escenarios límite y errores

**Casos**:
- Usuario sin businessId
- Usuario con múltiples negocios
- Usuario sin permisos intentando acción
- businessId inválido/inexistente

---

## 🎯 INSTRUCCIONES MANUALES PRECISAS

### SETUP INICIAL (5 minutos)

#### 1. Preparar Navegador
```
1. Abrir Chrome en modo normal
2. Crear 3 tabs/ventanas:
   - Tab 1: http://localhost:5173 (Owner Session)
   - Tab 2: http://localhost:5174 (Employee Session)  
   - Tab 3: http://localhost:5175 (Testing Session)
```

#### 2. Preparar Cuentas de Testing
```
OWNER ACCOUNT:
- Email: admin@gestabiz.com
- ID: 11111111-1111-1111-1111-111111111111
- Role: Owner de al menos 1 negocio
- Contraseña: [tu contraseña de admin]

EMPLOYEE ACCOUNT (Crear nuevo):
- Email: employee.test@gestabiz.com
- Nombre: Test Employee
- Role: Employee (será agregado por Owner)
```

#### 3. Crear Carpeta de Evidencia
```powershell
New-Item -ItemType Directory -Force -Path "C:\Users\Usuario\source\repos\TI-Turing\gestabiz\docs\testing-evidence\screenshots"
New-Item -ItemType Directory -Force -Path "C:\Users\Usuario\source\repos\TI-Turing\gestabiz\docs\testing-evidence\bugs"
```

---

## ✅ FASE 1: DELEGACIÓN DE PERMISOS (CRÍTICA)

### Test 1.1: Owner - Crear/Verificar Negocio

**Tab 1 (localhost:5173) - Owner Session**

```
PASOS:
1. Login como admin@gestabiz.com
2. Si no tiene negocios:
   a. Click "Crear Negocio"
   b. Nombre: "Test Business - Permisos"
   c. Categoría: Salud y Bienestar > Spa
   d. Completar datos básicos
   e. Guardar
3. Si ya tiene negocio: Seleccionarlo en header dropdown
4. Ir a Dashboard

VALIDACIÓN:
✅ Login exitoso
✅ Negocio visible en dropdown
✅ Dashboard carga correctamente
✅ No hay errores en consola

SCREENSHOT: testing-evidence/screenshots/01-owner-dashboard.png
```

**Status**: ⏳ PENDIENTE  
**Resultado**: _______________  
**Observaciones**: _______________

---

### Test 1.2: Owner - Agregar Empleado

**Tab 1 - Owner Session**

```
PASOS:
1. Dashboard → Click "Empleados" en sidebar
2. Tab "Solicitudes Pendientes"
3. Si no hay solicitudes pendientes:
   a. Necesitas que employee.test@gestabiz.com solicite unirse
   b. Ir a Tab 2 y completar Test 1.3 primero
   c. Volver aquí
4. Click botón "Aprobar" en solicitud de employee.test@gestabiz.com
5. Verificar empleado aparece en lista "Empleados Activos"

VALIDACIÓN:
✅ Botón "Aprobar" visible (employees.approve)
✅ Empleado se agrega a lista activos
✅ Toast notification "Empleado aprobado exitosamente"
✅ No hay errores en consola

SCREENSHOT: testing-evidence/screenshots/02-owner-approve-employee.png
```

**Status**: ⏳ PENDIENTE  
**Resultado**: _______________  
**Observaciones**: _______________

---

### Test 1.3: Employee - Solicitar Unirse a Negocio

**Tab 2 (localhost:5174) - Employee Session**

```
PASOS:
1. Si no tienes cuenta employee.test@gestabiz.com:
   a. Click "Registrarse"
   b. Email: employee.test@gestabiz.com
   c. Password: [tu password de testing]
   d. Nombre completo: Test Employee
   e. Teléfono: +57 300 123 4567
   f. Completar registro
2. Login como employee.test@gestabiz.com
3. Dashboard → Debería ver opción "Unirse a Negocio" o "Employee Onboarding"
4. Buscar "Test Business - Permisos"
5. Click "Solicitar Unirse"
6. Esperar aprobación (ir a Test 1.2)

VALIDACIÓN:
✅ Registro exitoso
✅ Login exitoso
✅ Onboarding visible
✅ Solicitud enviada correctamente

SCREENSHOT: testing-evidence/screenshots/03-employee-request-join.png
```

**Status**: ⏳ PENDIENTE  
**Resultado**: _______________  
**Observaciones**: _______________

---

### Test 1.4: Owner - Delegar Permisos Específicos

**Tab 1 - Owner Session**

```
PASOS:
1. Dashboard → "Configuración" o "Permisos" en sidebar
2. Buscar sección "Gestión de Permisos de Usuarios"
3. Seleccionar empleado: employee.test@gestabiz.com
4. Asignar permisos ESPECÍFICOS (NO todos):
   PERMISOS A ASIGNAR:
   ✅ services.view
   ✅ services.create
   ✅ appointments.view
   ✅ appointments.create
   ✅ locations.view
   
   PERMISOS A NO ASIGNAR (para probar bloqueo):
   ❌ services.edit
   ❌ services.delete
   ❌ employees.view
   ❌ billing.manage
   ❌ settings.edit_business

5. Click "Guardar Cambios"
6. Verificar toast de confirmación

VALIDACIÓN:
✅ Interfaz de permisos carga correctamente
✅ Permisos se pueden seleccionar/deseleccionar
✅ Botón "Guardar" visible (permissions.assign)
✅ Guardado exitoso con mensaje confirmación
✅ Permisos guardados en BD (verificar en Supabase si es posible)

SCREENSHOT: testing-evidence/screenshots/04-owner-delegate-permissions.png
```

**Status**: ⏳ PENDIENTE  
**Resultado**: _______________  
**Observaciones**: _______________

---

### Test 1.5: Employee - Verificar Permisos Asignados Funcionan

**Tab 2 - Employee Session**

```
PASOS:
1. Refresh página (F5) para cargar nuevos permisos
2. Ir a Dashboard → "Servicios"
3. VERIFICAR PERMISOS QUE SÍ TIENE:
   a. Botón "Agregar Servicio" debe estar VISIBLE ✅
   b. Click "Agregar Servicio"
   c. Completar formulario básico:
      - Nombre: "Servicio Test Employee"
      - Precio: 50000
      - Duración: 60 minutos
   d. Guardar
   e. Verificar servicio se crea correctamente

VALIDACIÓN:
✅ Botón "Agregar Servicio" VISIBLE (tiene services.create)
✅ Servicio se crea exitosamente
✅ Toast "Servicio creado exitosamente"
✅ Servicio aparece en lista

SCREENSHOT: testing-evidence/screenshots/05-employee-can-create-service.png
```

**Status**: ⏳ PENDIENTE  
**Resultado**: _______________  
**Observaciones**: _______________

---

### Test 1.6: Employee - Verificar Permisos NO Asignados Bloquean

**Tab 2 - Employee Session**

```
PASOS:
1. Misma pantalla de Servicios
2. Buscar el servicio recién creado "Servicio Test Employee"
3. VERIFICAR PERMISOS QUE NO TIENE:
   a. Botón "Editar" debe estar OCULTO o DESHABILITADO ❌
   b. Botón "Eliminar" (Trash icon) debe estar OCULTO ❌
   c. Si están visibles → ❌ BUG CRÍTICO

4. Ir a Dashboard → "Empleados"
   a. Pantalla debe estar BLOQUEADA o mensaje "Sin permisos"
   b. NO debe ver lista de empleados

5. Ir a Dashboard → "Configuración del Negocio"
   a. Botón "Guardar Cambios" debe estar DESHABILITADO
   b. O sección completa bloqueada

VALIDACIÓN:
✅ Botón "Editar" OCULTO (no tiene services.edit)
✅ Botón "Eliminar" OCULTO (no tiene services.delete)
✅ Pantalla Empleados BLOQUEADA (no tiene employees.view)
✅ Settings BLOQUEADO (no tiene settings.edit_business)

SI ALGUNO FALLA → BUG CRÍTICO (documentar en sección Bugs)

SCREENSHOT: testing-evidence/screenshots/06-employee-blocked-actions.png
```

**Status**: ⏳ PENDIENTE  
**Resultado**: _______________  
**Observaciones**: _______________

---

## ✅ FASE 2: MÓDULOS CRÍTICOS NUEVOS

### Test 2.1: BusinessRecurringExpenses ⭐ NUEVO

**Tab 1 - Owner Session**

```
PASOS:
1. Dashboard → "Configuración" → Tab "Gastos Recurrentes"
2. VALIDAR PERMISOS:
   a. Botón "Agregar Egreso Recurrente" debe estar VISIBLE ✅
   b. Click botón
   c. Completar formulario:
      - Descripción: "Arriendo Local"
      - Monto: 1500000 COP
      - Frecuencia: Mensual
      - Categoría: Arrendamientos
      - Fecha inicio: [hoy]
   d. Guardar
   e. Verificar gasto aparece en lista
   f. Verificar icono Trash2 VISIBLE junto al gasto
   g. Click icono Trash2
   h. Confirmar eliminación
   i. Verificar gasto se elimina

VALIDACIÓN:
✅ Botón "Agregar" VISIBLE (expenses.create)
✅ Gasto se crea correctamente
✅ Formato miles colombiano: 1.500.000 COP
✅ Icono Trash2 VISIBLE (expenses.delete)
✅ Gasto se elimina correctamente
✅ Toast notifications apropiados

SCREENSHOT: testing-evidence/screenshots/07-recurring-expenses.png
```

**Status**: ⏳ PENDIENTE  
**Resultado**: _______________  
**Observaciones**: _______________

---

### Test 2.2: EmployeeSalaryConfig ⭐ NUEVO

**Tab 1 - Owner Session**

```
PASOS:
1. Dashboard → "Empleados"
2. Seleccionar empleado "Test Employee"
3. Buscar tab o sección "Salario" / "Configuración Salarial"
4. VALIDAR PERMISOS:
   a. Botón "Guardar Configuración de Salario" debe estar VISIBLE ✅
   b. Completar/modificar:
      - Salario base: 1200000 COP
      - Tipo de pago: Mensual
      - Comisiones: 5%
      - Fecha efectiva: [hoy]
   c. Click "Guardar"
   d. Verificar guardado exitoso
   e. Refresh empleado
   f. Verificar datos se persistieron

VALIDACIÓN:
✅ Botón "Guardar" VISIBLE (employees.edit_salary)
✅ Formulario funcional
✅ Formato miles: 1.200.000 COP
✅ Datos se guardan correctamente
✅ Toast "Configuración guardada"

SCREENSHOT: testing-evidence/screenshots/08-employee-salary-config.png
```

**Status**: ⏳ PENDIENTE  
**Resultado**: _______________  
**Observaciones**: _______________

---

### Test 2.3: ServicesManager (Flujo Completo)

**Tab 1 - Owner Session**

```
PASOS:
1. Dashboard → "Servicios"
2. FLUJO COMPLETO CRUD:
   
   A. CREATE:
   - Click "Agregar Servicio"
   - Nombre: "Masaje Relajante"
   - Descripción: "Masaje de 60 minutos"
   - Precio: 80000 COP
   - Duración: 60 min
   - Categoría: Spa
   - Guardar
   
   B. READ:
   - Verificar servicio en lista
   - Click ver detalles
   - Verificar todos los datos correctos
   
   C. UPDATE:
   - Click "Editar" (debe estar VISIBLE)
   - Cambiar precio: 85000 COP
   - Cambiar duración: 90 min
   - Guardar
   - Verificar cambios se aplicaron
   
   D. DELETE:
   - Click icono "Eliminar" (debe estar VISIBLE)
   - Confirmar eliminación
   - Verificar servicio desaparece de lista

VALIDACIÓN:
✅ Botón "Agregar" VISIBLE (services.create)
✅ Crear funciona correctamente
✅ Botón "Editar" VISIBLE (services.edit)
✅ Editar funciona correctamente
✅ Botón "Eliminar" VISIBLE (services.delete)
✅ Eliminar funciona correctamente
✅ Todas las acciones con toast notifications

SCREENSHOT: testing-evidence/screenshots/09-services-crud-flow.png
```

**Status**: ⏳ PENDIENTE  
**Resultado**: _______________  
**Observaciones**: _______________

---

### Test 2.4: AppointmentWizard (Creación de Citas)

**Tab 3 (localhost:5175) - Client Session**

```
PASOS:
1. Login como usuario CLIENT (o crear nuevo):
   - Email: client.test@gestabiz.com
   - Nombre: Test Client
   
2. Buscar negocio "Test Business - Permisos"
3. Click "Reservar Cita"
4. COMPLETAR WIZARD PASO POR PASO:
   
   Paso 1: Seleccionar Servicio
   - Seleccionar "Masaje Relajante" (si existe)
   - Click "Siguiente"
   
   Paso 2: Seleccionar Ubicación
   - Seleccionar sede disponible
   - Click "Siguiente"
   
   Paso 3: Seleccionar Empleado
   - Seleccionar empleado disponible
   - Click "Siguiente"
   
   Paso 4: Seleccionar Fecha
   - Seleccionar fecha futura (mañana)
   - Click "Siguiente"
   
   Paso 5: Seleccionar Hora
   - Seleccionar slot disponible
   - Verificar slots ocupados están DESHABILITADOS
   - Verificar hora almuerzo está DESHABILITADA (si aplica)
   - Click "Siguiente"
   
   Paso 6: Confirmar
   - Revisar resumen de cita
   - Botón "Confirmar y Reservar" debe estar VISIBLE ✅
   - Click "Confirmar"

VALIDACIÓN:
✅ Wizard funciona paso por paso
✅ Validaciones de slots ocupados funcionan
✅ Validaciones de horario de sede funcionan
✅ Validaciones de almuerzo funcionan
✅ Botón "Confirmar" VISIBLE (appointments.create)
✅ Cita se crea exitosamente
✅ Redirect a confirmación o dashboard

SCREENSHOT: testing-evidence/screenshots/10-appointment-wizard-flow.png
```

**Status**: ⏳ PENDIENTE  
**Resultado**: _______________  
**Observaciones**: _______________

---

### Test 2.5: AbsencesTab (Aprobar Ausencias)

**Tab 1 - Owner Session**

```
PASOS:
1. Dashboard → "Ausencias" tab
2. Si hay solicitudes pendientes:
   a. Verificar botones "Aprobar" y "Rechazar" VISIBLES
   b. Click "Aprobar" en una solicitud
   c. Verificar aprobación exitosa
   d. Verificar balance de vacaciones se actualiza
   
3. Si NO hay solicitudes:
   a. Ir a Tab 2 (Employee Session)
   b. Employee → Click "Solicitar Ausencia"
   c. Completar formulario:
      - Tipo: Vacaciones
      - Fecha inicio: [próxima semana]
      - Fecha fin: [próxima semana + 2 días]
      - Motivo: "Vacaciones familiares"
   d. Enviar solicitud
   e. Volver a Tab 1 (Owner)
   f. Refresh página
   g. Verificar solicitud aparece
   h. Aprobar

VALIDACIÓN:
✅ Botones "Aprobar"/"Rechazar" VISIBLES (absences.approve)
✅ Aprobación funciona correctamente
✅ Balance de vacaciones se actualiza
✅ Notificaciones enviadas al empleado
✅ Toast confirmación

SCREENSHOT: testing-evidence/screenshots/11-absences-approval.png
```

**Status**: ⏳ PENDIENTE  
**Resultado**: _______________  
**Observaciones**: _______________

---

## ✅ FASE 3: CASOS EDGE Y VALIDACIONES

### Test 3.1: Usuario Sin Permisos Intenta Acción

**Tab 2 - Employee Session**

```
PASOS:
1. Como employee.test@gestabiz.com (que NO tiene billing.manage)
2. Intentar ir a Dashboard → "Facturación"
3. VALIDACIÓN:
   a. Página debe estar bloqueada O
   b. Mensaje "No tienes permisos para ver esta sección" O
   c. Botones críticos deshabilitados

4. Si la página se carga normalmente:
   - Verificar botón "Actualizar Plan" DESHABILITADO u OCULTO
   - Verificar botón "Cancelar Suscripción" DESHABILITADO u OCULTO

VALIDACIÓN:
✅ Sección bloqueada o botones deshabilitados
✅ Mensaje de error apropiado si intenta acción
✅ No se ejecuta ninguna acción no autorizada

SCREENSHOT: testing-evidence/screenshots/12-unauthorized-access-blocked.png
```

**Status**: ⏳ PENDIENTE  
**Resultado**: _______________  
**Observaciones**: _______________

---

### Test 3.2: businessId Faltante

**Tab 3 - Testing Session**

```
PASOS:
1. Abrir DevTools (F12) → Console
2. Login como usuario que NO tiene negocios asignados
   (o crear usuario nuevo sin negocios)
3. Intentar navegar a secciones que requieren businessId:
   - Servicios
   - Empleados
   - Configuración
4. VALIDAR:
   a. Console debe mostrar warning: "PermissionGate: businessId is required"
   b. Componentes deben manejar gracefully (no crash)
   c. Mensaje al usuario: "Selecciona un negocio primero" o similar

VALIDACIÓN:
✅ Warning en console (esperado)
✅ App no crashea
✅ Mensaje apropiado al usuario
✅ Puede crear negocio o seleccionar uno

SCREENSHOT: testing-evidence/screenshots/13-missing-businessid.png
```

**Status**: ⏳ PENDIENTE  
**Resultado**: _______________  
**Observaciones**: _______________

---

### Test 3.3: Múltiples Negocios - Cambio de Contexto

**Tab 1 - Owner Session**

```
PASOS:
1. Owner debe tener al menos 2 negocios
2. Si solo tiene 1: Crear segundo negocio "Test Business 2"
3. Dashboard → Dropdown header de negocios
4. Seleccionar Business 1
5. Ir a Servicios → Crear servicio "Servicio B1"
6. Cambiar a Business 2 en dropdown
7. Ir a Servicios
8. VALIDAR:
   a. "Servicio B1" NO debe aparecer (es de Business 1)
   b. Solo servicios de Business 2 visibles
9. Crear servicio "Servicio B2"
10. Cambiar a Business 1
11. VALIDAR:
    a. "Servicio B2" NO debe aparecer
    b. Solo servicios de Business 1 visibles
12. Ir a Permisos → Gestión de Usuarios
13. VALIDAR:
    a. Permisos mostrados son solo de Business 1
    b. No hay "bleeding" de permisos de Business 2

VALIDACIÓN:
✅ Datos correctamente aislados por negocio
✅ Servicios NO se mezclan entre negocios
✅ Permisos NO se mezclan entre negocios
✅ Cambio de contexto funciona correctamente
✅ businessId se actualiza en todas las queries

SCREENSHOT: testing-evidence/screenshots/14-multiple-business-isolation.png
```

**Status**: ⏳ PENDIENTE  
**Resultado**: _______________  
**Observaciones**: _______________

---

## 🐛 BUGS ENCONTRADOS

### Bug #1: [Título]
**Módulo**: _______________  
**Severidad**: Alta / Media / Baja  
**Descripción**: _______________  
**Pasos para Reproducir**:
1. _______________
2. _______________
3. _______________

**Comportamiento Esperado**: _______________  
**Comportamiento Actual**: _______________  
**Screenshot**: testing-evidence/bugs/bug-01-[descripcion].png  
**Console Errors**: 
```
[pegar errores aquí]
```

**Status**: ⏳ Pendiente Fix  
**Priority**: P0 / P1 / P2  

---

### Bug #2: [Título]
**Módulo**: _______________  
**Severidad**: Alta / Media / Baja  
**Descripción**: _______________  
**Pasos para Reproducir**:
1. _______________
2. _______________

**Comportamiento Esperado**: _______________  
**Comportamiento Actual**: _______________  
**Screenshot**: testing-evidence/bugs/bug-02-[descripcion].png  
**Console Errors**: 
```
[pegar errores aquí]
```

**Status**: ⏳ Pendiente Fix  
**Priority**: P0 / P1 / P2  

---

## 📊 MÉTRICAS DE TESTING

### Resumen de Ejecución

**Tests Ejecutados**: 0 / 14  
**Tests Exitosos**: 0  
**Tests Fallidos**: 0  
**Tests Bloqueados**: 0  
**Bugs Encontrados**: 0  

**Cobertura**:
- Fase 1 (Delegación): 0 / 6 tests (0%)
- Fase 2 (Módulos Críticos): 0 / 5 tests (0%)
- Fase 3 (Casos Edge): 0 / 3 tests (0%)

**Tiempo Total**: ___ horas ___ minutos

---

## 🎯 CRITERIOS DE APROBACIÓN

### Para Aprobar Fase 5 y Lanzar al Mercado

**CRÍTICOS (DEBEN PASAR 100%)**:
- [ ] Test 1.4: Owner delega permisos correctamente
- [ ] Test 1.5: Permisos asignados funcionan
- [ ] Test 1.6: Permisos NO asignados bloquean correctamente
- [ ] Test 2.1: BusinessRecurringExpenses funciona
- [ ] Test 2.2: EmployeeSalaryConfig funciona
- [ ] Test 3.1: Usuario sin permisos bloqueado

**IMPORTANTES (DEBEN PASAR 90%)**:
- [ ] Test 2.3: ServicesManager CRUD completo
- [ ] Test 2.4: AppointmentWizard funciona
- [ ] Test 2.5: AbsencesTab funciona
- [ ] Test 3.3: Múltiples negocios aislados correctamente

**OPCIONALES (DEBEN PASAR 75%)**:
- [ ] Test 3.2: businessId faltante manejado gracefully

### Decisión de Lanzamiento

**GO / NO-GO**: _______________

**Justificación**: _______________

**Acciones Pendientes antes de Lanzar**:
1. _______________
2. _______________
3. _______________

---

## 📝 NOTAS DEL TESTER

**Observaciones Generales**:
_______________

**Performance**:
_______________

**UX Issues (No Bloqueantes)**:
_______________

**Recomendaciones Post-Lanzamiento**:
_______________

---

## ✅ CONCLUSIÓN

**Status Final**: ⏳ EN PROGRESO

**Próximos Pasos**:
1. Ejecutar tests según instrucciones
2. Documentar resultados en cada sección
3. Capturar screenshots de evidencia
4. Documentar bugs encontrados
5. Tomar decisión GO/NO-GO

---

**Última Actualización**: 16 Nov 2025 19:50 COT  
**Tester**: Manual Execution Required (Chrome MCP Limited)  
**Status**: ⏳ PENDIENTE EJECUCIÓN MANUAL

