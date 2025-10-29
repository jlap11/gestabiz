-- Fix misassigned employee_id equal to client_id in appointments
-- Idempotent guard: only run if employee_id column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'appointments'
      AND column_name = 'employee_id'
  ) THEN
    -- Set employee_id to NULL when it equals client_id (client was incorrectly set as employee)
    UPDATE public.appointments
    SET employee_id = NULL
    WHERE employee_id IS NOT NULL
      AND client_id IS NOT NULL
      AND employee_id = client_id
      AND resource_id IS NOT NULL; -- respetar CHECK: requiere algún asignado (empleado o recurso)
  END IF;
END $$;

-- Optional: ensure appointment_details view remains consistent (no structural change here)
-- No view changes required; joins already use employee_id.
