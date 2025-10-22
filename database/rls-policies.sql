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
DROP POLICY IF EXISTS ins_businesses ON public.businesses;
DROP POLICY IF EXISTS upd_businesses ON public.businesses;
DROP POLICY IF EXISTS del_businesses ON public.businesses;
CREATE POLICY sel_businesses ON public.businesses
  FOR SELECT USING (
    is_business_owner(id) OR is_business_member(id)
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
DROP POLICY IF EXISTS all_locations_owner ON public.locations;
CREATE POLICY sel_locations ON public.locations
  FOR SELECT USING (
    is_business_owner(locations.business_id) OR is_business_member(locations.business_id)
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
