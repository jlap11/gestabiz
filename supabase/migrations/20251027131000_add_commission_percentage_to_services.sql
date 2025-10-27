-- Migration: Add commission_percentage to public.services
-- Context: Move commission configuration to service-level (global default)
-- Safe/idempotent: uses IF NOT EXISTS where possible

BEGIN;

-- Add column if it doesn't exist
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS commission_percentage DECIMAL(5,2)
    CHECK (commission_percentage >= 0 AND commission_percentage <= 100);

-- Optional: comment for documentation
COMMENT ON COLUMN public.services.commission_percentage IS 'Porcentaje de comisión a nivel de servicio (0-100). Puede ser NULL para indicar que no aplica o que se usa comisión por empleado)';

-- No data backfill performed here. Frontend will handle nulls as "sin comisión".

COMMIT;

