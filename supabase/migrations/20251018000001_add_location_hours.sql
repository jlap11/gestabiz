-- Add opens_at and closes_at columns to locations table
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS opens_at TIME,
ADD COLUMN IF NOT EXISTS closes_at TIME;

-- Set default values (9 AM to 6 PM)
UPDATE locations 
SET opens_at = '09:00:00'::TIME,
    closes_at = '18:00:00'::TIME
WHERE opens_at IS NULL OR closes_at IS NULL;

-- Add comment explaining the columns
COMMENT ON COLUMN locations.opens_at IS 'Opening time for the location (default business hours)';
COMMENT ON COLUMN locations.closes_at IS 'Closing time for the location (default business hours)';
