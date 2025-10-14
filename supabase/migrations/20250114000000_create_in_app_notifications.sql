-- Migration: Create in_app_notifications table
-- Description: Sistema de notificaciones in-app para la aplicación
-- Date: 2025-01-14

-- Create in_app_notifications table
CREATE TABLE IF NOT EXISTS in_app_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  action_label TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_user_id ON in_app_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_created_at ON in_app_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_is_read ON in_app_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_is_deleted ON in_app_notifications(is_deleted);
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_type ON in_app_notifications(type);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_user_unread 
  ON in_app_notifications(user_id, is_read, is_deleted, created_at DESC);

-- Enable RLS
ALTER TABLE in_app_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON in_app_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON in_app_notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
  ON in_app_notifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON in_app_notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_as_read(notification_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE in_app_notifications
  SET is_read = TRUE, read_at = NOW()
  WHERE id = notification_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE in_app_notifications
  SET is_read = TRUE, read_at = NOW()
  WHERE user_id = p_user_id AND user_id = auth.uid() AND is_read = FALSE AND is_deleted = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to soft delete notification
CREATE OR REPLACE FUNCTION delete_notification(notification_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE in_app_notifications
  SET is_deleted = TRUE, deleted_at = NOW()
  WHERE id = notification_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM in_app_notifications
  WHERE user_id = p_user_id 
    AND user_id = auth.uid()
    AND is_read = FALSE 
    AND is_deleted = FALSE;
$$ LANGUAGE sql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE in_app_notifications IS 'Sistema de notificaciones in-app para usuarios';
COMMENT ON COLUMN in_app_notifications.type IS 'Tipo de notificación: appointment, payment, system, etc';
COMMENT ON COLUMN in_app_notifications.is_deleted IS 'Soft delete flag - las notificaciones no se eliminan físicamente';
