-- Migration: Employee Requests and Business Invitation Codes
-- Date: 2025-10-11
-- Description: Adds employee request system with invitation codes and QR support

-- =====================================================
-- 1. Add new columns to businesses table
-- =====================================================

-- Invitation code for employees to join (6 alphanumeric characters, unique)
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS invitation_code VARCHAR(6) UNIQUE;

-- Track last activity for inactivity rules
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT NOW();

-- Track when business got its first client
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS first_client_at TIMESTAMPTZ;

-- Active status (for 30-day inactivity rule)
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create index for invitation code lookups
CREATE INDEX IF NOT EXISTS idx_businesses_invitation_code 
ON businesses(invitation_code) 
WHERE invitation_code IS NOT NULL;

-- =====================================================
-- 2. Create employee_requests table
-- =====================================================

CREATE TABLE IF NOT EXISTS employee_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Business that user wants to join
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- User requesting to become employee
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- The invitation code used to request access
  invitation_code VARCHAR(6) NOT NULL,
  
  -- Request status: 'pending', 'approved', 'rejected'
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  
  -- Admin who responded (approved/rejected)
  responded_by UUID REFERENCES profiles(id),
  
  -- Additional info from requester
  message TEXT,
  
  -- Prevent duplicate requests
  UNIQUE(business_id, user_id, status)
);

-- Indexes for employee_requests
CREATE INDEX idx_employee_requests_business_id ON employee_requests(business_id);
CREATE INDEX idx_employee_requests_user_id ON employee_requests(user_id);
CREATE INDEX idx_employee_requests_status ON employee_requests(status);
CREATE INDEX idx_employee_requests_created_at ON employee_requests(created_at DESC);

-- =====================================================
-- 3. Function to generate unique invitation codes
-- =====================================================

CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS VARCHAR(6) AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Exclude similar chars: I,O,0,1
  result VARCHAR(6) := '';
  i INTEGER;
  code_exists BOOLEAN;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
    END LOOP;
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM businesses WHERE invitation_code = result) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- =====================================================
-- 4. Trigger to auto-generate invitation codes
-- =====================================================

CREATE OR REPLACE FUNCTION auto_generate_invitation_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invitation_code IS NULL THEN
    NEW.invitation_code := generate_invitation_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_invitation_code
BEFORE INSERT ON businesses
FOR EACH ROW
EXECUTE FUNCTION auto_generate_invitation_code();

-- Generate codes for existing businesses
UPDATE businesses 
SET invitation_code = generate_invitation_code() 
WHERE invitation_code IS NULL;

-- =====================================================
-- 5. Function to update last_activity_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_business_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE businesses 
  SET last_activity_at = NOW() 
  WHERE id = NEW.business_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on appointments to track activity
CREATE TRIGGER trigger_update_business_activity_on_appointment
AFTER INSERT OR UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION update_business_activity();

-- =====================================================
-- 6. Function to track first client
-- =====================================================

CREATE OR REPLACE FUNCTION track_first_client()
RETURNS TRIGGER AS $$
BEGIN
  -- Update first_client_at if this is the first client appointment
  UPDATE businesses 
  SET first_client_at = NOW() 
  WHERE id = NEW.business_id 
    AND first_client_at IS NULL
    AND NEW.status IN ('confirmed', 'completed');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_track_first_client
AFTER INSERT OR UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION track_first_client();

-- =====================================================
-- 7. RLS Policies for employee_requests
-- =====================================================

-- Enable RLS
ALTER TABLE employee_requests ENABLE ROW LEVEL SECURITY;

-- Users can create their own requests
CREATE POLICY "Users can create employee requests"
ON employee_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own requests
CREATE POLICY "Users can view own requests"
ON employee_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Business owners can view requests for their businesses
CREATE POLICY "Business owners can view requests for their businesses"
ON employee_requests
FOR SELECT
TO authenticated
USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);

-- Business owners can update (approve/reject) requests
CREATE POLICY "Business owners can respond to requests"
ON employee_requests
FOR UPDATE
TO authenticated
USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);

-- =====================================================
-- 8. Function to approve employee request
-- =====================================================

CREATE OR REPLACE FUNCTION approve_employee_request(
  request_id UUID,
  admin_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_business_id UUID;
  v_user_id UUID;
  v_status TEXT;
  result JSONB;
BEGIN
  -- Get request details
  SELECT business_id, user_id, status 
  INTO v_business_id, v_user_id, v_status
  FROM employee_requests 
  WHERE id = request_id;

  -- Check if request exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found');
  END IF;

  -- Check if already responded
  IF v_status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request already responded');
  END IF;

  -- Check if admin owns the business
  IF NOT EXISTS(SELECT 1 FROM businesses WHERE id = v_business_id AND owner_id = admin_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  -- Update request status
  UPDATE employee_requests 
  SET 
    status = 'approved',
    responded_at = NOW(),
    responded_by = admin_id
  WHERE id = request_id;

  -- Add user to business_employees
  INSERT INTO business_employees (business_id, employee_id, role)
  VALUES (v_business_id, v_user_id, 'employee')
  ON CONFLICT (business_id, employee_id) DO NOTHING;

  RETURN jsonb_build_object('success', true, 'message', 'Employee request approved');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. Function to reject employee request
-- =====================================================

CREATE OR REPLACE FUNCTION reject_employee_request(
  request_id UUID,
  admin_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_business_id UUID;
  v_status TEXT;
BEGIN
  -- Get request details
  SELECT business_id, status 
  INTO v_business_id, v_status
  FROM employee_requests 
  WHERE id = request_id;

  -- Check if request exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found');
  END IF;

  -- Check if already responded
  IF v_status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request already responded');
  END IF;

  -- Check if admin owns the business
  IF NOT EXISTS(SELECT 1 FROM businesses WHERE id = v_business_id AND owner_id = admin_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  -- Update request status
  UPDATE employee_requests 
  SET 
    status = 'rejected',
    responded_at = NOW(),
    responded_by = admin_id
  WHERE id = request_id;

  RETURN jsonb_build_object('success', true, 'message', 'Employee request rejected');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. Comments for documentation
-- =====================================================

COMMENT ON TABLE employee_requests IS 'Stores employee join requests via invitation codes';
COMMENT ON COLUMN businesses.invitation_code IS 'Unique 6-character code for employees to join';
COMMENT ON COLUMN businesses.last_activity_at IS 'Last time business had any activity (for 30-day inactivity rule)';
COMMENT ON COLUMN businesses.first_client_at IS 'When business got its first client (for 1-year deletion rule)';
COMMENT ON COLUMN businesses.is_active IS 'Whether business is active (auto-deactivated after 30 days of inactivity)';
