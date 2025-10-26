-- ============================================================================
-- MIGRATION: Fix RLS recursion on user_permissions by using SECURITY DEFINER
-- Date: 2025-10-26
-- Purpose: Replace policies that directly query user_permissions within
--          user_permissions/business_roles/permission_templates policies,
--          which caused 42P17 infinite recursion. Use get_user_permissions()
--          (SECURITY DEFINER) for permission checks.
-- ============================================================================

-- Ensure RLS is enabled (idempotent)
ALTER TABLE IF EXISTS public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.business_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.permission_templates ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- user_permissions policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS user_permissions_insert ON public.user_permissions;
DROP POLICY IF EXISTS user_permissions_update ON public.user_permissions;
DROP POLICY IF EXISTS user_permissions_delete ON public.user_permissions;

-- INSERT: Owner or admin with 'permissions.modify'
CREATE POLICY user_permissions_insert ON public.user_permissions
  FOR INSERT
  WITH CHECK (
    is_business_owner(auth.uid(), business_id)
    OR EXISTS (
      SELECT 1 FROM get_user_permissions(auth.uid(), user_permissions.business_id) p
      WHERE p.permission = 'permissions.modify'
    )
  );

-- UPDATE: Owner or admin with 'permissions.modify'
CREATE POLICY user_permissions_update ON public.user_permissions
  FOR UPDATE
  USING (
    is_business_owner(auth.uid(), business_id)
    OR EXISTS (
      SELECT 1 FROM get_user_permissions(auth.uid(), user_permissions.business_id) p
      WHERE p.permission = 'permissions.modify'
    )
  )
  WITH CHECK (
    is_business_owner(auth.uid(), business_id)
    OR EXISTS (
      SELECT 1 FROM get_user_permissions(auth.uid(), user_permissions.business_id) p
      WHERE p.permission = 'permissions.modify'
    )
  );

-- DELETE: Owner or admin with 'permissions.revoke'
CREATE POLICY user_permissions_delete ON public.user_permissions
  FOR DELETE
  USING (
    is_business_owner(auth.uid(), business_id)
    OR EXISTS (
      SELECT 1 FROM get_user_permissions(auth.uid(), user_permissions.business_id) p
      WHERE p.permission = 'permissions.revoke'
    )
  );

-- ----------------------------------------------------------------------------
-- business_roles policies (replace direct query to user_permissions)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "business_roles_update" ON public.business_roles;
CREATE POLICY "business_roles_update" ON public.business_roles
  FOR UPDATE
  USING (
    is_business_owner(auth.uid(), business_id)
    OR EXISTS (
      SELECT 1 FROM get_user_permissions(auth.uid(), business_roles.business_id) p
      WHERE p.permission = 'permissions.modify'
    )
  )
  WITH CHECK (
    is_business_owner(auth.uid(), business_id)
    OR EXISTS (
      SELECT 1 FROM get_user_permissions(auth.uid(), business_roles.business_id) p
      WHERE p.permission = 'permissions.modify'
    )
  );

-- SELECT: Owner sees all, user sees own roles, or admin with 'permissions.view'
DROP POLICY IF EXISTS business_roles_select ON public.business_roles;
CREATE POLICY business_roles_select ON public.business_roles
  FOR SELECT
  USING (
    is_business_owner(auth.uid(), business_id)
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM get_user_permissions(auth.uid(), business_roles.business_id) p
      WHERE p.permission = 'permissions.view'
    )
  );

-- ----------------------------------------------------------------------------
-- permission_templates policies (replace direct query to user_permissions)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS permission_templates_select ON public.permission_templates;
DROP POLICY IF EXISTS permission_templates_insert ON public.permission_templates;
DROP POLICY IF EXISTS permission_templates_update ON public.permission_templates;

-- SELECT: System templates public, else owner or admin with 'permissions.view'
CREATE POLICY permission_templates_select ON public.permission_templates
  FOR SELECT
  USING (
    is_system_template = true
    OR is_business_owner(auth.uid(), business_id)
    OR EXISTS (
      SELECT 1 FROM get_user_permissions(auth.uid(), permission_templates.business_id) p
      WHERE p.permission = 'permissions.view'
    )
  );

-- INSERT: Owner or admin with 'permissions.modify'
CREATE POLICY permission_templates_insert ON public.permission_templates
  FOR INSERT
  WITH CHECK (
    is_business_owner(auth.uid(), business_id)
    OR EXISTS (
      SELECT 1 FROM get_user_permissions(auth.uid(), permission_templates.business_id) p
      WHERE p.permission = 'permissions.modify'
    )
  );

-- UPDATE: No system templates; owner or admin with 'permissions.modify'
CREATE POLICY permission_templates_update ON public.permission_templates
  FOR UPDATE
  USING (
    is_system_template = false
    AND (
      is_business_owner(auth.uid(), business_id)
      OR EXISTS (
        SELECT 1 FROM get_user_permissions(auth.uid(), permission_templates.business_id) p
        WHERE p.permission = 'permissions.modify'
      )
    )
  )
  WITH CHECK (
    is_system_template = false
    AND (
      is_business_owner(auth.uid(), business_id)
      OR EXISTS (
        SELECT 1 FROM get_user_permissions(auth.uid(), permission_templates.business_id) p
        WHERE p.permission = 'permissions.modify'
      )
    )
  );
