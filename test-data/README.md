# Test Data CSV Files - Gestabiz

**Fecha de generación**: 16 de noviembre de 2025  
**Propósito**: Datos de prueba generados durante el desarrollo y testing del sistema

---

## 📋 Archivos Incluidos

### 1. `users.csv` (6 registros)
**Descripción**: Usuarios del sistema (empleados, clientes y owners)

**Campos**:
- `id`: UUID del usuario
- `email`: Email de login
- `name`: Nombre completo
- `phone`: Teléfono de contacto
- `created_at`: Fecha de creación
- `role_type`: Tipo de rol (employee, client, admin)

**Usuarios de Prueba**:
- `empleado1@gestabiz.test` - Empleado principal de pruebas
- `cliente1@gestabiz.test` - Cliente 1
- `cliente10@gestabiz.test` - Cliente 10
- `owner1@gestabiz.test` - Owner de English Academy Pro
- `owner2@gestabiz.test` - Owner de Spa Belleza
- `owner3@gestabiz.test` - Owner de Clínica Dental

---

### 2. `businesses.csv` (6 registros)
**Descripción**: Negocios creados en el sistema

**Campos**:
- `id`: UUID del negocio
- `name`: Nombre del negocio
- `owner_id`: ID del propietario
- `category`: Categoría del negocio
- `description`: Descripción breve
- `phone`, `email`, `website`: Datos de contacto
- `created_at`: Fecha de creación
- `is_active`: Estado activo/inactivo

**Negocios**:
1. **English Academy Pro** (Educación)
2. **Spa Belleza Total** (Wellness)
3. **Clínica Dental Sonrisa** (Salud)
4. **Fitness Center Pro** (Deportes)
5. **Restaurante El Sabor** (Comida)
6. **Barbería Moderna** (Grooming)

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
