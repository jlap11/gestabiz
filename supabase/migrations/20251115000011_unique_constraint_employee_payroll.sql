-- Migration: Add unique constraint for employee payroll UPSERT
-- Fecha: 2025-11-15
-- Fase: 2 - Sistema de Nómina
-- Propósito: Crear constraint único para permitir UPSERT de nómina por (business_id, employee_id, category)

-- DROP índices parciales previos si existen
DROP INDEX IF EXISTS idx_recurring_expenses_employee_category;
DROP INDEX IF EXISTS idx_recurring_expenses_employee_payroll_upsert;
-- Crear UNIQUE CONSTRAINT completo
-- NULLS NOT DISTINCT: permite múltiples NULL employee_id, pero solo un payroll por employee_id no NULL
ALTER TABLE recurring_expenses
ADD CONSTRAINT uq_recurring_expenses_employee_payroll
UNIQUE NULLS NOT DISTINCT (business_id, employee_id, category);
-- Comentario
COMMENT ON CONSTRAINT uq_recurring_expenses_employee_payroll ON recurring_expenses IS 'Unique constraint para UPSERT de nómina: un solo registro por (business_id, employee_id, category). Creado en migración 20251115000011.';
