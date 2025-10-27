-- Add lunch break time fields to business_employees table
ALTER TABLE business_employees 
ADD COLUMN IF NOT EXISTS lunch_break_start TIME DEFAULT '12:00:00'::TIME,
ADD COLUMN IF NOT EXISTS lunch_break_end TIME DEFAULT '13:00:00'::TIME,
ADD COLUMN IF NOT EXISTS has_lunch_break BOOLEAN DEFAULT true;

-- Add comments explaining the columns
COMMENT ON COLUMN business_employees.lunch_break_start IS 'Hora de inicio del almuerzo (formato 24h)';
COMMENT ON COLUMN business_employees.lunch_break_end IS 'Hora de fin del almuerzo (formato 24h)';
COMMENT ON COLUMN business_employees.has_lunch_break IS 'Indica si el empleado tiene hora de almuerzo configurada';

-- Update existing records to have a default lunch break (12:00 - 13:00)
UPDATE business_employees 
SET lunch_break_start = '12:00:00'::TIME,
    lunch_break_end = '13:00:00'::TIME,
    has_lunch_break = true
WHERE lunch_break_start IS NULL OR lunch_break_end IS NULL;
