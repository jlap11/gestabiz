# Plan de Testing con Data Real - Gestabiz
## 16 de Noviembre de 2025

**Estado**: ✅ LISTO PARA EJECUTAR  
**Data Verificada**: ✅ 100% en Supabase  
**Usuario Principal**: `jlap-04@hotmail.com` (5 negocios completos)

---

## 🎯 OBJETIVO

Ejecutar **14 tests exhaustivos** usando data REAL de la base de datos para validar:
1. Sistema de Permisos Granulares (Fase 5)
2. Módulos críticos con PermissionGate
3. Casos edge de validación

---

## 🔑 CREDENCIALES PARA TESTING

### **Contraseña Universal**: `TestPassword123!`

| Rol | Email | Negocios | Uso |
|-----|-------|----------|-----|
| **OWNER** ⭐ | `jlap-04@hotmail.com` | 5 completos | Usuario PRINCIPAL para testing |
| **EMPLOYEE** | `empleado1@gestabiz.test` | 6 vinculados | Pruebas de permisos delegados |
| **EMPLOYEE** | `empleado12@gestabiz.test` | 1 vinculado | Pruebas mono-negocio |
| **CLIENT** | `cliente1@gestabiz.test` | 2 citas | Pruebas de cliente |

---

## 📋 DATA REAL PARA CADA TEST

### **FASE 1: DELEGACIÓN DE PERMISOS** (6 Tests) ⭐ CRÍTICO

---

#### **Test 1.1: Owner - Crear/Verificar Negocio**

**Usuario**: `jlap-04@hotmail.com`  
**Negocio a Usar**: **English Academy Pro**

**Data Real**:
```
Business ID: 1983339a-40f8-43bf-8452-1f23585a433a
Nombre: English Academy Pro
Categoría: Education
Sedes: 2
  - Sede Centro (Barranquilla)
  - Sede Riomar (Barranquilla)
Servicios: 5
  - Beginner Level (150,000 COP - 60 min)
  - Intermediate Level (170,000 COP - 60 min)
  - Advanced Level (190,000 COP - 60 min)
  - IELTS Preparation (250,000 COP - 90 min)
  - Conversation Club (80,000 COP - 45 min)
Empleados: 4
  - empleado1@gestabiz.test
  - empleado10@gestabiz.test
  - empleado11@gestabiz.test
  - jlap-04@hotmail.com (manager)
```

**Pasos**:
1. Login como `jlap-04@hotmail.com`
2. Cambiar rol a **Administrador**
3. Verificar aparece "English Academy Pro" en dropdown
4. Seleccionar negocio
5. Dashboard debe mostrar:
   - 2 sedes
   - 5 servicios
   - 4 empleados
   - 2 citas confirmadas

**Resultado Esperado**:
- ✅ Negocio visible en dropdown
- ✅ Stats correctos (2/5/4)
- ✅ Puede navegar a todos los módulos (owner = todos los permisos)

---

#### **Test 1.2: Owner - Agregar Empleado**

**Usuario**: `jlap-04@hotmail.com`  
**Negocio**: English Academy Pro  
**Empleado a Agregar**: `empleado12@gestabiz.test`

**Data Actual**:
```
empleado12@gestabiz.test:
  - Actualmente en: Yoga Shanti (1 negocio)
  - Total negocios: 1
  - Rol: Employee
```

**Pasos**:
1. En English Academy Pro → Empleados
2. Clic "Agregar Empleado"
3. Buscar `empleado12@gestabiz.test`
4. Seleccionar rol: "Instructor" (employee)
5. Asignar servicios:
   - Beginner Level
   - Intermediate Level
6. Guardar

**Data Esperada Post-Test**:
```
empleado12@gestabiz.test:
  - Negocios: 2 (Yoga Shanti + English Academy)
  - Servicios asignados: 2 (Beginner, Intermediate)
  - Rol en English Academy: employee
```

**Validaciones**:
- ✅ Empleado aparece en lista de empleados
- ✅ Puede ver "Beginner" y "Intermediate" en sus servicios
- ✅ Tiene entrada en `business_employees`
- ✅ Tiene entradas en `employee_services`

