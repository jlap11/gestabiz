-- Add completed_at column to appointments table
-- This column stores the exact timestamp when an appointment was marked as completed

ALTER TABLE appointments 
ADD COLUMN completed_at TIMESTAMPTZ;

-- Create index for better query performance on completed appointments
CREATE INDEX idx_appointments_completed_at ON appointments(completed_at);

-- Add comment for documentation
COMMENT ON COLUMN appointments.completed_at IS 'Timestamp when the appointment was marked as completed';

-- Create trigger to auto-set completed_at when status changes to completed
CREATE OR REPLACE FUNCTION set_appointment_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Set completed_at when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    NEW.completed_at = NOW();
  END IF;
  
  -- Clear completed_at if status changes from 'completed' to something else
  IF NEW.status != 'completed' AND OLD.status = 'completed' THEN
    NEW.completed_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_appointment_completed_at
  BEFORE INSERT OR UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION set_appointment_completed_at();

-- Migrate existing completed appointments
UPDATE appointments 
SET completed_at = updated_at 
WHERE status = 'completed' AND completed_at IS NULL;
