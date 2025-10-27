-- ============================================================================
-- MIGRACIÓN: Corregir políticas RLS para business_employees
-- Fecha: 21 de octubre, 2025
-- Descripción: Permitir que el propietario del negocio pueda insertar empleados
--              (necesario para triggers de auto-inserción)
-- ============================================================================

-- Actualizar políticas RLS para business_employees
-- Permitir INSERT: 
-- 1. El usuario insertando su propio registro (auth.uid() = employee_id)
-- 2. El propietario del negocio insertando registros para su negocio

DROP POLICY IF EXISTS ins_business_employees_self ON public.business_employees;
DROP POLICY IF EXISTS ins_business_employees_by_owner ON public.business_employees;

CREATE POLICY ins_business_employees_self ON public.business_employees
  FOR INSERT WITH CHECK (
    auth.uid() = employee_id 
    OR auth.uid() IN (
      SELECT owner_id FROM public.businesses WHERE id = business_id
    )
  );

-- Permitir UPDATE: solo para el empleado o el propietario del negocio
DROP POLICY IF EXISTS upd_business_employees_self ON public.business_employees;
DROP POLICY IF EXISTS upd_business_employees_by_owner ON public.business_employees;

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

-- Permitir DELETE: solo el propietario del negocio
DROP POLICY IF EXISTS del_business_employees_by_owner ON public.business_employees;

CREATE POLICY del_business_employees_by_owner ON public.business_employees
  FOR DELETE USING (
    auth.uid() IN (
      SELECT owner_id FROM public.businesses WHERE id = business_id
    )
  );
