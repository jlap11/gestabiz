-- Fix confirmation and cancellation RPCs
-- - Use gen_random_uuid() instead of uuid_generate_v4()
-- - Correct column name to cancel_reason

begin;
-- Ensure no legacy single-arg function remains (defensive)
DROP FUNCTION IF EXISTS public.set_appointment_confirmation_deadline(uuid);
-- 1) RPC: set appointment confirmation deadline (generate token)
CREATE OR REPLACE FUNCTION public.set_appointment_confirmation_deadline(
  p_appointment_id UUID,
  p_hours INTEGER DEFAULT 24
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_token TEXT;
BEGIN
  -- gen_random_uuid() is available via pgcrypto on Supabase
  v_token := gen_random_uuid()::text;

  UPDATE public.appointments
  SET confirmation_token = v_token,
      confirmation_deadline = NOW() + make_interval(hours => p_hours)
  WHERE id = p_appointment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointment % not found', p_appointment_id;
  END IF;

  RETURN v_token;
END;
$fn$;
GRANT EXECUTE ON FUNCTION public.set_appointment_confirmation_deadline(uuid, integer)
  TO authenticated, anon;
-- 2) RPC: cancel appointment by token (correct cancel_reason column)
CREATE OR REPLACE FUNCTION public.cancel_appointment_by_token(
  p_token TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_id UUID;
BEGIN
  SELECT id INTO v_id
  FROM public.appointments
  WHERE confirmation_token = p_token
    AND (confirmation_deadline IS NULL OR confirmation_deadline >= NOW())
  LIMIT 1;

  IF v_id IS NULL THEN
    RETURN FALSE;
  END IF;

  UPDATE public.appointments
  SET status = 'cancelled',
      cancel_reason = COALESCE(p_reason, cancel_reason),
      confirmation_token = NULL,
      confirmation_deadline = NULL
  WHERE id = v_id;

  RETURN TRUE;
END;
$fn$;
commit;