---

#### **Test 1.3: Employee - Solicitar Unirse**

**Usuario**: `empleado10@gestabiz.test`  
**Negocio Destino**: **Sonrisas Dental** (jlap.11@hotmail.com)

**Data Actual**:
```
empleado10@gestabiz.test:
  - Negocios: 4 (Centro Deportivo, English Academy, FitZone, Spa Zen)
  - NO está en Sonrisas Dental

Sonrisas Dental:
  - Owner: jlap.11@hotmail.com
  - Empleados: 3 (empleado1, empleado11, owner)
  - Servicios: 5
```

**Pasos**:
1. Login como `empleado10@gestabiz.test`
2. Cambiar rol a **Empleado**
3. Dashboard → "Unirse a Negocio"
4. Buscar "Sonrisas Dental"
5. Seleccionar rol deseado: "Odontólogo" (employee)
6. Enviar solicitud

**Validaciones**:
- ✅ Solicitud creada en `employee_requests`
- ✅ Owner (jlap.11@hotmail.com) recibe notificación in-app
- ✅ Status inicial: "pending"

---

#### **Test 1.4: Owner - Delegar Permisos Específicos** ⭐ CRÍTICO

**Usuario**: `jlap-04@hotmail.com`  
**Negocio**: English Academy Pro  
**Empleado**: `empleado1@gestabiz.test`

**Permisos a Asignar** (8 permisos críticos):
```
1. services.create         ✅ Puede crear servicios
2. services.edit           ✅ Puede editar servicios
3. appointments.create     ✅ Puede crear citas
4. appointments.edit       ✅ Puede editar citas
5. locations.view          ✅ Puede ver sedes
6. employees.view          ✅ Puede ver empleados
7. accounting.view_reports ❌ NO puede ver reportes contables
8. expenses.create         ❌ NO puede crear gastos
```

**Pasos**:
1. Login como `jlap-04@hotmail.com` (English Academy)
2. Configuraciones → Permisos
3. Buscar `empleado1@gestabiz.test`
4. Asignar los 6 permisos ✅
5. NO asignar los 2 permisos ❌
6. Guardar cambios

**Data Esperada en BD**:
```sql
-- 6 permisos en user_permissions
SELECT * FROM user_permissions
WHERE business_id = '1983339a-40f8-43bf-8452-1f23585a433a'
  AND user_id = '5ddc3251-1e22-4b86-9bf8-15452f9ec95b'
  AND is_active = true;

-- Debe retornar 6 registros
```

**Validaciones**:
- ✅ 6 permisos insertados en BD
- ✅ Toast de confirmación
- ✅ Empleado ve cambios inmediatamente

---

#### **Test 1.5: Employee - Verificar Permisos Funcionan** ⭐ CRÍTICO

**Usuario**: `empleado1@gestabiz.test`  
**Negocio**: English Academy Pro  
**Permisos Asignados**: 6 (del Test 1.4)

**Pasos**:
1. Login como `empleado1@gestabiz.test`
2. Cambiar rol a **Empleado**
3. Seleccionar English Academy Pro

**Tests de Permisos PERMITIDOS** (6):

**1. services.create**:
```
- Ir a: Servicios
- Clic: "Crear Servicio"
- ✅ Botón visible y habilitado
- Crear servicio: "TOEFL Preparation" (300k COP, 90 min)
- ✅ Servicio creado exitosamente
```

**2. services.edit**:
```
- Seleccionar: "Beginner Level"
- Clic: "Editar" (ícono lápiz)
- ✅ Botón visible y habilitado
- Cambiar precio: 150k → 160k
- ✅ Cambio guardado
```

**3. appointments.create**:
```
- Ir a: Citas
- Clic: "Nueva Cita"
- ✅ Wizard abre correctamente
- Crear cita para cliente1@gestabiz.test
- ✅ Cita creada
```

