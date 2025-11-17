# Test Data - Gestabiz ⭐ ACTUALIZADO 16 NOV 2025

**Fecha de actualización**: 16 de noviembre de 2025  
**Propósito**: Documentación COMPLETA de datos de prueba disponibles en la base de datos  
**Estado**: ✅ VERIFICADO EN SUPABASE - Data lista para testing

---

## 🔑 CREDENCIALES DE PRUEBA

### **Contraseña Universal**: `TestPassword123!`

**Usuarios Principales**:

| Email | Contraseña | Rol Principal | Negocios | Descripción |
|-------|-----------|---------------|----------|-------------|
| `jlap-04@hotmail.com` | `TestPassword123!` | **OWNER** ⭐ | **5 negocios** | Usuario IDEAL para pruebas - Data completa |
| `jlapnnn@gmail.com` | `TestPassword123!` | **OWNER** | 8 negocios | Usuario con múltiples negocios |
| `jlap.11@hotmail.com` | `TestPassword123!` | **OWNER** | 1 negocio | Sonrisas Dental |
| `empleado1@gestabiz.test` | `TestPassword123!` | **EMPLOYEE** | 6 negocios | Empleado multi-negocio |
| `empleado10@gestabiz.test` | `TestPassword123!` | **EMPLOYEE** | 4 negocios | Empleado activo |
| `empleado11@gestabiz.test` | `TestPassword123!` | **EMPLOYEE** | 6 negocios | Empleado activo |
| `empleado12@gestabiz.test` | `TestPassword123!` | **EMPLOYEE** | 1 negocio | Yoga Shanti |
| `cliente1@gestabiz.test` | `TestPassword123!` | **CLIENT** | 2 citas | Cliente con historial |
| `owner1@gestabiz.test` | `TestPassword123!` | **CLIENT** | 0 negocios | Usuario sin negocios (para testing de registro) |

---

## 🏢 NEGOCIOS DISPONIBLES (Por Owner)

### **👤 jlap-04@hotmail.com** (Jose Avila 2) - ⭐ USUARIO RECOMENDADO PARA PRUEBAS

**5 Negocios Completamente Configurados**:

#### 1️⃣ **English Academy Pro** 🎓
- **ID**: `1983339a-40f8-43bf-8452-1f23585a433a`
- **Categoría**: Education
- **Sedes**: 2 (Sede Centro, Sede Riomar - Barranquilla)
- **Servicios**: 5 (Beginner 150k, Intermediate 170k, Advanced 190k, IELTS 250k, Conversation 80k)
- **Empleados**: 4
  - empleado1@gestabiz.test
  - empleado10@gestabiz.test
  - empleado11@gestabiz.test
  - jlap-04@hotmail.com (owner como manager)
- **Estado**: ✅ Activo
- **Citas**: 2 confirmadas (cliente1@gestabiz.test)

#### 2️⃣ **Centro Deportivo Arena** 🏋️
- **ID**: `53bff38b-cbb5-4fcd-8b2a-e46852c8a253`
- **Categoría**: Sports
- **Sedes**: 2 (Complejo Principal, Complejo Playa - Santa Marta)
- **Servicios**: 5
- **Empleados**: 3 (empleado1, empleado10, owner)
- **Estado**: ✅ Activo

#### 3️⃣ **Yoga Shanti** 🧘
- **ID**: `3d7f7644-726c-46c3-8d29-1396efde0aca`
- **Categoría**: Wellness
- **Sedes**: 2 (Sede Principal, Sede Usaquén - Bogotá)
- **Servicios**: 5
- **Empleados**: 3 (empleado11, empleado12, owner)
- **Estado**: ✅ Activo

#### 4️⃣ **FitZone Gym** 💪
- **ID**: `ebd41f0b-4509-47dc-ad6e-cf8dfd280892`
- **Categoría**: Fitness
- **Sedes**: 2 (Sede Principal, Sede Centro Comercial - Cali)
- **Servicios**: 5
- **Empleados**: 6 (empleado1, empleado10, empleado11, owner, jlap.11@hotmail.com, jlapnnn@gmail.com)
- **Estado**: ✅ Activo
- **Citas**: 1 confirmada (cliente1@gestabiz.test)

