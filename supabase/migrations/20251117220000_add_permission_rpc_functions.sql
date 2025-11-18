-- Migration: Add RPC Function for Permission Revocation
-- Created: 2025-11-17
-- Purpose: Create RPC function to revoke permissions with proper auth context
-- Solves: Audit trigger limitation when revoking permissions via direct SQL

-- ============================================================================
-- FUNCTION: revoke_user_permission
-- ============================================================================
-- Purpose: Revoke a permission from a user with automatic audit logging
-- Auth: Requires authenticated user (auth.uid() must be available)
-- Security: SECURITY DEFINER to bypass RLS and access audit_user_permissions_changes trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION revoke_user_permission(
  p_business_id UUID,
  p_user_id UUID,
  p_permission TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_rows_affected INTEGER;
  v_was_active BOOLEAN;
  v_revoked_by UUID;
BEGIN
  -- Get current auth user
  v_revoked_by := auth.uid();
  
  -- Check if user is authenticated
  IF v_revoked_by IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Authentication required',
      'message', 'Must be authenticated to revoke permissions'
    );
  END IF;
  
  -- Check if permission exists and is active
  SELECT is_active INTO v_was_active
  FROM user_permissions
  WHERE business_id = p_business_id
    AND user_id = p_user_id
    AND permission = p_permission;
  
  -- If permission doesn't exist
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Permission not found',
      'message', 'The specified permission does not exist for this user'
    );
  END IF;
  
  -- If permission already revoked
  IF v_was_active = false THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Already revoked',
      'message', 'This permission is already revoked'
    );
  END IF;
  
  -- Revoke permission (trigger will handle audit log)
  UPDATE user_permissions
  SET 
    is_active = false,
    notes = COALESCE(p_notes, 'Revoked via RPC function'),
    updated_at = NOW()
  WHERE business_id = p_business_id
    AND user_id = p_user_id
    AND permission = p_permission
    AND is_active = true;
  
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  
  -- Build success response
  SELECT jsonb_build_object(
    'success', true,
    'rows_affected', v_rows_affected,
    'business_id', p_business_id,
    'user_id', p_user_id,
    'permission', p_permission,
    'revoked_at', NOW(),
    'revoked_by', v_revoked_by,
    'notes', COALESCE(p_notes, 'Revoked via RPC function')
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: assign_user_permission
-- ============================================================================
-- Purpose: Assign or re-activate a permission for a user
-- Auth: Requires authenticated user (auth.uid() must be available)
-- Security: SECURITY DEFINER to bypass RLS
-- ============================================================================

CREATE OR REPLACE FUNCTION assign_user_permission(
  p_business_id UUID,
  p_user_id UUID,
  p_permission TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_rows_affected INTEGER;
  v_granted_by UUID;
  v_operation TEXT;
BEGIN
  -- Get current auth user
  v_granted_by := auth.uid();
  
  -- Check if user is authenticated
  IF v_granted_by IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Authentication required',
      'message', 'Must be authenticated to assign permissions'
    );
  END IF;
  
  -- Insert or update permission
  INSERT INTO user_permissions (
    business_id, user_id, permission, granted_by, is_active, notes
  )
  VALUES (
    p_business_id, p_user_id, p_permission, v_granted_by, true,
    COALESCE(p_notes, 'Assigned via RPC function')
  )
  ON CONFLICT (business_id, user_id, permission)
  DO UPDATE SET
    is_active = true,
    granted_by = v_granted_by,
    notes = COALESCE(p_notes, 'Re-activated via RPC function'),
    updated_at = NOW();
  
  -- Determine if was insert or update
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  
  IF v_rows_affected > 0 THEN
    v_operation := 'assigned';
  ELSE
    v_operation := 'updated';
  END IF;
  
  -- Build success response
  SELECT jsonb_build_object(
    'success', true,
    'operation', v_operation,
    'business_id', p_business_id,
    'user_id', p_user_id,
    'permission', p_permission,
    'granted_at', NOW(),
    'granted_by', v_granted_by,
    'notes', COALESCE(p_notes, 'Assigned via RPC function')
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: bulk_assign_permissions_from_template
-- ============================================================================
-- Purpose: Apply all permissions from a template to a user
-- Auth: Requires authenticated user
-- Security: SECURITY DEFINER
-- ============================================================================

CREATE OR REPLACE FUNCTION bulk_assign_permissions_from_template(
  p_business_id UUID,
  p_user_id UUID,
  p_template_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_granted_by UUID;
  v_permissions_count INTEGER;
  v_template_name TEXT;
BEGIN
  -- Get current auth user
  v_granted_by := auth.uid();
  
  -- Check authentication
  IF v_granted_by IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Authentication required'
    );
  END IF;
  
  -- Get template info
  SELECT name, jsonb_array_length(permissions)
  INTO v_template_name, v_permissions_count
  FROM permission_templates
  WHERE id = p_template_id AND business_id = p_business_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Template not found'
    );
  END IF;
  
  -- Apply permissions from template
  WITH template AS (
    SELECT permissions FROM permission_templates
    WHERE id = p_template_id
  ),
  permisos_array AS (
    SELECT jsonb_array_elements_text(permissions) as permission
    FROM template
  )
  INSERT INTO user_permissions (business_id, user_id, permission, granted_by, is_active, notes)
  SELECT 
    p_business_id,
    p_user_id,
    permission,
    v_granted_by,
    true,
    COALESCE(p_notes, 'Applied from template: ' || v_template_name)
  FROM permisos_array
  ON CONFLICT (business_id, user_id, permission)
  DO UPDATE SET
    is_active = true,
    granted_by = v_granted_by,
    notes = COALESCE(p_notes, 'Re-activated from template: ' || v_template_name),
    updated_at = NOW();
  
  -- Build response
  SELECT jsonb_build_object(
    'success', true,
    'template_name', v_template_name,
    'permissions_applied', v_permissions_count,
    'user_id', p_user_id,
    'applied_at', NOW(),
    'applied_by', v_granted_by
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Allow authenticated users to call these functions
GRANT EXECUTE ON FUNCTION revoke_user_permission TO authenticated;
GRANT EXECUTE ON FUNCTION assign_user_permission TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_assign_permissions_from_template TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Test revoke function (requires auth context)
/*
SELECT revoke_user_permission(
  'business_id_here',
  'user_id_here',
  'permission_to_revoke',
  'Revoked for testing'
);
*/

-- Test assign function
/*
SELECT assign_user_permission(
  'business_id_here',
  'user_id_here',
  'permission_to_assign',
  'Assigned for testing'
);
*/

-- Test bulk apply from template
/*
SELECT bulk_assign_permissions_from_template(
  'business_id_here',
  'user_id_here',
  'template_id_here',
  'Applied Vendedor template'
);
*/

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

/*
DROP FUNCTION IF EXISTS revoke_user_permission;
DROP FUNCTION IF EXISTS assign_user_permission;
DROP FUNCTION IF EXISTS bulk_assign_permissions_from_template;
*/