**4. appointments.edit**:
```
- Seleccionar cita existente
- Clic: "Editar"
- ✅ Modal abre
- Cambiar fecha: 19 Nov → 20 Nov
- ✅ Cambio guardado
```

**5. locations.view**:
```
- Ir a: Sedes
- ✅ Ve "Sede Centro" y "Sede Riomar"
- ✅ Puede ver detalles (dirección, horarios)
```

**6. employees.view**:
```
- Ir a: Empleados
- ✅ Ve lista de 4 empleados
- ✅ Puede ver detalles (servicios, horarios)
```

**Validaciones**:
- ✅ Todos los botones visibles y habilitados
- ✅ Acciones se ejecutan correctamente
- ✅ No hay errores en console

---

#### **Test 1.6: Employee - Verificar Permisos Bloquean** ⭐ CRÍTICO

**Usuario**: `empleado1@gestabiz.test`  
**Negocio**: English Academy Pro  
**Permisos NO Asignados**: 2

**Tests de Permisos BLOQUEADOS** (2):

**1. accounting.view_reports**:
```
- Ir a: Reportes
- ✅ Botón "Ver Reportes" NO visible (mode=hide)
- Intentar navegar directo: /app/admin/reports
- ✅ Redirect a dashboard con mensaje de error
```

**2. expenses.create**:
```
- Ir a: Contabilidad → Gastos
- ✅ Botón "Crear Gasto" deshabilitado (mode=disable, gris)
- Hover sobre botón
- ✅ Tooltip: "No tienes permisos para esta acción"
```

**Validaciones**:
- ✅ Botones bloqueados según modo (hide vs disable)
- ✅ Tooltips informativos
- ✅ Redirección automática en rutas protegidas
- ✅ Mensajes de error claros

---

### **FASE 2: MÓDULOS CRÍTICOS** (5 Tests)

---

#### **Test 2.1: BusinessRecurringExpenses** ⭐ NEW

**Usuario**: `jlap-04@hotmail.com`  
**Negocio**: English Academy Pro  
**Permiso Requerido**: `expenses.create`

**Data a Crear**:
```
Gasto Recurrente:
- Nombre: "Arriendo Sede Centro"
- Categoría: rent
- Monto: 2,500,000 COP
- Frecuencia: monthly
- Día de Cobro: 1 (cada mes día 1)
- Sede: Sede Centro
- Estado: active
```

**Pasos**:
1. Login como `jlap-04@hotmail.com`
2. Contabilidad → Gastos Recurrentes
3. ✅ Verificar botón "Crear Gasto" VISIBLE (owner tiene todos los permisos)
4. Clic "Crear Gasto"
5. Llenar formulario con data arriba
6. Guardar

**Validaciones**:
- ✅ Gasto creado en `business_recurring_expenses`
- ✅ Aparece en lista de gastos recurrentes
- ✅ Badge "Mensual" y "Activo"
- ✅ Monto formateado: "COP $2,500,000"

**Test Permisos**:
```
- Login como empleado1@gestabiz.test (sin expenses.create)
- Ir a Gastos Recurrentes
- ✅ Botón "Crear Gasto" DESHABILITADO (gris)
- ✅ Lista de gastos visible (solo lectura)
```

---

#### **Test 2.2: EmployeeSalaryConfig** ⭐ NEW

**Usuario**: `jlap-04@hotmail.com`  
**Negocio**: English Academy Pro  
**Empleado**: `empleado1@gestabiz.test`  
**Permiso Requerido**: `employees.edit_salary`

**Data a Configurar**:
```
Configuración de Salario:
- Empleado: empleado1@gestabiz.test
- Salario Base: 3,500,000 COP
- Tipo: monthly
- Comisión: 15% (por venta de curso)
- Fecha Inicio: 01/11/2025
```

**Pasos**:
1. Login como `jlap-04@hotmail.com`
2. Empleados → empleado1@gestabiz.test
3. Tab "Salario"
4. ✅ Verificar campos editables (owner)
5. Configurar salario según data arriba
6. Guardar

