-- Migration: Add appointment confirmation fields and business confirmation policies
-- Created: 2025-01-27

-- 0. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- 0.1. Fix existing function that uses uuid_generate_v4()
CREATE OR REPLACE FUNCTION check_appointment_conflict()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for employee conflicts (if employee is assigned)
    IF NEW.employee_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.appointments 
        WHERE employee_id = NEW.employee_id 
        AND id != COALESCE(NEW.id, (md5(random()::text || clock_timestamp()::text))::uuid)
        AND status NOT IN ('cancelled', 'no_show')
        AND (
            (NEW.start_time >= start_time AND NEW.start_time < end_time) OR
            (NEW.end_time > start_time AND NEW.end_time <= end_time) OR
            (NEW.start_time <= start_time AND NEW.end_time >= end_time)
        )
    ) THEN
        RAISE EXCEPTION 'Employee has a conflicting appointment at this time';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- 1. Update appointment_status enum to include 'in_progress'
ALTER TYPE appointment_status ADD VALUE IF NOT EXISTS 'in_progress';
-- 2. Add confirmation fields to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS confirmed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS confirmation_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS confirmation_deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS confirmation_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS auto_no_show_at TIMESTAMPTZ;
-- 3. Create business_confirmation_policies table
CREATE TABLE IF NOT EXISTS business_confirmation_policies (
    id UUID PRIMARY KEY DEFAULT (md5(random()::text || clock_timestamp()::text))::uuid,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    
    -- Confirmation method: 'email', 'payment', 'both'
    confirmation_method TEXT NOT NULL DEFAULT 'email' CHECK (confirmation_method IN ('email', 'payment', 'both')),
    
    -- Email confirmation settings
    email_enabled BOOLEAN DEFAULT TRUE,
    email_hours_before INTEGER DEFAULT 24 CHECK (email_hours_before >= 0),
    email_template_subject TEXT DEFAULT 'Confirma tu cita - {{business_name}}',
    email_template_body TEXT DEFAULT 'Hola {{client_name}}, tienes una cita programada para {{appointment_date}} a las {{appointment_time}}. Por favor confirma tu asistencia.',
    
    -- Payment confirmation settings
    payment_enabled BOOLEAN DEFAULT FALSE,
    payment_percentage DECIMAL(5,2) DEFAULT 0.00 CHECK (payment_percentage >= 0 AND payment_percentage <= 100),
    payment_hours_before INTEGER DEFAULT 24 CHECK (payment_hours_before >= 0),
    
    -- Auto no-show settings
    auto_no_show_enabled BOOLEAN DEFAULT TRUE,
    auto_no_show_minutes_after INTEGER DEFAULT 10 CHECK (auto_no_show_minutes_after >= 0),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one policy per business
    UNIQUE(business_id)
);
-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointments_confirmed ON appointments(confirmed);
CREATE INDEX IF NOT EXISTS idx_appointments_confirmation_token ON appointments(confirmation_token) WHERE confirmation_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_confirmation_deadline ON appointments(confirmation_deadline) WHERE confirmation_deadline IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_auto_no_show_at ON appointments(auto_no_show_at) WHERE auto_no_show_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_business_confirmation_policies_business_id ON business_confirmation_policies(business_id);
-- 5. Add RLS policies for business_confirmation_policies
ALTER TABLE business_confirmation_policies ENABLE ROW LEVEL SECURITY;
-- Policy: Business owners and admins can manage their confirmation policies
CREATE POLICY "business_confirmation_policies_business_access" ON business_confirmation_policies
    FOR ALL USING (
        business_id IN (
            SELECT business_id 
            FROM business_employees 
            WHERE employee_id = auth.uid() 
            AND role IN ('manager')
            AND status = 'approved'
        )
    );
-- Policy: Business members can read confirmation policies
CREATE POLICY "business_confirmation_policies_member_read" ON business_confirmation_policies
    FOR SELECT USING (
        business_id IN (
            SELECT business_id 
            FROM business_employees 
            WHERE employee_id = auth.uid() 
            AND status = 'approved'
        )
    );
-- 6. Create function to generate secure confirmation tokens
CREATE OR REPLACE FUNCTION generate_confirmation_token()
RETURNS TEXT AS $$
BEGIN
    RETURN md5(random()::text || clock_timestamp()::text || random()::text) || md5(random()::text || clock_timestamp()::text);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 7. Create function to set confirmation deadline based on business policy
