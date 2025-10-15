-- Migration: Remove duplicate get_business_hierarchy function
-- Date: 2025-10-15
-- Description: Removes the old version of get_business_hierarchy function (3 params)
--              to avoid ambiguity error. Keeps only the version with 4 params (includes p_filters).

-- Drop the old version (3 parameters)
DROP FUNCTION IF EXISTS public.get_business_hierarchy(uuid, date, date) CASCADE;

-- The new version with 4 parameters (p_business_id, p_start_date, p_end_date, p_filters) 
-- is already present and will be the only one available after this migration.
--
-- Function signature:
-- get_business_hierarchy(
--   p_business_id uuid,
--   p_start_date date DEFAULT (CURRENT_DATE - '30 days'::interval),
--   p_end_date date DEFAULT CURRENT_DATE,
--   p_filters jsonb DEFAULT '{}'::jsonb
-- )
