-- =====================================================================
-- Migración: Crear tabla employee_profiles
-- Descripción: Perfiles profesionales extendidos para empleados
-- Fecha: 2025-10-17
-- Autor: Sistema de Vacantes Laborales
-- =====================================================================

-- Paso 1: Crear tabla employee_profiles
CREATE TABLE IF NOT EXISTS employee_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Información profesional
  professional_summary TEXT,
  years_of_experience INTEGER DEFAULT 0 CHECK (years_of_experience >= 0 AND years_of_experience <= 50),
  
  -- Skills y especialidades (arrays)
  specializations TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  
  -- Certificaciones (JSONB array)
  certifications JSONB DEFAULT '[]',
  
  -- Enlaces profesionales
  portfolio_url TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  
  -- Disponibilidad
  available_for_hire BOOLEAN DEFAULT true,
  preferred_work_type TEXT CHECK (preferred_work_type IN ('full_time', 'part_time', 'freelance', 'any')),
  
  -- Preferencias salariales (COP)
  expected_salary_min INTEGER,
  expected_salary_max INTEGER,
  
  -- Metadatos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Paso 2: Crear índices
CREATE INDEX IF NOT EXISTS idx_employee_profiles_user_id 
  ON employee_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_employee_profiles_available 
  ON employee_profiles(available_for_hire) 
  WHERE available_for_hire = true;

-- Índice GIN para búsqueda en arrays
CREATE INDEX IF NOT EXISTS idx_employee_profiles_specializations 
  ON employee_profiles USING GIN(specializations);

CREATE INDEX IF NOT EXISTS idx_employee_profiles_languages 
  ON employee_profiles USING GIN(languages);

-- Índice para búsqueda de certificaciones
CREATE INDEX IF NOT EXISTS idx_employee_profiles_certifications 
  ON employee_profiles USING GIN(certifications);

-- Paso 3: Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_employee_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Paso 4: Crear trigger para updated_at
DROP TRIGGER IF EXISTS employee_profiles_updated_at ON employee_profiles;

CREATE TRIGGER employee_profiles_updated_at
  BEFORE UPDATE ON employee_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_employee_profile_updated_at();

-- Paso 5: Crear función para validar certifications JSONB
CREATE OR REPLACE FUNCTION validate_certifications()
RETURNS TRIGGER AS $$
DECLARE
  cert JSONB;
BEGIN
  -- Validar estructura de cada certificación
  FOR cert IN SELECT * FROM jsonb_array_elements(NEW.certifications)
  LOOP
    IF NOT (cert ? 'name' AND cert ? 'issuer' AND cert ? 'date') THEN
      RAISE EXCEPTION 'Certificación inválida. Debe contener: name, issuer, date';
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Paso 6: Crear trigger para validar certifications
DROP TRIGGER IF EXISTS validate_certifications_trigger ON employee_profiles;

CREATE TRIGGER validate_certifications_trigger
  BEFORE INSERT OR UPDATE ON employee_profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_certifications();

-- Paso 7: Políticas RLS
ALTER TABLE employee_profiles ENABLE ROW LEVEL SECURITY;

-- Usuario puede ver su propio perfil
CREATE POLICY "Users can view own employee profile"
  ON employee_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Usuario puede crear su propio perfil
CREATE POLICY "Users can create own employee profile"
  ON employee_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuario puede actualizar su propio perfil
CREATE POLICY "Users can update own employee profile"
  ON employee_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins de negocios pueden ver perfiles de candidatos que aplicaron
CREATE POLICY "Business admins can view applicant profiles"
  ON employee_profiles FOR SELECT
  USING (
    user_id IN (
      SELECT ja.user_id
      FROM job_applications ja
      JOIN businesses b ON b.id = ja.business_id
      WHERE b.owner_id = auth.uid()
    )
  );

-- Perfiles públicos visibles para todos (si available_for_hire = true)
CREATE POLICY "Public employee profiles are visible"
  ON employee_profiles FOR SELECT
  USING (available_for_hire = true);