CREATE OR REPLACE FUNCTION set_appointment_confirmation_deadline(appointment_id UUID)
RETURNS VOID AS $$
DECLARE
    appointment_record appointments%ROWTYPE;
    policy_record business_confirmation_policies%ROWTYPE;
    deadline_hours INTEGER;
BEGIN
    -- Get appointment details
    SELECT * INTO appointment_record FROM appointments WHERE id = appointment_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Appointment not found';
    END IF;
    
    -- Get business confirmation policy
    SELECT * INTO policy_record 
    FROM business_confirmation_policies 
    WHERE business_id = appointment_record.business_id;
    
    -- If no policy exists, use default 24 hours
    IF NOT FOUND THEN
        deadline_hours := 24;
    ELSE
        -- Use the appropriate hours based on confirmation method
        IF policy_record.confirmation_method = 'payment' THEN
            deadline_hours := policy_record.payment_hours_before;
        ELSE
            deadline_hours := policy_record.email_hours_before;
        END IF;
    END IF;
    
    -- Update appointment with confirmation deadline and token
    UPDATE appointments 
    SET 
        confirmation_deadline = appointment_record.start_time - (deadline_hours || ' hours')::INTERVAL,
        confirmation_token = generate_confirmation_token(),
        auto_no_show_at = appointment_record.start_time + (
            COALESCE(policy_record.auto_no_show_minutes_after, 10) || ' minutes'
        )::INTERVAL
    WHERE id = appointment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 8. Create trigger to automatically set confirmation deadline for new appointments
CREATE OR REPLACE FUNCTION trigger_set_confirmation_deadline()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set for new appointments in 'pending' status
    IF NEW.status = 'pending' AND OLD IS NULL THEN
        PERFORM set_appointment_confirmation_deadline(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER appointments_set_confirmation_deadline
    AFTER INSERT ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_confirmation_deadline();
-- 9. Create function to confirm appointment via token
CREATE OR REPLACE FUNCTION confirm_appointment_by_token(token TEXT)
RETURNS JSON AS $$
DECLARE
    appointment_record appointments%ROWTYPE;
    result JSON;
BEGIN
    -- Find appointment by token
    SELECT * INTO appointment_record 
    FROM appointments 
    WHERE confirmation_token = token 
    AND status = 'pending'
    AND confirmation_deadline > NOW();
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Token inválido o expirado'
        );
    END IF;
    
    -- Confirm the appointment
    UPDATE appointments 
    SET 
        confirmed = true,
        confirmation_token = NULL,
        updated_at = NOW()
    WHERE id = appointment_record.id;
    
    RETURN json_build_object(
        'success', true,
        'appointment_id', appointment_record.id,
        'message', 'Cita confirmada exitosamente'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 10. Create function to cancel appointment via token
CREATE OR REPLACE FUNCTION cancel_appointment_by_token(token TEXT, reason TEXT DEFAULT 'Cancelado por el cliente')
RETURNS JSON AS $$
DECLARE
    appointment_record appointments%ROWTYPE;
    result JSON;
BEGIN
    -- Find appointment by token
    SELECT * INTO appointment_record 
    FROM appointments 
    WHERE confirmation_token = token 
    AND status IN ('pending', 'confirmed');
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Token inválido'
        );
    END IF;
    
    -- Cancel the appointment
    UPDATE appointments 
    SET 
        status = 'cancelled',
        cancelled_at = NOW(),
        cancelled_by = appointment_record.client_id,
        cancel_reason = reason,
        confirmation_token = NULL,
        updated_at = NOW()
    WHERE id = appointment_record.id;
    
    RETURN json_build_object(
        'success', true,
        'appointment_id', appointment_record.id,
        'message', 'Cita cancelada exitosamente'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 11. Insert default confirmation policies for existing businesses
INSERT INTO business_confirmation_policies (business_id, confirmation_method, email_enabled, email_hours_before)
SELECT 
    id as business_id,
    'email' as confirmation_method,
    true as email_enabled,
    24 as email_hours_before
FROM businesses
WHERE id NOT IN (SELECT business_id FROM business_confirmation_policies)
ON CONFLICT (business_id) DO NOTHING;
-- 12. Update existing pending appointments to set confirmation deadlines
UPDATE appointments 
SET 
    confirmation_deadline = start_time - INTERVAL '24 hours',
    confirmation_token = generate_confirmation_token(),
    auto_no_show_at = start_time + INTERVAL '10 minutes'
WHERE status = 'pending' 
AND confirmation_deadline IS NULL 
AND start_time > NOW();
