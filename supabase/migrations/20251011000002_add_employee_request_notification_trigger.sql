-- Migration: Add trigger to send email notifications when employee requests are created
-- Created: 2025-10-11
-- Description: Automatically sends email notification to business owner when a new employee request is created

-- Create function to call Edge Function via HTTP
CREATE OR REPLACE FUNCTION notify_employee_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  function_url TEXT;
  payload JSON;
BEGIN
  -- Only send notification for new requests
  IF TG_OP = 'INSERT' THEN
    -- Get the Supabase project URL from environment
    -- Note: You need to configure this in your Supabase project settings
    function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-employee-request-notification';
    
    -- Build payload
    payload := json_build_object('request_id', NEW.id);
    
    -- Call Edge Function asynchronously (fire and forget)
    -- Using pg_net extension if available, otherwise log for manual processing
    BEGIN
      PERFORM net.http_post(
        url := function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.anon_key', true)
        ),
        body := payload::jsonb
      );
    EXCEPTION
      WHEN OTHERS THEN
        -- If pg_net is not available, log the error but don't fail the transaction
        RAISE WARNING 'Failed to send employee request notification: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to execute function after insert
DROP TRIGGER IF EXISTS trigger_notify_employee_request ON employee_requests;

CREATE TRIGGER trigger_notify_employee_request
  AFTER INSERT ON employee_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_employee_request();

-- Add comment
COMMENT ON FUNCTION notify_employee_request() IS 
  'Sends email notification to business owner when a new employee request is created';
COMMENT ON TRIGGER trigger_notify_employee_request ON employee_requests IS 
  'Automatically sends email notification after new employee request';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION notify_employee_request() TO authenticated;
