# Guía de Pruebas - Sistema de Configuraciones Unificado

## ✅ Implementación Completada

Se ha creado un sistema unificado de configuraciones que **integra todas las configuraciones de los 3 roles** en un solo componente intuitivo y sin duplicación.

---

## 🎯 Cómo Probar

### 1. **Iniciar la Aplicación**
```bash
npm run dev
```

### 2. **Probar como ADMINISTRADOR**

1. **Login como Admin** de un negocio
2. En el sidebar, ir a **"Configuración"** o **"Perfil"** (ambos abren el mismo componente)
3. **Verificar las 4 pestañas**:

#### Tab 1: ⚙️ Ajustes Generales
- [ ] Cambiar entre tema **Claro/Oscuro/Sistema**
- [ ] Verificar que el tema cambia inmediatamente
- [ ] Ver el indicador "Tema actual: X" en la parte inferior
- [ ] Cambiar idioma entre **Español/Inglés**
- [ ] Verificar que las traducciones cambian

#### Tab 2: 👤 Perfil
- [ ] Editar nombre, email, teléfono
- [ ] Subir avatar
- [ ] Guardar cambios
- [ ] Verificar que se actualizan en el header

#### Tab 3: 🔔 Notificaciones
- [ ] Ver configuraciones de notificaciones del usuario
- [ ] Activar/desactivar canales (Email/SMS/WhatsApp)
- [ ] Guardar preferencias

#### Tab 4: 🏢 Preferencias del Negocio ⭐ NUEVO
**Sub-pestañas**:

**📋 Información del Negocio**:
- [ ] Editar nombre del negocio
- [ ] Editar descripción
- [ ] Editar información de contacto (teléfono, email, web)
- [ ] Editar dirección (calle, ciudad, estado)
- [ ] Editar información legal (razón social, NIT)
- [ ] Configurar opciones operacionales:
  - [ ] ☑️ Permitir reservas online
  - [ ] ☑️ Confirmación automática
  - [ ] ☑️ Recordatorios automáticos
  - [ ] ☑️ Mostrar precios públicamente
- [ ] Botón "Guardar Cambios" funcional

**🔔 Notificaciones del Negocio**:
- [ ] Ver configuraciones de notificaciones del negocio
- [ ] Configurar recordatorios automáticos
- [ ] Configurar tiempos de anticipación

**📊 Historial**:
- [ ] Ver log de notificaciones enviadas
- [ ] Filtrar por tipo/fecha
- [ ] Ver estadísticas

---

### 3. **Probar como EMPLEADO**

1. **Cambiar rol a Employee** (dropdown en header)
2. En el sidebar, ir a **"Configuración"**
3. **Verificar las 4 pestañas**:

#### Tab 1: ⚙️ Ajustes Generales
- [ ] Mismo que Admin (tema e idioma)

#### Tab 2: 👤 Perfil
- [ ] Mismo que Admin (información personal)

#### Tab 3: 🔔 Notificaciones
- [ ] Mismo que Admin (preferencias de notificación)

#### Tab 4: 💼 Preferencias de Empleado ⭐ NUEVO

**1. Disponibilidad Laboral**:
- [ ] Toggle "Disponible para nuevas citas"
- [ ] Toggle "Notificar nuevas asignaciones"
- [ ] Toggle "Recordatorios de citas"
- [ ] **Mi horario de trabajo**:
  - [ ] Ver lista de 7 días (Lunes-Domingo)
  - [ ] Activar/desactivar días con switch
  - [ ] Configurar hora inicio (dropdown 00:00-23:00)
  - [ ] Configurar hora fin (dropdown 00:00-23:00)

**2. Información Profesional**:
- [ ] Escribir resumen profesional (50+ caracteres)
- [ ] Contador de caracteres visible
- [ ] Ingresar años de experiencia (0-50)
- [ ] Seleccionar tipo de trabajo preferido (Full-time/Part-time/Contract/Flexible)

**3. Expectativas Salariales**:
- [ ] Ingresar salario mínimo esperado
- [ ] Ver formato COP (ej: $2.000.000)
- [ ] Ingresar salario máximo esperado
- [ ] Validación: mínimo no puede ser > máximo

**4. Especializaciones**:
- [ ] Ver lista de especializa Existentes (badges)
- [ ] Agregar nueva especialización (input + botón +)
- [ ] Eliminar especialización (X en badge)
- [ ] Toast de confirmación

**5. Idiomas**:
- [ ] Ver lista de idiomas (badges outline)
- [ ] Agregar nuevo idioma
- [ ] Eliminar idioma

**6. Certificaciones**:
- [ ] Botón "Agregar" para expandir formulario
- [ ] Formulario con 6 campos:
  - [ ] Nombre de certificación*
  - [ ] Emisor*
  - [ ] Fecha de emisión* (date picker)
  - [ ] Fecha de vencimiento (opcional)
  - [ ] ID de credencial (opcional)
  - [ ] URL de credencial (opcional)
- [ ] Botón "Guardar" guarda la certificación
- [ ] Ver cards con certificaciones guardadas
- [ ] Link "Ver credencial →" (si tiene URL)
- [ ] Botón X para eliminar

**7. Enlaces Externos**:
- [ ] Input para Portfolio/Sitio Web
- [ ] Input para LinkedIn
- [ ] Input para GitHub

**Botón Final**:
- [ ] Botón grande "Guardar Cambios" al final
- [ ] Loading state "Guardando..."
- [ ] Toast de éxito/error

---

### 4. **Probar como CLIENTE**

1. **Cambiar rol a Client**
2. En el sidebar, ir a **"Configuración"**
3. **Verificar las 4 pestañas**:

