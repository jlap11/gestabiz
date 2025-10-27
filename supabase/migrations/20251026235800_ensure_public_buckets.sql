-- Ensure storage buckets for location media exist and are public
-- Buckets: location-images, location-videos

-- Upsert buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('location-images', 'location-images', TRUE)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, name = EXCLUDED.name;

INSERT INTO storage.buckets (id, name, public)
VALUES ('location-videos', 'location-videos', TRUE)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, name = EXCLUDED.name;

-- Storage policies: allow public read for these buckets
DROP POLICY IF EXISTS "Public read images" ON storage.objects;
DROP POLICY IF EXISTS "Public read videos" ON storage.objects;

CREATE POLICY "Public read images" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'location-images');

CREATE POLICY "Public read videos" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'location-videos');
