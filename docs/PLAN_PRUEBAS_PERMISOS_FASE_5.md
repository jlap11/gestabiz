# Plan de Pruebas Exhaustivo - Sistema de Permisos Fase 5

## 📊 Información General

**Fecha**: 16 de Noviembre 2025  
**Alcance**: 100% de funcionalidades protegidas con PermissionGate  
**Módulos a probar**: 25 (Admin: 18, Employee: 3, Client: 4)  
**Método**: Testing automatizado con Chrome DevTools MCP  
**Usuarios de prueba**: admin@gestabiz.com, demo@gestabiz.com

---

## 🎯 Objetivos de las Pruebas

1. **Verificar PermissionGate funciona correctamente**:
   - Mode "hide": Elemento NO visible sin permiso
   - Mode "disable": Elemento visible pero deshabilitado sin permiso
   - Mode "show": Muestra fallback sin permiso

2. **Validar permisos por negocio**:
   - Usuario con permisos en negocio A puede realizar acciones
   - Usuario sin permisos en negocio B NO puede realizar acciones
   - Permisos son independientes entre negocios

3. **Probar casos edge**:
   - businessId faltante
   - Usuario sin ningún permiso
   - Usuario con permisos parciales

---

## 👥 Usuarios de Prueba

### Usuario 1: Admin User
- **Email**: admin@gestabiz.com
- **ID**: 11111111-1111-1111-1111-111111111111
- **Rol esperado**: Admin (owner de negocios)
- **Permisos**: Completos en sus negocios

### Usuario 2: Demo User  
- **Email**: demo@gestabiz.com
- **ID**: 22222222-2222-2222-2222-222222222222
- **Rol esperado**: Client/Employee según negocio
- **Permisos**: Limitados según configuración

---

## 📋 PLAN DE PRUEBAS DETALLADO

### FASE 1: Preparación del Ambiente ✅

**Objetivo**: Verificar que la aplicación está corriendo y accesible

**Pasos**:
1. ✅ Abrir navegador Chrome
2. ✅ Navegar a http://localhost:5173
3. ✅ Verificar que la landing page carga correctamente
4. ✅ Tomar snapshot inicial

**Criterios de Éxito**:
- Landing page visible
- Sin errores en consola
- Botones Login/Registro visibles

---

### FASE 2: Login y Verificación de Roles ✅

**Objetivo**: Autenticar usuarios y verificar cálculo de roles

#### Test 2.1: Login como Admin User
**Pasos**:
1. Click en botón "Login"
2. Ingresar email: admin@gestabiz.com
3. Ingresar contraseña
4. Click en "Iniciar Sesión"
5. Verificar redirección a dashboard
6. Tomar snapshot del dashboard

**Validaciones**:
- Login exitoso
- Rol "admin" visible en UI
- Dashboard con opciones de administrador

#### Test 2.2: Verificar Negocios del Admin
**Pasos**:
1. Abrir dropdown de negocios en header
2. Verificar lista de negocios del admin
3. Tomar snapshot de dropdown

**Validaciones**:
- Al menos 1 negocio visible
- Opción "Crear Nuevo Negocio" visible

---

### FASE 3: Testing de Módulos Admin (18 módulos)

#### Test 3.1: ServicesManager (services.*)
**Permisos a probar**: create, edit, delete

**Pasos**:
1. Navegar a "Servicios"
2. Verificar botón "Agregar Servicio" visible
3. Click en "Agregar Servicio"
4. Completar formulario de servicio
5. Guardar servicio
6. Verificar botón "Editar" visible en card
7. Click en "Editar"
8. Modificar datos
9. Guardar cambios
10. Verificar botón "Eliminar" visible
11. Click en "Eliminar"
12. Confirmar eliminación

**Validaciones**:
- ✅ Botón "Agregar Servicio" visible (services.create)
- ✅ Formulario funciona correctamente
- ✅ Botón "Editar" visible en cada servicio (services.edit)
- ✅ Botón "Eliminar" visible en cada servicio (services.delete)
- ✅ Todas las acciones ejecutan correctamente

**Evidencia**: Screenshots de cada paso

---

#### Test 3.2: ResourcesManager (resources.*)
**Permisos a probar**: create, edit, delete

**Pasos**:
1. Navegar a "Recursos"
2. Verificar botón "Agregar Recurso" visible
3. Click en "Agregar Recurso"
4. Completar formulario de recurso
5. Guardar recurso
6. Verificar botones edit/delete visibles
7. Probar edición
8. Probar eliminación

**Validaciones**:
- ✅ Botón "Agregar Recurso" visible (resources.create)
- ✅ Botón "Editar" visible (resources.edit)
- ✅ Botón "Eliminar" visible (resources.delete)

---

