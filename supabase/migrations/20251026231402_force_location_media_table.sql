-- Drop existing table if it exists (to force cache refresh)
DROP TABLE IF EXISTS public.location_media CASCADE;

-- Recreate location_media table
CREATE TABLE public.location_media (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('image', 'video')),
    url TEXT NOT NULL,
    description TEXT,
    is_banner BOOLEAN DEFAULT false,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.location_media ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view location media" ON public.location_media
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert location media" ON public.location_media
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Location owners can update their media" ON public.location_media
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.locations l
            JOIN public.businesses b ON l.business_id = b.id
            WHERE l.id = location_media.location_id 
            AND b.owner_id = auth.uid()
        )
    );

CREATE POLICY "Location owners can delete their media" ON public.location_media
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.locations l
            JOIN public.businesses b ON l.business_id = b.id
            WHERE l.id = location_media.location_id 
            AND b.owner_id = auth.uid()
        )
    );

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';