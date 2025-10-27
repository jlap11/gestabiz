-- Create helper function to check if user owns the location (for storage RLS)
CREATE OR REPLACE FUNCTION public.is_location_owner_for_storage(p_location_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.locations l
    JOIN public.businesses b ON b.id = l.business_id
    WHERE l.id = p_location_id
      AND b.owner_id = auth.uid()
  );
$$;

-- Drop existing policies for location_media
DROP POLICY IF EXISTS "Users can view location media" ON public.location_media;
DROP POLICY IF EXISTS "Authenticated users can insert location media" ON public.location_media;
DROP POLICY IF EXISTS "Location owners can update their media" ON public.location_media;
DROP POLICY IF EXISTS "Location owners can delete their media" ON public.location_media;

-- Create corrected RLS policies for location_media
CREATE POLICY "Users can view location media" ON public.location_media
    FOR SELECT USING (true);

CREATE POLICY "Location owners can insert media" ON public.location_media
    FOR INSERT WITH CHECK (
        public.is_location_owner_for_storage(location_id)
    );

CREATE POLICY "Location owners can update their media" ON public.location_media
    FOR UPDATE USING (
        public.is_location_owner_for_storage(location_id)
    );

CREATE POLICY "Location owners can delete their media" ON public.location_media
    FOR DELETE USING (
        public.is_location_owner_for_storage(location_id)
    );

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';