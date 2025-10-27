-- Archivo de políticas RLS para PostgreSQL (Supabase)
-- IMPORTANTE: Este script es para Postgres. Si tu editor usa un analizador T-SQL (SQL Server),
-- mostrará errores falsos en local. Aplícalo en el SQL Editor de Supabase o vía CLI.
-- Cómo aplicar:
-- 1) Supabase Studio → SQL Editor → pegar y ejecutar.
-- 2) Supabase CLI:  supabase db execute --file ./database/rls-policies.sql
-- Dialecto: PostgreSQL 14+ con auth.uid() disponible en Supabase.
-- Fuente de verdad única de RLS: NO duplicar políticas en schema.sql

-- Habilitar RLS en tablas existentes
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Helper functions (SECURITY DEFINER) para evitar recursión en políticas
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_business_owner(bid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = bid AND b.owner_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_business_member(bid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_employees be
    WHERE be.business_id = bid AND be.employee_id = auth.uid() AND be.status = 'approved'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_business_admin(bid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT 
    EXISTS (
      SELECT 1 FROM public.businesses b 
      WHERE b.id = bid AND b.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.business_employees be
      WHERE be.business_id = bid 
        AND be.employee_id = auth.uid() 
        AND be.status = 'approved' 
        AND be.role = 'manager'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_location_owner_for_storage(p_location_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.locations l
    JOIN public.businesses b ON b.id = l.business_id
    WHERE l.id = p_location_id
      AND b.owner_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_location_media(p_location_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.locations l
    WHERE l.id = p_location_id
      AND (
        public.is_business_owner(l.business_id)
        OR public.is_business_member(l.business_id)
      )
  );
$$;

-- ============================================================================
-- PROFILES
-- ============================================================================
DROP POLICY IF EXISTS sel_profiles ON public.profiles;
DROP POLICY IF EXISTS upd_profiles ON public.profiles;
DROP POLICY IF EXISTS ins_profiles ON public.profiles;
CREATE POLICY sel_profiles ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY upd_profiles ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY ins_profiles ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================================
-- BUSINESSES
-- ============================================================================
DROP POLICY IF EXISTS sel_businesses ON public.businesses;
DROP POLICY IF EXISTS sel_businesses_public ON public.businesses;
DROP POLICY IF EXISTS ins_businesses ON public.businesses;
DROP POLICY IF EXISTS upd_businesses ON public.businesses;
DROP POLICY IF EXISTS del_businesses ON public.businesses;
CREATE POLICY sel_businesses ON public.businesses
  FOR SELECT USING (
    is_business_owner(id) OR is_business_member(id)
  );
-- Allow public read of active, public businesses for client browsing
CREATE POLICY sel_businesses_public ON public.businesses
  FOR SELECT USING (
    is_active = TRUE AND is_public = TRUE
  );
CREATE POLICY ins_businesses ON public.businesses
  FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY upd_businesses ON public.businesses
  FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY del_businesses ON public.businesses
  FOR DELETE USING (owner_id = auth.uid());

-- ============================================================================
-- LOCATIONS
-- ============================================================================
DROP POLICY IF EXISTS sel_locations ON public.locations;
DROP POLICY IF EXISTS sel_locations_public ON public.locations;
DROP POLICY IF EXISTS all_locations_owner ON public.locations;
CREATE POLICY sel_locations ON public.locations
  FOR SELECT USING (
    is_business_owner(locations.business_id) OR is_business_member(locations.business_id)
  );
-- Allow public read of active locations of public businesses
CREATE POLICY sel_locations_public ON public.locations
  FOR SELECT USING (
    is_active = TRUE AND locations.business_id IN (
      SELECT id FROM public.businesses WHERE is_public = TRUE AND is_active = TRUE
    )
  );
CREATE POLICY all_locations_owner ON public.locations
  FOR ALL USING (is_business_owner(locations.business_id));
  
-- ============================================================================
-- BUSINESS EMPLOYEES
-- ============================================================================
DROP POLICY IF EXISTS sel_business_employees_self ON public.business_employees;
DROP POLICY IF EXISTS ins_business_employees_self ON public.business_employees;
DROP POLICY IF EXISTS upd_business_employees_self ON public.business_employees;
DROP POLICY IF EXISTS del_business_employees_by_owner ON public.business_employees;

CREATE POLICY sel_business_employees_self ON public.business_employees
  FOR SELECT USING (
    auth.uid() = employee_id OR is_business_owner(business_id)
  );

CREATE POLICY ins_business_employees_self ON public.business_employees
  FOR INSERT WITH CHECK (
    auth.uid() = employee_id 
    OR auth.uid() IN (
      SELECT owner_id FROM public.businesses WHERE id = business_id
    )
  );

CREATE POLICY upd_business_employees_self ON public.business_employees
  FOR UPDATE USING (
    auth.uid() = employee_id 
    OR auth.uid() IN (
      SELECT owner_id FROM public.businesses WHERE id = business_id
    )
  )
  WITH CHECK (
    auth.uid() = employee_id 
    OR auth.uid() IN (
      SELECT owner_id FROM public.businesses WHERE id = business_id
    )
  );

CREATE POLICY del_business_employees_by_owner ON public.business_employees
  FOR DELETE USING (
    auth.uid() IN (
      SELECT owner_id FROM public.businesses WHERE id = business_id
    )
  );

-- ============================================================================
-- SERVICES
-- ============================================================================
DROP POLICY IF EXISTS sel_services ON public.services;
DROP POLICY IF EXISTS all_services_owner ON public.services;
CREATE POLICY sel_services ON public.services
  FOR SELECT USING (
    is_business_owner(services.business_id) OR is_business_member(services.business_id)
  );
CREATE POLICY all_services_owner ON public.services
  FOR ALL USING (is_business_owner(services.business_id));
DROP POLICY IF EXISTS all_services_admin ON public.services;
CREATE POLICY all_services_admin ON public.services
  FOR ALL USING (public.is_business_admin(services.business_id))
  WITH CHECK (public.is_business_admin(services.business_id));

-- ============================================================================
-- APPOINTMENTS
-- ============================================================================
DROP POLICY IF EXISTS all_appointments_owner ON public.appointments;
DROP POLICY IF EXISTS all_appointments_employee ON public.appointments;
DROP POLICY IF EXISTS all_appointments_client ON public.appointments;
CREATE POLICY all_appointments_owner ON public.appointments
  FOR ALL USING (
    auth.uid() IN (
      SELECT owner_id FROM public.businesses WHERE id = appointments.business_id
    )
  );
CREATE POLICY all_appointments_employee ON public.appointments
  FOR ALL USING (auth.uid() = employee_id);
CREATE POLICY all_appointments_client ON public.appointments
  FOR ALL USING (auth.uid() = client_id);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================
DROP POLICY IF EXISTS sel_notifications_self ON public.notifications;
DROP POLICY IF EXISTS upd_notifications_self ON public.notifications;
DROP POLICY IF EXISTS ins_notifications_system ON public.notifications;
CREATE POLICY sel_notifications_self ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY upd_notifications_self ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY ins_notifications_system ON public.notifications
  FOR INSERT WITH CHECK (TRUE);

-- ============================================================================
-- LOCATION_MEDIA
-- ============================================================================
ALTER TABLE public.location_media ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view location media" ON public.location_media;
DROP POLICY IF EXISTS "Location owners can insert media" ON public.location_media;
DROP POLICY IF EXISTS "Location owners can update their media" ON public.location_media;
DROP POLICY IF EXISTS "Location owners can delete their media" ON public.location_media;
DROP POLICY IF EXISTS "Members can insert location media" ON public.location_media;
DROP POLICY IF EXISTS "Members can update their location media" ON public.location_media;
DROP POLICY IF EXISTS "Members can delete their location media" ON public.location_media;
CREATE POLICY "Users can view location media" ON public.location_media
    FOR SELECT USING (true);
CREATE POLICY "Members can insert location media" ON public.location_media
    FOR INSERT WITH CHECK (
        public.can_manage_location_media(location_id)
    );
CREATE POLICY "Members can update their location media" ON public.location_media
    FOR UPDATE USING (
        public.can_manage_location_media(location_id)
    )
    WITH CHECK (
        public.can_manage_location_media(location_id)
    );
CREATE POLICY "Members can delete their location media" ON public.location_media
    FOR DELETE USING (
        public.can_manage_location_media(location_id)
    );

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

-- STORAGE: service-images
DROP POLICY IF EXISTS "Public read access for service images" ON storage.objects;
DROP POLICY IF EXISTS "Owners or members can upload service images" ON storage.objects;
DROP POLICY IF EXISTS "Owners or members can update service images" ON storage.objects;
DROP POLICY IF EXISTS "Owners or members can delete service images" ON storage.objects;

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

-- ============================================================================
-- STORAGE: location-images
-- ============================================================================
DROP POLICY IF EXISTS "Public read access for location images" ON storage.objects;
DROP POLICY IF EXISTS "Members can upload location images" ON storage.objects;
DROP POLICY IF EXISTS "Members can update location images" ON storage.objects;
DROP POLICY IF EXISTS "Members can delete location images" ON storage.objects;

CREATE POLICY "Public read access for location images"
ON storage.objects FOR SELECT
USING (bucket_id = 'location-images');

CREATE POLICY "Members can upload location images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'location-images'
  AND public.can_manage_location_media(((storage.foldername(storage.objects.name))[1])::uuid)
);

CREATE POLICY "Members can update location images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'location-images'
  AND public.can_manage_location_media(((storage.foldername(storage.objects.name))[1])::uuid)
)
WITH CHECK (
  bucket_id = 'location-images'
  AND public.can_manage_location_media(((storage.foldername(storage.objects.name))[1])::uuid)
);

CREATE POLICY "Members can delete location images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'location-images'
  AND public.can_manage_location_media(((storage.foldername(storage.objects.name))[1])::uuid)
);

-- ============================================================================
-- STORAGE: location-videos
-- ============================================================================
DROP POLICY IF EXISTS "Public read access for location videos" ON storage.objects;
DROP POLICY IF EXISTS "Members can upload location videos" ON storage.objects;
DROP POLICY IF EXISTS "Members can update location videos" ON storage.objects;
DROP POLICY IF EXISTS "Members can delete location videos" ON storage.objects;

CREATE POLICY "Public read access for location videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'location-videos');

CREATE POLICY "Members can upload location videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'location-videos'
  AND public.can_manage_location_media(((storage.foldername(storage.objects.name))[1])::uuid)
);

CREATE POLICY "Members can update location videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'location-videos'
  AND public.can_manage_location_media(((storage.foldername(storage.objects.name))[1])::uuid)
)
WITH CHECK (
  bucket_id = 'location-videos'
  AND public.can_manage_location_media(((storage.foldername(storage.objects.name))[1])::uuid)
);