-- Paso 8: Crear función para obtener employee stats
CREATE OR REPLACE FUNCTION get_employee_stats(p_user_id UUID)
RETURNS TABLE(
  total_services INTEGER,
  total_appointments INTEGER,
  average_rating NUMERIC,
  total_reviews INTEGER,
  years_active NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT bes.service_id)::INTEGER as total_services,
    COUNT(DISTINCT a.id)::INTEGER as total_appointments,
    ROUND(AVG(r.rating), 2) as average_rating,
    COUNT(DISTINCT r.id)::INTEGER as total_reviews,
    ROUND(
      EXTRACT(EPOCH FROM (NOW() - MIN(be.joined_at))) / (365.25 * 24 * 60 * 60),
      1
    ) as years_active
  FROM business_employees be
  LEFT JOIN business_employee_services bes ON bes.employee_id = be.id
  LEFT JOIN appointments a ON a.employee_id = p_user_id AND a.status = 'completed'
  LEFT JOIN reviews r ON r.employee_id = p_user_id AND r.review_type = 'employee'
  WHERE be.employee_id = p_user_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Paso 9: Crear RPC function para actualizar perfil con validaciones
CREATE OR REPLACE FUNCTION update_employee_profile_rpc(
  p_user_id UUID,
  p_professional_summary TEXT DEFAULT NULL,
  p_years_of_experience INTEGER DEFAULT NULL,
  p_specializations TEXT[] DEFAULT NULL,
  p_languages TEXT[] DEFAULT NULL,
  p_certifications JSONB DEFAULT NULL,
  p_portfolio_url TEXT DEFAULT NULL,
  p_linkedin_url TEXT DEFAULT NULL,
  p_github_url TEXT DEFAULT NULL,
  p_available_for_hire BOOLEAN DEFAULT NULL,
  p_preferred_work_type TEXT DEFAULT NULL,
  p_expected_salary_min INTEGER DEFAULT NULL,
  p_expected_salary_max INTEGER DEFAULT NULL
)
RETURNS employee_profiles AS $$
DECLARE
  result employee_profiles;
BEGIN
  -- Verificar que el usuario es el dueño del perfil
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'No autorizado para actualizar este perfil';
  END IF;
  
  -- Validar URLs si se proporcionan
  IF p_portfolio_url IS NOT NULL AND p_portfolio_url !~ '^https?://' THEN
    RAISE EXCEPTION 'URL de portafolio inválida';
  END IF;
  
  IF p_linkedin_url IS NOT NULL AND p_linkedin_url !~ '^https?://(www\.)?linkedin\.com/' THEN
    RAISE EXCEPTION 'URL de LinkedIn inválida';
  END IF;
  
  IF p_github_url IS NOT NULL AND p_github_url !~ '^https?://(www\.)?github\.com/' THEN
    RAISE EXCEPTION 'URL de GitHub inválida';
  END IF;
  
  -- Validar salario
  IF p_expected_salary_min IS NOT NULL AND p_expected_salary_max IS NOT NULL THEN
    IF p_expected_salary_min > p_expected_salary_max THEN
      RAISE EXCEPTION 'Salario mínimo no puede ser mayor que salario máximo';
    END IF;
  END IF;
  
  -- Insertar o actualizar
  INSERT INTO employee_profiles (
    user_id,
    professional_summary,
    years_of_experience,
    specializations,
    languages,
    certifications,
    portfolio_url,
    linkedin_url,
    github_url,
    available_for_hire,
    preferred_work_type,
    expected_salary_min,
    expected_salary_max
  ) VALUES (
    p_user_id,
    COALESCE(p_professional_summary, ''),
    COALESCE(p_years_of_experience, 0),
    COALESCE(p_specializations, '{}'),
    COALESCE(p_languages, '{}'),
    COALESCE(p_certifications, '[]'),
    p_portfolio_url,
    p_linkedin_url,
    p_github_url,
    COALESCE(p_available_for_hire, true),
    p_preferred_work_type,
    p_expected_salary_min,
    p_expected_salary_max
  )
  ON CONFLICT (user_id) DO UPDATE SET
    professional_summary = COALESCE(EXCLUDED.professional_summary, employee_profiles.professional_summary),
    years_of_experience = COALESCE(EXCLUDED.years_of_experience, employee_profiles.years_of_experience),
    specializations = COALESCE(EXCLUDED.specializations, employee_profiles.specializations),
    languages = COALESCE(EXCLUDED.languages, employee_profiles.languages),
    certifications = COALESCE(EXCLUDED.certifications, employee_profiles.certifications),
    portfolio_url = COALESCE(EXCLUDED.portfolio_url, employee_profiles.portfolio_url),
    linkedin_url = COALESCE(EXCLUDED.linkedin_url, employee_profiles.linkedin_url),
    github_url = COALESCE(EXCLUDED.github_url, employee_profiles.github_url),
    available_for_hire = COALESCE(EXCLUDED.available_for_hire, employee_profiles.available_for_hire),
    preferred_work_type = COALESCE(EXCLUDED.preferred_work_type, employee_profiles.preferred_work_type),
    expected_salary_min = COALESCE(EXCLUDED.expected_salary_min, employee_profiles.expected_salary_min),
    expected_salary_max = COALESCE(EXCLUDED.expected_salary_max, employee_profiles.expected_salary_max)
  RETURNING * INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Paso 10: Comentarios