#### 5️⃣ **La Mesa de Don Carlos** 🍽️
- **ID**: `1af876e5-fe6f-478a-83e4-d09a1787830a`
- **Categoría**: Restaurant
- **Sedes**: 2
- **Servicios**: 5
- **Empleados**: 3 (empleado1, empleado11, owner)
- **Estado**: ✅ Activo

---

### **👤 jlapnnn@gmail.com** (Jose Luis Avila) - OWNER ALTERNATIVO

**8 Negocios**:
1. Hotel Boutique Plaza (2 sedes, 5 servicios, 3 empleados) ✅
2. Spa Zen Wellness S.A.S (1 sede, 5 servicios, 2 empleados) ✅
3. Estilismo María González (0 sedes, 0 servicios) ⚠️ Sin configurar
4. Test Business Direct SQL (0 sedes) ⚠️ Sin configurar
5. Spa Relax Total (0 sedes) ⚠️ Sin configurar
6. El compa (1 sede, 2 servicios) ✅
7. Los Narcos (0 sedes) ⚠️ Sin configurar
8. Bolera la 45 (0 sedes) ⚠️ Sin configurar

---

### **👤 jlap.11@hotmail.com** (Jose Luis Avila) - OWNER SIMPLE

**1 Negocio**:
1. **Sonrisas Dental** 🦷 (2 sedes, 5 servicios, 3 empleados) ✅

---

## 👥 EMPLEADOS DE PRUEBA

### **empleado1@gestabiz.test** (Empleado Aplicante 1)
- **ID**: `5ddc3251-1e22-4b86-9bf8-15452f9ec95b`
- **Negocios**: 6
  - Centro Deportivo Arena
  - English Academy Pro
  - FitZone Gym
  - Hotel Boutique Plaza
  - La Mesa de Don Carlos
  - Sonrisas Dental
- **Uso**: Empleado multi-negocio ideal para pruebas de asignación de permisos

### **empleado10@gestabiz.test** (Empleado Aplicante 10)
- **ID**: `ec72b4d1-86e4-4658-b9e4-f3d7e6e79d09`
- **Negocios**: 4 (Centro Deportivo, English Academy, FitZone, Spa Zen Wellness)

### **empleado11@gestabiz.test** (Empleado Aplicante 11)
- **ID**: `5ac9c0a1-9e13-4f64-b9fa-811a8a4ed51d`
- **Negocios**: 6 (English Academy, FitZone, Hotel Boutique, La Mesa, Sonrisas, Yoga Shanti)

### **empleado12@gestabiz.test** (Empleado Aplicante 12)
- **ID**: `3ff7c626-c0a8-40ce-a8c3-f93df31b9db4`
- **Negocios**: 1 (Yoga Shanti)
- **Uso**: Empleado con un solo negocio - ideal para pruebas de mono-negocio

---

## 🧑‍💼 CLIENTES DE PRUEBA

### **cliente1@gestabiz.test** (Cliente Usuario 1)
- **ID**: `24d00877-685f-448e-9e34-5e362e6a97f8`
- **Citas**: 2
  - English Academy Pro (Beginner Level)
  - FitZone Gym
- **Uso**: Cliente con historial de citas - ideal para pruebas de reviews, historial

### **owner1@gestabiz.test** (Owner Usuario 1)
- **ID**: `679644e7-5543-4c28-bec2-86e8cbf7a581`
- **Citas**: 0
- **Negocios**: 0
- **Uso**: Usuario limpio para pruebas de registro de negocio, onboarding

---

## 📊 RESUMEN DE DATA DISPONIBLE

### Por Tipo de Entidad:
- ✅ **Negocios Activos**: 48 (15 con data completa)
- ✅ **Sedes Configuradas**: 100+
- ✅ **Servicios Activos**: 200+
- ✅ **Empleados Registrados**: 50+
- ✅ **Citas Confirmadas**: 10+

