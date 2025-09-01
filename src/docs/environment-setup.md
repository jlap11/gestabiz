# Environment Configuration Examples

## Web Application (.env.local)
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anonymous-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-app-domain.com
NEXT_PUBLIC_APP_NAME=AppointmentPro

# Email Service (Optional - for notifications)
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@your-domain.com

# Push Notifications (Optional)
EXPO_PUSH_TOKEN=your-expo-push-token
```

## Mobile Application (app.config.js)
```javascript
import 'dotenv/config'

export default {
  expo: {
    name: "AppointmentPro",
    slug: "appointmentpro",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#1a1a1a"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.yourcompany.appointmentpro",
      buildNumber: "1"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#1a1a1a"
      },
      package: "com.yourcompany.appointmentpro",
      versionCode: 1
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-notifications",
      [
        "expo-notifications",
        {
          icon: "./assets/notification-icon.png",
          color: "#667eea",
          sounds: ["./assets/notification-sound.wav"]
        }
      ]
    ],
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      eas: {
        projectId: "your-eas-project-id"
      }
    }
  }
}
```

## Mobile Environment (.env)
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anonymous-key-here
EXPO_PUBLIC_APP_URL=https://your-app-domain.com
```

## Edge Functions Environment Variables
Set these in Supabase Dashboard -> Edge Functions -> Settings:

```bash
# Email Service
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@your-domain.com

# App URLs
APP_URL=https://your-app-domain.com
MOBILE_APP_URL=appointmentpro://

# Push Notifications
EXPO_ACCESS_TOKEN=your-expo-access-token
FCM_SERVER_KEY=your-firebase-server-key

# External Integrations (Optional)
GOOGLE_CALENDAR_CLIENT_ID=your-google-client-id
GOOGLE_CALENDAR_CLIENT_SECRET=your-google-client-secret
MICROSOFT_GRAPH_CLIENT_ID=your-microsoft-client-id
MICROSOFT_GRAPH_CLIENT_SECRET=your-microsoft-client-secret
```

## Browser Extension Configuration
Update these in the extension files:

### popup.js
```javascript
const APP_URL = 'https://your-app-domain.com'
const SUPABASE_URL = 'https://your-project-id.supabase.co'
const SUPABASE_ANON_KEY = 'your-anonymous-key-here'
```

### background.js
```javascript
const APP_URL = 'https://your-app-domain.com'
const SUPABASE_URL = 'https://your-project-id.supabase.co'
```

### manifest.json
```json
{
  "host_permissions": [
    "https://your-project-id.supabase.co/*",
    "https://your-app-domain.com/*"
  ]
}
```

## Production Deployment Variables

### Vercel (Web App)
Add these in Vercel Dashboard -> Project Settings -> Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `SENDGRID_API_KEY`
- `FROM_EMAIL`

### Netlify (Alternative Web Hosting)
Add these in Netlify Dashboard -> Site Settings -> Environment Variables:
- Same as Vercel variables above

### EAS (Expo Application Services)
```bash
# Set secrets for mobile app builds
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value your-value
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value your-value
```

### GitHub Actions (CI/CD)
Add these as repository secrets:
- `SUPABASE_ACCESS_TOKEN`
- `VERCEL_TOKEN`
- `EXPO_TOKEN`
- All environment variables listed above

## Security Notes

1. **Never commit sensitive keys to version control**
2. **Use different keys for development and production**
3. **Regularly rotate API keys and tokens**
4. **Enable Row Level Security in Supabase**
5. **Use HTTPS for all communications**
6. **Validate all user inputs on both client and server**
7. **Implement proper authentication flow**
8. **Use service role key only in server-side functions**

## Getting Your Supabase Keys

1. Go to [supabase.com](https://supabase.com)
2. Create or select your project
3. Go to Settings -> API
4. Copy the Project URL and API keys:
   - `anon public` key (safe for client-side use)
   - `service_role` key (server-side only, keep secret!)

## Getting Email Service Keys

### SendGrid
1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Go to Settings -> API Keys
3. Create a new API key with "Mail Send" permissions
4. Add your domain and verify it
5. Set up authentication (SPF, DKIM)

### Alternative Email Services
- **Resend**: Modern email API with great developer experience
- **Mailgun**: Reliable email service with good free tier
- **Amazon SES**: Cost-effective for high volume
- **Postmark**: Focus on transactional emails

## Setting Up Push Notifications

### Expo Push Notifications
1. No additional setup needed for development
2. For production, consider using FCM/APNS directly
3. Get Expo access token from expo.dev

### Firebase Cloud Messaging (FCM)
1. Create Firebase project
2. Add your mobile apps to the project
3. Download configuration files
4. Get server key from Firebase Console

## Domain and SSL Setup

1. **Purchase a domain** from registrars like Namecheap, GoDaddy, etc.
2. **Point domain to your hosting provider**:
   - Vercel: Add domain in dashboard, follow DNS instructions
   - Netlify: Similar process in site settings
3. **SSL certificates** are handled automatically by most modern hosts
4. **Update all environment variables** with your actual domain

## Testing Configuration

Create a `.env.test` file for testing:
```env
NEXT_PUBLIC_SUPABASE_URL=https://test-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Monitoring and Analytics

Consider adding:
- **Sentry** for error monitoring
- **LogRocket** for session replay
- **Google Analytics** for usage tracking
- **Supabase Analytics** for database insights