#### Test 3.3: LocationsManager (locations.*)
**Permisos a probar**: create, edit, delete

**Pasos**:
1. Navegar a "Ubicaciones"
2. Verificar botón "Nueva Ubicación" visible
3. Click en "Nueva Ubicación"
4. Completar formulario
5. Guardar ubicación
6. Verificar botones edit/delete
7. Probar edición
8. Probar eliminación

**Validaciones**:
- ✅ Botón "Nueva Ubicación" visible (locations.create)
- ✅ Botón "Editar" visible (locations.edit)
- ✅ Botón "Eliminar" visible (locations.delete)

---

#### Test 3.4: EmployeesManager (employees.*)
**Permisos a probar**: create, edit, delete, approve, reject

**Pasos**:
1. Navegar a "Empleados"
2. Verificar botón "Agregar Empleado" visible
3. Verificar tab "Solicitudes Pendientes"
4. Verificar botones "Aprobar" y "Rechazar" en solicitudes
5. Probar creación de empleado
6. Probar edición de empleado
7. Probar eliminación de empleado

**Validaciones**:
- ✅ Botón "Agregar Empleado" visible (employees.create)
- ✅ Botón "Editar" visible (employees.edit)
- ✅ Botón "Eliminar" visible (employees.delete)
- ✅ Botón "Aprobar" visible (employees.approve)
- ✅ Botón "Rechazar" visible (employees.reject)

---

#### Test 3.5: RecruitmentDashboard (recruitment.*)
**Permisos a probar**: create_vacancy, edit_vacancy, delete_vacancy, manage_applications

**Pasos**:
1. Navegar a "Reclutamiento"
2. Verificar botón "Nueva Vacante" visible
3. Click en "Nueva Vacante"
4. Completar formulario de vacante
5. Publicar vacante
6. Verificar botones edit/delete en vacante
7. Verificar botones de gestión de aplicaciones

**Validaciones**:
- ✅ Botón "Nueva Vacante" visible (recruitment.create_vacancy)
- ✅ Botón "Editar" visible (recruitment.edit_vacancy)
- ✅ Botón "Eliminar" visible (recruitment.delete_vacancy)
- ✅ Botones gestión aplicaciones visibles (recruitment.manage_applications)

---

#### Test 3.6: ExpensesManagementPage (accounting.create)
**Permisos a probar**: create

**Pasos**:
1. Navegar a "Contabilidad"
2. Verificar botón "Nuevo Egreso" visible
3. Click en "Nuevo Egreso"
4. Completar formulario
5. Guardar egreso

**Validaciones**:
- ✅ Botón "Nuevo Egreso" visible (accounting.create)
- ✅ Formulario funciona

---

#### Test 3.7: BusinessRecurringExpenses (expenses.*)
**Permisos a probar**: create, delete

**Pasos**:
1. Navegar a "Configuración" → "Gastos Recurrentes"
2. Verificar botón "Agregar Egreso Recurrente" visible
3. Click en botón
4. Completar formulario
5. Guardar
6. Verificar botón "Eliminar" en cada gasto
7. Probar eliminación

**Validaciones**:
- ✅ Botón "Agregar" visible (expenses.create)
- ✅ Botón "Eliminar" visible en cada gasto (expenses.delete)

---

#### Test 3.8: EmployeeSalaryConfig (employees.edit_salary)
**Permisos a probar**: edit_salary

**Pasos**:
1. Navegar a "Empleados" → Seleccionar empleado
2. Abrir configuración de salario
3. Verificar botón "Guardar Configuración de Salario" visible
4. Modificar salario
5. Click en guardar
6. Verificar guardado exitoso

**Validaciones**:
- ✅ Botón "Guardar" visible pero puede estar deshabilitado (employees.edit_salary)
- ✅ Click ejecuta acción si tiene permiso

---

#### Test 3.9: ReviewCard (reviews.moderate)
**Permisos a probar**: moderate

**Pasos**:
1. Navegar a perfil de negocio
2. Ir a tab "Reseñas"
3. Verificar botones de moderación visibles
4. Probar ocultar/mostrar review
5. Probar eliminar review
6. Probar responder review

**Validaciones**:
- ✅ Botón "Ocultar/Mostrar" visible (reviews.moderate)
- ✅ Botón "Eliminar" visible (reviews.moderate)
- ✅ Botón "Responder" visible (reviews.moderate)

---

#### Test 3.10: BusinessSettings (settings.edit)
**Permisos a probar**: edit

**Pasos**:
1. Navegar a "Configuración del Negocio"
2. Verificar botón "Guardar Cambios" visible
3. Modificar algún campo
4. Click en "Guardar Cambios"
5. Verificar guardado exitoso

