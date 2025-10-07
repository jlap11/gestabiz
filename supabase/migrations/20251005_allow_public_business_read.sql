-- Migración: Permitir lectura pública de negocios activos
-- Fecha: 2025-10-05
-- Propósito: Permitir que usuarios no autenticados puedan ver la lista de negocios
--            activos para poder seleccionarlos al crear una cita

-- Eliminar política restrictiva actual
DROP POLICY IF EXISTS sel_businesses ON public.businesses;

-- Crear nueva política que permite:
-- 1. Lectura pública de negocios activos (para el wizard de citas)
-- 2. Acceso completo a owners y miembros del negocio
CREATE POLICY "sel_businesses" ON public.businesses
  FOR SELECT USING (
    -- Permitir lectura pública SOLO de negocios activos
    is_active = true
    OR 
    -- O si el usuario es owner o miembro del negocio
    (auth.uid() IS NOT NULL AND (is_business_owner(id) OR is_business_member(id)))
  );

-- Nota: Las políticas de INSERT, UPDATE, DELETE permanecen sin cambios
-- Solo los owners pueden modificar/eliminar sus negocios
