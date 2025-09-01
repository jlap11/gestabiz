-- AppointmentPro - Complete Supabase Database Schema
-- Copy and paste this SQL into Supabase SQL Editor

-- Enable Row Level Security
ALTER DATABASE postgres SET row_security = on;

-- Create custom extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- USER MANAGEMENT TABLES
-- =====================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    phone VARCHAR(20),
    timezone VARCHAR(50) DEFAULT 'UTC',
    role user_role DEFAULT 'client',
    business_id UUID REFERENCES public.businesses(id),
    location_id UUID REFERENCES public.locations(id),
    language VARCHAR(5) DEFAULT 'es' CHECK (language IN ('es', 'en')),
    notification_preferences JSONB DEFAULT '{
        "email": true,
        "push": true,
        "browser": true,
        "whatsapp": false,
        "reminder_24h": true,
        "reminder_1h": true,
        "reminder_15m": false,
        "daily_digest": false,
        "weekly_report": true
    }'::jsonb,
    permissions TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User roles enum
CREATE TYPE user_role AS ENUM ('admin', 'employee', 'client');

-- =====================================================
-- BUSINESS MANAGEMENT TABLES
-- =====================================================

-- Businesses table
CREATE TABLE public.businesses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url TEXT,
    website VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    business_hours JSONB DEFAULT '{
        "monday": {"open": "09:00", "close": "18:00", "is_open": true},
        "tuesday": {"open": "09:00", "close": "18:00", "is_open": true},
        "wednesday": {"open": "09:00", "close": "18:00", "is_open": true},
        "thursday": {"open": "09:00", "close": "18:00", "is_open": true},
        "friday": {"open": "09:00", "close": "18:00", "is_open": true},
        "saturday": {"open": "09:00", "close": "14:00", "is_open": true},
        "sunday": {"open": "00:00", "close": "00:00", "is_open": false}
    }'::jsonb,
    timezone VARCHAR(50) DEFAULT 'UTC',
    owner_id UUID REFERENCES public.users(id) NOT NULL,
    settings JSONB DEFAULT '{
        "appointment_duration_default": 60,
        "booking_advance_days": 30,
        "cancellation_policy": "Se requiere cancelar con 24 horas de anticipación",
        "auto_confirm": true
    }'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business locations (branches/offices)
CREATE TABLE public.locations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone VARCHAR(20),
    email VARCHAR(255),
    business_hours JSONB DEFAULT '{
        "monday": {"open": "09:00", "close": "18:00", "is_open": true},
        "tuesday": {"open": "09:00", "close": "18:00", "is_open": true},
        "wednesday": {"open": "09:00", "close": "18:00", "is_open": true},
        "thursday": {"open": "09:00", "close": "18:00", "is_open": true},
        "friday": {"open": "09:00", "close": "18:00", "is_open": true},
        "saturday": {"open": "09:00", "close": "14:00", "is_open": true},
        "sunday": {"open": "00:00", "close": "00:00", "is_open": false}
    }'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services offered by the business
CREATE TABLE public.services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL DEFAULT 60, -- in minutes
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'EUR',
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CLIENT MANAGEMENT TABLES
-- =====================================================

-- Clients table
CREATE TABLE public.clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    whatsapp VARCHAR(20),
    company VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    date_of_birth DATE,
    notes TEXT,
    avatar_url TEXT,
    language VARCHAR(5) DEFAULT 'es' CHECK (language IN ('es', 'en')),
    total_appointments INTEGER DEFAULT 0,
    last_appointment TIMESTAMP WITH TIME ZONE,
    is_recurring BOOLEAN DEFAULT false,
    status client_status DEFAULT 'active',
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id)
);

-- Client status enum
CREATE TYPE client_status AS ENUM ('active', 'inactive', 'blocked');

-- =====================================================
-- APPOINTMENT MANAGEMENT TABLES
-- =====================================================

