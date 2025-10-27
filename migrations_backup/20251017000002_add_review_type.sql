-- =====================================================================
-- Migración: Agregar review_type a reviews table
-- Descripción: Permite 2 reviews por appointment (business + employee)
-- Fecha: 2025-10-17
-- Autor: Sistema de Vacantes Laborales
-- =====================================================================

-- Paso 1: Agregar columna review_type
ALTER TABLE reviews 
  ADD COLUMN IF NOT EXISTS review_type TEXT NOT NULL DEFAULT 'business';

-- Paso 2: Agregar constraint de validación
ALTER TABLE reviews
  ADD CONSTRAINT reviews_type_check 
  CHECK (review_type IN ('business', 'employee'));

-- Paso 3: Agregar columna employee_id (nullable, solo para reviews de empleados)
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Paso 4: Crear índices
CREATE INDEX IF NOT EXISTS idx_reviews_review_type 
  ON reviews(review_type);

CREATE INDEX IF NOT EXISTS idx_reviews_employee_id 
  ON reviews(employee_id) WHERE employee_id IS NOT NULL;

-- Paso 5: Remover constraint antigua (appointment_id único)
ALTER TABLE reviews 
  DROP CONSTRAINT IF EXISTS reviews_appointment_id_key;

-- Paso 6: Crear UNIQUE constraint compuesto
CREATE UNIQUE INDEX IF NOT EXISTS reviews_appointment_type_unique 
  ON reviews(appointment_id, review_type);

-- Paso 7: Validar que employee_id esté presente cuando review_type = 'employee'
ALTER TABLE reviews
  ADD CONSTRAINT reviews_employee_id_required_check
  CHECK (
    (review_type = 'business' AND employee_id IS NULL) OR
    (review_type = 'employee' AND employee_id IS NOT NULL)
  );

-- Paso 8: Migrar datos existentes (marcar todos como 'business')
UPDATE reviews
SET review_type = 'business'
WHERE review_type IS NULL;

-- Paso 9: Crear función para validar appointment completado antes de review
CREATE OR REPLACE FUNCTION validate_review_appointment()
RETURNS TRIGGER AS $$
DECLARE
  appointment_status TEXT;
  appointment_employee_id UUID;
BEGIN
  -- Obtener status y employee_id del appointment
  SELECT status, employee_id 
  INTO appointment_status, appointment_employee_id
  FROM appointments
  WHERE id = NEW.appointment_id;
  
  -- Validar que el appointment esté completado
  IF appointment_status != 'completed' THEN
    RAISE EXCEPTION 'No se puede crear review para appointment con status: %', appointment_status;
  END IF;
  
  -- Si es review de empleado, validar que employee_id coincida
  IF NEW.review_type = 'employee' THEN
    IF NEW.employee_id IS NULL THEN
      RAISE EXCEPTION 'employee_id es requerido para reviews de tipo employee';
    END IF;
    
    IF NEW.employee_id != appointment_employee_id THEN
      RAISE EXCEPTION 'employee_id no coincide con el empleado del appointment';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Paso 10: Crear trigger
DROP TRIGGER IF EXISTS validate_review_before_insert ON reviews;

CREATE TRIGGER validate_review_before_insert
  BEFORE INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION validate_review_appointment();

-- Paso 11: Actualizar políticas RLS para employee reviews
DROP POLICY IF EXISTS "Users can view reviews for their appointments" ON reviews;

CREATE POLICY "Users can view relevant reviews"
  ON reviews FOR SELECT
  USING (
    -- Cliente puede ver sus propias reviews
    auth.uid() = client_id
    OR
    -- Empleado puede ver reviews sobre él
    (review_type = 'employee' AND auth.uid() = employee_id)
    OR
    -- Admin del negocio puede ver todas las reviews
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
    OR
    -- Reviews públicas visibles para todos (is_visible = true)
    is_visible = true
  );

-- Paso 12: Política para crear reviews
DROP POLICY IF EXISTS "Users can create reviews for their completed appointments" ON reviews;

CREATE POLICY "Users can create reviews for completed appointments"
  ON reviews FOR INSERT
  WITH CHECK (
    -- Solo el cliente puede crear reviews
    auth.uid() = client_id
    AND
    -- El appointment debe existir y estar completado
    EXISTS (
      SELECT 1 FROM appointments
      WHERE id = appointment_id
      AND client_id = auth.uid()
      AND status = 'completed'
    )
  );

-- Paso 13: Comentarios
COMMENT ON COLUMN reviews.review_type IS 
  'Tipo de review: business (sobre el negocio) o employee (sobre el profesional)';

COMMENT ON COLUMN reviews.employee_id IS 
  'ID del empleado evaluado (solo para review_type = employee)';

COMMENT ON CONSTRAINT reviews_appointment_type_unique ON reviews IS
  'Permite 2 reviews por appointment: una para business y otra para employee';

-- Paso 14: Verificación
DO $$
DECLARE
  total_reviews INTEGER;
  business_reviews INTEGER;
  employee_reviews INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_reviews FROM reviews;
  SELECT COUNT(*) INTO business_reviews FROM reviews WHERE review_type = 'business';
  SELECT COUNT(*) INTO employee_reviews FROM reviews WHERE review_type = 'employee';
  
  RAISE NOTICE 'Migración completada. Total: %, Business: %, Employee: %', 
    total_reviews, business_reviews, employee_reviews;
END $$;

-- =====================================================================
-- ROLLBACK (ejecutar solo si se necesita revertir)
-- =====================================================================
-- DROP TRIGGER IF EXISTS validate_review_before_insert ON reviews;
-- DROP FUNCTION IF EXISTS validate_review_appointment();
-- DROP INDEX IF EXISTS reviews_appointment_type_unique;
-- ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_employee_id_required_check;
-- ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_type_check;
-- DROP INDEX IF EXISTS idx_reviews_employee_id;
-- DROP INDEX IF EXISTS idx_reviews_review_type;
-- ALTER TABLE reviews DROP COLUMN IF EXISTS employee_id;
-- ALTER TABLE reviews DROP COLUMN IF EXISTS review_type;
-- ALTER TABLE reviews ADD CONSTRAINT reviews_appointment_id_key UNIQUE (appointment_id);
