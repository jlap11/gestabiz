-- =====================================================
-- CONFIGURACIÓN DEL BUCKET user-avatars
-- =====================================================
-- Este archivo contiene la configuración completa para el bucket
-- de avatares de usuario en Supabase Storage.
--
-- IMPORTANTE: Este SQL solo documenta la configuración.
-- El bucket se crea desde el Dashboard de Supabase.
-- =====================================================

-- =====================================================
-- PASO 1: CREAR BUCKET (Desde Dashboard de Supabase)
-- =====================================================
-- 
-- Ve a: Storage > Create a new bucket
-- 
-- Configuración del bucket:
--   • Name: user-avatars
--   • Public bucket: ✅ YES (Activar)
--   • File size limit: 2 MB (2,097,152 bytes)
--   • Allowed MIME types: image/png, image/jpeg, image/jpg, image/webp
--
-- O ejecuta este INSERT si tienes acceso directo a la DB:
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'user-avatars',
--   'user-avatars',
--   true,
--   2097152,
--   ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
-- );

-- =====================================================
-- PASO 2: CONFIGURAR RLS POLICIES
-- =====================================================

-- Policy 1: Lectura pública (cualquiera puede ver avatares)
CREATE POLICY "Public read access to user avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'user-avatars');

-- Policy 2: Los usuarios pueden subir su propio avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Los usuarios pueden actualizar su propio avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'user-avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Los usuarios pueden eliminar su propio avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verifica que el bucket existe:
-- SELECT * FROM storage.buckets WHERE id = 'user-avatars';

-- Verifica las policies:
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%user avatar%';

-- =====================================================
-- ESTRUCTURA DE CARPETAS
-- =====================================================
-- Los archivos se organizan por ID de usuario:
-- 
-- user-avatars/
--   ├── {user_id_1}/
--   │   └── avatar-{timestamp}.{ext}
--   ├── {user_id_2}/
--   │   └── avatar-{timestamp}.{ext}
--   └── ...
--
-- Ejemplo de ruta completa:
-- user-avatars/550e8400-e29b-41d4-a716-446655440000/avatar-1697123456789.jpg
--
-- URL pública resultante:
-- https://{project}.supabase.co/storage/v1/object/public/user-avatars/{user_id}/avatar-{timestamp}.jpg
--
-- =====================================================

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 1. El bucket es PÚBLICO: Las URLs de los avatares son accesibles sin autenticación
-- 2. Solo los usuarios autenticados pueden subir/modificar/eliminar
-- 3. Cada usuario solo puede modificar archivos en su propia carpeta (/{user_id}/)
-- 4. Tamaño máximo: 2 MB por archivo
-- 5. Formatos permitidos: PNG, JPEG, JPG, WEBP
-- 6. Los nombres de archivo incluyen timestamp para evitar problemas de caché
-- =====================================================
