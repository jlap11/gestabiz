-- Migration: Multi-Role User System
-- Description: Allow users to have multiple roles simultaneously (admin, employee, client)
-- Author: System
-- Date: 2025-10-07

-- ============================================================================
-- STEP 1: Create user_roles table (many-to-many relationship)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role user_role NOT NULL,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    UNIQUE(user_id, role, business_id)
);

-- Index for performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);
CREATE INDEX idx_user_roles_business_id ON public.user_roles(business_id);

COMMENT ON TABLE public.user_roles IS 'Stores multiple roles per user. business_id is NULL for global roles like client';
COMMENT ON COLUMN public.user_roles.business_id IS 'NULL for client role, required for admin/employee roles tied to specific business';

-- ============================================================================
-- STEP 2: Migrate existing data from profiles.role to user_roles
-- ============================================================================

-- Insert existing roles into user_roles table
INSERT INTO public.user_roles (user_id, role, business_id, is_active)
SELECT 
    p.id as user_id,
    p.role,
    CASE 
        WHEN p.role = 'client' THEN NULL
        WHEN p.role = 'admin' THEN b.id
        WHEN p.role = 'employee' THEN be.business_id
        ELSE NULL
    END as business_id,
    p.is_active
FROM public.profiles p
LEFT JOIN public.businesses b ON b.owner_id = p.id AND p.role = 'admin'
LEFT JOIN public.business_employees be ON be.employee_id = p.id AND p.role = 'employee'
WHERE p.role IS NOT NULL
ON CONFLICT (user_id, role, business_id) DO NOTHING;

-- All users should also be clients by default (they can book appointments anywhere)
INSERT INTO public.user_roles (user_id, role, business_id, is_active)
SELECT 
    id as user_id,
    'client' as role,
    NULL as business_id,
    is_active
FROM public.profiles
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = profiles.id AND ur.role = 'client'
)
ON CONFLICT (user_id, role, business_id) DO NOTHING;

-- ============================================================================
-- STEP 3: Add active_role column to profiles (stores current active role)
-- ============================================================================

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS active_role user_role DEFAULT 'client';

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS active_business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.profiles.active_role IS 'Current role the user is interacting with the app';
COMMENT ON COLUMN public.profiles.active_business_id IS 'Business context when user is in admin/employee role';

-- Set active_role to their primary role
UPDATE public.profiles 
SET active_role = role 
WHERE active_role IS NULL;

-- ============================================================================
-- STEP 4: Create helper functions
-- ============================================================================

-- Function to get all roles for a user
CREATE OR REPLACE FUNCTION public.get_user_roles(user_uuid UUID)
RETURNS TABLE (
    role user_role,
    business_id UUID,
    business_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ur.role,
        ur.business_id,
        b.name as business_name
    FROM public.user_roles ur
    LEFT JOIN public.businesses b ON b.id = ur.business_id
    WHERE ur.user_id = user_uuid 
    AND ur.is_active = true
    ORDER BY ur.role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.user_has_role(user_uuid UUID, check_role user_role)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.user_roles 
        WHERE user_id = user_uuid 
        AND role = check_role 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to switch active role
CREATE OR REPLACE FUNCTION public.switch_active_role(
    user_uuid UUID, 
    new_role user_role,
    new_business_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    role_exists BOOLEAN;
BEGIN
    -- Check if user has this role
    SELECT EXISTS (
        SELECT 1 
        FROM public.user_roles 
        WHERE user_id = user_uuid 
        AND role = new_role 
        AND (business_id = new_business_id OR (business_id IS NULL AND new_business_id IS NULL))
        AND is_active = true
    ) INTO role_exists;
    
    IF NOT role_exists THEN
        RETURN FALSE;
    END IF;
    
    -- Update active role
    UPDATE public.profiles 
    SET 
        active_role = new_role,
        active_business_id = new_business_id,
        updated_at = NOW()
    WHERE id = user_uuid;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 5: Update RLS Policies
-- ============================================================================

-- Drop old policies that depend on profiles.role
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Recreate policies
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- RLS for user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles for their business"
    ON public.user_roles FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses b
            WHERE b.id = user_roles.business_id
            AND b.owner_id = auth.uid()
        )
    );

-- ============================================================================
-- STEP 6: Create triggers for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- STEP 7: Create views for easier querying
-- ============================================================================

CREATE OR REPLACE VIEW public.user_roles_view AS
SELECT 
    ur.id,
    ur.user_id,
    p.email,
    p.full_name,
    ur.role,
    ur.business_id,
    b.name as business_name,
    ur.is_active,
    ur.created_at
FROM public.user_roles ur
JOIN public.profiles p ON p.id = ur.user_id
LEFT JOIN public.businesses b ON b.id = ur.business_id
WHERE ur.is_active = true;

COMMENT ON VIEW public.user_roles_view IS 'User-friendly view of user roles with business names';

-- ============================================================================
-- NOTES:
-- ============================================================================
-- - The old profiles.role column is kept for backward compatibility temporarily
-- - active_role stores the current role the user is viewing the app with
-- - active_business_id stores the business context for admin/employee roles
-- - client role has NULL business_id (can interact with any business)
-- - admin/employee roles are tied to specific businesses
-- - One user can be admin of Business A, employee of Business B, and client everywhere
