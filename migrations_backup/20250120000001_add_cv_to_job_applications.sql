-- Migration: Add CV support to job applications
-- Date: 2025-01-20
-- Description: Adds cv_url field and creates storage bucket for CVs

-- 1. Add cv_url column to job_applications
ALTER TABLE public.job_applications
ADD COLUMN IF NOT EXISTS cv_url TEXT;

COMMENT ON COLUMN public.job_applications.cv_url IS 'URL del CV cargado en Supabase Storage (formato: cvs/user_id/vacancy_id_timestamp.ext)';

-- 2. Create storage bucket for CVs (if not exists)
-- Note: This needs to be run via Supabase Dashboard or Storage API
-- Bucket name: 'cvs'
-- Public: false (solo accesible con autenticación)
-- File size limit: 5MB
-- Allowed MIME types: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document

-- 3. Create RLS policies for CV storage bucket
-- These will be applied via Supabase Dashboard Storage settings:

-- Policy 1: Allow authenticated users to upload their own CVs
-- INSERT policy: bucket_id = 'cvs' AND (storage.foldername(name))[1] = auth.uid()::text

-- Policy 2: Allow users to read their own CVs
-- SELECT policy: bucket_id = 'cvs' AND (storage.foldername(name))[1] = auth.uid()::text

-- Policy 3: Allow business owners/admins to read CVs of applicants to their vacancies
-- SELECT policy: bucket_id = 'cvs' AND EXISTS (
--   SELECT 1 FROM job_applications ja
--   JOIN job_vacancies jv ON ja.vacancy_id = jv.id
--   WHERE jv.business_id IN (
--     SELECT id FROM businesses WHERE owner_id = auth.uid()
--   )
--   AND ja.cv_url = name
-- )

-- 4. Create function to get signed URL for CV download
CREATE OR REPLACE FUNCTION public.get_cv_download_url(cv_path TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  signed_url TEXT;
BEGIN
  -- Verify user has permission to access this CV
  -- Either they own the application OR they own the business that posted the vacancy
  IF NOT EXISTS (
    SELECT 1 FROM job_applications ja
    LEFT JOIN job_vacancies jv ON ja.vacancy_id = jv.id
    LEFT JOIN businesses b ON jv.business_id = b.id
    WHERE ja.cv_url = cv_path
    AND (ja.user_id = auth.uid() OR b.owner_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'No tiene permiso para acceder a este CV';
  END IF;

  -- In production, this would generate a signed URL using Supabase Storage API
  -- For now, return the path (frontend will use supabase.storage.from('cvs').download())
  RETURN cv_path;
END;
$$;

COMMENT ON FUNCTION public.get_cv_download_url IS 'Genera una URL firmada para descargar un CV (solo si el usuario tiene permiso)';

-- 5. Add index for cv_url lookups
CREATE INDEX IF NOT EXISTS idx_job_applications_cv_url 
ON public.job_applications(cv_url) 
WHERE cv_url IS NOT NULL;

-- 6. Update RLS policies for job_applications to include cv_url

-- Allow users to see cv_url of their own applications
-- (Already covered by existing SELECT policy)

-- Allow business owners to see cv_url of applications to their vacancies
-- (Already covered by existing SELECT policy)
