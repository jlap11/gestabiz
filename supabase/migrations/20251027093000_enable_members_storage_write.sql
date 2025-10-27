-- Enable owners and approved members to manage storage objects for location media
-- Buckets: location-images, location-videos

-- Drop legacy or conflicting policies if present
DROP POLICY IF EXISTS "Authenticated users can upload location videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own location videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own location videos" ON storage.objects;
DROP POLICY IF EXISTS "Business owners can upload location videos" ON storage.objects;
DROP POLICY IF EXISTS "Business owners can update location videos" ON storage.objects;
DROP POLICY IF EXISTS "Business owners can delete location videos" ON storage.objects;

DROP POLICY IF EXISTS "Business owners can upload location images" ON storage.objects;
DROP POLICY IF EXISTS "Business owners can update location images" ON storage.objects;
DROP POLICY IF EXISTS "Business owners can delete location images" ON storage.objects;

-- INSERT policies: allow owners or approved members to upload
CREATE POLICY "Owners or members can upload location images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'location-images'
    AND public.can_manage_location_media((storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "Owners or members can upload location videos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'location-videos'
    AND public.can_manage_location_media((storage.foldername(name))[1]::uuid)
  );

-- UPDATE policies: allow owners or approved members to update
CREATE POLICY "Owners or members can update location images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'location-images'
    AND public.can_manage_location_media((storage.foldername(name))[1]::uuid)
  )
  WITH CHECK (
    bucket_id = 'location-images'
    AND public.can_manage_location_media((storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "Owners or members can update location videos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'location-videos'
    AND public.can_manage_location_media((storage.foldername(name))[1]::uuid)
  )
  WITH CHECK (
    bucket_id = 'location-videos'
    AND public.can_manage_location_media((storage.foldername(name))[1]::uuid)
  );

-- DELETE policies: allow owners or approved members to delete
CREATE POLICY "Owners or members can delete location images" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'location-images'
    AND public.can_manage_location_media((storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "Owners or members can delete location videos" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'location-videos'
    AND public.can_manage_location_media((storage.foldername(name))[1]::uuid)
  );
