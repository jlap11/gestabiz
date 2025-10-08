-- ============================================================================
-- FIX: Políticas RLS para business_employees (Permitir a clientes ver empleados)
-- ============================================================================
-- Problema: Los clientes no pueden ver los empleados disponibles al crear citas
-- Solución: Permitir lectura pública de asignaciones aprobadas y activas
-- ============================================================================

-- Eliminar políticas restrictivas existentes
DROP POLICY IF EXISTS sel_business_employees_self ON public.business_employees;
DROP POLICY IF EXISTS ins_business_employees_self ON public.business_employees;
DROP POLICY IF EXISTS insert_business_employees ON public.business_employees;
DROP POLICY IF EXISTS update_business_employees ON public.business_employees;
DROP POLICY IF EXISTS delete_business_employees ON public.business_employees;

-- ============================================================================
-- POLÍTICA 1: Todos pueden VER asignaciones aprobadas y activas (SELECT)
-- ============================================================================
CREATE POLICY sel_business_employees ON public.business_employees
  FOR SELECT 
  USING (status = 'approved' AND is_active = true);

-- ============================================================================
-- POLÍTICA 2: Solo el dueño del negocio puede INSERTAR asignaciones
-- ============================================================================
CREATE POLICY insert_business_employees ON public.business_employees
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_id
      AND b.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- POLÍTICA 3: Solo el dueño del negocio puede ACTUALIZAR asignaciones
-- ============================================================================
CREATE POLICY update_business_employees ON public.business_employees
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_id
      AND b.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- POLÍTICA 4: Solo el dueño del negocio puede ELIMINAR asignaciones
-- ============================================================================
CREATE POLICY delete_business_employees ON public.business_employees
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_id
      AND b.owner_id = auth.uid()
    )
  );