CREATE POLICY "Members can delete location videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'location-videos'
  AND public.can_manage_location_media(((storage.foldername(storage.objects.name))[1])::uuid)
);

-- ============================================================================
-- STORAGE: business-logos
--  - Path esperado: {business_id}/{filename}
--  - Permitir lectura pública y escritura a dueños o administradores del negocio
-- ============================================================================
DROP POLICY IF EXISTS "Public read access for business logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload business logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update business logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete business logos" ON storage.objects;

CREATE POLICY "Public read access for business logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'business-logos');

CREATE POLICY "Admins can upload business logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'business-logos'
  AND public.is_business_admin(((storage.foldername(storage.objects.name))[1])::uuid)
);

CREATE POLICY "Admins can update business logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'business-logos'
  AND public.is_business_admin(((storage.foldername(storage.objects.name))[1])::uuid)
)
WITH CHECK (
  bucket_id = 'business-logos'
  AND public.is_business_admin(((storage.foldername(storage.objects.name))[1])::uuid)
);

CREATE POLICY "Admins can delete business logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'business-logos'
  AND public.is_business_admin(((storage.foldername(storage.objects.name))[1])::uuid)
);

-- ============================================================================
-- STORAGE: user-avatars
--  - Path esperado: {user_id}/{filename}
--  - Permitir lectura pública y escritura solo al propio usuario
-- ============================================================================
DROP POLICY IF EXISTS "Public read access to user avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