**Validaciones**:
- ✅ Salario guardado en `business_employees.hourly_rate` (convertido a mensual)
- ✅ Comisión guardada en campo separado
- ✅ Toast de confirmación
- ✅ Datos visibles en vista de empleado

**Test Permisos**:
```
- Login como empleado10@gestabiz.test (sin employees.edit_salary)
- Ir a su propio perfil → Tab Salario
- ✅ Campos BLOQUEADOS (solo lectura)
- ✅ Puede VER su salario, NO editarlo
```

---

#### **Test 2.3: ServicesManager - CRUD Completo**

**Usuario**: `jlap-04@hotmail.com`  
**Negocio**: English Academy Pro  
**Permisos**: `services.create`, `services.edit`, `services.delete`

**CREATE**:
```
Servicio Nuevo:
- Nombre: "Spanish for Beginners"
- Descripción: "Español básico para extranjeros"
- Duración: 60 minutos
- Precio: 120,000 COP
- Categoría: language
- Sede: Ambas (Centro + Riomar)
```

**Pasos CREATE**:
1. Servicios → "Crear Servicio"
2. ✅ Botón visible (owner)
3. Llenar formulario
4. Asignar 2 empleados: empleado1, empleado10
5. Guardar

**READ**:
```
- Ver lista de servicios
- ✅ 6 servicios visibles (5 existentes + 1 nuevo)
- ✅ Filtros funcionales (por categoría, sede)
- ✅ Búsqueda por nombre
```

**UPDATE**:
```
- Seleccionar "Spanish for Beginners"
- Editar precio: 120k → 140k
- Agregar empleado: empleado11
- ✅ Cambios guardados
```

**DELETE (Soft)**:
```
- Seleccionar "Spanish for Beginners"
- Clic "Eliminar"
- Confirmación modal
- ✅ Servicio marcado is_active = false
- ✅ No aparece en lista activa
- ✅ Sigue en BD (soft delete)
```

**Test Permisos**:
```
- Login como empleado12@gestabiz.test (sin servicios.delete)
- Ir a Servicios
- ✅ Botón "Eliminar" NO VISIBLE (mode=hide)
```

---

#### **Test 2.4: AppointmentWizard - 6 Pasos Completo**

**Usuario**: `cliente1@gestabiz.test`  
**Negocio**: English Academy Pro  
**Permiso**: `appointments.create` (todos los clientes lo tienen)

**Data de Cita**:
```
Negocio: English Academy Pro
Servicio: Beginner Level (150k COP, 60 min)
Sede: Sede Centro
Empleado: empleado1@gestabiz.test
Fecha: 25 de Noviembre 2025
Hora: 10:00 AM
Cliente: cliente1@gestabiz.test
```

**6 Pasos del Wizard**:

**Paso 1: Seleccionar Negocio**
```
- Ver lista de negocios disponibles
- Buscar "English Academy"
- ✅ Aparece con 5 servicios, 4.5★ rating
- Seleccionar
```

**Paso 2: Seleccionar Servicio**
```
- Ver 6 servicios (incluye el nuevo Spanish)
- Seleccionar "Beginner Level"
- ✅ Muestra: 150k COP, 60 min, descripción
```

**Paso 3: Seleccionar Sede**
```
- Ver 2 sedes: Centro, Riomar
- Seleccionar "Sede Centro"
- ✅ Muestra horario: 08:00 - 18:00
```

**Paso 4: Seleccionar Empleado**
```
- Ver empleados que ofrecen "Beginner"
- ✅ 3 empleados: empleado1, empleado10, empleado11
- Seleccionar empleado1
- ✅ Muestra: foto, nombre, rating
```

**Paso 5: Seleccionar Fecha y Hora**
```
- Calendario muestra Nov 2025
- Seleccionar 25 de Noviembre (lunes)
- ✅ Slots disponibles: 08:00, 09:00, 10:00, ..., 17:00
- ✅ Slots BLOQUEADOS:
  - 12:00-13:00 (almuerzo empleado1)
  - Citas ya ocupadas
- Seleccionar 10:00 AM
```

