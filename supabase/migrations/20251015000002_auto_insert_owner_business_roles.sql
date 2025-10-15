-- Migration: Auto-insert owner into business_roles when creating business
-- Date: 2025-10-15
-- Description: Creates a trigger to automatically insert the business owner 
--              into business_roles table when a new business is created.

-- Trigger function
CREATE OR REPLACE FUNCTION auto_insert_owner_to_business_roles()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert owner into business_roles as admin
  INSERT INTO business_roles (
    business_id,
    user_id,
    role,
    hierarchy_level,
    reports_to,
    assigned_by,
    is_active,
    assigned_at,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.owner_id,
    'admin',
    1,
    NULL,
    NEW.owner_id,
    true,
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_insert_owner_to_business_roles ON businesses;
CREATE TRIGGER trigger_auto_insert_owner_to_business_roles
  AFTER INSERT ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION auto_insert_owner_to_business_roles();

-- Backfill existing businesses (insert owners that are missing in business_roles)
INSERT INTO business_roles (
  business_id,
  user_id,
  role,
  hierarchy_level,
  reports_to,
  assigned_by,
  is_active,
  assigned_at,
  created_at,
  updated_at
)
SELECT 
  b.id as business_id,
  b.owner_id as user_id,
  'admin' as role,
  1 as hierarchy_level,
  NULL as reports_to,
  b.owner_id as assigned_by,
  true as is_active,
  NOW() as assigned_at,
  NOW() as created_at,
  NOW() as updated_at
FROM businesses b
LEFT JOIN business_roles br ON br.business_id = b.id AND br.user_id = b.owner_id
WHERE br.id IS NULL  -- Only insert if not already present
ON CONFLICT DO NOTHING;
