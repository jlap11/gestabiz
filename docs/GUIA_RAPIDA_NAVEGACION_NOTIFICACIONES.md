# Guía Rápida: Sistema de Navegación de Notificaciones con Cambio Automático de Rol

## 🚀 Inicio Rápido (5 minutos)

### ¿Qué hace este sistema?

**Antes**: 
```
Usuario en rol "Cliente" → Notificación de vacante → Click → ❌ No navega (vacantes solo en Admin)
```

**Ahora**:
```
Usuario en rol "Cliente" → Notificación de vacante → Click → ✅ Cambia a "Admin" → ✅ Abre vacante
```

### Archivo principal

📁 `src/lib/notificationRoleMapping.ts` (363 líneas)

## 📋 Tipos de Notificación Soportados

### 🏢 ADMIN (Negocio)
| Tipo de Notificación | Navega a |
|---------------------|----------|
| `job_application_new` | Reclutamiento → Vacante específica |
| `job_application_received` | Reclutamiento → Lista de aplicaciones |
| `employee_request_new` | Empleados → Solicitud específica |
| `review_received` | Reseñas → Review específica |
| `business_verification_*` | Ajustes → Verificación |

### 👷 EMPLOYEE (Empleado)
| Tipo de Notificación | Navega a |
|---------------------|----------|
| `employee_request_approved` | Dashboard |
| `job_application_accepted` | Mis Aplicaciones |
| `shift_assigned` | Horarios |

### 👤 CLIENT (Cliente)
| Tipo de Notificación | Navega a |
|---------------------|----------|
| `appointment_created` | Citas → Cita específica |
| `appointment_confirmed` | Citas → Cita específica |
| `reminder_24h` | Citas → Próxima cita |

## 🔧 Cómo Usar

### 1. Agregar nuevo tipo de notificación

Edita `src/lib/notificationRoleMapping.ts`:

```typescript
const NOTIFICATION_ROLE_MAP = {
  'mi_nuevo_tipo': {
    requiredRole: 'admin',     // o 'employee', 'client'
    path: '/admin',            // ruta base del dashboard
    page: 'mi_pagina',         // nombre de la página en el dashboard
    context: {}                // IDs se extraen automáticamente
  }
}
```

### 2. IDs automáticos soportados

El sistema extrae automáticamente de `notification.data`:
- ✅ `vacancy_id` → `vacancyId`
- ✅ `appointment_id` → `appointmentId`
- ✅ `conversation_id` → `conversationId`
- ✅ `request_id` → `requestId`
- ✅ `business_id` → `businessId`

### 3. Nombres de páginas por Dashboard

**AdminDashboard**:
```
dashboard | appointments | services | locations | employees | 
recruitment | chat | analytics | settings | profile | reviews
```

**EmployeeDashboard**:
```
dashboard | schedule | appointments | applications | 
chat | settings | profile
```

**ClientDashboard**:
```
dashboard | appointments | favorites | chat | 
history | settings | profile
```

## 🎯 Ejemplo Completo

### Crear notificación de nueva aplicación

```typescript
// 1. En Supabase (trigger o Edge Function)
const notification = {
  type: 'job_application_new',  // ← Tipo definido en NOTIFICATION_ROLE_MAP
  data: {
    vacancy_id: 'abc-123',       // ← Se extrae como vacancyId
    applicant_name: 'Juan Pérez'
  }
}

// 2. Sistema detecta automáticamente:
// - requiredRole: 'admin'
// - page: 'recruitment'
// - context: { vacancyId: 'abc-123' }

// 3. Usuario con rol 'client' hace clic:
// - Cambia rol → 'admin'
// - Espera 100ms
// - Navega → AdminDashboard.activePage = 'recruitment'
// - AdminDashboard renderiza: <RecruitmentPage vacancyId="abc-123" />
```

## ⚙️ Configuración Avanzada

### Delay tras cambio de rol

Por defecto: 100ms

```typescript
// En src/lib/notificationRoleMapping.ts:331
await new Promise(resolve => setTimeout(resolve, 100)) // ← Cambiar aquí
```

### Callbacks personalizados

```typescript
handleNotificationWithRoleSwitch(notification, currentRole, switchRole, navigate, {
  onSuccess: () => toast.success('Navegación exitosa'),
  onError: (error) => toast.error(`Error: ${error.message}`)
})
```

## 🐛 Debugging

### Problema: Notificación no navega

**Checklist**:
1. ✅ ¿Tipo existe en `NOTIFICATION_ROLE_MAP`?
2. ✅ ¿`page` existe en el dashboard del rol?
3. ✅ ¿`notification.data` tiene los IDs necesarios?
4. ✅ ¿Usuario tiene acceso al rol requerido?

### Logs en consola

```
🔄 Switching role from client to admin
📍 Navigating to page: recruitment { vacancyId: 'abc-123' }
```

## 📊 Estadísticas del Sistema

- **30+** tipos de notificación mapeados
- **3** roles soportados (admin, employee, client)
- **100ms** delay tras cambio de rol
- **4** archivos modificados
- **363** líneas de código nuevo

## 🔗 Referencias

- 📖 Documentación completa: `docs/SISTEMA_NAVEGACION_NOTIFICACIONES_CON_ROLES.md`
- 🧪 Testing: Ver sección "Validación y Testing" en doc completa
- 🛠️ Mantenimiento: Ver sección "Mantenimiento" en doc completa

## ✅ Checklist de Implementación

Para otros proyectos que quieran este sistema:

- [ ] Copiar `src/lib/notificationRoleMapping.ts`
- [ ] Actualizar `NotificationCenter.tsx` (añadir props + handleNavigate)
- [ ] Actualizar `NotificationBell.tsx` (añadir props)
- [ ] Actualizar layout principal (pasar currentRole, onRoleSwitch, availableRoles)
- [ ] Mapear tipos de notificación propios
- [ ] Definir nombres de páginas de dashboards
- [ ] Testing con diferentes escenarios

## 🎉 ¡Listo!

El sistema está funcionando. Cualquier notificación que llegue al usuario:
1. Detecta el rol requerido
2. Cambia automáticamente si es necesario
3. Navega a la página correcta
4. Pasa el contexto completo

**Sin intervención manual del usuario** 🚀
