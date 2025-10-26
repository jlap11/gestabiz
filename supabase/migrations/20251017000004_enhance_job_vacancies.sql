-- =====================================================================
-- Migración: Mejorar tabla job_vacancies
-- Descripción: Agregar campos para trabajo remoto, horarios, experiencia
-- Fecha: 2025-10-17
-- Autor: Sistema de Vacantes Laborales
-- =====================================================================

-- Paso 1: Agregar nuevas columnas a job_vacancies
ALTER TABLE job_vacancies
  ADD COLUMN IF NOT EXISTS work_schedule JSONB,
  ADD COLUMN IF NOT EXISTS number_of_positions INTEGER DEFAULT 1 CHECK (number_of_positions > 0),
  ADD COLUMN IF NOT EXISTS remote_allowed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS experience_required TEXT CHECK (
    experience_required IN ('entry_level', 'mid_level', 'senior', 'any')
  ),
  ADD COLUMN IF NOT EXISTS location_city TEXT,
  ADD COLUMN IF NOT EXISTS location_address TEXT,
  ADD COLUMN IF NOT EXISTS benefits TEXT[] DEFAULT '{}';

-- Paso 2: Crear índices para búsqueda
CREATE INDEX IF NOT EXISTS idx_job_vacancies_remote 
  ON job_vacancies(remote_allowed) 
  WHERE remote_allowed = true AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_job_vacancies_city 
  ON job_vacancies(location_city) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_job_vacancies_experience 
  ON job_vacancies(experience_required) 
  WHERE is_active = true;

-- Índice para búsqueda de beneficios
CREATE INDEX IF NOT EXISTS idx_job_vacancies_benefits 
  ON job_vacancies USING GIN(benefits);

-- Paso 3: Crear función para validar work_schedule JSONB
CREATE OR REPLACE FUNCTION validate_work_schedule()
RETURNS TRIGGER AS $$
DECLARE
  day TEXT;
  schedule JSONB;
  valid_days TEXT[] := ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
BEGIN
  IF NEW.work_schedule IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Validar que cada día tenga 'start' y 'end'
  FOR day IN SELECT * FROM jsonb_object_keys(NEW.work_schedule)
  LOOP
    IF NOT (day = ANY(valid_days)) THEN
      RAISE EXCEPTION 'Día inválido: %. Días válidos: monday, tuesday, wednesday, thursday, friday, saturday, sunday', day;
    END IF;
    
    schedule := NEW.work_schedule -> day;
    
    IF NOT (schedule ? 'start' AND schedule ? 'end') THEN
      RAISE EXCEPTION 'Horario de % debe contener start y end', day;
    END IF;
    
    -- Validar formato HH:MM
    IF NOT ((schedule ->> 'start') ~ '^([0-1][0-9]|2[0-3]):[0-5][0-9]$' AND
            (schedule ->> 'end') ~ '^([0-1][0-9]|2[0-3]):[0-5][0-9]$') THEN
      RAISE EXCEPTION 'Formato de hora inválido en %. Use HH:MM (24h)', day;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Paso 4: Crear trigger para validar work_schedule
DROP TRIGGER IF EXISTS validate_work_schedule_trigger ON job_vacancies;

CREATE TRIGGER validate_work_schedule_trigger
  BEFORE INSERT OR UPDATE ON job_vacancies
  FOR EACH ROW
  EXECUTE FUNCTION validate_work_schedule();

-- Paso 5: Actualizar función para auto-desactivar vacantes sin posiciones
CREATE OR REPLACE FUNCTION auto_deactivate_filled_vacancies()
RETURNS TRIGGER AS $$
DECLARE
  accepted_count INTEGER;
BEGIN
  -- Contar aplicaciones aceptadas para esta vacante
  SELECT COUNT(*) INTO accepted_count
  FROM job_applications
  WHERE vacancy_id = NEW.vacancy_id
  AND status = 'accepted';
  
  -- Si se llenaron todas las posiciones, desactivar vacante
  IF accepted_count >= (
    SELECT number_of_positions 
    FROM job_vacancies 
    WHERE id = NEW.vacancy_id
  ) THEN
    UPDATE job_vacancies
    SET is_active = false
    WHERE id = NEW.vacancy_id;
    
    RAISE NOTICE 'Vacante % desactivada: todas las posiciones ocupadas', NEW.vacancy_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Paso 6: Crear trigger para auto-desactivar
DROP TRIGGER IF EXISTS auto_deactivate_on_accept ON job_applications;

CREATE TRIGGER auto_deactivate_on_accept
  AFTER UPDATE ON job_applications
  FOR EACH ROW
  WHEN (NEW.status = 'accepted' AND OLD.status != 'accepted')
  EXECUTE FUNCTION auto_deactivate_filled_vacancies();

-- Paso 7: Crear vista materializada para vacantes activas
DROP MATERIALIZED VIEW IF EXISTS active_vacancies_with_stats;

