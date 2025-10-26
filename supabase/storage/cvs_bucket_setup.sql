-- Storage Bucket Configuration for CVs
-- This file documents the manual setup required in Supabase Dashboard

/*
BUCKET CONFIGURATION:
=====================

1. Go to Supabase Dashboard → Storage
2. Create new bucket with these settings:

Bucket name: cvs
Public bucket: NO (Private - requires authentication)
File size limit: 5 MB (5242880 bytes)
Allowed MIME types:
  - application/pdf
  - application/vnd.openxmlformats-officedocument.wordprocessingml.document

3. RLS POLICIES for 'cvs' bucket:
===================================

Policy 1: "Users can upload their own CVs"
- Operation: INSERT
- Policy definition:
  bucket_id = 'cvs' 
  AND (storage.foldername(name))[1] = auth.uid()::text

Policy 2: "Users can read their own CVs"
- Operation: SELECT
- Policy definition:
  bucket_id = 'cvs' 
  AND (storage.foldername(name))[1] = auth.uid()::text

Policy 3: "Business owners can read CVs of applicants"
- Operation: SELECT
- Policy definition:
  bucket_id = 'cvs' 
  AND EXISTS (
    SELECT 1 
    FROM public.job_applications ja
    JOIN public.job_vacancies jv ON ja.vacancy_id = jv.id
    JOIN public.businesses b ON jv.business_id = b.id
    WHERE b.owner_id = auth.uid()
    AND ja.cv_url LIKE '%' || name || '%'
  )

Policy 4: "Users can update their own CVs"
- Operation: UPDATE
- Policy definition:
  bucket_id = 'cvs' 
  AND (storage.foldername(name))[1] = auth.uid()::text

Policy 5: "Users can delete their own CVs"
- Operation: DELETE
- Policy definition:
  bucket_id = 'cvs' 
  AND (storage.foldername(name))[1] = auth.uid()::text

4. FOLDER STRUCTURE:
====================

cvs/
  ├── {user_id_1}/
  │   ├── {vacancy_id_1}_{timestamp}.pdf
  │   ├── {vacancy_id_2}_{timestamp}.docx
  │   └── ...
  ├── {user_id_2}/
  │   └── ...
  └── ...

Example path:
cvs/550e8400-e29b-41d4-a716-446655440000/123e4567-e89b-12d3-a456-426614174000_1705689600000.pdf

5. ALTERNATIVE: Create bucket via CLI
======================================

supabase storage buckets create cvs --public false

Then configure policies via Dashboard or SQL.
*/
