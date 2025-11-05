-- Appointment confirmation policies and token-based confirmation
-- Idempotent migration to add confirmation columns and RPCs
-- Applies to cloud Supabase project (see supabase/config.toml)

-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure enum value 'confirmed' exists on appointment_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'appointment_status'
      AND e.enumlabel = 'confirmed'
  ) THEN
    ALTER TYPE appointment_status ADD VALUE 'confirmed';
  END IF;
END;
$$;

-- 1) Appointment confirmation columns
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS confirmation_token TEXT,
  ADD COLUMN IF NOT EXISTS confirmation_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

-- Unique token index (partial, only non-null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_confirmation_token
  ON public.appointments(confirmation_token)
  WHERE confirmation_token IS NOT NULL;

-- 2) RPC: set confirmation deadline and token
CREATE OR REPLACE FUNCTION public.set_appointment_confirmation_deadline(
  p_appointment_id UUID,
  p_hours INTEGER DEFAULT 24
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token TEXT;
BEGIN
  -- Generate a token (UUID v4)
  v_token := uuid_generate_v4()::text;

  UPDATE public.appointments
  SET confirmation_token = v_token,
      confirmation_deadline = NOW() + make_interval(hours => p_hours)
  WHERE id = p_appointment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointment % not found', p_appointment_id;
  END IF;

  RETURN v_token;
END;
$$;

-- 3) RPC: confirm appointment by token
CREATE OR REPLACE FUNCTION public.confirm_appointment_by_token(
  p_token TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  SET status = 'confirmed',
      confirmed_at = NOW(),
      confirmation_token = NULL,
      confirmation_deadline = NULL
  WHERE id = v_id;

  RETURN TRUE;
END;
$$;

-- 4) RPC: cancel appointment by token (optional reason)
CREATE OR REPLACE FUNCTION public.cancel_appointment_by_token(
  p_token TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  SELECT id INTO v_id
  FROM public.appointments
  WHERE confirmation_token = p_token
  LIMIT 1;

  IF v_id IS NULL THEN
    RETURN FALSE;
  END IF;

  UPDATE public.appointments
  SET status = 'cancelled',
      cancelled_reason = COALESCE(p_reason, cancelled_reason),
      confirmation_token = NULL,
      confirmation_deadline = NULL
  WHERE id = v_id;

  RETURN TRUE;
END;
$$;

-- Grants: allow execution from anon/authenticated via PostgREST
GRANT EXECUTE ON FUNCTION public.set_appointment_confirmation_deadline(uuid, integer)
  TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.confirm_appointment_by_token(text)
  TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.cancel_appointment_by_token(text, text)
  TO authenticated, anon;

-- 5) Seed confirmation policies into businesses.settings JSON
-- Adds confirmation_policies if not present: require_admin_confirmation + channels
UPDATE public.businesses b
SET settings = jsonb_set(
  b.settings,
  '{confirmation_policies}',
  '{"require_admin_confirmation": false, "channels": {"email": true, "whatsapp": true, "sms": false}}'::jsonb,
  true
)
WHERE NOT (b.settings ? 'confirmation_policies');

-- End of migration
