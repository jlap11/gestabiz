-- Migration: Add allow_client_messages to business_employees
-- Purpose: Allow employees to control whether they receive messages from clients
-- Author: Gestabiz Team
-- Date: 2025-10-19

-- Add column to business_employees
ALTER TABLE business_employees
ADD COLUMN IF NOT EXISTS allow_client_messages BOOLEAN DEFAULT true;

-- Add comment
COMMENT ON COLUMN business_employees.allow_client_messages IS 
  'Whether the employee accepts messages from clients. Default true for backward compatibility.';

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_business_employees_allow_client_messages 
  ON business_employees(allow_client_messages) 
  WHERE is_active = true;

-- Update existing records to true (backward compatibility)
UPDATE business_employees 
SET allow_client_messages = true 
WHERE allow_client_messages IS NULL;
