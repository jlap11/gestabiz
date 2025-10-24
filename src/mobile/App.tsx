import React, { useEffect, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import * as SplashScreen from 'expo-splash-screen'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

// Screens
import AuthScreen from './src/screens/AuthScreen'
import DashboardScreen from './src/screens/DashboardScreen'
import AppointmentListScreen from './src/screens/AppointmentListScreen'
import CalendarScreen from './src/screens/CalendarScreen'
import SettingsScreen from './src/screens/SettingsScreen'
import CreateAppointmentScreen from './src/screens/CreateAppointmentScreen'
import EditAppointmentScreen from './src/screens/EditAppointmentScreen'

// Services
import { AuthProvider, useAuth } from './src/contexts/AuthContext'
import { supabase } from './src/lib/supabase'
import {
  registerForPushNotificationsAsync,
  setupNotificationHandlers,
} from './src/services/notificationService'

// Icons (you'll need to install @expo/vector-icons)
import { Ionicons } from '@expo/vector-icons'

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync()

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

const Stack = createStackNavigator()
const Tab = createBottomTabNavigator()

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#f8f9fa' },
      }}
    >
      <Stack.Screen name="Auth" component={AuthScreen} />
    </Stack.Navigator>
  )
}

function AppointmentStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#6366f1',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="AppointmentList"
        component={AppointmentListScreen}
        options={{ title: 'Appointments' }}
      />
      <Stack.Screen
        name="CreateAppointment"
        component={CreateAppointmentScreen}
        options={{ title: 'New Appointment' }}
      />
      <Stack.Screen
        name="EditAppointment"
        component={EditAppointmentScreen}
        options={{ title: 'Edit Appointment' }}
      />
    </Stack.Navigator>
  )
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline'
              break
            case 'Appointments':
              iconName = focused ? 'calendar' : 'calendar-outline'
              break
            case 'Calendar':
              iconName = focused ? 'grid' : 'grid-outline'
              break
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline'
              break
            default:
              iconName = 'home-outline'
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: Platform.OS === 'ios' ? 20 : 5,
          height: Platform.OS === 'ios' ? 90 : 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Appointments" component={AppointmentStack} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  )
}

function AppNavigator() {
  const { user, loading } = useAuth()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    async function prepare() {
      try {
        // Set up notification handlers
        setupNotificationHandlers()

        // Register for push notifications
        if (user) {
          await registerForPushNotificationsAsync()
        }

        // Load any cached data
        // await loadCachedData()
      } catch (e) {
        console.warn('Error during app preparation:', e)
      } finally {
        setIsReady(true)
        await SplashScreen.hideAsync()
      }
    }

    if (!loading) {
      prepare()
    }
  }, [loading, user])

  if (!isReady || loading) {
    return null // Show splash screen
  }

  return <NavigationContainer>{user ? <MainTabs /> : <AuthStack />}</NavigationContainer>
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
        <StatusBar style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  )
}