-- Appointments table
CREATE TABLE public.appointments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.users(id) NOT NULL, -- employee assigned
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255),
    client_phone VARCHAR(20),
    client_whatsapp VARCHAR(20),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status appointment_status DEFAULT 'scheduled',
    location TEXT,
    notes TEXT,
    price DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'EUR',
    reminder_sent BOOLEAN DEFAULT false,
    cancelled_reason TEXT,
    rescheduled_from UUID REFERENCES public.appointments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id) NOT NULL
);

-- Appointment status enum
CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled');

-- =====================================================
-- NOTIFICATION SYSTEM TABLES
-- =====================================================

-- Notifications table
CREATE TABLE public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivery_method delivery_method NOT NULL,
    status notification_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification type enum
CREATE TYPE notification_type AS ENUM ('reminder_24h', 'reminder_1h', 'reminder_15m', 'cancelled', 'rescheduled', 'confirmation', 'follow_up');

-- Delivery method enum
CREATE TYPE delivery_method AS ENUM ('email', 'push', 'browser', 'whatsapp', 'sms');

-- Notification status enum
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed', 'cancelled');

-- Notification templates
CREATE TABLE public.notification_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    channel delivery_method NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    variables TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WhatsApp message templates
CREATE TABLE public.whatsapp_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type whatsapp_template_type NOT NULL,
    message TEXT NOT NULL,
    variables TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WhatsApp template type enum
CREATE TYPE whatsapp_template_type AS ENUM ('reminder', 'confirmation', 'follow_up', 'marketing', 'welcome', 'birthday');

-- =====================================================
-- SETTINGS AND CONFIGURATION TABLES
-- =====================================================

-- User settings table
CREATE TABLE public.user_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    theme user_theme DEFAULT 'dark',
    language VARCHAR(5) DEFAULT 'es' CHECK (language IN ('es', 'en')),
    timezone VARCHAR(50) DEFAULT 'UTC',
    default_appointment_duration INTEGER DEFAULT 60,
    business_hours JSONB DEFAULT '{
        "start": "09:00",
        "end": "18:00",
        "days": [1, 2, 3, 4, 5]
    }'::jsonb,
    auto_reminders BOOLEAN DEFAULT true,
    reminder_times INTEGER[] DEFAULT '{1440, 60}', -- 24h and 1h before
    email_notifications JSONB DEFAULT '{
        "appointment_reminders": true,
        "appointment_confirmations": true,
        "appointment_cancellations": true,
        "daily_digest": true,
        "weekly_report": false,
        "marketing": false
    }'::jsonb,
    whatsapp_notifications JSONB DEFAULT '{
        "appointment_reminders": true,
        "appointment_confirmations": true,
        "follow_ups": false
    }'::jsonb,
    date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    time_format VARCHAR(5) DEFAULT '24h' CHECK (time_format IN ('12h', '24h')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User theme enum
CREATE TYPE user_theme AS ENUM ('light', 'dark', 'system');

-- =====================================================
-- ANALYTICS AND REPORTING TABLES
-- =====================================================

-- Business analytics (for caching computed metrics)
CREATE TABLE public.business_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    period VARCHAR(20) NOT NULL, -- 'week', 'month', 'quarter', 'year'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    metrics JSONB NOT NULL, -- JSON with computed metrics
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employee work schedules
CREATE TABLE public.work_schedules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    employee_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_start TIME,
    break_end TIME,
    is_working BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, day_of_week)
);

-- =====================================================
-- CALENDAR INTEGRATION TABLES
-- =====================================================

-- Calendar sync settings
CREATE TABLE public.calendar_sync_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    provider calendar_provider NOT NULL,
    enabled BOOLEAN DEFAULT false,
    calendar_id VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    sync_direction sync_direction DEFAULT 'both',
    auto_sync BOOLEAN DEFAULT true,
    last_sync TIMESTAMP WITH TIME ZONE,
    sync_errors TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calendar provider enum
CREATE TYPE calendar_provider AS ENUM ('google', 'outlook', 'apple');

-- Sync direction enum
CREATE TYPE sync_direction AS ENUM ('both', 'export_only', 'import_only');

