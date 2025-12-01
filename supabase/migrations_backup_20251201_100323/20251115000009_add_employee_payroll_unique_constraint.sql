-- Migration: Add unique constraint for employee payroll expenses
-- Fecha: 2025-11-15
-- Fase: 2 - Sistema de Nómina
-- Propósito: Permitir UPSERT en recurring_expenses por (business_id, employee_id, category)

-- Crear constraint único para employee_id + category cuando employee_id no es NULL
-- Solo permite un registro de nómina (payroll) por empleado por negocio
CREATE UNIQUE INDEX IF NOT EXISTS idx_recurring_expenses_employee_category
ON recurring_expenses (business_id, employee_id, category)
WHERE employee_id IS NOT NULL AND category = 'payroll';
-- Comentario
COMMENT ON INDEX idx_recurring_expenses_employee_category IS 'Unique constraint para UPSERT de nómina: un solo registro payroll por empleado por negocio. Creado en migración 20251115000009.';