**Paso 6: Confirmar Cita**
```
Resumen:
- Negocio: English Academy Pro
- Servicio: Beginner Level (150k COP)
- Sede: Sede Centro
- Empleado: empleado1
- Fecha: Lun 25 Nov 2025, 10:00 AM
- Duración: 60 minutos
- Total: COP $150,000

✅ Botón "Confirmar Cita" visible
✅ Clic confirmar
```

**Validaciones Post-Creación**:
- ✅ Cita creada en BD con status "pending"
- ✅ Notificación in-app a empleado1
- ✅ Email a cliente1 (confirmación)
- ✅ Aparece en calendario de empleado1
- ✅ Slot 10:00 AM bloqueado para otras citas

---

#### **Test 2.5: AbsencesTab - Aprobar/Rechazar**

**Usuario Owner**: `jlap-04@hotmail.com`  
**Usuario Employee**: `empleado1@gestabiz.test`  
**Negocio**: English Academy Pro  
**Permisos**: `absences.approve` (owner), `absences.request` (employee)

**PARTE 1: Empleado Solicita Ausencia**

**Data de Ausencia**:
```
Tipo: vacation (vacaciones)
Fecha Inicio: 20 de Noviembre 2025
Fecha Fin: 22 de Noviembre 2025
Días Solicitados: 3
Razón: "Viaje familiar programado"
```

**Pasos (Empleado)**:
1. Login como `empleado1@gestabiz.test`
2. Dashboard → Widget "Días de Vacaciones"
3. Clic "Solicitar Ausencia"
4. Llenar modal:
   - Tipo: Vacaciones
   - Rango: 20-22 Nov
   - Razón: "Viaje familiar"
5. ✅ Calendarios muestran range highlighting (20, 21, 22 marcados)
6. Enviar solicitud

**Validaciones (Empleado)**:
- ✅ Solicitud creada en `employee_absences` (status: pending)
- ✅ Request creado en `absence_approval_requests`
- ✅ Toast: "Solicitud enviada"
- ✅ Widget muestra: "3 días pendientes de aprobación"

**PARTE 2: Owner Recibe Notificación**

**Pasos (Owner)**:
1. Ya logueado como `jlap-04@hotmail.com`
2. ✅ Notificación in-app aparece (ícono campana)
3. ✅ Email recibido: "empleado1 solicita ausencia"
4. Clic notificación → redirect a AbsencesTab

**PARTE 3: Owner Aprueba**

**Pasos (Owner)**:
1. En AbsencesTab → "Pendientes" (1 solicitud)
2. Ver card de solicitud:
   ```
   empleado1@gestabiz.test
   Vacaciones: 20-22 Nov (3 días)
   Razón: "Viaje familiar programado"
   ```
3. ✅ Botones visibles: "Aprobar" (verde), "Rechazar" (rojo)
4. Clic "Aprobar"
5. Confirmar en modal

**Validaciones (Aprobación)**:
- ✅ Status cambia a "approved" en BD
- ✅ `vacation_balance` actualizado: -3 días
- ✅ Notificación a empleado1: "Ausencia aprobada"
- ✅ Slots 20-22 Nov bloqueados en calendario
- ✅ Card se mueve a tab "Historial"

**PARTE 4: Test Rechazo (Opcional)**

**Crear nueva solicitud**:
```
Tipo: emergency (emergencia)
Fecha: 18 Nov
Razón: "Urgencia médica"
```

**Pasos (Owner)**:
1. Ver solicitud de emergencia
2. Clic "Rechazar"
3. Ingresar razón: "Día con 5 citas programadas"
4. Confirmar

**Validaciones (Rechazo)**:
- ✅ Status: "rejected"
- ✅ Razón guardada en BD
- ✅ Notificación a empleado1 con razón de rechazo
- ✅ Días NO descontados de balance

---

### **FASE 3: CASOS EDGE** (3 Tests)

---

#### **Test 3.1: Usuario Sin Permisos - Intento de Acceso**

