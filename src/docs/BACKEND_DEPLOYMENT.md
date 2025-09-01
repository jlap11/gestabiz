# AppointmentPro - Backend Setup & Deployment Guide

## Supabase Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a project name (e.g., "appointmentpro")
3. Set a strong database password
4. Select your preferred region

### 2. Database Schema Setup

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the entire content from `src/database/schema.sql`
3. Paste it into a new query and run it
4. This will create all necessary tables, functions, triggers, and RLS policies

### 3. Environment Variables Setup

In your Supabase project settings, add the following secrets:

```bash
# SendGrid API Key (for email notifications)
SENDGRID_API_KEY=your_sendgrid_api_key_here

# From email address for notifications
FROM_EMAIL=noreply@yourdomain.com
```

### 4. Deploy Edge Functions

Install Supabase CLI:
```bash
npm install -g supabase
```

Login to Supabase:
```bash
supabase login
```

Initialize Supabase in your project (if not already done):
```bash
supabase init
```

Deploy the Edge Functions:
```bash
# Deploy send-email function
supabase functions deploy send-email --project-ref your-project-ref

# Deploy process-notifications function
supabase functions deploy process-notifications --project-ref your-project-ref
```

### 5. Setup Automatic Notification Processing

Option A: Using pg_cron (recommended for Pro plans):
```sql
-- Run this in Supabase SQL Editor
SELECT cron.schedule(
  'process-notifications',
  '* * * * *', -- Run every minute
  $$
    SELECT net.http_post(
      url := 'https://your-project-ref.supabase.co/functions/v1/process-notifications',
      headers := '{"Authorization": "Bearer YOUR_ANON_KEY", "Content-Type": "application/json"}'::jsonb
    );
  $$
);
```

Option B: Using external cron service (for free plans):
- Use services like cron-job.org, EasyCron, or GitHub Actions
- Set up a job to call your process-notifications function every minute

### 6. Configure Authentication

1. In Supabase Dashboard → Authentication → Settings
2. Enable Email authentication
3. For social logins (optional):
   - **Google**: Add OAuth app credentials
   - **Apple**: Add Sign in with Apple credentials
4. Configure email templates for auth emails

### 7. SendGrid Setup (for email notifications)

1. Create a SendGrid account at [sendgrid.com](https://sendgrid.com)
2. Create an API key with Mail Send permissions
3. Verify your sender domain/email
4. Add the API key to Supabase secrets

## Frontend Configuration

### 1. Environment Variables

Create a `.env.local` file in your web app:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Supabase Client Configuration

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## Testing the Setup

### 1. Test Database Connection
```typescript
// Test in browser console
const { data, error } = await supabase.from('users').select('*')
console.log('Users:', data, error)
```

### 2. Test Email Function
```typescript
// Test email sending
const { data, error } = await supabase.functions.invoke('send-email', {
  body: {
    to: 'test@example.com',
    subject: 'Test Email',
    html: '<h1>Test</h1><p>This is a test email.</p>',
    text: 'Test: This is a test email.'
  }
})
```

### 3. Test Notification Processing
```typescript
// Test notification processing
const { data, error } = await supabase.functions.invoke('process-notifications')
console.log('Processing result:', data, error)
```

## Production Deployment

### 1. Web App Deployment (Vercel)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard:
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Deploy the application

### 2. Mobile App Deployment

For React Native/Expo:
1. Update `app.json` with your app configuration
2. Build for production: `expo build:android` / `expo build:ios`
3. Submit to app stores

### 3. Browser Extension

1. Update manifest.json with production URLs
2. Build the extension: `npm run build`
3. Submit to Chrome Web Store / Edge Add-ons

## Security Considerations

1. **Row Level Security**: All tables have RLS enabled
2. **API Keys**: Store sensitive keys in Supabase secrets
3. **CORS**: Configure allowed origins for production
4. **Rate Limiting**: Consider implementing rate limiting for functions
5. **Data Validation**: Validate all inputs on both client and server

## Monitoring & Maintenance

1. **Database Monitoring**: Monitor query performance in Supabase dashboard
2. **Function Logs**: Check Edge Function logs for errors
3. **Email Delivery**: Monitor SendGrid dashboard for delivery rates
4. **Error Tracking**: Implement error tracking (e.g., Sentry)
5. **Backup Strategy**: Set up automated database backups

## Troubleshooting

### Common Issues:

1. **RLS Policy Errors**: Ensure user is authenticated and policies are correct
2. **Email Not Sending**: Check SendGrid API key and from email verification
3. **Function Timeouts**: Optimize Edge Functions for performance
4. **CORS Issues**: Configure CORS headers properly in functions

### Debug Commands:

```bash
# Check Supabase connection
supabase status

# View function logs
supabase functions logs process-notifications

# Test local functions
supabase functions serve --env-file .env.local
```

## Scaling Considerations

1. **Database**: Consider read replicas for high traffic
2. **Functions**: Monitor function invocation limits
3. **Email**: Upgrade SendGrid plan for higher volume
4. **CDN**: Use Vercel's CDN for global distribution
5. **Caching**: Implement caching strategies for frequently accessed data