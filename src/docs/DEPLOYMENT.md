# Bookio - Complete Deployment Guide

## Overview

Bookio is a comprehensive appointment management system consisting of:
- **Web Application** (React/Vite)
- **Mobile Application** (React Native/Expo)
- **Browser Extension** (Chrome/Edge)
- **Backend** (Supabase)

## Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account
- Vercel account (for web deployment)
- Expo account (for mobile deployment)
- Google Play Console & Apple Developer account (for app store deployment)

## 1. Supabase Backend Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key
3. Go to SQL Editor and run the complete schema from `src/database/schema.sql`

### Step 2: Configure Environment Variables

Create these in Supabase Project Settings > API:

```bash
# Your project's URL and keys
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email configuration (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@your-domain.com

# App URLs
APP_URL=https://your-app-domain.com
WEB_APP_URL=https://your-app-domain.com
MOBILE_APP_SCHEME=Bookio://
```

### Step 3: Deploy Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy all functions
supabase functions deploy send-email
supabase functions deploy send-notification-reminders
supabase functions deploy browser-extension-data
supabase functions deploy calendar-integration
supabase functions deploy process-notifications
```

### Step 4: Setup Authentication

1. Go to Authentication > Settings
2. Enable Email authentication
3. Configure OAuth providers (Google, Apple) if needed
4. Set up custom SMTP if using your own email service

### Step 5: Configure RLS and Policies

The schema includes all necessary RLS policies, but verify they're enabled:

1. Go to Database > Tables
2. Check that RLS is enabled on all tables
3. Verify policies are in place

## 2. Web Application Deployment

### Step 1: Configure Environment

Create `.env` file in project root:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_NAME=Bookio
VITE_APP_URL=https://your-app-domain.com
```

### Step 2: Build and Deploy to Vercel

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Install Vercel CLI
npm install -g vercel

# Deploy to Vercel
vercel

# Follow prompts to configure:
# - Set framework preset to "Vite"
# - Set build command to "npm run build"
# - Set output directory to "dist"
```

### Step 3: Configure Vercel Environment Variables

In Vercel dashboard, add all environment variables from your `.env` file.

### Step 4: Set up Custom Domain (Optional)

1. Go to Vercel project settings
2. Add custom domain
3. Configure DNS records

## 3. Mobile Application Deployment

### Step 1: Configure Environment

Create `.env` file in `src/mobile/`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_APP_NAME=Bookio
EXPO_PUBLIC_WEB_APP_URL=https://your-app-domain.com
```

### Step 2: Setup Expo

```bash
cd src/mobile

# Install dependencies
npm install

# Install Expo CLI
npm install -g @expo/cli

# Login to Expo
expo login

# Configure app.json with your details
# Update bundleIdentifier and package name
```

### Step 3: Development Build

```bash
# Start development server
expo start

# Test on devices
expo start --tunnel  # For remote testing
```

### Step 4: Production Build

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to EAS
eas login

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

### Step 5: App Store Deployment

#### iOS (App Store)

1. Create Apple Developer account
2. Create App Store Connect app
3. Build and submit:

```bash
eas submit --platform ios
```

#### Android (Google Play)

1. Create Google Play Console account
2. Create app listing
3. Build and submit:

```bash
eas submit --platform android
```

## 4. Browser Extension Deployment

### Step 1: Configure Extension

Update `src/browser-extension/manifest.json`:

```json
{
  "host_permissions": [
    "https://your-project-ref.supabase.co/*",
    "https://your-app-domain.com/*"
  ]
}
```

Update `src/browser-extension/popup.js`:

```javascript
const APP_URL = 'https://your-app-domain.com'
const SUPABASE_URL = 'https://your-project-ref.supabase.co'
```

### Step 2: Create Extension Package

```bash
cd src/browser-extension

# Create icons folder and add icons (16x16, 32x32, 48x48, 128x128)
mkdir icons

# Zip the extension
zip -r Bookio-extension.zip . -x "*.DS_Store" "node_modules/*"
```

### Step 3: Chrome Web Store

