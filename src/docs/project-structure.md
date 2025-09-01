# AppointmentPro - Complete Project Structure

This document outlines the complete project structure for the AppointmentPro micro SaaS across all three platforms.

## Project Overview

AppointmentPro is a comprehensive appointment management system with:
- **Web Application** (React/Vite + Supabase)
- **Mobile Application** (React Native/Expo)
- **Browser Extension** (Chrome/Edge)
- **Backend** (Supabase with Edge Functions)

## Repository Structure

```
AppointmentPro/
├── web-app/                          # React web application
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn components
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── appointments/
│   │   │   └── calendar/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── types/
│   │   └── utils/
│   ├── package.json
│   ├── vite.config.ts
│   └── README.md
│
├── mobile-app/                       # React Native/Expo application
│   ├── src/
│   │   ├── components/
│   │   ├── screens/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── types/
│   │   └── utils/
│   ├── assets/
│   ├── app.json
│   ├── package.json
│   └── README.md
│
├── browser-extension/                # Chrome/Edge extension
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.js
│   ├── popup.css
│   ├── background.js
│   ├── content.js
│   ├── options.html
│   ├── options.js
│   ├── icons/
│   └── README.md
│
├── supabase/                         # Backend configuration
│   ├── migrations/
│   ├── functions/
│   │   ├── send-email/
│   │   ├── process-notifications/
│   │   ├── send-push-notification/
│   │   └── browser-extension-data/
│   ├── config.toml
│   └── README.md
│
├── docs/                             # Documentation
│   ├── deployment-guide.md
│   ├── api-documentation.md
│   ├── user-guide.md
│   └── development-setup.md
│
├── scripts/                          # Deployment scripts
│   ├── deploy-web.sh
│   ├── deploy-mobile.sh
│   ├── deploy-extension.sh
│   └── setup-supabase.sh
│
└── README.md                         # Main project README
```

## Web Application Structure

```
web-app/src/
├── components/
│   ├── ui/                          # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── calendar.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   ├── select.tsx
│   │   ├── toast.tsx
│   │   └── ...
│   ├── auth/
│   │   ├── AuthScreen.tsx
│   │   ├── LoginForm.tsx
│   │   ├── SignupForm.tsx
│   │   └── SocialAuth.tsx
│   ├── dashboard/
│   │   ├── Dashboard.tsx
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Stats.tsx
│   │   └── QuickActions.tsx
│   ├── appointments/
│   │   ├── AppointmentList.tsx
│   │   ├── AppointmentCard.tsx
│   │   ├── AppointmentForm.tsx
│   │   ├── AppointmentDetail.tsx
│   │   └── AppointmentFilters.tsx
│   ├── calendar/
│   │   ├── Calendar.tsx
│   │   ├── CalendarEvent.tsx
│   │   ├── CalendarView.tsx
│   │   └── CalendarControls.tsx
│   └── common/
│       ├── Loading.tsx
│       ├── ErrorBoundary.tsx
│       ├── NotificationCenter.tsx
│       └── Layout.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useAppointments.ts
│   ├── useNotifications.ts
│   ├── useCalendar.ts
│   └── useSupabase.ts
├── lib/
│   ├── supabase.ts
│   ├── utils.ts
│   ├── validations.ts
│   └── constants.ts
├── types/
│   ├── index.ts
│   ├── appointment.ts
│   ├── user.ts
│   └── notification.ts
├── utils/
│   ├── dateUtils.ts
│   ├── formatters.ts
│   └── helpers.ts
├── App.tsx
├── main.tsx
└── index.css
```

## Mobile Application Structure

```
mobile-app/src/
├── components/
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Loading.tsx
│   │   └── Header.tsx
│   ├── appointments/
│   │   ├── AppointmentCard.tsx
│   │   ├── AppointmentForm.tsx
│   │   └── AppointmentList.tsx
│   └── calendar/
│       ├── Calendar.tsx
│       ├── CalendarEvent.tsx
│       └── CalendarControls.tsx
├── screens/
│   ├── auth/
│   │   ├── LoginScreen.tsx
│   │   ├── SignupScreen.tsx
│   │   └── ForgotPasswordScreen.tsx
│   ├── appointments/
│   │   ├── AppointmentsScreen.tsx
│   │   ├── CreateAppointmentScreen.tsx
│   │   ├── EditAppointmentScreen.tsx
│   │   └── AppointmentDetailScreen.tsx
│   ├── calendar/
│   │   └── CalendarScreen.tsx
│   ├── profile/
│   │   ├── ProfileScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   └── NotificationSettingsScreen.tsx
│   └── HomeScreen.tsx
├── navigation/
│   ├── AppNavigator.tsx
│   ├── AuthNavigator.tsx
│   └── TabNavigator.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useAppointments.ts
│   ├── useNotifications.ts
│   └── usePushNotifications.ts
├── lib/
│   ├── supabase.ts
│   ├── notifications.ts
│   └── storage.ts
├── types/
│   └── index.ts
├── utils/
│   ├── dateUtils.ts
│   ├── formatters.ts
│   └── constants.ts
└── App.tsx
```

