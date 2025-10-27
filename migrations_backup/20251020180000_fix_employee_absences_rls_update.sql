-- Migration: Fix RLS policies for employee_absences UPDATE operations
-- Issue: Error 42501 when trying to update/cancel absence requests
-- Reason: UPDATE policies were missing with_check clause
-- Date: 2025-10-20

-- Drop existing incomplete UPDATE policy
DROP POLICY IF EXISTS "Employees can update their pending absences" ON employee_absences;

-- Recreate with proper WITH CHECK clause for UPDATE
-- This allows employees to update THEIR OWN pending absences to 'cancelled' status
CREATE POLICY "Employees can update their pending absences"
  ON employee_absences
  FOR UPDATE
  USING (
    -- SELECT check: employee owns this absence AND it's pending
    employee_id = auth.uid() AND status = 'pending'
  )
  WITH CHECK (
    -- UPDATE check: employee owns this absence (can update any field)
    employee_id = auth.uid()
  );

-- Also add an explicit UPDATE policy for admins to update absence status
DROP POLICY IF EXISTS "Admins can update absence status" ON employee_absences;

CREATE POLICY "Admins can update absence status"
  ON employee_absences
  FOR UPDATE
  USING (
    -- SELECT check: user is admin of this business
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = employee_absences.business_id
        AND b.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    -- UPDATE check: user is admin of this business
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = employee_absences.business_id
        AND b.owner_id = auth.uid()
    )
  );

-- Add INSERT policy explicitly for admins (if needed in future)
DROP POLICY IF EXISTS "Admins can create absences" ON employee_absences;

CREATE POLICY "Admins can create absences"
  ON employee_absences
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = business_id
        AND b.owner_id = auth.uid()
    )
  );

-- Summary of RLS policies after fix:
-- 1. Employees can CREATE: insert with employee_id = auth.uid()
-- 2. Employees can READ OWN: select where employee_id = auth.uid()
-- 3. Employees can UPDATE OWN PENDING: update where employee_id = auth.uid() AND status = 'pending'
-- 4. Admins can READ: select all absences in their business
-- 5. Admins can UPDATE: update any absence in their business
-- 6. Admins can CREATE: insert absences for their business
