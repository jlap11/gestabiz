import React, { useEffect, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as Linking from 'expo-linking'
import { AuthProvider, useAuth } from '../lib/auth'
import { NotificationProvider } from '../lib/notifications'
import { supabase } from '../../src/lib/supabase'
import LoadingScreen from '../components/LoadingScreen'

// QueryClient con misma configuración que web
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#3B82F6',
    primaryContainer: '#EBF4FF',
    secondary: '#64748B',
    secondaryContainer: '#F1F5F9',
    surface: '#FFFFFF',
    background: '#F8FAFC',
    error: '#EF4444',
    onPrimary: '#FFFFFF',
    onSecondary: '#1E293B',
    onSurface: '#1E293B',
    onBackground: '#1E293B',
  },
}

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#60A5FA',
    primaryContainer: '#1E3A8A',
    secondary: '#94A3B8',
    secondaryContainer: '#334155',
    surface: '#0F172A',
    background: '#020617',
    error: '#F87171',
    onPrimary: '#1E293B',
    onSecondary: '#F8FAFC',
    onSurface: '#F8FAFC',
    onBackground: '#F8FAFC',
  },
}

// Layout interno que usa el contexto de auth
function RootLayoutNav() {
  const { user, loading } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    const inAuthGroup = segments[0] === '(auth)'

    if (!user && !inAuthGroup) {
      // Usuario no autenticado → redirigir a login
      router.replace('/(auth)/login')
    } else if (user && inAuthGroup) {
      // Usuario autenticado en pantalla de auth → redirigir a tabs
      router.replace('/(tabs)/client')
    }
  }, [user, segments, loading])

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: lightTheme.colors.background,
        },
      }}
    >
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  )
}

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    // Initialize app
    const initializeApp = async () => {
      try {
        // Check if user is already logged in
        const {
          data: { session },
        } = await supabase.auth.getSession()

        // Set up auth state listener
        supabase.auth.onAuthStateChange((event, session) => {
          console.log('Auth state changed:', event, session?.user?.email)
        })

        setIsLoading(false)
      } catch (error) {
        console.error('Error initializing app:', error)
        setIsLoading(false)
      }
    }

    initializeApp()
  }, [])

  if (isLoading) {
    return <LoadingScreen />
  }

  const theme = isDarkMode ? darkTheme : lightTheme

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={theme}>
            <AuthProvider>
              <NotificationProvider>
                <StatusBar style={isDarkMode ? 'light' : 'dark'} />
                <RootLayoutNav />
              </NotificationProvider>
            </AuthProvider>
          </PaperProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