**Usuario**: `empleado12@gestabiz.test`  
**Negocio**: Yoga Shanti  
**Permisos**: NINGUNO (solo permisos básicos de empleado)

**Intentos de Acceso**:

**1. Crear Servicio**:
```
- Ir a: Servicios
- ✅ Botón "Crear Servicio" NO VISIBLE (mode=hide)
- Intentar URL directa: /app/admin/services/new
- ✅ Redirect a /app/employee/dashboard
- ✅ Toast: "No tienes permisos para esta acción"
```

**2. Editar Negocio**:
```
- Ir a: Configuraciones → Negocio
- ✅ Campos BLOQUEADOS (solo lectura)
- ✅ Botón "Guardar" DESHABILITADO (gris)
- ✅ Tooltip: "Solo el owner puede editar"
```

**3. Ver Reportes Financieros**:
```
- Ir a: Reportes
- ✅ Tab "Reportes" NO VISIBLE
- Intentar URL: /app/admin/reports
- ✅ Redirect a dashboard
- ✅ Toast error
```

**Validaciones**:
- ✅ TODOS los intentos bloqueados
- ✅ Mensajes claros y amigables
- ✅ Sin errores en console
- ✅ Redirección automática a rutas permitidas

---

#### **Test 3.2: businessId Faltante - Manejo de Errores**

**Usuario**: `jlap-04@hotmail.com` (logout y login limpio)

**Escenario**: Usuario recién logueado, sin negocio seleccionado

**Pasos**:
1. Login como `jlap-04@hotmail.com`
2. Cambiar rol a Administrador
3. Dashboard carga SIN negocio seleccionado
4. Intentar acciones sin businessId:

**Test 1: Crear Servicio**:
```
- Clic "Crear Servicio"
- ✅ Modal muestra: "Selecciona un negocio primero"
- ✅ Dropdown de negocios resaltado
- ✅ No se abre formulario
```

**Test 2: Ver Empleados**:
```
- Ir a: Empleados
- ✅ Lista vacía con mensaje:
  "Selecciona un negocio para ver empleados"
- ✅ Botón "Seleccionar Negocio" visible
```

**Test 3: Ver Reportes**:
```
- Ir a: Reportes
- ✅ Dashboard vacío
- ✅ Mensaje: "Selecciona un negocio"
- ✅ Filtro de negocios destacado
```

**Validaciones**:
- ✅ NO crashes ni errores 500
- ✅ Mensajes informativos
- ✅ Redirección a selección de negocio
- ✅ Console sin errores críticos

---

#### **Test 3.3: Múltiples Negocios - Cambio de Contexto**

**Usuario**: `jlap-04@hotmail.com` (5 negocios)

**Escenario**: Cambiar entre negocios y verificar contexto

**Test de Cambio**:

**1. Negocio A → B**:
```
- Seleccionar "English Academy Pro"
- Verificar stats: 2 sedes, 5 servicios, 4 empleados
- Cambiar a "FitZone Gym"
- ✅ Stats actualizan: 2 sedes, 5 servicios, 6 empleados
- ✅ Lista de empleados cambia
- ✅ Servicios diferentes
```

**2. Permisos por Negocio**:
```
- En English Academy: empleado1 tiene 6 permisos
- Cambiar a FitZone Gym
- ✅ empleado1 puede tener DIFERENTES permisos
- ✅ PermissionGate evalúa por negocio actual
```

**3. Datos Aislados**:
```
- Crear servicio en English Academy: "Test Service A"
- Cambiar a FitZone Gym
- ✅ "Test Service A" NO aparece en FitZone
- ✅ Cada negocio tiene sus propios datos
```

**4. Navegación**:
```
- URL contiene businessId: ?businessId=1983339a...
- Cambiar negocio
- ✅ URL actualiza con nuevo businessId
- ✅ Recarga de página mantiene negocio seleccionado
- ✅ localStorage tiene "selectedBusinessId"
```

**Validaciones**:
- ✅ Contexto se mantiene consistente
- ✅ Datos NO se mezclan entre negocios
- ✅ Permisos evaluados por negocio
- ✅ URL sincronizada con estado
- ✅ Persistencia en localStorage

