-- Create location_media table
CREATE TABLE IF NOT EXISTS public.location_media (
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
            SELECT 1 FROM public.locations 
            WHERE locations.id = location_media.location_id 
            AND locations.user_id = auth.uid()
        )
    );

CREATE POLICY "Location owners can delete their media" ON public.location_media
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.locations 
            WHERE locations.id = location_media.location_id 
            AND locations.user_id = auth.uid()
        )
    );

-- Create storage bucket for location videos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('location-videos', 'location-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for storage bucket
CREATE POLICY "Anyone can view location videos" ON storage.objects
    FOR SELECT USING (bucket_id = 'location-videos');

CREATE POLICY "Authenticated users can upload location videos" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'location-videos' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can update their own location videos" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'location-videos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own location videos" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'location-videos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );