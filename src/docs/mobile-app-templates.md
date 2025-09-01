# Mobile App Templates

This directory contains template files for the React Native/Expo mobile app.

## Project Structure

```
AppointmentProMobile/
├── App.tsx
├── app.json
├── package.json
├── src/
│   ├── components/
│   │   ├── AppointmentCard.tsx
│   │   ├── AppointmentForm.tsx
│   │   └── Calendar.tsx
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── AppointmentsScreen.tsx
│   │   ├── CreateAppointmentScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useNotifications.ts
│   │   └── useAppointments.ts
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── notifications.ts
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       ├── dateUtils.ts
│       └── validation.ts
└── assets/
    ├── icon.png
    ├── splash.png
    └── adaptive-icon.png
```

## Key Files to Create

### App.tsx
```typescript
import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider } from 'react-query'

import LoginScreen from './src/screens/LoginScreen'
import HomeScreen from './src/screens/HomeScreen'
import AppointmentsScreen from './src/screens/AppointmentsScreen'
import CreateAppointmentScreen from './src/screens/CreateAppointmentScreen'
import ProfileScreen from './src/screens/ProfileScreen'

import { useAuth } from './src/hooks/useAuth'
import { useNotifications } from './src/hooks/useNotifications'

const Stack = createStackNavigator()
const queryClient = new QueryClient()

export default function App() {
  const { user, loading } = useAuth()
  const { expoPushToken } = useNotifications()

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator>
          {user ? (
            // Authenticated stack
            <>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Appointments" component={AppointmentsScreen} />
              <Stack.Screen name="CreateAppointment" component={CreateAppointmentScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
            </>
          ) : (
            // Auth stack
            <Stack.Screen name="Login" component={LoginScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </QueryClientProvider>
  )
}
```

### src/lib/supabase.ts
```typescript
import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = 'https://YOUR_PROJECT_REF.supabase.co'
const supabaseAnonKey = 'your_anon_key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
```

### src/hooks/useAuth.ts
```typescript
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  }
}
```

## Installation Commands

```bash
# Create new Expo project
npx create-expo-app AppointmentProMobile --template blank-typescript

cd AppointmentProMobile

# Install dependencies
npm install @supabase/supabase-js
npm install @react-native-async-storage/async-storage
npm install @react-navigation/native @react-navigation/stack
npm install react-native-screens react-native-safe-area-context
npm install expo-notifications expo-device expo-constants
npm install react-query
npm install @expo/vector-icons

# iOS specific
npx pod-install
```

## Build Commands

```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login and configure
eas login
eas build:configure

# Build for development
eas build --platform ios --profile development
eas build --platform android --profile development

# Build for production
eas build --platform ios --profile production
eas build --platform android --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```