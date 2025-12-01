-- Allow business members (approved employees) to manage service image storage
-- Buckets: service-images

-- Helper function: allow admins or approved members to manage service media
CREATE OR REPLACE FUNCTION public.can_manage_service_media(p_service_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.services s
    WHERE s.id = p_service_id
      AND (
        public.is_business_admin(s.business_id)
        OR public.is_business_member(s.business_id)
      )
  );
$$;
-- Drop legacy policies if present
DROP POLICY IF EXISTS "Public read access for service images" ON storage.objects;
DROP POLICY IF EXISTS "Business admins can upload service images" ON storage.objects;
DROP POLICY IF EXISTS "Business admins can update service images" ON storage.objects;
DROP POLICY IF EXISTS "Business admins can delete service images" ON storage.objects;
DROP POLICY IF EXISTS "Owners or members can upload service images" ON storage.objects;
DROP POLICY IF EXISTS "Owners or members can update service images" ON storage.objects;
DROP POLICY IF EXISTS "Owners or members can delete service images" ON storage.objects;
-- Recreate policies scoped to service-images bucket using helper
CREATE POLICY "Public read access for service images"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-images');
CREATE POLICY "Owners or members can upload service images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'service-images'
  AND public.can_manage_service_media(((storage.foldername(storage.objects.name))[1])::uuid)
);
CREATE POLICY "Owners or members can update service images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'service-images'
  AND public.can_manage_service_media(((storage.foldername(storage.objects.name))[1])::uuid)
)
WITH CHECK (
  bucket_id = 'service-images'
  AND public.can_manage_service_media(((storage.foldername(storage.objects.name))[1])::uuid)
);
CREATE POLICY "Owners or members can delete service images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'service-images'
  AND public.can_manage_service_media(((storage.foldername(storage.objects.name))[1])::uuid)
);
-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