### Negocios Completos (2 sedes + 5 servicios):
1. English Academy Pro ⭐ (jlap-04)
2. Centro Deportivo Arena ⭐ (jlap-04)
3. Yoga Shanti ⭐ (jlap-04)
4. FitZone Gym ⭐ (jlap-04)
5. La Mesa de Don Carlos ⭐ (jlap-04)
6. Sonrisas Dental (jlap.11)
7. Hotel Boutique Plaza (jlapnnn)

---

## 🎯 RECOMENDACIONES PARA TESTING

### **PRUEBAS DE PERMISOS (Fase 1)**
- **Usuario Owner**: `jlap-04@hotmail.com` (5 negocios)
- **Negocio Principal**: English Academy Pro
- **Empleado Asignado**: empleado1@gestabiz.test (ya vinculado)
- **Escenario**: Delegación de permisos específicos

### **PRUEBAS MULTI-NEGOCIO**
- **Usuario**: `jlap-04@hotmail.com`
- **Escenarios**:
  1. Cambio entre negocios (5 opciones)
  2. Gestión de empleados en múltiples negocios
  3. Configuraciones por negocio

### **PRUEBAS DE EMPLEADO**
- **Usuario**: `empleado1@gestabiz.test` (6 negocios)
- **Escenarios**:
  1. Ver permisos asignados
  2. Intentar acciones bloqueadas
  3. Trabajar en múltiples negocios

### **PRUEBAS DE CLIENTE**
- **Usuario**: `cliente1@gestabiz.test` (2 citas)
- **Escenarios**:
  1. Reservar nueva cita
  2. Ver historial
  3. Dejar reviews

---

## 🔧 ARCHIVOS CSV LEGACY (Referencia)

### 1. `users.csv` (6 registros)
**Descripción**: Usuarios del sistema (empleados, clientes y owners)

---

### 3. `locations.csv` (8 registros)
**Descripción**: Sedes físicas de los negocios

**Campos**:
- `id`: ID de la ubicación
- `business_id`: ID del negocio al que pertenece
- `name`: Nombre de la sede
- `address`: Dirección completa
- `city`, `state`, `country`, `postal_code`: Ubicación geográfica
- `phone`: Teléfono de la sede
- `opens_at`, `closes_at`: Horarios de apertura/cierre
- `latitude`, `longitude`: Coordenadas GPS
- `is_active`: Estado activo/inactivo

**Sedes**:
- Sede Centro, Sede Norte, Sede Sur (English Academy Pro)
- Sede Poblado (Spa Belleza)
- Sede Laureles (Clínica Dental)
- Sede Envigado (Fitness Center)
- Sede Principal (Restaurante)
- Sede Sabaneta (Barbería)

---

### 4. `services.csv` (18 registros)
**Descripción**: Servicios ofrecidos por los negocios

**Campos**:
- `id`: ID del servicio
- `business_id`: ID del negocio
- `name`: Nombre del servicio
- `description`: Descripción del servicio
- `duration_minutes`: Duración en minutos
- `price`: Precio en COP
- `currency`: Moneda (COP)
- `category`: Categoría del servicio
- `is_active`: Estado activo/inactivo

**Servicios por Negocio**:
- **English Academy**: Beginner, Intermediate, Advanced, IELTS, Business English (5 servicios)
- **Spa**: Masaje, Facial, Manicure/Pedicure (3 servicios)
- **Clínica Dental**: Limpieza, Blanqueamiento, Consulta (3 servicios)
- **Fitness**: Entrenamiento Personal, Clase Grupal (2 servicios)
- **Restaurante**: Reservas mesa 2 y 4 personas (2 servicios)
- **Barbería**: Corte Clásico, Corte + Barba, Diseño Barba (3 servicios)

---

### 5. `business_employees.csv` (7 registros)
**Descripción**: Empleados vinculados a negocios

