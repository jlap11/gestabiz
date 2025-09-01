# AppointmentPro API Documentation

## Overview

AppointmentPro uses Supabase as its backend, providing:
- **PostgreSQL Database** with Row Level Security
- **Real-time Subscriptions** for live updates
- **Edge Functions** for server-side logic
- **Authentication** with multiple providers
- **Storage** for file uploads

## Authentication

### Sign Up
```javascript
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
```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})
```

### Sign Out
```javascript
const { error } = await supabase.auth.signOut()
```

### Google OAuth
```javascript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google'
})
```

## Database Tables

### Profiles Table
Stores extended user information.

**Columns:**
- `id` (UUID, Primary Key) - References auth.users
- `email` (TEXT, Unique) - User email
- `full_name` (TEXT) - User's full name
- `avatar_url` (TEXT) - Profile picture URL
- `timezone` (TEXT) - User's timezone
- `notification_preferences` (JSONB) - Notification settings
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

**Example Query:**
```javascript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single()
```

### Appointments Table
Core appointment data.

**Columns:**
- `id` (UUID, Primary Key) - Unique appointment ID
- `user_id` (UUID, Foreign Key) - References profiles(id)
- `title` (TEXT) - Appointment title
- `description` (TEXT) - Appointment description
- `client_name` (TEXT) - Client's name
- `client_email` (TEXT) - Client's email
- `client_phone` (TEXT) - Client's phone
- `start_time` (TIMESTAMP) - Appointment start time
- `end_time` (TIMESTAMP) - Appointment end time
- `status` (TEXT) - 'scheduled', 'completed', 'cancelled', 'no_show'
- `location` (TEXT) - Appointment location
- `notes` (TEXT) - Additional notes
- `reminder_sent` (BOOLEAN) - Whether reminder was sent
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

**Example Queries:**

Create Appointment:
```javascript
const { data, error } = await supabase
  .from('appointments')
  .insert({
    user_id: userId,
    title: 'Client Meeting',
    client_name: 'John Doe',
    start_time: '2024-01-15T10:00:00Z',
    end_time: '2024-01-15T11:00:00Z',
    status: 'scheduled'
  })
  .select()
  .single()
```

Get User Appointments:
```javascript
const { data, error } = await supabase
  .from('appointments')
  .select('*')
  .eq('user_id', userId)
  .order('start_time', { ascending: true })
```

Update Appointment:
```javascript
const { data, error } = await supabase
  .from('appointments')
  .update({ status: 'completed' })
  .eq('id', appointmentId)
  .select()
  .single()
