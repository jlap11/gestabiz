-- Migration: Add trigger for job application notifications
-- Description: Notifies business owner when a new job application is received
-- Date: 2025-01-20

-- Function to send notification when application is received
CREATE OR REPLACE FUNCTION notify_application_received()
RETURNS TRIGGER AS $$
DECLARE
  v_vacancy_title TEXT;
  v_business_owner_id UUID;
  v_applicant_name TEXT;
BEGIN
  -- Get vacancy title
  SELECT title INTO v_vacancy_title
  FROM job_vacancies
  WHERE id = NEW.vacancy_id;

  -- Get business owner_id
  SELECT owner_id INTO v_business_owner_id
  FROM businesses b
  JOIN job_vacancies jv ON jv.business_id = b.id
  WHERE jv.id = NEW.vacancy_id;

  -- Get applicant name
  SELECT full_name INTO v_applicant_name
  FROM profiles
  WHERE id = NEW.user_id;

  -- Insert notification
  INSERT INTO in_app_notifications (
    user_id,
    type,
    title,
    message,
    status,
    priority,
    data
  ) VALUES (
    v_business_owner_id,
    'job_application',
    'Nueva aplicación recibida',
    v_applicant_name || ' ha aplicado a la vacante "' || v_vacancy_title || '"',
    'unread',
    1,
    jsonb_build_object(
      'application_id', NEW.id,
      'vacancy_id', NEW.vacancy_id,
      'applicant_id', NEW.user_id,
      'status', NEW.status
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_application_created ON job_applications;
CREATE TRIGGER on_application_created
  AFTER INSERT ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_application_received();

-- Add comment
COMMENT ON FUNCTION notify_application_received() IS 
  'Notifies business owner when a new job application is received';
