# 🚀 Guía de Acceso - Sistema de Vacantes Laborales

**Fecha**: 17 de octubre de 2025  
**Versión**: 1.0.0  
**Estado del Deploy**: ✅ COMPLETADO

---

## ✅ Estado del Deployment

### Migraciones SQL
- ✅ **Fase 1**: reviews.review_type, employee_profiles, job_vacancies mejorada, RPC get_matching_vacancies
- ✅ **Fase 6**: Trigger notify_application_received para notificaciones automáticas

### Edge Functions
- ✅ `send-notification` (v5): Desplegada y activa
- ✅ `process-reminders` (v2): Desplegada y activa
- ✅ `refresh-ratings-stats` (v1): Desplegada y activa

### Base de Datos
Todas las tablas están creadas y operativas:
- ✅ `employee_profiles`
- ✅ `job_vacancies` (mejorada)
- ✅ `job_applications`
- ✅ `reviews` (con review_type)
- ✅ `in_app_notifications`

---

## 🔑 Cómo Acceder a las Nuevas Funcionalidades

### 1️⃣ Para ADMINISTRADORES de Negocio (ADMIN Role)

#### A. Publicar Vacantes Laborales

1. **Acceder al Dashboard de Admin**
   - URL: `/admin` o `/dashboard/admin`
   - Rol requerido: ADMIN (owner del negocio)

2. **Ir a la sección de Reclutamiento**
   - Buscar en el sidebar: **"Reclutamiento"** o **"Recruitment"**
   - Click en el menú

3. **Pestaña "Vacantes Activas"**
   - Botón: **"+ Nueva Vacante"**
   - Formulario con campos:
     - Título del puesto
     - Descripción
     - Tipo de posición (full_time, part_time, contract, temporary)
     - Nivel de experiencia (entry, mid, senior, expert)
     - Salario (min/max en COP)
     - Número de plazas
     - Requisitos (skills requeridos - array)
     - Beneficios (array)
     - Horario laboral (JSON por día de la semana)
     - Ubicación (ciudad, dirección, tipo: remote/hybrid/onsite)
   - Click **"Publicar Vacante"**

4. **Ver Aplicaciones Recibidas**
   - Pestaña: **"Aplicaciones"** o **"Applications Management"**
   - Lista de todas las aplicaciones con:
     - Nombre del aplicante
     - Vacante aplicada
     - Match Score (0-100)
     - Estado (pending, reviewing, interview, accepted, rejected)
     - Fecha de aplicación
   - Acciones disponibles:
     - Ver perfil completo del aplicante (modal con 3 tabs)
     - Aceptar aplicación
     - Rechazar aplicación
     - Agendar entrevista

5. **Recibir Notificaciones**
   - 📧 **In-app**: Notificación automática al recibir aplicación
     - Icono de campana en header
     - Badge con contador de notificaciones no leídas
   - 📨 **Email** (si está configurado AWS SES):
     - Template HTML profesional
     - Match score visual
     - Información completa del aplicante
     - Link directo al dashboard

---

### 2️⃣ Para EMPLEADOS (EMPLOYEE Role)

#### A. Buscar Vacantes Disponibles

1. **Acceder al Dashboard de Employee**
   - URL: `/employee` o `/dashboard/employee`
   - Rol requerido: EMPLOYEE

2. **Configurar Perfil Profesional (REQUERIDO)**
   - Ir a: **"Configuración"** → **"Perfil Profesional"**
   - Completar:
     - Resumen profesional (descripción)
     - Años de experiencia (0-50)
     - Especializaciones (React, Node.js, Python, etc.)
     - Idiomas (Español, Inglés, etc.)
     - Certificaciones (JSONB con nombre, emisor, fecha, URL)
     - Disponible para contratar (checkbox)
     - Tipo de trabajo preferido (full_time, part_time, etc.)
     - Expectativa salarial (min/max en COP)
     - URLs (Portfolio, LinkedIn, GitHub)
   - Click **"Guardar Perfil"**

3. **Explorar Marketplace de Vacantes**
   - Menú: **"Vacantes Disponibles"** o **"Available Vacancies"**
   - Features:
     - 🔍 **Barra de búsqueda**: Por título, descripción, skills
     - 🎯 **Match Score Visual**: 0-100 con barra de progreso
       - Verde (80-100): Excelente match
       - Amarillo (60-79): Buen match
       - Naranja (40-59): Match moderado
       - Gris (<40): Match bajo
     - 🔢 **Filtros**:
       - Tipo de posición
       - Nivel de experiencia
       - Rango salarial
       - Ciudad/ubicación
       - Tipo de trabajo (remote/hybrid/onsite)
     - 📊 **Ordenamiento**:
       - Por match score (descendente)
       - Por fecha de publicación (más recientes)
       - Por salario (ascendente/descendente)

