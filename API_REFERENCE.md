# Bookio API Documentation

This document describes the complete API structure for Bookio, including database schema, Edge Functions, and frontend integration patterns.

## 🏗 Database Schema

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

## 🔌 Supabase Edge Functions

### 1. Send Email Function

**Endpoint**: `POST /functions/v1/send-email`

**Purpose**: Sends email notifications using SendGrid

**Request Body**:
```typescript
interface EmailRequest {
  to: string
  subject: string
  html: string
  text?: string
  notification_id?: string
  appointment_id?: string
}
```

**Response**:
```typescript
interface EmailResponse {
  success: boolean
  message: string
}
```

**Usage Example**:
```typescript
const { data, error } = await supabase.functions.invoke('send-email', {
  body: {
    to: 'user@example.com',
    subject: 'Appointment Reminder',
    html: '<h1>Your appointment is tomorrow!</h1>',
    text: 'Your appointment is tomorrow!'
  }
})
```

### 2. Process Notifications Function

**Endpoint**: `POST /functions/v1/process-notifications`

**Purpose**: Processes pending notifications automatically

**Request Body**: None (internal cron job)

**Response**:
```typescript
interface ProcessResponse {
  success: boolean
  message: string
  processed: number
  failed: number
}
```

**Cron Setup**:
```sql
SELECT cron.schedule(
  'process-notifications',
  '* * * * *', -- Every minute
  $$
    SELECT net.http_post(
      url := 'https://your-project.supabase.co/functions/v1/process-notifications',
      headers := '{"Authorization": "Bearer YOUR_ANON_KEY", "Content-Type": "application/json"}'::jsonb
    );
  $$
);
```

### 3. Browser Extension Data Function

**Endpoint**: `POST /functions/v1/browser-extension-data`

**Purpose**: Provides appointment data for browser extension

**Request Body**:
```typescript
interface ExtensionRequest {
  user_id: string
  limit?: number // default: 5
}
```

**Response**:
```typescript
interface ExtensionResponse {
  success: boolean
  appointments: Array<{
    id: string
    title: string
    client: string
    datetime: string
    location: string
    status: string
    timeUntil: string
  }>
  stats: {
    total: number
    scheduled: number
    completed: number
    cancelled: number
    this_week: number
    next_week: number
  }
  timestamp: string
}
```

## 🔐 Authentication

### Sign Up
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: {
    data: {
      full_name: 'John Doe'
    }
  }
})
```

### Sign In
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})
```

### Google OAuth
```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'http://localhost:3000/auth/callback'
  }
})
```

### Get Current User
```typescript
const { data: { user }, error } = await supabase.auth.getUser()
```

## 📅 Appointments CRUD

### Create Appointment
```typescript
const { data, error } = await supabase
  .from('appointments')
  .insert({
    user_id: userId,
    title: 'Meeting with Client',
    description: 'Discuss project requirements',
    client_name: 'John Smith',
    client_email: 'john@example.com',
    start_time: '2024-01-25T14:00:00Z',
    end_time: '2024-01-25T15:00:00Z',
    status: 'scheduled',
    location: 'Office'
  })
  .select()
```

### Get User Appointments
```typescript
const { data, error } = await supabase
  .from('appointments')
  .select('*')
  .eq('user_id', userId)
  .gte('start_time', new Date().toISOString())
  .order('start_time', { ascending: true })
```

### Update Appointment
```typescript
const { data, error } = await supabase
  .from('appointments')
  .update({
    status: 'completed',
    notes: 'Meeting completed successfully'
  })
  .eq('id', appointmentId)
  .eq('user_id', userId)
```

### Delete Appointment
```typescript
const { data, error } = await supabase
  .from('appointments')
  .delete()
  .eq('id', appointmentId)
  .eq('user_id', userId)
```

## 📊 Statistics and Analytics

### Get Appointment Statistics
```typescript
const { data, error } = await supabase
  .rpc('get_appointment_stats', {
    user_uuid: userId
  })
```

**Response Structure**:
```typescript
interface AppointmentStats {
  total: number
  scheduled: number
  completed: number
  cancelled: number
  no_show: number
  this_week: number
  next_week: number
}
```

### Get Upcoming Appointments
```typescript
const { data, error } = await supabase
  .rpc('get_upcoming_appointments', {
    user_uuid: userId,
    limit_count: 10
  })
```

## 🔄 Real-time Subscriptions

### Subscribe to Appointment Changes
```typescript
const subscription = supabase
  .channel('appointments')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'appointments',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      console.log('Change received!', payload)
      // Handle real-time updates
    }
  )
  .subscribe()

// Cleanup
subscription.unsubscribe()
```

### Subscribe to Notifications
```typescript
const subscription = supabase
  .channel('notifications')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      // Handle new notifications
      displayNotification(payload.new)
    }
  )
  .subscribe()
```

## 🔔 Notification System

### Schedule Notification
Notifications are automatically created via database triggers when appointments are created:

