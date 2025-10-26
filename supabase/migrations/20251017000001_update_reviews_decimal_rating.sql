-- =====================================================================
-- Migración: Actualizar reviews.rating a NUMERIC(2,1)
-- Descripción: Permite ratings decimales (1.0 - 5.0) en vez de solo enteros
-- Fecha: 2025-10-17
-- Autor: Sistema de Vacantes Laborales
-- =====================================================================

-- Paso 1: Validación pre-migración
DO $$
DECLARE
  total_reviews INTEGER;
  invalid_ratings INTEGER;
BEGIN
  -- Contar reviews totales
  SELECT COUNT(*) INTO total_reviews FROM reviews;
  
  -- Contar ratings fuera de rango 1-5
  SELECT COUNT(*) INTO invalid_ratings 
  FROM reviews 
  WHERE rating < 1 OR rating > 5;
  
  RAISE NOTICE 'Total reviews: %, Invalid ratings: %', total_reviews, invalid_ratings;
  
  IF invalid_ratings > 0 THEN
    RAISE EXCEPTION 'Se encontraron % ratings inválidos. Corregir antes de continuar.', invalid_ratings;
  END IF;
END $$;

-- Paso 2: Crear tabla de backup
CREATE TABLE IF NOT EXISTS reviews_backup_20251017 AS 
SELECT * FROM reviews;

RAISE NOTICE 'Backup creado: reviews_backup_20251017 con % registros', 
  (SELECT COUNT(*) FROM reviews_backup_20251017);

-- Paso 3: Alterar columna rating a NUMERIC(2,1)
ALTER TABLE reviews 
  ALTER COLUMN rating TYPE NUMERIC(2,1);

-- Paso 4: Agregar constraint de validación
ALTER TABLE reviews
  DROP CONSTRAINT IF EXISTS reviews_rating_check;

ALTER TABLE reviews
  ADD CONSTRAINT reviews_rating_check 
  CHECK (rating >= 1.0 AND rating <= 5.0);

-- Paso 5: Crear índice para búsquedas por rating
CREATE INDEX IF NOT EXISTS idx_reviews_rating 
  ON reviews(rating);

-- Paso 6: Actualizar comentarios
COMMENT ON COLUMN reviews.rating IS 
  'Rating decimal de 1.0 a 5.0. Permite valores como 4.5, 3.7, etc.';

-- Paso 7: Verificación post-migración
DO $$
DECLARE
  total_after INTEGER;
  decimal_ratings INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_after FROM reviews;
  
  -- Contar cuántos ratings tienen decimales (para futuro)
  SELECT COUNT(*) INTO decimal_ratings 
  FROM reviews 
  WHERE rating != FLOOR(rating);
  
  RAISE NOTICE 'Migración completada. Total reviews: %, Ratings con decimales: %', 
    total_after, decimal_ratings;
    
  IF total_after != (SELECT COUNT(*) FROM reviews_backup_20251017) THEN
    RAISE EXCEPTION 'Pérdida de datos detectada. Rollback requerido.';
  END IF;
END $$;

-- =====================================================================
-- ROLLBACK (ejecutar solo si se necesita revertir)
-- =====================================================================
-- ALTER TABLE reviews ALTER COLUMN rating TYPE INTEGER;
-- ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_rating_check;
-- ALTER TABLE reviews ADD CONSTRAINT reviews_rating_check CHECK (rating >= 1 AND rating <= 5);
-- DROP INDEX IF EXISTS idx_reviews_rating;
-- DROP TABLE IF EXISTS reviews_backup_20251017;
