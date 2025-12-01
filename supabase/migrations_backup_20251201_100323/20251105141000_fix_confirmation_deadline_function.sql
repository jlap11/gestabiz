-- Fix ambiguity: drop legacy single-arg set_appointment_confirmation_deadline
-- Context: Error "function set_appointment_confirmation_deadline(uuid) is not unique"
-- Cause: Two functions existed:
--  - public.set_appointment_confirmation_deadline(appointment_id UUID)
--  - public.set_appointment_confirmation_deadline(p_appointment_id UUID, p_hours INTEGER DEFAULT 24)
-- Resolution: Drop the old single-argument version to avoid ambiguity in triggers and RPC calls

begin;
-- Drop legacy single-parameter function if it still exists
DROP FUNCTION IF EXISTS public.set_appointment_confirmation_deadline(uuid);
-- Ensure execute privilege on the current function (two-arg with default)
GRANT EXECUTE ON FUNCTION public.set_appointment_confirmation_deadline(uuid, integer)
  TO authenticated, anon;
commit;
