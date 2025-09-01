import React, { useEffect, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { AuthProvider } from '../lib/auth'
import { NotificationProvider } from '../lib/notifications'
import { supabase } from '../lib/supabase'
import LoadingScreen from '../components/LoadingScreen'

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

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    // Initialize app
    const initializeApp = async () => {
      try {
        // Check if user is already logged in
        const { data: { session } } = await supabase.auth.getSession()
        
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
        <PaperProvider theme={theme}>
          <AuthProvider>
            <NotificationProvider>
              <StatusBar style={isDarkMode ? 'light' : 'dark'} />
              <Stack
                screenOptions={{
                  headerStyle: {
                    backgroundColor: theme.colors.surface,
                  },
                  headerTintColor: theme.colors.onSurface,
                  headerTitleStyle: {
                    fontWeight: '600',
                  },
                  contentStyle: {
                    backgroundColor: theme.colors.background,
                  },
                }}
              >
                <Stack.Screen 
                  name="(auth)" 
                  options={{ headerShown: false }} 
                />
                <Stack.Screen 
                  name="(tabs)" 
                  options={{ headerShown: false }} 
                />
                <Stack.Screen 
                  name="appointment/[id]" 
                  options={{ 
                    title: 'Detalles de Cita',
                    presentation: 'modal' 
                  }} 
                />
                <Stack.Screen 
                  name="client/[id]" 
                  options={{ 
                    title: 'Detalles del Cliente',
                    presentation: 'modal' 
                  }} 
                />
              </Stack>
            </NotificationProvider>
          </AuthProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})