4. **Aplicar a una Vacante**
   - Click en card de vacante
   - Botón: **"Aplicar"** o **"Apply Now"**
   - Modal con formulario:
     - Carta de presentación (cover letter) - min 50 caracteres
     - Disponibilidad horaria (selector de días y horas)
     - ⚠️ **Detección automática de conflictos**:
       - Si tienes trabajos actuales con horarios que solapan
       - Alert rojo con mensaje detallado
       - Opción de continuar o cancelar
   - Click **"Enviar Aplicación"**

5. **Seguimiento de Aplicaciones**
   - Sección: **"Mis Aplicaciones"**
   - Lista de aplicaciones enviadas con:
     - Estado actual (pending, reviewing, interview, accepted, rejected)
     - Fecha de aplicación
     - Vacante aplicada
     - Negocio
     - Match score
   - Notificaciones cuando el estado cambia

---

### 3️⃣ Para CLIENTES (CLIENT Role)

#### Reviews Obligatorias Después de Citas

1. **Completar una Cita**
   - Al finalizar una cita (status = completed)
   - El sistema detecta automáticamente citas sin review

2. **Modal de Review Obligatoria**
   - Aparece automáticamente al abrir el dashboard
   - **No se puede cerrar** (no-dismissible) hasta completar
   - Opción: **"Recordar luego"** (5 minutos)
   - Contador de reviews pendientes en badge

3. **Flujo Multi-Review**
   - **Review del Negocio** (obligatoria):
     - Rating: 1-5 estrellas (clickeable con hover)
     - Comentario: min 50 caracteres (contador en vivo)
     - Recomiendas el negocio: Sí/No
   - **Review del Empleado** (obligatoria):
     - Rating: 1-5 estrellas
     - Comentario: min 50 caracteres
     - Recomiendas al empleado: Sí/No

4. **Validaciones en Tiempo Real**
   - ❌ Rating no seleccionado → error
   - ❌ Comentario < 50 chars → error + contador
   - ❌ Recommend no seleccionado → error
   - ✅ Todas validadas → botón "Enviar" habilitado

5. **Después de Enviar**
   - ✅ Toast de confirmación
   - ✅ Modal se cierra automáticamente
   - ✅ Lista de citas se actualiza
   - ✅ Average rating del negocio/empleado se actualiza

---

## 🎯 Flujos Principales de Uso

### Flujo Completo: Publicar Vacante → Recibir Aplicación → Contratar

```
ADMIN (Negocio)
1. Login → Admin Dashboard
2. Sidebar → "Reclutamiento"
3. Tab → "Vacantes Activas"
4. Botón → "+ Nueva Vacante"
5. Llenar formulario completo
6. Click → "Publicar Vacante"
7. ✅ Vacante publicada, visible en marketplace

EMPLOYEE (Aplicante)
8. Login → Employee Dashboard
9. (PRIMERO) Configuración → "Perfil Profesional"
10. Completar perfil profesional
11. Sidebar → "Vacantes Disponibles"
12. Ver vacante con Match Score 85%
13. Click → "Aplicar"
14. Llenar cover letter + disponibilidad
15. ⚠️ Sistema verifica conflictos de horario
16. Click → "Enviar Aplicación"
17. ✅ Aplicación enviada

SISTEMA (Automático)
18. Trigger SQL ejecuta notify_application_received()
19. ✅ Notificación in-app creada para business owner
20. ✅ Email enviado al business owner (si AWS SES configurado)

ADMIN (Negocio)
21. 🔔 Notificación in-app recibida
22. Tab → "Aplicaciones"
23. Ver aplicación con match score 85%
24. Click → "Ver Perfil" (modal con 3 tabs)
25. Review perfil, horario, carta
26. Click → "Aceptar Aplicación"
27. ✅ Status → 'accepted'

EMPLOYEE (Aplicante)
28. 🔔 Notificación de estado actualizado
29. Ver en "Mis Aplicaciones" → status 'accepted'
30. Contacto directo con negocio para siguiente paso
```

---

## 📱 URLs de Acceso Directo

### Admin Dashboard
```
http://localhost:5173/admin
http://localhost:5173/dashboard/admin
```

### Employee Dashboard
```
http://localhost:5173/employee
http://localhost:5173/dashboard/employee
```

### Client Dashboard
```
http://localhost:5173/client
http://localhost:5173/dashboard/client
```

### Specific Pages

**Admin - Reclutamiento**:
```
http://localhost:5173/admin/recruitment
```

**Employee - Vacantes**:
```
http://localhost:5173/employee/vacancies
```

**Employee - Perfil Profesional**:
```
http://localhost:5173/employee/profile/professional
```

---

## 🔧 Configuración Requerida

### Variables de Entorno

Para funcionalidad completa de notificaciones por email:

```env
# AWS SES (Email)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
SES_FROM_EMAIL=noreply@appointsync.com

# AWS SNS (SMS - opcional)
WHATSAPP_ACCESS_TOKEN=your-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-id
```

**Nota**: Sin estas variables, el sistema funciona perfectamente con notificaciones in-app solamente.

---

## 🧪 Testing en Desarrollo

### 1. Crear Usuario de Prueba Admin

```bash
# En Supabase Dashboard → Authentication → Add User
Email: admin@test.com
Password: Test123456!

# Luego crear negocio en businesses table
INSERT INTO businesses (name, owner_id, category, subcategory)
VALUES ('Mi Negocio Test', 'uuid-del-usuario', 'Tecnología', 'Software');
```

### 2. Crear Usuario de Prueba Employee

```bash
# En Supabase Dashboard → Authentication → Add User
Email: employee@test.com
Password: Test123456!

# Luego crear perfil en employee_profiles table
# O usar la UI: Employee Dashboard → Configuración → Perfil Profesional
```

### 3. Ejecutar Tests

```bash
# Todos los tests del sistema de vacantes
npm run test tests/job-vacancy-complete-flow.test.ts
npm run test tests/matching-score-calculation.test.ts
npm run test tests/schedule-conflict-detection.test.ts
npm run test tests/mandatory-review-enforcement.test.ts

# Con coverage
npm run test:coverage
```

---

## 📊 Métricas y Analytics

### Dashboard de Admin - Analytics Tab

Métricas disponibles:
- 📈 Total de vacantes publicadas
- 📥 Total de aplicaciones recibidas
- ✅ Tasa de aceptación (%)
- 🎯 Match score promedio de aplicantes
- 📅 Tiempo promedio de contratación
- 🔝 Top skills solicitados

### Performance Esperado

- **Match Score Calculation**: <100ms para 50 vacantes
- **Conflict Detection**: <50ms para 5 schedules
- **Notification Send**: <500ms (email) / <200ms (in-app)
- **Review Submission**: <300ms

---

## ❓ FAQs

### 1. No veo la sección de Reclutamiento en el sidebar

**Solución**: Verifica que tu usuario tenga rol ADMIN y sea owner de un negocio en la tabla `businesses`.

### 2. Mi match score es 0 para todas las vacantes

**Solución**: Completa tu perfil profesional en Employee Dashboard → Configuración → Perfil Profesional. El sistema necesita:
- Especializaciones
- Años de experiencia
- Expectativa salarial
- Tipo de trabajo preferido

### 3. No puedo aplicar a una vacante

**Solución**: Revisa:
- ¿Completaste tu perfil profesional?
- ¿La vacante está en status 'open'?
- ¿Ya aplicaste previamente a esta vacante?
- ¿Hay conflictos de horario con trabajos actuales?

### 4. No recibo notificaciones por email

**Solución**: Las variables de entorno de AWS SES deben estar configuradas en Supabase Edge Functions. Sin ellas, solo recibirás notificaciones in-app.

### 5. El modal de reviews no aparece

**Solución**: El modal solo aparece si:
- Eres CLIENT
- Tienes citas con status 'completed'
- No has dejado review para esas citas
- Han pasado menos de 30 días desde la cita

---

## 🆘 Soporte

### Logs y Debugging

**Ver logs de Edge Functions**:
```bash
npx supabase functions logs send-notification
npx supabase functions logs process-reminders
```

**Ver triggers SQL en acción**:
```sql
-- Check recent notifications
SELECT * FROM in_app_notifications 
WHERE type = 'job_application' 
ORDER BY created_at DESC 
LIMIT 10;

-- Check applications count
SELECT jv.title, jv.applications_count, COUNT(ja.id) as actual_count
FROM job_vacancies jv
LEFT JOIN job_applications ja ON ja.vacancy_id = jv.id
GROUP BY jv.id, jv.title, jv.applications_count;
```

### Reportar Issues

Si encuentras problemas:
1. Verifica los logs de la consola del navegador
2. Revisa los logs de Supabase Functions
3. Verifica que las migraciones estén aplicadas
4. Consulta la documentación completa en `docs/`

---

## 📚 Documentación Adicional

- **Documentación Técnica Completa**: `docs/FASE_7_COMPLETADA_TESTING.md`
- **Progreso del Proyecto**: `docs/PROGRESO_IMPLEMENTACION_VACANTES.md`
- **Resumen Ejecutivo**: `docs/SISTEMA_VACANTES_COMPLETADO_RESUMEN_FINAL.md`
- **Sistema de Notificaciones**: `docs/FASE_6_COMPLETADA_NOTIFICACIONES.md`

---

**Última actualización**: 17 de octubre de 2025  
**Versión**: 1.0.0  
**Estado**: ✅ Production Ready