-- =====================================================
-- BUSINESS PLANS AND SUBSCRIPTIONS
-- =====================================================

-- Business plans
CREATE TABLE public.business_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    plan_type plan_type NOT NULL,
    features TEXT[] DEFAULT '{}',
    limits JSONB DEFAULT '{
        "max_employees": 5,
        "max_locations": 1,
        "max_appointments_per_month": 100,
        "storage_mb": 100
    }'::jsonb,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'EUR',
    billing_cycle billing_cycle DEFAULT 'monthly',
    status plan_status DEFAULT 'active',
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plan type enum
CREATE TYPE plan_type AS ENUM ('free', 'basic', 'professional', 'enterprise');

-- Billing cycle enum
CREATE TYPE billing_cycle AS ENUM ('monthly', 'yearly');

-- Plan status enum
CREATE TYPE plan_status AS ENUM ('active', 'cancelled', 'expired', 'suspended');

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users indexes
CREATE INDEX idx_users_business_id ON public.users(business_id);
CREATE INDEX idx_users_location_id ON public.users(location_id);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_email ON public.users(email);

-- Businesses indexes
CREATE INDEX idx_businesses_owner_id ON public.businesses(owner_id);
CREATE INDEX idx_businesses_active ON public.businesses(is_active);

-- Locations indexes
CREATE INDEX idx_locations_business_id ON public.locations(business_id);
CREATE INDEX idx_locations_active ON public.locations(is_active);

-- Services indexes
CREATE INDEX idx_services_business_id ON public.services(business_id);
CREATE INDEX idx_services_location_id ON public.services(location_id);
CREATE INDEX idx_services_active ON public.services(is_active);

-- Clients indexes
CREATE INDEX idx_clients_business_id ON public.clients(business_id);
CREATE INDEX idx_clients_email ON public.clients(email);
CREATE INDEX idx_clients_status ON public.clients(status);
CREATE INDEX idx_clients_created_by ON public.clients(created_by);

-- Appointments indexes
CREATE INDEX idx_appointments_business_id ON public.appointments(business_id);
CREATE INDEX idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX idx_appointments_start_time ON public.appointments(start_time);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_appointments_location_id ON public.appointments(location_id);
CREATE INDEX idx_appointments_service_id ON public.appointments(service_id);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_appointment_id ON public.notifications(appointment_id);
CREATE INDEX idx_notifications_scheduled_for ON public.notifications(scheduled_for);
CREATE INDEX idx_notifications_status ON public.notifications(status);

-- Analytics indexes
CREATE INDEX idx_business_analytics_business_id ON public.business_analytics(business_id);
CREATE INDEX idx_business_analytics_period ON public.business_analytics(period, start_date, end_date);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_sync_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_plans ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own data
CREATE POLICY "Users can view own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Business owners and employees can access business data
CREATE POLICY "Business access" ON public.businesses FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND (users.business_id = businesses.id OR users.role = 'admin')
    )
);

-- Location access follows business access
CREATE POLICY "Location access" ON public.locations FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND (users.business_id = locations.business_id OR users.role = 'admin')
    )
);

-- Service access follows business access
CREATE POLICY "Service access" ON public.services FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND (users.business_id = services.business_id OR users.role = 'admin')
    )
);

-- Client access follows business access
CREATE POLICY "Client access" ON public.clients FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND (users.business_id = clients.business_id OR users.role = 'admin')
    )
);

-- Appointment access - users can see appointments for their business or assigned to them
CREATE POLICY "Appointment access" ON public.appointments FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND (users.business_id = appointments.business_id OR appointments.user_id = auth.uid())
    )
);

-- Notification access - users can see their own notifications
CREATE POLICY "Notification access" ON public.notifications FOR ALL USING (user_id = auth.uid());

-- Settings access - users can access their own settings
CREATE POLICY "Settings access" ON public.user_settings FOR ALL USING (user_id = auth.uid());

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_work_schedules_updated_at BEFORE UPDATE ON public.work_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calendar_sync_settings_updated_at BEFORE UPDATE ON public.calendar_sync_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_business_plans_updated_at BEFORE UPDATE ON public.business_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update client appointment stats
CREATE OR REPLACE FUNCTION update_client_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE public.clients 
        SET 
            total_appointments = (
                SELECT COUNT(*) 
                FROM public.appointments 
                WHERE client_id = NEW.client_id
            ),
            last_appointment = (
                SELECT MAX(start_time) 
                FROM public.appointments 
                WHERE client_id = NEW.client_id AND status = 'completed'
            )
        WHERE id = NEW.client_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.clients 
        SET 
            total_appointments = (
                SELECT COUNT(*) 
                FROM public.appointments 
                WHERE client_id = OLD.client_id
            ),
            last_appointment = (
                SELECT MAX(start_time) 
                FROM public.appointments 
                WHERE client_id = OLD.client_id AND status = 'completed'
            )
        WHERE id = OLD.client_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update client stats when appointments change
CREATE TRIGGER update_client_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION update_client_stats();

-- =====================================================
-- INITIAL DATA SETUP
-- =====================================================

-- Insert default notification templates (optional)
INSERT INTO public.notification_templates (id, business_id, type, channel, subject, message, variables) VALUES
(uuid_generate_v4(), NULL, 'reminder_24h', 'email', 'Recordatorio de cita - {{business_name}}', 'Hola {{client_name}}, te recordamos que tienes una cita mañana a las {{appointment_time}} para {{service_name}}.', ARRAY['client_name', 'business_name', 'appointment_time', 'service_name']),
(uuid_generate_v4(), NULL, 'reminder_1h', 'whatsapp', 'Recordatorio de cita', 'Hola {{client_name}}, tu cita es en 1 hora. Nos vemos a las {{appointment_time}} en {{location}}.', ARRAY['client_name', 'appointment_time', 'location']),
(uuid_generate_v4(), NULL, 'confirmation', 'email', 'Cita confirmada - {{business_name}}', 'Tu cita ha sido confirmada para el {{appointment_date}} a las {{appointment_time}}.', ARRAY['business_name', 'appointment_date', 'appointment_time']);

-- =====================================================
-- VIEWS FOR EASY REPORTING
-- =====================================================

-- View for appointment statistics
CREATE VIEW appointment_stats AS
SELECT 
    b.id as business_id,
    b.name as business_name,
    COUNT(*) as total_appointments,
    COUNT(*) FILTER (WHERE a.status = 'completed') as completed_appointments,
    COUNT(*) FILTER (WHERE a.status = 'cancelled') as cancelled_appointments,
    COUNT(*) FILTER (WHERE a.status = 'no_show') as no_show_appointments,
    COUNT(*) FILTER (WHERE a.start_time::date = CURRENT_DATE) as today_appointments,
    COUNT(*) FILTER (WHERE a.start_time >= date_trunc('week', CURRENT_DATE)) as this_week_appointments,
    COUNT(*) FILTER (WHERE a.start_time >= date_trunc('month', CURRENT_DATE)) as this_month_appointments,
    SUM(a.price) FILTER (WHERE a.status = 'completed') as total_revenue
FROM public.businesses b
LEFT JOIN public.appointments a ON b.id = a.business_id
GROUP BY b.id, b.name;

-- View for client analytics
CREATE VIEW client_analytics AS
SELECT 
    c.id,
    c.business_id,
    c.name,
    c.email,
    c.total_appointments,
    c.last_appointment,
    c.status,
    c.is_recurring,
    CASE 
        WHEN c.last_appointment IS NULL THEN 'new'
        WHEN c.last_appointment < NOW() - INTERVAL '90 days' THEN 'lost'
        WHEN c.last_appointment < NOW() - INTERVAL '30 days' THEN 'at_risk'
        ELSE 'active'
    END as engagement_status,
    EXTRACT(days FROM NOW() - c.last_appointment) as days_since_last_appointment
FROM public.clients c;

-- End of schema