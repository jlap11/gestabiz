-- =====================================================================
-- FIX: Agregar políticas RLS faltantes en sistema de ausencias/vacaciones
-- =====================================================================
-- Problema: Los triggers intentan insertar/actualizar pero RLS lo bloquea
-- Solución: Agregar políticas INSERT y UPDATE necesarias
-- Aplicado: 20 de Octubre de 2025

-- =====================================================================
-- 1. TABLA: vacation_balance
-- =====================================================================

-- Permitir al sistema (triggers/functions) insertar en vacation_balance
CREATE POLICY "System can insert vacation balances"
ON vacation_balance FOR INSERT
WITH CHECK (true);

-- Permitir a admins actualizar balances de vacaciones
CREATE POLICY "Admins can update vacation balances"
ON vacation_balance FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = business_id AND b.owner_id = auth.uid()
  )
);

-- =====================================================================
-- 2. TABLA: employee_absences
-- =====================================================================

-- Permitir a empleados actualizar sus solicitudes pendientes
CREATE POLICY "Employees can update their pending absences"
ON employee_absences FOR UPDATE
USING (employee_id = auth.uid() AND status = 'pending');

-- =====================================================================
-- 3. TABLA: absence_approval_requests
-- =====================================================================

-- Permitir a admins actualizar solicitudes de aprobación
CREATE POLICY "Admins can update approval requests"
ON absence_approval_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = business_id AND b.owner_id = auth.uid()
  )
);