**Campos**:
- `id`: ID del registro de empleado
- `business_id`: ID del negocio
- `employee_id`: ID del usuario empleado
- `location_id`: Sede donde trabaja
- `role`: Rol en el negocio (employee, manager)
- `employee_type`: Tipo de empleado (teacher, location_manager)
- `status`: Estado (approved, pending, rejected)
- `hire_date`: Fecha de contratación
- `hourly_rate`: Tarifa por hora (COP)
- `lunch_break_start`, `lunch_break_end`: Horario de almuerzo
- `is_active`: Estado activo/inactivo
- `allow_client_messages`: Permite mensajes de clientes (true/false)

**Nota**: Empleado Aplicante 1 trabaja en English Academy Pro

---

### 6. `appointments.csv` (10 registros)
**Descripción**: Citas agendadas en el sistema

**Campos**:
- `id`: UUID de la cita
- `business_id`: ID del negocio
- `client_id`: ID del cliente
- `employee_id`: ID del empleado asignado
- `service_id`: ID del servicio
- `location_id`: Sede donde se realizará
- `start_time`, `end_time`: Fecha/hora de inicio y fin
- `status`: Estado (pending, confirmed, completed, cancelled, in_progress)
- `price`: Precio en COP
- `currency`: Moneda
- `notes`: Notas de la cita
- `created_at`: Fecha de creación

**Estados de Citas**:
- Confirmed: 4 citas
- Pending: 2 citas
- Completed: 1 cita
- Cancelled: 1 cita
- In Progress: 1 cita
- No Show: 1 cita

**Citas Importantes para Testing**:
- `8353c3cc-89ca-4f2f-87d3-fb8add63ddf9`: Cita del 19 Nov 2025 a las 14:00 (CONFIRMADA)
- `apt-002`: Cita del 20 Nov 2025 a las 11:00 (CONFIRMADA)

---

### 7. `job_vacancies.csv` (6 registros)
**Descripción**: Vacantes laborales publicadas por negocios

**Campos**:
- `id`: ID de la vacante
- `business_id`: ID del negocio
- `title`: Título del puesto
- `description`: Descripción del trabajo
- `location_id`: Sede donde se trabajará
- `employment_type`: Tipo de empleo (full_time, part_time, contract)
- `salary_min`, `salary_max`: Rango salarial (COP)
- `commission_based`: Basado en comisiones (true/false)
- `required_skills`: Habilidades requeridas (separadas por |)
- `experience_required`: Experiencia requerida (yes/no)
- `status`: Estado (open, filled, closed)
- `created_at`: Fecha de creación
- `expires_at`: Fecha de expiración

**Estados**:
- Open: 5 vacantes
- Filled: 1 vacante

---

### 8. `job_applications.csv` (5 registros)
**Descripción**: Aplicaciones de usuarios a vacantes

**Campos**:
- `id`: ID de la aplicación
- `vacancy_id`: ID de la vacante
- `applicant_id`: ID del usuario aplicante
- `status`: Estado (pending, accepted, rejected, interviewing)
- `cover_letter`: Carta de presentación
- `cv_url`: URL del CV subido
- `availability_notes`: Notas de disponibilidad
- `applied_at`: Fecha de aplicación
- `reviewed_at`: Fecha de revisión

**Estados**:
- Pending: 2 aplicaciones
- Accepted: 1 aplicación
- Rejected: 1 aplicación
- Interviewing: 1 aplicación

---

### 9. `reviews.csv` (6 registros)
**Descripción**: Calificaciones y comentarios de clientes

**Campos**:
- `id`: ID de la review
- `business_id`: ID del negocio
- `reviewer_id`: ID del usuario que califica
- `reviewed_user_id`: ID del empleado calificado (si aplica)
- `service_id`: ID del servicio calificado
- `appointment_id`: ID de la cita relacionada (si aplica)
- `rating`: Calificación (1-5 estrellas)
- `comment`: Comentario del cliente
- `review_type`: Tipo (business, employee)
- `response`: Respuesta del negocio
- `is_visible`: Visible públicamente (true/false)
- `created_at`: Fecha de creación
- `responded_at`: Fecha de respuesta

