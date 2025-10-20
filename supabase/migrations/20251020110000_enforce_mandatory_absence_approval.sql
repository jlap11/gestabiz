/**
 * Migration: Set require_absence_approval to true for all businesses
 * 
 * Purpose: Enforce mandatory approval for all absences/vacations
 * Requirement: Employees cannot take vacations without prior authorization
 * 
 * Date: 2025-10-20
 */

-- Update all businesses to require absence approval (mandatory)
UPDATE businesses 
SET require_absence_approval = true
WHERE require_absence_approval = false OR require_absence_approval IS NULL;

-- Verify update
-- SELECT id, name, require_absence_approval FROM businesses ORDER BY created_at DESC;
