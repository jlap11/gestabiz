-- Migration: Add hire_date to business_employees table
-- Date: 2025-01-14
-- Description: Adds hire_date field to track when an employee was hired

-- Add hire_date column
ALTER TABLE business_employees
ADD COLUMN IF NOT EXISTS hire_date DATE DEFAULT CURRENT_DATE;

-- Add comment for documentation
COMMENT ON COLUMN business_employees.hire_date IS 'Date when the employee was hired by the business';

-- Update existing records to use created_at date
UPDATE business_employees
SET hire_date = created_at::DATE
WHERE hire_date IS NULL;

-- Verify the column was added
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'business_employees'
AND column_name = 'hire_date';
