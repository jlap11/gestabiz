# Google Calendar Integration - Setup Guide

## Prerequisites

1. **Google Cloud Console Setup**
2. **Supabase Project**
3. **Email Service Provider** (Resend, SendGrid, etc.)

## 1. Google Cloud Console Configuration

### Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Name: "Bookio Calendar Sync"
   - Authorized redirect URIs:
     - `http://localhost:5173/auth/google/callback` (development)
     - `https://your-domain.com/auth/google/callback` (production)

5. Note down the Client ID and Client Secret

## 2. Environment Variables

### Frontend (.env.local)
```bash
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Edge Functions
```bash
# Set these in your Supabase project settings
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
RESEND_API_KEY=your_resend_api_key
```

## 3. Supabase Setup

### Deploy the Database Schema

1. Go to your Supabase project dashboard
2. Navigate to "SQL Editor"
3. Copy and paste the contents of `src/database/schema.sql`
4. Execute the script

### Deploy Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy send-email-reminder
supabase functions deploy process-notifications
supabase functions deploy google-calendar-sync

# Set environment variables
supabase secrets set GOOGLE_CLIENT_ID=your_google_client_id
supabase secrets set GOOGLE_CLIENT_SECRET=your_google_client_secret
supabase secrets set RESEND_API_KEY=your_resend_api_key
```

## 4. Email Service Setup (Resend)

1. Sign up at [Resend.com](https://resend.com)
2. Verify your domain or use their test domain
3. Generate an API key
4. Add the API key to your Supabase secrets

## 5. Cron Job Setup

Set up a cron job to process notifications automatically:

```bash
# Call this endpoint every 5 minutes
curl -X POST \
  https://your-project-ref.supabase.co/functions/v1/process-notifications \
  -H "Authorization: Bearer your-service-role-key"
```

### Using Supabase Cron (pg_cron extension)

```sql
-- Enable the pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule notification processing every 5 minutes
SELECT cron.schedule(
  'process-notifications',
  '*/5 * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://your-project-ref.supabase.co/functions/v1/process-notifications',
      headers := '{"Authorization": "Bearer your-service-role-key", "Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);
```

## 6. Testing the Integration

### Test Google Calendar Connection

1. Log into your app
2. Go to Settings > Google Calendar Integration
3. Click "Connect Google Calendar"
4. Complete the OAuth flow
5. Check that sync settings are saved

### Test Notification System

1. Create a test appointment 1 hour in the future
2. Check that notifications are created in the database
3. Wait for the cron job to process notifications
4. Verify email delivery

### Test Calendar Sync

1. Create an appointment in your app
2. Check that it appears in Google Calendar
3. Create an event in Google Calendar
4. Run manual sync to verify it imports

## 7. Production Deployment

### Frontend Deployment (Vercel/Netlify)

1. Set environment variables in your hosting platform
2. Update redirect URIs in Google Cloud Console
3. Deploy your application

### Database Backup

```sql
-- Create a backup before going live
pg_dump your_database > backup.sql
```

## 8. Security Considerations

1. **Token Storage**: Access and refresh tokens should be encrypted in the database
2. **API Keys**: Never expose API keys in frontend code
3. **HTTPS**: Always use HTTPS in production
4. **Rate Limiting**: Implement rate limiting for API calls
5. **User Permissions**: Verify user permissions before sync operations

## 9. Monitoring

### Key Metrics to Monitor

1. **Sync Success Rate**: Monitor failed sync operations
2. **Notification Delivery**: Track email delivery rates
3. **API Usage**: Monitor Google Calendar API quota
4. **Database Performance**: Monitor query performance

### Logging

```sql
-- Query to check sync errors
SELECT 
  u.email,
  css.provider,
  css.sync_errors,
  css.last_sync
FROM calendar_sync_settings css
JOIN users u ON u.id = css.user_id
WHERE array_length(css.sync_errors, 1) > 0;

-- Query to check notification failures
SELECT 
  n.type,
  n.delivery_method,
  n.status,
  n.error_message,
  COUNT(*)
FROM notifications n
WHERE n.status = 'failed'
  AND n.created_at > NOW() - INTERVAL '24 hours'
GROUP BY n.type, n.delivery_method, n.status, n.error_message;
```

## 10. Troubleshooting

### Common Issues

1. **OAuth Redirect Mismatch**: Verify redirect URIs in Google Cloud Console
2. **Token Expiration**: Implement proper token refresh logic
3. **Calendar Permissions**: Ensure proper calendar scope permissions
4. **Email Delivery Issues**: Check email service provider logs
5. **Database Permissions**: Verify RLS policies are correctly configured

### Debug Commands

```bash
# Test edge function locally
supabase functions serve --debug

# Check function logs
supabase functions logs send-email-reminder

# Test database connection
psql "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
```

## 11. API Endpoints

### Google Calendar Sync
```bash
POST https://your-project-ref.supabase.co/functions/v1/google-calendar-sync
{
  "userId": "user-uuid",
  "direction": "both" // "both", "export_only", "import_only"
}
```

### Process Notifications
```bash
POST https://your-project-ref.supabase.co/functions/v1/process-notifications
{}
```

### Send Email Reminder
```bash
POST https://your-project-ref.supabase.co/functions/v1/send-email-reminder
{
  "notificationId": "notification-uuid",
  "appointmentId": "appointment-uuid"
}
```