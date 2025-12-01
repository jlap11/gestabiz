-- Core access helper functions used by multiple policies/migrations
-- Extracted from database/rls-policies.sql so they exist before dependents

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'is_business_member'
      AND n.nspname = 'public'
      AND p.pronargs = 1
  ) THEN
    CREATE FUNCTION public.is_business_member(bid uuid)
    RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $func$
      SELECT EXISTS (
        SELECT 1 FROM public.business_employees be
        WHERE be.business_id = bid AND be.employee_id = auth.uid() AND be.status = 'approved'
      );
    $func$;
  END IF;
END $$;
CREATE OR REPLACE FUNCTION public.can_manage_location_media(p_location_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.locations l
    WHERE l.id = p_location_id
      AND (
        public.is_business_admin(l.business_id) OR public.is_business_member(l.business_id)
      )
  );
$$;
