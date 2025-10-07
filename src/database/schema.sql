-- Bookio Database Schema for Supabase
-- This script sets up all tables, RLS policies, and functions needed for the appointment management system

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE appointment_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
CREATE TYPE notification_type AS ENUM ('reminder_24h', 'reminder_1h', 'reminder_15m', 'cancelled', 'rescheduled');
CREATE TYPE delivery_method AS ENUM ('email', 'push', 'browser');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed', 'cancelled');
CREATE TYPE theme_type AS ENUM ('light', 'dark', 'system');
CREATE TYPE sync_direction AS ENUM ('both', 'export_only', 'import_only');
CREATE TYPE calendar_provider AS ENUM ('google', 'outlook', 'apple');
CREATE TYPE conflict_resolution AS ENUM ('keep_local', 'keep_remote', 'merge', 'skip');

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    timezone VARCHAR(100) DEFAULT 'America/New_York',
    notification_preferences JSONB DEFAULT '{"email": true, "push": true, "browser": true}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- APPOINTMENTS TABLE
-- =============================================
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255),
    client_phone VARCHAR(50),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status appointment_status DEFAULT 'scheduled',
    location TEXT,
    notes TEXT,
    reminder_sent BOOLEAN DEFAULT FALSE,
    google_calendar_event_id VARCHAR(255), -- Store Google Calendar event ID for sync
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    CONSTRAINT valid_email CHECK (client_email IS NULL OR client_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- =============================================
-- NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivery_method delivery_method NOT NULL,
    status notification_status DEFAULT 'pending',
    error_message TEXT, -- Store error details if delivery fails
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- USER SETTINGS TABLE
-- =============================================
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    theme theme_type DEFAULT 'system',
    default_appointment_duration INTEGER DEFAULT 60, -- in minutes
    business_hours JSONB DEFAULT '{"start": "09:00", "end": "17:00", "days": [1,2,3,4,5]}'::jsonb,
    auto_reminders BOOLEAN DEFAULT TRUE,
    reminder_times INTEGER[] DEFAULT '{1440, 60, 15}', -- minutes before appointment
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- CALENDAR SYNC SETTINGS TABLE
-- =============================================
CREATE TABLE calendar_sync_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider calendar_provider NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    calendar_id VARCHAR(255) NOT NULL, -- External calendar ID
    access_token TEXT, -- Encrypted access token
    refresh_token TEXT, -- Encrypted refresh token
    token_expires_at TIMESTAMP WITH TIME ZONE,
    sync_direction sync_direction DEFAULT 'both',
    auto_sync BOOLEAN DEFAULT TRUE,
    sync_interval INTEGER DEFAULT 15, -- minutes
    last_sync TIMESTAMP WITH TIME ZONE,
    sync_errors TEXT[], -- Array of recent error messages
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- SYNC CONFLICTS TABLE
-- =============================================
CREATE TABLE sync_conflicts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    calendar_event_id VARCHAR(255) NOT NULL,
    conflict_type VARCHAR(50) NOT NULL, -- 'time_conflict', 'duplicate', 'deleted_externally', etc.
    local_data JSONB, -- Snapshot of local appointment data
    remote_data JSONB, -- Snapshot of remote calendar data
    resolution conflict_resolution,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- DASHBOARD STATS VIEW
-- =============================================
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
    user_id,
    COUNT(*) as total_appointments,
    COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled_appointments,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_appointments,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_appointments,
    COUNT(*) FILTER (WHERE status = 'no_show') as no_show_appointments,
    COUNT(*) FILTER (WHERE start_time::date = CURRENT_DATE AND status = 'scheduled') as upcoming_today,
    COUNT(*) FILTER (WHERE start_time >= CURRENT_DATE AND start_time < CURRENT_DATE + INTERVAL '7 days' AND status = 'scheduled') as upcoming_week
FROM appointments
GROUP BY user_id;

-- =============================================
-- FUNCTIONS
-- =============================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-update timestamps
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calendar_sync_settings_updated_at BEFORE UPDATE ON calendar_sync_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_sync_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_conflicts ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Appointments policies
CREATE POLICY "Users can view own appointments" ON appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own appointments" ON appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own appointments" ON appointments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own appointments" ON appointments FOR DELETE USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notifications" ON notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);

