# AppointmentPro Database & Backend Setup

This guide will help you set up the complete Supabase backend for AppointmentPro, including database schema, Edge Functions for notifications, and email integration.

## 🗄️ Database Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully initialized
3. Note down your project URL and anon key

### 2. Run Database Schema
1. Open the Supabase Dashboard
2. Go to the **SQL Editor**
3. Copy and paste the entire content from `database/schema.sql`
4. Click **Run** to execute the schema

This will create:
- ✅ User profiles table with automatic creation on signup
- ✅ Appointments table with status tracking
- ✅ Notifications table for automated reminders
- ✅ User settings for notification preferences
- ✅ Row Level Security (RLS) policies
- ✅ Automatic triggers for creating notifications
- ✅ Helper functions for dashboard stats and upcoming appointments

### 3. Verify Setup
After running the schema, verify in the **Table Editor**:
- `users` table
- `appointments` table  
- `notifications` table
- `user_settings` table

## 📧 Email Configuration

### Option 1: Resend (Recommended)
1. Sign up at [resend.com](https://resend.com)
2. Create an API key
3. Verify your domain (or use their sandbox for testing)

### Option 2: SendGrid
1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create an API key
3. Verify your sender identity

## 🔧 Edge Functions Setup

### Prerequisites
```bash
# Install Supabase CLI
npm install -g supabase

# Install Deno
curl -fsSL https://deno.land/x/install/install.sh | sh
```

### Deploy Functions
```bash
# Login to Supabase
supabase login

# Link your project (replace with your project ID)
supabase link --project-ref YOUR_PROJECT_ID

# Deploy notification function
supabase functions deploy send-notifications

# Deploy confirmation function  
supabase functions deploy send-confirmation
```

### Environment Variables
In your Supabase Dashboard, go to **Settings > Edge Functions** and add:

```bash
# Email Configuration
EMAIL_PROVIDER=resend
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=AppointmentPro <noreply@yourdomain.com>

# App Configuration
FRONTEND_URL=https://your-app-domain.vercel.app
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## ⏰ Automated Notifications

### Setup Cron Job
Run this in the **SQL Editor** to process notifications every minute:

```sql
SELECT cron.schedule(
  'process-notifications',
  '* * * * *',
  'SELECT net.http_post(
    url:=''https://YOUR_PROJECT_ID.supabase.co/functions/v1/send-notifications'',
    headers:=''{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}''::jsonb,
    body:=''{}''::jsonb
  ) as request_id;'
);
```

**Replace `YOUR_PROJECT_ID` and `YOUR_SERVICE_ROLE_KEY` with your actual values.**

## 🧪 Testing

### Test Database Functions
```sql
-- Test getting upcoming appointments
SELECT * FROM get_upcoming_appointments('user-id-here', 3);

-- Test dashboard stats
SELECT get_dashboard_stats('user-id-here');
```

### Test Edge Functions
```bash
# Test notifications
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/send-notifications \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"

# Test confirmation email
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/send-confirmation \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "appointment": {
      "title": "Test Meeting",
      "client_name": "John Doe",
      "client_email": "john@example.com",
      "appointment_date": "2024-01-20",
      "appointment_time": "10:00",
      "duration": 60
    }
  }'
```

## 🔐 Environment Variables for Frontend

Add these to your frontend application (Vercel, Netlify, etc.):

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## 📱 Integration with Your App

### 1. Install Supabase Client
```bash
npm install @supabase/supabase-js
```

### 2. Initialize Supabase
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)
```

### 3. Authentication
```typescript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
})

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})
```

### 4. Create Appointment with Email
```typescript
const { data: appointment, error } = await supabase
  .from('appointments')
  .insert({
    user_id: user.id,
    title: 'Client Meeting',
    client_name: 'John Doe',
    client_email: 'john@example.com',
    appointment_date: '2024-01-20',
    appointment_time: '10:00'
  })
  .select()
  .single()

if (appointment && !error) {
  // Send confirmation email
  await supabase.functions.invoke('send-confirmation', {
    body: { appointment }
  })
}
```

## 📊 Database Schema Overview

### Tables Created:
- **users**: User profiles (linked to auth.users)
- **appointments**: Appointment records with status tracking
- **notifications**: Automated notification queue
- **user_settings**: Notification preferences per user

### Key Features:
- ✅ Automatic user profile creation on signup
- ✅ RLS policies for data security
- ✅ Automatic notification creation for new appointments
- ✅ Flexible notification settings per user
- ✅ Dashboard statistics function
- ✅ Upcoming appointments API for browser extension

## 🚀 Production Checklist

- [ ] Database schema deployed
- [ ] RLS policies enabled and tested
- [ ] Edge Functions deployed
- [ ] Environment variables configured
- [ ] Cron job for notifications setup
- [ ] Email provider configured and tested
- [ ] Frontend environment variables set
- [ ] Authentication flow tested
- [ ] Appointment creation and notification flow tested

## 🛠️ Troubleshooting

### Common Issues:

1. **RLS Policy Errors**: Ensure user is authenticated and policies are correct
2. **Function Not Found**: Check deployment and project linking
3. **Email Not Sending**: Verify email provider configuration
4. **Notifications Not Processing**: Check cron job and function logs

### Debug Commands:
```bash
# View function logs
supabase functions logs send-notifications

# List all functions
supabase functions list

# Test function locally
supabase functions serve
```

This setup provides a complete, production-ready backend for your AppointmentPro application with automated notifications and email integration.