# Plan Estratégico de Implementación - Sistema de Vacantes Laborales
## AppointSync Pro - Octubre 2025

**Fecha**: 17 de Octubre de 2025  
**Versión**: 1.0  
**Autor**: Equipo Técnico AppointSync Pro

---

## 🧭 Objetivo General

Implementar un sistema integral de vacantes laborales que permita:
- Administradores: crear, reutilizar y gestionar vacantes vinculadas a sus negocios.
- Empleados: descubrir vacantes relevantes según sus habilidades y disponibilidad.
- Clientes: calificar obligatoriamente cada servicio, generando métricas precisas para la selección de personal.
- Plataforma: mantener consistencia de datos, evitar cruces de horarios y notificar oportunamente a todas las partes.

---

## 📅 Plan de Trabajo por Fases

### Fase 0 · Preparación (1 día)

| Paso | Descripción | Responsable | Duración |
|------|-------------|-------------|----------|
| 0.1 | Revisar documentación y alcance con stakeholders | Líder Técnico | 0.5d |
| 0.2 | Crear branch `feature/job-vacancies` | Dev | 0.1d |
| 0.3 | Auditar migraciones y estado actual de tablas `job_vacancies` / `job_applications` | Dev | 0.2d |
| 0.4 | Configurar feature flags (AmbientConfig / supabase.functions) | DevOps | 0.2d |

> **Criterio de salida**: Rama de trabajo creada, documentación alineada, restricciones identificadas.

---

### Fase 1 · Modelado de Datos y Migraciones (2 días)

#### 1.1 Modificar tabla `reviews` (0.4d)

**Objetivo**: Permitir ratings decimales y reviews separadas por tipo.

**Script de migración** (`20251017000000_reviews_decimal_ratings.sql`):
```sql
-- 1. Cambiar rating de INTEGER a NUMERIC(2,1)
ALTER TABLE reviews
ALTER COLUMN rating TYPE NUMERIC(2,1);

-- 2. Agregar constraint de rango
ALTER TABLE reviews
DROP CONSTRAINT IF EXISTS reviews_rating_check;

ALTER TABLE reviews
ADD CONSTRAINT reviews_rating_check 
CHECK (rating >= 1.0 AND rating <= 5.0);

-- 3. Agregar campo review_type
ALTER TABLE reviews
ADD COLUMN review_type varchar(20) CHECK (review_type IN ('business', 'employee'));

-- 4. Eliminar constraint UNIQUE de appointment_id
ALTER TABLE reviews
DROP CONSTRAINT IF EXISTS reviews_appointment_id_key;

-- 5. Crear índice compuesto UNIQUE
CREATE UNIQUE INDEX idx_reviews_appointment_type 
ON reviews(appointment_id, review_type);

-- 6. Actualizar reviews existentes (migración de datos)
UPDATE reviews
SET review_type = 'business'
WHERE review_type IS NULL;

-- 7. Hacer review_type NOT NULL
ALTER TABLE reviews
ALTER COLUMN review_type SET NOT NULL;

-- 8. Crear índices para performance
CREATE INDEX idx_reviews_employee_rating ON reviews(employee_id, rating) 
WHERE employee_id IS NOT NULL AND is_visible = true;

CREATE INDEX idx_reviews_business_rating ON reviews(business_id, rating) 
WHERE is_visible = true;
```

**Validaciones post-migración**:
```sql
-- Verificar que no hay duplicados
SELECT appointment_id, review_type, COUNT(*) 
FROM reviews 
GROUP BY appointment_id, review_type 
HAVING COUNT(*) > 1;

-- Verificar rangos
SELECT COUNT(*) FROM reviews WHERE rating < 1.0 OR rating > 5.0;
```

#### 1.2 Actualizar tabla `job_vacancies` (0.3d)

**Script de migración** (`20251017000001_job_vacancies_enhancements.sql`):
```sql
-- 1. Agregar campos de horario
ALTER TABLE job_vacancies
ADD COLUMN work_schedule jsonb;

-- Estructura esperada:
-- {
--   "monday": {"open": "08:00", "close": "17:00", "closed": false},
--   "tuesday": {"open": "08:00", "close": "17:00", "closed": false},
--   ...
-- }

-- 2. Agregar número de posiciones
ALTER TABLE job_vacancies
ADD COLUMN number_of_positions integer DEFAULT 1 CHECK (number_of_positions >= 1);

-- 3. Verificar que required_services y preferred_services existen
-- Si no existen, crearlos:
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'job_vacancies' AND column_name = 'required_services'
  ) THEN
    ALTER TABLE job_vacancies
    ADD COLUMN required_services uuid[];
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'job_vacancies' AND column_name = 'preferred_services'
  ) THEN
    ALTER TABLE job_vacancies
    ADD COLUMN preferred_services uuid[];
  END IF;
END $$;

-- 4. Crear función de validación de work_schedule
CREATE OR REPLACE FUNCTION validate_work_schedule(schedule jsonb)
RETURNS boolean AS $$
DECLARE
  day text;
  days text[] := ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
BEGIN
  IF schedule IS NULL THEN
    RETURN true; -- Horario flexible/remoto
  END IF;
  
  FOREACH day IN ARRAY days LOOP
    IF NOT (schedule ? day) THEN
      RETURN false; -- Falta un día
    END IF;
    
    IF NOT (schedule->day ? 'open' AND schedule->day ? 'close' AND schedule->day ? 'closed') THEN
      RETURN false; -- Estructura inválida
    END IF;
  END LOOP;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 5. Agregar constraint de validación
ALTER TABLE job_vacancies
ADD CONSTRAINT valid_work_schedule 
CHECK (validate_work_schedule(work_schedule));

-- 6. Crear índices
CREATE INDEX idx_job_vacancies_status_active 
ON job_vacancies(business_id, status) 
WHERE status = 'open' AND expires_at > NOW();

CREATE INDEX idx_job_vacancies_services 
ON job_vacancies USING GIN (required_services) 
WHERE required_services IS NOT NULL;
```

#### 1.3 Crear tabla `employee_profiles` (0.5d)

**Script de migración** (`20251017000002_employee_profiles.sql`):
```sql
-- 1. Crear tabla
CREATE TABLE employee_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Información profesional
  professional_summary text,
  years_of_experience integer CHECK (years_of_experience >= 0),
  
  -- Certificaciones y títulos
  certifications jsonb, -- [{name, issuer, date, expires_at, credential_id, url}]
  specializations text[],
  languages text[], -- ['es', 'en', 'fr']
  
  -- Disponibilidad
  availability_hours jsonb, -- Mismo formato que work_schedule
  
  -- Enlaces externos
  portfolio_url text,
  linkedin_url text,
  github_url text,
  other_links jsonb, -- [{name, url}]
  
  -- Preferencias laborales
  preferred_work_types text[], -- ['full_time', 'part_time', 'freelance']
  min_salary_expectation numeric,
  max_commute_distance integer, -- km
  willing_to_relocate boolean DEFAULT false,
  
  -- Metadata
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- 2. Índices
CREATE INDEX idx_employee_profiles_user ON employee_profiles(user_id);
CREATE INDEX idx_employee_profiles_experience ON employee_profiles(years_of_experience);

-- 3. Trigger para updated_at
CREATE TRIGGER update_employee_profiles_updated_at
BEFORE UPDATE ON employee_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 4. RLS Policies
ALTER TABLE employee_profiles ENABLE ROW LEVEL SECURITY;

-- Usuario puede ver y editar su propio perfil
CREATE POLICY employee_profiles_own_data 
ON employee_profiles
FOR ALL
USING (auth.uid() = user_id);

-- Admins pueden ver perfiles de aplicantes a sus vacantes
CREATE POLICY employee_profiles_admin_view
ON employee_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM job_applications ja
    JOIN job_vacancies jv ON ja.vacancy_id = jv.id
    JOIN businesses b ON jv.business_id = b.id
    WHERE ja.user_id = employee_profiles.user_id
      AND b.owner_id = auth.uid()
  )
);

-- 5. Función para calcular métricas de perfil
CREATE OR REPLACE FUNCTION get_employee_profile_metrics(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'average_rating', COALESCE(AVG(r.rating), 0),
    'total_reviews', COUNT(DISTINCT r.id),
    'total_appointments_completed', (
      SELECT COUNT(*) FROM appointments 
      WHERE employee_id = p_user_id AND status = 'completed'
    ),
    'total_revenue_generated', (
      SELECT COALESCE(SUM(price), 0) FROM appointments
      WHERE employee_id = p_user_id AND status = 'completed'
    ),
    'businesses_worked_count', (
      SELECT COUNT(DISTINCT business_id) FROM business_employees
      WHERE employee_id = p_user_id
    ),
    'services_offered_count', (
      SELECT COUNT(DISTINCT service_id) FROM employee_services
      WHERE employee_id = p_user_id AND is_active = true
    )
  ) INTO result
  FROM reviews r
  WHERE r.employee_id = p_user_id
    AND r.review_type = 'employee'
    AND r.is_visible = true
  ORDER BY r.created_at DESC
  LIMIT 100; -- Últimas 100 reviews
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

#### 1.4 Trigger de notificación de aplicación (0.3d)

**Script de migración** (`20251017000003_job_application_triggers.sql`):
```sql
-- 1. Función para notificar nueva aplicación
CREATE OR REPLACE FUNCTION notify_application_received()
RETURNS TRIGGER AS $$
DECLARE
  vacancy_title text;
  business_name text;
  owner_id uuid;
  applicant_name text;
  applicant_email text;
BEGIN
  -- Obtener datos de la vacante y negocio
  SELECT 
    jv.title, 
    b.name, 
    b.owner_id,
    p.full_name,
    p.email
  INTO 
    vacancy_title, 
    business_name, 
    owner_id,
    applicant_name,
    applicant_email
  FROM job_vacancies jv
  JOIN businesses b ON jv.business_id = b.id
  JOIN profiles p ON p.id = NEW.user_id
  WHERE jv.id = NEW.vacancy_id;
  
  -- Crear notificación in-app
  INSERT INTO in_app_notifications (
    user_id, 
    type, 
    title, 
    message, 
    data, 
    priority,
    action_url
  ) VALUES (
    owner_id,
    'job_application_received',
    '📋 Nueva aplicación recibida',
    applicant_name || ' ha aplicado a tu vacante: ' || vacancy_title,
    jsonb_build_object(
      'application_id', NEW.id,
      'vacancy_id', NEW.vacancy_id,
      'applicant_id', NEW.user_id,
      'applicant_name', applicant_name,
      'applicant_email', applicant_email,
      'business_name', business_name,
      'vacancy_title', vacancy_title
    ),
    'high',
    '/admin/recruitment/applications/' || NEW.id::text
  );
  
  -- TODO: Encolar email (implementar en Edge Function)
  -- La Edge Function send-notification debe escuchar estos eventos
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger en job_applications
DROP TRIGGER IF EXISTS on_application_created ON job_applications;
CREATE TRIGGER on_application_created
AFTER INSERT ON job_applications
FOR EACH ROW
EXECUTE FUNCTION notify_application_received();

-- 3. Función para notificar cambio de estado
CREATE OR REPLACE FUNCTION notify_application_status_change()
RETURNS TRIGGER AS $$
DECLARE
  vacancy_title text;
  business_name text;