-- User settings policies
CREATE POLICY "Users can view own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own settings" ON user_settings FOR DELETE USING (auth.uid() = user_id);

-- Calendar sync settings policies
CREATE POLICY "Users can view own sync settings" ON calendar_sync_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sync settings" ON calendar_sync_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sync settings" ON calendar_sync_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sync settings" ON calendar_sync_settings FOR DELETE USING (auth.uid() = user_id);

-- Sync conflicts policies
CREATE POLICY "Users can view own sync conflicts" ON sync_conflicts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sync conflicts" ON sync_conflicts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sync conflicts" ON sync_conflicts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sync conflicts" ON sync_conflicts FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Appointments indexes
CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_appointments_start_time ON appointments(start_time);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_user_start_time ON appointments(user_id, start_time);
CREATE INDEX idx_appointments_google_event_id ON appointments(google_calendar_event_id) WHERE google_calendar_event_id IS NOT NULL;

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_appointment_id ON notifications(appointment_id);
CREATE INDEX idx_notifications_scheduled_for ON notifications(scheduled_for);
CREATE INDEX idx_notifications_status ON notifications(status);

-- Calendar sync settings indexes
CREATE INDEX idx_calendar_sync_user_id ON calendar_sync_settings(user_id);
CREATE INDEX idx_calendar_sync_enabled ON calendar_sync_settings(enabled);
CREATE INDEX idx_calendar_sync_last_sync ON calendar_sync_settings(last_sync);

-- Sync conflicts indexes
CREATE INDEX idx_sync_conflicts_user_id ON sync_conflicts(user_id);
CREATE INDEX idx_sync_conflicts_appointment_id ON sync_conflicts(appointment_id);
CREATE INDEX idx_sync_conflicts_resolved ON sync_conflicts(resolved_at);

-- =============================================
-- SAMPLE DATA (OPTIONAL - REMOVE IN PRODUCTION)
-- =============================================

-- Insert sample user (this would typically be handled by Supabase Auth)
/*
INSERT INTO users (id, email, full_name, timezone) VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'demo@Bookio.com', 'Demo User', 'America/New_York');

-- Insert sample user settings
INSERT INTO user_settings (user_id) VALUES 
    ('550e8400-e29b-41d4-a716-446655440000');

-- Insert sample appointments
INSERT INTO appointments (user_id, title, client_name, client_email, start_time, end_time, status) VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'Consulta inicial', 'Juan Pérez', 'juan@email.com', 
     NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day' + INTERVAL '1 hour', 'scheduled'),
    ('550e8400-e29b-41d4-a716-446655440000', 'Seguimiento mensual', 'María García', 'maria@email.com', 
     NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days' + INTERVAL '1 hour', 'scheduled'),
    ('550e8400-e29b-41d4-a716-446655440000', 'Revisión completa', 'Carlos López', 'carlos@email.com', 
     NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '1 hour', 'completed');
*/

-- =============================================
-- HELPFUL QUERIES FOR TESTING
-- =============================================

-- Get user's appointments for today
-- SELECT * FROM appointments WHERE user_id = 'USER_ID' AND start_time::date = CURRENT_DATE;

-- Get upcoming appointments for the next 7 days
-- SELECT * FROM appointments WHERE user_id = 'USER_ID' AND start_time >= NOW() AND start_time < NOW() + INTERVAL '7 days' ORDER BY start_time;

-- Get dashboard stats for a user
-- SELECT * FROM dashboard_stats WHERE user_id = 'USER_ID';

-- Get pending notifications
-- SELECT * FROM notifications WHERE status = 'pending' AND scheduled_for <= NOW();

-- Check calendar sync status
-- SELECT * FROM calendar_sync_settings WHERE user_id = 'USER_ID';