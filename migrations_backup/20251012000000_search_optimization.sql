-- ============================================================================
-- MIGRACIÓN: Optimización de Búsqueda
-- Fecha: 2025-10-12
-- Descripción: Índices, full-text search y materialized views para performance
-- ============================================================================

-- ============================================================================
-- 0. EXTENSIONES (DEBE IR PRIMERO)
-- ============================================================================

-- Extensión para búsqueda fuzzy con trigram
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Extensión para ignorar acentos en búsquedas
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ============================================================================
-- 1. ÍNDICES BÁSICOS PARA BÚSQUEDA
-- ============================================================================

-- Índices en businesses
CREATE INDEX IF NOT EXISTS idx_businesses_name_trgm ON businesses USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_businesses_email ON businesses(email);
CREATE INDEX IF NOT EXISTS idx_businesses_is_active ON businesses(is_active);
CREATE INDEX IF NOT EXISTS idx_businesses_category ON businesses(category_id);
CREATE INDEX IF NOT EXISTS idx_businesses_created_at ON businesses(created_at DESC);

-- Índices en profiles
CREATE INDEX IF NOT EXISTS idx_profiles_full_name_trgm ON profiles USING gin(full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);

-- Índices en services
CREATE INDEX IF NOT EXISTS idx_services_name_trgm ON services USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_services_business_id ON services(business_id);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_price ON services(price);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);

-- Índices en locations
CREATE INDEX IF NOT EXISTS idx_locations_business_id ON locations(business_id);
CREATE INDEX IF NOT EXISTS idx_locations_city ON locations(city);
CREATE INDEX IF NOT EXISTS idx_locations_is_active ON locations(is_active);
CREATE INDEX IF NOT EXISTS idx_locations_coordinates ON locations(latitude, longitude);

-- ============================================================================
-- 2. FULL-TEXT SEARCH
-- ============================================================================

-- Habilitar extensión pg_trgm para búsqueda fuzzy
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Habilitar extensión unaccent para ignorar acentos
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Columnas tsvector para búsqueda full-text

