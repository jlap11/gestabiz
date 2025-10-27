-- ============================================================================
-- MIGRATION: Public browsing RLS policies for client-facing flows
-- Date: 2025-10-26
-- Purpose: Allow anonymous/authenticated clients to read active, public businesses
--          and their active locations, without exposing private/inactive records.
-- Dialect: PostgreSQL (Supabase)
-- ============================================================================

-- Ensure RLS is enabled on target tables
ALTER TABLE IF EXISTS public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.locations ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Policy: sel_businesses_public (public SELECT on active, public businesses)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'businesses'
      AND policyname = 'sel_businesses_public'
  ) THEN
    CREATE POLICY sel_businesses_public
      ON public.businesses
      FOR SELECT
      USING (
        is_active = TRUE
        AND is_public = TRUE
      );
  END IF;
END
$$;

-- ----------------------------------------------------------------------------
-- Policy: sel_locations_public (public SELECT on active locations of public businesses)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'locations'
      AND policyname = 'sel_locations_public'
  ) THEN
    CREATE POLICY sel_locations_public
      ON public.locations
      FOR SELECT
      USING (
        is_active = TRUE
        AND EXISTS (
          SELECT 1
          FROM public.businesses b
          WHERE b.id = locations.business_id
            AND b.is_active = TRUE
            AND b.is_public = TRUE
        )
      );
  END IF;
END
$$;

-- Notes:
-- - These policies allow safe public browsing (client-side read) while keeping
--   management (INSERT/UPDATE/DELETE) restricted to business owners/employees.
-- - If additional policies exist (owner/member read), they will coexist with
--   these public SELECT policies without conflict.
-- ============================================================================
