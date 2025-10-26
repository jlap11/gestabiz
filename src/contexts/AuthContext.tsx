import React from 'react'
import { useAuthSimple } from '@/hooks/useAuthSimple'

// Create Auth Context
const AuthContext = React.createContext<ReturnType<typeof useAuthSimple> | null>(null)

// Auth Context Provider Component
export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const authState = useAuthSimple()
  return <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>
}

// Hook to use Auth Context
export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