**Validaciones**:
- ✅ Botón "Guardar" puede estar deshabilitado (settings.edit)
- ✅ Click ejecuta si tiene permiso

---

#### Test 3.11: CompleteUnifiedSettings Admin (settings.edit_business)
**Permisos a probar**: edit_business

**Pasos**:
1. Navegar a "Configuración" (unified)
2. Ir a tab "Preferencias del Negocio"
3. Verificar botón "Guardar" visible
4. Modificar información del negocio
5. Click en "Guardar"

**Validaciones**:
- ✅ Botón "Guardar" puede estar deshabilitado (settings.edit_business)
- ✅ Funciona si tiene permiso

---

#### Test 3.12: BusinessNotificationSettings (notifications.manage)
**Permisos a probar**: manage

**Pasos**:
1. Navegar a "Configuración" → "Notificaciones"
2. Verificar botón "Guardar" visible
3. Modificar configuración de notificaciones
4. Click en "Guardar"

**Validaciones**:
- ✅ Botón "Guardar" puede estar deshabilitado (notifications.manage)

---

#### Test 3.13: BillingDashboard (billing.manage)
**Permisos a probar**: manage

**Pasos**:
1. Navegar a "Facturación"
2. Verificar botón "Actualizar Plan" visible
3. Verificar botón "Cancelar Suscripción" visible
4. Click en "Actualizar Plan"
5. Verificar modal/página de planes

**Validaciones**:
- ✅ Botón "Actualizar Plan" visible (billing.manage)
- ✅ Botón "Cancelar Suscripción" visible (billing.manage)

---

#### Test 3.14: PermissionTemplates (permissions.manage)
**Permisos a probar**: manage

**Pasos**:
1. Navegar a "Permisos" → "Plantillas"
2. Verificar botón "Guardar Plantilla" visible
3. Crear/editar plantilla
4. Click en guardar

**Validaciones**:
- ✅ Botón "Guardar" visible (permissions.manage)

---

#### Test 3.15: UserPermissionsManager (permissions.assign)
**Permisos a probar**: assign

**Pasos**:
1. Navegar a "Permisos" → "Usuarios"
2. Seleccionar usuario
3. Verificar botón "Guardar Cambios" visible
4. Modificar permisos
5. Click en guardar

**Validaciones**:
- ✅ Botón "Guardar" visible (permissions.assign)

---

#### Test 3.16: AbsencesTab (absences.approve)
**Permisos a probar**: approve

**Pasos**:
1. Navegar a "Ausencias"
2. Verificar tab "Pendientes"
3. Verificar botones "Aprobar" y "Rechazar" visibles
4. Click en "Aprobar" para una solicitud
5. Verificar aprobación exitosa

**Validaciones**:
- ✅ Botón "Aprobar" visible (absences.approve)
- ✅ Botón "Rechazar" visible (absences.approve)

---

### FASE 4: Testing de Módulos Employee (3 módulos)

#### Test 4.1: EmployeeAbsencesList (absences.request)
**Permisos a probar**: request

**Pasos**:
1. Cambiar rol a "Employee"
2. Navegar a dashboard de empleado
3. Verificar botón "Solicitar Ausencia" visible
4. Click en botón
5. Completar formulario
6. Enviar solicitud

**Validaciones**:
- ✅ Botón "Solicitar Ausencia" visible (absences.request)

---

#### Test 4.2: EmployeeDashboard (absences.request)
**Permisos a probar**: request

**Pasos**:
1. En dashboard de empleado
2. Buscar widget de vacaciones
3. Verificar botón "Solicitar Ausencia" visible
4. Probar flujo completo

**Validaciones**:
- ✅ Botón visible en widget (absences.request)

---

#### Test 4.3: CompleteUnifiedSettings Employee (employees.edit_own_profile)
**Permisos a probar**: edit_own_profile

**Pasos**:
1. Navegar a "Configuración"
2. Ir a tab "Preferencias de Empleado"
3. Verificar botón "Guardar Cambios" visible
4. Modificar perfil profesional
5. Click en guardar

**Validaciones**:
- ✅ Botón "Guardar" puede estar deshabilitado (employees.edit_own_profile)

---

### FASE 5: Testing de Módulos Client (4 módulos)

#### Test 5.1: AppointmentWizard (appointments.create)
**Permisos a probar**: create

**Pasos**:
1. Cambiar rol a "Client"
2. Navegar a "Reservar Cita"
3. Completar wizard de cita
4. Llegar a paso final
5. Verificar botón "Confirmar y Reservar" visible
6. Click en confirmar

**Validaciones**:
- ✅ Botón "Confirmar" puede estar deshabilitado (appointments.create)
- ✅ Cita se crea si tiene permiso

---

#### Test 5.2: ClientDashboard (appointments.*)
**Permisos a probar**: cancel_own, reschedule_own

