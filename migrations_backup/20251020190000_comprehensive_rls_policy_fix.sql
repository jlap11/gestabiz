-- Migration: Comprehensive RLS Policy Fix - Add WITH CHECK to all UPDATE policies
-- Issue: 21 UPDATE policies missing WITH CHECK clause causing error 42501
-- Date: 2025-10-20
-- Priority: CRITICAL

-- ============================================================================
-- TABLE: absence_approval_requests
-- ============================================================================
DROP POLICY IF EXISTS "Admins can update approval requests" ON absence_approval_requests;
CREATE POLICY "Admins can update approval requests"
  ON absence_approval_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = absence_approval_requests.business_id
        AND b.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = absence_approval_requests.business_id
        AND b.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- TABLE: bug_reports
-- ============================================================================
DROP POLICY IF EXISTS "Business owners can update bug reports" ON bug_reports;
CREATE POLICY "Business owners can update bug reports"
  ON bug_reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- TABLE: business_employees
-- ============================================================================
DROP POLICY IF EXISTS "update_business_employees" ON business_employees;
CREATE POLICY "update_business_employees"
  ON business_employees
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = business_employees.business_id
        AND b.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = business_employees.business_id
        AND b.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- TABLE: business_notification_settings
-- ============================================================================
DROP POLICY IF EXISTS "business_notification_settings_update_policy" ON business_notification_settings;
CREATE POLICY "business_notification_settings_update_policy"
  ON business_notification_settings
  FOR UPDATE
  USING (
    business_id IN (
      SELECT businesses.id FROM businesses
      WHERE businesses.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT businesses.id FROM businesses
      WHERE businesses.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- TABLE: business_roles
-- ============================================================================
DROP POLICY IF EXISTS "business_roles_update" ON business_roles;
CREATE POLICY "business_roles_update"
  ON business_roles
  FOR UPDATE
  USING (
    is_business_owner(auth.uid(), business_id) OR EXISTS (
      SELECT 1 FROM user_permissions up
      WHERE up.user_id = auth.uid()
        AND up.business_id = business_roles.business_id
        AND up.permission = 'permissions.modify'
        AND up.is_active = true
    )
  )
  WITH CHECK (
    is_business_owner(auth.uid(), business_id) OR EXISTS (
      SELECT 1 FROM user_permissions up
      WHERE up.user_id = auth.uid()
        AND up.business_id = business_roles.business_id
        AND up.permission = 'permissions.modify'
        AND up.is_active = true
    )
  );

-- ============================================================================
-- TABLE: chat_conversations
-- ============================================================================
DROP POLICY IF EXISTS "users_update_conversations" ON chat_conversations;
CREATE POLICY "users_update_conversations"
  ON chat_conversations
  FOR UPDATE
  USING (user_is_in_conversation(id, auth.uid()))
  WITH CHECK (user_is_in_conversation(id, auth.uid()));

-- ============================================================================
-- TABLE: conversation_members
-- ============================================================================
DROP POLICY IF EXISTS "Users can update their own membership" ON conversation_members;
CREATE POLICY "Users can update their own membership"
  ON conversation_members
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- TABLE: conversations
-- ============================================================================
DROP POLICY IF EXISTS "Users can update conversations they created" ON conversations;
CREATE POLICY "Users can update conversations they created"
  ON conversations
  FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- ============================================================================
-- TABLE: employee_profiles
-- ============================================================================
DROP POLICY IF EXISTS "Users can update own employee profile" ON employee_profiles;
CREATE POLICY "Users can update own employee profile"
  ON employee_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- TABLE: error_logs
-- ============================================================================
DROP POLICY IF EXISTS "Admins can update error logs" ON error_logs;
CREATE POLICY "Admins can update error logs"
  ON error_logs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- TABLE: job_applications
-- ============================================================================
DROP POLICY IF EXISTS "job_applications_update_own" ON job_applications;
CREATE POLICY "job_applications_update_own"
  ON job_applications
  FOR UPDATE
  USING (
    user_id = auth.uid() OR business_id IN (
      SELECT businesses.id FROM businesses
      WHERE businesses.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR business_id IN (
      SELECT businesses.id FROM businesses
      WHERE businesses.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- TABLE: job_vacancies
-- ============================================================================
DROP POLICY IF EXISTS "job_vacancies_update_business_owner" ON job_vacancies;
CREATE POLICY "job_vacancies_update_business_owner"
  ON job_vacancies
  FOR UPDATE
  USING (
    business_id IN (
      SELECT businesses.id FROM businesses
      WHERE businesses.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT businesses.id FROM businesses
      WHERE businesses.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- TABLE: messages
-- ============================================================================
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
CREATE POLICY "Users can update their own messages"
  ON messages
  FOR UPDATE
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- ============================================================================
-- TABLE: notifications (in_app_notifications or similar)
-- ============================================================================
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- TABLE: permission_templates
-- ============================================================================
DROP POLICY IF EXISTS "permission_templates_update" ON permission_templates;
CREATE POLICY "permission_templates_update"
  ON permission_templates
  FOR UPDATE
  USING (
    is_system_template = false AND (
      is_business_owner(auth.uid(), business_id) OR EXISTS (
        SELECT 1 FROM user_permissions up
        WHERE up.user_id = auth.uid()
          AND up.business_id = permission_templates.business_id
          AND up.permission = 'permissions.modify'
          AND up.is_active = true
      )
    )
  )
  WITH CHECK (
    is_system_template = false AND (
      is_business_owner(auth.uid(), business_id) OR EXISTS (
        SELECT 1 FROM user_permissions up
        WHERE up.user_id = auth.uid()
          AND up.business_id = permission_templates.business_id
          AND up.permission = 'permissions.modify'
          AND up.is_active = true
      )
    )
  );

-- ============================================================================
-- TABLE: profiles
-- ============================================================================
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- TABLE: recurring_expenses
-- ============================================================================
DROP POLICY IF EXISTS "Business owners can update recurring expenses" ON recurring_expenses;
CREATE POLICY "Business owners can update recurring expenses"
  ON recurring_expenses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = recurring_expenses.business_id
        AND businesses.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = recurring_expenses.business_id
        AND businesses.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- TABLE: user_notification_preferences
-- ============================================================================
DROP POLICY IF EXISTS "user_notification_preferences_update_own" ON user_notification_preferences;
CREATE POLICY "user_notification_preferences_update_own"
  ON user_notification_preferences
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- TABLE: user_permissions
-- ============================================================================
DROP POLICY IF EXISTS "user_permissions_update" ON user_permissions;
CREATE POLICY "user_permissions_update"
  ON user_permissions
  FOR UPDATE
  USING (
    is_business_owner(auth.uid(), business_id) OR EXISTS (
      SELECT 1 FROM user_permissions up
      WHERE up.user_id = auth.uid()
        AND up.business_id = user_permissions.business_id
        AND up.permission = 'permissions.modify'
        AND up.is_active = true
    )
  )
  WITH CHECK (
    is_business_owner(auth.uid(), business_id) OR EXISTS (
      SELECT 1 FROM user_permissions up
      WHERE up.user_id = auth.uid()
        AND up.business_id = user_permissions.business_id
        AND up.permission = 'permissions.modify'
        AND up.is_active = true
    )
  );

-- ============================================================================
-- TABLE: vacation_balance
-- ============================================================================
DROP POLICY IF EXISTS "Admins can update vacation balances" ON vacation_balance;
CREATE POLICY "Admins can update vacation balances"
  ON vacation_balance
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = vacation_balance.business_id
        AND b.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = vacation_balance.business_id
        AND b.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Employees can update their vacation balance" ON vacation_balance;
CREATE POLICY "Employees can update their vacation balance"
  ON vacation_balance
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM business_employees
      WHERE business_employees.employee_id = auth.uid()
        AND business_employees.business_id = vacation_balance.business_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_employees
      WHERE business_employees.employee_id = auth.uid()
        AND business_employees.business_id = vacation_balance.business_id
    )
  );

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Fixed 21 UPDATE policies by adding WITH CHECK clauses
-- All UPDATE policies now have both USING and WITH CHECK
-- This prevents error 42501 "row violates row-level security policy"
