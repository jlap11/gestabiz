# Bookio - Mobile App Deployment Guide

## React Native / Expo Setup

### 1. Initialize Expo Project

```bash
npx create-expo-app BookioMobile
cd BookioMobile
```

### 2. Install Dependencies

```bash
# Core dependencies
npm install @supabase/supabase-js @react-navigation/native @react-navigation/stack
npm install react-native-async-storage expo-notifications expo-constants
npm install @react-native-async-storage/async-storage expo-auth-session expo-crypto

# UI components
npm install react-native-elements react-native-vector-icons
npm install react-native-calendars react-native-date-picker

# Development dependencies
npm install --save-dev @types/react @types/react-native
```

### 3. Configure app.json

```json
{
  "expo": {
    "name": "Bookio",
    "slug": "Bookio",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "updates": {
      "fallbackToCacheTimeout": 0
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.Bookio",
      "buildNumber": "1"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "com.yourcompany.Bookio",
      "versionCode": 1,
      "permissions": [
        "NOTIFICATIONS",
        "SCHEDULE_EXACT_ALARM"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff",
          "sounds": ["./assets/notification-sound.wav"]
        }
      ]
    ]
  }
}
```

### 4. Environment Configuration

Create `config.ts`:

```typescript
import Constants from 'expo-constants'

const config = {
  supabaseUrl: Constants.expoConfig?.extra?.supabaseUrl || 'https://your-project-ref.supabase.co',
  supabaseAnonKey: Constants.expoConfig?.extra?.supabaseAnonKey || 'your-supabase-anon-key',
}

export default config
```

Update `app.config.js`:

```javascript
export default {
  expo: {
    // ... other config
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
  },
}
```

### 5. Supabase Client Setup

Create `lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import config from '../config'

export const supabase = createClient(
  config.supabaseUrl,
  config.supabaseAnonKey,
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

### 6. Push Notifications Setup

Create `services/notificationService.ts`:

```typescript
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { Platform } from 'react-native'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export async function registerForPushNotificationsAsync() {
  let token

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    })
  }

  if (Constants.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }
    
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!')
      return
    }
    
    token = (await Notifications.getExpoPushTokenAsync()).data
  } else {
    alert('Must use physical device for Push Notifications')
  }

  return token
}

export async function schedulePushNotification(title: string, body: string, trigger: Date) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { type: 'appointment_reminder' },
    },
    trigger: {
      date: trigger,
    },
  })
}
```

### 7. Main App Structure

Create `App.tsx`:

```typescript
import React, { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { supabase } from './lib/supabase'
import { registerForPushNotificationsAsync } from './services/notificationService'

// Import your screens
import AuthScreen from './screens/AuthScreen'
import DashboardScreen from './screens/DashboardScreen'
import AppointmentScreen from './screens/AppointmentScreen'

const Stack = createStackNavigator()

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    // Register for push notifications
    registerForPushNotificationsAsync()

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return null // Add loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {session ? (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="Appointment" component={AppointmentScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
```

### 8. Building and Deployment

#### For Development:
```bash
# Start development server
npx expo start

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator
npx expo start --android
```

#### For Production:

**Option A: Expo Application Services (EAS)**
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for app stores
eas build --platform all

# Submit to app stores
eas submit --platform all
```

**Option B: Manual Build**
```bash
# Create production build
npx expo build:android
npx expo build:ios

# Download and submit manually to Google Play / App Store
```

### 9. App Store Submission

#### Google Play Store:
1. Create developer account ($25 one-time fee)
2. Prepare store listing (screenshots, descriptions)
3. Upload APK/AAB file
4. Complete content rating and pricing
5. Submit for review

#### Apple App Store:
1. Enroll in Apple Developer Program ($99/year)
2. Create app in App Store Connect
3. Upload IPA file using Transporter or Xcode
4. Complete app metadata and screenshots
5. Submit for review

### 10. Environment Variables for Mobile

Create `.env` file:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 11. Testing on Physical Devices

```bash
# Install Expo Go app on your device
# Scan QR code when running npx expo start

# For testing production builds
eas build --profile preview
```

### 12. Common Issues and Solutions

**Issue: Metro bundler not starting**
```bash
npx expo start --clear
```

**Issue: Async Storage warnings**
```bash
npx expo install @react-native-async-storage/async-storage
```

**Issue: Navigation errors**
```bash
npx expo install react-native-screens react-native-safe-area-context
```

**Issue: Push notification permissions**
- Ensure proper permissions in app.json
- Test on physical device, not simulator
- Check notification settings in device

### 13. Performance Optimization

1. **Image Optimization**: Use appropriate image sizes
2. **Bundle Splitting**: Use code splitting for large components
3. **Caching**: Implement proper caching strategies
4. **Memory Management**: Avoid memory leaks in subscriptions
5. **Network Optimization**: Implement offline capabilities

### 14. Monitoring and Analytics

```bash
# Add analytics
npx expo install expo-analytics-amplitude

# Add crash reporting
npx expo install expo-error-recovery
```

This guide provides a complete setup for deploying the Bookio mobile application using React Native and Expo. The app will sync with the same Supabase backend as the web application.