-- ============================================================================
-- EJECUTAR ESTE SCRIPT EN SUPABASE SQL EDITOR (después de crear los buckets)
-- ============================================================================
-- Este script configura las políticas RLS para los buckets de Storage
-- NOTA: Los buckets deben crearse manualmente en Supabase Dashboard primero

-- =====================================================
-- POLÍTICAS PARA BUCKET: business-logos
-- =====================================================

-- Permitir a todos ver los logos (público)
CREATE POLICY "Public read access for business logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'business-logos');

-- Solo los dueños de negocios pueden subir su logo
CREATE POLICY "Business owners can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'business-logos' 
  AND auth.uid() IN (
    SELECT owner_id FROM public.businesses 
    WHERE id::text = (storage.foldername(storage.objects.name))[1]
  )
);

-- Solo los dueños de negocios pueden actualizar su logo
CREATE POLICY "Business owners can update logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'business-logos' 
  AND auth.uid() IN (
    SELECT owner_id FROM public.businesses 
    WHERE id::text = (storage.foldername(storage.objects.name))[1]
  )
);

-- Solo los dueños de negocios pueden eliminar su logo
CREATE POLICY "Business owners can delete logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'business-logos' 
  AND auth.uid() IN (
    SELECT owner_id FROM public.businesses 
    WHERE id::text = (storage.foldername(storage.objects.name))[1]
  )
);

-- =====================================================
-- POLÍTICAS PARA BUCKET: location-images
-- =====================================================

-- Permitir a todos ver las imágenes de sedes (público)
CREATE POLICY "Public read access for location images"
ON storage.objects FOR SELECT
USING (bucket_id = 'location-images');

-- Solo los dueños de negocios pueden subir imágenes de sus sedes
CREATE POLICY "Business owners can upload location images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'location-images' 
  AND auth.uid() IN (
    SELECT b.owner_id 
    FROM public.businesses b
    INNER JOIN public.locations l ON l.business_id = b.id
    WHERE l.id::text = (storage.foldername(storage.objects.name))[1]
  )
);

-- Solo los dueños de negocios pueden actualizar imágenes de sus sedes
CREATE POLICY "Business owners can update location images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'location-images' 
  AND auth.uid() IN (
    SELECT b.owner_id 
    FROM public.businesses b
    INNER JOIN public.locations l ON l.business_id = b.id
    WHERE l.id::text = (storage.foldername(storage.objects.name))[1]
  )
);

-- Solo los dueños de negocios pueden eliminar imágenes de sus sedes
CREATE POLICY "Business owners can delete location images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'location-images' 
  AND auth.uid() IN (
    SELECT b.owner_id 
    FROM public.businesses b
    INNER JOIN public.locations l ON l.business_id = b.id
    WHERE l.id::text = (storage.foldername(storage.objects.name))[1]
  )
);

-- =====================================================
-- POLÍTICAS PARA BUCKET: service-images
-- =====================================================

-- Permitir a todos ver las imágenes de servicios (público)
CREATE POLICY "Public read access for service images"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-images');

-- Solo los dueños de negocios pueden subir imágenes de sus servicios
CREATE POLICY "Business owners can upload service images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'service-images' 
  AND auth.uid() IN (
    SELECT b.owner_id 
    FROM public.businesses b
    INNER JOIN public.services s ON s.business_id = b.id
    WHERE s.id::text = (storage.foldername(storage.objects.name))[1]
  )
);

-- Solo los dueños de negocios pueden actualizar imágenes de sus servicios
CREATE POLICY "Business owners can update service images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'service-images' 
  AND auth.uid() IN (
    SELECT b.owner_id 
    FROM public.businesses b
    INNER JOIN public.services s ON s.business_id = b.id
    WHERE s.id::text = (storage.foldername(storage.objects.name))[1]
  )
);

-- Solo los dueños de negocios pueden eliminar imágenes de sus servicios
CREATE POLICY "Business owners can delete service images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'service-images' 
  AND auth.uid() IN (
    SELECT b.owner_id 
    FROM public.businesses b
    INNER JOIN public.services s ON s.business_id = b.id
    WHERE s.id::text = (storage.foldername(storage.objects.name))[1]
  )
);

-- Listo! Políticas RLS configuradas
SELECT 'Políticas RLS de Storage configuradas exitosamente!' as status;