CREATE POLICY "Public read access to user avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-avatars');

CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-avatars'
  AND (storage.foldername(storage.objects.name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-avatars'
  AND (storage.foldername(storage.objects.name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'user-avatars'
  AND (storage.foldername(storage.objects.name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-avatars'
  AND (storage.foldername(storage.objects.name))[1] = auth.uid()::text
);

-- ============================================================================
-- EMPLOYEE_SERVICES
-- ============================================================================
ALTER TABLE public.employee_services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sel_employee_services ON public.employee_services;
DROP POLICY IF EXISTS ins_employee_services_admin ON public.employee_services;
DROP POLICY IF EXISTS upd_employee_services_admin ON public.employee_services;
DROP POLICY IF EXISTS del_employee_services_admin ON public.employee_services;

CREATE POLICY sel_employee_services ON public.employee_services
  FOR SELECT USING (
    public.is_business_admin(employee_services.business_id)
    OR auth.uid() = employee_services.employee_id
  );

CREATE POLICY ins_employee_services_admin ON public.employee_services
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_business_admin(employee_services.business_id));

CREATE POLICY upd_employee_services_admin ON public.employee_services
  FOR UPDATE
  TO authenticated
  USING (public.is_business_admin(employee_services.business_id))
  WITH CHECK (public.is_business_admin(employee_services.business_id));

CREATE POLICY del_employee_services_admin ON public.employee_services
  FOR DELETE
  TO authenticated
  USING (public.is_business_admin(employee_services.business_id));

-- Permitir que empleados aprobados gestionen sus propias asignaciones
DROP POLICY IF EXISTS ins_employee_services_self ON public.employee_services;
DROP POLICY IF EXISTS upd_employee_services_self ON public.employee_services;
DROP POLICY IF EXISTS del_employee_services_self ON public.employee_services;

CREATE POLICY ins_employee_services_self ON public.employee_services
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = employee_services.employee_id
    AND public.is_business_member(employee_services.business_id)
  );

CREATE POLICY upd_employee_services_self ON public.employee_services
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = employee_services.employee_id
    AND public.is_business_member(employee_services.business_id)
  )
  WITH CHECK (
    auth.uid() = employee_services.employee_id
    AND public.is_business_member(employee_services.business_id)
  );

CREATE POLICY del_employee_services_self ON public.employee_services
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = employee_services.employee_id
    AND public.is_business_member(employee_services.business_id)
  );
