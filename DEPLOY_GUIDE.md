# 🚀 AppointmentPro - Complete Deployment Guide

## 📋 Overview

AppointmentPro is a comprehensive appointment management system with multi-platform support:
- **Web Application** (React/Vite)
- **Mobile Application** (React Native/Expo)
- **Browser Extension** (Chrome/Edge)
- **Backend** (Supabase)

## 🛠️ Prerequisites

Before deploying, ensure you have:
- Node.js 18+ installed
- A Supabase account
- A Vercel account (for web deployment)
- Google Cloud Console access (for Google Calendar integration)
- Resend account (for email notifications)
- WhatsApp Business API access (optional)

## 📂 Project Structure

```
appointmentpro/
├── web/                    # This web application
├── mobile/                 # React Native mobile app
├── extension/              # Browser extension
├── database/               # Database schema and migrations
├── supabase/functions/     # Edge functions
└── docs/                  # Documentation
```

## 🗄️ Database Setup (Supabase)

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Save your project URL and anon key

### 2. Run Database Schema

1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy and paste the complete schema from `database/schema.sql`
4. Execute the script

### 3. Configure Authentication

1. Go to Authentication → Settings
2. Enable Email authentication
3. Configure Google OAuth:
   - Add Google as a provider
   - Set up OAuth consent screen in Google Cloud Console
   - Add your Google Client ID and Secret

### 4. Deploy Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy send-email
supabase functions deploy send-whatsapp
supabase functions deploy send-notification-reminders
supabase functions deploy calendar-integration
```

### 5. Set Environment Variables in Supabase

Go to Project Settings → Edge Functions and add:

```env
RESEND_API_KEY=your_resend_api_key
WHATSAPP_ACCESS_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
```

## 🌐 Web Application Deployment

### 1. Environment Variables

Create `.env.local` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### 2. Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
# Project Settings → Environment Variables
```

Or use the Vercel dashboard:
1. Connect your GitHub repository
2. Import the project
3. Add environment variables
4. Deploy

### 3. Configure Domain (Optional)

1. Add custom domain in Vercel
2. Update redirect URLs in Supabase Auth settings
3. Update CORS settings if needed

## 📱 Mobile Application Deployment

### 1. Setup Development Environment

```bash
cd mobile
npm install

# For iOS (macOS only)
npx pod-install

# Start development server
npx expo start
```

### 2. Environment Configuration

Create `mobile/.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Build and Deploy

#### For Development/Testing:
```bash
# Build development client
npx expo build:ios
npx expo build:android

# Or use EAS Build
npx eas build --platform all
```

#### For Production:
```bash
# Configure app store credentials
npx eas credentials

# Build for stores
npx eas build --platform all --profile production

# Submit to stores
npx eas submit --platform all
```

## 🧩 Browser Extension Deployment

### 1. Build Extension

```bash
cd extension
npm install
npm run build
```

### 2. Package for Chrome Web Store

1. Zip the `dist` folder
2. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
3. Upload the zip file
4. Fill in store listing details
5. Submit for review

### 3. Package for Edge Add-ons

1. Use the same build
2. Go to [Microsoft Edge Add-ons](https://partner.microsoft.com/dashboard/microsoftedge)
3. Upload and submit

## 🔧 Production Configuration

### Security Checklist

- [ ] Enable RLS policies in Supabase
- [ ] Configure proper CORS settings
- [ ] Set up SSL certificates
- [ ] Enable 2FA for all admin accounts
- [ ] Review and test all permission levels
- [ ] Set up monitoring and alerting
- [ ] Configure backup strategies

### Performance Optimization

- [ ] Enable CDN for static assets
- [ ] Configure database indexes
- [ ] Set up Redis for caching (if needed)
- [ ] Enable image optimization
- [ ] Configure email rate limiting
- [ ] Set up database connection pooling

### Monitoring Setup

1. **Supabase Monitoring:**
   - Enable database metrics
   - Set up log retention
   - Configure alerts for errors

2. **Application Monitoring:**
   - Add error tracking (Sentry)
   - Set up performance monitoring
   - Configure uptime monitoring

3. **User Analytics:**
   - Add Google Analytics or similar
   - Track key user actions
   - Monitor conversion rates

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

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
      - uses: vercel/action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}

  deploy-functions:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npx supabase functions deploy --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

## 📊 Testing Strategy

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

### Load Testing
- Test appointment creation under load
- Verify notification system performance
- Stress test database queries

## 🚨 Troubleshooting

### Common Issues

1. **Authentication Not Working:**
   - Check Supabase URL and keys
   - Verify redirect URLs
   - Check browser console for errors

2. **Database Connection Issues:**
   - Verify RLS policies
   - Check user permissions
   - Review connection limits

3. **Email Notifications Not Sending:**
   - Verify Resend API key
   - Check edge function logs
   - Review email templates

4. **Mobile App Build Failures:**
   - Update Expo SDK
   - Clear node_modules and reinstall
   - Check platform-specific configurations

### Support Channels

- **Documentation:** See `/docs` folder
- **Issues:** GitHub Issues
- **Community:** Discord/Slack channels
- **Email:** support@appointmentpro.com

## 📈 Scaling Considerations

### Database Scaling
- Monitor connection pools
- Consider read replicas for heavy queries
- Implement query optimization
- Set up database partitioning for large tables

### Application Scaling
- Implement proper caching strategies
- Use CDN for static assets
- Consider serverless functions for heavy processing
- Set up load balancing if needed

### Cost Optimization
- Monitor Supabase usage and costs
- Optimize database queries
- Use efficient data structures
- Implement proper cleanup procedures

## 🔐 Security Best Practices

1. **Data Protection:**
   - Encrypt sensitive data
   - Implement proper access controls
   - Regular security audits
   - GDPR compliance measures

2. **API Security:**
   - Rate limiting
   - Input validation
   - SQL injection protection
   - XSS prevention

3. **User Security:**
   - Strong password requirements
   - 2FA implementation
   - Session management
   - Account lockout policies

## 📋 Post-Deployment Checklist

- [ ] Verify all features work in production
- [ ] Test email notifications
- [ ] Confirm mobile app functionality
- [ ] Validate browser extension
- [ ] Check database performance
- [ ] Monitor error rates
- [ ] Verify backup procedures
- [ ] Test disaster recovery
- [ ] Update documentation
- [ ] Train support team

## 🎯 Success Metrics

Track these KPIs post-deployment:
- User registration rates
- Appointment booking completion
- Mobile app adoption
- Email open/click rates
- System uptime and performance
- User satisfaction scores
- Revenue growth
- Support ticket volume

---

For detailed implementation guides for each platform, see the respective README files in each subdirectory.