```

### Notifications Table
Manages notification scheduling and delivery.

**Columns:**
- `id` (UUID, Primary Key) - Notification ID
- `user_id` (UUID, Foreign Key) - References profiles(id)
- `appointment_id` (UUID, Foreign Key) - References appointments(id)
- `type` (TEXT) - Notification type
- `title` (TEXT) - Notification title
- `message` (TEXT) - Notification message
- `scheduled_for` (TIMESTAMP) - When to send
- `sent_at` (TIMESTAMP) - When it was sent
- `delivery_method` (TEXT) - 'email', 'push', 'browser'
- `status` (TEXT) - 'pending', 'sent', 'failed', 'cancelled'
- `created_at` (TIMESTAMP) - Creation timestamp

### User Settings Table
User preferences and configuration.

**Columns:**
- `id` (UUID, Primary Key) - Settings ID
- `user_id` (UUID, Foreign Key) - References profiles(id)
- `theme` (TEXT) - 'light', 'dark', 'system'
- `default_appointment_duration` (INTEGER) - Default duration in minutes
- `business_hours` (JSONB) - Business hours configuration
- `auto_reminders` (BOOLEAN) - Enable automatic reminders
- `reminder_times` (JSONB) - Array of reminder times in hours
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

## Edge Functions

### send-email
Sends email notifications via SendGrid.

**Endpoint:** `POST /functions/v1/send-email`

**Request Body:**
```json
{
  "to": "user@example.com",
  "subject": "Appointment Reminder",
  "html": "<h1>Your appointment is tomorrow</h1>",
  "text": "Your appointment is tomorrow",
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

### send-notification-reminders
Processes pending notifications and sends them.

**Endpoint:** `POST /functions/v1/send-notification-reminders`

**Request Body:** None (automated)

**Response:**
```json
{
  "success": true,
  "processed": 5,
  "results": [
    {
      "id": "notification-uuid",
      "type": "reminder_24h",
      "delivery_method": "email",
      "status": "sent"
    }
  ]
}
```

### browser-extension-data
Provides data for browser extension.

**Endpoint:** `GET /functions/v1/browser-extension-data`

**Query Parameters:**
- `limit` (optional) - Number of appointments to return (default: 3)

**Response:**
```json
{
  "appointments": [
    {
      "id": "uuid",
      "title": "Client Meeting",
      "start_time": "2024-01-15T10:00:00Z",
      "client_name": "John Doe",
      "location": "Office",
      "time_until": "In 2 hours"
    }
  ]
}
```

### calendar-integration
Syncs appointments with external calendars.

**Endpoint:** `POST /functions/v1/calendar-integration`

**Request Body:**
```json
{
  "provider": "google",
  "calendar_id": "primary",
  "action": "sync"
}
```

## Real-time Subscriptions

### Appointments Subscription
Listen for real-time changes to appointments.

```javascript
const subscription = supabase
  .channel('appointments')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'appointments',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    console.log('Change received!', payload)
    // Handle the change
  })
  .subscribe()
```

### Notifications Subscription
Listen for new notifications.

```javascript
const subscription = supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    console.log('New notification!', payload)
    // Show notification to user
  })
  .subscribe()
```

## Database Functions

### get_dashboard_stats()
Returns dashboard statistics for the current user.

```javascript
const { data, error } = await supabase.rpc('get_dashboard_stats')
```

**Returns:**
```json
{
  "total_appointments": 25,
  "scheduled_appointments": 8,
  "completed_appointments": 15,
  "cancelled_appointments": 2,
  "upcoming_today": 3,
  "upcoming_week": 8
}
```

### get_upcoming_appointments(limit_count)
Returns upcoming appointments for browser extension.

```javascript
const { data, error } = await supabase.rpc('get_upcoming_appointments', {
  limit_count: 3
})
```

**Returns:**
```json
[
  {
    "id": "uuid",
    "title": "Client Meeting",
    "start_time": "2024-01-15T10:00:00Z",
    "client_name": "John Doe",
    "location": "Office",
    "time_until": "In 2 hours"
  }
]
```

## Row Level Security Policies

All tables have RLS enabled with the following access patterns:

- **Users can only access their own data**
- **All operations require authentication**
- **Automatic user_id filtering on all queries**

### Example Policy (Appointments)
```sql
-- Users can view own appointments
CREATE POLICY "Users can view own appointments" ON public.appointments
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert own appointments
CREATE POLICY "Users can insert own appointments" ON public.appointments
    FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## Error Handling

### Common Error Codes

- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `422` - Validation error
- `500` - Server error

### Error Response Format
```json
{
  "error": {
    "message": "Description of the error",
    "code": "ERROR_CODE",
    "details": "Additional error details"
  }
}
```

## Rate Limiting

Supabase implements automatic rate limiting:
- **Anonymous requests**: 60 requests per minute
- **Authenticated requests**: 200 requests per minute
- **Edge Functions**: 500 invocations per minute

## Data Types and Validation

### Appointment Status Values
- `scheduled` - Default status for new appointments
- `completed` - Appointment was completed successfully
- `cancelled` - Appointment was cancelled
- `no_show` - Client didn't show up

### Notification Types
- `reminder_24h` - 24-hour reminder
- `reminder_1h` - 1-hour reminder
- `reminder_15m` - 15-minute reminder
- `cancelled` - Appointment cancellation notice
- `rescheduled` - Appointment reschedule notice

### Delivery Methods
- `email` - Email notification
- `push` - Mobile push notification
- `browser` - Browser notification

## Best Practices

### Query Optimization
```javascript
// Good: Use select() to limit columns
const { data } = await supabase
  .from('appointments')
  .select('id, title, start_time, client_name')
  .eq('user_id', userId)

// Good: Use pagination for large datasets
const { data } = await supabase
  .from('appointments')
  .select('*')
  .range(0, 9)  // First 10 results
```

### Real-time Best Practices
```javascript
// Always unsubscribe when component unmounts
useEffect(() => {
  const subscription = supabase.channel('appointments')...
  
  return () => {
    supabase.removeChannel(subscription)
  }
}, [])
```

### Error Handling
```javascript
const { data, error } = await supabase
  .from('appointments')
  .insert(newAppointment)

if (error) {
  console.error('Error creating appointment:', error)
  // Handle error appropriately
  return
}

// Process successful result
console.log('Created appointment:', data)
```

## Testing

### Unit Testing Database Functions
```javascript
// Test get_dashboard_stats function
test('should return dashboard stats', async () => {
  const { data, error } = await supabase.rpc('get_dashboard_stats')
  
  expect(error).toBeNull()
  expect(data).toHaveProperty('total_appointments')
  expect(typeof data.total_appointments).toBe('number')
})
```

### Integration Testing
```javascript
// Test appointment CRUD operations
test('should create, read, update, delete appointment', async () => {
  // Create
  const { data: created } = await supabase
    .from('appointments')
    .insert(testAppointment)
    .select()
    .single()
  
  expect(created.id).toBeDefined()
  
  // Read
  const { data: read } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', created.id)
    .single()
  
  expect(read.title).toBe(testAppointment.title)
  
  // Update
  const { data: updated } = await supabase
    .from('appointments')
    .update({ status: 'completed' })
    .eq('id', created.id)
    .select()
    .single()
  
  expect(updated.status).toBe('completed')
  
  // Delete
  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', created.id)
  
  expect(error).toBeNull()
})
```

This API documentation provides comprehensive coverage of all AppointmentPro backend functionality, including examples, best practices, and testing approaches.