CREATE MATERIALIZED VIEW active_vacancies_with_stats AS
SELECT
  jv.*,
  b.name as business_name,
  b.logo_url as business_logo_url,
  b.city as business_city,
  COUNT(DISTINCT ja.id) as application_count,
  COUNT(DISTINCT ja.id) FILTER (WHERE ja.status = 'accepted') as accepted_count,
  AVG(br.rating) as business_avg_rating,
  COUNT(DISTINCT br.id) as business_review_count
FROM job_vacancies jv
JOIN businesses b ON b.id = jv.business_id
LEFT JOIN job_applications ja ON ja.vacancy_id = jv.id
LEFT JOIN reviews br ON br.business_id = jv.business_id AND br.review_type = 'business'
WHERE jv.is_active = true
GROUP BY jv.id, b.name, b.logo_url, b.city;

-- Índice para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_active_vacancies_business 
  ON active_vacancies_with_stats(business_id);

CREATE INDEX IF NOT EXISTS idx_active_vacancies_city 
  ON active_vacancies_with_stats(location_city);

-- Paso 8: Función para refrescar vista materializada
CREATE OR REPLACE FUNCTION refresh_active_vacancies_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY active_vacancies_with_stats;
END;
$$ LANGUAGE plpgsql;

-- Paso 9: Actualizar valores por defecto de vacantes existentes
UPDATE job_vacancies
SET 
  number_of_positions = 1,
  remote_allowed = false,
  experience_required = 'any'
WHERE number_of_positions IS NULL
   OR remote_allowed IS NULL
   OR experience_required IS NULL;

-- Paso 10: Comentarios
COMMENT ON COLUMN job_vacancies.work_schedule IS 
  'Horario laboral por día. Formato: {"monday": {"start": "09:00", "end": "17:00"}, ...}';

COMMENT ON COLUMN job_vacancies.number_of_positions IS 
  'Número de puestos disponibles. La vacante se desactiva automáticamente cuando se ocupan todos';

COMMENT ON COLUMN job_vacancies.remote_allowed IS 
  'Si true, el trabajo se puede realizar de forma remota';

COMMENT ON COLUMN job_vacancies.experience_required IS 
  'Nivel de experiencia requerido: entry_level, mid_level, senior, any';

COMMENT ON COLUMN job_vacancies.benefits IS 
  'Array de beneficios (ej: ["Comisiones", "Propinas", "Capacitación", "Horario flexible"])';

COMMENT ON MATERIALIZED VIEW active_vacancies_with_stats IS 
  'Vista materializada con estadísticas de vacantes activas. Refrescar con refresh_active_vacancies_stats()';

-- Paso 11: Verificación
DO $$
DECLARE
  total_vacancies INTEGER;
  remote_vacancies INTEGER;
  with_schedule INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_vacancies FROM job_vacancies;
  SELECT COUNT(*) INTO remote_vacancies FROM job_vacancies WHERE remote_allowed = true;
  SELECT COUNT(*) INTO with_schedule FROM job_vacancies WHERE work_schedule IS NOT NULL;
  
  RAISE NOTICE 'Migración completada. Total: %, Remotas: %, Con horario: %', 
    total_vacancies, remote_vacancies, with_schedule;
END $$;

-- =====================================================================
-- ROLLBACK (ejecutar solo si se necesita revertir)
-- =====================================================================
-- DROP FUNCTION IF EXISTS refresh_active_vacancies_stats;
-- DROP MATERIALIZED VIEW IF EXISTS active_vacancies_with_stats;
-- DROP TRIGGER IF EXISTS auto_deactivate_on_accept ON job_applications;
-- DROP FUNCTION IF EXISTS auto_deactivate_filled_vacancies;
-- DROP TRIGGER IF EXISTS validate_work_schedule_trigger ON job_vacancies;
-- DROP FUNCTION IF EXISTS validate_work_schedule;
-- DROP INDEX IF EXISTS idx_job_vacancies_benefits;
-- DROP INDEX IF EXISTS idx_job_vacancies_experience;
-- DROP INDEX IF EXISTS idx_job_vacancies_city;
-- DROP INDEX IF EXISTS idx_job_vacancies_remote;
-- ALTER TABLE job_vacancies DROP COLUMN IF EXISTS benefits;
-- ALTER TABLE job_vacancies DROP COLUMN IF EXISTS location_address;
-- ALTER TABLE job_vacancies DROP COLUMN IF EXISTS location_city;
-- ALTER TABLE job_vacancies DROP COLUMN IF EXISTS experience_required;
-- ALTER TABLE job_vacancies DROP COLUMN IF EXISTS remote_allowed;
-- ALTER TABLE job_vacancies DROP COLUMN IF EXISTS number_of_positions;
-- ALTER TABLE job_vacancies DROP COLUMN IF EXISTS work_schedule;
