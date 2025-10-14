-- Add is_primary column to locations table
ALTER TABLE locations ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;

-- Add comment to explain the column
COMMENT ON COLUMN locations.is_primary IS 'Indica si esta es la sede principal del negocio. Solo puede haber una sede principal por negocio.';

-- Create index for faster queries filtering by primary location
CREATE INDEX IF NOT EXISTS idx_locations_is_primary ON locations(business_id, is_primary) WHERE is_primary = true;

-- Create a function to ensure only one primary location per business
CREATE OR REPLACE FUNCTION ensure_single_primary_location()
RETURNS TRIGGER AS $$
BEGIN
  -- If the new/updated location is being set as primary
  IF NEW.is_primary = true THEN
    -- Unset any other primary locations for this business
    UPDATE locations
    SET is_primary = false
    WHERE business_id = NEW.business_id
      AND id != NEW.id
      AND is_primary = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce single primary location
DROP TRIGGER IF EXISTS trigger_ensure_single_primary_location ON locations;
CREATE TRIGGER trigger_ensure_single_primary_location
  BEFORE INSERT OR UPDATE OF is_primary
  ON locations
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_primary_location();

-- Optional: Set the first active location as primary for businesses that don't have one
DO $$
DECLARE
  business_record RECORD;
  first_location_id UUID;
BEGIN
  -- For each business that doesn't have a primary location
  FOR business_record IN 
    SELECT DISTINCT b.id 
    FROM businesses b
    WHERE NOT EXISTS (
      SELECT 1 FROM locations l 
      WHERE l.business_id = b.id AND l.is_primary = true
    )
  LOOP
    -- Get the first active location for this business
    SELECT l.id INTO first_location_id
    FROM locations l
    WHERE l.business_id = business_record.id
      AND l.is_active = true
    ORDER BY l.created_at ASC
    LIMIT 1;
    
    -- If found, set it as primary
    IF first_location_id IS NOT NULL THEN
      UPDATE locations
      SET is_primary = true
      WHERE id = first_location_id;
    END IF;
  END LOOP;
END $$;
