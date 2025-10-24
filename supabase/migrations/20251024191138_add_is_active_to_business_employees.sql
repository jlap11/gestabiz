-- Migration: add is_active to business_employees
-- Purpose: track active employments and filter views

-- 1) Column addition
ALTER TABLE public.business_employees
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- 2) Index to support filtering by active memberships
CREATE INDEX IF NOT EXISTS business_employees_active_idx
  ON public.business_employees (business_id, user_id, is_active);

-- 3) Backfill to ensure no NULLs remain
UPDATE public.business_employees
SET is_active = COALESCE(is_active, true)
WHERE is_active IS NULL;

-- RLS: existing policies for business_employees remain valid; no changes required.