1. Go to [Chrome Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard)
2. Pay one-time $5 developer fee
3. Upload extension zip
4. Fill out store listing
5. Submit for review

### Step 4: Edge Add-ons

1. Go to [Edge Add-ons Developer Portal](https://partner.microsoft.com/en-us/dashboard/microsoftedge)
2. Upload same extension zip
3. Fill out store listing
4. Submit for review

## 5. Email Service Configuration

### SendGrid Setup

1. Create SendGrid account
2. Verify sender identity
3. Create API key
4. Add API key to Supabase environment variables

### Template Configuration

Email templates are built into the edge functions, but you can customize them by updating the `send-email` function.

## 6. Push Notifications Setup

### Expo Push Notifications

For the mobile app, Expo handles push notifications automatically. The setup is included in the mobile app code.

### Web Push Notifications

For browser notifications, you can integrate with services like:
- Firebase Cloud Messaging
- OneSignal
- Pusher

## 7. Analytics and Monitoring

### Supabase Analytics

Monitor your backend performance in Supabase dashboard:
- Database usage
- API requests
- Function executions
- Authentication events

### Application Monitoring

Consider adding:
- Sentry for error tracking
- Google Analytics for usage analytics
- PostHog for product analytics

## 8. Domain and SSL

### Custom Domain Setup

1. Purchase domain from registrar
2. Configure DNS records:
   ```
   A record: @ -> Vercel IP
   CNAME record: www -> your-app.vercel.app
   ```
3. Update all app URLs in configurations

### SSL Certificate

Vercel provides automatic SSL certificates for custom domains.

## 9. Testing Checklist

### Pre-deployment Testing

- [ ] Web app functionality (auth, CRUD, notifications)
- [ ] Mobile app functionality (auth, CRUD, push notifications)
- [ ] Browser extension functionality (auth, data display, navigation)
- [ ] Email notifications working
- [ ] Real-time sync between platforms
- [ ] Database integrity and performance
- [ ] Edge function execution

### Post-deployment Testing

- [ ] Production URLs accessible
- [ ] Authentication flows working
- [ ] Data persistence across sessions
- [ ] Cross-platform synchronization
- [ ] Notification delivery
- [ ] Performance under load

## 10. Maintenance and Updates

### Regular Maintenance

1. **Monitor Supabase usage** - Check database size, API calls, function executions
2. **Update dependencies** - Keep packages updated for security
3. **Backup database** - Regular database backups
4. **Monitor error logs** - Check Supabase logs and application errors
5. **Performance optimization** - Database query optimization, function performance

### Update Process

1. **Web App**: Deploy to Vercel (automatic on git push)
2. **Mobile App**: Create new EAS build and submit to stores
3. **Browser Extension**: Update manifest version and resubmit to stores
4. **Database**: Use Supabase migrations for schema changes

## 11. Scaling Considerations

### Database Scaling

- Monitor table sizes and query performance
- Add indexes for frequently queried columns
- Consider read replicas for high-traffic applications

### API Scaling

- Supabase auto-scales, but monitor usage limits
- Implement caching for frequently accessed data
- Consider CDN for static assets

### Cost Optimization

- Monitor Supabase billing
- Optimize database queries
- Use appropriate pricing tiers for your usage

## 12. Security Best Practices

- [ ] All secrets stored in environment variables
- [ ] RLS policies properly configured
- [ ] API endpoints properly secured
- [ ] User input properly validated and sanitized
- [ ] Regular security audits
- [ ] Keep dependencies updated

## Support and Documentation

### User Documentation

Create user guides for:
- Getting started
- Creating appointments
- Using mobile app
- Browser extension usage
- Troubleshooting

### Developer Documentation

Maintain documentation for:
- API endpoints
- Database schema
- Deployment process
- Contributing guidelines

## Conclusion

This deployment guide covers the complete setup of Bookio across all platforms. The system is designed to be scalable, maintainable, and user-friendly. Regular monitoring and maintenance will ensure optimal performance and user experience.

For support or questions, refer to the individual service documentation or create issues in the project repository.