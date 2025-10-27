-- =====================================================================
-- Migración: Crear RPC get_matching_vacancies
-- Descripción: Función para matching inteligente de vacantes con scoring
-- Fecha: 2025-10-17
-- Autor: Sistema de Vacantes Laborales
-- =====================================================================

-- Paso 1: Crear tipo de retorno para matching vacancies
CREATE TYPE matching_vacancy AS (
  -- Datos de la vacante
  vacancy_id UUID,
  title TEXT,
  description TEXT,
  position_type TEXT,
  work_schedule JSONB,
  number_of_positions INTEGER,
  remote_allowed BOOLEAN,
  experience_required TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  required_services UUID[],
  location_city TEXT,
  location_address TEXT,
  benefits TEXT[],
  created_at TIMESTAMPTZ,
  
  -- Datos del negocio
  business_id UUID,
  business_name TEXT,
  business_logo_url TEXT,
  business_city TEXT,
  business_avg_rating NUMERIC,
  business_review_count INTEGER,
  
  -- Estadísticas de la vacante
  application_count INTEGER,
  accepted_count INTEGER,
  
  -- Score de matching (0-100)
  match_score INTEGER
);

-- Paso 2: Crear función principal get_matching_vacancies
CREATE OR REPLACE FUNCTION get_matching_vacancies(
  p_user_id UUID,
  p_city TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS SETOF matching_vacancy AS $$
DECLARE
  user_services UUID[];
  user_specializations TEXT[];
  user_city TEXT;
  user_experience INTEGER;
BEGIN
  -- Obtener servicios del usuario (de business_employee_services)
  SELECT ARRAY_AGG(DISTINCT bes.service_id)
  INTO user_services
  FROM business_employees be
  JOIN business_employee_services bes ON bes.employee_id = be.id
  WHERE be.employee_id = p_user_id;
  
  -- Obtener perfil profesional del usuario
  SELECT 
    COALESCE(specializations, '{}'),
    COALESCE(years_of_experience, 0)
  INTO 
    user_specializations,
    user_experience
  FROM employee_profiles
  WHERE user_id = p_user_id;
  
  -- Obtener ciudad del usuario
  SELECT city INTO user_city
  FROM profiles
  WHERE id = p_user_id;
  
  -- Retornar vacantes con scoring
  RETURN QUERY
  SELECT
    jv.id as vacancy_id,
    jv.title,
    jv.description,
    jv.position_type,
    jv.work_schedule,
    jv.number_of_positions,
    jv.remote_allowed,
    jv.experience_required,
    jv.salary_min,
    jv.salary_max,
    jv.required_services,
    jv.location_city,
    jv.location_address,
    jv.benefits,
    jv.created_at,
    
    -- Business info
    b.id as business_id,
    b.name as business_name,
    b.logo_url as business_logo_url,
    b.city as business_city,
    ROUND(AVG(br.rating), 2) as business_avg_rating,
    COUNT(DISTINCT br.id)::INTEGER as business_review_count,
    
    -- Vacancy stats
    COUNT(DISTINCT ja.id)::INTEGER as application_count,
    COUNT(DISTINCT ja.id) FILTER (WHERE ja.status = 'accepted')::INTEGER as accepted_count,
    
    -- Calculate match score (0-100)
    (
      -- 1. Servicios match (40 puntos máximo)
      CASE
        WHEN jv.required_services IS NULL OR ARRAY_LENGTH(jv.required_services, 1) IS NULL THEN 40
        WHEN user_services IS NULL OR ARRAY_LENGTH(user_services, 1) IS NULL THEN 0
        ELSE LEAST(
          40,
          (
            40 * CARDINALITY(
              ARRAY(
                SELECT UNNEST(user_services)
                INTERSECT
                SELECT UNNEST(jv.required_services)
              )
            ) / GREATEST(CARDINALITY(jv.required_services), 1)
          )::INTEGER
        )
      END
      
      -- 2. Especialización match (30 puntos máximo)
      + CASE
        WHEN user_specializations IS NULL OR ARRAY_LENGTH(user_specializations, 1) IS NULL THEN 10
        WHEN jv.description IS NULL THEN 10
        ELSE LEAST(
          30,
          (
            SELECT COUNT(*) * 10
            FROM UNNEST(user_specializations) AS spec
            WHERE jv.description ILIKE '%' || spec || '%'
            OR jv.title ILIKE '%' || spec || '%'
          )::INTEGER
        )
      END
      
      -- 3. Ubicación match (20 puntos máximo)
      + CASE
        WHEN jv.remote_allowed THEN 20
        WHEN p_city IS NOT NULL AND jv.location_city ILIKE '%' || p_city || '%' THEN 20
        WHEN user_city IS NOT NULL AND jv.location_city ILIKE '%' || user_city || '%' THEN 20
        WHEN user_city IS NULL OR jv.location_city IS NULL THEN 10
        ELSE 0
      END
      
      -- 4. Experiencia match (10 puntos máximo)
      + CASE
        WHEN jv.experience_required = 'any' THEN 10
        WHEN jv.experience_required = 'entry_level' AND user_experience >= 0 THEN 10
        WHEN jv.experience_required = 'mid_level' AND user_experience >= 2 THEN 10
        WHEN jv.experience_required = 'senior' AND user_experience >= 5 THEN 10
        ELSE 5
      END
    )::INTEGER as match_score
    
  FROM job_vacancies jv
  JOIN businesses b ON b.id = jv.business_id
  LEFT JOIN job_applications ja ON ja.vacancy_id = jv.id
  LEFT JOIN reviews br ON br.business_id = jv.business_id AND br.review_type = 'business'
  WHERE jv.is_active = true
    -- No mostrar vacantes del mismo negocio donde ya trabaja
    AND NOT EXISTS (
      SELECT 1 FROM business_employees be
      WHERE be.employee_id = p_user_id
      AND be.business_id = jv.business_id
      AND be.status = 'active'
    )
    -- No mostrar vacantes donde ya aplicó
    AND NOT EXISTS (
      SELECT 1 FROM job_applications ja2
      WHERE ja2.vacancy_id = jv.id
      AND ja2.user_id = p_user_id
    )
    -- Filtro opcional por ciudad
    AND (p_city IS NULL OR jv.location_city ILIKE '%' || p_city || '%' OR jv.remote_allowed)
  GROUP BY 
    jv.id, jv.title, jv.description, jv.position_type, jv.work_schedule,
    jv.number_of_positions, jv.remote_allowed, jv.experience_required,
    jv.salary_min, jv.salary_max, jv.required_services, jv.location_city,
    jv.location_address, jv.benefits, jv.created_at,
    b.id, b.name, b.logo_url, b.city,
    user_services, user_specializations, user_city, user_experience
  HAVING 
    -- Solo mostrar vacantes con match_score > 20 (mínimo relevante)
    (
      CASE
        WHEN jv.required_services IS NULL OR ARRAY_LENGTH(jv.required_services, 1) IS NULL THEN 40
        WHEN user_services IS NULL OR ARRAY_LENGTH(user_services, 1) IS NULL THEN 0
        ELSE LEAST(
          40,
          (
            40 * CARDINALITY(
              ARRAY(
                SELECT UNNEST(user_services)
                INTERSECT
                SELECT UNNEST(jv.required_services)
              )
            ) / GREATEST(CARDINALITY(jv.required_services), 1)
          )::INTEGER
        )
      END
      + CASE
        WHEN user_specializations IS NULL OR ARRAY_LENGTH(user_specializations, 1) IS NULL THEN 10
        WHEN jv.description IS NULL THEN 10
        ELSE LEAST(
          30,
          (
            SELECT COUNT(*) * 10
            FROM UNNEST(user_specializations) AS spec
            WHERE jv.description ILIKE '%' || spec || '%'
            OR jv.title ILIKE '%' || spec || '%'
          )::INTEGER
        )
      END
      + CASE
        WHEN jv.remote_allowed THEN 20
        WHEN p_city IS NOT NULL AND jv.location_city ILIKE '%' || p_city || '%' THEN 20
        WHEN user_city IS NOT NULL AND jv.location_city ILIKE '%' || user_city || '%' THEN 20
        WHEN user_city IS NULL OR jv.location_city IS NULL THEN 10
        ELSE 0
      END
      + CASE
        WHEN jv.experience_required = 'any' THEN 10
        WHEN jv.experience_required = 'entry_level' AND user_experience >= 0 THEN 10
        WHEN jv.experience_required = 'mid_level' AND user_experience >= 2 THEN 10
        WHEN jv.experience_required = 'senior' AND user_experience >= 5 THEN 10
        ELSE 5
      END
    ) > 20
  ORDER BY 
    match_score DESC,
    jv.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Paso 3: Grant execute a usuarios autenticados
GRANT EXECUTE ON FUNCTION get_matching_vacancies TO authenticated;

-- Paso 4: Crear índices adicionales para optimizar la función
CREATE INDEX IF NOT EXISTS idx_job_vacancies_active_created 
  ON job_vacancies(is_active, created_at DESC) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_job_applications_vacancy_user 
  ON job_applications(vacancy_id, user_id);

CREATE INDEX IF NOT EXISTS idx_business_employees_user_business 
  ON business_employees(employee_id, business_id, status);

-- Paso 5: Crear función auxiliar para debugging (solo admin)
CREATE OR REPLACE FUNCTION debug_matching_score(
  p_user_id UUID,
  p_vacancy_id UUID
)
RETURNS TABLE(
  component TEXT,
  score INTEGER,
  details TEXT
) AS $$
DECLARE
  user_services UUID[];
  user_specializations TEXT[];
  user_city TEXT;
  user_experience INTEGER;
  vacancy RECORD;
BEGIN
  -- Obtener datos del usuario
  SELECT ARRAY_AGG(DISTINCT bes.service_id)
  INTO user_services
  FROM business_employees be
  JOIN business_employee_services bes ON bes.employee_id = be.id
  WHERE be.employee_id = p_user_id;
  
  SELECT 
    COALESCE(specializations, '{}'),
    COALESCE(years_of_experience, 0)
  INTO 
    user_specializations,
    user_experience
  FROM employee_profiles
  WHERE user_id = p_user_id;
  
  SELECT city INTO user_city FROM profiles WHERE id = p_user_id;
  
  -- Obtener datos de la vacante
  SELECT * INTO vacancy FROM job_vacancies WHERE id = p_vacancy_id;
  
  -- Calcular componentes del score
  RETURN QUERY
  SELECT 
    'Services Match'::TEXT,
    CASE
      WHEN vacancy.required_services IS NULL OR ARRAY_LENGTH(vacancy.required_services, 1) IS NULL THEN 40
      WHEN user_services IS NULL OR ARRAY_LENGTH(user_services, 1) IS NULL THEN 0
      ELSE LEAST(
        40,
        (
          40 * CARDINALITY(
            ARRAY(
              SELECT UNNEST(user_services)
              INTERSECT
              SELECT UNNEST(vacancy.required_services)
            )
          ) / GREATEST(CARDINALITY(vacancy.required_services), 1)
        )::INTEGER
      )
    END,
    FORMAT('User services: %s / Required: %s', 
      COALESCE(ARRAY_LENGTH(user_services, 1), 0)::TEXT,
      COALESCE(ARRAY_LENGTH(vacancy.required_services, 1), 0)::TEXT
    )
  
  UNION ALL
  
  SELECT 
    'Specialization Match'::TEXT,
    CASE
      WHEN user_specializations IS NULL OR ARRAY_LENGTH(user_specializations, 1) IS NULL THEN 10
      WHEN vacancy.description IS NULL THEN 10
      ELSE LEAST(
        30,
        (
          SELECT COUNT(*) * 10
          FROM UNNEST(user_specializations) AS spec
          WHERE vacancy.description ILIKE '%' || spec || '%'
          OR vacancy.title ILIKE '%' || spec || '%'
        )::INTEGER
      )
    END,
    FORMAT('User specializations: %s', ARRAY_TO_STRING(user_specializations, ', '))
  
  UNION ALL
  
  SELECT 
    'Location Match'::TEXT,
    CASE
      WHEN vacancy.remote_allowed THEN 20
      WHEN user_city IS NOT NULL AND vacancy.location_city ILIKE '%' || user_city || '%' THEN 20
      WHEN user_city IS NULL OR vacancy.location_city IS NULL THEN 10
      ELSE 0
    END,
    FORMAT('User city: %s / Vacancy city: %s / Remote: %s', 
      COALESCE(user_city, 'N/A'),
      COALESCE(vacancy.location_city, 'N/A'),
      vacancy.remote_allowed::TEXT
    )
  
  UNION ALL
  
  SELECT 
    'Experience Match'::TEXT,
    CASE
      WHEN vacancy.experience_required = 'any' THEN 10
      WHEN vacancy.experience_required = 'entry_level' AND user_experience >= 0 THEN 10
      WHEN vacancy.experience_required = 'mid_level' AND user_experience >= 2 THEN 10
      WHEN vacancy.experience_required = 'senior' AND user_experience >= 5 THEN 10
      ELSE 5
    END,
    FORMAT('User experience: %s years / Required: %s', 
      user_experience::TEXT,
      COALESCE(vacancy.experience_required, 'N/A')
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Paso 6: Comentarios
COMMENT ON FUNCTION get_matching_vacancies IS 
  'Retorna vacantes activas ordenadas por match_score (0-100) basado en servicios, especialización, ubicación y experiencia del usuario';

COMMENT ON FUNCTION debug_matching_score IS 
  'Función de debugging para ver el desglose del match_score entre usuario y vacante';

-- Paso 7: Verificación con usuario de ejemplo
DO $$
DECLARE
  test_user_id UUID;
  result_count INTEGER;
BEGIN
  -- Intentar obtener un usuario de ejemplo
  SELECT id INTO test_user_id
  FROM profiles
  LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    SELECT COUNT(*) INTO result_count
    FROM get_matching_vacancies(test_user_id, NULL, 10, 0);
    
    RAISE NOTICE 'Función get_matching_vacancies probada. Resultados para usuario de ejemplo: %', result_count;
  ELSE
    RAISE NOTICE 'No hay usuarios para probar la función';
  END IF;
END $$;

-- =====================================================================
-- ROLLBACK (ejecutar solo si se necesita revertir)
-- =====================================================================
-- REVOKE EXECUTE ON FUNCTION get_matching_vacancies FROM authenticated;
-- DROP FUNCTION IF EXISTS debug_matching_score;
-- DROP FUNCTION IF EXISTS get_matching_vacancies;
-- DROP TYPE IF EXISTS matching_vacancy;
-- DROP INDEX IF EXISTS idx_business_employees_user_business;
-- DROP INDEX IF EXISTS idx_job_applications_vacancy_user;
-- DROP INDEX IF EXISTS idx_job_vacancies_active_created;