## Browser Extension Structure

```
browser-extension/
├── manifest.json                    # Extension manifest
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── background/
│   └── background.js
├── content/
│   └── content.js
├── options/
│   ├── options.html
│   └── options.js
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## Supabase Backend Structure

```
supabase/
├── migrations/
│   ├── 001_initial_schema.sql
│   ├── 002_add_push_tokens.sql
│   └── 003_add_rls_policies.sql
├── functions/
│   ├── send-email/
│   │   ├── index.ts
│   │   └── README.md
│   ├── process-notifications/
│   │   ├── index.ts
│   │   └── README.md
│   ├── send-push-notification/
│   │   ├── index.ts
│   │   └── README.md
│   └── browser-extension-data/
│       ├── index.ts
│       └── README.md
├── config.toml
└── .env.example
```

## Technology Stack

### Frontend Technologies
- **Web App**: React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui
- **Mobile App**: React Native, Expo, TypeScript, Expo Router
- **Extension**: Vanilla JavaScript, Chrome Extension API v3

### Backend Technologies
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Functions**: Deno (Supabase Edge Functions)
- **Real-time**: Supabase Realtime
- **Storage**: Supabase Storage

### External Services
- **Email**: SendGrid
- **Push Notifications**: Expo Push Service
- **Hosting**: Vercel (web), Expo (mobile), Chrome Web Store (extension)

## Database Schema

### Core Tables
1. **users** - User profiles and preferences
2. **appointments** - Appointment data
3. **notifications** - Notification queue and history

### Key Relationships
- `users` ← `appointments` (one-to-many)
- `appointments` ← `notifications` (one-to-many)
- `users` ← `notifications` (one-to-many)

## API Endpoints

### Supabase Edge Functions
- `POST /functions/v1/send-email` - Send email notifications
- `POST /functions/v1/process-notifications` - Process pending notifications
- `POST /functions/v1/send-push-notification` - Send push notifications
- `POST /functions/v1/browser-extension-data` - Get data for extension

### Database Functions
- `get_upcoming_appointments(user_id, limit)` - Get upcoming appointments
- `get_appointment_stats(user_id)` - Get appointment statistics

## Development Workflow

### Local Development
1. **Web App**: `npm run dev` (Vite dev server)
2. **Mobile App**: `npx expo start` (Expo development server)
3. **Extension**: Load unpacked in Chrome
4. **Supabase**: `supabase start` (local development)

### Testing
- **Unit Tests**: Vitest (web), Jest (mobile)
- **E2E Tests**: Playwright (web), Detox (mobile)
- **Integration Tests**: Custom test suites for Edge Functions

### Deployment
- **Web App**: Vercel (automatic GitHub deployment)
- **Mobile App**: EAS Build & Submit
- **Extension**: Chrome Web Store
- **Supabase**: `supabase functions deploy`

## Configuration Management

### Environment Variables

**Web App (.env.local):**
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

**Mobile App (app.json):**
```json
{
  "expo": {
    "extra": {
      "supabaseUrl": "https://xxx.supabase.co",
      "supabaseAnonKey": "xxx"
    }
  }
}
```

**Supabase Functions:**
```
SENDGRID_API_KEY=xxx
FROM_EMAIL=noreply@domain.com
```

**Extension (popup.js):**
```javascript
const CONFIG = {
  SUPABASE_URL: 'https://xxx.supabase.co',
  SUPABASE_ANON_KEY: 'xxx',
  WEB_APP_URL: 'https://app.domain.com'
}
```

## Security Considerations

### Authentication
- JWT tokens with 1-hour expiration
- Refresh token rotation
- OAuth integration (Google, Apple)

### Data Protection
- Row Level Security (RLS) on all tables
- API key rotation
- Environment variable management
- CORS configuration

### Privacy
- Data encryption at rest
- Secure token storage
- Minimal data collection
- GDPR compliance

## Monitoring and Analytics

### Key Metrics
- User authentication rates
- Appointment creation/completion rates
- Email/push notification delivery rates
- Extension usage statistics
- API response times
- Error rates

### Tools
- Supabase Dashboard (database metrics)
- Vercel Analytics (web app)
- Expo Analytics (mobile app)
- Chrome Extension Analytics
- SendGrid Analytics (email)

## Scaling Considerations

### Performance
- Database indexing strategy
- Caching layer (Redis if needed)
- CDN for static assets
- Image optimization

### Infrastructure
- Supabase Pro plan for production
- Vercel Pro for advanced features
- Load balancing for high traffic
- Database connection pooling

This structure provides a complete, scalable architecture for the AppointmentPro micro SaaS system across all three platforms.