**Pasos**:
1. En dashboard de cliente
2. Ver lista de citas
3. Verificar botón "Reprogramar" visible
4. Verificar botón "Cancelar Cita" visible
5. Click en "Reprogramar"
6. Completar reprogramación
7. Click en "Cancelar Cita"
8. Confirmar cancelación

**Validaciones**:
- ✅ Botón "Reprogramar" visible (appointments.reschedule_own)
- ✅ Botón "Cancelar" visible (appointments.cancel_own)

---

#### Test 5.3: BusinessProfile (favorites.toggle)
**Permisos a probar**: toggle

**Pasos**:
1. Navegar a perfil público de negocio
2. Verificar icono de corazón visible
3. Click en corazón (agregar a favoritos)
4. Verificar corazón lleno
5. Click nuevamente (quitar de favoritos)
6. Verificar corazón vacío

**Validaciones**:
- ✅ Icono corazón visible (favorites.toggle)
- ✅ Toggle funciona correctamente

---

#### Test 5.4: ReviewForm (reviews.create)
**Permisos a probar**: create

**Pasos**:
1. Navegar a cita completada
2. Click en "Dejar Reseña"
3. Completar formulario de review
4. Verificar botón "Enviar Review" visible
5. Click en enviar

**Validaciones**:
- ✅ Botón "Enviar" puede estar deshabilitado (reviews.create)
- ✅ Review se crea si tiene permiso

---

### FASE 6: Testing de Casos Edge

#### Test 6.1: Usuario sin Permisos
**Objetivo**: Verificar que usuario sin permisos NO ve botones

**Pasos**:
1. Crear usuario de prueba sin permisos
2. Login con ese usuario
3. Navegar a cada módulo
4. Verificar que botones están ocultos o deshabilitados

**Validaciones**:
- ✅ Mode "hide": Botones NO visibles
- ✅ Mode "disable": Botones visibles pero disabled

---

#### Test 6.2: businessId Faltante
**Objetivo**: Verificar manejo de error cuando no hay businessId

**Pasos**:
1. Simular navegación sin businessId seleccionado
2. Verificar que PermissionGate maneja gracefully
3. Verificar comportamiento por defecto (ocultar/deshabilitar)

**Validaciones**:
- ✅ No hay errores en consola
- ✅ Comportamiento seguro (deny by default)

---

#### Test 6.3: Múltiples Negocios
**Objetivo**: Verificar que permisos son independientes entre negocios

**Pasos**:
1. Usuario admin en negocio A
2. Usuario client en negocio B
3. Cambiar entre negocios
4. Verificar que permisos cambian correctamente

**Validaciones**:
- ✅ En negocio A: Todos los botones admin visibles
- ✅ En negocio B: Solo botones client visibles

---

## 📊 Resumen de Cobertura

**Total de Permisos a Probar**: 79 tipos únicos

**Módulos**:
- Admin: 18 módulos
- Employee: 3 módulos
- Client: 4 módulos
- **Total**: 25 módulos

**Categorías de Permisos**:
1. services.* (3 permisos)
2. resources.* (3 permisos)
3. locations.* (3 permisos)
4. employees.* (6 permisos)
5. appointments.* (6 permisos)
6. recruitment.* (4 permisos)
7. accounting.* (1 permiso)
8. expenses.* (2 permisos)
9. reviews.* (2 permisos)
10. billing.* (1 permiso)
11. notifications.* (1 permiso)
12. settings.* (2 permisos)
13. permissions.* (2 permisos)
14. absences.* (2 permisos)
15. favorites.* (1 permiso)

**Escenarios**:
- Normal flow: 25 tests
- Sin permisos: 25 tests
- businessId faltante: 5 tests
- Múltiples negocios: 10 tests
- **Total Escenarios**: 65 tests

---

## 🎯 Criterios de Éxito

**Para considerar el testing 100% COMPLETO**:

1. ✅ Todos los 25 módulos probados
2. ✅ Todos los 79 permisos validados
3. ✅ Mode "hide" funciona en 18 módulos
4. ✅ Mode "disable" funciona en 7 módulos
5. ✅ Casos edge cubiertos (sin permisos, sin businessId, múltiples negocios)
6. ✅ Screenshots de evidencia de cada test
7. ✅ Reporte final con % de éxito

---

## 📝 Formato de Reporte

Cada test generará:
- ✅ Status (Pass/Fail)
- 📸 Screenshot de evidencia
- 📋 Log de acciones realizadas
- ⚠️ Errores encontrados (si aplica)
- 💡 Observaciones

---

**Inicio de Ejecución**: [PENDIENTE]  
**Tiempo Estimado**: 2-3 horas  
**Ejecutor**: Chrome DevTools MCP

