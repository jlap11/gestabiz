# Guía: Visualización de Solicitudes de Vacaciones y Ausencias

## 📋 Para Empleados: ¿Dónde ver mis solicitudes de vacaciones?

### Ubicación: Dashboard del Empleado → "Mis Ausencias"

1. **Ingresa a la app como Empleado**
2. **En la barra lateral izquierda**, verás una nueva opción: **"Mis Ausencias"** (icono de calendario tachado)
3. **Haz clic en "Mis Ausencias"** para ver:
   - ✅ **Pendientes**: Solicitudes esperando aprobación (puedes cancelarlas)
   - ✅ **Aprobadas**: Solicitudes aprobadas por tu administrador
   - ✅ **Rechazadas**: Solicitudes rechazadas (con motivo del rechazo)

### Ver detalles de una solicitud:
- **Tipo**: Vacaciones, Ausencia Médica, Emergencia, Personal, Otro
- **Fechas**: Desde - Hasta
- **Días**: Cantidad total de días solicitados
- **Razón**: Motivo de la ausencia
- **Notas del Administrador**: Si fue rechazada, aquí verás el motivo

### Cancelar una solicitud:
- Solo puedes cancelar solicitudes **PENDIENTES**
- Haz clic en el ícono 🗑️ (papelera) en la esquina derecha
- Confirma que deseas eliminar

---

## 👨‍💼 Para Administradores: ¿Dónde aprobar solicitudes de empleados?

### Ubicación: Dashboard del Admin → "Ausencias"

1. **Ingresa a la app como Administrador**
2. **En el dashboard del admin**, verás una opción: **"Ausencias"** (icono de calendario)
3. **Haz clic en "Ausencias"** para ver:
   - ⏳ **Pendientes**: Solicitudes esperando tu aprobación
   - ✅ **Historial**: Solicitudes ya procesadas (aprobadas o rechazadas)

### Aprobar una solicitud:
1. En la pestaña **"Pendientes"**, ve la solicitud del empleado
2. Haz clic en **"Aprobar"** (botón verde)
3. (Opcional) Agrega notas o comentarios
4. Confirma

**Resultado**: El empleado verá la solicitud como "Aprobada" en su tab de "Mis Ausencias"

### Rechazar una solicitud:
1. En la pestaña **"Pendientes"**, ve la solicitud del empleado
2. Haz clic en **"Rechazar"** (botón rojo)
3. **Obligatorio**: Agrega un motivo del rechazo en el campo de notas
4. Confirma

**Resultado**: El empleado verá la solicitud como "Rechazada" en su tab de "Mis Ausencias" con tus notas

---

## 🔔 Notificaciones: ¿Dónde están?

### Campana de Notificaciones (🔔)
Cuando un empleado solicita una ausencia, el administrador recibe una **notificación en-app**:

1. **Busca la campana de notificaciones** 🔔 en la esquina superior derecha del dashboard del admin
2. Verás un **badge rojo** con el número de notificaciones nuevas
3. **Haz clic en la campana** para abrir el panel de notificaciones
4. Verás el mensaje: *"Nueva solicitud de [Vacaciones/Ausencia/etc] - [Nombre del Empleado]"*
5. **Haz clic en la notificación** para ir directamente al tab de "Ausencias" con la solicitud preseleccionada

### Tipos de notificaciones de ausencia:
- 📅 **Nueva solicitud de Vacaciones**: Empleado solicita vacaciones
- 🏥 **Nueva solicitud de Ausencia Médica**: Empleado solicita ausencia médica
- 🚨 **Nueva solicitud de Emergencia**: Empleado tiene emergencia
- 👤 **Nueva solicitud de Permiso Personal**: Empleado solicita permiso personal
- 📝 **Nueva solicitud de Otro**: Otro tipo de ausencia

---

## 🔧 Troubleshooting

### No veo la campana de notificaciones
1. Asegúrate de estar logueado como Administrador
2. Recarga la página (F5)
3. Verifica que la tabla `in_app_notifications` en Supabase tenga registros

### No veo el tab "Mis Ausencias" como empleado
1. Debes estar logueado como Empleado y estar vinculado a un negocio
2. Si no estás vinculado, verás un mensaje: "No estás vinculado a ningún negocio"

### Creé una solicitud pero no veo notificación
1. **Comprueba que `require_absence_approval = true`** en tu negocio (Supabase)
2. Recarga el dashboard del administrador
3. Abre la campana de notificaciones 🔔
4. Si aún no ves, verifica los logs de la Edge Function `request-absence` en Supabase

---

## 📊 Flujo Completo de Solicitud de Vacaciones

```
1. EMPLEADO SOLICITA
   └─> Abre "Mis Empleos" → "Solicitar Ausencia"
   └─> Llena formulario (tipo, fechas, razón)
   └─> Envía

2. SISTEMA PROCESA
   └─> Edge Function `request-absence` valida
   └─> Crea registro en `employee_absences` (status='pending')
   └─> Crea notificación en `in_app_notifications` para cada ADMIN
   └─> Envía email a administradores

3. NOTIFICACIÓN EN ADMIN
   └─> Admin ve badge rojo 🔔 con contador
   └─> Admin hace clic en campana
   └─> Ve la notificación de nueva solicitud
   └─> Puede hacer clic para ir a "Ausencias"

4. ADMIN APRUEBA O RECHAZA
   └─> Va a Dashboard → Ausencias
   └─> Ve la solicitud PENDIENTE
   └─> Hace clic en Aprobar ✅ o Rechazar ❌
   └─> Agreganutas (opcional para aprobar, obligatorio para rechazar)
   └─> Confirma

5. RESULTADO
   └─> EMPLEADO recibe notificación de aprobación/rechazo
   └─> EMPLEADO ve status actualizado en "Mis Ausencias"
   └─> Si aprobada: aparece en validación de citas (slots bloqueados)
```

---

## 📱 URLs Útiles

- **Dashboard Empleado (Mis Ausencias)**: `/app/employee` → Tab "Mis Ausencias"
- **Dashboard Admin (Gestión de Ausencias)**: `/app/admin` → Tab "Ausencias"
- **Tabla en Supabase**: `in_app_notifications` (para ver notificaciones)
- **Edge Function**: `supabase/functions/request-absence/` (procesa solicitudes)

---

## 📝 Notas Técnicas

- **Política de Aprobación**: Todas las solicitudes requieren aprobación (`require_absence_approval = true`)
- **Límite de Vacaciones**: 15 días por año (configurable por negocio en `vacation_days_per_year`)
- **Notificación a**: TODOS los admins/managers + owner del negocio
- **Cancelación**: Solo se pueden cancelar solicitudes PENDIENTES
- **Email**: Se envía automáticamente a todos los administradores

---

**Última actualización**: 20 de Octubre de 2025
