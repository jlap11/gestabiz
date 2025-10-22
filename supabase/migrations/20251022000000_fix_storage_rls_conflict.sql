-- ============================================================================
-- MIGRACIÓN: Corregir políticas RLS del storage business-logos
-- Fecha: 22 de octubre, 2025
-- Descripción: Crear funciones helper para que las políticas del storage 
--              puedan validar la propiedad del negocio sin conflictos de RLS
-- ============================================================================

-- ============================================================================
-- FUNCIÓN HELPER: Validar que el usuario es dueño del negocio
-- SECURITY DEFINER: Se ejecuta con permisos de quien creó la función
-- Esto permite evitar recursión de RLS en las políticas del storage
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_business_owner_for_storage(p_business_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.businesses
    WHERE id = p_business_id
    AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- ACTUALIZAR POLÍTICA RLS DEL STORAGE: business-logos
-- ============================================================================

-- Eliminar política antigua que causaba el error RLS 403
DROP POLICY IF EXISTS "Business owners can upload logos" ON storage.objects;

-- Crear nueva política que usa la función helper
CREATE POLICY "Business owners can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'business-logos' 
  AND public.is_business_owner_for_storage(
    (storage.foldername(name))[1]::UUID
  )
);

-- ============================================================================
-- ACTUALIZAR OTRAS POLÍTICAS DEL STORAGE BUSINESS-LOGOS
-- ============================================================================

-- UPDATE
DROP POLICY IF EXISTS "Business owners can update logos" ON storage.objects;
CREATE POLICY "Business owners can update logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'business-logos' 
  AND public.is_business_owner_for_storage(
    (storage.foldername(name))[1]::UUID
  )
);

-- DELETE
DROP POLICY IF EXISTS "Business owners can delete logos" ON storage.objects;
CREATE POLICY "Business owners can delete logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'business-logos' 
  AND public.is_business_owner_for_storage(
    (storage.foldername(name))[1]::UUID
  )
);

-- SELECT ya está public, no necesita cambios

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Ver la función creada
-- SELECT * FROM pg_proc WHERE proname = 'is_business_owner_for_storage';

-- Ver las políticas del storage
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'storage'
--   AND tablename = 'objects'
--   AND policyname LIKE '%logos%'
-- ORDER BY policyname;

-- ============================================================================
-- NOTAS
-- ============================================================================
/*
Por qué esto funciona:

1. La función is_business_owner_for_storage() tiene SECURITY DEFINER
   - Se ejecuta con permisos de postgres (quien la creó)
   - No está limitada por las políticas RLS de la tabla businesses
   - Puede acceder sin recursión a los datos

2. Las políticas del storage ahora usan la función en lugar de subqueries
   - Antes: SELECT owner_id FROM businesses... (causaba conflicto RLS)
   - Ahora: public.is_business_owner_for_storage() (sin conflictos)

3. Cast a UUID es importante:
   - storage.foldername(name)[1] devuelve TEXT
   - Necesita convertirse a UUID para coincidir con businesses.id
   - (storage.foldername(name))[1]::UUID
*/
