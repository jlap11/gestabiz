-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- Create custom types
CREATE TYPE user_role AS ENUM ('client', 'employee', 'admin');
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded');
CREATE TYPE employee_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE notification_type AS ENUM ('appointment_reminder', 'appointment_cancelled', 'appointment_confirmed', 'system');

-- ============================================================================
-- PROFILES TABLE (extends auth.users)
-- ============================================================================
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    role user_role DEFAULT 'client' NOT NULL,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- ============================================================================
-- BUSINESSES TABLE
-- ============================================================================
CREATE TABLE public.businesses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    postal_code TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    logo_url TEXT,
    website TEXT,
    business_hours JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- ============================================================================
-- LOCATIONS TABLE (business branches)
-- ============================================================================
CREATE TABLE public.locations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT,
    country TEXT NOT NULL,
    postal_code TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- ============================================================================
-- BUSINESS EMPLOYEES TABLE (junction table)
-- ============================================================================
CREATE TABLE public.business_employees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    employee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'employee' CHECK (role IN ('employee', 'manager')),
    status employee_status DEFAULT 'pending' NOT NULL,
    hired_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    UNIQUE(business_id, employee_id)
);

-- ============================================================================
-- SERVICES TABLE
-- ============================================================================
CREATE TABLE public.services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    currency TEXT DEFAULT 'MXN' NOT NULL,
    category TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- ============================================================================
-- APPOINTMENTS TABLE
-- ============================================================================
CREATE TABLE public.appointments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    employee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status appointment_status DEFAULT 'pending' NOT NULL,
    site_name TEXT,
    notes TEXT,
    client_notes TEXT,
    price DECIMAL(10, 2),
    currency TEXT DEFAULT 'MXN',
    payment_status payment_status DEFAULT 'pending',
    reminder_sent BOOLEAN DEFAULT FALSE NOT NULL,
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    cancel_reason TEXT,
    
    -- Constraints
    CHECK (end_time > start_time),
    CHECK (start_time > NOW() - INTERVAL '1 day') -- Can't create appointments more than 1 day in the past
);

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    read BOOLEAN DEFAULT FALSE NOT NULL,
    sent_via_email BOOLEAN DEFAULT FALSE NOT NULL,
    sent_via_push BOOLEAN DEFAULT FALSE NOT NULL,
    scheduled_for TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Profiles indexes
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_is_active ON public.profiles(is_active);

-- Businesses indexes
CREATE INDEX idx_businesses_owner_id ON public.businesses(owner_id);
CREATE INDEX idx_businesses_is_active ON public.businesses(is_active);

-- Locations indexes
CREATE INDEX idx_locations_business_id ON public.locations(business_id);
CREATE INDEX idx_locations_is_active ON public.locations(is_active);

-- Business employees indexes
CREATE INDEX idx_business_employees_business_id ON public.business_employees(business_id);
CREATE INDEX idx_business_employees_employee_id ON public.business_employees(employee_id);
CREATE INDEX idx_business_employees_status ON public.business_employees(status);

-- Services indexes
CREATE INDEX idx_services_business_id ON public.services(business_id);
CREATE INDEX idx_services_is_active ON public.services(is_active);
CREATE INDEX idx_services_category ON public.services(category);

-- Appointments indexes
CREATE INDEX idx_appointments_business_id ON public.appointments(business_id);
CREATE INDEX idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX idx_appointments_employee_id ON public.appointments(employee_id);
CREATE INDEX idx_appointments_service_id ON public.appointments(service_id);
CREATE INDEX idx_appointments_location_id ON public.appointments(location_id);
CREATE INDEX idx_appointments_start_time ON public.appointments(start_time);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_appointments_date_range ON public.appointments(start_time, end_time);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_appointment_id ON public.notifications(appointment_id);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_scheduled_for ON public.notifications(scheduled_for);

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_business_employees_updated_at BEFORE UPDATE ON public.business_employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================
-- Users can read their own profile and profiles of employees in their businesses (if admin)
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (signup)
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies moved to database/rls-policies.sql as the single source of truth.

-- ============================================================================
-- LOCATIONS POLICIES
-- ============================================================================
-- Business owners can manage locations
CREATE POLICY "Business owners can manage locations" ON public.locations
    FOR ALL USING (
        auth.uid() IN (
            SELECT owner_id FROM public.businesses WHERE id = locations.business_id
        )
    );

-- Employees can read locations of their businesses
CREATE POLICY "Employees can read business locations" ON public.locations
    FOR SELECT USING (
        auth.uid() IN (
            SELECT employee_id FROM public.business_employees 
            WHERE business_id = locations.business_id AND status = 'approved'
        )
    );

-- Policies moved to database/rls-policies.sql as the single source of truth.

-- ============================================================================
-- SERVICES POLICIES
-- ============================================================================
-- Business owners can manage services
CREATE POLICY "Business owners can manage services" ON public.services
    FOR ALL USING (
        auth.uid() IN (
            SELECT owner_id FROM public.businesses WHERE id = services.business_id
        )
    );

-- Employees can read services
CREATE POLICY "Employees can read services" ON public.services
    FOR SELECT USING (
        auth.uid() IN (
            SELECT employee_id FROM public.business_employees 
            WHERE business_id = services.business_id AND status = 'approved'
        )
    );

-- Clients can read active services
CREATE POLICY "Clients can read active services" ON public.services
    FOR SELECT USING (is_active = TRUE);

