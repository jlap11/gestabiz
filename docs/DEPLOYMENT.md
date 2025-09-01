# AppointmentPro - Complete Deployment Guide

## 🚀 Deployment Overview

This guide covers deploying the complete AppointmentPro ecosystem:
- **Web Application** (React/Vite) → Vercel
- **Database & Backend** → Supabase
- **Edge Functions** → Supabase Functions
- **Mobile App** → Expo (iOS/Android)
- **Browser Extension** → Chrome Web Store / Edge Add-ons

---

## 📋 Prerequisites

Before deploying, ensure you have:
- [ ] Node.js 18+ installed
- [ ] Git repository set up
- [ ] Supabase account
- [ ] Vercel account
- [ ] Expo account (for mobile)
- [ ] Chrome Developer account (for extension)

---

## 🗄️ Database Setup (Supabase)

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

### 2. Database Schema Setup

1. Open Supabase SQL Editor
2. Copy and paste the entire content from `database/schema.sql`
3. Execute the script to create all tables and functions

### 3. Authentication Setup

1. Go to Authentication → Settings
2. Enable Email authentication
3. Configure OAuth providers (Google, Apple):
   ```
   Google: Add OAuth credentials
   Apple: Add OAuth credentials (for iOS)
   ```

### 4. Environment Variables

Create these environment variables in Supabase:
```bash
# Required for Edge Functions
RESEND_API_KEY=your_resend_api_key_here
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## ⚡ Edge Functions Deployment

### 1. Install Supabase CLI

```bash
npm install -g supabase
supabase login
```

### 2. Link Project

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### 3. Deploy Functions

```bash
# Deploy all functions
supabase functions deploy

# Or deploy individually
supabase functions deploy send-notifications
supabase functions deploy daily-digest
supabase functions deploy schedule-reminders
```

### 4. Set Environment Variables

```bash
supabase secrets set RESEND_API_KEY=your_resend_key
```

### 5. Schedule Functions (Cron Jobs)

Set up cron jobs in Supabase Dashboard:

```sql
-- Daily digest at 8 AM every day
select cron.schedule('daily-digest', '0 8 * * *', 'https://your-project.supabase.co/functions/v1/daily-digest');

-- Process notifications every 5 minutes
select cron.schedule('process-notifications', '*/5 * * * *', 'https://your-project.supabase.co/functions/v1/send-notifications');
```

---

## 🌐 Web Application Deployment (Vercel)

### 1. Environment Setup

Create `.env.local`:
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_URL=https://your-app.vercel.app
```

### 2. Build Configuration

Update `vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
```

### 3. Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Or connect via GitHub
# 1. Push to GitHub
# 2. Import project in Vercel dashboard
# 3. Add environment variables
# 4. Deploy
```

### 4. Custom Domain (Optional)

1. Go to Vercel Dashboard → Domains
2. Add your custom domain
3. Configure DNS records

---

## 📱 Mobile App Deployment (Expo)

### 1. Setup Expo Project

```bash
cd mobile
npm install

# Install Expo CLI
npm install -g @expo/cli
```

### 2. Configuration

Update `app.config.js`:
```javascript
export default {
  expo: {
    name: "AppointmentPro",
    slug: "appointmentpro",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#3B82F6"
    },
    updates: {
      fallbackToCacheTimeout: 0
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.yourcompany.appointmentpro"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF"
      },
      package: "com.yourcompany.appointmentpro"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    }
  }
};
```

### 3. Environment Variables

Create `.env`:
```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Build and Deploy

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to app stores
eas submit --platform ios
eas submit --platform android
```

---

## 🔌 Browser Extension Deployment

### 1. Build Extension

```bash
cd extension
npm install
npm run build
```

### 2. Chrome Web Store

1. Go to [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. Create new item
3. Upload `extension/dist.zip`
4. Fill out store listing
5. Submit for review

### 3. Edge Add-ons

1. Go to [Microsoft Edge Add-ons](https://partner.microsoft.com/en-us/dashboard/microsoftedge/)
2. Submit new extension
3. Upload the same build package
4. Complete certification process

---

## 📧 Email Service Setup (Resend)

### 1. Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Create account and verify
3. Get API key

### 2. Domain Setup

1. Add your domain to Resend
2. Configure DNS records
3. Verify domain

### 3. Email Templates

Templates are included in the Edge Functions. Customize in:
- `supabase/functions/send-notifications/index.ts`
- `supabase/functions/daily-digest/index.ts`

---

## 🔒 Security Checklist

### Database Security
- [ ] Row Level Security (RLS) enabled on all tables
- [ ] Service role key secured
- [ ] API keys in environment variables only

### Application Security
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] Input validation on all forms
- [ ] SQL injection protection via Supabase

### API Security
- [ ] Rate limiting configured
- [ ] Authentication required for sensitive endpoints
- [ ] Error messages don't expose sensitive info

---

## 📊 Monitoring & Analytics

### 1. Supabase Analytics

Monitor in Supabase Dashboard:
- Database performance
- API usage
- Function execution logs
- Authentication metrics

### 2. Vercel Analytics

Add to `app.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react'

function App() {
  return (
    <>
      {/* Your app content */}
      <Analytics />
    </>
  )
}
```

### 3. Error Tracking

Set up Sentry for error tracking:
```bash
npm install @sentry/react @sentry/tracing
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}

  deploy-functions:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: supabase/setup-cli@v1
      - run: supabase functions deploy
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

---

## 🧪 Testing Before Production

### 1. Database Testing

```sql
-- Test user creation
INSERT INTO users (email, name) VALUES ('test@example.com', 'Test User');

-- Test appointment creation
INSERT INTO appointments (user_id, client_id, title, start_datetime, end_datetime)
VALUES (
  'user_id_here',
  'client_id_here',
  'Test Appointment',
  NOW() + INTERVAL '1 day',
  NOW() + INTERVAL '1 day 1 hour'
);
```

### 2. Function Testing

```bash
# Test notification function
curl -X POST https://your-project.supabase.co/functions/v1/send-notifications \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

### 3. End-to-End Testing

1. Create test user account
2. Create test appointment
3. Verify notifications are sent
4. Test mobile sync
5. Test browser extension

---

## 📞 Support & Maintenance

### Regular Tasks

- [ ] Monitor function execution logs
- [ ] Check email delivery rates
- [ ] Update dependencies monthly
- [ ] Backup database weekly
- [ ] Review security logs

### Performance Optimization

- [ ] Database query optimization
- [ ] CDN setup for static assets
- [ ] Image optimization
- [ ] Bundle size monitoring

---

## 🚨 Troubleshooting

### Common Issues

1. **Functions not executing**: Check environment variables
2. **Emails not sending**: Verify Resend API key and domain
3. **Mobile sync issues**: Check Supabase connection
4. **Extension not loading**: Verify manifest permissions

### Debug Commands

```bash
# Check function logs
supabase functions logs send-notifications

# Test database connection
supabase db reset --linked

# Verify environment variables
vercel env ls
```

---

## 🎯 Go-Live Checklist

- [ ] Database schema deployed
- [ ] All Edge Functions deployed and tested
- [ ] Web app deployed to production
- [ ] Mobile apps submitted to stores
- [ ] Browser extension submitted
- [ ] Email service configured
- [ ] Domain and SSL configured
- [ ] Monitoring setup
- [ ] Backup strategy implemented
- [ ] Security review completed
- [ ] Performance testing done
- [ ] User acceptance testing passed

---

**🎉 Congratulations! Your AppointmentPro system is now live and ready for users!**

For support or questions, refer to the individual service documentation or create an issue in the repository.