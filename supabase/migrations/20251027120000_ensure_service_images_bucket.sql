-- Ensure storage bucket for service images exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-images', 'service-images', TRUE)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, name = EXCLUDED.name;
-- Public read policy (idempotent)
DROP POLICY IF EXISTS "Public read service images" ON storage.objects;
CREATE POLICY "Public read service images" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'service-images');
-- Note: Insert/Update/Delete policies for service-images are defined centrally in database/rls-policies.sql
-- This migration focuses on bucket existence and public read.

NOTIFY pgrst, 'reload schema';
