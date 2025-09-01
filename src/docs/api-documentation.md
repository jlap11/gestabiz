# AppointmentPro API Documentation

This document describes the complete API for the AppointmentPro micro SaaS system.

## Table of Contents

1. [Authentication](#authentication)
2. [Database Tables](#database-tables)
3. [Edge Functions](#edge-functions)
4. [Client Integration](#client-integration)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)

## Authentication

AppointmentPro uses Supabase Auth with support for:
- Email/Password authentication
- Google OAuth
- Apple OAuth (mobile)

### Auth Headers
```
Authorization: Bearer <jwt_token>
apikey: <supabase_anon_key>
```

## Database Tables

### Users Table
```sql
CREATE TABLE public.users (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  notification_preferences JSONB DEFAULT '{"email": true, "push": true, "reminder_1d": true, "reminder_1h": true}'::jsonb,
  push_tokens TEXT[] DEFAULT '{}',
  extension_auth_token TEXT,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### Appointments Table
```sql
CREATE TABLE public.appointments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  location TEXT,
  notes TEXT,
  reminder_sent_1d BOOLEAN DEFAULT FALSE,
  reminder_sent_1h BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### Notifications Table
```sql
CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('reminder_1d', 'reminder_1h', 'appointment_created', 'appointment_updated', 'appointment_cancelled')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  channel TEXT DEFAULT 'email' CHECK (channel IN ('email', 'push', 'sms')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

## Edge Functions

All Edge Functions are deployed to Supabase and accessible at:
`https://YOUR_PROJECT_REF.supabase.co/functions/v1/FUNCTION_NAME`

### 1. Send Email (`/send-email`)

Sends email notifications using SendGrid.

**Method:** `POST`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "to": "user@example.com",
  "subject": "Appointment Reminder",
  "html": "<h1>Your appointment</h1><p>Details...</p>",
  "text": "Your appointment details...",
  "notification_id": "uuid-optional",
  "appointment_id": "uuid-optional"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email sent successfully"
}
```

**Example Usage:**
```javascript
const { data, error } = await supabase.functions.invoke('send-email', {
  body: {
    to: 'client@example.com',
    subject: 'Appointment Confirmation',
    html: emailTemplate,
    text: 'Your appointment has been confirmed.'
  }
})
```

### 2. Process Notifications (`/process-notifications`)

Processes pending notifications and sends them via appropriate channels.

**Method:** `POST`

**Headers:**
```
Authorization: Bearer <service_role_key>
Content-Type: application/json
```

**Request Body:**
```json
{}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification processing complete",
  "processed": 5,
  "failed": 0
}
```

**Cron Setup:**
```sql
SELECT cron.schedule(
  'process-notifications',
  '* * * * *', -- Every minute
  $$
    SELECT net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-notifications',
      headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb
    );
  $$
);
```

### 3. Send Push Notification (`/send-push-notification`)

Sends push notifications to mobile devices via Expo.

**Method:** `POST`

**Headers:**
```
Authorization: Bearer <service_role_key>
Content-Type: application/json
```

**Request Body:**
```json
{
  "user_id": "uuid",
  "title": "Appointment Reminder",
  "body": "Your appointment starts in 1 hour",
  "data": {
    "type": "appointment_reminder",
    "appointment_id": "uuid"
  },
  "badge": 1,
  "sound": "default"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Push notification sent successfully",
  "expo_response": { ... }
}
```

### 4. Browser Extension Data (`/browser-extension-data`)

Provides appointment data formatted for browser extension.

**Method:** `POST`

**Headers:**
```
Authorization: Bearer <anon_key>
Content-Type: application/json
```

**Request Body:**
```json
{
  "user_id": "uuid",
  "limit": 5
}
```

**Response:**
```json
{
  "success": true,
  "appointments": [
    {
      "id": "uuid",
      "title": "Client Meeting",
      "client": "John Doe",
      "datetime": "2024-01-15T10:00:00Z",
      "location": "Office",
      "status": "scheduled",
      "timeUntil": "2 hours"
    }
  ],
  "stats": {
    "total": 25,
    "scheduled": 15,
    "completed": 8,
    "cancelled": 2,
    "this_week": 5,
    "next_week": 3
  },
  "timestamp": "2024-01-15T08:00:00Z"
}
```

## Client Integration

### Web App (React)

**Setup Supabase Client:**
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)
```

**Create Appointment:**
```typescript
const createAppointment = async (appointmentData) => {
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      user_id: user.id,
      title: appointmentData.title,
      client_name: appointmentData.clientName,
      start_time: appointmentData.startTime,
      end_time: appointmentData.endTime,
      location: appointmentData.location
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}
```

**Get Appointments:**
```typescript
const getAppointments = async (userId: string) => {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      id,
      title,
      description,
      client_name,
      client_email,
      start_time,
      end_time,
      status,
      location,
      notes
    `)
    .eq('user_id', userId)
    .order('start_time', { ascending: true })
  
  if (error) throw error
  return data
}
```

**Real-time Subscriptions:**
```typescript
const subscribeToAppointments = (userId: string, callback: (payload: any) => void) => {
  const subscription = supabase
    .channel('appointments')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'appointments',
      filter: `user_id=eq.${userId}`
    }, callback)
    .subscribe()
  
  return subscription
}
```

### Mobile App (React Native/Expo)

**Setup Supabase Client:**
```typescript
import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabase = createClient(
  'https://YOUR_PROJECT_REF.supabase.co',
  'your_anon_key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)
```

**Push Notification Setup:**
```typescript
import * as Notifications from 'expo-notifications'

const registerForPushNotifications = async () => {
  const { status } = await Notifications.requestPermissionsAsync()
  if (status !== 'granted') return null
  
  const token = await Notifications.getExpoPushTokenAsync()
  
  // Store token in user profile
  await supabase
    .from('users')
    .update({ push_tokens: [token.data] })
    .eq('id', user.id)
  
  return token.data
}
```

### Browser Extension

**Authentication Detection:**
```javascript
// In content script (content.js)
function detectAuthState() {
  const userElement = document.querySelector('[data-user-id]')
  if (userElement) {
    chrome.runtime.sendMessage({
      type: 'STORE_AUTH_TOKEN',
      data: {
        user: {
          id: userElement.dataset.userId,
          email: userElement.dataset.userEmail
        }
      }
    })
  }
}
```

**Fetch Appointments:**
```javascript
// In popup.js
const fetchAppointments = async (userId) => {
  const response = await fetch(
    'https://YOUR_PROJECT_REF.supabase.co/functions/v1/browser-extension-data',
    {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_ANON_KEY',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id: userId, limit: 5 })
    }
  )
  
  return response.json()
}
```

## Error Handling

### Standard Error Response
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional details",
  "timestamp": "2024-01-15T08:00:00Z"
}
```

### Common Error Codes
- `UNAUTHORIZED` - Invalid or missing authentication
- `FORBIDDEN` - User doesn't have permission
- `VALIDATION_ERROR` - Invalid input data
- `NOT_FOUND` - Resource not found
- `RATE_LIMITED` - Too many requests
- `SERVER_ERROR` - Internal server error

### Error Handling Example
```typescript
try {
  const appointments = await getAppointments(userId)
} catch (error) {
  if (error.code === 'UNAUTHORIZED') {
    // Redirect to login
    redirectToLogin()
  } else if (error.code === 'RATE_LIMITED') {
    // Show rate limit message
    showRateLimitError()
  } else {
    // Show generic error
    showGenericError(error.message)
  }
}
```

## Rate Limiting

### Limits by Endpoint

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/send-email` | 100 requests | 1 hour |
| `/send-push-notification` | 1000 requests | 1 hour |
| `/browser-extension-data` | 60 requests | 1 minute |
| Database operations | 1000 requests | 1 minute |

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642694400
```

## Database Functions

### Get Upcoming Appointments
```sql
SELECT * FROM get_upcoming_appointments('user-uuid', 10);
```

### Get Appointment Statistics
```sql
SELECT get_appointment_stats('user-uuid');
```

Returns:
```json
{
  "total": 25,
  "scheduled": 15,
  "completed": 8,
  "cancelled": 2,
  "no_show": 0,
  "this_week": 5,
  "next_week": 3
}
```

## Webhooks

### Appointment Created
Triggered when a new appointment is created.

**Payload:**
```json
{
  "type": "appointment.created",
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "title": "Client Meeting",
    "start_time": "2024-01-15T10:00:00Z",
    "created_at": "2024-01-15T08:00:00Z"
  }
}
```

### Appointment Updated
Triggered when an appointment is modified.

**Payload:**
```json
{
  "type": "appointment.updated",
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "changes": {
      "title": "Updated Meeting Title",
      "start_time": "2024-01-15T11:00:00Z"
    },
    "updated_at": "2024-01-15T08:30:00Z"
  }
}
```

## Security Considerations

1. **Row Level Security (RLS)** is enabled on all tables
2. **JWT tokens** expire after 1 hour (configurable)
3. **Service role key** should only be used in server environments
4. **API keys** should be stored as environment variables
5. **Input validation** is performed on all endpoints
6. **CORS** is configured for allowed origins only

## Monitoring and Logging

### Key Metrics to Monitor
- Authentication success/failure rates
- Email delivery rates
- Push notification delivery rates
- API response times
- Database query performance
- Error rates by endpoint

### Logging
All Edge Functions log to Supabase Function Logs:
- Request/response data
- Error details
- Performance metrics
- User actions

### Health Check
```javascript
// Simple health check endpoint
const healthCheck = async () => {
  const response = await fetch('/functions/v1/health')
  return response.json()
}
```

This API documentation provides a complete reference for integrating with the AppointmentPro system across all platforms.