```sql
-- Automatic trigger creates notifications
INSERT INTO appointments (user_id, title, start_time, ...)
-- This automatically creates:
-- - 1 day reminder notification
-- - 1 hour reminder notification
```

### Manual Notification Creation
```typescript
const { data, error } = await supabase
  .from('notifications')
  .insert({
    user_id: userId,
    appointment_id: appointmentId,
    type: 'reminder_1h',
    title: 'Appointment Starting Soon',
    message: 'Your appointment starts in 1 hour',
    scheduled_for: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    channel: 'email'
  })
```

### Get User Notifications
```typescript
const { data, error } = await supabase
  .from('notifications')
  .select(`
    *,
    appointments (
      title,
      start_time,
      client_name
    )
  `)
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
```

## 📱 Mobile App Integration

### React Native Supabase Setup
```typescript
import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
```

### Push Notifications Setup
```typescript
import * as Notifications from 'expo-notifications'

// Register for push notifications
const { status } = await Notifications.requestPermissionsAsync()
const token = await Notifications.getExpoPushTokenAsync()

// Store token in user profile
await supabase
  .from('users')
  .update({
    push_tokens: [token.data]
  })
  .eq('id', userId)
```

## 🔧 Browser Extension Integration

### Extension Authentication
```javascript
// Background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'authenticate') {
    // Handle authentication with Supabase
    authenticateUser(request.credentials)
      .then(user => sendResponse({ success: true, user }))
      .catch(error => sendResponse({ success: false, error }))
  }
})
```

### Fetch Extension Data
```javascript
// Content script
async function fetchAppointments() {
  const response = await fetch('YOUR_SUPABASE_URL/functions/v1/browser-extension-data', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      user_id: userId,
      limit: 3
    })
  })
  
  const data = await response.json()
  return data.appointments
}
```

## 🛡 Security Best Practices

### Row Level Security (RLS) Policies

```sql
-- Users can only see their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can only manage their own appointments
CREATE POLICY "Users can manage own appointments" ON appointments
  FOR ALL USING (auth.uid() = user_id);

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);
```

### API Security Headers
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}
```

## 📈 Performance Optimization

### Database Indexes
```sql
-- Optimize appointment queries
CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_appointments_start_time ON appointments(start_time);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_user_status ON appointments(user_id, status);

-- Optimize notification queries
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_scheduled_for ON notifications(scheduled_for);
CREATE INDEX idx_notifications_status ON notifications(status);
```

### Query Optimization
```typescript
// Efficient pagination
const { data, error } = await supabase
  .from('appointments')
  .select('*')
  .eq('user_id', userId)
  .range(0, 9) // Get first 10 records
  .order('start_time', { ascending: true })

// Use specific selects to reduce data transfer
const { data, error } = await supabase
  .from('appointments')
  .select('id, title, start_time, status')
  .eq('user_id', userId)
```

## 🐛 Error Handling

### Standard Error Response
```typescript
interface ApiError {
  error: string
  message: string
  code?: number
  details?: any
}
```

### Error Handling Example
```typescript
async function createAppointment(appointmentData) {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .insert(appointmentData)
      .select()
    
    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }
    
    return { success: true, data }
  } catch (error) {
    console.error('Failed to create appointment:', error)
    return { 
      success: false, 
      error: error.message || 'Unknown error occurred' 
    }
  }
}
```

## 🔄 Data Synchronization

### Frontend State Management
```typescript
// Using React Query for cache management
import { useQuery, useMutation, useQueryClient } from 'react-query'

export function useAppointments(userId: string) {
  return useQuery(
    ['appointments', userId],
    () => fetchUserAppointments(userId),
    {
      refetchInterval: 30000, // Refresh every 30 seconds
      staleTime: 10000, // Consider data stale after 10 seconds
    }
  )
}

export function useCreateAppointment() {
  const queryClient = useQueryClient()
  
  return useMutation(createAppointment, {
    onSuccess: () => {
      // Invalidate and refetch appointments
      queryClient.invalidateQueries('appointments')
    }
  })
}
```

## 📝 Environment Variables

### Required Environment Variables
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email Configuration (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@yourdomain.com

# OAuth Configuration (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 🚀 Deployment Configuration

### Vercel Deployment
```json
{
  "functions": {
    "app/**/*.tsx": {
      "runtime": "@vercel/node"
    }
  },
  "env": {
    "VITE_SUPABASE_URL": "@supabase-url",
    "VITE_SUPABASE_ANON_KEY": "@supabase-anon-key"
  }
}
```

### Supabase Edge Functions Deployment
```bash
# Deploy all functions
supabase functions deploy send-email
supabase functions deploy process-notifications
supabase functions deploy browser-extension-data

# Set secrets
supabase secrets set SENDGRID_API_KEY=your_key
supabase secrets set FROM_EMAIL=noreply@yourdomain.com
```

This API documentation provides a comprehensive reference for all backend interactions in Bookio. Use it as a guide for implementing new features or troubleshooting existing functionality.