-- Allow business members (approved employees) to manage location_media, not only owners
-- This migration creates helper function and updates RLS policies accordingly.

-- Helper function to check if current user can manage media for a given location
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
        EXISTS (
          SELECT 1 FROM public.businesses b
          WHERE b.id = l.business_id AND b.owner_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.business_employees be
          WHERE be.business_id = l.business_id AND be.employee_id = auth.uid() AND be.status = 'approved'
        )
      )
  );
$$;
-- Update RLS policies on location_media to use the new helper
ALTER TABLE public.location_media ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view location media" ON public.location_media;
DROP POLICY IF EXISTS "Location owners can insert media" ON public.location_media;
DROP POLICY IF EXISTS "Location owners can update their media" ON public.location_media;
DROP POLICY IF EXISTS "Location owners can delete their media" ON public.location_media;
DROP POLICY IF EXISTS "Members can insert location media" ON public.location_media;
DROP POLICY IF EXISTS "Members can update their location media" ON public.location_media;
DROP POLICY IF EXISTS "Members can delete their location media" ON public.location_media;
-- Public read access
CREATE POLICY "Users can view location media" ON public.location_media
  FOR SELECT USING (true);
-- Insert/update/delete for owners or approved members
CREATE POLICY "Members can insert location media" ON public.location_media
  FOR INSERT
  WITH CHECK (
    public.can_manage_location_media(location_id)
  );
CREATE POLICY "Members can update their location media" ON public.location_media
  FOR UPDATE
  USING (
    public.can_manage_location_media(location_id)
  )
  WITH CHECK (
    public.can_manage_location_media(location_id)
  );
CREATE POLICY "Members can delete their location media" ON public.location_media
  FOR DELETE
  USING (
    public.can_manage_location_media(location_id)
  );