#### Tab 1: ⚙️ Ajustes Generales
- [ ] Mismo que Admin/Employee

#### Tab 2: 👤 Perfil
- [ ] Mismo que Admin/Employee

#### Tab 3: 🔔 Notificaciones
- [ ] Mismo que Admin/Employee

#### Tab 4: 🛒 Preferencias de Cliente ⭐ NUEVO

**Preferencias de Reserva**:
- [ ] Toggle "Recordatorios de citas"
- [ ] Toggle "Confirmación por email"
- [ ] Toggle "Notificaciones de promociones"
- [ ] Toggle "Guardar métodos de pago"

**Tiempo de anticipación preferido**:
- [ ] Dropdown con 5 opciones:
  - [ ] 1 hora antes
  - [ ] 2 horas antes
  - [ ] 4 horas antes
  - [ ] 1 día antes
  - [ ] 2 días antes

**Método de pago preferido**:
- [ ] Dropdown con 3 opciones:
  - [ ] Tarjeta de crédito/débito
  - [ ] Efectivo en el lugar
  - [ ] Transferencia bancaria

**Historial de servicios**:
- [ ] Card con contador "Has completado X servicios"
- [ ] Botón "Ver Historial Completo"

**Botón Final**:
- [ ] Botón "Guardar Preferencias"

---

## 📸 Capturas Esperadas

### Vista Admin - Tab "Preferencias del Negocio"
```
┌─────────────────────────────────────────────────┐
│ [Información del Negocio] [Notificaciones] [...] │
├─────────────────────────────────────────────────┤
│ Información Básica                               │
│ ┌─────────────────────────────────────────────┐ │
│ │ Nombre del Negocio *                         │ │
│ │ [Los Narcos                                ] │ │
│ │                                              │ │
│ │ Descripción                                  │ │
│ │ [Buenas mi SO                              ] │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ Información de Contacto                          │
│ ┌─────────────────────────────────────────────┐ │
│ │ Teléfono: [+57] [3227067704]                │ │
│ │ Email: [jlap.11@hotmail.com]                │ │
│ │ Sitio Web: [https://www.tunegocio.com]      │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ ... (más secciones) ...                         │
│                                                  │
│               [💾 Guardar Cambios]              │
└─────────────────────────────────────────────────┘
```

### Vista Employee - Tab "Preferencias de Empleado"
```
┌─────────────────────────────────────────────────┐
│ Disponibilidad Laboral                           │
│ ┌─────────────────────────────────────────────┐ │
│ │ [●] Disponible para nuevas citas            │ │
│ │ [●] Notificar nuevas asignaciones           │ │
│ │ [●] Recordatorios de citas                  │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ Mi horario de trabajo                            │
│ ┌─────────────────────────────────────────────┐ │
│ │ [●] Lunes    [09:00 ▼] - [18:00 ▼]         │ │
│ │ [●] Martes   [09:00 ▼] - [18:00 ▼]         │ │
│ │ [●] Miércoles [09:00 ▼] - [18:00 ▼]        │ │
│ │ ... (5 días más) ...                         │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ Información Profesional                          │
│ ┌─────────────────────────────────────────────┐ │
│ │ Resumen Profesional                          │ │
│ │ [Describe tu experiencia, habilidades...   ] │ │
│ │ 0 / 50 caracteres mínimos                    │ │
│ │                                              │ │
│ │ Años de Experiencia: [5]                     │ │
│ │ Tipo de Trabajo: [Tiempo Completo ▼]        │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ ... (más secciones) ...                         │
│                                                  │
│               [💾 Guardar Cambios]              │
└─────────────────────────────────────────────────┘
```

---

## ✅ Checklist de Validación Final

### Funcionalidad
- [ ] Las 4 pestañas aparecen en todos los roles
- [ ] La pestaña específica cambia según el rol
- [ ] Todos los toggles/switches funcionan
- [ ] Todos los dropdowns funcionan
- [ ] Todos los inputs aceptan texto
- [ ] Todos los botones de guardar funcionan
- [ ] Los toasts de éxito/error aparecen

### UI/UX
- [ ] Tema claro se ve bien
- [ ] Tema oscuro se ve bien
- [ ] Responsive en móvil
- [ ] Responsive en tablet
- [ ] Responsive en desktop
- [ ] Scrolling suave en contenido largo

### Integración
- [ ] Profile y Settings abren el mismo componente
- [ ] Los cambios persisten al recargar
- [ ] Los cambios se reflejan en el header
- [ ] No hay console errors
- [ ] No hay warnings de React

---

## 🐛 Reportar Issues

Si encuentras algún problema, documenta:
1. **Rol actual** (Admin/Employee/Client)
2. **Pestaña activa** (General/Perfil/Notificaciones/Rol-específica)
3. **Acción realizada** (ej: "Clickeé Guardar Cambios")
4. **Resultado esperado**
5. **Resultado obtenido**
6. **Screenshot** (si es UI)
7. **Console errors** (F12 → Console tab)

---

## 📝 Notas Adicionales

- **Tema persistencia**: Se guarda en localStorage como `theme: 'light' | 'dark' | 'system'`
- **Idioma persistencia**: Se guarda en localStorage como `language: 'es' | 'en'`
- **Perfiles empleado**: Se guardan en tabla `employee_profiles` con user_id
- **Configuraciones negocio**: Se guardan en tabla `businesses`
- **Hot reload**: Los cambios de tema/idioma son inmediatos, no requieren guardar

---

**Fecha**: 17/10/2025  
**Archivo**: `docs/GUIA_PRUEBAS_CONFIGURACIONES.md`
