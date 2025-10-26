import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuthSimple } from '../../src/hooks/useAuthSimple'
import * as SecureStore from 'expo-secure-store'
import { registerForPushNotifications, savePushToken, removePushToken } from './push-notifications'
import type { User } from '../../src/types/types'
import type { Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

// Create Auth Context
const AuthContext = createContext<AuthState | null>(null)

// Auth Provider Component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Reutilizar useAuthSimple del código web (⚠️ singleton pattern)
  const authState = useAuthSimple()
  const [isInitialized, setIsInitialized] = useState(false)
  const [pushToken, setPushToken] = useState<string | null>(null)

  // Persistir sesión en SecureStore al cambiar
  useEffect(() => {
    const persistSession = async () => {
      if (authState.session) {
        try {
          await SecureStore.setItemAsync('session', JSON.stringify(authState.session))
          console.log('Session persisted in SecureStore')
        } catch (error) {
          console.error('Error persisting session:', error)
        }
      } else {
        // Eliminar sesión si user es null
        try {
          await SecureStore.deleteItemAsync('session')
          console.log('Session cleared from SecureStore')
        } catch (error) {
          console.error('Error clearing session:', error)
        }
      }
    }

    if (isInitialized) {
      persistSession()
    }
  }, [authState.session, isInitialized])

  // Registrar push notifications cuando usuario inicia sesión
  useEffect(() => {
    const setupPushNotifications = async () => {
      if (authState.user && !pushToken) {
        // Registrar para push notifications
        const token = await registerForPushNotifications()
        
        if (token) {
          setPushToken(token)
          // Guardar token en Supabase
          await savePushToken(authState.user.id, token)
        }
      } else if (!authState.user && pushToken) {
        // Usuario hizo logout, eliminar token
        await removePushToken(pushToken)
        setPushToken(null)
      }
    }

    if (isInitialized) {
      setupPushNotifications()
    }
  }, [authState.user, isInitialized, pushToken])

  // Inicializar al montar
  useEffect(() => {
    setIsInitialized(true)
  }, [])

  return <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>
}

// Hook para consumir Auth Context (USAR en componentes)
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

