-- AppointmentPro Enhanced Database Schema
-- Complete schema for multi-tenant appointment management system with roles

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom types
CREATE TYPE user_role AS ENUM ('admin', 'employee', 'client');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled');
CREATE TYPE notification_type AS ENUM ('reminder_24h', 'reminder_1h', 'reminder_15m', 'confirmation', 'cancellation', 'rescheduled', 'follow_up');
CREATE TYPE delivery_method AS ENUM ('email', 'whatsapp', 'sms', 'push', 'browser');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed', 'cancelled');
CREATE TYPE client_status AS ENUM ('active', 'inactive', 'blocked');
CREATE TYPE theme_type AS ENUM ('light', 'dark', 'system');
CREATE TYPE language_type AS ENUM ('es', 'en');
CREATE TYPE date_format_type AS ENUM ('DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD');
CREATE TYPE time_format_type AS ENUM ('12h', '24h');
CREATE TYPE plan_type AS ENUM ('free', 'basic', 'professional', 'enterprise');
CREATE TYPE plan_status AS ENUM ('active', 'cancelled', 'expired', 'suspended');

-- Businesses table (multi-tenant support)
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url TEXT,
    website TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'Colombia',
    postal_code VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    business_hours JSONB NOT NULL DEFAULT '{}',
    timezone VARCHAR(50) NOT NULL DEFAULT 'America/Bogota',
    owner_id UUID NOT NULL,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Business locations (branches/offices)
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'Colombia',
    postal_code VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone VARCHAR(50),
    email VARCHAR(255),
    business_hours JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services offered by the business
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL DEFAULT 60, -- in minutes
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'COP',
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table with enhanced role-based access
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    timezone VARCHAR(50) NOT NULL DEFAULT 'America/Bogota',
    role user_role NOT NULL DEFAULT 'client',
    business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    phone VARCHAR(50),
    language language_type NOT NULL DEFAULT 'es',
    notification_preferences JSONB NOT NULL DEFAULT '{}',
    permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Clients table (enhanced with business relationship)
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    whatsapp VARCHAR(50),
    company VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    date_of_birth DATE,
    notes TEXT,
    avatar_url TEXT,
    language language_type NOT NULL DEFAULT 'es',
    total_appointments INTEGER DEFAULT 0,
    last_appointment TIMESTAMP WITH TIME ZONE,
    is_recurring BOOLEAN DEFAULT false,
    status client_status DEFAULT 'active',
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id)
);

-- Appointments table (enhanced with business context)
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id), -- employee assigned
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255),
    client_phone VARCHAR(50),
    client_whatsapp VARCHAR(50),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status appointment_status DEFAULT 'scheduled',
    location TEXT,
    notes TEXT,
    price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'COP',
    reminder_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id),
    cancelled_reason TEXT,
    rescheduled_from UUID REFERENCES appointments(id),
    google_calendar_event_id VARCHAR(255)
);

-- Notifications table (enhanced)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivery_method delivery_method NOT NULL,
    status notification_status DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User settings table (enhanced)
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    theme theme_type DEFAULT 'dark',
    language language_type DEFAULT 'es',
    timezone VARCHAR(50) DEFAULT 'America/Bogota',
    default_appointment_duration INTEGER DEFAULT 60,
    business_hours JSONB DEFAULT '{}',
    auto_reminders BOOLEAN DEFAULT true,
    reminder_times INTEGER[] DEFAULT ARRAY[1440, 60]::INTEGER[], -- 24h and 1h before
    email_notifications JSONB DEFAULT '{}',
    whatsapp_notifications JSONB DEFAULT '{}',
    date_format date_format_type DEFAULT 'DD/MM/YYYY',
    time_format time_format_type DEFAULT '24h',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calendar sync settings
CREATE TABLE calendar_sync_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'google', 'outlook', 'apple'
    enabled BOOLEAN DEFAULT false,
    calendar_id VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    sync_direction VARCHAR(20) DEFAULT 'both', -- 'both', 'export_only', 'import_only'
    auto_sync BOOLEAN DEFAULT true,
    last_sync TIMESTAMP WITH TIME ZONE,
    sync_errors TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WhatsApp message templates
CREATE TABLE whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'reminder', 'confirmation', 'follow_up', 'marketing'
    message TEXT NOT NULL,
    variables TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employee work schedules
CREATE TABLE work_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_start TIME,
    break_end TIME,
    is_working BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, location_id, day_of_week)
);

-- Business subscription/plan
CREATE TABLE business_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID UNIQUE NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    plan_type plan_type NOT NULL DEFAULT 'free',
    features TEXT[] DEFAULT ARRAY[]::TEXT[],
    limits JSONB NOT NULL DEFAULT '{}',
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'COP',
    billing_cycle VARCHAR(10) DEFAULT 'monthly', -- 'monthly', 'yearly'
    status plan_status DEFAULT 'active',
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dashboard stats view
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
    user_id,
    business_id,
    COUNT(*) as total_appointments,
    COUNT(*) FILTER (WHERE status IN ('scheduled', 'confirmed')) as scheduled_appointments,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_appointments,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_appointments,
    COUNT(*) FILTER (WHERE status = 'no_show') as no_show_appointments,
    COUNT(*) FILTER (WHERE start_time::date = CURRENT_DATE AND status IN ('scheduled', 'confirmed')) as upcoming_today,
    COUNT(*) FILTER (WHERE start_time >= CURRENT_DATE AND start_time < CURRENT_DATE + INTERVAL '7 days' AND status IN ('scheduled', 'confirmed')) as upcoming_week,
    COALESCE(SUM(price) FILTER (WHERE status = 'completed'), 0) as revenue_total,
    COALESCE(SUM(price) FILTER (WHERE status = 'completed' AND start_time >= date_trunc('month', CURRENT_DATE)), 0) as revenue_this_month
FROM appointments
GROUP BY user_id, business_id;

-- Indexes for performance
CREATE INDEX idx_appointments_business_id ON appointments(business_id);
CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_appointments_client_id ON appointments(client_id);
CREATE INDEX idx_appointments_start_time ON appointments(start_time);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_business_start_time ON appointments(business_id, start_time);

CREATE INDEX idx_clients_business_id ON clients(business_id);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_clients_status ON clients(status);

CREATE INDEX idx_users_business_id ON users(business_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_scheduled_for ON notifications(scheduled_for);
CREATE INDEX idx_notifications_status ON notifications(status);

CREATE INDEX idx_services_business_id ON services(business_id);
CREATE INDEX idx_services_location_id ON services(location_id);

CREATE INDEX idx_locations_business_id ON locations(business_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_sync_settings_updated_at BEFORE UPDATE ON calendar_sync_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_templates_updated_at BEFORE UPDATE ON whatsapp_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_schedules_updated_at BEFORE UPDATE ON work_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_plans_updated_at BEFORE UPDATE ON business_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update client statistics
CREATE OR REPLACE FUNCTION update_client_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE clients 
        SET 
            total_appointments = total_appointments + 1,
            last_appointment = NEW.start_time,
            is_recurring = (total_appointments + 1) > 1,
            updated_at = NOW()
        WHERE id = NEW.client_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE clients 
        SET 
            last_appointment = NEW.start_time,
            updated_at = NOW()
        WHERE id = NEW.client_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE clients 
        SET 
            total_appointments = GREATEST(0, total_appointments - 1),
            is_recurring = (GREATEST(0, total_appointments - 1)) > 1,
            updated_at = NOW()
        WHERE id = OLD.client_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_client_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_client_stats();

-- Row Level Security (RLS) policies
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_sync_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_plans ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (to be customized based on authentication setup)
-- Users can see their own data
CREATE POLICY "Users can view own data" ON users
    FOR ALL USING (auth.uid()::text = id::text);

-- Business owners and employees can see business data
CREATE POLICY "Business members can view business data" ON businesses
    FOR ALL USING (
        owner_id::text = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.business_id = businesses.id
            AND users.is_active = true
        )
    );

-- Similar policies for other tables (simplified for brevity)
CREATE POLICY "Business members can view locations" ON locations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.business_id = locations.business_id
            AND users.is_active = true
        )
    );

CREATE POLICY "Business members can view services" ON services
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.business_id = services.business_id
            AND users.is_active = true
        )
    );

CREATE POLICY "Business members can view clients" ON clients
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.business_id = clients.business_id
            AND users.is_active = true
        )
    );

CREATE POLICY "Business members can view appointments" ON appointments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.business_id = appointments.business_id
            AND users.is_active = true
        ) OR
        user_id::text = auth.uid()::text
    );

-- Insert default WhatsApp templates for new businesses
CREATE OR REPLACE FUNCTION create_default_whatsapp_templates()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO whatsapp_templates (business_id, name, type, message, variables) VALUES
    (NEW.id, 'Recordatorio 24h', 'reminder', 
     'Hola {{client_name}}! Te recordamos que tienes una cita mañana {{appointment_date}} a las {{appointment_time}} para {{service_name}}. ¡Te esperamos!', 
     ARRAY['client_name', 'appointment_date', 'appointment_time', 'service_name']),
    (NEW.id, 'Confirmación de Cita', 'confirmation', 
     'Hola {{client_name}}! Tu cita ha sido confirmada para el {{appointment_date}} a las {{appointment_time}}. Si necesitas cambios, contáctanos.', 
     ARRAY['client_name', 'appointment_date', 'appointment_time']),
    (NEW.id, 'Seguimiento Cliente Inactivo', 'follow_up', 
     'Hola {{client_name}}! Notamos que hace tiempo no nos visitas. ¿Te gustaría agendar una nueva cita? ¡Estaremos felices de atenderte!', 
     ARRAY['client_name']);
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_default_templates_trigger
    AFTER INSERT ON businesses
    FOR EACH ROW EXECUTE FUNCTION create_default_whatsapp_templates();