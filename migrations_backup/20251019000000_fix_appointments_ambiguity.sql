/**
 * Fix: Resolver ambigüedad de foreign keys en appointments
 * 
 * Problema: appointments tiene múltiples FKs a profiles (client_id, employee_id, cancelled_by)
 * causando error "more than one relationship was found" en Supabase PostgREST
 * 
 * Solución:
 * 1. Eliminar FK de cancelled_by (campo poco usado)
 * 2. Crear vista materializada con todos los joins pre-resueltos
 * 3. Auto-refresh con triggers
 * 
 * Fecha: 2025-10-19
 */

-- ============================================================================
-- PASO 1: Eliminar foreign key problemática de cancelled_by
-- ============================================================================

ALTER TABLE appointments 
DROP CONSTRAINT IF EXISTS appointments_cancelled_by_fkey;

-- ============================================================================
-- PASO 2: Crear vista materializada con relaciones pre-joineadas
-- ============================================================================

DROP MATERIALIZED VIEW IF EXISTS appointments_with_relations CASCADE;

CREATE MATERIALIZED VIEW appointments_with_relations AS
SELECT 
  a.id,
  a.created_at,
  a.updated_at,
  a.business_id,
  a.location_id,
  a.service_id,
  a.client_id,
  a.employee_id,
  a.start_time,
  a.end_time,
  a.status,
  a.notes,
  a.client_notes,
  a.price,
  a.currency,
  a.payment_status,
  a.reminder_sent,
  a.cancelled_at,
  a.cancelled_by,
  a.cancel_reason,
  a.is_location_exception,
  a.original_location_id,
  -- Business data (JSONB para facilitar consultas)
  jsonb_build_object(
    'id', b.id,
    'name', b.name,
    'description', b.description
  ) as business,
  -- Location data
  jsonb_build_object(
    'id', l.id,
    'name', l.name,
    'address', l.address,
    'city', l.city,
    'state', l.state,
    'postal_code', l.postal_code,
    'google_maps_url', l.google_maps_url
  ) as location,
  -- Employee data (profiles via employee_id)
  jsonb_build_object(
    'id', e.id,
    'full_name', e.full_name,
    'email', e.email,
    'phone', e.phone,
    'avatar_url', e.avatar_url
  ) as employee,
  -- Client data (profiles via client_id)
  jsonb_build_object(
    'id', c.id,
    'full_name', c.full_name,
    'email', c.email,
    'phone', c.phone,
    'avatar_url', c.avatar_url
  ) as client,
  -- Service data
  jsonb_build_object(
    'id', s.id,
    'name', s.name,
    'description', s.description,
    'duration_minutes', s.duration_minutes,
    'price', s.price,
    'currency', s.currency
  ) as service
FROM appointments a
LEFT JOIN businesses b ON a.business_id = b.id
LEFT JOIN locations l ON a.location_id = l.id
LEFT JOIN profiles e ON a.employee_id = e.id
LEFT JOIN profiles c ON a.client_id = c.id
LEFT JOIN services s ON a.service_id = s.id;

-- ============================================================================
-- PASO 3: Crear índice único para REFRESH CONCURRENTLY
-- ============================================================================

CREATE UNIQUE INDEX appointments_with_relations_id_idx 
ON appointments_with_relations (id);

-- Índices adicionales para performance
CREATE INDEX appointments_with_relations_client_idx 
ON appointments_with_relations (client_id);

CREATE INDEX appointments_with_relations_employee_idx 
ON appointments_with_relations (employee_id);

CREATE INDEX appointments_with_relations_business_idx 
ON appointments_with_relations (business_id);

CREATE INDEX appointments_with_relations_start_time_idx 
ON appointments_with_relations (start_time);

CREATE INDEX appointments_with_relations_status_idx 
ON appointments_with_relations (status);

-- ============================================================================
-- PASO 4: Función y trigger para auto-refresh
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_appointments_with_relations()
RETURNS trigger AS $$
BEGIN
  -- REFRESH CONCURRENTLY no bloquea lecturas
  REFRESH MATERIALIZED VIEW CONCURRENTLY appointments_with_relations;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger en appointments
DROP TRIGGER IF EXISTS refresh_appointments_view ON appointments;
CREATE TRIGGER refresh_appointments_view
AFTER INSERT OR UPDATE OR DELETE ON appointments
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_appointments_with_relations();

-- Trigger en profiles (para actualizar nombres)
DROP TRIGGER IF EXISTS refresh_appointments_view_from_profiles ON profiles;
CREATE TRIGGER refresh_appointments_view_from_profiles
AFTER UPDATE OF full_name, email, phone, avatar_url ON profiles
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_appointments_with_relations();

-- Trigger en businesses
DROP TRIGGER IF EXISTS refresh_appointments_view_from_businesses ON businesses;
CREATE TRIGGER refresh_appointments_view_from_businesses
AFTER UPDATE OF name, description ON businesses
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_appointments_with_relations();

-- Trigger en services
DROP TRIGGER IF EXISTS refresh_appointments_view_from_services ON services;
CREATE TRIGGER refresh_appointments_view_from_services
AFTER UPDATE OF name, description, duration_minutes, price ON services
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_appointments_with_relations();

-- Trigger en locations
DROP TRIGGER IF EXISTS refresh_appointments_view_from_locations ON locations;
CREATE TRIGGER refresh_appointments_view_from_locations
AFTER UPDATE OF name, address, city, state, postal_code, google_maps_url ON locations
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_appointments_with_relations();

-- ============================================================================
-- PASO 5: Configurar ownership y permisos
-- ============================================================================

ALTER MATERIALIZED VIEW appointments_with_relations OWNER TO postgres;

-- Otorgar permisos de lectura al rol anónimo (para RLS)
GRANT SELECT ON appointments_with_relations TO anon;
GRANT SELECT ON appointments_with_relations TO authenticated;

-- ============================================================================
-- PASO 6: Comentarios para documentación
-- ============================================================================

COMMENT ON MATERIALIZED VIEW appointments_with_relations IS 
'Vista materializada con todas las relaciones de appointments pre-joineadas. 
Soluciona ambigüedad de foreign keys múltiples a profiles.
Se actualiza automáticamente vía triggers.';

COMMENT ON FUNCTION refresh_appointments_with_relations IS
'Refresca la vista materializada appointments_with_relations de forma concurrente (no bloquea lecturas)';
