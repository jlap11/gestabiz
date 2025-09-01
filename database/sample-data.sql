-- Sample data for testing AppointmentPro
-- Run this after the main schema to populate with test data

-- Insert sample users (these would normally be created via Supabase Auth)
-- Note: In production, users are created automatically via the auth trigger
INSERT INTO public.users (id, email, full_name) VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin@appointmentpro.com', 'Admin User'),
  ('22222222-2222-2222-2222-222222222222', 'demo@appointmentpro.com', 'Demo User')
ON CONFLICT (id) DO NOTHING;

-- Insert user settings for sample users
INSERT INTO public.user_settings (user_id, email_notifications_enabled, push_notifications_enabled, reminder_24h_enabled, reminder_1h_enabled, timezone) VALUES
  ('11111111-1111-1111-1111-111111111111', true, true, true, true, 'America/New_York'),
  ('22222222-2222-2222-2222-222222222222', true, true, true, true, 'America/Los_Angeles')
ON CONFLICT (user_id) DO NOTHING;

-- Insert sample appointments
INSERT INTO public.appointments (
  id,
  user_id,
  title,
  description,
  client_name,
  client_email,
  client_phone,
  appointment_date,
  appointment_time,
  duration,
  status,
  location,
  notes
) VALUES
  -- Future appointments
  (
    uuid_generate_v4(),
    '11111111-1111-1111-1111-111111111111',
    'Strategy Planning Session',
    'Quarterly business strategy review with key stakeholders',
    'Sarah Johnson',
    'sarah.johnson@techcorp.com',
    '+1-555-0123',
    CURRENT_DATE + INTERVAL '2 days',
    '09:00',
    120,
    'pending',
    'Conference Room A',
    'Bring Q4 financial reports'
  ),
  (
    uuid_generate_v4(),
    '11111111-1111-1111-1111-111111111111',
    'Client Consultation',
    'Initial consultation for new marketing campaign',
    'Michael Chen',
    'michael.chen@startupxyz.com',
    '+1-555-0456',
    CURRENT_DATE + INTERVAL '3 days',
    '14:30',
    60,
    'pending',
    'Office Suite 1200',
    'New client - first meeting'
  ),
  (
    uuid_generate_v4(),
    '11111111-1111-1111-1111-111111111111',
    'Project Review',
    'Monthly project status review',
    'Emily Rodriguez',
    'emily.rodriguez@designstudio.com',
    '+1-555-0789',
    CURRENT_DATE + INTERVAL '5 days',
    '11:00',
    90,
    'pending',
    'Virtual Meeting (Zoom)',
    'Review project milestones and deliverables'
  ),
  (
    uuid_generate_v4(),
    '22222222-2222-2222-2222-222222222222',
    'Product Demo',
    'Demo of new software features to potential client',
    'David Kim',
    'david.kim@enterprise.com',
    '+1-555-0321',
    CURRENT_DATE + INTERVAL '1 day',
    '15:00',
    45,
    'pending',
    'Customer Center',
    'Prepare demo environment'
  ),
  (
    uuid_generate_v4(),
    '22222222-2222-2222-2222-222222222222',
    'Team Sync',
    'Weekly team synchronization meeting',
    'Jennifer Wu',
    'jennifer.wu@company.com',
    '+1-555-0654',
    CURRENT_DATE + INTERVAL '4 days',
    '10:00',
    30,
    'pending',
    'Meeting Room B',
    'Weekly sync - progress updates'
  ),
  
  -- Today's appointments (for immediate testing)
  (
    uuid_generate_v4(),
    '11111111-1111-1111-1111-111111111111',
    'Morning Standup',
    'Daily team standup meeting',
    'Development Team',
    'team@appointmentpro.com',
    null,
    CURRENT_DATE,
    '09:30',
    15,
    'pending',
    'Development Office',
    'Daily standup - quick sync'
  ),
  (
    uuid_generate_v4(),
    '22222222-2222-2222-2222-222222222222',
    'Client Check-in',
    'Quick check-in with existing client',
    'Robert Brown',
    'robert.brown@client.com',
    '+1-555-0987',
    CURRENT_DATE,
    '16:00',
    30,
    'pending',
    'Phone Call',
    'Quick status update call'
  ),
  
  -- Past appointments (completed and cancelled)
  (
    uuid_generate_v4(),
    '11111111-1111-1111-1111-111111111111',
    'Completed Project Meeting',
    'Final project delivery meeting',
    'Lisa Park',
    'lisa.park@client.com',
    '+1-555-0246',
    CURRENT_DATE - INTERVAL '2 days',
    '13:00',
    60,
    'completed',
    'Client Office',
    'Project successfully delivered'
  ),
  (
    uuid_generate_v4(),
    '11111111-1111-1111-1111-111111111111',
    'Cancelled Training Session',
    'Training session that was cancelled',
    'Mark Thompson',
    'mark.thompson@training.com',
    '+1-555-0135',
    CURRENT_DATE - INTERVAL '1 day',
    '10:00',
    180,
    'cancelled',
    'Training Center',
    'Cancelled due to client emergency'
  ),
  (
    uuid_generate_v4(),
    '22222222-2222-2222-2222-222222222222',
    'Completed Consultation',
    'Initial consultation completed successfully',
    'Anna Davis',
    'anna.davis@newclient.com',
    '+1-555-0468',
    CURRENT_DATE - INTERVAL '3 days',
    '14:00',
    45,
    'completed',
    'Office',
    'Great initial meeting - moving forward'
  ),
  
  -- Appointments for next week (to test weekly stats)
  (
    uuid_generate_v4(),
    '11111111-1111-1111-1111-111111111111',
    'Next Week Planning',
    'Planning session for next week priorities',
    'Planning Team',
    'planning@company.com',
    null,
    CURRENT_DATE + INTERVAL '8 days',
    '09:00',
    90,
    'pending',
    'Planning Room',
    'Weekly planning session'
  ),
  (
    uuid_generate_v4(),
    '22222222-2222-2222-2222-222222222222',
    'Future Project Kickoff',
    'Kickoff meeting for new project',
    'Alex Wilson',
    'alex.wilson@newproject.com',
    '+1-555-0579',
    CURRENT_DATE + INTERVAL '10 days',
    '11:00',
    120,
    'pending',
    'Project Room',
    'New project kickoff - exciting opportunity'
  );

-- Note: Notifications will be automatically created for future appointments
-- due to the trigger we set up in the main schema

-- Verify sample data
SELECT 
  'Users' as table_name,
  COUNT(*) as record_count
FROM public.users
UNION ALL
SELECT 
  'Appointments' as table_name,
  COUNT(*) as record_count
FROM public.appointments
UNION ALL
SELECT 
  'User Settings' as table_name,
  COUNT(*) as record_count
FROM public.user_settings
UNION ALL
SELECT 
  'Notifications' as table_name,
  COUNT(*) as record_count
FROM public.notifications;

-- Show sample dashboard stats
SELECT 'Dashboard Stats for Admin User' as info;
SELECT get_dashboard_stats('11111111-1111-1111-1111-111111111111') as admin_stats;

SELECT 'Dashboard Stats for Demo User' as info;
SELECT get_dashboard_stats('22222222-2222-2222-2222-222222222222') as demo_stats;

-- Show upcoming appointments
SELECT 'Upcoming Appointments for Admin User' as info;
SELECT * FROM get_upcoming_appointments('11111111-1111-1111-1111-111111111111', 5);

SELECT 'Upcoming Appointments for Demo User' as info;
SELECT * FROM get_upcoming_appointments('22222222-2222-2222-2222-222222222222', 5);