**Ratings**:
- 5 estrellas: 4 reviews
- 4 estrellas: 1 review
- 3 estrellas: 1 review

---

### 10. `in_app_notifications.csv` (6 registros)
**Descripción**: Notificaciones in-app del sistema

**Campos**:
- `id`: ID de la notificación
- `user_id`: ID del usuario destinatario
- `type`: Tipo de notificación (appointment_confirmed, job_application_received, etc.)
- `title`: Título de la notificación
- `data`: Datos en formato JSON
- `is_read`: Leída (true/false)
- `created_at`: Fecha de creación

**Tipos de Notificaciones**:
- appointment_confirmed
- appointment_reminder
- job_application_received
- job_application_status_changed
- employee_request_received

---

### 11. `employee_absences.csv` (5 registros)
**Descripción**: Solicitudes de ausencias y vacaciones

**Campos**:
- `id`: ID de la ausencia
- `business_id`: ID del negocio
- `employee_id`: ID del empleado
- `absence_type`: Tipo (vacation, sick_leave, personal, emergency, other)
- `start_date`, `end_date`: Rango de fechas
- `reason`: Razón de la ausencia
- `status`: Estado (pending, approved, rejected)
- `approved_by`: ID de quien aprobó
- `approved_at`: Fecha de aprobación
- `created_at`: Fecha de creación

**Estados**:
- Approved: 4 ausencias
- Pending: 1 ausencia

---

## 🔐 Credenciales de Acceso

### Usuarios de Prueba

| Email | Contraseña | Rol | Descripción |
|-------|-----------|-----|-------------|
| `empleado1@gestabiz.test` | `TestPassword123!` | Employee | Empleado principal de pruebas |
| `cliente1@gestabiz.test` | `TestPassword123!` | Client | Cliente 1 |
| `cliente10@gestabiz.test` | `TestPassword123!` | Client | Cliente 10 |
| `owner1@gestabiz.test` | `TestPassword123!` | Admin | Owner English Academy |
| `owner2@gestabiz.test` | `TestPassword123!` | Admin | Owner Spa Belleza |
| `owner3@gestabiz.test` | `TestPassword123!` | Admin | Owner Clínica Dental |

---

## 📊 Estadísticas de Data

- **Total Usuarios**: 6
- **Total Negocios**: 6
- **Total Sedes**: 8
- **Total Servicios**: 18
- **Total Empleados Vinculados**: 7
- **Total Citas**: 10
- **Total Vacantes**: 6
- **Total Aplicaciones**: 5
- **Total Reviews**: 6
- **Total Notificaciones**: 6
- **Total Ausencias**: 5

---

## 💡 Uso de los Archivos

### Importación a Base de Datos

Estos archivos pueden ser importados directamente a Supabase usando:

```sql
-- Ejemplo para importar usuarios
COPY profiles(id, email, name, phone, created_at)
FROM 'path/to/users.csv'
DELIMITER ','
CSV HEADER;
```

### Análisis de Datos

Los CSVs son compatibles con:
- Excel / Google Sheets
- Pandas (Python)
- R / RStudio
- Power BI / Tableau
- Cualquier herramienta que soporte CSV

---

## ⚠️ Notas Importantes

1. **IDs Reales**: Todos los IDs son UUIDs reales generados durante las pruebas
2. **Fechas**: Las fechas son reales y reflejan el timeline de desarrollo
3. **Precios**: Todos los precios están en pesos colombianos (COP)
4. **Horarios**: Los horarios están en formato 24h (HH:MM:SS)
5. **Estado**: Todos los datos reflejan el estado actual del sistema de pruebas

---

## 🔄 Actualización

Para actualizar estos archivos con datos más recientes:

1. Conectarse a la base de datos de desarrollo
2. Ejecutar queries SQL para exportar las tablas
3. Guardar como CSV con codificación UTF-8
4. Actualizar este README con las nuevas estadísticas

---

**Generado por**: Sistema Gestabiz  
**Última actualización**: 16 de noviembre de 2025  
**Versión del Sistema**: Beta 1.0
