# Supabase Edge Functions Setup Guide

## Prerequisites

1. **Supabase CLI**: Install the Supabase CLI
```bash
npm install -g supabase
```

2. **Deno**: Edge Functions run on Deno runtime
```bash
# Install Deno (if not already installed)
curl -fsSL https://deno.land/x/install/install.sh | sh
```

## Environment Variables Setup

Create these environment variables in your Supabase project dashboard (Settings > Edge Functions):

```bash
# Email Provider Configuration (Choose one)
EMAIL_PROVIDER=resend  # or 'sendgrid' or 'dev'

# Resend Configuration (Recommended)
RESEND_API_KEY=your_resend_api_key_here
FROM_EMAIL=Bookio <noreply@yourdomain.com>

# SendGrid Configuration (Alternative)
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Application URLs
FRONTEND_URL=https://your-app.vercel.app
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Expo Push Notifications (for mobile app)
EXPO_ACCESS_TOKEN=your_expo_access_token
```

## Deployment Commands

### 1. Login to Supabase
```bash
supabase login
```

### 2. Link your project
```bash
supabase link --project-ref YOUR_PROJECT_ID
```

### 3. Deploy the notification function
```bash
supabase functions deploy send-notifications
```

### 4. Deploy the confirmation function
```bash
supabase functions deploy send-confirmation
```

## Function URLs

After deployment, your functions will be available at:
- **Notifications**: `https://YOUR_PROJECT_ID.supabase.co/functions/v1/send-notifications`
- **Confirmations**: `https://YOUR_PROJECT_ID.supabase.co/functions/v1/send-confirmation`

## Setting up Automatic Notification Processing

### Option 1: Supabase Cron Jobs (Recommended)

Create a cron job in Supabase to automatically process notifications:

```sql
-- Run in Supabase SQL Editor
SELECT cron.schedule(
  'process-notifications',
  '* * * * *', -- Every minute
  'SELECT net.http_post(
    url:=''https://YOUR_PROJECT_ID.supabase.co/functions/v1/send-notifications'',
    headers:=''{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}''::jsonb,
    body:=''{}''::jsonb
  ) as request_id;'
);
```

### Option 2: External Cron Service

Use services like:
- **Cron-job.org**
- **EasyCron**
- **GitHub Actions** (scheduled workflows)

Configure to call your notification endpoint every minute:
```
GET https://YOUR_PROJECT_ID.supabase.co/functions/v1/send-notifications
Authorization: Bearer YOUR_SERVICE_ROLE_KEY
```

## Testing the Functions

### 1. Test Notification Processing
```bash
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/send-notifications \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

### 2. Test Appointment Confirmation
```bash
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/send-confirmation \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "appointment": {
      "id": "test-id",
      "user_id": "user-id",
      "title": "Test Appointment",
      "client_name": "John Doe",
      "client_email": "john@example.com",
      "appointment_date": "2024-01-20",
      "appointment_time": "10:00",
      "duration": 60,
      "description": "Test appointment"
    }
  }'
```

## Function Details

### send-notifications Function
- **Purpose**: Processes pending notifications and sends emails/push notifications
- **Triggered**: Automatically via cron job every minute
- **Input**: None (fetches from database)
- **Output**: Processing results

### send-confirmation Function
- **Purpose**: Sends confirmation emails when appointments are created
- **Triggered**: Called from your app when creating appointments
- **Input**: Appointment data
- **Output**: Success/failure status

## Email Provider Setup

### Resend (Recommended)
1. Sign up at [resend.com](https://resend.com)
2. Create an API key
3. Verify your domain
4. Add `RESEND_API_KEY` and `FROM_EMAIL` to environment variables

### SendGrid (Alternative)
1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create an API key
3. Verify your sender identity
4. Add `SENDGRID_API_KEY` and `SENDGRID_FROM_EMAIL` to environment variables

## Development Testing

For development, set `EMAIL_PROVIDER=dev` to log emails to console instead of sending them.

## Monitoring and Logs

View function logs:
```bash
supabase functions logs send-notifications
supabase functions logs send-confirmation
```

## Security Notes

- Use service role key only in secure environments
- Never expose service role key in client-side code
- Use environment variables for all sensitive data
- Enable RLS policies on all tables

## Troubleshooting

### Common Issues:

1. **Function not found**: Ensure proper deployment and project linking
2. **Permission denied**: Check service role key and RLS policies
3. **Email not sending**: Verify email provider configuration
4. **Notifications not processing**: Check cron job setup and function logs

### Debug Commands:
```bash
# Check function status
supabase functions list

# View logs
supabase functions logs send-notifications --follow

# Test locally
supabase functions serve send-notifications
```