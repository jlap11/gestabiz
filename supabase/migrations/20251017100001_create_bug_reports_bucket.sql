-- =====================================================
-- CREACIÓN DE BUCKET PARA EVIDENCIAS DE BUG REPORTS
-- Archivo: 20251017100001_create_bug_reports_bucket.sql
-- =====================================================

-- Crear el bucket para evidencias de bug reports
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bug-reports-evidence',
  'bug-reports-evidence',
  false, -- No público por defecto
  10485760, -- 10MB límite por archivo
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'application/pdf',
    'text/plain',
    'application/json'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- POLÍTICAS DE STORAGE
-- =====================================================

-- Política 1: Los usuarios pueden subir evidencias a sus propios reportes
CREATE POLICY "Users can upload evidence for their own bug reports"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'bug-reports-evidence' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política 2: Los usuarios pueden ver evidencias de sus propios reportes
CREATE POLICY "Users can view their own bug report evidence"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'bug-reports-evidence' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política 3: Los usuarios pueden actualizar evidencias de sus propios reportes
CREATE POLICY "Users can update their own bug report evidence"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'bug-reports-evidence' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'bug-reports-evidence' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política 4: Los usuarios pueden eliminar evidencias de sus propios reportes
CREATE POLICY "Users can delete their own bug report evidence"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'bug-reports-evidence' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON POLICY "Users can upload evidence for their own bug reports" 
ON storage.objects IS 'Permite a usuarios subir evidencias a carpetas con su user_id';

COMMENT ON POLICY "Users can view their own bug report evidence"
ON storage.objects IS 'Permite a usuarios ver solo evidencias en carpetas con su user_id';