---

## 📊 RESUMEN DE EJECUCIÓN

### Tests por Prioridad:

**CRÍTICOS** (6):
- Test 1.4: Delegar Permisos ⭐⭐⭐
- Test 1.5: Permisos Funcionan ⭐⭐⭐
- Test 1.6: Permisos Bloquean ⭐⭐⭐
- Test 2.1: BusinessRecurringExpenses ⭐⭐
- Test 2.2: EmployeeSalaryConfig ⭐⭐
- Test 2.4: AppointmentWizard ⭐⭐

**ALTOS** (5):
- Test 1.1: Verificar Negocio ⭐⭐
- Test 1.2: Agregar Empleado ⭐⭐
- Test 2.3: ServicesManager CRUD ⭐⭐
- Test 2.5: AbsencesTab ⭐⭐
- Test 3.3: Múltiples Negocios ⭐⭐

**MEDIOS** (3):
- Test 1.3: Solicitar Unirse ⭐
- Test 3.1: Usuario Sin Permisos ⭐
- Test 3.2: businessId Faltante ⭐

---

## 🎯 ORDEN DE EJECUCIÓN RECOMENDADO

### **Sesión 1: Setup + Permisos Básicos** (40 min)
1. Test 1.1: Verificar Negocio (5 min)
2. Test 1.2: Agregar Empleado (5 min)
3. Test 1.4: Delegar Permisos ⭐ (10 min)
4. Test 1.5: Permisos Funcionan ⭐ (15 min)
5. Test 1.6: Permisos Bloquean ⭐ (5 min)

### **Sesión 2: Módulos Nuevos** (30 min)
6. Test 2.1: BusinessRecurringExpenses ⭐ (10 min)
7. Test 2.2: EmployeeSalaryConfig ⭐ (10 min)
8. Test 2.3: ServicesManager CRUD (10 min)

### **Sesión 3: Flujos Complejos** (25 min)
9. Test 2.4: AppointmentWizard ⭐ (15 min)
10. Test 2.5: AbsencesTab (10 min)

### **Sesión 4: Edge Cases** (15 min)
11. Test 3.1: Usuario Sin Permisos (5 min)
12. Test 3.2: businessId Faltante (5 min)
13. Test 3.3: Múltiples Negocios (5 min)

### **Sesión 5: Empleado** (10 min)
14. Test 1.3: Solicitar Unirse (10 min)

**TOTAL**: ~120 minutos (2 horas)

---

## 📝 PLANTILLA DE REPORTE POR TEST

```markdown
### Test X.X: [NOMBRE]

**Ejecutado**: [Fecha/Hora]  
**Ejecutor**: [Usuario]  
**Duración**: [min]

**Resultado**: ✅ PASS / ❌ FAIL

**Evidencia**:
- Screenshot 1: [Descripción]
- Screenshot 2: [Descripción]
- Console Log: [Adjunto]

**Hallazgos**:
- [Lista de issues encontrados]

**Performance**:
- Requests: [cantidad]
- Load Time: [segundos]
- Errores: [cantidad]

**Notas**:
- [Observaciones adicionales]
```

---

## ✅ CHECKLIST FINAL

Antes de comenzar, verificar:

- [ ] 3 puertos activos (5173, 5174, 5175)
- [ ] Chrome DevTools MCP activado
- [ ] Contraseña `TestPassword123!` funcionando
- [ ] Usuario `jlap-04@hotmail.com` accesible
- [ ] Negocio "English Academy Pro" visible
- [ ] Data de test visible en BD (5 servicios, 4 empleados)
- [ ] Documentos de tracking listos:
  - [ ] PERFORMANCE_METRICS_16NOV.md
  - [ ] REPORTE_TESTING_REAL_16NOV.md
- [ ] Supabase MCP activado (para verificar BD)

---

**LISTO PARA EJECUTAR** ✅

**Próximo Paso**: Comenzar con Test 1.1 (Verificar Negocio)
