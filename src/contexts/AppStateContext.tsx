/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useReducer, useMemo } from 'react'
import { toast } from 'sonner'

interface AppState {
  isLoading: boolean
  error: string | null
  loadingStates: Record<string, boolean>
}

type AppAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_LOADING_STATE'; payload: { key: string; loading: boolean } }
  | { type: 'CLEAR_LOADING_STATE'; payload: string }
  | { type: 'CLEAR_ALL_LOADING' }
  | { type: 'CLEAR_ERROR' }

interface AppContextType extends AppState {
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  setLoadingState: (key: string, loading: boolean) => void
  clearLoadingState: (key: string) => void
  clearAllLoading: () => void
  isLoadingState: (key: string) => boolean
  showErrorToast: (error: string) => void
  showSuccessToast: (message: string) => void
  showInfoToast: (message: string) => void
}

const initialState: AppState = {
  isLoading: false,
  error: null,
  loadingStates: {}
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    case 'SET_LOADING_STATE':
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          [action.payload.key]: action.payload.loading
        }
      }
    case 'CLEAR_LOADING_STATE': {
      const { [action.payload]: _removed, ...remaining } = state.loadingStates
      return { ...state, loadingStates: remaining }
    }
    case 'CLEAR_ALL_LOADING':
      return { ...state, isLoading: false, loadingStates: {} }
    default:
      return state
  }
}

const AppStateContext = createContext<AppContextType | undefined>(undefined)

export function AppStateProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  const contextValue = useMemo(() => ({
    ...state,
    setLoading: (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }),
    setError: (error: string | null) => dispatch({ type: 'SET_ERROR', payload: error }),
    clearError: () => dispatch({ type: 'CLEAR_ERROR' }),
    setLoadingState: (key: string, loading: boolean) => 
      dispatch({ type: 'SET_LOADING_STATE', payload: { key, loading } }),
    clearLoadingState: (key: string) => 
      dispatch({ type: 'CLEAR_LOADING_STATE', payload: key }),
    clearAllLoading: () => dispatch({ type: 'CLEAR_ALL_LOADING' }),
    isLoadingState: (key: string) => state.loadingStates[key] || false,
    showErrorToast: (error: string) => toast.error(error),
    showSuccessToast: (message: string) => toast.success(message),
    showInfoToast: (message: string) => toast.info(message)
  }), [state])

  return (
    <AppStateContext.Provider value={contextValue}>
      {children}
    </AppStateContext.Provider>
  )
}

export function useAppState() {
  const context = useContext(AppStateContext)
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider')
  }
  return context
}

// Hook for handling async operations with loading states
export function useAsyncOperation() {
  const { setLoadingState, clearLoadingState, showErrorToast, showSuccessToast } = useAppState()

  const executeAsync = async <T,>(
    operation: () => Promise<T>,
    loadingKey: string,
    options?: {
      successMessage?: string
      errorMessage?: string
      onSuccess?: (result: T) => void
      onError?: (error: Error) => void
    }
  ): Promise<T | null> => {
    try {
      setLoadingState(loadingKey, true)
      const result = await operation()
      
      if (options?.successMessage) {
        showSuccessToast(options.successMessage)
      }
      
      options?.onSuccess?.(result)
      return result
    } catch (error) {
      const errorMessage = options?.errorMessage || 
        (error instanceof Error ? error.message : 'Error desconocido')
      
      showErrorToast(errorMessage)
      options?.onError?.(error instanceof Error ? error : new Error(String(error)))
      return null
    } finally {
      clearLoadingState(loadingKey)
    }
  }

  return { executeAsync }
}