-- businesses: search_vector
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Generar search_vector para businesses
UPDATE businesses SET search_vector = 
  setweight(to_tsvector('spanish', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('spanish', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('spanish', coalesce(email, '')), 'C');

-- Índice GIN para search_vector de businesses
CREATE INDEX IF NOT EXISTS idx_businesses_search_vector ON businesses USING gin(search_vector);

-- Trigger para actualizar search_vector automáticamente
CREATE OR REPLACE FUNCTION businesses_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('spanish', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(NEW.email, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS businesses_search_vector_update_trigger ON businesses;
CREATE TRIGGER businesses_search_vector_update_trigger
  BEFORE INSERT OR UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION businesses_search_vector_update();

-- services: search_vector
ALTER TABLE services ADD COLUMN IF NOT EXISTS search_vector tsvector;

UPDATE services SET search_vector = 
  setweight(to_tsvector('spanish', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('spanish', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('spanish', coalesce(category, '')), 'C');

CREATE INDEX IF NOT EXISTS idx_services_search_vector ON services USING gin(search_vector);

CREATE OR REPLACE FUNCTION services_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('spanish', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(NEW.category, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS services_search_vector_update_trigger ON services;
CREATE TRIGGER services_search_vector_update_trigger
  BEFORE INSERT OR UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION services_search_vector_update();

-- profiles: search_vector (solo full_name y email, no existe bio)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS search_vector tsvector;

UPDATE profiles SET search_vector = 
  setweight(to_tsvector('spanish', coalesce(full_name, '')), 'A') ||
  setweight(to_tsvector('spanish', coalesce(email, '')), 'B');

CREATE INDEX IF NOT EXISTS idx_profiles_search_vector ON profiles USING gin(search_vector);

CREATE OR REPLACE FUNCTION profiles_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('spanish', coalesce(NEW.full_name, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(NEW.email, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_search_vector_update_trigger ON profiles;
CREATE TRIGGER profiles_search_vector_update_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION profiles_search_vector_update();

-- ============================================================================
-- 3. MATERIALIZED VIEW PARA RATINGS
-- ============================================================================

-- Vista materializada con ratings agregados de businesses
CREATE MATERIALIZED VIEW IF NOT EXISTS business_ratings_stats AS
SELECT 
  b.id as business_id,
  b.name as business_name,
  COUNT(r.id) as review_count,
  COALESCE(AVG(r.rating), 0) as average_rating,
  COUNT(CASE WHEN r.rating = 5 THEN 1 END) as five_star_count,
  COUNT(CASE WHEN r.rating = 4 THEN 1 END) as four_star_count,
  COUNT(CASE WHEN r.rating = 3 THEN 1 END) as three_star_count,
  COUNT(CASE WHEN r.rating = 2 THEN 1 END) as two_star_count,
  COUNT(CASE WHEN r.rating = 1 THEN 1 END) as one_star_count,
  MAX(r.created_at) as latest_review_at
FROM businesses b
LEFT JOIN reviews r ON b.id = r.business_id AND r.is_visible = true
WHERE b.is_active = true
GROUP BY b.id, b.name;

-- Índice en la vista materializada
CREATE UNIQUE INDEX IF NOT EXISTS idx_business_ratings_stats_business_id 
  ON business_ratings_stats(business_id);
CREATE INDEX IF NOT EXISTS idx_business_ratings_stats_average_rating 
  ON business_ratings_stats(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_business_ratings_stats_review_count 
  ON business_ratings_stats(review_count DESC);

-- Vista materializada con ratings de empleados
CREATE MATERIALIZED VIEW IF NOT EXISTS employee_ratings_stats AS
SELECT 
  p.id as employee_id,
  p.full_name as employee_name,
  COUNT(r.id) as review_count,
  COALESCE(AVG(r.rating), 0) as average_rating,
  MAX(r.created_at) as latest_review_at,
  COUNT(DISTINCT r.business_id) as businesses_count
FROM profiles p
LEFT JOIN reviews r ON p.id = r.employee_id AND r.is_visible = true
GROUP BY p.id, p.full_name;

CREATE UNIQUE INDEX IF NOT EXISTS idx_employee_ratings_stats_employee_id 
  ON employee_ratings_stats(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_ratings_stats_average_rating 
  ON employee_ratings_stats(average_rating DESC);

-- Función para refrescar las vistas materializadas
CREATE OR REPLACE FUNCTION refresh_ratings_stats() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY business_ratings_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY employee_ratings_stats;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. FUNCIONES DE BÚSQUEDA OPTIMIZADAS
-- ============================================================================

-- Función para búsqueda de negocios con full-text search
CREATE OR REPLACE FUNCTION search_businesses(
  search_query text,
  limit_count integer DEFAULT 20,
  offset_count integer DEFAULT 0
) RETURNS TABLE (
  id uuid,
  name text,
  description text,
  logo_url text,
  category_id uuid,
  average_rating numeric,
  review_count bigint,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.name,
    b.description,
    b.logo_url,
    b.category_id,
    COALESCE(brs.average_rating, 0) as average_rating,
    COALESCE(brs.review_count, 0) as review_count,
    ts_rank(b.search_vector, plainto_tsquery('spanish', search_query)) as rank
  FROM businesses b
  LEFT JOIN business_ratings_stats brs ON b.id = brs.business_id
  WHERE 
    b.is_active = true
    AND (
      b.search_vector @@ plainto_tsquery('spanish', search_query)
      OR b.name ILIKE '%' || search_query || '%'
    )
  ORDER BY rank DESC, average_rating DESC, review_count DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Función para búsqueda de servicios
CREATE OR REPLACE FUNCTION search_services(
  search_query text,
  limit_count integer DEFAULT 20,
  offset_count integer DEFAULT 0
) RETURNS TABLE (
  id uuid,
  name text,
  description text,
  price numeric,
  duration_minutes integer,
  business_id uuid,
  business_name text,
  average_rating numeric,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.description,
    s.price,
    s.duration_minutes,
    s.business_id,
    b.name as business_name,
    COALESCE(brs.average_rating, 0) as average_rating,
    ts_rank(s.search_vector, plainto_tsquery('spanish', search_query)) as rank
  FROM services s
  INNER JOIN businesses b ON s.business_id = b.id
  LEFT JOIN business_ratings_stats brs ON b.id = brs.business_id
  WHERE 
    s.is_active = true
    AND b.is_active = true
    AND (
      s.search_vector @@ plainto_tsquery('spanish', search_query)
      OR s.name ILIKE '%' || search_query || '%'
    )
  ORDER BY rank DESC, average_rating DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Función para búsqueda de profesionales
CREATE OR REPLACE FUNCTION search_professionals(
  search_query text,
  limit_count integer DEFAULT 20,
  offset_count integer DEFAULT 0
) RETURNS TABLE (
  id uuid,
  full_name text,
  avatar_url text,
  average_rating numeric,
  review_count bigint,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.avatar_url,
    COALESCE(ers.average_rating, 0) as average_rating,
    COALESCE(ers.review_count, 0) as review_count,
    ts_rank(p.search_vector, plainto_tsquery('spanish', search_query)) as rank
  FROM profiles p
  LEFT JOIN employee_ratings_stats ers ON p.id = ers.employee_id
  WHERE 
    p.search_vector @@ plainto_tsquery('spanish', search_query)
    OR p.full_name ILIKE '%' || search_query || '%'
  ORDER BY rank DESC, average_rating DESC, review_count DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 5. POLÍTICA DE REFRESCO AUTOMÁTICO
-- ============================================================================

-- Trigger para refrescar stats cuando se crea/modifica una review
CREATE OR REPLACE FUNCTION trigger_refresh_ratings_stats() RETURNS trigger AS $$
BEGIN
  -- Llamar a la función de refresco de forma asíncrona (pg_background)
  -- Por ahora, simplemente marcar que se necesita refresco
  -- En producción, usar un cron job o pg_cron
  PERFORM refresh_ratings_stats();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Nota: Este trigger puede ser pesado en producción
-- Considerar usar pg_cron para refrescar cada 5-10 minutos en vez de por cada review
DROP TRIGGER IF EXISTS reviews_refresh_stats_trigger ON reviews;
-- CREATE TRIGGER reviews_refresh_stats_trigger
--   AFTER INSERT OR UPDATE OR DELETE ON reviews
--   FOR EACH STATEMENT EXECUTE FUNCTION trigger_refresh_ratings_stats();

-- ============================================================================
-- 6. COMENTARIOS Y DOCUMENTACIÓN
-- ============================================================================

COMMENT ON MATERIALIZED VIEW business_ratings_stats IS 
'Vista materializada con estadísticas agregadas de ratings por negocio. Refrescar cada 5-10 min.';

COMMENT ON MATERIALIZED VIEW employee_ratings_stats IS 
'Vista materializada con estadísticas agregadas de ratings por empleado. Refrescar cada 5-10 min.';

COMMENT ON FUNCTION search_businesses(text, integer, integer) IS 
'Búsqueda full-text optimizada de negocios con ranking por relevancia y rating.';

COMMENT ON FUNCTION search_services(text, integer, integer) IS 
'Búsqueda full-text optimizada de servicios con información del negocio.';

COMMENT ON FUNCTION search_professionals(text, integer, integer) IS 
'Búsqueda full-text optimizada de profesionales con ratings agregados.';

-- ============================================================================
-- 7. REFRESCO INICIAL DE VISTAS MATERIALIZADAS
-- ============================================================================

-- Ejecutar refresco inicial
SELECT refresh_ratings_stats();

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
