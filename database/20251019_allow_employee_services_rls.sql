-- Migration: allow employee_services access for employees and business owners
-- Allows employees (auth.uid() == employee_id) and business owners to SELECT/INSERT/UPDATE/DELETE

ALTER TABLE public.employee_services ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS sel_employee_services ON public.employee_services;
DROP POLICY IF EXISTS ins_employee_services ON public.employee_services;
DROP POLICY IF EXISTS upd_employee_services ON public.employee_services;
DROP POLICY IF EXISTS del_employee_services ON public.employee_services;

-- Allow select for business owners and the employee themselves
CREATE POLICY sel_employee_services ON public.employee_services
  FOR SELECT USING (
    (auth.uid() = employee_id) OR
    (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = employee_services.business_id AND b.owner_id = auth.uid()))
  );

-- Allow insert if the employee_id equals current user OR the user is the business owner
CREATE POLICY ins_employee_services ON public.employee_services
  FOR INSERT WITH CHECK (
    (auth.uid() = employee_id) OR
    (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = employee_services.business_id AND b.owner_id = auth.uid()))
  );

-- Allow update if the employee_id equals current user OR the user is the business owner
CREATE POLICY upd_employee_services ON public.employee_services
  FOR UPDATE USING (
    (auth.uid() = employee_id) OR
    (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = employee_services.business_id AND b.owner_id = auth.uid()))
  ) WITH CHECK (
    (auth.uid() = employee_id) OR
    (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = employee_services.business_id AND b.owner_id = auth.uid()))
  );

-- Allow delete if the employee_id equals current user OR the user is the business owner
CREATE POLICY del_employee_services ON public.employee_services
  FOR DELETE USING (
    (auth.uid() = employee_id) OR
    (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = employee_services.business_id AND b.owner_id = auth.uid()))
  );