BEGIN
  -- Solo notificar si el estado cambió
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Obtener datos
  SELECT jv.title, b.name
  INTO vacancy_title, business_name
  FROM job_vacancies jv
  JOIN businesses b ON jv.business_id = b.id
  WHERE jv.id = NEW.vacancy_id;
  
  -- Notificar al aplicante
  IF NEW.status = 'accepted' THEN
    INSERT INTO in_app_notifications (
      user_id, type, title, message, data, priority
    ) VALUES (
      NEW.user_id,
      'job_application_accepted',
      '🎉 ¡Aplicación aceptada!',
      'Tu aplicación a "' || vacancy_title || '" en ' || business_name || ' ha sido aceptada',
      jsonb_build_object(
        'application_id', NEW.id,
        'vacancy_id', NEW.vacancy_id,
        'business_name', business_name
      ),
      'high'
    );
  ELSIF NEW.status = 'rejected' THEN
    INSERT INTO in_app_notifications (
      user_id, type, title, message, data, priority
    ) VALUES (
      NEW.user_id,
      'job_application_rejected',
      'Actualización de aplicación',
      'Tu aplicación a "' || vacancy_title || '" no fue seleccionada',
      jsonb_build_object(
        'application_id', NEW.id,
        'vacancy_id', NEW.vacancy_id
      ),
      'medium'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger para cambios de estado
DROP TRIGGER IF EXISTS on_application_status_changed ON job_applications;
CREATE TRIGGER on_application_status_changed
AFTER UPDATE OF status ON job_applications
FOR EACH ROW
EXECUTE FUNCTION notify_application_status_change();

-- 5. Incrementar contador de aplicaciones en vacante
CREATE OR REPLACE FUNCTION update_vacancy_applications_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE job_vacancies
    SET applications_count = applications_count + 1
    WHERE id = NEW.vacancy_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE job_vacancies
    SET applications_count = GREATEST(0, applications_count - 1)
    WHERE id = OLD.vacancy_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_vacancy_applications_count_trigger ON job_applications;
CREATE TRIGGER update_vacancy_applications_count_trigger
AFTER INSERT OR DELETE ON job_applications
FOR EACH ROW
EXECUTE FUNCTION update_vacancy_applications_count();
```

#### 1.5 Script de migración de datos (0.5d)

**Script** (`migrate_existing_reviews.sql`):
```sql
-- Verificar reviews existentes sin review_type
SELECT COUNT(*) FROM reviews WHERE review_type IS NULL;

-- Crear backups
CREATE TABLE reviews_backup_20251017 AS SELECT * FROM reviews;

-- Migrar reviews existentes como 'business'
UPDATE reviews
SET review_type = 'business'
WHERE review_type IS NULL;

-- Verificar integridad
DO $$
DECLARE
  duplicate_count integer;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT appointment_id, review_type, COUNT(*) as cnt
    FROM reviews
    GROUP BY appointment_id, review_type
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count > 0 THEN
    RAISE EXCEPTION 'Se encontraron % reviews duplicadas', duplicate_count;
  END IF;
END $$;

-- Generar reporte de migración
SELECT 
  'Total reviews migradas' as descripcion,
  COUNT(*) as cantidad
FROM reviews
WHERE review_type = 'business'
UNION ALL
SELECT 
  'Reviews con employee_id' as descripcion,
  COUNT(*) as cantidad
FROM reviews
WHERE employee_id IS NOT NULL;
```

> **Salidas**: 
> - 5 archivos de migración SQL en `supabase/migrations/`
> - Backup de tabla `reviews_backup_20251017`
> - Script de rollback por si falla
> - Documento de validación post-migración

---

### Fase 2 · Backend y Hooks de Datos (2.5 días)

#### 2.1 Hook `useJobVacancies` (0.5d)

**Ubicación**: `src/hooks/useJobVacancies.ts`

**Interfaz y funcionalidad**:
```typescript
interface UseJobVacanciesOptions {
  businessId: string
  status?: 'open' | 'paused' | 'closed' | 'filled' | 'all'
  includeExpired?: boolean
}

interface UseJobVacanciesResult {
  vacancies: JobVacancy[]
  loading: boolean
  error: Error | null
  stats: {
    total: number
    open: number
    filled: number
    avg_applications: number
  }
  
  // CRUD operations
  createVacancy: (data: CreateVacancyInput) => Promise<JobVacancy>
  updateVacancy: (id: string, data: Partial<JobVacancy>) => Promise<void>
  deleteVacancy: (id: string) => Promise<void>
  duplicateVacancy: (id: string) => Promise<JobVacancy>
  
  // State management
  pauseVacancy: (id: string) => Promise<void>
  reopenVacancy: (id: string) => Promise<void>
  closeVacancy: (id: string, reason?: string) => Promise<void>
  markAsFilled: (id: string, hiredApplicantId: string) => Promise<void>
  
  // Utility
  incrementViews: (id: string) => Promise<void>
  refetch: () => Promise<void>
}

export function useJobVacancies(options: UseJobVacanciesOptions): UseJobVacanciesResult
```

**Queries clave**:
```typescript
// Fetch vacancies con joins
const query = supabase
  .from('job_vacancies')
  .select(`
    *,
    locations(id, name, city, address),
    businesses(id, name, logo_url, owner_id),
    required_services:services!job_vacancies_required_services_fkey(id, name, duration_minutes),
    preferred_services:services!job_vacancies_preferred_services_fkey(id, name, duration_minutes)
  `)
  .eq('business_id', businessId)
  
if (status !== 'all') {
  query.eq('status', status)
}

if (!includeExpired) {
  query.or('expires_at.is.null,expires_at.gt.now()')
}

query.order('created_at', { ascending: false })
```

**Realtime subscription**:
```typescript
useEffect(() => {
  const channel = supabase
    .channel(`job_vacancies_${businessId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'job_vacancies',
        filter: `business_id=eq.${businessId}`
      },
      (payload) => {
        handleRealtimeUpdate(payload)
      }
    )
    .subscribe()
    
  return () => {
    supabase.removeChannel(channel)
  }
}, [businessId])
```

#### 2.2 Hook `useJobApplications` (0.5d)

**Ubicación**: `src/hooks/useJobApplications.ts`

**Funcionalidad**:
```typescript
interface UseJobApplicationsOptions {
  userId?: string // Para empleado ver sus aplicaciones
  vacancyId?: string // Para admin ver aplicaciones de una vacante
  businessId?: string // Para admin ver todas las aplicaciones del negocio
}

interface UseJobApplicationsResult {
  applications: JobApplicationWithDetails[]
  loading: boolean
  error: Error | null
  stats: {
    total: number
    pending: number
    reviewing: number
    interview: number
    accepted: number
    rejected: number
  }
  
  // Employee actions
  applyToVacancy: (vacancyId: string, data: ApplicationData) => Promise<JobApplication>
  withdrawApplication: (applicationId: string) => Promise<void>
  
  // Admin actions
  reviewApplication: (applicationId: string, notes: string) => Promise<void>
  acceptApplication: (applicationId: string) => Promise<void>
  rejectApplication: (applicationId: string, reason?: string) => Promise<void>
  scheduleInterview: (applicationId: string, datetime: string) => Promise<void>
  rateApplicant: (applicationId: string, rating: number, notes?: string) => Promise<void>
  
  refetch: () => Promise<void>
}
```

**Query con joins complejos**:
```typescript
const { data, error } = await supabase
  .from('job_applications')
  .select(`
    *,
    job_vacancies(
      *,
      locations(name, city),
      businesses(name, logo_url, owner_id)
    ),
    profiles!job_applications_user_id_fkey(
      id,
      full_name,
      email,
      avatar_url,
      phone
    ),
    employee_profiles(
      professional_summary,
      years_of_experience,
      certifications,
      specializations
    )
  `)
  .eq(filterKey, filterValue)
  .order('created_at', { ascending: false })
```

**Validaciones antes de aplicar**:
```typescript
const applyToVacancy = async (vacancyId: string, data: ApplicationData) => {
  // 1. Verificar que no haya aplicado antes
  const { data: existing } = await supabase
    .from('job_applications')
    .select('id')
    .eq('vacancy_id', vacancyId)
    .eq('user_id', userId)
    .single()
  
  if (existing) {
    throw new Error('Ya has aplicado a esta vacante')
  }
  
  // 2. Verificar que la vacante esté abierta
  const { data: vacancy } = await supabase
    .from('job_vacancies')
    .select('status, expires_at')
    .eq('id', vacancyId)
    .single()
  
  if (vacancy.status !== 'open') {
    throw new Error('Esta vacante ya no está disponible')
  }
  
  if (vacancy.expires_at && new Date(vacancy.expires_at) < new Date()) {
    throw new Error('Esta vacante ha expirado')
  }
  
  // 3. Crear aplicación
  const { data: application, error } = await supabase
    .from('job_applications')
    .insert({
      vacancy_id: vacancyId,
      user_id: userId,
      business_id: vacancy.business_id,
      status: 'pending',
      cover_letter: data.coverLetter,
      available_from: data.availableFrom,
      availability_notes: data.availabilityNotes
    })
    .select()
    .single()
  
  if (error) throw error
  
  toast.success('Aplicación enviada exitosamente')
  return application
}
```

#### 2.3 Hook `usePendingReviews` (0.4d)

**Ubicación**: `src/hooks/usePendingReviews.ts`

**Funcionalidad**:
```typescript
interface UsePendingReviewsResult {
  pendingAppointments: AppointmentWithDetails[]
  loading: boolean
  hasPendingReviews: boolean
  oldestPending: AppointmentWithDetails | null
  
  // Actions
  checkPendingReviews: () => Promise<AppointmentWithDetails[]>
  dismissReminder: (appointmentId: string, duration: number) => void // minutos
  clearAllReminders: () => void
}

export function usePendingReviews(userId: string): UsePendingReviewsResult
```

**Query para detectar citas sin review**:
```typescript
const { data: pendingAppointments } = await supabase
  .from('appointments')
  .select(`
    *,
    services(name, duration_minutes),
    businesses(name, logo_url),
    profiles!appointments_employee_id_fkey(full_name, avatar_url)
  `)
  .eq('client_id', userId)
  .eq('status', 'completed')
  .is('reviews.id', null) // LEFT JOIN donde no existe review
  .order('end_time', { ascending: true })

// Filtrar los que no tienen NINGUNA review (ni business ni employee)
const reallyPending = pendingAppointments.filter(apt => {
  const hasBusinessReview = reviews.some(
    r => r.appointment_id === apt.id && r.review_type === 'business'
  )
  const hasEmployeeReview = reviews.some(
    r => r.appointment_id === apt.id && r.review_type === 'employee'
  )
  return !hasBusinessReview || !hasEmployeeReview
})
```

**Persistencia de recordatorios**:
```typescript
// localStorage para "Recordar más tarde"
interface ReviewReminder {
  appointmentId: string
  dismissedAt: number
  dismissedUntil: number
}

const dismissReminder = (appointmentId: string, duration: number) => {
  const reminders: ReviewReminder[] = JSON.parse(
    localStorage.getItem('review_reminders') || '[]'
  )
  
  reminders.push({
    appointmentId,
    dismissedAt: Date.now(),
    dismissedUntil: Date.now() + duration * 60 * 1000
  })
  
  localStorage.setItem('review_reminders', JSON.stringify(reminders))
}

// Filtrar dismissed
const filterDismissed = (appointments: Appointment[]) => {
  const reminders: ReviewReminder[] = JSON.parse(
    localStorage.getItem('review_reminders') || '[]'
  )
  
  const now = Date.now()
  
  return appointments.filter(apt => {
    const reminder = reminders.find(r => r.appointmentId === apt.id)
    return !reminder || reminder.dismissedUntil < now
  })
}
```

#### 2.4 Hook `useEmployeeProfile` (0.5d)

**Ubicación**: `src/hooks/useEmployeeProfile.ts`

**Funcionalidad**:
```typescript
interface UseEmployeeProfileResult {
  profile: EmployeeProfileExtended | null
  loading: boolean
  error: Error | null
  
  // Métricas calculadas
  metrics: {
    average_rating: number
    total_reviews: number
    total_appointments_completed: number
    total_revenue_generated: number
    businesses_worked_count: number
    services_offered_count: number
  }
  
  // Historial laboral
  employmentHistory: {
    business_name: string
    job_title: string
    hire_date: string
    termination_date: string | null
    is_active: boolean
    location_name: string
  }[]
  
  // Reviews recientes
  recentReviews: Review[]
  
  // Actions
  updateProfile: (data: Partial<EmployeeProfile>) => Promise<void>
  addCertification: (cert: Certification) => Promise<void>
  removeCertification: (index: number) => Promise<void>
  
  refetch: () => Promise<void>
}
```

**Query compleja**:
```typescript
// 1. Perfil base
const { data: profile } = await supabase
  .from('employee_profiles')
  .select('*')
  .eq('user_id', userId)
  .single()

// 2. Métricas usando RPC
const { data: metrics } = await supabase
  .rpc('get_employee_profile_metrics', { p_user_id: userId })

// 3. Historial laboral
const { data: employment } = await supabase
  .from('business_employees')
  .select(`
    job_title,
    hire_date,
    termination_date,
    is_active,
    businesses(name),
    locations(name)
  `)
  .eq('employee_id', userId)
  .order('hire_date', { ascending: false })

// 4. Reviews recientes (últimas 100)
const { data: reviews } = await supabase
  .from('reviews')
  .select(`
    *,
    appointments(
      start_time,
      services(name)
    )
  `)
  .eq('employee_id', userId)
  .eq('review_type', 'employee')
  .eq('is_visible', true)
  .order('created_at', { ascending: false })
  .limit(100)
```

#### 2.5 Hook `useScheduleConflicts` (0.3d)

**Ubicación**: `src/hooks/useScheduleConflicts.ts`

**Funcionalidad**:
```typescript
interface ScheduleConflict {
  hasConflict: boolean
  conflictingDays: string[]
  conflictingBusinesses: {
    business_name: string
    schedule: BusinessHours
    overlap_hours: { day: string, start: string, end: string }[]
  }[]
  message: string
}

interface UseScheduleConflictsResult {
  checkConflict: (newSchedule: BusinessHours) => Promise<ScheduleConflict>
  loading: boolean
}

export function useScheduleConflicts(userId: string): UseScheduleConflictsResult
```

**Algoritmo de detección**:
```typescript
const checkConflict = async (newSchedule: BusinessHours): Promise<ScheduleConflict> => {
  // 1. Obtener empleos activos del usuario
  const { data: employments } = await supabase
    .from('business_employees')
    .select(`
      business_id,
      businesses(name, business_hours)
    `)
    .eq('employee_id', userId)
    .eq('is_active', true)
    .is('termination_date', null)
  
  const conflicts: ScheduleConflict = {
    hasConflict: false,
    conflictingDays: [],
    conflictingBusinesses: [],
    message: ''
  }
  
  // 2. Comparar horarios
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  
  for (const employment of employments) {
    const currentSchedule = employment.businesses.business_hours
    const overlaps: any[] = []
    
    for (const day of days) {
      const current = currentSchedule[day]
      const newDay = newSchedule[day]
      
      // Si ambos días están abiertos
      if (!current.closed && !newDay.closed) {
        const currentStart = parseTime(current.open)
        const currentEnd = parseTime(current.close)
        const newStart = parseTime(newDay.open)
        const newEnd = parseTime(newDay.close)
        
        // Detectar overlap: newStart < currentEnd AND newEnd > currentStart
        if (newStart < currentEnd && newEnd > currentStart) {
          conflicts.hasConflict = true
          conflicts.conflictingDays.push(day)
          
          // Calcular ventana de conflicto
          const overlapStart = Math.max(currentStart, newStart)
          const overlapEnd = Math.min(currentEnd, newEnd)
          
          overlaps.push({
            day,
            start: formatTime(overlapStart),
            end: formatTime(overlapEnd)
          })
        }
      }
    }
    
    if (overlaps.length > 0) {
      conflicts.conflictingBusinesses.push({
        business_name: employment.businesses.name,
        schedule: currentSchedule,
        overlap_hours: overlaps
      })
    }
  }
  
  // 3. Generar mensaje descriptivo
  if (conflicts.hasConflict) {
    const businessNames = conflicts.conflictingBusinesses.map(b => b.business_name).join(', ')
    const dayList = [...new Set(conflicts.conflictingDays)].join(', ')
    conflicts.message = `Hay conflicto de horario con tu empleo actual en: ${businessNames}. Días: ${dayList}`
  }
  
  return conflicts
}

// Helpers
function parseTime(timeStr: string): number {
  // "08:30" -> 8.5 (horas decimales)
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours + minutes / 60
}

function formatTime(decimal: number): string {
  const hours = Math.floor(decimal)
  const minutes = Math.round((decimal - hours) * 60)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}
```

#### 2.6 RPC Function `get_matching_vacancies` (0.3d)

**Ubicación**: `supabase/migrations/20251017000004_rpc_matching_vacancies.sql`

```sql
CREATE OR REPLACE FUNCTION get_matching_vacancies(
  p_user_id uuid,
  p_city text DEFAULT NULL,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  vacancy_id uuid,
  business_id uuid,
  business_name text,
  business_logo_url text,
  title text,
  description text,
  position_type text,
  salary_min numeric,
  salary_max numeric,
  currency text,
  location_id uuid,
  location_name text,
  location_city text,
  remote_allowed boolean,
  required_services uuid[],
  preferred_services uuid[],
  status text,
  published_at timestamptz,
  expires_at timestamptz,
  applications_count integer,
  match_score numeric -- Score de relevancia (0-100)
) AS $$
BEGIN
  RETURN QUERY
  WITH user_services AS (
    -- Servicios que ofrece el usuario
    SELECT ARRAY_AGG(DISTINCT service_id) as service_ids
    FROM employee_services
    WHERE employee_id = p_user_id
      AND is_active = true
  ),
  user_profile AS (
    -- Perfil del usuario (ciudad)
    SELECT 
      COALESCE(ep.availability_hours, '{}'::jsonb) as availability,
      COALESCE(p.settings->>'city', '') as user_city
    FROM profiles p
    LEFT JOIN employee_profiles ep ON ep.user_id = p.id
    WHERE p.id = p_user_id
  )
  SELECT 
    jv.id as vacancy_id,
    jv.business_id,
    b.name as business_name,
    b.logo_url as business_logo_url,
    jv.title,
    jv.description,
    jv.position_type,
    jv.salary_min,
    jv.salary_max,
    jv.currency,
    jv.location_id,
    l.name as location_name,
    l.city as location_city,
    jv.remote_allowed,
    jv.required_services,
    jv.preferred_services,
    jv.status,
    jv.published_at,
    jv.expires_at,
    jv.applications_count,
    -- Calcular match score
    (
      -- Base: 20 puntos si está en la misma ciudad
      (CASE 
        WHEN jv.remote_allowed THEN 20
        WHEN l.city = up.user_city THEN 20
        ELSE 0
      END) +
      -- 40 puntos si cumple servicios requeridos
      (CASE 
        WHEN jv.required_services IS NULL THEN 20
        WHEN jv.required_services && us.service_ids THEN 40
        ELSE 0
      END) +
      -- 20 puntos si tiene servicios preferidos
      (CASE 
        WHEN jv.preferred_services IS NULL THEN 10
        WHEN jv.preferred_services && us.service_ids THEN 20
        ELSE 0
      END) +
      -- 20 puntos por antigüedad (más nuevas = más score)
      (CASE 
        WHEN jv.published_at > NOW() - INTERVAL '7 days' THEN 20
        WHEN jv.published_at > NOW() - INTERVAL '14 days' THEN 15
        WHEN jv.published_at > NOW() - INTERVAL '30 days' THEN 10
        ELSE 5
      END)
    )::numeric as match_score
  FROM job_vacancies jv
  JOIN businesses b ON jv.business_id = b.id
  LEFT JOIN locations l ON jv.location_id = l.id
  CROSS JOIN user_services us
  CROSS JOIN user_profile up
  WHERE jv.status = 'open'
    AND (jv.expires_at IS NULL OR jv.expires_at > NOW())
    -- Filtro opcional por ciudad
    AND (p_city IS NULL OR l.city ILIKE '%' || p_city || '%' OR jv.remote_allowed = true)
    -- No mostrar vacantes a las que ya aplicó
    AND NOT EXISTS (
      SELECT 1 FROM job_applications ja
      WHERE ja.vacancy_id = jv.id
        AND ja.user_id = p_user_id
    )
  ORDER BY match_score DESC, jv.published_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Índices para optimizar la función
CREATE INDEX IF NOT EXISTS idx_job_vacancies_status_expires 
ON job_vacancies(status, expires_at) 
WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_employee_services_user_active 
ON employee_services(employee_id, is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_job_applications_user_vacancy 
ON job_applications(user_id, vacancy_id);
```

> **Salidas**:
> - 6 hooks TypeScript completamente tipados
> - 1 función RPC SQL optimizada
> - Tests unitarios con Vitest (coverage ≥80%)
> - Actualización de `src/types/types.ts` con nuevas interfaces

---

### Fase 3 · UI Admin (3 días)

#### 3.1 Agregar sección "Reclutamiento" en AdminDashboard (0.4d)

**Archivos a modificar**:
- `src/components/admin/AdminDashboard.tsx`

**Cambios**:
```typescript
// Agregar al array sidebarItems
const sidebarItems = [
  { id: 'overview', label: 'Resumen', icon: <LayoutDashboard /> },
  { id: 'locations', label: 'Sedes', icon: <MapPin /> },
  { id: 'services', label: 'Servicios', icon: <Briefcase /> },
  { id: 'employees', label: 'Empleados', icon: <Users /> },
  // ⭐ NUEVO
  { 
    id: 'recruitment', 
    label: 'Reclutamiento', 
    icon: <UserPlus className="h-5 w-5" />,
    badge: pendingApplicationsCount > 0 ? pendingApplicationsCount : undefined
  },
  { id: 'accounting', label: 'Contabilidad', icon: <Calculator /> },
  // ... resto
]

// Agregar case en renderContent()
case 'recruitment':
  return <RecruitmentDashboard businessId={business.id} />
```

**Componente nuevo**: `src/components/admin/RecruitmentDashboard.tsx`
```typescript
import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { VacancyList } from '@/components/jobs/VacancyList'
import { CreateVacancy } from '@/components/jobs/CreateVacancy'
import { ApplicationsManagement } from '@/components/jobs/ApplicationsManagement'
import { useJobVacancies } from '@/hooks/useJobVacancies'
import { useJobApplications } from '@/hooks/useJobApplications'

interface RecruitmentDashboardProps {
  businessId: string
}

export function RecruitmentDashboard({ businessId }: RecruitmentDashboardProps) {
  const [activeTab, setActiveTab] = useState('vacancies')
  const [selectedVacancyId, setSelectedVacancyId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  
  const { vacancies, stats, refetch } = useJobVacancies({ businessId })
  const { applications, stats: appStats } = useJobApplications({ businessId })
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reclutamiento</h1>
          <p className="text-muted-foreground">
            Gestiona vacantes y aplicaciones de empleados
          </p>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="vacancies">
            Vacantes ({stats.open})
          </TabsTrigger>
          <TabsTrigger value="applications">
            Aplicaciones 
            {appStats.pending > 0 && (
              <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                {appStats.pending}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="vacancies" className="space-y-4">
          {isCreating || selectedVacancyId ? (
            <CreateVacancy
              businessId={businessId}
              vacancyId={selectedVacancyId}
              onClose={() => {
                setIsCreating(false)
                setSelectedVacancyId(null)
              }}
              onSuccess={() => {
                refetch()
                setIsCreating(false)
                setSelectedVacancyId(null)
              }}
            />
          ) : (
            <VacancyList
              businessId={businessId}
              onCreateNew={() => setIsCreating(true)}
              onSelectVacancy={setSelectedVacancyId}
            />
          )}
        </TabsContent>
        
        <TabsContent value="applications">
          <ApplicationsManagement
            businessId={businessId}
            applications={applications}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

#### 3.2 Mejorar CreateVacancy con sugerencias (0.6d)

**Archivo**: `src/components/jobs/CreateVacancy.tsx`

**Agregar lógica de empleados despedidos**:
```typescript
// Al inicio del componente
const [recentlyTerminated, setRecentlyTerminated] = useState<TerminatedEmployee[]>([])
const [showSuggestionModal, setShowSuggestionModal] = useState(false)
const [selectedTemplate, setSelectedTemplate] = useState<TerminatedEmployee | null>(null)

// Cargar empleados despedidos recientes
useEffect(() => {
  loadRecentlyTerminated()
}, [businessId])

const loadRecentlyTerminated = async () => {
  const { data, error } = await supabase
    .from('business_employees')
    .select(`
      *,
      profiles(full_name, email, avatar_url),
      services:employee_services(service_id, services(name))
    `)
    .eq('business_id', businessId)
    .not('termination_date', 'is', null)
    .gte('termination_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('termination_date', { ascending: false })
    .limit(5)
  
  if (data && data.length > 0) {
    setRecentlyTerminated(data)
    setShowSuggestionModal(true)
  }
}

// Modal de sugerencia
{showSuggestionModal && recentlyTerminated.length > 0 && (
  <Dialog open={showSuggestionModal} onOpenChange={setShowSuggestionModal}>
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>¿Reabrir vacante de ex-empleado?</DialogTitle>
        <DialogDescription>
          Detectamos que recientemente desvinculaste empleados. 
          Puedes reutilizar la información para crear una vacante.
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {recentlyTerminated.map((emp) => (
          <Card
            key={emp.id}
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => {
              setSelectedTemplate(emp)
              prefillFromTemplate(emp)
              setShowSuggestionModal(false)
            }}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <Avatar>
                <AvatarImage src={emp.profiles.avatar_url} />
                <AvatarFallback>
                  {emp.profiles.full_name?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h4 className="font-semibold">{emp.profiles.full_name}</h4>
                <p className="text-sm text-muted-foreground">{emp.job_title}</p>
                <p className="text-xs text-muted-foreground">
                  Desvinculado el {new Date(emp.termination_date).toLocaleDateString()}
                </p>
              </div>
              
              <div className="text-right">
                <Badge>{emp.services?.length || 0} servicios</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
        
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => {
            setShowSuggestionModal(false)
            // Crear vacante desde cero
          }}
        >
          Crear vacante nueva
        </Button>
      </div>
    </DialogContent>
  </Dialog>
)}

// Función para pre-llenar formulario
const prefillFromTemplate = (employee: TerminatedEmployee) => {
  const serviceIds = employee.services?.map(s => s.service_id) || []
  
  setFormData({
    title: employee.job_title || 'Nuevo puesto',
    description: `Buscamos un profesional para el puesto de ${employee.job_title}`,
    requirements: '',
    responsibilities: '',
    benefits: '',
    position_type: 'full_time',
    experience_required: 'mid_level',
    salary_min: employee.salary_base?.toString() || '',
    salary_max: '',
    currency: 'COP',
    location_id: employee.location_id || '',
    remote_allowed: false,
    required_services: serviceIds, // ⭐ Pre-llenar servicios
    work_schedule: {}, // Usar horario del negocio
    number_of_positions: 1,
    status: 'open'
  })
  
  toast.info('Formulario prellenado con datos del empleado anterior')
}
```

**Agregar campos faltantes al formulario**:
```typescript
// work_schedule (horario)
<div className="space-y-2">
  <Label>Horario de trabajo</Label>
  <WorkScheduleEditor
    value={formData.work_schedule}
    onChange={(schedule) => setFormData({ ...formData, work_schedule: schedule })}
  />
</div>

// required_services
<div className="space-y-2">
  <Label>Servicios requeridos *</Label>
  <MultiServiceSelector
    businessId={businessId}
    value={formData.required_services}
    onChange={(services) => setFormData({ ...formData, required_services: services })}
    placeholder="Selecciona los servicios que debe ofrecer"
  />
</div>

// preferred_services
<div className="space-y-2">
  <Label>Servicios preferidos (opcional)</Label>
  <MultiServiceSelector
    businessId={businessId}
    value={formData.preferred_services}
    onChange={(services) => setFormData({ ...formData, preferred_services: services })}
    placeholder="Servicios deseables pero no obligatorios"
  />
</div>

// number_of_positions
<div className="space-y-2">
  <Label>Número de vacantes</Label>
  <Input
    type="number"
    min="1"
    value={formData.number_of_positions}
    onChange={(e) => setFormData({ ...formData, number_of_positions: parseInt(e.target.value) })}
  />
  <p className="text-xs text-muted-foreground">
    Cantidad de personas que necesitas contratar para este puesto
  </p>
</div>
```

**Componente auxiliar**: `src/components/jobs/WorkScheduleEditor.tsx`
```typescript
interface WorkScheduleEditorProps {
  value: BusinessHours
  onChange: (schedule: BusinessHours) => void
}

export function WorkScheduleEditor({ value, onChange }: WorkScheduleEditorProps) {
  const days = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
  ]
  
  return (
    <div className="space-y-3 border rounded-md p-4">
      {days.map(({ key, label }) => (
        <div key={key} className="flex items-center gap-4">
          <div className="w-28 font-medium">{label}</div>
          
          <Switch
            checked={!value[key]?.closed}
            onCheckedChange={(checked) => {
              onChange({
                ...value,
                [key]: {
                  ...value[key],
                  closed: !checked
                }
              })
            }}
          />
          
          {!value[key]?.closed && (
            <>
              <Input
                type="time"
                value={value[key]?.open || '09:00'}
                onChange={(e) => {
                  onChange({
                    ...value,
                    [key]: {
                      ...value[key],
                      open: e.target.value
                    }
                  })
                }}
                className="w-32"
              />
              
              <span className="text-muted-foreground">a</span>
              
              <Input
                type="time"
                value={value[key]?.close || '18:00'}
                onChange={(e) => {
                  onChange({
                    ...value,
                    [key]: {
                      ...value[key],
                      close: e.target.value
                    }
                  })
                }}
                className="w-32"
              />
            </>
          )}
        </div>
      ))}
    </div>
  )
}
```

#### 3.3 Componente ApplicationsManagement (0.8d)

**Nuevo archivo**: `src/components/jobs/ApplicationsManagement.tsx`

```typescript
import { useState } from 'react'
import { useJobApplications } from '@/hooks/useJobApplications'
import { ApplicationCard } from './ApplicationCard'
import { ApplicantProfileModal } from './ApplicantProfileModal'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ApplicationsManagementProps {
  businessId: string
  applications: JobApplicationWithDetails[]
}

export function ApplicationsManagement({ 
  businessId, 
  applications 
}: ApplicationsManagementProps) {
  const [selectedApplicantId, setSelectedApplicantId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  const { 
    reviewApplication, 
    acceptApplication, 
    rejectApplication,
    scheduleInterview,
    rateApplicant
  } = useJobApplications({ businessId })
  
  const filtered = statusFilter === 'all' 
    ? applications 
    : applications.filter(app => app.status === statusFilter)
  
  const statusCounts = {
    all: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    reviewing: applications.filter(a => a.status === 'reviewing').length,
    interview: applications.filter(a => a.status === 'interview').length,
    accepted: applications.filter(a => a.status === 'accepted').length,
    rejected: applications.filter(a => a.status === 'rejected').length
  }
  
  return (
    <div className="space-y-6">
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all">
            Todas ({statusCounts.all})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pendientes
            {statusCounts.pending > 0 && (
              <Badge variant="destructive" className="ml-2">
                {statusCounts.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reviewing">
            En Revisión ({statusCounts.reviewing})
          </TabsTrigger>
          <TabsTrigger value="interview">
            Entrevista ({statusCounts.interview})
          </TabsTrigger>
          <TabsTrigger value="accepted">
            Aceptadas ({statusCounts.accepted})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rechazadas ({statusCounts.rejected})
          </TabsTrigger>
        </TabsList>
        
        <div className="mt-6 space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No hay aplicaciones en este estado
              </p>
            </div>
          ) : (
            filtered.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                onViewProfile={() => setSelectedApplicantId(application.user_id)}
                onAccept={() => acceptApplication(application.id)}
                onReject={() => rejectApplication(application.id)}
                onScheduleInterview={(datetime) => 
                  scheduleInterview(application.id, datetime)
                }
                onRate={(rating, notes) => 
                  rateApplicant(application.id, rating, notes)
                }
              />
            ))
          )}
        </div>
      </Tabs>
      
      {selectedApplicantId && (
        <ApplicantProfileModal
          applicantId={selectedApplicantId}
          onClose={() => setSelectedApplicantId(null)}
        />
      )}
    </div>
  )
}
```

#### 3.4 Modal ApplicantProfileModal (0.8d)

**Nuevo archivo**: `src/components/jobs/ApplicantProfileModal.tsx`

```typescript
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile'
import { ReviewList } from '@/components/reviews/ReviewList'
import { Star, Briefcase, Award, MapPin, Phone, Mail, Calendar } from 'lucide-react'

interface ApplicantProfileModalProps {
  applicantId: string
  onClose: () => void
}

export function ApplicantProfileModal({ 
  applicantId, 
  onClose 
}: ApplicantProfileModalProps) {
  const { 
    profile, 
    metrics, 
    employmentHistory, 
    recentReviews, 
    loading 
  } = useEmployeeProfile(applicantId)
  
  if (loading) {
    return <div>Cargando...</div>
  }
  
  if (!profile) {
    return <div>No se encontró el perfil</div>
  }
  
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback>
                {profile.full_name?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <DialogTitle className="text-2xl">{profile.full_name}</DialogTitle>
              <p className="text-muted-foreground">{profile.email}</p>
              
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">
                    {metrics.average_rating.toFixed(1)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({metrics.total_reviews} reviews)
                  </span>
                </div>
                
                <Badge variant="secondary">
                  {metrics.total_appointments_completed} servicios completados
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>
        
        <Tabs defaultValue="general" className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="services">Servicios</TabsTrigger>
            <TabsTrigger value="experience">Experiencia</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4">
            {/* Información de contacto */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.phone || 'No especificado'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.city || 'No especificado'}</span>
                </div>
              </CardContent>
            </Card>
            
            {/* Bio profesional */}
            {profile.employee_profile?.professional_summary && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">Acerca de</h3>
                  <p className="text-muted-foreground">
                    {profile.employee_profile.professional_summary}
                  </p>
                </CardContent>
              </Card>
            )}
            
            {/* Certificaciones */}
            {profile.employee_profile?.certifications && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Certificaciones
                  </h3>
                  <div className="space-y-2">
                    {JSON.parse(profile.employee_profile.certifications).map((cert: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-2 border rounded">
                        <Award className="h-4 w-4 text-primary mt-1" />
                        <div>
                          <p className="font-medium">{cert.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {cert.issuer} • {cert.date}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Métricas */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-primary">
                    {metrics.businesses_worked_count}
                  </div>
                  <p className="text-sm text-muted-foreground">Negocios</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-primary">
                    {metrics.services_offered_count}
                  </div>
                  <p className="text-sm text-muted-foreground">Servicios</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-primary">
                    ${(metrics.total_revenue_generated / 1000000).toFixed(1)}M
                  </div>
                  <p className="text-sm text-muted-foreground">Ingresos generados</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="services">
            {/* Lista de servicios que ofrece */}
            <div className="space-y-2">
              {profile.services_offered?.map((service) => (
                <Card key={service.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <h4 className="font-semibold">{service.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {service.duration_minutes} min • ${service.price}
                      </p>
                    </div>
                    <Badge>
                      Nivel {service.expertise_level}/5
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="experience">
            {/* Historial laboral */}
            <div className="space-y-3">
              {employmentHistory.map((job, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Briefcase className="h-5 w-5 text-primary mt-1" />
                      <div className="flex-1">
                        <h4 className="font-semibold">{job.job_title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {job.business_name} • {job.location_name}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(job.hire_date).toLocaleDateString()} - 
                          {job.termination_date 
                            ? new Date(job.termination_date).toLocaleDateString()
                            : 'Presente'
                          }
                        </p>
                      </div>
                      {job.is_active && (
                        <Badge variant="secondary">Activo</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="reviews">
            {/* Reviews usando componente existente */}
            <ReviewList
              reviews={recentReviews}
              showActions={false}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
```

> **Salidas Fase 3**:
> - Sección "Reclutamiento" integrada en AdminDashboard
> - CreateVacancy mejorado con sugerencias y campos completos (work_schedule, services)
> - ApplicationsManagement con tabs de estado
> - ApplicantProfileModal con 4 tabs informativos
> - WorkScheduleEditor reutilizable
> - MultiServiceSelector (si no existe)

---

### Fase 4 · UI Employee (2.5 días)

#### 4.1 Agregar "Ofertas Disponibles" en EmployeeDashboard (0.3d)

**Archivo**: `src/components/employee/EmployeeDashboard.tsx`

```typescript
const sidebarItems = [
  {
    id: 'employments',
    label: 'Mis Empleos',
    icon: <Briefcase className="h-5 w-5" />
  },
  // ⭐ NUEVO
  {
    id: 'job-market',
    label: 'Ofertas Disponibles',
    icon: <Search className="h-5 w-5" />,
    badge: matchingVacanciesCount > 0 ? matchingVacanciesCount : undefined
  },
  {
    id: 'applications',
    label: 'Mis Aplicaciones',
    icon: <FileText className="h-5 w-5" />
  },
  {
    id: 'appointments',
    label: 'Mis Citas',
    icon: <Calendar className="h-5 w-5" />
  },
  {
    id: 'schedule',
    label: 'Horario',
    icon: <Clock className="h-5 w-5" />
  }
]

// En renderContent()
case 'job-market':
  return <AvailableVacanciesMarketplace userId={user.id} />

case 'applications':
  return <MyApplicationsList userId={user.id} />
```

#### 4.2 Componente AvailableVacanciesMarketplace (1d)

**Nuevo archivo**: `src/components/employee/AvailableVacanciesMarketplace.tsx`

```typescript
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { VacancyCard } from '@/components/jobs/VacancyCard'
import { VacancyDetailModal } from '@/components/jobs/VacancyDetailModal'
import { ApplicationFormModal } from '@/components/jobs/ApplicationFormModal'
import { ScheduleConflictAlert } from '@/components/jobs/ScheduleConflictAlert'
import { useScheduleConflicts } from '@/hooks/useScheduleConflicts'
import { Search, Filter, MapPin, DollarSign, Clock, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'

interface AvailableVacanciesMarketplaceProps {
  userId: string
}

export function AvailableVacanciesMarketplace({ 
  userId 
}: AvailableVacanciesMarketplaceProps) {
  const [vacancies, setVacancies] = useState<JobVacancyWithMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVacancy, setSelectedVacancy] = useState<JobVacancyWithMatch | null>(null)
  const [applyingToVacancy, setApplyingToVacancy] = useState<JobVacancyWithMatch | null>(null)
  const [scheduleConflict, setScheduleConflict] = useState<ScheduleConflict | null>(null)
  
  const { checkConflict } = useScheduleConflicts(userId)
  
  // Filtros
  const [filters, setFilters] = useState({
    searchQuery: '',
    city: '',
    position_type: 'all',
    min_salary: '',
    max_salary: '',
    experience_required: 'all',
    remote_only: false
  })
  
  // Cargar vacancies usando RPC get_matching_vacancies
  useEffect(() => {
    loadVacancies()
  }, [userId, filters.city])
  
  const loadVacancies = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .rpc('get_matching_vacancies', {
          p_user_id: userId,
          p_city: filters.city || null,
          p_limit: 50,
          p_offset: 0
        })
      
      if (error) throw error
      setVacancies(data || [])
    } catch (err) {
      toast.error('Error al cargar vacantes')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
  
  // Filtrado local adicional
  const filteredVacancies = vacancies.filter(vacancy => {
    // Búsqueda por texto
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      const matchesTitle = vacancy.title.toLowerCase().includes(query)
      const matchesDescription = vacancy.description?.toLowerCase().includes(query)
      const matchesBusiness = vacancy.business_name.toLowerCase().includes(query)
      
      if (!matchesTitle && !matchesDescription && !matchesBusiness) {
        return false
      }
    }
    
    // Filtro por tipo de posición
    if (filters.position_type !== 'all' && vacancy.position_type !== filters.position_type) {
      return false
    }
    
    // Filtro por experiencia requerida
    if (filters.experience_required !== 'all' && vacancy.experience_required !== filters.experience_required) {
      return false
    }
    
    // Filtro por salario mínimo
    if (filters.min_salary && vacancy.salary_min) {
      if (vacancy.salary_min < parseFloat(filters.min_salary)) {
        return false
      }
    }
    
    // Filtro por salario máximo
    if (filters.max_salary && vacancy.salary_max) {
      if (vacancy.salary_max > parseFloat(filters.max_salary)) {
        return false
      }
    }
    
    // Solo remotas
    if (filters.remote_only && !vacancy.remote_allowed) {
      return false
    }
    
    return true
  })
  
  const handleApply = async (vacancy: JobVacancyWithMatch) => {
    // Verificar cruces de horario si tiene work_schedule
    if (vacancy.work_schedule) {
      const conflict = await checkConflict(vacancy.work_schedule)
      
      if (conflict.hasConflict) {
        setScheduleConflict(conflict)
        // Mostrar alerta pero permitir continuar
      }
    }
    
    setApplyingToVacancy(vacancy)
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Ofertas Disponibles</h1>
        <p className="text-muted-foreground">
          Encuentra el trabajo perfecto para tus habilidades
        </p>
      </div>
      
      {/* Filtros */}
      <div className="bg-card border rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Filtros</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Búsqueda */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, descripción o negocio..."
                value={filters.searchQuery}
                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Ciudad */}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            <Input
              placeholder="Ciudad..."
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              className="pl-10"
            />
          </div>
          
          {/* Tipo de contrato */}
          <Select 
            value={filters.position_type} 
            onValueChange={(value) => setFilters({ ...filters, position_type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tipo de contrato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="full_time">Tiempo Completo</SelectItem>
              <SelectItem value="part_time">Medio Tiempo</SelectItem>
              <SelectItem value="freelance">Freelance</SelectItem>
              <SelectItem value="temporary">Temporal</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Experiencia */}
          <Select 
            value={filters.experience_required} 
            onValueChange={(value) => setFilters({ ...filters, experience_required: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Nivel de experiencia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los niveles</SelectItem>
              <SelectItem value="entry_level">Principiante</SelectItem>
              <SelectItem value="mid_level">Intermedio</SelectItem>
              <SelectItem value="senior">Senior</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Rango salarial */}
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Salario mín"
              value={filters.min_salary}
              onChange={(e) => setFilters({ ...filters, min_salary: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Salario máx"
              value={filters.max_salary}
              onChange={(e) => setFilters({ ...filters, max_salary: e.target.value })}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.remote_only}
              onChange={(e) => setFilters({ ...filters, remote_only: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Solo trabajos remotos</span>
          </label>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              setFilters({
                searchQuery: '',
                city: '',
                position_type: 'all',
                min_salary: '',
                max_salary: '',
                experience_required: 'all',
                remote_only: false
              })
            }}
          >
            Limpiar filtros
          </Button>
        </div>
      </div>
      
      {/* Resultados */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-muted-foreground">
            {filteredVacancies.length} vacantes encontradas
          </p>
          
          <Select defaultValue="match_score">
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="match_score">Mejor match</SelectItem>
              <SelectItem value="recent">Más recientes</SelectItem>
              <SelectItem value="salary_high">Salario mayor</SelectItem>
              <SelectItem value="salary_low">Salario menor</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : filteredVacancies.length === 0 ? (
          <div className="text-center py-12 bg-card border rounded-lg">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">No se encontraron vacantes</h3>
            <p className="text-muted-foreground">
              Intenta ajustar los filtros o completa tu perfil profesional
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredVacancies.map((vacancy) => (
              <VacancyCard
                key={vacancy.vacancy_id}
                vacancy={vacancy}
                matchScore={vacancy.match_score}
                onView={() => setSelectedVacancy(vacancy)}
                onApply={() => handleApply(vacancy)}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Modal de detalle de vacante */}
      {selectedVacancy && (
        <VacancyDetailModal
          vacancy={selectedVacancy}
          onClose={() => setSelectedVacancy(null)}
          onApply={() => handleApply(selectedVacancy)}
        />
      )}
      
      {/* Modal de aplicación */}
      {applyingToVacancy && (
        <ApplicationFormModal
          vacancy={applyingToVacancy}
          userId={userId}
          onClose={() => {
            setApplyingToVacancy(null)
            setScheduleConflict(null)
          }}
          onSuccess={() => {
            toast.success('¡Aplicación enviada exitosamente!')
            setApplyingToVacancy(null)
            setScheduleConflict(null)
            loadVacancies() // Refrescar lista
          }}
        />
      )}
      
      {/* Alerta de conflicto de horario */}
      {scheduleConflict?.hasConflict && (
        <ScheduleConflictAlert
          conflict={scheduleConflict}
          onDismiss={() => setScheduleConflict(null)}
        />
      )}
    </div>
  )
}
```

#### 4.3 Componentes auxiliares (0.6d)

**VacancyCard.tsx** (tarjeta compacta):
```typescript
interface VacancyCardProps {
  vacancy: JobVacancyWithMatch
  matchScore: number
  onView: () => void
  onApply: () => void
}

export function VacancyCard({ vacancy, matchScore, onView, onApply }: VacancyCardProps) {
  return (
    <Card className="hover:border-primary transition-colors cursor-pointer">
      <CardContent className="p-6 space-y-4">
        {/* Header con logo y match score */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={vacancy.business_logo_url} />
              <AvatarFallback>
                {vacancy.business_name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h3 className="font-semibold text-lg hover:text-primary" onClick={onView}>
                {vacancy.title}
              </h3>
              <p className="text-sm text-muted-foreground">{vacancy.business_name}</p>
            </div>
          </div>
          
          {matchScore > 60 && (
            <Badge variant="secondary" className="bg-green-500/20 text-green-700">
              {matchScore}% match
            </Badge>
          )}
        </div>
        
        {/* Descripción truncada */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {vacancy.description}
        </p>
        
        {/* Info rápida */}
        <div className="flex flex-wrap gap-3 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {vacancy.remote_allowed ? 'Remoto' : vacancy.location_city}
          </div>
          
          {vacancy.salary_min && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              ${vacancy.salary_min.toLocaleString()} - ${vacancy.salary_max?.toLocaleString()}
            </div>
          )}
          
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-4 w-4" />
            {POSITION_TYPES[vacancy.position_type]}
          </div>
        </div>
        
        {/* Tags de servicios requeridos */}
        {vacancy.required_services && vacancy.required_services.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {vacancy.required_services.slice(0, 3).map((serviceId) => (
              <Badge key={serviceId} variant="outline" className="text-xs">
                {/* Cargar nombre del servicio */}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Botones */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onView} className="flex-1">
            Ver detalles
          </Button>
          <Button onClick={onApply} className="flex-1">
            Aplicar ahora
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

**ApplicationFormModal.tsx**:
```typescript
interface ApplicationFormModalProps {
  vacancy: JobVacancyWithMatch
  userId: string
  onClose: () => void
  onSuccess: () => void
}

export function ApplicationFormModal({ 
  vacancy, 
  userId, 
  onClose, 
  onSuccess 
}: ApplicationFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    coverLetter: '',
    availableFrom: new Date().toISOString().split('T')[0],
    availabilityNotes: ''
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      
      const { error } = await supabase
        .from('job_applications')
        .insert({
          vacancy_id: vacancy.vacancy_id,
          user_id: userId,
          business_id: vacancy.business_id,
          status: 'pending',
          cover_letter: formData.coverLetter,
          available_from: formData.availableFrom,
          availability_notes: formData.availabilityNotes
        })
      
      if (error) throw error
      
      onSuccess()
    } catch (err: any) {
      if (err.code === '23505') { // UNIQUE constraint violation
        toast.error('Ya has aplicado a esta vacante')
      } else {
        toast.error('Error al enviar aplicación: ' + err.message)
      }
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Aplicar a {vacancy.title}</DialogTitle>
          <DialogDescription>
            {vacancy.business_name}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="coverLetter">Carta de presentación *</Label>
            <Textarea
              id="coverLetter"
              rows={6}
              placeholder="Cuéntanos por qué eres el candidato ideal para este puesto..."
              value={formData.coverLetter}
              onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">
              Mínimo 100 caracteres
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="availableFrom">Disponible desde</Label>
            <Input
              id="availableFrom"
              type="date"
              value={formData.availableFrom}
              onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="availabilityNotes">Notas de disponibilidad (opcional)</Label>
            <Textarea
              id="availabilityNotes"
              rows={3}
              placeholder="Ej: Puedo trabajar fines de semana, tengo disponibilidad completa después del 15..."
              value={formData.availabilityNotes}
              onChange={(e) => setFormData({ ...formData, availabilityNotes: e.target.value })}
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || formData.coverLetter.length < 100}>
              {loading ? 'Enviando...' : 'Enviar aplicación'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

**ScheduleConflictAlert.tsx**:
```typescript
interface ScheduleConflictAlertProps {
  conflict: ScheduleConflict
  onDismiss: () => void
}

export function ScheduleConflictAlert({ conflict, onDismiss }: ScheduleConflictAlertProps) {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Conflicto de horario detectado</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{conflict.message}</p>
        
        {conflict.conflictingBusinesses.map((business, i) => (
          <div key={i} className="mt-2 p-2 bg-destructive/10 rounded">
            <p className="font-semibold text-sm">{business.business_name}</p>
            {business.overlap_hours.map((overlap, j) => (
              <p key={j} className="text-xs">
                • {overlap.day}: {overlap.start} - {overlap.end}
              </p>
            ))}
          </div>
        ))}
        
        <p className="text-xs mt-2">
          ⚠️ Puedes aplicar de todas formas, pero deberás resolver el conflicto antes de iniciar.
        </p>
      </AlertDescription>
      
      <Button
        variant="outline"
        size="sm"
        onClick={onDismiss}
        className="mt-2"
      >
        Entendido
      </Button>
    </Alert>
  )
}
```

#### 4.4 Perfil profesional extendido (0.6d)

**Nuevo archivo**: `src/components/employee/EmployeeProfileSettings.tsx`

```typescript
import { useState, useEffect } from 'react'
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, X, Award, Link as LinkIcon } from 'lucide-react'

interface EmployeeProfileSettingsProps {
  userId: string
}

export function EmployeeProfileSettings({ userId }: EmployeeProfileSettingsProps) {
  const { profile, updateProfile, addCertification, removeCertification } = useEmployeeProfile(userId)
  const [formData, setFormData] = useState({
    professional_summary: '',
    years_of_experience: 0,
    specializations: [] as string[],
    languages: [] as string[],
    portfolio_url: '',
    linkedin_url: '',
    github_url: ''
  })
  
  const [newSpec, setNewSpec] = useState('')
  const [newLang, setNewLang] = useState('')
  const [newCert, setNewCert] = useState({
    name: '',
    issuer: '',
    date: '',
    credential_id: '',
    url: ''
  })
  
  useEffect(() => {
    if (profile?.employee_profile) {
      setFormData({
        professional_summary: profile.employee_profile.professional_summary || '',
        years_of_experience: profile.employee_profile.years_of_experience || 0,
        specializations: profile.employee_profile.specializations || [],
        languages: profile.employee_profile.languages || [],
        portfolio_url: profile.employee_profile.portfolio_url || '',
        linkedin_url: profile.employee_profile.linkedin_url || '',
        github_url: profile.employee_profile.github_url || ''
      })
    }
  }, [profile])
  
  const handleSave = async () => {
    try {
      await updateProfile(formData)
      toast.success('Perfil actualizado exitosamente')
    } catch (err) {
      toast.error('Error al actualizar perfil')
    }
  }
  
  const addSpecialization = () => {
    if (newSpec.trim()) {
      setFormData({
        ...formData,
        specializations: [...formData.specializations, newSpec.trim()]
      })
      setNewSpec('')
    }
  }
  
  const removeSpecialization = (index: number) => {
    setFormData({
      ...formData,
      specializations: formData.specializations.filter((_, i) => i !== index)
    })
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Perfil Profesional</h2>
        <p className="text-muted-foreground">
          Completa tu perfil para destacar en las aplicaciones
        </p>
      </div>
      
      {/* Bio profesional */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen profesional</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea
              rows={4}
              placeholder="Cuéntanos sobre tu experiencia, habilidades y objetivos profesionales..."
              value={formData.professional_summary}
              onChange={(e) => setFormData({ ...formData, professional_summary: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Años de experiencia</Label>
            <Input
              type="number"
              min="0"
              max="50"
              value={formData.years_of_experience}
              onChange={(e) => setFormData({ ...formData, years_of_experience: parseInt(e.target.value) })}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Especializaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Especializaciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Ej: Corte de cabello masculino, Coloración..."
              value={newSpec}
              onChange={(e) => setNewSpec(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addSpecialization()}
            />
            <Button onClick={addSpecialization} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {formData.specializations.map((spec, i) => (
              <Badge key={i} variant="secondary" className="gap-1">
                {spec}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => removeSpecialization(i)}
                />
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Idiomas */}
      <Card>
        <CardHeader>
          <CardTitle>Idiomas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Similar a especializaciones */}
        </CardContent>
      </Card>
      
      {/* Enlaces */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Enlaces profesionales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Portafolio</Label>
            <Input
              type="url"
              placeholder="https://tu-portafolio.com"
              value={formData.portfolio_url}
              onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label>LinkedIn</Label>
            <Input
              type="url"
              placeholder="https://linkedin.com/in/tu-perfil"
              value={formData.linkedin_url}
              onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label>GitHub (opcional)</Label>
            <Input
              type="url"
              placeholder="https://github.com/tu-usuario"
              value={formData.github_url}
              onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Botones */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => window.history.back()}>
          Cancelar
        </Button>
        <Button onClick={handleSave}>
          Guardar cambios
        </Button>
      </div>
    </div>
  )
}
```

> **Salidas Fase 4**:
> - Item "Ofertas Disponibles" en EmployeeDashboard
> - AvailableVacanciesMarketplace con filtros avanzados
> - VacancyCard, ApplicationFormModal, ScheduleConflictAlert
> - EmployeeProfileSettings para completar perfil profesional
> - Integración con RPC get_matching_vacancies

---

### Fase 5 · Sistema de Reviews Obligatorias Post-Servicio (2 días)

#### 5.1 MandatoryReviewModal Component (1d)

**Nuevo archivo**: `src/components/reviews/MandatoryReviewModal.tsx`

```typescript
import { useState, useEffect } from 'react'
import { usePendingReviews } from '@/hooks/usePendingReviews'
import { useReviews } from '@/hooks/useReviews'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Star } from 'lucide-react'
import { toast } from 'sonner'

interface MandatoryReviewModalProps {
  userId: string
  onComplete?: () => void
}

export function MandatoryReviewModal({ userId, onComplete }: MandatoryReviewModalProps) {
  const { pendingReviews, loading, refresh, remindLater } = usePendingReviews(userId)
  const { createReview } = useReviews()
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const [formData, setFormData] = useState({
    business_rating: 0,
    business_comment: '',
    employee_rating: 0,
    employee_comment: ''
  })
  
  const currentPending = pendingReviews[currentIndex]
  const isOpen = pendingReviews.length > 0 && !loading
  
  useEffect(() => {
    // Reset form cuando cambia el appointment
    if (currentPending) {
      setFormData({
        business_rating: 0,
        business_comment: '',
        employee_rating: 0,
        employee_comment: ''
      })
    }
  }, [currentPending])
  
  const handleSubmit = async () => {
    if (!currentPending) return
    
    // Validaciones
    if (formData.business_rating === 0 || formData.employee_rating === 0) {
      toast.error('Debes calificar tanto el negocio como el profesional')
      return
    }
    
    if (!formData.business_comment.trim() || !formData.employee_comment.trim()) {
      toast.error('Por favor agrega un comentario para cada calificación')
      return
    }
    
    try {
      // Crear review del negocio
      await createReview({
        appointment_id: currentPending.appointment_id,
        business_id: currentPending.business_id,
        client_id: userId,
        rating: formData.business_rating,
        comment: formData.business_comment,
        review_type: 'business'
      })
      
      // Crear review del empleado
      await createReview({
        appointment_id: currentPending.appointment_id,
        business_id: currentPending.business_id,
        employee_id: currentPending.employee_id,
        client_id: userId,
        rating: formData.employee_rating,
        comment: formData.employee_comment,
        review_type: 'employee'
      })
      
      toast.success('¡Gracias por tu opinión!')
      
      // Mover al siguiente pending o cerrar
      if (currentIndex < pendingReviews.length - 1) {
        setCurrentIndex(currentIndex + 1)
      } else {
        refresh()
        onComplete?.()
      }
    } catch (err: any) {
      toast.error('Error al enviar reseñas: ' + err.message)
    }
  }
  
  const handleRemindLater = () => {
    if (currentPending) {
      remindLater(currentPending.appointment_id)
      toast.info('Te recordaremos en 5 minutos')
    }
  }
  
  const RatingStars = ({ 
    value, 
    onChange 
  }: { 
    value: number
    onChange: (rating: number) => void 
  }) => {
    const [hover, setHover] = useState(0)
    
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-8 w-8 cursor-pointer transition-colors ${
              (hover || value) >= star
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(star)}
          />
        ))}
      </div>
    )
  }
  
  if (!isOpen || !currentPending) return null
  
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()} // Evitar cerrar clickeando fuera
        onEscapeKeyDown={(e) => e.preventDefault()} // Evitar cerrar con ESC
      >
        <DialogHeader>
          <DialogTitle>
            Califica tu experiencia
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Cita completada el {new Date(currentPending.completed_at).toLocaleDateString()}
          </p>
          
          {pendingReviews.length > 1 && (
            <div className="flex justify-center gap-2 mt-2">
              {pendingReviews.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-8 rounded-full ${
                    i === currentIndex ? 'bg-primary' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Sección 1: Calificar negocio */}
          <div className="p-4 bg-muted rounded-lg space-y-3">
            <div>
              <h3 className="font-semibold text-lg">
                {currentPending.business_name}
              </h3>
              <p className="text-sm text-muted-foreground">
                Servicio: {currentPending.service_name}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Calificación del negocio</Label>
              <RatingStars
                value={formData.business_rating}
                onChange={(rating) => setFormData({ ...formData, business_rating: rating })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Comentario sobre el negocio</Label>
              <Textarea
                rows={3}
                placeholder="¿Cómo fue tu experiencia en general? Instalaciones, atención, limpieza..."
                value={formData.business_comment}
                onChange={(e) => setFormData({ ...formData, business_comment: e.target.value })}
              />
            </div>
          </div>
          
          {/* Sección 2: Calificar empleado */}
          <div className="p-4 bg-muted rounded-lg space-y-3">
            <div>
              <h3 className="font-semibold text-lg">
                {currentPending.employee_name}
              </h3>
              <p className="text-sm text-muted-foreground">
                Profesional que te atendió
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Calificación del profesional</Label>
              <RatingStars
                value={formData.employee_rating}
                onChange={(rating) => setFormData({ ...formData, employee_rating: rating })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Comentario sobre el profesional</Label>
              <Textarea
                rows={3}
                placeholder="¿Cómo fue el servicio del profesional? Técnica, amabilidad, puntualidad..."
                value={formData.employee_comment}
                onChange={(e) => setFormData({ ...formData, employee_comment: e.target.value })}
              />
            </div>
          </div>
          
          {/* Botones */}
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              onClick={handleRemindLater}
            >
              Recordar en 5 minutos
            </Button>
            
            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={
                  formData.business_rating === 0 ||
                  formData.employee_rating === 0 ||
                  !formData.business_comment.trim() ||
                  !formData.employee_comment.trim()
                }
              >
                Enviar {pendingReviews.length > 1 && `(${currentIndex + 1}/${pendingReviews.length})`}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

#### 5.2 Integración en ClientDashboard (0.5d)

**Archivo**: `src/components/client/ClientDashboard.tsx`

```typescript
import { MandatoryReviewModal } from '@/components/reviews/MandatoryReviewModal'

export function ClientDashboard() {
  const { user } = useAuth()
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header, Sidebar, Content... */}
      
      {/* ⭐ Modal obligatorio de reviews */}
      <MandatoryReviewModal 
        userId={user.id}
        onComplete={() => {
          // Opcional: refrescar datos del dashboard
        }}
      />
    </div>
  )
}
```

#### 5.3 Hook usePendingReviews refinado (0.3d)

**Actualización en**: `src/hooks/usePendingReviews.ts`

```typescript
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface PendingReview {
  appointment_id: string
  business_id: string
  business_name: string
  employee_id: string
  employee_name: string
  service_name: string
  completed_at: string
}

const REMIND_LATER_KEY = 'remind_reviews_later'

export function usePendingReviews(userId: string) {
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadPendingReviews()
    
    // Recargar cada vez que vuelva a la app
    const interval = setInterval(loadPendingReviews, 5 * 60 * 1000) // 5 min
    
    return () => clearInterval(interval)
  }, [userId])
  
  const loadPendingReviews = async () => {
    try {
      setLoading(true)
      
      // Cargar appointments sin reviews (status = completed)
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          id,
          business_id,
          employee_id,
          start_time,
          businesses!inner(name),
          profiles!appointments_employee_id_fkey(full_name),
          services!inner(name)
        `)
        .eq('client_id', userId)
        .eq('status', 'completed')
        .is('review_id', null)
        .order('start_time', { ascending: false })
      
      if (error) throw error
      
      // Filtrar los que NO están en "remind later"
      const remindLater = getRemindLaterList()
      const now = Date.now()
      
      const validPending = appointments?.filter((apt) => {
        const remind = remindLater[apt.id]
        
        // Si NO está en remind later, incluir
        if (!remind) return true
        
        // Si está pero ya pasaron 5 min, incluir
        if (now - remind.timestamp > 5 * 60 * 1000) {
          removeFromRemindLater(apt.id)
          return true
        }
        
        // Aún en período de remind later
        return false
      }) || []
      
      setPendingReviews(
        validPending.map((apt) => ({
          appointment_id: apt.id,
          business_id: apt.business_id,
          business_name: apt.businesses.name,
          employee_id: apt.employee_id,
          employee_name: apt.profiles.full_name,
          service_name: apt.services.name,
          completed_at: apt.start_time
        }))
      )
    } catch (err) {
      console.error('Error loading pending reviews:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const remindLater = (appointmentId: string) => {
    const remindList = getRemindLaterList()
    remindList[appointmentId] = {
      timestamp: Date.now()
    }
    localStorage.setItem(REMIND_LATER_KEY, JSON.stringify(remindList))
    
    // Remover de la lista actual
    setPendingReviews((prev) => prev.filter((p) => p.appointment_id !== appointmentId))
  }
  
  const getRemindLaterList = (): Record<string, { timestamp: number }> => {
    try {
      const stored = localStorage.getItem(REMIND_LATER_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  }
  
  const removeFromRemindLater = (appointmentId: string) => {
    const remindList = getRemindLaterList()
    delete remindList[appointmentId]
    localStorage.setItem(REMIND_LATER_KEY, JSON.stringify(remindList))
  }
  
  return {
    pendingReviews,
    loading,
    refresh: loadPendingReviews,
    remindLater
  }
}
```

#### 5.4 Actualización de migraciones (0.2d)

**Archivo**: `supabase/migrations/20250115000002_add_review_type.sql`

```sql
-- Ya está en Fase 1, pero verificar que reviews table esté lista:

-- Debe tener review_type
ALTER TABLE reviews 
  ADD COLUMN IF NOT EXISTS review_type TEXT NOT NULL DEFAULT 'business' 
  CHECK (review_type IN ('business', 'employee'));

-- Debe tener rating decimal
ALTER TABLE reviews 
  ALTER COLUMN rating TYPE NUMERIC(2,1);

-- Debe tener UNIQUE compuesta (appointment_id + review_type)
CREATE UNIQUE INDEX IF NOT EXISTS reviews_appointment_type_unique 
  ON reviews(appointment_id, review_type);

-- Remover constraint antigua de appointment_id único si existe
ALTER TABLE reviews 
  DROP CONSTRAINT IF EXISTS reviews_appointment_id_key;
```

> **Salidas Fase 5**:
> - MandatoryReviewModal funcional con 2 secciones (negocio + empleado)
> - usePendingReviews con localStorage "remind later" (5 min)
> - Integración en ClientDashboard (modal no-dismissable)
> - Validación: debe calificar ambos, no puede cerrar sin enviar
> - Indicador de progreso si hay múltiples pendientes (1/3, 2/3, 3/3)

### Fase 6 · Notificaciones y Automatización (1.5 días)

#### 6.1 Configurar trigger notify_application_received (0.3d)

**Nuevo archivo**: `supabase/migrations/20250115000006_notification_triggers.sql`

```sql
-- Función trigger para notificar al admin cuando recibe aplicación
CREATE OR REPLACE FUNCTION notify_application_received()
RETURNS TRIGGER AS $$
DECLARE
  vacancy_title TEXT;
  business_owner_id UUID;
  business_name TEXT;
  applicant_name TEXT;
BEGIN
  -- Obtener info de la vacante y negocio
  SELECT 
    jv.title,
    b.owner_id,
    b.name
  INTO 
    vacancy_title,
    business_owner_id,
    business_name
  FROM job_vacancies jv
  JOIN businesses b ON b.id = jv.business_id
  WHERE jv.id = NEW.vacancy_id;
  
  -- Obtener nombre del aplicante
  SELECT full_name INTO applicant_name
  FROM profiles
  WHERE id = NEW.user_id;
  
  -- Insertar notificación in-app para el owner
  INSERT INTO in_app_notifications (
    user_id,
    type,
    title,
    message,
    action_url
  ) VALUES (
    business_owner_id,
    'job_application_received',
    'Nueva aplicación recibida',
    applicant_name || ' ha aplicado a la vacante "' || vacancy_title || '"',
    '/admin/recruitment/applications/' || NEW.id
  );
  
  -- Enviar notificación por email/SMS si está habilitado
  -- (Usando Edge Function send-notification)
  PERFORM
    net.http_post(
      url := 'https://<project-ref>.supabase.co/functions/v1/send-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'type', 'job_application_received',
        'user_id', business_owner_id,
        'business_id', NEW.business_id,
        'data', jsonb_build_object(
          'vacancy_id', NEW.vacancy_id,
          'application_id', NEW.id,
          'vacancy_title', vacancy_title,
          'applicant_name', applicant_name,
          'business_name', business_name
        )
      )
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger
CREATE TRIGGER on_application_created
  AFTER INSERT ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_application_received();

-- Comentarios
COMMENT ON FUNCTION notify_application_received() IS 
  'Envía notificación in-app y por email/SMS al owner del negocio cuando recibe una aplicación';
```

#### 6.2 Integrar tipo de notificación en NotificationContext (0.3d)

**Actualizar**: `src/contexts/NotificationContext.tsx`

```typescript
export type NotificationType = 
  | 'appointment_confirmed'
  | 'appointment_cancelled'
  | 'appointment_reminder'
  | 'employee_request_received'
  | 'employee_request_approved'
  | 'employee_request_rejected'
  // ⭐ NUEVO
  | 'job_application_received'
  | 'job_application_status_update'
  | 'new_vacancy_posted'

// ...

const getNotificationIcon = (type: NotificationType): React.ReactNode => {
  switch (type) {
    case 'job_application_received':
      return <Briefcase className="h-5 w-5 text-blue-600" />
    case 'job_application_status_update':
      return <CheckCircle className="h-5 w-5 text-green-600" />
    case 'new_vacancy_posted':
      return <PlusCircle className="h-5 w-5 text-purple-600" />
    // ... otros casos
  }
}
```

**Actualizar**: `src/hooks/useInAppNotifications.ts`

```typescript
useEffect(() => {
  if (!userId) return
  
  // Subscription a notificaciones
  const channel = supabase
    .channel('in_app_notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'in_app_notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        const newNotification = payload.new as InAppNotification
        
        setNotifications((prev) => [newNotification, ...prev])
        
        // Toast para notificaciones job-related
        if (newNotification.type.startsWith('job_')) {
          toast.info(newNotification.title, {
            description: newNotification.message,
            action: newNotification.action_url ? {
              label: 'Ver',
              onClick: () => navigate(newNotification.action_url!)
            } : undefined
          })
        }
      }
    )
    .subscribe()
  
  return () => {
    channel.unsubscribe()
  }
}, [userId])
```

#### 6.3 Plantilla de Email para aplicaciones (0.5d)

**Nuevo archivo**: `supabase/functions/send-notification/templates/job-application.html`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva Aplicación Recibida</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px 20px;
      border-radius: 10px 10px 0 0;
      text-align: center;
    }
    .content {
      background: white;
      padding: 30px 20px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .vacancy-info {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .applicant-card {
      background: white;
      border: 1px solid #e5e7eb;
      padding: 15px;
      border-radius: 8px;
      margin: 15px 0;
    }
    .cta-button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📬 Nueva Aplicación Recibida</h1>
  </div>
  
  <div class="content">
    <p>Hola,</p>
    
    <p>
      Has recibido una nueva aplicación para una de tus vacantes en 
      <strong>{{business_name}}</strong>.
    </p>
    
    <div class="vacancy-info">
      <h3>Vacante: {{vacancy_title}}</h3>
      <p><strong>ID de vacante:</strong> {{vacancy_id}}</p>
    </div>
    
    <div class="applicant-card">
      <h4>Información del Aplicante</h4>
      <p><strong>Nombre:</strong> {{applicant_name}}</p>
      <p><strong>Email:</strong> {{applicant_email}}</p>
      <p><strong>Fecha de aplicación:</strong> {{applied_at}}</p>
      
      {{#if cover_letter}}
      <div style="margin-top: 15px; padding: 10px; background: #f9fafb; border-left: 3px solid #667eea;">
        <strong>Carta de presentación:</strong>
        <p>{{cover_letter}}</p>
      </div>
      {{/if}}
    </div>
    
    <center>
      <a href="{{dashboard_url}}" class="cta-button">
        Ver Aplicación Completa
      </a>
    </center>
    
    <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
      💡 <strong>Tip:</strong> Responde rápido para destacar tu negocio y atraer al mejor talento.
    </p>
  </div>
  
  <div class="footer">
    <p>
      Este email fue enviado por AppointSync Pro<br>
      <a href="{{unsubscribe_url}}">Administrar preferencias de notificación</a>
    </p>
  </div>
</body>
</html>
```

**Actualizar**: `supabase/functions/send-notification/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { type, user_id, business_id, data } = await req.json()
    
    // Cargar preferencias del usuario
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    const { data: prefs } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', user_id)
      .eq('notification_type', type)
      .single()
    
    // Si no hay preferencias, usar defaults del negocio
    const { data: businessSettings } = await supabase
      .from('business_notification_settings')
      .select('*')
      .eq('business_id', business_id)
      .single()
    
    // Enviar por los canales habilitados
    const results = []
    
    // EMAIL
    if (prefs?.email_enabled || businessSettings?.email_enabled) {
      if (type === 'job_application_received') {
        const emailResult = await sendJobApplicationEmail(data)
        results.push({ channel: 'email', ...emailResult })
      }
    }
    
    // SMS
    if (prefs?.sms_enabled || businessSettings?.sms_enabled) {
      const smsResult = await sendSMS(data)
      results.push({ channel: 'sms', ...smsResult })
    }
    
    // Log de notificación
    await supabase.from('notification_log').insert({
      user_id,
      business_id,
      notification_type: type,
      channels: results.map(r => r.channel),
      status: results.every(r => r.success) ? 'sent' : 'partial',
      metadata: { results }
    })
    
    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

async function sendJobApplicationEmail(data: any) {
  // Cargar template y reemplazar variables
  const template = await Deno.readTextFile('./templates/job-application.html')
  const html = template
    .replace(/{{business_name}}/g, data.business_name)
    .replace(/{{vacancy_title}}/g, data.vacancy_title)
    .replace(/{{applicant_name}}/g, data.applicant_name)
    // ... más reemplazos
  
  // Enviar con AWS SES
  const response = await fetch('https://email.us-east-1.amazonaws.com/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'AWS4-HMAC-SHA256 ...'
    },
    body: new URLSearchParams({
      'Action': 'SendEmail',
      'Source': 'noreply@appointsync.com',
      'Destination.ToAddresses.member.1': data.recipient_email,
      'Message.Subject.Data': 'Nueva aplicación recibida',
      'Message.Body.Html.Data': html
    })
  })
  
  return { success: response.ok }
}
```

#### 6.4 Actualizar NotificationSettings (0.4d)

**Actualizar**: `src/components/settings/NotificationSettings.tsx`

```typescript
const NOTIFICATION_TYPES = [
  // ... existentes
  {
    id: 'job_application_received',
    label: 'Nueva aplicación a vacante',
    description: 'Cuando alguien aplica a una de tus vacantes publicadas',
    category: 'recruitment'
  },
  {
    id: 'job_application_status_update',
    label: 'Cambio de estado en aplicación',
    description: 'Cuando el admin actualiza el estado de tu aplicación',
    category: 'recruitment'
  },
  {
    id: 'new_vacancy_posted',
    label: 'Nueva vacante disponible',
    description: 'Cuando se publica una vacante que coincide con tu perfil',
    category: 'recruitment'
  }
]

// Renderizar sección "Reclutamiento"
<Accordion type="single" collapsible>
  <AccordionItem value="recruitment">
    <AccordionTrigger>
      <div className="flex items-center gap-2">
        <Briefcase className="h-5 w-5" />
        Reclutamiento
      </div>
    </AccordionTrigger>
    <AccordionContent>
      {NOTIFICATION_TYPES
        .filter(nt => nt.category === 'recruitment')
        .map(notifType => (
          <NotificationPreferenceRow
            key={notifType.id}
            type={notifType}
            preferences={preferences}
            onChange={handleToggle}
          />
        ))}
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

> **Salidas Fase 6**:
> - Trigger notify_application_received que inserta en in_app_notifications
> - Edge Function send-notification con template HTML job-application
> - NotificationContext soporta 3 nuevos tipos job-related
> - NotificationSettings tiene sección "Reclutamiento" con 3 toggles
> - Logs en notification_log para auditoría

### Fase 7 · QA, Testing y Documentación (2 días)

#### 7.1 Tests Unitarios con Vitest (0.8d)

**Nuevo archivo**: `src/hooks/__tests__/useJobVacancies.test.tsx`

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useJobVacancies } from '../useJobVacancies'
import { supabase } from '@/lib/supabase'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}))

describe('useJobVacancies', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  it('debería cargar vacantes activas del negocio', async () => {
    const mockVacancies = [
      {
        id: '1',
        title: 'Estilista Senior',
        business_id: 'business-1',
        status: 'active',
        created_at: '2025-01-15'
      }
    ]
    
    const mockSelect = vi.fn().mockReturnThis()
    const mockEq = vi.fn().mockResolvedValue({ data: mockVacancies, error: null })
    
    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
      eq: mockEq
    } as any)
    
    const { result } = renderHook(() => useJobVacancies('business-1'))
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.vacancies).toHaveLength(1)
    expect(result.current.vacancies[0].title).toBe('Estilista Senior')
  })
  
  it('debería crear vacante con servicios requeridos', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ 
      data: { id: 'new-vacancy-1' }, 
      error: null 
    })
    
    vi.mocked(supabase.from).mockReturnValue({
      insert: mockInsert,
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: {}, error: null })
    } as any)
    
    const { result } = renderHook(() => useJobVacancies('business-1'))
    
    await result.current.createVacancy({
      title: 'Barbero',
      description: 'Buscamos barbero con experiencia',
      business_id: 'business-1',
      position_type: 'full_time',
      required_services: ['service-1', 'service-2'],
      salary_min: 2000000,
      salary_max: 3000000
    })
    
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Barbero',
        required_services: ['service-1', 'service-2']
      })
    )
  })
})
```

**Nuevo archivo**: `src/hooks/__tests__/useTaxCalculation.test.tsx`

```typescript
import { renderHook } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useTaxCalculation } from '../useTaxCalculation'

describe('useScheduleConflicts', () => {
  it('debería detectar solapamiento horario simple', async () => {
    const { result } = renderHook(() => useScheduleConflicts('user-1'))
    
    const newSchedule = {
      monday: { start: '09:00', end: '17:00' },
      tuesday: { start: '09:00', end: '17:00' }
    }
    
    // Mock existing employment con horario conflictivo
    // ...
    
    const conflict = await result.current.checkConflict(newSchedule)
    
    expect(conflict.hasConflict).toBe(true)
    expect(conflict.conflictingBusinesses).toHaveLength(1)
    expect(conflict.conflictingBusinesses[0].overlap_hours).toBeDefined()
  })
  
  it('NO debería marcar conflicto si horarios no se solapan', async () => {
    const { result } = renderHook(() => useScheduleConflicts('user-1'))
    
    const newSchedule = {
      monday: { start: '18:00', end: '22:00' }, // Tarde
      tuesday: { start: '18:00', end: '22:00' }
    }
    
    // Mock existing employment 09:00-17:00
    // ...
    
    const conflict = await result.current.checkConflict(newSchedule)
    
    expect(conflict.hasConflict).toBe(false)
    expect(conflict.conflictingBusinesses).toHaveLength(0)
  })
})
```

#### 7.2 Tests E2E con Playwright (0.8d)

**Nuevo archivo**: `tests/job-vacancy-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Job Vacancy System E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login como admin
    await page.goto('http://localhost:5173/login')
    await page.fill('[name="email"]', 'admin@test.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/admin')
  })
  
  test('Admin puede crear vacante con servicios requeridos', async ({ page }) => {
    // Navegar a Reclutamiento
    await page.click('text=Reclutamiento')
    
    // Click en "Nueva Vacante"
    await page.click('text=Nueva Vacante')
    
    // Llenar formulario
    await page.fill('[name="title"]', 'Estilista Senior E2E')
    await page.fill('[name="description"]', 'Vacante de prueba E2E con mínimo 100 caracteres para validación del formulario de creación')
    
    await page.selectOption('[name="position_type"]', 'full_time')
    await page.fill('[name="salary_min"]', '2500000')
    await page.fill('[name="salary_max"]', '3500000')
    
    // Seleccionar servicios requeridos
    await page.click('text=Seleccionar servicios')
    await page.click('text=Corte de cabello') // Checkbox
    await page.click('text=Coloración') // Checkbox
    await page.click('text=Confirmar')
    
    // Submit
    await page.click('button:has-text("Publicar Vacante")')
    
    // Verificar toast success
    await expect(page.locator('text=Vacante publicada exitosamente')).toBeVisible()
    
    // Verificar que aparece en la lista
    await expect(page.locator('text=Estilista Senior E2E')).toBeVisible()
  })
  
  test('Employee puede aplicar a vacante y ve alerta de conflicto', async ({ page }) => {
    // Cambiar a rol Employee
    await page.goto('http://localhost:5173/employee')
    
    // Ir a Ofertas Disponibles
    await page.click('text=Ofertas Disponibles')
    
    // Buscar vacante
    await page.fill('[placeholder*="Buscar"]', 'Estilista')
    await page.waitForTimeout(500) // Debounce
    
    // Click en primera vacante
    await page.locator('.vacancy-card').first().click()
    
    // Ver detalle
    await expect(page.locator('text=Aplicar ahora')).toBeVisible()
    
    // Aplicar
    await page.click('text=Aplicar ahora')
    
    // Llenar carta de presentación
    await page.fill(
      'textarea[name="coverLetter"]',
      'Tengo 5 años de experiencia en corte y coloración. Me interesa mucho esta posición porque...'
    )
    
    // Si hay conflicto de horario, debe mostrar alerta
    const conflictAlert = page.locator('text=Conflicto de horario detectado')
    if (await conflictAlert.isVisible()) {
      await expect(conflictAlert).toBeVisible()
      await page.click('text=Entendido')
    }
    
    // Enviar aplicación
    await page.click('button:has-text("Enviar aplicación")')
    
    // Verificar toast
    await expect(page.locator('text=Aplicación enviada exitosamente')).toBeVisible()
  })
  
  test('Client debe completar reviews obligatorias después de servicio', async ({ page }) => {
    // Login como cliente
    await page.goto('http://localhost:5173/login')
    await page.fill('[name="email"]', 'client@test.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Debe mostrar modal de reviews si hay pendientes
    const reviewModal = page.locator('text=Califica tu experiencia')
    
    if (await reviewModal.isVisible()) {
      // Calificar negocio (5 estrellas)
      await page.locator('.business-rating star:nth-child(5)').click()
      await page.fill('textarea[name="business_comment"]', 'Excelente servicio, instalaciones muy limpias')
      
      // Calificar empleado (5 estrellas)
      await page.locator('.employee-rating star:nth-child(5)').click()
      await page.fill('textarea[name="employee_comment"]', 'Muy profesional, me encantó el resultado')
      
      // Enviar
      await page.click('button:has-text("Enviar")')
      
      // Verificar toast
      await expect(page.locator('text=Gracias por tu opinión')).toBeVisible()
    }
  })
})
```

#### 7.3 Checklist de QA Manual (0.2d)

**Nuevo archivo**: `docs/QA_CHECKLIST_VACANTES.md`

```markdown
# ✅ Checklist de QA - Sistema de Vacantes Laborales

## Fase 1: Modelado de Datos
- [ ] Reviews table acepta rating decimal (ej: 4.5)
- [ ] Reviews table tiene review_type ('business' | 'employee')
- [ ] UNIQUE constraint funciona: (appointment_id + review_type)
- [ ] employee_profiles table existe con columnas correctas
- [ ] job_vacancies tiene work_schedule, number_of_positions, remote_allowed
- [ ] job_applications tiene cover_letter, available_from
- [ ] RPC get_matching_vacancies retorna resultados con match_score

## Fase 2: Backend y Hooks
- [ ] useJobVacancies.createVacancy() guarda required_services correctamente
- [ ] useJobVacancies.fetchVacancies() filtra por business_id
- [ ] useJobApplications.fetchApplications() trae aplicaciones con JOIN correcto
- [ ] usePendingReviews detecta appointments sin reviews
- [ ] useEmployeeProfile carga y actualiza employee_profiles
- [ ] useScheduleConflicts detecta solapamientos correctamente
- [ ] RPC get_matching_vacancies calcula score según skills, servicios, ciudad

## Fase 3: UI Admin
- [ ] RecruitmentDashboard muestra tabs "Vacantes" y "Aplicaciones"
- [ ] CreateVacancy sugiere empleados terminados recientemente
- [ ] ApplicationsManagement filtra por status (pending/reviewing/accepted/rejected)
- [ ] ApplicantProfileModal muestra 4 tabs (Info, Servicios, Experiencia, Reviews)
- [ ] Botón "Aceptar" cambia status a 'accepted' y envía notificación

## Fase 4: UI Employee
- [ ] EmployeeDashboard tiene item "Ofertas Disponibles" en sidebar
- [ ] AvailableVacanciesMarketplace carga vacantes con get_matching_vacancies
- [ ] Filtros funcionan: búsqueda, ciudad, tipo, experiencia, salario, remoto
- [ ] VacancyCard muestra match_score si >60%
- [ ] ApplicationFormModal valida cover_letter mínimo 100 chars
- [ ] ScheduleConflictAlert aparece si hay solapamiento de horarios
- [ ] EmployeeProfileSettings guarda specializations, certifications, links

## Fase 5: Sistema de Reviews
- [ ] MandatoryReviewModal aparece en ClientDashboard si hay pendientes
- [ ] Modal no se puede cerrar clickeando fuera o presionando ESC
- [ ] Formulario tiene 2 secciones: negocio + empleado
- [ ] Validación: ambos ratings > 0, ambos comments no vacíos
- [ ] Botón "Recordar en 5 minutos" guarda en localStorage
- [ ] Después de 5 min, modal vuelve a aparecer
- [ ] Si hay múltiples pendientes, muestra indicador (1/3, 2/3, 3/3)
- [ ] Al enviar, crea 2 reviews con review_type correcto

## Fase 6: Notificaciones
- [ ] Trigger notify_application_received se ejecuta al INSERT en job_applications
- [ ] Notificación in-app aparece en NotificationBell
- [ ] Edge Function send-notification envía email con template HTML
- [ ] Template job-application.html renderiza datos correctos
- [ ] NotificationSettings tiene sección "Reclutamiento" con 3 tipos
- [ ] Logs en notification_log registran envíos

## Fase 7: Testing
- [ ] Tests unitarios pasan: `npm run test`
- [ ] Tests E2E pasan: `npm run test:e2e`
- [ ] Coverage >80% en hooks críticos
- [ ] No hay errores en consola del navegador
- [ ] Lighthouse score >90 en Performance

## Casos Edge
- [ ] Aplicar 2 veces a misma vacante → Error 23505 (UNIQUE violation)
- [ ] Crear vacancy sin required_services → Permite pero array vacío
- [ ] Employee sin employee_profile → Puede aplicar pero match_score bajo
- [ ] Vacante con 0 posiciones → No aparece en búsqueda (is_active = false)
- [ ] Review con rating 0 → Rechazado por CHECK constraint
- [ ] Schedule conflict con 100% overlap → Alerta roja visible
```

#### 7.4 Documentación del sistema (0.2d)

**Actualizar**: `docs/SISTEMA_VACANTES_LABORALES_MANUAL.md`

```markdown
# 📘 Manual de Usuario - Sistema de Vacantes Laborales

## Para Administradores

### Crear una Vacante
1. Ir a **Admin Dashboard** → **Reclutamiento**
2. Click en **Nueva Vacante**
3. Llenar información:
   - Título y descripción (mín. 100 chars)
   - Tipo de contrato (Tiempo completo, Medio tiempo, Freelance, Temporal)
   - Rango salarial
   - Servicios requeridos (ej: Corte de cabello, Coloración)
   - Horario de trabajo (opcional)
   - Experiencia requerida
4. Click en **Publicar Vacante**

**Tip**: El sistema te sugerirá automáticamente empleados que terminaron recientemente para que los recontrates.

### Gestionar Aplicaciones
1. Ir a **Aplicaciones** en Reclutamiento
2. Ver aplicaciones por estado:
   - **Pendientes**: Recién recibidas, requieren revisión
   - **En revisión**: Estás evaluando al candidato
   - **Aceptadas**: Candidato fue contratado
   - **Rechazadas**: Candidato no calificó
3. Click en una aplicación para ver perfil completo:
   - Información general
   - Servicios que ofrece
   - Experiencia laboral
   - Reseñas de clientes anteriores

### Contratar un Candidato
1. Abrir aplicación
2. Revisar perfil y carta de presentación
3. Click en **Aceptar**
4. El candidato recibirá notificación automática
5. Automáticamente se crea relación en `business_employees`

## Para Empleados

### Buscar Ofertas
1. Ir a **Employee Dashboard** → **Ofertas Disponibles**
2. Usar filtros:
   - Buscar por palabra clave
   - Filtrar por ciudad
   - Tipo de contrato
   - Nivel de experiencia
   - Rango salarial
   - Solo trabajos remotos
3. Ver badge "X% match" en vacantes que coinciden con tu perfil

### Aplicar a una Vacante
1. Click en vacante de interés
2. Ver detalles completos
3. Click en **Aplicar ahora**
4. Si hay conflicto de horario con tus trabajos actuales:
   - Verás alerta con negocios y horas que se solapan
   - Puedes continuar de todas formas
5. Escribir carta de presentación (mín. 100 caracteres)
6. Indicar fecha desde cuándo estás disponible
7. Click en **Enviar aplicación**

### Completar Perfil Profesional
Para tener mejor match score:
1. Ir a **Settings** → **Perfil Profesional**
2. Completar:
   - Resumen profesional
   - Años de experiencia
   - Especializaciones
   - Idiomas
   - Enlaces (Portafolio, LinkedIn, GitHub)
3. Click en **Guardar cambios**

## Para Clientes

### Sistema de Reviews Obligatorias
Después de cada servicio completado:
1. Al abrir la app, verás modal "Califica tu experiencia"
2. **No puedes cerrarlo** hasta calificar
3. Debes calificar 2 aspectos:
   - **Negocio**: Instalaciones, limpieza, atención general
   - **Profesional**: Técnica, amabilidad, resultado del servicio
4. Ambas calificaciones requieren:
   - Rating de 1 a 5 estrellas
   - Comentario escrito
5. Si tienes múltiples servicios pendientes, aparecerá indicador (1/3, 2/3, 3/3)
6. Opción **"Recordar en 5 minutos"** si no puedes calificar ahora

**Importante**: Las reviews son anónimas y ayudan a otros clientes a elegir mejor.
```

> **Salidas Fase 7**:
> - 6 archivos de tests (3 unitarios + 3 E2E)
> - QA checklist con 40+ puntos de validación
> - Manual de usuario completo (3 roles)
> - Documentación técnica actualizada
> - Scripts de CI/CD para testing automático

---

## 🎯 Resumen Ejecutivo

### Esfuerzo Total
- **Fase 1 (DB)**: 1.5 días
- **Fase 2 (Hooks)**: 2 días
- **Fase 3 (UI Admin)**: 2.5 días
- **Fase 4 (UI Employee)**: 2.5 días
- **Fase 5 (Reviews)**: 2 días
- **Fase 6 (Notificaciones)**: 1.5 días
- **Fase 7 (QA)**: 2 días
- **TOTAL**: **14 días** (~112 horas)

### Archivos Nuevos
- 5 migraciones SQL
- 6 hooks personalizados
- 12 componentes React
- 1 RPC function
- 1 Edge Function actualizada
- 6 archivos de tests
- 3 documentos MD

### Dependencias Críticas
- Fase 1 → Fase 2 (hooks necesitan schema actualizado)
- Fase 2 → Fases 3-4 (UI necesita hooks funcionales)
- Fase 5 independiente (puede iniciarse temprano)
- Fase 6 necesita Fase 3 (trigger requiere job_applications table poblada)
- Fase 7 al final (testing después de implementación)

### Riesgos Identificados
1. **Complejidad de schedule conflicts**: Algoritmo de detección puede tener edge cases
   - *Mitigación*: Tests exhaustivos con múltiples escenarios
2. **Performance de get_matching_vacancies**: RPC puede ser lento con muchos usuarios
   - *Mitigación*: Índices en skills, servicios, ciudad; LIMIT 50
3. **UX de reviews obligatorias**: Clientes pueden molestarse con modal persistente
   - *Mitigación*: Opción "Recordar en 5 min", UI amigable, explicar beneficios

### Siguiente Paso Sugerido
✅ **Ejecutar Fase 1 (Migraciones)** primero para validar schema y RPC functions en entorno de desarrollo antes de continuar con código frontend.

| Paso | Descripción | Entregables | Duración |
|------|-------------|-------------|----------|
| 7.1 | Pruebas unitarias (Vitest) | Hooks y helpers críticos (ratings, horarios) | 0.3d |
| 7.2 | Pruebas E2E (Playwright) | Flujos admin (crear vacante), employee (aplicar), client (review) | 0.4d |
| 7.3 | QA manual | Checklist roles (admin, employee, client) en staging | 0.4d |
| 7.4 | Documentación | Actualizar `.github/copilot-instructions.md`, `DATABASE_REDESIGN_ANALYSIS.md`, guías de pruebas | 0.2d |
| 7.5 | Demo & Feedback | Sesión con stakeholders | 0.2d |

---

## 🔄 Gestión de Cambios y Feature Flags

| Flag | Descripción | Ubicación | Estado inicial |
|------|-------------|-----------|----------------|
| `feature.jobs.vacancies` | Sección de vacantes en AdminDashboard | `src/constants/features.ts` | OFF |
| `feature.jobs.employee-marketplace` | Ofertas disponibles en EmployeeDashboard | `src/constants/features.ts` | OFF |
| `feature.reviews.mandatory` | Modal obligatorio post-servicio | `src/constants/features.ts` | OFF |

> Activar gradualmente por negocio o por cohorte de usuarios.

---

## 🧪 Plan de Pruebas

### 1. Pruebas Unitarias (Vitest)
- `usePendingReviews.test.ts` → Generar citas mock, verificar detección correcta
- `scheduleConflicts.test.ts` → Escenarios con y sin solapamiento (limite inclusive)
- `reviewRatings.test.ts` → Validar conversión a decimales, constraint 1.0-5.0

### 2. Pruebas E2E (Playwright)
1. **Admin:**
   - Crear vacante
   - Reutilizar puesto de empleado despedido
   - Pausar, duplicar, cerrar vacante
2. **Employee:**
   - Ver lista filtrada por ciudad y skills
   - Aplicar a vacante con conflicto horario (ver alerta)
   - Actualizar perfil profesional
3. **Cliente:**
   - Completar cita
   - Ver modal obligatorio y enviar doble review
4. **Notificaciones:**
   - Admin recibe notificación in-app + email
   - Empleado recibe confirmación/rechazo

### 3. Checklist QA Manual
- [ ] UI en español e inglés (ver `LanguageContext`)
- [ ] Tema claro/oscuro (clases `bg-card`, `text-muted-foreground`)
- [ ] Accesibilidad básica (labels, focus states)
- [ ] Performance (queries con índices, evitar N+1)

---

## 🧠 Consideraciones Técnicas

1. **Roles Dinámicos**
   - No persistir roles en DB; usar `useUserRoles` para cargar dinámicamente.
   - Recordar: `business_employees` usa `employee_id`, nunca `user_id`.

2. **Supabase**
   - Usar MCP para migraciones (`mcp_supabase_execute_sql`).
   - Evitar `Date.now()` en nombres de canales (leaks previos).
   - Cuidar RLS: agregar políticas para nuevas tablas (`employee_profiles`).

3. **Notificaciones**
   - Tiempos y canales configurables a nivel negocio (`business_notification_settings`).
   - Usar `priority = 'high'` para nuevas aplicaciones.

4. **Rating con decimales**
   - Ajustar calculadoras (`useReviews`, `ReviewList`, `ReviewCard`).
   - Actualizar vistas materializadas si dependen del rating.

5. **Compatibilidad Mobile/Extension**
   - Revisar `src/mobile/` y `src/browser-extension/` si consumen hooks compartidos.
   - Añadir banderas para esconder features no soportadas.

---

## 📈 Métricas de Éxito

| Métrica | KPI Inicial | Meta |
|---------|-------------|------|
| % Citas con review | 32% | ≥ 95% |
| Tiempo respuesta a vacante | >72h | ≤ 24h |
| # Aplicaciones por vacante | 2.1 | ≥ 5 |
| % Vacantes con candidato asignado | 45% | ≥ 70% |
| Satisfacción admin (CSAT) | N/A | ≥ 4/5 |

---

## 👥 Roles y Responsabilidades

| Rol | Nombre | Responsabilidades |
|-----|--------|-------------------|
| Líder Técnico | [Asignar] | Coordinación, revisiones de código, arquitectura |
| Backend Developer | [Asignar] | Migraciones, hooks RPC, triggers |
| Frontend Developer | [Asignar] | UI admin/employee, modales, validaciones |
| QA Engineer | [Asignar] | Pruebas unitarias, E2E, QA manual |
| DevOps | [Asignar] | Deploy, feature flags, edge functions |

---

## 🛠️ Integraciones Pendientes

1. **Correo templado para nuevo aplicante**
   - Crear plantilla en `supabase/functions/send-notification/templates`.
   - Variables: nombre vacante, nombre candidato, link al panel admin.

2. **Reportes y analítica**
   - Dashboard de métricas de vacantes (futuro): ratio aplicaciones/contrataciones.
   - Integrar con `reports` módulo si procede.

3. **Mobile y Extensión**
   - Investigar disponibilidad en la app móvil (Expo) y extensión (Chrome) para replicar features clave.

---

## 📌 Dependencias y Bloqueos

| Dependencia | Descripción | Estado |
|-------------|-------------|--------|
| Migración ratings decimales | Requiere downtime corto (índice) | Planificar |
| Edge Function send-notification | Debe soportar nuevo tipo `job_application_*` | Actualizar |
| Documentación interna | Atualizar `.github/copilot-instructions.md` | Pendiente |
| Variables entorno | Verificar `AWS_*`, `WHATSAPP_*`, `VITE_DEMO_MODE` | OK |

---

## ✅ Checklist de Cierre

- [ ] Todas las migraciones aplicadas (`npx supabase db push`).
- [ ] Hooks probados (unit tests).
- [ ] UI admin/employee integrada con feature flags.
- [ ] Modal review obligatorio funcionando (con fallback).
- [ ] Notificaciones in-app + email validadas.
- [ ] Documentación actualizada y merge a `main`.
- [ ] Demo final aprobada por stakeholders.

---

**Fin del Plan Estratégico**