COMMENT ON TABLE employee_profiles IS 
  'Perfiles profesionales extendidos para empleados que buscan trabajo';

COMMENT ON COLUMN employee_profiles.certifications IS 
  'Array JSONB de certificaciones. Formato: [{"name": "...", "issuer": "...", "date": "...", "credential_id": "...", "url": "..."}]';

COMMENT ON COLUMN employee_profiles.specializations IS 
  'Array de especializaciones/skills (ej: ["Corte masculino", "Coloración", "Barbería"])';

COMMENT ON COLUMN employee_profiles.languages IS 
  'Array de idiomas (ej: ["Español", "Inglés", "Francés"])';

-- Paso 11: Verificación
DO $$
DECLARE
  total_profiles INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_profiles FROM employee_profiles;
  
  RAISE NOTICE 'Migración completada. employee_profiles creado. Total perfiles: %', total_profiles;
END $$;

-- =====================================================================
-- ROLLBACK (ejecutar solo si se necesita revertir)
-- =====================================================================
-- DROP FUNCTION IF EXISTS update_employee_profile_rpc;
-- DROP FUNCTION IF EXISTS get_employee_stats;
-- DROP POLICY IF EXISTS "Public employee profiles are visible" ON employee_profiles;
-- DROP POLICY IF EXISTS "Business admins can view applicant profiles" ON employee_profiles;
-- DROP POLICY IF EXISTS "Users can update own employee profile" ON employee_profiles;
-- DROP POLICY IF EXISTS "Users can create own employee profile" ON employee_profiles;
-- DROP POLICY IF EXISTS "Users can view own employee profile" ON employee_profiles;
-- DROP TRIGGER IF EXISTS validate_certifications_trigger ON employee_profiles;
-- DROP FUNCTION IF EXISTS validate_certifications;
-- DROP TRIGGER IF EXISTS employee_profiles_updated_at ON employee_profiles;
-- DROP FUNCTION IF EXISTS update_employee_profile_updated_at;
-- DROP INDEX IF EXISTS idx_employee_profiles_certifications;
-- DROP INDEX IF EXISTS idx_employee_profiles_languages;
-- DROP INDEX IF EXISTS idx_employee_profiles_specializations;
-- DROP INDEX IF EXISTS idx_employee_profiles_available;
-- DROP INDEX IF EXISTS idx_employee_profiles_user_id;
-- DROP TABLE IF EXISTS employee_profiles;
