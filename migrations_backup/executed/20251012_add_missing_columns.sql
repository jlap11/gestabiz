-- Agregar columna google_maps_url a locations
ALTER TABLE public.locations 
ADD COLUMN IF NOT EXISTS google_maps_url TEXT;

-- Comentario para la columna
COMMENT ON COLUMN public.locations.google_maps_url IS 'URL de Google Maps para la ubicación de la sede';