-- ============================================================================
-- APPOINTMENTS POLICIES
-- ============================================================================
-- Business owners can manage all appointments in their businesses
CREATE POLICY "Business owners can manage appointments" ON public.appointments
    FOR ALL USING (
        auth.uid() IN (
            SELECT owner_id FROM public.businesses WHERE id = appointments.business_id
        )
    );

-- Employees can read and update appointments assigned to them
CREATE POLICY "Employees can manage their appointments" ON public.appointments
    FOR ALL USING (auth.uid() = employee_id);

-- Clients can read and manage their own appointments
CREATE POLICY "Clients can manage their appointments" ON public.appointments
    FOR ALL USING (auth.uid() = client_id);

-- ============================================================================
-- NOTIFICATIONS POLICIES
-- ============================================================================
-- Users can read their own notifications
CREATE POLICY "Users can read own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- System can insert notifications (handled by triggers/functions)
CREATE POLICY "System can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (TRUE);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS FOR BUSINESS LOGIC
-- ============================================================================

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to prevent appointment conflicts
CREATE OR REPLACE FUNCTION check_appointment_conflict()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for employee conflicts (if employee is assigned)
    IF NEW.employee_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.appointments 
        WHERE employee_id = NEW.employee_id 
        AND id != COALESCE(NEW.id, uuid_generate_v4())
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

-- Trigger to check appointment conflicts
CREATE TRIGGER check_appointment_conflict_trigger
    BEFORE INSERT OR UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION check_appointment_conflict();

-- Function to create automatic reminders
CREATE OR REPLACE FUNCTION create_appointment_reminders()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create reminders for confirmed appointments
    IF NEW.status = 'confirmed' AND (OLD IS NULL OR OLD.status != 'confirmed') THEN
        -- 24 hour reminder
        INSERT INTO public.notifications (user_id, type, title, message, appointment_id, scheduled_for)
        VALUES (
            NEW.client_id,
            'appointment_reminder',
            'Recordatorio de cita - 24 horas',
            'Tienes una cita programada para mañana',
            NEW.id,
            NEW.start_time - INTERVAL '24 hours'
        );
        
        -- 1 hour reminder
        INSERT INTO public.notifications (user_id, type, title, message, appointment_id, scheduled_for)
        VALUES (
            NEW.client_id,
            'appointment_reminder',
            'Recordatorio de cita - 1 hora',
            'Tu cita es en 1 hora',
            NEW.id,
            NEW.start_time - INTERVAL '1 hour'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create reminders
CREATE TRIGGER create_appointment_reminders_trigger
    AFTER INSERT OR UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION create_appointment_reminders();

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert demo business categories
INSERT INTO public.businesses (id, name, description, owner_id, email, phone, address, city, country, settings) 
SELECT 
    uuid_generate_v4(),
    'Demo Salon & Spa',
    'Professional beauty and wellness services',
    (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1),
    'info@demosalon.com',
    '+52 55 1234 5678',
    'Av. Reforma 123',
    'Ciudad de México',
    'México',
    '{"appointment_buffer": 15, "advance_booking_days": 30, "cancellation_policy": 24, "auto_confirm": false, "require_deposit": false, "deposit_percentage": 0, "currency": "MXN"}'::jsonb
WHERE EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin');

-- Insert demo services
INSERT INTO public.services (business_id, name, description, duration_minutes, price, category)
SELECT 
    b.id,
    service.name,
    service.description,
    service.duration,
    service.price,
    service.category
FROM public.businesses b,
(VALUES 
    ('Corte de Cabello', 'Corte profesional para dama y caballero', 45, 250.00, 'Cabello'),
    ('Pedicure', 'Cuidado completo de pies', 60, 180.00, 'Cuidado'),
    ('Manicure', 'Cuidado de manos y uñas', 30, 120.00, 'Cuidado'),
    ('Tinte de Cabello', 'Coloración profesional', 120, 450.00, 'Cabello'),
    ('Masaje Relajante', 'Masaje corporal de 60 minutos', 60, 350.00, 'Spa')
) AS service(name, description, duration, price, category)
WHERE b.name = 'Demo Salon & Spa';

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for appointment details with related data
CREATE VIEW public.appointment_details AS
SELECT 
    a.*,
    s.name as service_name,
    s.duration_minutes,
    s.price as service_price,
    c.full_name as client_name,
    c.email as client_email,
    c.phone as client_phone,
    e.full_name as employee_name,
    l.name as location_name,
    l.address as location_address,
    b.name as business_name
FROM public.appointments a
LEFT JOIN public.services s ON a.service_id = s.id
LEFT JOIN public.profiles c ON a.client_id = c.id
LEFT JOIN public.profiles e ON a.employee_id = e.id
LEFT JOIN public.locations l ON a.location_id = l.id
LEFT JOIN public.businesses b ON a.business_id = b.id;

-- View for business statistics
CREATE VIEW public.business_stats AS
SELECT 
    b.id as business_id,
    b.name as business_name,
    COUNT(DISTINCT a.id) as total_appointments,
    COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END) as completed_appointments,
    COUNT(DISTINCT CASE WHEN a.status = 'cancelled' THEN a.id END) as cancelled_appointments,
    COUNT(DISTINCT a.client_id) as total_clients,
    COALESCE(SUM(CASE WHEN a.status = 'completed' THEN a.price END), 0) as total_revenue,
    COUNT(DISTINCT be.employee_id) as total_employees
FROM public.businesses b
LEFT JOIN public.appointments a ON b.id = a.business_id
LEFT JOIN public.business_employees be ON b.id = be.business_id AND be.status = 'approved'
GROUP BY b.id, b.name;

COMMIT;