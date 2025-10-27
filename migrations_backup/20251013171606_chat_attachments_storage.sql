-- ================================================
-- CHAT ATTACHMENTS STORAGE BUCKET SETUP
-- ================================================
-- Bucket para almacenar archivos adjuntos de chat:
-- - Imágenes (jpeg, png, gif, webp)
-- - Documentos (pdf, docx, xlsx, txt)
-- - Archivos comprimidos (zip, rar)
--
-- Estructura de carpetas:
-- chat-attachments/
--   {conversation_id}/
--     {message_id}/
--       {filename}
-- ================================================

-- PASO 1: CREAR BUCKET (Ejecutar desde Supabase Dashboard o SQL Editor)
-- ================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  false,  -- Private bucket (requiere autenticación)
  10485760,  -- 10 MB limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip',
    'application/x-rar-compressed'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- PASO 2: POLÍTICAS RLS PARA STORAGE
-- ================================================

-- Policy 1: Ver archivos de conversaciones donde el usuario es participante
CREATE POLICY "Users can view attachments in their conversations"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'chat-attachments'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 
    FROM chat_participants cp
    WHERE cp.user_id = auth.uid()
      AND cp.left_at IS NULL
      AND (storage.foldername(name))[1] = cp.conversation_id::text
  )
);

-- Policy 2: Subir archivos a conversaciones donde el usuario es participante
CREATE POLICY "Users can upload attachments to their conversations"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 
    FROM chat_participants cp
    WHERE cp.user_id = auth.uid()
      AND cp.left_at IS NULL
      AND (storage.foldername(name))[1] = cp.conversation_id::text
  )
);

-- Policy 3: Actualizar archivos propios
CREATE POLICY "Users can update their own attachments"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'chat-attachments'
  AND auth.uid() IS NOT NULL
  AND owner = auth.uid()
);

-- Policy 4: Eliminar archivos propios
CREATE POLICY "Users can delete their own attachments"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'chat-attachments'
  AND auth.uid() IS NOT NULL
  AND owner = auth.uid()
);

-- ================================================
-- FUNCIÓN HELPER: Limpiar archivos huérfanos
-- ================================================

CREATE OR REPLACE FUNCTION cleanup_orphaned_attachments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Eliminar archivos de mensajes eliminados (después de 30 días)
  DELETE FROM storage.objects
  WHERE bucket_id = 'chat-attachments'
    AND created_at < NOW() - INTERVAL '30 days'
    AND NOT EXISTS (
      SELECT 1
      FROM chat_messages cm
      WHERE cm.deleted_at IS NULL
        AND cm.attachments IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM jsonb_array_elements(cm.attachments) AS attachment
          WHERE attachment->>'url' LIKE '%' || name || '%'
        )
    );
END;
$$;

-- ================================================
-- TRIGGER: Limpiar archivos al eliminar mensaje
-- ================================================

CREATE OR REPLACE FUNCTION delete_message_attachments()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  attachment jsonb;
  file_path text;
BEGIN
  -- Solo procesar si el mensaje fue eliminado (soft delete)
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    -- Iterar sobre attachments y eliminar archivos
    IF NEW.attachments IS NOT NULL THEN
      FOR attachment IN SELECT * FROM jsonb_array_elements(NEW.attachments)
      LOOP
        -- Extraer path del archivo desde la URL
        file_path := regexp_replace(
          attachment->>'url',
          '^.*/chat-attachments/',
          ''
        );
        
        -- Eliminar archivo de storage
        DELETE FROM storage.objects
        WHERE bucket_id = 'chat-attachments'
          AND name = file_path;
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_delete_message_attachments
AFTER UPDATE OF deleted_at ON chat_messages
FOR EACH ROW
EXECUTE FUNCTION delete_message_attachments();

-- ================================================
-- VERIFICACIÓN
-- ================================================

-- Ver configuración del bucket
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'chat-attachments';

-- Ver políticas RLS
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%chat-attachments%'
ORDER BY policyname;

-- ================================================
-- NOTAS DE USO
-- ================================================

/*
1. El bucket es PRIVADO (public = false)
   - Solo usuarios autenticados pueden acceder
   - Solo participantes de la conversación pueden ver archivos

2. Límite de tamaño: 10 MB por archivo
   - Imágenes: jpeg, png, gif, webp
   - Documentos: pdf, docx, xlsx, txt
   - Archivos: zip, rar

3. Estructura de carpetas:
   chat-attachments/{conversation_id}/{message_id}/{filename}

4. Los archivos se eliminan automáticamente cuando:
   - El mensaje es eliminado (trigger inmediato)
   - Son huérfanos después de 30 días (función cleanup)

5. Para ejecutar cleanup manual:
   SELECT cleanup_orphaned_attachments();

6. URL pública de archivo:
   {SUPABASE_URL}/storage/v1/object/chat-attachments/{path}
   Requiere token de autenticación en header
*/
